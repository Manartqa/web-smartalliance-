# Deployment — on-premise server

Moving **www.smartalliance.co.th** from the Azure VM ([DEPLOYMENT.md](DEPLOYMENT.md))
to an on-premise Ubuntu server, behind FortiGate and the company's central
nginx host. Same Docker image, same runtime env file; the server and the
TLS/proxy layer are what change.

**Status:** prepared, not deployed. Nothing in this document has been run
against any server. DNS still points at Azure.

```
internet ──▶ FortiGate ──────────────▶ central nginx ─────────────▶ websmart 172.22.22.201:3000
             public IP                  TLS (certificate here)        container smartalliance-web
             NAT 80/443, no TLS         :80 → 301 https               node server.js
                                        host-based routing
```

| | |
|---|---|
| App server | `websmart` — Ubuntu Server 26.04.1 LTS, `172.22.22.201`, SSH `smart` |
| Docker | Engine 29.9.2, Compose 5.6.1 |
| Deploy path | `/opt/docker/smartalliance` (`compose.yaml` + `.env.production`) |
| Container | `smartalliance-web`, published on `172.22.22.201:3000` |
| Central nginx | `<nginx-ip>` — TLS, port 80 redirect, routing by host name. Site file: [scripts/nginx/smartalliance.conf](scripts/nginx/smartalliance.conf) |
| FortiGate | Public IP; forwards 80 and 443 to the central nginx |

No nginx is installed on `websmart` itself.

---

## 1. How it runs on Azure today

```
internet ──▶ nginx :80/:443 on the VM ──▶ 127.0.0.1:3000 ──▶ container: node server.js
             TLS (Let's Encrypt, certbot)
             :80 → 301 https
```

- Image built on a Windows workstation by `scripts/deploy.ps1`: `npm test`,
  then `docker build` with `NEXT_PUBLIC_SITE_URL=https://www.smartalliance.co.th`
  (and `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` when given), exported to
  `smartalliance-web.tar`.
- Tarball copied to the VM, `docker load`, container started with
  `docker run --restart unless-stopped -p 3000:3000 --env-file ~/production.env`.
  No Compose on the VM.
- nginx terminates TLS, redirects port 80 to https, forwards `Host`, and
  **overwrites** `X-Forwarded-For` (the rate limiter depends on that).
- DNS: `smartalliance.co.th` A → `4.194.62.222`; `www` CNAME → the apex.

The new layout keeps the same shape — nginx in front of the container — with
nginx moved to the central host and FortiGate added in front of it.

Application facts that carry over unchanged:

| | |
|---|---|
| Next.js | 16.3.0, `output: "standalone"`, `node server.js` |
| Base image | `node:22-slim` (glibc, for `sharp`) |
| Listens on | `0.0.0.0:3000` — `HOSTNAME=0.0.0.0`, `PORT=3000` in the Dockerfile |
| Runs as | `node` user, not root |
| Health check | `GET http://127.0.0.1:3000/en` every 30 s, inside the container |
| Canonical host | `https://www.smartalliance.co.th` — baked in at build time |
| Bare domain | `smartalliance.co.th/*` → **308** to `https://www.smartalliance.co.th/*`, done by the app (`next.config.ts`), keyed on the `Host` header |
| Outbound calls | `login.microsoftonline.com` + `graph.microsoft.com` (mail, OAuth2) or `smtp.office365.com:587` (if `MAIL_TRANSPORT=smtp`); `www.google.com` (reCAPTCHA verify) — all 443 except SMTP |

## 2. What changes, and what does not

