#!/usr/bin/env bash
#
# Run ONCE, on the VM itself, as a user with sudo:
#
#   scp scripts/vm-provision.sh azureuser@4.194.62.222:~
#   ssh azureuser@4.194.62.222 'sudo bash vm-provision.sh'
#
# Prepares an Ubuntu VM to run the site as a Docker container behind nginx.
# Idempotent — safe to re-run, and safe to resume if interrupted.
#
# WHAT IT SETS UP
#   docker + compose plugin
#   nginx reverse proxy    reuses the one already installed
#   certbot                when a hostname is given
#
# WHAT IT DOES NOT DO
#   Mail credentials, and the app itself. Docker's `restart: unless-stopped`
#   replaces the systemd unit, and the image carries Node — so no app user, no
#   service file and no host Node install are needed any more.

set -euo pipefail

SITE_DOMAIN="${SITE_DOMAIN:-}"
APP_PORT="${APP_PORT:-3000}"
DEPLOY_USER="${DEPLOY_USER:-${SUDO_USER:-azureuser}}"

step() { printf '\n\033[1;36m▶ %s\033[0m\n' "$*"; }
ok()   { printf '  \033[32m✓\033[0m %s\n' "$*"; }
warn() { printf '  \033[33m!\033[0m %s\n' "$*"; }

[[ $EUID -eq 0 ]] || { echo "Run with sudo."; exit 1; }

if [[ -z "$SITE_DOMAIN" ]]; then
  cat <<'EOF'
No SITE_DOMAIN given — setting up in HTTP-ONLY mode.

The site will answer on this VM's public IP over plain HTTP, which is enough to
prove the container works before DNS exists. No certificate is requested: no CA
issues one for a bare IP address.

  ! Do not leave production like this. The contact form would post names,
    addresses and messages in the clear.

When DNS is ready, re-run with the hostname to add TLS:
  sudo SITE_DOMAIN=www.smartalliance.co.th bash vm-provision.sh

EOF
fi

export DEBIAN_FRONTEND=noninteractive

# ---------------------------------------------------------------------------
step "Docker"
# ---------------------------------------------------------------------------
if command -v docker >/dev/null && docker compose version >/dev/null 2>&1; then
  ok "docker $(docker --version | awk '{print $3}' | tr -d ,) with compose plugin"
else
  apt-get update -qq
  apt-get install -y -qq ca-certificates curl gnupg >/dev/null

  install -m 0755 -d /etc/apt/keyrings
  if [[ ! -f /etc/apt/keyrings/docker.asc ]]; then
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
    chmod a+r /etc/apt/keyrings/docker.asc
  fi

  # Docker's own repository, not Ubuntu's `docker.io`: the compose *plugin*
  # (`docker compose`, not the retired `docker-compose` script) only ships here.
  cat > /etc/apt/sources.list.d/docker.list <<EOF
deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable
EOF

  apt-get update -qq
  apt-get install -y -qq docker-ce docker-ce-cli containerd.io \
    docker-buildx-plugin docker-compose-plugin >/dev/null
  ok "installed docker $(docker --version | awk '{print $3}' | tr -d ,)"
fi

systemctl enable docker >/dev/null 2>&1
systemctl start docker
ok "docker enabled at boot"

# Lets the admin account run docker without sudo. Worth being explicit about:
# this group is root-equivalent — a member can mount the host filesystem into a
# container — so keep its membership to people who already have sudo.
if id -nG "$DEPLOY_USER" 2>/dev/null | grep -qw docker; then
  ok "$DEPLOY_USER already in the docker group"
else
  usermod -aG docker "$DEPLOY_USER"
  ok "$DEPLOY_USER added to the docker group (log out and back in for it to apply)"
fi

# Container logs filling a VM disk is a slow-motion outage. compose.yaml caps
# this service; this covers anything else that ever runs here.
if [[ -f /etc/docker/daemon.json ]]; then
  ok "/etc/docker/daemon.json already present — left untouched"
else
  install -d -m 0755 /etc/docker
  cat > /etc/docker/daemon.json <<'EOF'
{
  "log-driver": "json-file",
  "log-opts": { "max-size": "10m", "max-file": "5" }
}
EOF
  systemctl restart docker
  ok "global container log rotation configured"
fi

# ---------------------------------------------------------------------------
step "Unattended security updates"
# ---------------------------------------------------------------------------
# A public-facing VM that is never patched is the most likely way this box is
# eventually compromised.
apt-get install -y -qq unattended-upgrades >/dev/null
dpkg-reconfigure -f noninteractive unattended-upgrades >/dev/null 2>&1 || true
ok "enabled"

