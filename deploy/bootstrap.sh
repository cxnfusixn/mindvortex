#!/usr/bin/env bash
set -Eeuo pipefail
[[ $EUID == 0 ]] || { echo 'Run as root'; exit 1; }
export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y ca-certificates curl git nginx xz-utils build-essential python3 certbot python3-certbot-nginx
if ! id mindvortex >/dev/null 2>&1; then
  useradd --system --user-group --home-dir /opt/mindvortex --create-home --shell /usr/sbin/nologin mindvortex
fi
install -d -o mindvortex -g mindvortex -m 0750 /opt/mindvortex/releases
if [[ ! -x /opt/node-mindvortex/bin/node ]]; then
  case "$(uname -m)" in x86_64) arch=x64 ;; aarch64) arch=arm64 ;; *) exit 1 ;; esac
  tmp="$(mktemp -d)"
  index=https://nodejs.org/dist/latest-v24.x
  curl -fsSL "$index/SHASUMS256.txt" -o "$tmp/SHASUMS256.txt"
  archive="$(awk -v arch="$arch" '$2 ~ ("node-v[0-9.]+-linux-" arch "\\.tar\\.xz$") {print $2; exit}' "$tmp/SHASUMS256.txt")"
  test -n "$archive"
  curl -fsSL "$index/$archive" -o "$tmp/$archive"
  (cd "$tmp"; grep " $archive$" SHASUMS256.txt | sha256sum --check --strict)
  install -d -m 0755 /opt/node-mindvortex
  tar -xJf "$tmp/$archive" --strip-components=1 -C /opt/node-mindvortex
fi
/opt/node-mindvortex/bin/node --version