| Item | Azure | On-premise | Change needed |
|---|---|---|---|
| `Dockerfile` | — | — | **None.** Reused as is. |
| Image | `smartalliance-web:latest` from `deploy.ps1` | the same tarball | **None.** The same build serves both. |
| Build | `deploy.ps1` on Windows | `deploy.ps1` on Windows | None. The app server holds no source code and builds nothing. |
| Start | `docker run` | `docker compose up -d` | `compose.yaml` retargeted. |
| Port | `-p 3000:3000` (all interfaces) | `172.22.22.201:3000:3000` | In `compose.yaml`. |
| Runtime env | `/home/azureuser/production.env` | `/opt/docker/smartalliance/.env.production` | Copied, not edited — `TRUST_PROXY` kept off until §6.3 passes. |
| nginx | on the VM, proxies to `127.0.0.1:3000` | central host, proxies to `172.22.22.201:3000` | New site file, same proxy headers as Azure. |
| TLS + :80 redirect | certbot on the VM | central nginx | Certificate on the central host (§3.3). |
| Public IP / NAT | Azure | FortiGate | VIP 80/443 → central nginx (§3.1). |
| Log rotation | uncapped | 10 MB × 5 | In `compose.yaml`. |
| Outbound firewall | Azure allows all | FortiGate policy | Allow the hosts in §1 from `172.22.22.201`. |

`compose.yaml` was not used by the Azure VM, so retargeting it changes nothing
there. Its old `build:` block is gone: it never passed the reCAPTCHA site key,
and on a server without source it would only demand `NEXT_PUBLIC_SITE_URL` for
no purpose. `.env.example` needs no change — every variable it lists still
applies.

---

## 3. Proxy chain

The app was checked locally against what nginx will send it (production build,
`HOSTNAME=0.0.0.0`, plain HTTP in):

| Request | Result |
|---|---|
| `Host: www…`, `GET /` | `307 Location: /en` — **relative**, so the browser stays on https |
| `Host: smartalliance.co.th`, `GET /th/about` | `308 Location: https://www.smartalliance.co.th/th/about` |
| `Host: www…`, `GET /contact-us` | `308 Location: /th/contact` |
| `Host: www…`, `GET /en` | `200`, `Strict-Transport-Security: max-age=31536000; includeSubDomains` |
| canonical, `sitemap.xml` | `https://www.smartalliance.co.th/…` |
| `/_next/static/*.css` | `200` |

So the app needs nothing beyond what the Azure nginx already gave it: `Host`
unchanged, `X-Forwarded-For` overwritten.

### 3.1 FortiGate

- VIP (static NAT / port forward) for **TCP 80 and 443** on the public IP to
  `<nginx-ip>` 80 and 443. **No SSL offload, no HTTP rewriting** — TLS ends on
  nginx, so FortiGate passes the bytes through.
- **No source NAT** on the inbound policy. nginx must see each visitor's real
  address as `$remote_addr`; with SNAT, every visitor arrives as FortiGate's
  inside address and the per-visitor rate limit collapses into one shared
  bucket. §6.3 checks this.
- Port 80 must reach nginx too: it redirects to https and answers Let's
  Encrypt renewals.
- Outbound from `172.22.22.201`: 443 to `login.microsoftonline.com`,
  `graph.microsoft.com`, `www.google.com` (plus `smtp.office365.com:587` if
  `MAIL_TRANSPORT=smtp`), and DNS. A blocked call does not break page
  rendering — it fails the contact form only, and the container log names the
  call that failed.
- From `<nginx-ip>` to `172.22.22.201:3000` must be allowed if the two are in
  different segments.

### 3.2 Central nginx

Site file: [scripts/nginx/smartalliance.conf](scripts/nginx/smartalliance.conf).
It is the Azure VM's proxy block with the upstream changed:

| | |
|---|---|
| `server_name` | `www.smartalliance.co.th smartalliance.co.th` — both, so the app can redirect the bare one |
| :80 | `/.well-known/acme-challenge/` from `/var/www/letsencrypt`, everything else `301` to https |
| :443 | TLS, `proxy_pass http://172.22.22.201:3000` |
| `Host` | `$host` — unchanged |
| `X-Forwarded-For` | `$remote_addr` — **overwritten**, never `$proxy_add_x_forwarded_for` |
| `X-Real-IP`, `X-Forwarded-Proto` | `$remote_addr`, `$scheme` |
| `proxy_buffering` | off (Next streams HTML) |
| `client_max_body_size` | 2m |

