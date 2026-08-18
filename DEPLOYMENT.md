# Deployment

Production runs on **Azure App Service (Linux, Node 22)**, deployed by GitHub
Actions from `main`. There is one environment.

```
PR ──▶ ci.yml (lint · tsc · 362 tests)
             │
     squash merge to main
             │
             ▼
   deploy-production.yml
     verify  → re-runs ci.yml against the merged commit
     build   → next build with NEXT_PUBLIC_* baked in
     package → .next/standalone + .next/static + public
     boot    → starts the package, proves it serves
     deploy  → azure/webapps-deploy (OIDC, no stored credential)
     smoke   → polls the live site until it returns 200
```

## Branch strategy

**`main` is the only branch that reaches production.** Everything else arrives
through a pull request.

| Branch | Purpose | Deploys? |
|---|---|---|
| `main` | always matches production | yes, automatically |
| `feat/*`, `fix/*` | one change each, short-lived | no — CI only |

There is deliberately **no `develop` branch**. A long-lived integration branch
earns its keep when it has somewhere of its own to deploy to; with a single
production environment it would just be a second merge with nothing to show for
it, and `main` would quietly drift out of step with the live site.

Recommended settings on `main` (Settings → Branches → Add rule):

- Require a pull request before merging
- Require status checks to pass → **`Lint, types, tests`**
- Require branches to be up to date before merging
- Prefer **squash merge**, so one deploy corresponds to one change

> **First thing to do:** `main` is currently **12 commits behind**
> `feat/contact-form-backend`, which holds the SEO work, the OWASP pass and the
> test suite. Open that as a PR and merge it *before* turning the branch
> protection on — otherwise the first deploy ships a stale site.

---

## One-time Azure setup

Set these to your own values and run the rest as written.

```bash
RG=rg-smartalliance
APP=smartalliance-web          # must be globally unique
PLAN=asp-smartalliance
LOCATION=southeastasia         # Singapore — closest region to Bangkok
SUB=$(az account show --query id -o tsv)
```

### 1. App Service

```bash
az group create --name $RG --location $LOCATION

# B1 is the cheapest tier that supports Always On and a custom domain.
az appservice plan create --name $PLAN --resource-group $RG \
  --location $LOCATION --is-linux --sku B1

az webapp create --name $APP --resource-group $RG --plan $PLAN \
  --runtime "NODE:22-lts"
```

### 2. Startup command and build behaviour

Both matter. Without them the deploy lands and the site still fails to start.

```bash
# Default is `npm start`, i.e. `next start`, which needs the full node_modules
# this build deliberately does not ship. The standalone server is `server.js`.
az webapp config set --name $APP --resource-group $RG \
  --startup-file "node server.js"

az webapp config appsettings set --name $APP --resource-group $RG --settings \
  SCM_DO_BUILD_DURING_DEPLOYMENT=false \
  WEBSITE_NODE_DEFAULT_VERSION=~22

# Keeps the process warm. Also relevant to abuse protection: the contact form's
# rate limiter lives in process memory, so a cold start resets its counters.
az webapp config set --name $APP --resource-group $RG --always-on true
```

`SCM_DO_BUILD_DURING_DEPLOYMENT=false` is not optional. The workflow uploads a
finished build; leaving Oryx enabled makes the host try to install and rebuild
on top of it, which is slow and then fails.

### 3. Runtime application settings

These are read when the app **starts**. Secrets belong here — never in the
repository, and never in the workflow.

```bash
az webapp config appsettings set --name $APP --resource-group $RG --settings \
  SMTP_USER="noreply@smartalliance.co.th" \
  CONTACT_MAIL_TO="admin@smartalliance.co.th" \
  MS_TENANT_ID="..." \
  MS_CLIENT_ID="..." \
  MS_CLIENT_SECRET="..." \
  TRUST_PROXY=1
```

`TRUST_PROXY=1` **is correct on App Service** and should be set: the platform's
front end terminates TLS and rewrites `X-Forwarded-For`, so the header can be
trusted. Leave it unset and every visitor shares one rate-limit bucket.

> Better than `MS_CLIENT_SECRET`: give the web app a **managed identity**, grant
> it `Mail.Send`, and hold no secret at all. Failing that, keep the secret in
> Key Vault and reference it — `@Microsoft.KeyVault(SecretUri=...)` — so it is
> never readable from the App Service blade. See "Handling the secret" in the
> README for the `*_ENC` alternative.

### 4. OIDC federated credential

No credential is stored in GitHub; Azure mints a short-lived token per run.

