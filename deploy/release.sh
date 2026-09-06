#!/usr/bin/env bash
# sudo bash deploy/release.sh /absolute/path/source.tar FULL_COMMIT_HASH
set -Eeuo pipefail
[[ $EUID == 0 ]] || { echo 'Run as root'; exit 1; }
archive="$(realpath "${1:?Source archive required}")"
revision="${2:?Commit hash required}"
[[ "$revision" =~ ^[a-f0-9]{40}$ ]]
exec 9>/run/lock/mindvortex-deploy.lock
flock -n 9 || { echo 'A deployment is already running'; exit 1; }
root=/opt/mindvortex
release_id="$(date -u +%Y%m%d%H%M%S)"
release="$root/releases/$release_id"
previous="$(readlink -f "$root/current" || true)"
test ! -e "$release"
test -s /etc/mindvortex.env
install -d -o mindvortex -g mindvortex -m 0750 "$release"
tar -xf "$archive" -C "$release"
printf '%s\n' "$revision" > "$release/REVISION"
chown -R mindvortex:mindvortex "$release"
systemd-run --wait --pipe --collect --unit="mindvortex-build-$release_id" \
  --property=User=mindvortex --property=Group=mindvortex \
  --property="WorkingDirectory=$release" --property=EnvironmentFile=/etc/mindvortex.env \
  --setenv=PATH=/opt/node-mindvortex/bin:/usr/local/bin:/usr/bin:/bin \
  --setenv=npm_config_cache=/opt/mindvortex/.npm --setenv=NODE_ENV=production \
  /bin/bash -c 'set -Eeuo pipefail; npm ci --include=dev; npm run lint; npm run build'
standalone="$release/.next/standalone"
test -f "$standalone/server.js"
cp -a "$release/public" "$standalone/"
mkdir -p "$standalone/.next"
cp -a "$release/.next/static" "$standalone/.next/"
# Next may trace env files if present; the release must use the private systemd env only.
test ! -f "$standalone/.env.local"
chown -R mindvortex:mindvortex "$standalone"
ln -sfn "$standalone" "$root/current.new"
mv -Tf "$root/current.new" "$root/current"
healthy=0
if systemctl restart mindvortex; then
  for attempt in {1..30}; do
    if [[ "$(curl -s -o /dev/null -w '%{http_code}' --max-time 3 http://127.0.0.1:3001/api/health)" == 200 ]]; then healthy=1; break; fi
    sleep 2
  done
fi
if [[ "$healthy" == 1 ]]; then
  systemctl enable mindvortex
  echo "Deployed $revision as $release_id"
  exit 0
fi
if [[ "$previous" == "$root"/releases/*/.next/standalone && -f "$previous/server.js" ]]; then
  ln -sfn "$previous" "$root/current.new"
  mv -Tf "$root/current.new" "$root/current"
  systemctl restart mindvortex
  echo 'Restored previous release'
else
  systemctl stop mindvortex
fi
echo 'Deployment failed; inspect journalctl -u mindvortex'
exit 1