When `aceparts.co.th` arrives it becomes another site file on the same host,
proxying to `172.22.22.201:3001` — out of scope here.

### 3.3 Certificate

On the central nginx host, covering **both names**. The site file points at
Let's Encrypt paths; change the two `ssl_certificate*` lines if a purchased
certificate is used instead.

Let's Encrypt over HTTP-01 cannot issue until DNS points at FortiGate, which is
not part of this step. To test end to end before cutover (§6.2), use either:

- a purchased certificate, or
- Let's Encrypt with a DNS-01 challenge, which needs a TXT record — a DNS
  change, so it waits for approval like the cutover itself:

  ```bash
  sudo certbot certonly --manual --preferred-challenges dns -d www.smartalliance.co.th -d smartalliance.co.th
  ```

  Manual DNS-01 does not renew by itself. After cutover, re-issue once over
  HTTP-01 so the timer can renew it:

  ```bash
  sudo certbot certonly --webroot -w /var/www/letsencrypt -d www.smartalliance.co.th -d smartalliance.co.th --force-renewal
  ```

The Azure VM's certificate stays where it is.

---

## 4. One-time preparation

### 4.1 App server (`websmart`)

As `smart`. Every `docker` command is shown with `sudo`; drop it if `smart` is
in the `docker` group (`id -nG`).

Architecture — the image is built `amd64` on the Windows workstation:

```bash
dpkg --print-architecture
```

Must print `amd64`.

Docker works and starts at boot:

```bash
sudo docker version --format '{{.Server.Version}}' && sudo docker compose version && systemctl is-enabled docker
```

The LAN address exists on the host (the port binding fails without it):

```bash
ip -4 -br addr | grep 172.22.22.201
```

The deploy directory:

```bash
sudo install -d -o smart -g smart -m 750 /opt/docker/smartalliance
```

Port 3000 is free:

```bash
sudo ss -ltnp | grep ':3000 ' || echo free
```

Outbound reachability (§3.1) — each should print an HTTP status, not time out:

```bash
for u in https://login.microsoftonline.com https://graph.microsoft.com https://www.google.com/recaptcha/api/siteverify; do curl -s -o /dev/null -m 10 -w "%{http_code} $u\n" "$u"; done
```

### 4.2 Central nginx host

Prepared now, enabled in §5.5 after the container is up. Nothing on this host
should be reloaded with a config that fails `nginx -t` — other sites share it.

```bash
nginx -v
```

```bash
ls /etc/nginx/sites-available /etc/nginx/conf.d 2>/dev/null
```

Shows which layout the host uses, and whether a `smartalliance` site already
exists. If one does, compare before replacing it.

```bash
sudo install -d -m 755 /var/www/letsencrypt
```

---

## 5. First deploy

### 5.1 Build the image (Windows workstation)

Docker Desktop running, repository root, on the commit to ship — the same
command as for Azure:

```powershell
.\scripts\deploy.ps1
```

It needs `-RecaptchaSiteKey` (or `$env:NEXT_PUBLIC_RECAPTCHA_SITE_KEY`) exactly
as the Azure build did; without it the form ships without reCAPTCHA and every
enquiry is rejected if `RECAPTCHA_SECRET_KEY` is set.

To deploy **exactly** the image Azure runs instead, export it from the VM
(read-only on Azure):

```bash
ssh azureuser@4.194.62.222 'sudo docker save smartalliance-web:latest' > smartalliance-web.tar
```

Run that from Git Bash, not PowerShell 5.1 — PowerShell re-encodes binary
output piped from a native command and corrupts the tarball.

### 5.2 Copy the image and the env file (Windows workstation)

