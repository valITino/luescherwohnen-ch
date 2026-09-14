# Liefer-Artefakt (ADR-0003): statische Website in nginx ohne Root.
# Beide Basisimages sind per Digest gepinnt (Docker Hub, abgerufen 14.09.2026);
# Dependabot aktualisiert die Digests.

# Build-Stufe: Seiten zusammenfügen und Sass kompilieren.
FROM node:22.23.2-alpine3.24@sha256:c610fcdfb1d5b4740dd70c284ed3cb16bb857e0f7166196e36a5501df7a3aa32 AS build
WORKDIR /src
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts --no-audit --no-fund
COPY scripts/build.mjs scripts/
COPY web/src web/src
RUN npm run build

# Laufzeit-Stufe: nur statische Dateien, Prozess als Benutzer 101, Port 8080.
FROM nginxinc/nginx-unprivileged:1.29.8-alpine-slim@sha256:59678856b05324b7f6371f26eb1520be7fcd8bdc8ab380fc4913db8503e5a842
# Sicherheitsupdates der Alpine-Basis einspielen (Trivy meldete am 14.09.2026
# OpenSSL 3.5.6-r0 mit Korrektur in 3.5.8-r0), danach zurück zum Benutzer 101.
USER root
RUN apk upgrade --no-cache
USER 101
COPY web/docker/security-headers.conf /etc/nginx/snippets/security-headers.conf
COPY web/docker/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /src/web/dist /usr/share/nginx/html
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD ["wget", "-q", "-O", "/dev/null", "http://127.0.0.1:8080/healthz"]
