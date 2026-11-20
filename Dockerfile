# syntax=docker/dockerfile:1.7
#
# Statische Website von Lüscher Wohnen: im ersten Schritt mit Node bauen, dann mit nginx ohne
# root ausliefern. Basis-Images per Digest gepinnt (Dependabot aktualisiert sie, siehe
# .github/dependabot.yml).
#
# Bauen:   pnpm docker:build   (setzt in dieser Cloud-Umgebung Proxy und CA selbst)
#          docker build -t luescherwohnen:local .
# Starten: pnpm docker:run     oder   docker compose up --build
#
# Build-Argumente (alle optional):
#   PUBLIC_WEB_URL           Adresse der Website (Standard: https://luescherwohnen.ch)
#   PUBLIC_CONTACT_ENDPOINT  `mock`, https-Adresse oder leer (kein Formular, Standard)
#   PUBLIC_PREVIEW           `true`: Vorschau mit Hinweis und noindex
#   PUBLIC_HSTS_PRELOAD      `true`: HSTS mit preload (erst nach stabilem Betrieb)

ARG NODE_IMAGE=node:22.23.5-alpine3.24@sha256:1314fb30ec37592d5845e5a160d522c0e680972aa534549940b8d73bde88481a
ARG NGINX_IMAGE=nginxinc/nginx-unprivileged:1.31.7-alpine3.24-slim@sha256:a8cb0f33d51fa107c96fd2bd3a71aaf564ec131e9d2bdf8700944f0ed8b170d7

# ---------------------------------------------------------------- Build

FROM ${NODE_IMAGE} AS build
WORKDIR /src
ENV ASTRO_TELEMETRY_DISABLED=1 \
    COREPACK_ENABLE_DOWNLOAD_PROMPT=0 \
    CI=true

RUN corepack enable

# Zuerst nur Manifeste und Lockfile: Der Schritt mit den Abhängigkeiten bleibt im Cache, solange
# sich diese nicht ändern.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json apps/web/
COPY packages/config/package.json packages/config/
COPY packages/ui/package.json packages/ui/

# Optionales CA-Zertifikat als Build-Secret (nur für Umgebungen mit TLS-Proxy; landet nie im Image).
RUN --mount=type=secret,id=ca,required=false \
    --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    if [ -s /run/secrets/ca ]; then export NODE_EXTRA_CA_CERTS=/run/secrets/ca; fi; \
    pnpm install --frozen-lockfile --filter '@luescher/web...'

COPY . .

ARG PUBLIC_WEB_URL=""
ARG PUBLIC_CONTACT_ENDPOINT=""
ARG PUBLIC_PREVIEW=""
ARG PUBLIC_HSTS_PRELOAD=""
ENV PUBLIC_WEB_URL=${PUBLIC_WEB_URL} \
    PUBLIC_CONTACT_ENDPOINT=${PUBLIC_CONTACT_ENDPOINT} \
    PUBLIC_PREVIEW=${PUBLIC_PREVIEW} \
    PUBLIC_HSTS_PRELOAD=${PUBLIC_HSTS_PRELOAD}

RUN pnpm --filter @luescher/web build \
 && node scripts/nginx-headers.mjs /out/snippets \
 && test -f apps/web/dist/index.html

# ---------------------------------------------------------------- Laufzeit

FROM ${NGINX_IMAGE} AS runtime

# Sicherheitsupdates der Alpine-Pakete, die nach dem Basis-Image erschienen sind (Trivy fand
# sonst behobene Lücken in musl und zlib). Das CA-Secret braucht es nur hinter einem TLS-Proxy;
# es landet nie im Image. Danach gehört die nginx-Konfiguration root und ist für den
# nginx-Benutzer nicht beschreibbar, auch ohne read-only-Dateisystem (das Basis-Image gibt
# /etc/nginx dem Benutzer nginx).
USER root
RUN --mount=type=secret,id=ca,required=false \
    if [ -s /run/secrets/ca ]; then export SSL_CERT_FILE=/run/secrets/ca; fi; \
    apk upgrade --no-cache \
 && nginx -v \
 && chown -R root:root /etc/nginx \
 && chmod -R go-w /etc/nginx

LABEL org.opencontainers.image.title="luescherwohnen.ch" \
      org.opencontainers.image.description="Website der Lüscher Wohnen AG (statisch, nginx ohne root)" \
      org.opencontainers.image.source="https://github.com/valITino/luescherwohnen-ch" \
      org.opencontainers.image.licenses="NOASSERTION"

# Konfiguration und Inhalte gehören root und sind für den nginx-Benutzer nur lesbar.
COPY --chown=root:root --chmod=0644 docker/nginx.conf /etc/nginx/conf.d/default.conf
# In das bestehende conf.d (Rechte 0755); --chmod legte sonst ein neues Verzeichnis ohne x-Bit an.
# Endung .inc: nginx bindet nur *.conf automatisch ein, die Header nur dort, wo eine Location sie will.
COPY --from=build --chown=root:root --chmod=0644 \
     /out/snippets/security-headers.inc /out/snippets/security-headers-cross-origin.inc \
     /etc/nginx/conf.d/
COPY --from=build --chown=root:root /src/apps/web/dist/ /usr/share/nginx/html/

USER 101
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:8080/healthz || exit 1
