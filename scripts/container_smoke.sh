#!/usr/bin/env bash
# Smoke-Test des Container-Images: read-only starten, Seiten, 404, Healthcheck
# und Sicherheits-Header prüfen. Aufruf: scripts/container_smoke.sh [image] [port]
set -euo pipefail

image="${1:-luescherwohnen-ch:local}"
port="${2:-8080}"
base="http://127.0.0.1:${port}"

cid="$(docker run -d --rm --read-only --tmpfs /tmp -p "127.0.0.1:${port}:8080" "$image")"
trap 'docker stop "$cid" >/dev/null 2>&1 || true' EXIT

for _ in $(seq 1 30); do
  if curl -fsS "$base/healthz" >/dev/null 2>&1; then break; fi
  sleep 1
done

fail() { echo "container_smoke: FEHLER: $*" >&2; exit 1; }

curl -fsS "$base/healthz" | grep -q '^ok' || fail "healthz antwortet nicht mit ok"
for path in / /impressum.html /datenschutz.html /assets/site.css /assets/images/logo.png; do
  code="$(curl -s -o /dev/null -w '%{http_code}' "$base$path")"
  [[ "$code" == "200" ]] || fail "$path liefert $code statt 200"
done
code="$(curl -s -o /dev/null -w '%{http_code}' "$base/gibt-es-nicht")"
[[ "$code" == "404" ]] || fail "unbekannter Pfad liefert $code statt 404"
curl -s "$base/gibt-es-nicht" | grep -q "Seite nicht gefunden" || fail "404-Seite fehlt"

check_headers() {
  local headers
  headers="$(curl -sI "$base$1")"
  for expected in "content-security-policy:" "x-content-type-options: nosniff" "x-frame-options: DENY" "referrer-policy:" "permissions-policy:"; do
    echo "$headers" | grep -qi "$expected" || fail "Header '$expected' fehlt auf $1"
  done
  echo "$headers" | grep -qiE '^server: nginx/' && fail "Server-Version wird preisgegeben"
  return 0
}
check_headers /
check_headers /assets/site.css
check_headers /gibt-es-nicht

echo "container_smoke: ok ($image)"
