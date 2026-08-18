# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# Debian slim rather than Alpine: `sharp`, which Next uses to re-encode images,
# ships prebuilt binaries per libc. glibc is the well-trodden path, and the
# extra ~50 MB is not worth debugging a musl build for.
# ---------------------------------------------------------------------------
FROM node:22-slim AS deps
WORKDIR /app

# Only the manifests, so this layer is reused on every build that does not
# change a dependency — which is nearly all of them.
COPY package.json package-lock.json ./
RUN npm ci


FROM node:22-slim AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# ---------------------------------------------------------------------------
# NEXT_PUBLIC_* are inlined into the JS bundle and into the prerendered
# sitemap.xml, robots.txt and canonical/hreflang tags AT BUILD TIME.
#
# That makes them build arguments, not runtime environment variables. Passing
# them to `docker run` or putting them in compose's `environment:` has no
# effect — by the time the container starts, the values are already baked in.
# Change one and you must rebuild the image, not restart the container.
# ---------------------------------------------------------------------------
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
ARG NEXT_PUBLIC_BING_SITE_VERIFICATION

ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=$NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION \
    NEXT_PUBLIC_BING_SITE_VERIFICATION=$NEXT_PUBLIC_BING_SITE_VERIFICATION \
    NODE_ENV=production

# Fail here rather than shipping an image whose canonical tags and sitemap
# advertise the fallback host in src/config/site.ts.
RUN test -n "$NEXT_PUBLIC_SITE_URL" || { \
      echo "ERROR: --build-arg NEXT_PUBLIC_SITE_URL=... is required."; \
      echo "It is baked into the bundle here and cannot be set at run time."; \
      exit 1; \
    }

RUN npm run build


FROM node:22-slim AS runner
WORKDIR /app

# HOSTNAME must be 0.0.0.0 *inside* the container, or nothing outside the
# container's own network namespace can reach it. Public exposure is controlled
# instead by binding the published port to 127.0.0.1 on the host — see
# compose.yaml — so the container is reachable only through nginx.
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    NEXT_TELEMETRY_DISABLED=1

# `next.config.ts` sets output: "standalone", which traces only the modules the
# app actually reaches — a few MB instead of the whole node_modules tree. It
# deliberately omits `.next/static` and `public`, on the assumption a CDN serves
# them, so both are copied in separately below. Miss either and the site renders
# with no CSS, no JS and no images.
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder --chown=node:node /app/public ./public

# The `node` user ships with the image. Running as root inside a container is a
# needless second chance for a container escape to matter.
USER node

EXPOSE 3000

# Compose restarts the container when this fails, which covers a hung process
# that has not exited — something `restart: unless-stopped` alone will not catch.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/en').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