# ---------------------------------------------------------------------------
step "SSH hardening"
# ---------------------------------------------------------------------------
# Opt-in, because getting this wrong locks you out of your own server. Run with
# HARDEN_SSH=1 once you have confirmed you can log in with a key.
#
# It matters: this VM answers on a public IP, and a password-accepting SSH port
# is found and hammered by scanners within hours of being exposed.
if [[ "${HARDEN_SSH:-0}" == "1" ]]; then
  KEYED_USERS=0
  for home in /home/*; do
    [[ -s "$home/.ssh/authorized_keys" ]] && KEYED_USERS=$((KEYED_USERS + 1))
  done

  if [[ $KEYED_USERS -eq 0 ]]; then
    warn "HARDEN_SSH=1 ignored: no account has an authorized_keys entry yet."
    warn "Disabling password login now would lock everyone out."
  else
    cat > /etc/ssh/sshd_config.d/99-hardening.conf <<'EOF'
PasswordAuthentication no
KbdInteractiveAuthentication no
PermitRootLogin no
EOF
    if sshd -t 2>/dev/null; then
      systemctl reload ssh 2>/dev/null || systemctl reload sshd
      ok "password login disabled, root login disabled ($KEYED_USERS keyed account(s))"
      warn "Confirm you can still log in from a SECOND terminal before closing this one."
    else
      rm -f /etc/ssh/sshd_config.d/99-hardening.conf
      warn "sshd rejected the config — reverted, nothing changed"
    fi
  fi
else
  warn "SSH still accepts passwords. Once your key works, re-run with HARDEN_SSH=1"
fi

# ---------------------------------------------------------------------------
step "nginx reverse proxy"
# ---------------------------------------------------------------------------
command -v nginx >/dev/null || { apt-get install -y -qq nginx >/dev/null; ok "installed nginx"; }

if [[ -n "$SITE_DOMAIN" ]]; then SERVER_NAME="$SITE_DOMAIN"; else SERVER_NAME="_"; fi

# ---------------------------------------------------------------------------
# X-Forwarded-For must be OVERWRITTEN, never appended.
#
# `clientKey` in src/lib/rate-limit.ts reads the LEFT-MOST entry. nginx's usual
# `$proxy_add_x_forwarded_for` appends the peer address to whatever the client
# sent — so a visitor sending
#
#     X-Forwarded-For: 1.2.3.4
#
# produces "1.2.3.4, <real ip>", and the app keys its rate limit on the
# attacker's value. A fresh forgery per request is a fresh bucket per request,
# i.e. a limiter that never limits. Overwriting with $remote_addr is what makes
# TRUST_PROXY=1 safe rather than merely convenient.
#
# This matters more with Docker, not less: without the header the container
# would see the bridge gateway address for every visitor alike.
# ---------------------------------------------------------------------------
cat > /etc/nginx/sites-available/smartalliance <<NGINX
server {
	listen 80;
	listen [::]:80;
	server_name ${SERVER_NAME};

	# Next streams HTML; buffering it delays first paint for no gain.
	proxy_buffering off;
	client_max_body_size 2m;

	location / {
		proxy_pass http://127.0.0.1:${APP_PORT};
		proxy_http_version 1.1;
		proxy_set_header Host \$host;
		# Overwrite, not \$proxy_add_x_forwarded_for — see the note above.
		proxy_set_header X-Forwarded-For \$remote_addr;
		proxy_set_header X-Real-IP \$remote_addr;
		proxy_set_header X-Forwarded-Proto \$scheme;
		proxy_read_timeout 30s;
	}
}
NGINX

ln -sfn /etc/nginx/sites-available/smartalliance /etc/nginx/sites-enabled/smartalliance
# The default site also answers on port 80 and would win or clash depending on
# order; the nginx welcome page is not what this VM is for.
rm -f /etc/nginx/sites-enabled/default

if nginx -t >/dev/null 2>&1; then
  systemctl enable nginx >/dev/null 2>&1
  systemctl reload nginx 2>/dev/null || systemctl restart nginx
  ok "nginx proxying ${SERVER_NAME} -> 127.0.0.1:${APP_PORT}"
else
  warn "nginx rejected the config — previous config left in place:"
  nginx -t 2>&1 | sed 's/^/    /'
fi

# ---------------------------------------------------------------------------
step "TLS"
# ---------------------------------------------------------------------------
if [[ -n "$SITE_DOMAIN" ]]; then
  command -v certbot >/dev/null || {
    apt-get install -y -qq certbot python3-certbot-nginx >/dev/null
    ok "installed certbot"
  }
  warn "Not requested automatically — certbot rewrites the nginx config, and"
  warn "needs DNS for ${SITE_DOMAIN} to already resolve here. When it does:"
  warn "  sudo certbot --nginx -d ${SITE_DOMAIN}"
  warn "Renewal is then handled by certbot's own systemd timer."
else
  warn "HTTP only — no domain given, so no certificate is possible."
fi

# ---------------------------------------------------------------------------
cat <<EOF

$(printf '\033[1m%s\033[0m' "VM is ready. Nothing is deployed yet.")

Next, from your own machine:

  rsync -az --delete --exclude node_modules --exclude .next --exclude .git \\
    ./ ${DEPLOY_USER}@4.194.62.222:~/smartalliance/

Then on the VM:

  cd ~/smartalliance
  cp .env.example .env.production          # fill in SMTP_USER, MS_*, CONTACT_MAIL_TO
  echo 'TRUST_PROXY=1' >> .env.production
  echo 'NEXT_PUBLIC_SITE_URL=http://4.194.62.222' > .env
  docker compose up -d --build

Handy:
  docker compose ps
  docker compose logs -f
  docker compose up -d --build             # redeploy after a code change
  sudo journalctl -u nginx -f

EOF
