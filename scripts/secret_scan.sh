#!/usr/bin/env bash
# Secret-Scan mit gitleaks: Git-Historie und Arbeitsverzeichnis.
# Version und Prüfsummen sind fest verdrahtet; das Binary wird einmalig nach
# .tools/ geladen und gegen die veröffentlichte Prüfsumme verifiziert.
# Quelle der Prüfsummen:
# https://github.com/gitleaks/gitleaks/releases/download/v8.30.1/gitleaks_8.30.1_checksums.txt
# (abgerufen 14.09.2026)
set -euo pipefail

GITLEAKS_VERSION="8.30.1"
declare -A GITLEAKS_SHA256=(
  [linux_x64]="551f6fc83ea457d62a0d98237cbad105af8d557003051f41f3e7ca7b3f2470eb"
  [linux_arm64]="e4a487ee7ccd7d3a7f7ec08657610aa3606637dab924210b3aee62570fb4b080"
  [darwin_x64]="dfe101a4db2255fc85120ac7f3d25e4342c3c20cf749f2c20a18081af1952709"
  [darwin_arm64]="b40ab0ae55c505963e365f271a8d3846efbc170aa17f2607f13df610a9aeb6a5"
)

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
tools_dir="${GITLEAKS_TOOLS_DIR:-$root/.tools}"
binary="$tools_dir/gitleaks-$GITLEAKS_VERSION"

os="$(uname -s | tr '[:upper:]' '[:lower:]')"
arch="$(uname -m)"
case "$arch" in
  x86_64 | amd64) arch="x64" ;;
  aarch64 | arm64) arch="arm64" ;;
  *) echo "secret_scan: unsupported architecture $arch" >&2; exit 2 ;;
esac
key="${os}_${arch}"
if [[ -z "${GITLEAKS_SHA256[$key]:-}" ]]; then
  echo "secret_scan: unsupported platform $key" >&2
  exit 2
fi

verify_sha256() {
  local expected="$1" file="$2"
  if command -v sha256sum >/dev/null 2>&1; then
    echo "$expected  $file" | sha256sum -c - >/dev/null
  else
    echo "$expected  $file" | shasum -a 256 -c - >/dev/null
  fi
}

if [[ ! -x "$binary" ]]; then
  mkdir -p "$tools_dir"
  tmp="$(mktemp -d)"
  trap 'rm -rf "$tmp"' EXIT
  asset="gitleaks_${GITLEAKS_VERSION}_${key}.tar.gz"
  url="https://github.com/gitleaks/gitleaks/releases/download/v${GITLEAKS_VERSION}/${asset}"
  echo "secret_scan: downloading $url"
  curl --fail --silent --show-error --location --proto '=https' --tlsv1.2 \
    --output "$tmp/$asset" "$url"
  verify_sha256 "${GITLEAKS_SHA256[$key]}" "$tmp/$asset"
  tar -xzf "$tmp/$asset" -C "$tmp" gitleaks
  mv "$tmp/gitleaks" "$binary"
  chmod 0755 "$binary"
fi

cd "$root"
echo "secret_scan: gitleaks $("$binary" version) - git history"
"$binary" git --no-banner --redact --exit-code 1 .
echo "secret_scan: gitleaks - working tree"
"$binary" dir --no-banner --redact --exit-code 1 .
echo "secret_scan: no leaks found"