```powershell
scp .\smartalliance-web.tar smart@172.22.22.201:/opt/docker/smartalliance/
```

```powershell
scp .\compose.yaml smart@172.22.22.201:/opt/docker/smartalliance/
```

The runtime env file, Azure → new server, through the workstation without
leaving a copy on it (`-3`):

```powershell
scp -3 azureuser@4.194.62.222:production.env smart@172.22.22.201:/opt/docker/smartalliance/.env.production
```

If `-3` fails on authentication, copy it in two hops and delete the local copy
straight after. Never commit it, paste it into chat, or open it on a shared
screen.

### 5.3 Check the env file (on `websmart`)

```bash
chmod 600 /opt/docker/smartalliance/.env.production
```

Names only — values never printed:

```bash
sed -nE 's/^([A-Za-z_][A-Za-z0-9_]*)=.*/\1/p' /opt/docker/smartalliance/.env.production | sort
```

Compare with what the Azure container actually runs with (read-only on
Azure, names only):

```bash
ssh azureuser@4.194.62.222 "sudo docker inspect smartalliance-web --format '{{range .Config.Env}}{{println .}}{{end}}'" | sed -nE 's/^([A-Za-z_][A-Za-z0-9_]*)=.*/\1/p' | sort
```

Every name in the Azure list should be in the file, except the ones the image
sets itself: `PATH`, `NODE_ENV`, `NODE_VERSION`, `YARN_VERSION`, `PORT`,
`HOSTNAME`, `NEXT_TELEMETRY_DISABLED`, and the `NEXT_PUBLIC_*` build values.
In particular, if the Azure container has **`CONFIG_MASTER_KEY`** and the file
does not, it was passed separately on Azure (it decrypts
`MS_CLIENT_SECRET_ENC`) — it must reach this container too, and the mail will
fail without it.

`TRUST_PROXY`: comment it out until §6.3 confirms nginx sees real visitor
addresses.

```bash
sed -i -E 's/^TRUST_PROXY=/# TRUST_PROXY=/' /opt/docker/smartalliance/.env.production
```

### 5.4 Load and start (on `websmart`)

```bash
cd /opt/docker/smartalliance
```

```bash
sudo docker load -i smartalliance-web.tar && rm smartalliance-web.tar
```

Should print `Loaded image: smartalliance-web:latest`.

```bash
sudo docker compose config --quiet && sudo docker compose up -d
```

After ~30 seconds:

```bash
sudo docker compose ps
```

`smartalliance-web` should be `Up … (healthy)`, with ports
`172.22.22.201:3000->3000/tcp`.

### 5.5 Enable the site (central nginx host)

Needs the certificate from §3.3 in place — `nginx -t` fails on a missing
certificate file.

From the workstation:

```powershell
scp .\scripts\nginx\smartalliance.conf <user>@<nginx-ip>:/tmp/
```

On the nginx host (`sites-available` layout; for `conf.d`, move it to
`/etc/nginx/conf.d/` and skip the symlink):

```bash
sudo mv /tmp/smartalliance.conf /etc/nginx/sites-available/smartalliance.conf && sudo ln -s /etc/nginx/sites-available/smartalliance.conf /etc/nginx/sites-enabled/
```

```bash
sudo nginx -t && sudo systemctl reload nginx
```

`reload`, not `restart`: the other sites keep serving throughout. If `nginx -t`
fails, nothing was applied — remove the symlink and fix the file.

The host can reach the app:

```bash
curl -s -o /dev/null -w '%{http_code}\n' -H 'Host: www.smartalliance.co.th' http://172.22.22.201:3000/en
```

`200`.

---

## 6. Verify

### 6.1 On the app server

```bash
curl -s -o /dev/null -w '%{http_code}\n' -H 'Host: www.smartalliance.co.th' http://172.22.22.201:3000/en
```

`200`.

```bash
curl -sI -H 'Host: smartalliance.co.th' http://172.22.22.201:3000/th | grep -iE '^(HTTP|location)'
```

