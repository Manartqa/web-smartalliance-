# Deployment

The site runs as a **Docker container behind nginx** on an Azure VM
(`vm-company-web-prd`, `rg-company-web-prd`, Southeast Asia — `4.194.62.222`),
served at **https://www.smartalliance.co.th**.

Deployment is manual. The image is built on a Windows workstation with
`scripts/deploy.ps1`, copied to the VM as a tarball, loaded, and started with
`docker run`. There is no CI/CD pipeline and no Compose on the VM.

```
internet ──▶ nginx :80/:443 ──▶ 127.0.0.1:3000 ──▶ container: node server.js
             TLS (Let's Encrypt)                    restart: unless-stopped
             :80 → 301 to https
```

nginx must **overwrite** `X-Forwarded-For` rather than append to it. See
[Why the proxy overwrites XFF](#why-the-proxy-overwrites-xff) — it is the
difference between a working rate limiter and one that never limits.

---

## What is on the VM

As found on 2026-09-30.

| | |
|---|---|
| Container | `smartalliance-web`, started with `docker run` — the Compose plugin is not installed |
| Runtime env | `/home/azureuser/production.env` (mode 600), passed with `--env-file` |
| Published port | `-p 3000:3000` — all interfaces. The NSG blocks 3000 from outside. |
| nginx site | `/etc/nginx/sites-available/smartalliance-web`, symlinked from `sites-enabled`. `server_name` lists both `www.smartalliance.co.th` and `smartalliance.co.th`; certbot manages the TLS parts. |
| Certificate | Let's Encrypt, covers both names, renewed by `certbot.timer`. Expiry notices go to admin@smartalliance.co.th. |
| NSG inbound | HTTP 80, HTTPS 443, SSH 22 — all from Any |
| Docker access | `azureuser` is not in the `docker` group, so every `docker` command needs `sudo` |
| DNS | `www` is a CNAME to `smartalliance.co.th`, which has an A record to `4.194.62.222` |
| Unused | `/var/www/company-web` (empty) |

---

## Deploying a change

### 1. Build on Windows

Docker Desktop must be running. From the repository root, on the commit you
intend to ship:

```powershell
.\scripts\deploy.ps1
```

Runs `npm test`, builds the image with
`NEXT_PUBLIC_SITE_URL=https://www.smartalliance.co.th`, and writes
`smartalliance-web.tar` (~102 MB) to the repository root. `-SkipTests` skips the
tests; `-SiteUrl` overrides the URL. When it finishes it prints the commands of
steps 2–5 below.

### 2. Upload

Drag `smartalliance-web.tar` into `/home/azureuser/` with MobaXterm, or:

```powershell
scp .\smartalliance-web.tar azureuser@4.194.62.222:~/
```

### 3. Load the image

On the VM. Tag the running image first so there is something to roll back to:

```bash
sudo docker tag smartalliance-web:latest smartalliance-web:previous
```

```bash
sudo docker load -i ~/smartalliance-web.tar && rm ~/smartalliance-web.tar
```

It should print `Loaded image: smartalliance-web:latest`. The running container
is not affected yet — it keeps the image it was created from.

### 4. Check the runtime env

Worth doing whenever `production.env` may have been edited since the container
was created. Lists the variables that differ between the file and the running
container, names only:

```bash
comm -3 <(grep -E '^[A-Za-z_][A-Za-z0-9_]*=' ~/production.env | sort) <(sudo docker inspect smartalliance-web --format '{{range .Config.Env}}{{println .}}{{end}}' | grep -v '^$' | sort) | sed -E 's/=.*//'
```

Unindented lines come from the file, indented lines from the container. A name
on both sides means the value differs. `PATH`, `NODE_ENV`, `NODE_VERSION`,
`YARN_VERSION`, `PORT`, `HOSTNAME` and `NEXT_TELEMETRY_DISABLED` always appear
indented — the image sets them. The new container gets the file's values, so
make sure those are the ones you want.

### 5. Swap the container

The site returns 502 for roughly 5–10 seconds.

If a `smartalliance-web-old` container is left over from the previous deploy,
remove it first:

```bash
sudo docker rm smartalliance-web-old
```

Keep the current container, stopped, for rollback:

```bash
sudo docker rename smartalliance-web smartalliance-web-old
```

```bash
sudo docker stop smartalliance-web-old
```

Start the new one:

```bash
sudo docker run -d --name smartalliance-web --restart unless-stopped -p 3000:3000 --env-file /home/azureuser/production.env smartalliance-web:latest
```

After ~30 seconds:

```bash
sudo docker ps -a --format 'table {{.Names}}\t{{.Image}}\t{{.Status}}'
```

`smartalliance-web` should be `Up … (healthy)` and `smartalliance-web-old`
`Exited`.

### 6. Verify

From anywhere:

```bash
curl -sI https://www.smartalliance.co.th/en | head -1
```

```bash
curl -s https://www.smartalliance.co.th/sitemap.xml | grep -m2 '<loc>'
```

Every `<loc>` must start with `https://www.smartalliance.co.th`.

The mail settings are only checked when a message is actually sent, so the one
way to prove the contact form works is a real submission — fill in the form on
the site, or:

```bash
curl -s -X POST https://www.smartalliance.co.th/api/contact -H 'content-type: application/json' -d '{"name":"Test","email":"t@example.com","message":"hello"}'
```

It returns `{"ok":true}` and delivers to `CONTACT_MAIL_TO` when mail is
configured, and `{"error":"not_configured"}` with a 503 when it is not — the
container log names exactly which variable is missing.

### 7. Clean up

Once the new version has run cleanly for a day or two:

```bash
sudo docker rm smartalliance-web-old && sudo docker rmi smartalliance-web:previous
```

## Rollback

While `smartalliance-web-old` still exists:

```bash
sudo docker rm -f smartalliance-web && sudo docker rename smartalliance-web-old smartalliance-web && sudo docker start smartalliance-web
```

If it has been removed but the `:previous` tag remains:

```bash
sudo docker rm -f smartalliance-web && sudo docker run -d --name smartalliance-web --restart unless-stopped -p 3000:3000 --env-file /home/azureuser/production.env smartalliance-web:previous
```

## Changing a runtime setting

`SMTP_*`, `MS_*`, `CONTACT_MAIL_*` and `TRUST_PROXY` live in
`~/production.env`. Docker copies them into the container when it is
**created** — `docker restart` does not re-read the file. Edit it, then repeat
[step 5](#5-swap-the-container) with the current `smartalliance-web:latest`.

---

## TLS

Set up on 2026-09-30. Recorded here for rebuilding the VM; none of it needs
repeating on a normal deploy.

1. NSG inbound rule allowing TCP 443 from Any (Portal: VM → Networking →
   Create port rule).
2. Both names in the nginx site, so certbot can find the server block:

   ```bash
   sudo sed -i 's/server_name _;/server_name www.smartalliance.co.th smartalliance.co.th;/' /etc/nginx/sites-available/smartalliance-web
   ```

   ```bash
   sudo nginx -t && sudo systemctl reload nginx
   ```

3. certbot:

   ```bash
   sudo apt-get install -y certbot python3-certbot-nginx
   ```

   ```bash
   sudo certbot --nginx -d www.smartalliance.co.th -d smartalliance.co.th --redirect
   ```

Only possible once DNS resolves to the VM — no certificate authority issues
certificates for a bare IP address.

certbot rewrites the site file in place: port 443 serves the site, and port 80
answers 301 to https for the two names and **404 for anything else**, including
`http://4.194.62.222`. That is intended — the site no longer exists at a second,
duplicate address.

Renewal is automatic. To check it:

```bash
sudo certbot renew --dry-run
```

---

## Build-time vs runtime

The single most common way to misconfigure this app.

| | Where | Effect of changing it |
|---|---|---|
| `NEXT_PUBLIC_*` | `deploy.ps1 -SiteUrl` → `docker build --build-arg` | **Rebuild required.** Inlined into the JS bundle and into the prerendered `sitemap.xml`, `robots.txt`, canonical and hreflang tags during `next build`. |
| `SMTP_*`, `MS_*`, `CONTACT_MAIL_*`, `TRUST_PROXY` | `~/production.env` → `docker run --env-file` | **New container required** — see [Changing a runtime setting](#changing-a-runtime-setting). |

Putting `NEXT_PUBLIC_SITE_URL` in `production.env` does nothing at all. The
Dockerfile fails the build if it is missing, but it cannot tell whether the
value is *correct* — check `/sitemap.xml` after deploying.

`deploy.ps1` passes only `NEXT_PUBLIC_SITE_URL`. The Google and Bing
verification meta tags are therefore never emitted; verify Search Console by
DNS TXT record instead.

## Why the proxy overwrites XFF

`clientKey` in `src/lib/rate-limit.ts` reads the **left-most** entry of
`X-Forwarded-For`. nginx's usual `$proxy_add_x_forwarded_for` **appends** the
peer address to whatever the client sent, so a visitor sending

```
X-Forwarded-For: 1.2.3.4
```

produces `1.2.3.4, <real ip>` — and the app keys its rate limit on the
attacker's value. A fresh forgery per request is a fresh bucket per request,
i.e. a limiter that never limits.

The nginx site must therefore set `proxy_set_header X-Forwarded-For
$remote_addr` — overwrite, not append. The VM's site file was written by hand,
not by `vm-provision.sh`, so check it rather than assume:

```bash
grep -n proxy_set_header /etc/nginx/sites-available/smartalliance-web
```

Keep `TRUST_PROXY=1` in `production.env` only while that holds.

Behind Docker this matters more, not less: without the header the container sees
the bridge gateway address for every visitor alike.

## Scaling note

The rate limiter is in-process. One container means the limit is exactly what
the code says. A second replica would make it `5 × N` per window — move the
limiter to Redis before scaling out.

## Operating

```bash
sudo docker ps
sudo docker logs -f --tail=100 smartalliance-web
sudo docker image prune -f
sudo nginx -t && sudo systemctl reload nginx
sudo journalctl -u nginx -f
sudo certbot certificates
```

## Known gaps

- **SSH is open to Any**, and the VM accepts password logins. Narrow the NSG
  rule's source to the office IP.
- **Port 3000 is published on all interfaces.** Only the NSG keeps it private.
  `-p 127.0.0.1:3000:3000` works equally well, because nginx proxies to
  `127.0.0.1:3000`.
- **Container logs are uncapped** (`json-file` with no `max-size`). Adding
  `--log-opt max-size=10m --log-opt max-file=5` to `docker run` bounds them.

## Repository files this VM does not use

- `compose.yaml` — no Compose on the VM; the container is started with
  `docker run` as above.
- `scripts/vm-provision.sh` — the VM does not match what it produces: the nginx
  site file has a different name, `azureuser` is not in the `docker` group, and
  the Compose plugin is missing.
- `scripts/azure-setup.sh` — the NSG rules were created in the Portal (HTTP 300,
  HTTPS 320, SSH 340).

## Troubleshooting

| Symptom | Cause |
|---|---|
| `permission denied while trying to connect to the docker API` | `azureuser` is not in the `docker` group. Use `sudo`. |
| `docker: unknown command: docker compose` | Compose is not installed on the VM. Use the `docker run` steps above. |
| Docker Desktop (Windows) crashes on start: `… .sock: The file cannot be accessed by the system` | Docker Desktop bug on Windows 11 build 26200: after an unclean shutdown, its AF_UNIX socket files cannot be opened or deleted, even after a reboot. Quit Docker Desktop, rename the folder the error names (`%LOCALAPPDATA%\Docker\run` or `%LOCALAPPDATA%\docker-secrets-engine`), and start it again. "Reset to factory defaults" does not help. Quit Docker Desktop before shutting Windows down to avoid it. |
| `ERROR: --build-arg NEXT_PUBLIC_SITE_URL=... is required` | Image built by hand without `--build-arg`. `deploy.ps1` always passes it. |
| Container healthy, site unreachable from outside | nginx, DNS or the NSG. |
| `http://4.194.62.222` returns 404 | Expected since TLS was set up. See [TLS](#tls). |
| Page renders unstyled, 404s on `/_next/static/*` | The image is missing `.next/static`. `output: "standalone"` omits it deliberately; the Dockerfile copies it in a separate `COPY`. |
| Contact form returns 503 `not_configured` | `production.env` incomplete. `sudo docker logs smartalliance-web` names the variable. Fix the file, then create a new container. |
| A `production.env` change has no effect | The container was restarted, not recreated. See [Changing a runtime setting](#changing-a-runtime-setting). |
| Canonical tags / sitemap show the wrong host | `NEXT_PUBLIC_SITE_URL` was wrong **at build time**. Rebuild with the right `-SiteUrl` — restarting will not help. |
| Rate limit never triggers | The proxy is appending to `X-Forwarded-For` instead of overwriting. See above. |
| Every visitor shares one rate-limit bucket | `TRUST_PROXY` is unset, or nginx is not sending the header at all. |
| Certificate will not issue | DNS does not yet resolve here, or port 80 is closed. Never possible for a bare IP. |
| Public IP changed after a restart | The IP is Dynamic. Set it to Static on the VM's public IP resource and update DNS. |

> **Do not enable the portal's "Set up auto-shutdown" recommendation.** It is
> meant for development VMs and will take the site down on a schedule.
