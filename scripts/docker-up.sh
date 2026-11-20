#!/usr/bin/env bash
# Startet den Docker-Daemon in einer Claude-Code-Cloud-Umgebung (idempotent).
#
# - Installiert Docker nur, wenn dockerd fehlt (Ubuntu-Pakete).
# - Startet dockerd im Hintergrund, falls er nicht läuft, und wartet auf den Socket.
# - Übernimmt HTTPS_PROXY/NO_PROXY der Umgebung, damit Image-Pulls über den
#   Agent-Proxy funktionieren. Läuft dockerd bereits ohne diesen Proxy, wird er
#   einmal neu gestartet.
#
# Aufruf: bash scripts/docker-up.sh   (als root; Log: /var/log/dockerd.log)
set -euo pipefail

log() { printf 'docker-up: %s\n' "$*"; }

if [ "$(id -u)" -ne 0 ]; then
  log "muss als root laufen" >&2
  exit 1
fi

if ! command -v dockerd >/dev/null 2>&1; then
  log "dockerd fehlt, installiere docker.io"
  export DEBIAN_FRONTEND=noninteractive
  apt-get update -qq
  apt-get install -y -qq docker.io docker-buildx docker-compose-v2 >/dev/null
fi

# Docker Hub drosselt anonyme Pulls über geteilte Egress-Adressen (HTTP 429).
# Der öffentliche Mirror von Google spiegelt Docker-Hub-Images; fehlt ein Image
# dort, fällt dockerd automatisch auf Docker Hub zurück.
if [ ! -f /etc/docker/daemon.json ]; then
  mkdir -p /etc/docker
  printf '{\n  "registry-mirrors": ["https://mirror.gcr.io"]\n}\n' >/etc/docker/daemon.json
  log "Registry-Mirror eingetragen (/etc/docker/daemon.json)"
  if docker info >/dev/null 2>&1; then
    pkill -x dockerd || true
    for _ in $(seq 1 20); do pgrep -x dockerd >/dev/null || break; sleep 1; done
  fi
fi

want_proxy="${HTTPS_PROXY:-${https_proxy:-}}"

if docker info >/dev/null 2>&1; then
  have_proxy="$(docker info --format '{{.HTTPSProxy}}' 2>/dev/null || true)"
  if [ -z "$want_proxy" ] || [ "$have_proxy" = "$want_proxy" ]; then
    log "läuft bereits"
    exit 0
  fi
  log "läuft ohne Proxy der Umgebung, starte neu"
  pkill -x dockerd || true
  for _ in $(seq 1 20); do pgrep -x dockerd >/dev/null || break; sleep 1; done
fi

mkdir -p /var/log
# setsid + nohup: der Daemon überlebt das Ende des aufrufenden Skripts.
setsid nohup dockerd >>/var/log/dockerd.log 2>&1 </dev/null &

for i in $(seq 1 60); do
  if docker info >/dev/null 2>&1; then
    log "bereit nach ${i}s ($(docker version --format '{{.Server.Version}}'))"
    exit 0
  fi
  sleep 1
done

log "dockerd startet nicht, letzte Logzeilen:" >&2
tail -n 30 /var/log/dockerd.log >&2 || true
exit 1
