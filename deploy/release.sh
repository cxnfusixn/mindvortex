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
chown root:root "$root" "$root/releases"
chmod 755 "$root" "$root/releases"
release_id="$(date -u +%Y%m%d%H%M%S)"
release="$root/releases/$release_id"
previous="$(readlink -f "$root/current" || true)"
test ! -e "$release"
test -s /etc/mindvortex.env
id mv-site-build >/dev/null 2>&1 || useradd --system --user-group --home-dir /var/cache/mv-site-build --create-home --shell /usr/sbin/nologin mv-site-build
install -d -o mv-site-build -g mv-site-build -m 0750 "$release"
tar -xf "$archive" -C "$release"
printf '%s\n' "$revision" > "$release/REVISION"
operations=$(mktemp -d /run/mv-site-deploy.XXXXXXXX)
cp "$release/deploy/mindvortex.service" "$release/deploy/mindvortex-prospecting-worker.service" "$operations/"
chown -R mv-site-build:mv-site-build "$release"
install -d -o mv-site-build -g mv-site-build -m 0750 "$root/browsers"
chown -R mv-site-build:mindvortex "$root/browsers"
systemd-run --wait --pipe --collect --unit="mindvortex-build-$release_id" \
  --property=User=mv-site-build --property=Group=mv-site-build \
  --property="WorkingDirectory=$release" --property=ProtectSystem=strict --property=ProtectHome=true \
  --property=NoNewPrivileges=true --property=PrivateTmp=true \
  --property="ReadWritePaths=$release /var/cache/mv-site-build $root/browsers" \
  --property="InaccessiblePaths=-/etc/mindvortex.env -/etc/mindvortex-prospecting.env -/etc/mindvortex-social.env -/var/lib/mindvortex-prospecting -/var/lib/mindvortex-social" \
  --setenv=NEXT_PUBLIC_PREVIEW_ORIGIN="${3:-}" \
  --setenv=PATH=/opt/node-mindvortex/bin:/usr/local/bin:/usr/bin:/bin \
  --setenv=PLAYWRIGHT_BROWSERS_PATH="$root/browsers" --setenv=HOME=/var/cache/mv-site-build --setenv=npm_config_cache=/var/cache/mv-site-build/npm --setenv=NODE_ENV=production \
  /bin/bash -c 'set -Eeuo pipefail; npm ci --include=dev --ignore-scripts; npm audit --audit-level=high; npm run lint; npm run typecheck; npm run build; node node_modules/playwright/cli.js install chromium'
chown -R root:mindvortex "$root/browsers"
chmod -R g-w,o-rwx "$root/browsers"

standalone="$release/.next/standalone"
[[ "$(realpath "$standalone")" == "$standalone" ]]
[[ ! -L "$standalone/public" && ! -L "$standalone/prospecting" && ! -L "$standalone/.next" ]]
test -f "$standalone/server.js"
cp -a "$release/public" "$standalone/"
mkdir -p "$standalone/.next"
cp -a "$release/.next/static" "$standalone/.next/"
cp -a "$release/prospecting" "$standalone/"
# Next may trace env files if present; the release must use the private systemd env only.
test ! -f "$standalone/.env.local"
chown -R root:mindvortex "$release"
chmod -R g-w,o-rwx "$release"
[[ ! -L "$standalone/.next/cache" ]]
install -d -o mindvortex -g mindvortex -m 0700 "$standalone/.next/cache"
chown -R mindvortex:mindvortex "$standalone/.next/cache"
worker_active=0
if systemctl is-active --quiet mindvortex-prospecting-worker; then
  worker_active=1
  systemctl stop mindvortex-prospecting-worker
fi
ln -sfn "$standalone" "$root/current.new"
mv -Tf "$root/current.new" "$root/current"
install -m 644 "$operations/mindvortex.service" /etc/systemd/system/mindvortex.service
install -m 644 "$operations/mindvortex-prospecting-worker.service" /etc/systemd/system/mindvortex-prospecting-worker.service
systemctl daemon-reload
healthy=0
if systemctl restart mindvortex; then
  for attempt in {1..30}; do
    if [[ "$(curl -s -o /dev/null -w '%{http_code}' --max-time 3 http://127.0.0.1:3001/api/health)" == 200 ]]; then healthy=1; break; fi
    sleep 2
  done
fi
if [[ "$healthy" == 1 ]]; then
  if [[ "$worker_active" == 1 ]]; then systemctl start mindvortex-prospecting-worker; fi
  systemctl enable mindvortex
  echo "Deployed $revision as $release_id"
  exit 0
fi
if [[ "$previous" == "$root"/releases/*/.next/standalone && -f "$previous/server.js" ]]; then
  ln -sfn "$previous" "$root/current.new"
  mv -Tf "$root/current.new" "$root/current"
  systemctl restart mindvortex
  if [[ "$worker_active" == 1 ]]; then systemctl start mindvortex-prospecting-worker; fi
  echo 'Restored previous release'
else
  systemctl stop mindvortex
fi
echo 'Deployment failed; inspect journalctl -u mindvortex'
exit 1