```bash
# App registration + service principal
APP_ID=$(az ad app create --display-name "github-smartalliance-deploy" \
  --query appId -o tsv)
az ad sp create --id $APP_ID
```

The federated credential's **subject must match how the job identifies
itself**. `deploy-production.yml` declares `environment: production`, so the
subject is the *environment* form — not the branch form. Getting this wrong is
the usual cause of `AADSTS70021: No matching federated identity record found`.

```bash
az ad app federated-credential create --id $APP_ID --parameters '{
  "name": "github-main-production",
  "issuer": "https://token.actions.githubusercontent.com",
  "subject": "repo:Manartqa/web-smartalliance-:environment:production",
  "audiences": ["api://AzureADTokenExchange"]
}'
```

Grant it rights over that one web app, not the whole subscription:

```bash
az role assignment create --role Contributor \
  --assignee $APP_ID \
  --scope "/subscriptions/$SUB/resourceGroups/$RG/providers/Microsoft.Web/sites/$APP"

echo "AZURE_CLIENT_ID       = $APP_ID"
echo "AZURE_TENANT_ID       = $(az account show --query tenantId -o tsv)"
echo "AZURE_SUBSCRIPTION_ID = $SUB"
```

### 5. GitHub configuration

Create the environment first: **Settings → Environments → New → `production`**.
Add required reviewers there if a deploy should need approval.

**Secrets** (Settings → Secrets and variables → Actions → Secrets):

| Secret | Value |
|---|---|
| `AZURE_CLIENT_ID` | `$APP_ID` from step 4 |
| `AZURE_TENANT_ID` | tenant id from step 4 |
| `AZURE_SUBSCRIPTION_ID` | subscription id from step 4 |

**Variables** (same page → Variables). These are not secret — two of them are
served to every visitor in the page source.

| Variable | Example | Notes |
|---|---|---|
| `AZURE_WEBAPP_NAME` | `smartalliance-web` | `$APP` |
| `NEXT_PUBLIC_SITE_URL` | `https://www.smartalliance.co.th` | no trailing slash |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | | optional |
| `NEXT_PUBLIC_BING_SITE_VERIFICATION` | | optional |

---

## Build-time vs runtime settings

The single most common way to misconfigure this app.

| | Where it goes | Why |
|---|---|---|
| `NEXT_PUBLIC_*` | **GitHub variables** | Inlined into the JS bundle and into the prerendered `sitemap.xml`, `robots.txt`, canonical and hreflang tags **during `next build`**. Setting them in App Service does nothing — by the time the app starts, the values are already baked in. |
| everything else | **App Service settings** | Read by the server at request time. |

`NEXT_PUBLIC_SITE_URL` is the one that bites: get it wrong and the site works
perfectly while publishing canonical tags and a sitemap pointing at the wrong
host. The build step fails fast if it is unset, but it cannot tell whether the
value is *right* — check `https://<site>/sitemap.xml` after the first deploy.

---

## Scaling note

The contact form's rate limiter is **in-process** (`src/lib/rate-limit.ts`).
Scaling the plan out to N instances makes the effective limit `5 × N` per
window, because each instance counts separately.

Scaling **up** (a bigger instance) is unaffected. If the site ever needs more
than one instance, move the limiter to Redis first — the site-wide hourly
ceiling in the route degrades the same way.

---

## Rollback

App Service keeps previous deployments:

```bash
az webapp deployment list-publishing-profiles --name $APP --resource-group $RG
az webapp deployment source show --name $APP --resource-group $RG
```

The dependable path is forward: revert the commit on `main` and let the
pipeline redeploy. Because `main` always matches production, `git revert` of the
offending merge is a complete rollback.

## Troubleshooting

| Symptom | Cause |
|---|---|
| `AADSTS70021: No matching federated identity record` | Federated credential subject does not match. With `environment: production` it must be `repo:OWNER/REPO:environment:production`, not `...:ref:refs/heads/main`. |
| Site returns 503, logs show `Could not find a production build` | `.next/` was not copied into the package. A `cp -r <dir>/*` glob skips it because it is a dotfile — use `cp -a <dir>/.` |
| Page renders unstyled, 404s on `/_next/static/*` | `.next/static` was not copied. `output: "standalone"` omits it on purpose. |
| Contact form returns 503 `not_configured` | Mail settings missing on App Service. The log line names exactly which. |
| Canonical/sitemap point at the wrong host | `NEXT_PUBLIC_SITE_URL` was wrong **at build time**. Fix the variable and redeploy — changing the App Service setting will not help. |
| Rate limit seems far too permissive | Plan scaled out past one instance. See the scaling note. |

```bash
az webapp log tail --name $APP --resource-group $RG
```