`308` to `https://www.smartalliance.co.th/th`.

```bash
curl -s -H 'Host: www.smartalliance.co.th' http://172.22.22.201:3000/sitemap.xml | grep -m2 '<loc>'
```

Every `<loc>` starts with `https://www.smartalliance.co.th`.

```bash
sudo docker compose logs --tail=50
```

No errors. `Ready in …` near the top.

```bash
sudo docker inspect smartalliance-web --format '{{.State.Health.Status}} restart={{.HostConfig.RestartPolicy.Name}}'
```

`healthy restart=unless-stopped`.

### 6.2 Through FortiGate and nginx, before DNS changes

From a machine **outside** the office network, pin the names to the FortiGate
public IP for one command — DNS stays untouched:

```bash
curl -sI --resolve www.smartalliance.co.th:443:<public-ip> https://www.smartalliance.co.th/en | grep -iE '^(HTTP|strict)'
```

`200` and the HSTS header, with a certificate curl accepts (no `-k`).

```bash
curl -sI --resolve smartalliance.co.th:443:<public-ip> https://smartalliance.co.th/en | grep -iE '^(HTTP|location)'
```

`308` to `https://www.smartalliance.co.th/en` — proves `Host` arrives intact.

```bash
curl -sI --resolve www.smartalliance.co.th:80:<public-ip> http://www.smartalliance.co.th/en | grep -iE '^(HTTP|location)'
```

`301` to `https://www.smartalliance.co.th/en`.

For a browser test, add both names to the client's `hosts` file pointing at the
public IP, browse the site and **submit the contact form once** — the only way
to prove mail, reCAPTCHA and the outbound policy together. Remove the `hosts`
lines afterwards.

### 6.3 Real visitor addresses — then `TRUST_PROXY`

The site file already overwrites `X-Forwarded-For` with `$remote_addr`, so the
open question is only what `$remote_addr` is: the visitor, or FortiGate.

Note your public IP on the outside test machine (`curl -s https://ifconfig.me`),
make a request as in §6.2, and on the nginx host:

```bash
sudo tail -n 5 /var/log/nginx/access.log
```

