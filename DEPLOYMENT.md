# Deployment

The site runs as a **Docker container behind nginx** on an Azure VM
(`vm-company-web-prd`, `rg-company-web-prd`, Southeast Asia — `4.194.62.222`).

Deployment is manual: build the image on the VM, start it with Compose. There is
no CI/CD pipeline.

```
internet ──▶ nginx :80/:443 ──▶ 127.0.0.1:3000 ──▶ container: node server.js
             TLS, overwrites XFF                    restart: unless-stopped
```

Two properties are worth knowing before changing anything:

- The container's port is published to **`127.0.0.1` only**, so nothing reaches
  the app except through nginx.
- nginx **overwrites** `X-Forwarded-For` rather than appending to it. See
  [Why the proxy overwrites XFF](#why-the-proxy-overwrites-xff) — it is the
  difference between a working rate limiter and one that never limits.

---

## Step 1 — Azure networking

From [Azure Cloud Shell](https://shell.azure.com):

```bash
SSH_ALLOWED_FROM="<your office IP>" bash scripts/azure-setup.sh
```

Pins the public IP to **Static**, opens 80 and 443, and restricts SSH. Idempotent.

At first check, **443 was closed** on this VM and SSH was reachable from
anywhere — both matter. The script will not narrow an existing wide-open SSH
rule unless you name the replacement, because a wrong value there locks you out.

## Step 2 — Prepare the VM

```bash
scp scripts/vm-provision.sh azureuser@4.194.62.222:~
```

```bash
ssh azureuser@4.194.62.222 'sudo bash vm-provision.sh'
```

Installs Docker and the Compose plugin, configures nginx as the reverse proxy,
enables unattended security updates, and caps container logs.

nginx is already installed on this VM, so the script reuses it rather than
adding a second thing competing for port 80.

Give it a hostname instead, once DNS resolves, to also install certbot:

```bash
ssh azureuser@4.194.62.222 'sudo SITE_DOMAIN=www.smartalliance.co.th bash vm-provision.sh'
```

> **Log out and back in** afterwards. `azureuser` is added to the `docker` group
> and group membership only applies to new sessions — otherwise every `docker`
> command needs `sudo`.

## Step 3 — Run the tests

There is no pipeline to do this for you any more. Before shipping anything:

```bash
npm test
```

362 tests, about 7 seconds. What they cover is in the README's Tests section;
the contact route and both header-injection guards are the parts most worth not
shipping broken.

## Step 4 — Copy the project to the VM

From the repository root on your own machine:

```bash
rsync -az --delete --exclude node_modules --exclude .next --exclude .git ./ azureuser@4.194.62.222:~/smartalliance/
```

`--delete` keeps the VM's copy from accumulating files you have since removed.
`node_modules` and `.next` are excluded because the image builds its own.

## Step 5 — Configure the two env files

There are two, and the split is not cosmetic.

**`.env`** — read by Compose at **build** time only:

```bash
cd ~/smartalliance
echo 'NEXT_PUBLIC_SITE_URL=http://4.194.62.222' > .env
```

**`.env.production`** — read by the container at **start** time:

```bash
cp .env.example .env.production
nano .env.production        # SMTP_USER, CONTACT_MAIL_TO, MS_TENANT_ID,
                            # MS_CLIENT_ID, MS_CLIENT_SECRET
echo 'TRUST_PROXY=1' >> .env.production
chmod 600 .env.production
```

Neither file is committed — `.gitignore` covers `.env*`, and `.dockerignore`
keeps both out of the image.

> Use `http://4.194.62.222` while testing on the bare IP, and change it to
> `https://www.smartalliance.co.th` when DNS is live. It is baked into the
> bundle, so **changing it needs a rebuild, not a restart** — see
> [Build-time vs runtime](#build-time-vs-runtime).

## Step 6 — Build and start

```bash
cd ~/smartalliance
docker compose up -d --build
```

First build takes a few minutes. Then:

```bash
docker compose ps          # should show "healthy" after ~30s
docker compose logs -f
```

> **If the build is killed:** `next build` needs roughly 2 GB of RAM. On a small
> VM size, add swap first:
>
> ```bash
> sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile
> sudo mkswap /swapfile && sudo swapon /swapfile
> ```
>
> Or build the image elsewhere and move it with `docker save` / `docker load`.

## Step 7 — Verify

On the VM:

```bash
curl -I http://127.0.0.1:3000/en          # container directly
curl -I http://127.0.0.1/en               # through nginx
```

From anywhere:

```bash
curl -I http://4.194.62.222/en
```

Then check the things that only break in production:

```bash
curl -s http://4.194.62.222/sitemap.xml | head
```

```bash
curl -s -X POST http://4.194.62.222/api/contact -H 'content-type: application/json' -d '{"name":"Test","email":"t@example.com","message":"hello"}'
```

The contact endpoint returns `{"ok":true}` when mail is configured, and
`{"error":"not_configured"}` with a 503 when it is not — the container log names
exactly which variable is missing.

## Step 8 — TLS

Only once DNS resolves to `4.194.62.222`. No certificate authority issues
certificates for a bare IP address.

```bash
sudo certbot --nginx -d www.smartalliance.co.th
```

certbot edits the nginx config in place and installs its own renewal timer.
Afterwards, rebuild so the baked-in URL matches:

```bash
echo 'NEXT_PUBLIC_SITE_URL=https://www.smartalliance.co.th' > .env
```

```bash
docker compose up -d --build
```

---

## Redeploying a change

```bash
npm test
```

```bash
rsync -az --delete --exclude node_modules --exclude .next --exclude .git ./ azureuser@4.194.62.222:~/smartalliance/
```

```bash
ssh azureuser@4.194.62.222 'cd ~/smartalliance && docker compose up -d --build'
```

Compose replaces the container only after the new image builds, so a failed
build leaves the running site untouched.

## Rollback

Tag the current image before rebuilding, and going back is two commands:

```bash
docker tag smartalliance-web:latest smartalliance-web:previous
```

```bash
docker compose down && docker tag smartalliance-web:previous smartalliance-web:latest && docker compose up -d
```

Note the absence of `--build` on the way back. Without a prior tag: `git
checkout` the last good commit, rsync, rebuild.

---

## Build-time vs runtime

The single most common way to misconfigure this app.

| | Where | Effect of changing it |
|---|---|---|
| `NEXT_PUBLIC_*` | `.env` → Compose `build.args` | **Rebuild required.** Inlined into the JS bundle and into the prerendered `sitemap.xml`, `robots.txt`, canonical and hreflang tags during `next build`. |
| `SMTP_*`, `MS_*`, `CONTACT_MAIL_*`, `TRUST_PROXY` | `.env.production` → `env_file` | Restart is enough: `docker compose up -d`. |

Putting `NEXT_PUBLIC_SITE_URL` in `.env.production` does nothing at all. The
Dockerfile fails the build if it is missing, but it cannot tell whether the
value is *correct* — check `/sitemap.xml` after deploying.

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

`vm-provision.sh` therefore writes `proxy_set_header X-Forwarded-For
$remote_addr` — overwrite, not append. Keep it that way if you edit the nginx
config by hand, and keep `TRUST_PROXY=1` set only while it stays true.

Behind Docker this matters more, not less: without the header the container sees
the bridge gateway address for every visitor alike.

## Scaling note

The rate limiter is in-process. One container means the limit is exactly what
the code says. A second replica would make it `5 × N` per window — move the
limiter to Redis before scaling out.

## Operating

```bash
docker compose ps
docker compose logs -f --tail=100
docker image prune -f
sudo nginx -t && sudo systemctl reload nginx
sudo journalctl -u nginx -f
```

## Troubleshooting

| Symptom | Cause |
|---|---|
| `docker: permission denied` | You have not logged out since being added to the `docker` group. |
| Build killed part-way | Out of memory. See the note in step 6. |
| `ERROR: --build-arg NEXT_PUBLIC_SITE_URL=... is required` | `.env` is missing or empty in `~/smartalliance`. It is a build argument, not a runtime one. |
| Container healthy, site unreachable from outside | nginx, DNS or the NSG. 443 was closed on this VM initially — `azure-setup.sh` opens it. |
| Page renders unstyled, 404s on `/_next/static/*` | The image is missing `.next/static`. `output: "standalone"` omits it deliberately; the Dockerfile copies it in a separate `COPY`. |
| Contact form returns 503 `not_configured` | `.env.production` incomplete. `docker compose logs` names the variable. |
| Canonical tags / sitemap show the wrong host | `NEXT_PUBLIC_SITE_URL` was wrong **at build time**. Fix `.env` and rebuild — restarting will not help. |
| Rate limit never triggers | The proxy is appending to `X-Forwarded-For` instead of overwriting. See above. |
| Every visitor shares one rate-limit bucket | `TRUST_PROXY` is unset, or nginx is not sending the header at all. |
| Certificate will not issue | DNS does not yet resolve here, or port 80 is closed. Never possible for a bare IP. |
| Public IP changed after a restart | Still Dynamic. Re-run `scripts/azure-setup.sh`. |

> **Do not enable the portal's "Set up auto-shutdown" recommendation.** It is
> meant for development VMs and will take the site down on a schedule.
