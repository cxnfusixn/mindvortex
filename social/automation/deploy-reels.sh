#!/usr/bin/env bash
set -Eeuo pipefail
exec 9>/run/lock/mindvortex-social-deploy.lock
flock -n 9
release="/opt/mindvortex-social/releases/$(date -u +%Y%m%d%H%M%S)"
previous="$(readlink -f /opt/mindvortex-social/current)"
id mv-social-build >/dev/null 2>&1 || useradd --system --user-group --home-dir /var/cache/mv-social-build --create-home --shell /usr/sbin/nologin mv-social-build
install -d -o mv-social-build -g mv-social-build -m 0750 "$release"
tar -xzf /home/ubuntu/.social-deploy.tar.gz -C "$release"
chown -R mv-social-build:mv-social-build "$release"
cd "$release"
test -f 'app/media/[file]/route.js'
python3 prune-releases.py
systemd-run --wait --pipe --collect --unit="mv-social-build-$(date +%s)" \
  --property=User=mv-social-build --property=Group=mv-social-build \
  --property="WorkingDirectory=$release" --property=ProtectSystem=strict --property=ProtectHome=true \
  --property=NoNewPrivileges=true --property=PrivateTmp=true \
  --property="ReadWritePaths=$release /var/cache/mv-social-build" \
  --property="InaccessiblePaths=-/etc/mindvortex.env -/etc/mindvortex-prospecting.env -/etc/mindvortex-social.env -/var/lib/mindvortex-social -/var/lib/mindvortex-prospecting" \
  --setenv=PATH=/opt/node-mindvortex/bin:/usr/local/bin:/usr/bin:/bin \
  --setenv=HOME=/var/cache/mv-social-build --setenv=npm_config_cache=/var/cache/mv-social-build/npm --setenv=NODE_ENV=production \
  /bin/bash -c 'set -Eeuo pipefail; npm ci --ignore-scripts; npm audit --audit-level=high; npm test; npm run build'
chown -R root:mv-social "$release"
chmod -R g-w,o-rwx "$release"
sudo -u mv-social /opt/node-mindvortex/bin/node --env-file=/etc/mindvortex-social.env --input-type=module -e 'const {init,pool}=await import("./lib/db.mjs");await init();await pool.end();'
sudo -u mv-social /opt/node-mindvortex/bin/node --env-file=/etc/mindvortex-social.env tests/growth.integration.mjs
sudo -u mv-social /opt/node-mindvortex/bin/node --env-file=/etc/mindvortex-social.env seed-metric-history.mjs
sudo -u mv-social /opt/node-mindvortex/bin/node --env-file=/etc/mindvortex-social.env seed-tiktok.mjs
sudo -u mv-social /opt/node-mindvortex/bin/node --env-file=/etc/mindvortex-social.env set-reel-cadence.mjs
chown -R root:mv-social "$release"
chmod -R g-w,o-rwx "$release"
if [[ "${1:-}" != "--web-only" ]]; then systemctl stop mindvortex-social-worker; fi
sudo -u mv-social /opt/node-mindvortex/bin/node --env-file=/etc/mindvortex-social.env set-carousel-cadence.mjs
ln -sfn "$release" /opt/mindvortex-social/current
systemctl restart mindvortex-social
for i in {1..25}; do
 if curl -fsS http://127.0.0.1:3020/studio-social/login >/dev/null; then if [[ "${1:-}" != "--web-only" ]]; then systemctl start mindvortex-social-worker; fi; echo "Release active: $release"; exit 0; fi
 sleep 1
done
ln -sfn "$previous" /opt/mindvortex-social/current
systemctl restart mindvortex-social mindvortex-social-worker
echo "Rolled back to $previous" >&2
exit 1
