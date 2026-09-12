#!/usr/bin/env bash
set -Eeuo pipefail
exec 9>/run/lock/mindvortex-social-deploy.lock
flock -n 9
release="/opt/mindvortex-social/releases/$(date -u +%Y%m%d%H%M%S)"
previous="$(readlink -f /opt/mindvortex-social/current)"
install -d -o mv-social -g mv-social "$release"
tar -xzf /home/ubuntu/.social-deploy.tar.gz -C "$release"
chown -R mv-social:mv-social "$release"
cd "$release"
test -f 'app/media/[file]/route.js'
python3 prune-releases.py
sudo -u mv-social env PATH="/opt/node-mindvortex/bin:$PATH" npm ci --no-audit --no-fund
sudo -u mv-social env PATH="/opt/node-mindvortex/bin:$PATH" npm test
sudo -u mv-social env PATH="/opt/node-mindvortex/bin:$PATH" npm run build
sudo -u mv-social /opt/node-mindvortex/bin/node --env-file=/etc/mindvortex-social.env --input-type=module -e 'const {init,pool}=await import("./lib/db.mjs");await init();await pool.end();'
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