| First field of the line | Meaning | `TRUST_PROXY` |
|---|---|---|
| your public IP | FortiGate preserves the source | Set `TRUST_PROXY=1` |
| a private address (FortiGate's inside interface) | FortiGate source-NATs | Leave unset; remove SNAT from the policy, then re-check |

To turn it on (on `websmart`):

```bash
sed -i -E 's/^# TRUST_PROXY=.*/TRUST_PROXY=1/' /opt/docker/smartalliance/.env.production && sudo docker compose up -d --force-recreate
```

Until then every visitor shares one contact-form budget (5 per 10 min) — coarse,
but it holds. The rest of the site is unaffected.

---

## 7. Cutover — later, not part of this step

Listed so the rollback below makes sense. Do none of it until told to.

1. A day ahead, lower the TTL on the `smartalliance.co.th` A record (e.g. 300 s).
2. Change that A record to the FortiGate public IP. `www` follows, being a CNAME.
3. Repeat §6.2 without `--resolve`.
4. If the certificate was issued with manual DNS-01, re-issue it over HTTP-01
   (§3.3) so it renews by itself.
5. Leave the Azure VM running, unchanged, until the new server has run cleanly
   for the agreed period.

## 8. Rollback to Azure

The Azure VM is never stopped or changed by this migration, so rollback is DNS
only:

1. Set the `smartalliance.co.th` A record back to `4.194.62.222`.
2. Wait out the TTL. Visitors land on Azure's nginx, which still holds its
   certificate.
3. Optionally take the new path out of service so nothing serves from two
   places — on the central nginx host:

   ```bash
   sudo rm /etc/nginx/sites-enabled/smartalliance.conf && sudo nginx -t && sudo systemctl reload nginx
   ```

   and on `websmart`:

   ```bash
   cd /opt/docker/smartalliance && sudo docker compose stop
   ```

**The rollback window is limited.** certbot on Azure renews over HTTP-01, which
fails once DNS points elsewhere. The current certificate keeps working until it
expires — check the date before cutover (read-only):

```bash
ssh azureuser@4.194.62.222 'sudo certbot certificates' | grep -E 'Domains|Expiry'
```

Past that date, rolling back means re-issuing the Azure certificate first.

Rolling back **a release** on the new server (not the whole migration) — keep
the previous image before loading a new one, as on Azure:

```bash
sudo docker tag smartalliance-web:latest smartalliance-web:previous
```

and to return to it:

```bash
sudo docker tag smartalliance-web:previous smartalliance-web:latest && sudo docker compose up -d --force-recreate
```

---

## 9. Everyday commands

On `websmart`, from `/opt/docker/smartalliance`.

| | |
|---|---|
| Build | `.\scripts\deploy.ps1` on the Windows workstation (§5.1) |
| Ship a new release | `scp .\smartalliance-web.tar smart@172.22.22.201:/opt/docker/smartalliance/`, then: |
| | `sudo docker tag smartalliance-web:latest smartalliance-web:previous` |
| | `sudo docker load -i smartalliance-web.tar && rm smartalliance-web.tar` |
| | `sudo docker compose up -d --force-recreate` |
| Restart (same container, same env) | `sudo docker compose restart` |
| Apply an `.env.production` change | `sudo docker compose up -d --force-recreate` — `restart` does not re-read the file |
| Stop / start | `sudo docker compose stop` / `sudo docker compose start` |
| Logs | `sudo docker compose logs -f --tail=100` |
| Status | `sudo docker compose ps` |
| Health detail | `sudo docker inspect smartalliance-web --format '{{json .State.Health}}'` |
| Resource use | `sudo docker stats --no-stream smartalliance-web` |
| Clean old images | `sudo docker image prune -f` |

On the central nginx host:

| | |
|---|---|
| Test and apply a config change | `sudo nginx -t && sudo systemctl reload nginx` |
| Access / error log | `sudo tail -f /var/log/nginx/access.log` / `error.log` |
| Certificate expiry | `sudo certbot certificates` |
| Renewal dry run | `sudo certbot renew --dry-run` |

A release swap returns `502` from nginx for a few seconds while the new
container starts.

## 10. Known caveats

- **Port 3000 is reachable from the whole LAN**, in plain HTTP, and Docker's
  iptables rules bypass ufw. With `TRUST_PROXY=1` the app believes any
  `X-Forwarded-For` it receives, so a LAN host talking to port 3000 directly
  can pick its own rate-limit key (the 60/hour site-wide ceiling still holds).
  To close it, allow only the nginx host in the `DOCKER-USER` chain on
  `websmart`:

  ```bash
  sudo iptables -I DOCKER-USER -p tcp -m conntrack --ctorigdstport 3000 ! -s <nginx-ip> -j DROP
  ```

  Not persistent across reboots on its own — save it with the host's usual
  firewall tooling. Requests from `websmart` itself do not pass this chain, so
  the §6.1 checks keep working.
- **`unhealthy` does not restart the container.** The Dockerfile comment says
  Compose restarts on a failed health check; plain Docker does not —
  `restart: unless-stopped` only reacts to the process exiting. A wedged but
  running process shows `unhealthy` in `docker compose ps` and stays up.
- **The port binding needs `172.22.22.201` to exist when Docker starts.** On a
  static netplan address that holds. If the container is missing after a
  reboot, check `ip addr` first, then `sudo docker compose up -d`.
- **One container only.** The rate limiter lives in process memory; a second
  replica doubles the limits.
- `scripts/vm-provision.sh` and `scripts/azure-setup.sh` are for the Azure
  setup and are not used here — `vm-provision.sh` installs nginx, which
  `websmart` must not have.
