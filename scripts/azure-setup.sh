#!/usr/bin/env bash
#
# Azure-side networking for the VM deployment.
# Run it once, from Azure Cloud Shell (shell.azure.com) or anywhere with the
# Azure CLI signed in:
#
#   bash scripts/azure-setup.sh
#
# It assumes the VM already exists. It is idempotent: every step checks before
# it changes anything, so re-running it is a no-op and an interrupted run can
# simply be resumed.
#
# WHAT IT DOES
#   * pins the public IP to Static, so the DNS record cannot go stale
#   * opens 80 and 443
#   * restricts SSH to the addresses you name, instead of the whole internet
#
# WHAT IT DOES NOT DO
#   It never handles a credential, and it will not narrow an existing wide-open
#   SSH rule unless you name the replacement — a wrong value there locks you out
#   of the VM.

set -euo pipefail

RG="${RG:-rg-company-web-prd}"
VM="${VM:-vm-company-web-prd}"
NSG="${NSG:-vm-company-web-prd-nsg}"
PIP="${PIP:-pip-company-web-prd}"
# Comma-separated addresses or CIDRs allowed to reach SSH, e.g.
#   SSH_ALLOWED_FROM="203.0.113.10,198.51.100.0/24"
# Leave empty and the script will tell you what is currently allowed and stop
# short of locking you out.
SSH_ALLOWED_FROM="${SSH_ALLOWED_FROM:-}"

bold() { printf '\033[1m%s\033[0m\n' "$*"; }
step() { printf '\n\033[1;36m▶ %s\033[0m\n' "$*"; }
ok()   { printf '  \033[32m✓\033[0m %s\n' "$*"; }
skip() { printf '  \033[33m•\033[0m %s\n' "$*"; }
warn() { printf '  \033[33m!\033[0m %s\n' "$*"; }

command -v az >/dev/null || { echo "Azure CLI not found. Use Azure Cloud Shell."; exit 1; }
az account show >/dev/null 2>&1 || { echo "Not signed in. Run: az login"; exit 1; }

SUB_NAME="$(az account show --query name -o tsv)"

az vm show --name "$VM" --resource-group "$RG" >/dev/null 2>&1 || {
  echo "VM '$VM' not found in resource group '$RG'."
  echo "Override with: RG=... VM=... bash scripts/azure-setup.sh"
  exit 1
}

bold "Subscription: ${SUB_NAME}"
echo  "  VM ${VM} in ${RG}"

# ---------------------------------------------------------------------------
step "1. Public IP — must be Static"
# ---------------------------------------------------------------------------
# A Dynamic IP is released whenever the VM is deallocated and comes back
# different. The DNS A record then points at somebody else's VM, and certbot
# cannot renew the certificate.
ALLOC="$(az network public-ip show --name "$PIP" --resource-group "$RG" \
  --query publicIPAllocationMethod -o tsv 2>/dev/null || echo "MISSING")"

if [[ "$ALLOC" == "MISSING" ]]; then
  warn "public IP '$PIP' not found — check the name and re-run with PIP=..."
elif [[ "$ALLOC" == "Static" ]]; then
  skip "already Static"
else
  az network public-ip update --name "$PIP" --resource-group "$RG" \
    --allocation-method Static --output none
  ok "changed from ${ALLOC} to Static"
fi

VM_IP="$(az network public-ip show --name "$PIP" --resource-group "$RG" \
  --query ipAddress -o tsv 2>/dev/null || echo "")"
[[ -n "$VM_IP" ]] && ok "public IP is ${VM_IP}"

# ---------------------------------------------------------------------------
step "2. Network security group"
# ---------------------------------------------------------------------------
rule_exists() {
  az network nsg rule show --nsg-name "$NSG" --resource-group "$RG" \
    --name "$1" >/dev/null 2>&1
}

for spec in "allow-http:80:100" "allow-https:443:110"; do
  IFS=: read -r name port prio <<<"$spec"
  if rule_exists "$name"; then
    skip "$name already present"
  else
    az network nsg rule create --nsg-name "$NSG" --resource-group "$RG" \
      --name "$name" --priority "$prio" --access Allow --protocol Tcp \
      --direction Inbound --source-address-prefixes '*' \
      --destination-port-ranges "$port" --output none
    ok "opened port $port ($name)"
  fi
done

# SSH. Left wide open, this port is found by scanners within hours.
SSH_RULE="$(az network nsg rule list --nsg-name "$NSG" --resource-group "$RG" \
  --query "[?destinationPortRange=='22'] | [0].name" -o tsv 2>/dev/null || true)"

if [[ -n "$SSH_ALLOWED_FROM" ]]; then
  IFS=',' read -r -a SSH_CIDRS <<<"$SSH_ALLOWED_FROM"
  az network nsg rule create --nsg-name "$NSG" --resource-group "$RG" \
    --name "allow-ssh-admin" --priority 120 --access Allow --protocol Tcp \
    --direction Inbound --source-address-prefixes "${SSH_CIDRS[@]}" \
    --destination-port-ranges 22 --output none 2>/dev/null \
  || az network nsg rule update --nsg-name "$NSG" --resource-group "$RG" \
    --name "allow-ssh-admin" --source-address-prefixes "${SSH_CIDRS[@]}" --output none
  ok "SSH restricted to ${SSH_ALLOWED_FROM}"

  if [[ -n "$SSH_RULE" && "$SSH_RULE" != "allow-ssh-admin" ]]; then
    SSH_SRC="$(az network nsg rule show --nsg-name "$NSG" --resource-group "$RG" \
      --name "$SSH_RULE" --query sourceAddressPrefix -o tsv 2>/dev/null || true)"
    if [[ "$SSH_SRC" == "*" || "$SSH_SRC" == "Internet" || "$SSH_SRC" == "0.0.0.0/0" ]]; then
      warn "rule '$SSH_RULE' still allows SSH from anywhere — remove it once you"
      warn "have confirmed you can still log in:"
      warn "  az network nsg rule delete --nsg-name $NSG --resource-group $RG --name $SSH_RULE"
    fi
  fi
else
  if [[ -n "$SSH_RULE" ]]; then
    SSH_SRC="$(az network nsg rule show --nsg-name "$NSG" --resource-group "$RG" \
      --name "$SSH_RULE" --query sourceAddressPrefix -o tsv 2>/dev/null || true)"
    warn "SSH rule '$SSH_RULE' currently allows: ${SSH_SRC:-unknown}"
    warn "Re-run with SSH_ALLOWED_FROM=\"<your office IP>\" to lock it down."
    warn "Not doing it automatically — a wrong value locks you out of the VM."
  fi
fi

# ---------------------------------------------------------------------------
cat <<EOF

$(bold "Azure networking is ready.")

  Public IP   ${VM_IP:-unknown}   (Static)
  Ports open  80, 443
  SSH         ${SSH_ALLOWED_FROM:-unchanged — see the warnings above}

$(bold "Next, on the VM")

  scp scripts/vm-provision.sh azureuser@${VM_IP:-<vm-ip>}:~
  ssh azureuser@${VM_IP:-<vm-ip>} 'sudo bash vm-provision.sh'

Then follow the steps in DEPLOYMENT.md to build and start the container.

EOF
