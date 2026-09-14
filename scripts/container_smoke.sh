#!/usr/bin/env bash
# Smoke-Test des Compose-Stacks (Website + Kontakt-Dienst): Seiten, 404,
# Healthcheck, Sicherheits-Header und der zweistufige Formularversand.
# Aufruf: scripts/container_smoke.sh [port]   (Stack muss laufen, z. B. via
# docker compose -f deploy/compose.yml -f deploy/compose.ci.yml up -d)
set -euo pipefail

port="${1:-8080}"
base="http://127.0.0.1:${port}"

fail() { echo "container_smoke: FEHLER: $*" >&2; exit 1; }

for _ in $(seq 1 30); do
  if curl -fsS "$base/healthz" >/dev/null 2>&1; then break; fi
  sleep 1
done

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

# Kontaktformular über nginx: Schritt 1 (prüfen), Schritt 2 (senden)
curl -fsS "$base/kontakt/healthz" | grep -q '^ok' || fail "Kontakt-Dienst über nginx nicht erreichbar"
daten='name=Smoke+Test&email=smoke%40example.com&telefon=&nachricht=Automatischer+Smoke-Test+des+Kontaktformulars.'
schritt1="$(curl -s -o /tmp/schritt1.html -w '%{http_code}' -H 'Origin: http://127.0.0.1:'"$port" --data "$daten" "$base/kontakt")"
[[ "$schritt1" == "200" ]] || fail "Formular-Schritt 1 liefert $schritt1 statt 200"
token="$(grep -o 'name="token" value="[^"]*"' /tmp/schritt1.html | head -1 | sed 's/.*value="//; s/"$//')"
[[ -n "$token" ]] || fail "kein Token in der Bestätigungsseite"
sleep 1
schritt2="$(curl -s -o /dev/null -w '%{http_code}' --data "${daten}&token=${token}" "$base/kontakt/senden")"
[[ "$schritt2" == "303" ]] || fail "Formular-Schritt 2 liefert $schritt2 statt 303"
curl -s "$base/kontakt/danke" | grep -q "Vielen Dank" || fail "Danke-Seite fehlt"
curl -sI "$base/kontakt/danke" | grep -qi 'content-security-policy:' || fail "Sicherheits-Header fehlen beim Kontakt-Dienst"

echo "container_smoke: ok"
