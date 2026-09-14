# Kontaktformular-Dienst (ADR-0002, ADR-0003). Build-Kontext ist das
# Repository-Wurzelverzeichnis, damit die Website-Partials mitkommen.
FROM node:22.23.2-alpine3.24@sha256:c610fcdfb1d5b4740dd70c284ed3cb16bb857e0f7166196e36a5501df7a3aa32 AS deps
WORKDIR /app
COPY kontakt/package.json kontakt/package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts --no-audit --no-fund

FROM node:22.23.2-alpine3.24@sha256:c610fcdfb1d5b4740dd70c284ed3cb16bb857e0f7166196e36a5501df7a3aa32
ENV NODE_ENV=production
WORKDIR /app
# Sicherheitsupdates der Alpine-Basis einspielen und den npm-Client entfernen:
# Die Laufzeit braucht ihn nicht, und seine gebündelten Pakete lieferten beim
# ersten Trivy-Lauf am 14.09.2026 elf Befunde (tar, pacote, brace-expansion ...).
RUN apk upgrade --no-cache \
  && rm -rf /usr/local/lib/node_modules /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack /opt/yarn*
COPY --from=deps /app/node_modules ./node_modules
COPY kontakt/package.json kontakt/server.mjs ./
COPY kontakt/lib ./lib
COPY web/src/partials ./templates/partials
USER 1000
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD ["wget", "-q", "-O", "/dev/null", "http://127.0.0.1:3000/kontakt/healthz"]
CMD ["node", "server.mjs"]
