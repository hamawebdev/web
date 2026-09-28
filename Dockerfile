# syntax=docker/dockerfile:1.7

# Med-ADN web (Next.js standalone). The image is published publicly on GHCR:
# nothing secret may enter the build context or any layer. NEXT_PUBLIC_* values
# are public and are baked into the client bundle at build time.

ARG NODE_IMAGE=node:22.23.3-bookworm-slim@sha256:43ac6c60b8f89723f746e8a92ce91abd5017e627ce1ddfe4238355d3a30b772c

# ---- deps: install exactly what package-lock.json pins ----
FROM ${NODE_IMAGE} AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# ---- builder: compile the standalone server ----
FROM ${NODE_IMAGE} AS builder
WORKDIR /app

ARG NEXT_PUBLIC_API_URL=https://api.med-adn.com/api/v1
ARG NEXT_PUBLIC_APP_URL=https://med-adn.com
ARG NEXT_PUBLIC_APP_NAME=Med-ADN

ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL} \
    NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL} \
    NEXT_PUBLIC_APP_NAME=${NEXT_PUBLIC_APP_NAME} \
    NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app/node_modules ./node_modules
# .dockerignore is an allowlist; .env files never reach the context. Remove any anyway.
COPY . .
# .git (commit refs only, for the version stage) is not needed to build
RUN rm -rf .env .env.* .git \
 && npm run build

# ---- version: commit being built, for /api/health ----
# The GIT_SHA build arg (CI) when set, otherwise read from the build context's .git
# (Dokploy builds from a clone and passes no build args). .dockerignore lets in only
# .git/HEAD, .git/refs/heads/ and .git/packed-refs (commit ids and ref names, never
# .git/config), and they are only bind-mounted here: nothing from .git reaches an image
# layer, only the resulting /version file.
FROM ${NODE_IMAGE} AS version
ARG GIT_SHA
RUN --mount=type=bind,target=/ctx \
    sha="${GIT_SHA:-}"; \
    if [ -z "$sha" ] || [ "$sha" = "unknown" ]; then \
      sha=""; \
      if [ -f /ctx/.git/HEAD ]; then \
        head="$(head -n 1 /ctx/.git/HEAD)"; \
        case "$head" in \
          "ref: "*) \
            ref="${head#ref: }"; \
            if [ -f "/ctx/.git/$ref" ]; then \
              sha="$(head -n 1 "/ctx/.git/$ref")"; \
            elif [ -f /ctx/.git/packed-refs ]; then \
              sha="$(grep -v '^[#^]' /ctx/.git/packed-refs | awk -v ref="$ref" '$2 == ref { print $1; exit }')"; \
            fi ;; \
          *) sha="$head" ;; \
        esac; \
      fi; \
    fi; \
    printf '%s' "$sha" | grep -Eq '^[0-9a-f]{40}([0-9a-f]{24})?$' || sha=unknown; \
    echo "$sha" > /version; \
    echo "Building commit $sha"

# ---- runner: minimal non-root runtime ----
FROM ${NODE_IMAGE} AS runner
WORKDIR /app

ARG GIT_SHA=unknown

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    GIT_SHA=${GIT_SHA}

LABEL org.opencontainers.image.source=https://github.com/hamawebdev/web \
      org.opencontainers.image.title="med-adn-web" \
      org.opencontainers.image.revision=${GIT_SHA}

RUN groupadd --system --gid 1001 nodejs \
 && useradd --system --uid 1001 --gid nodejs --no-create-home --shell /usr/sbin/nologin nextjs

COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# Read by /api/health when GIT_SHA is not set (source builds)
COPY --from=version /version /app/.git-sha

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=15s --timeout=10s --start-period=120s --retries=5 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
