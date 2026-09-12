#!/usr/bin/env bash
set -Eeuo pipefail
exec 9>/run/lock/mindvortex-social-deploy.lock
flock -n 9
release="/opt/mindvortex-social/releases/$(date -u +%Y%m%d%H%M%S)"
previous="$(readlink -f /opt/mindvortex-social/current)"
id mv-social >/dev/null 2>&1 || useradd --system --home /var/lib/mindvortex-social --shell /usr/sbin/nologin mv-social
install -d -o mv-social -g mv-social -m 0700 /var/lib/mindvortex-social
install -d -o mv-social -g mv-social "$release"
tar -xzf /home/ubuntu/.social-deploy.tar.gz -C "$release"
chown -R mv-social:mv-social "$release"
cd "$release"
sudo -u mv-social env PATH="/opt/node-mindvortex/bin:$PATH" npm ci --no-audit --no-fund
sudo -u mv-social env PATH="/opt/node-mindvortex/bin:$PATH" npm test
sudo -u mv-social env PATH="/opt/node-mindvortex/bin:$PATH" npm run build
cp -p /etc/mindvortex-social.env /root/mindvortex-social.env.before-security
chmod 600 /root/mindvortex-social.env.before-security
systemctl stop mindvortex-social-worker mindvortex-social
/opt/node-mindvortex/bin/node harden-env.mjs
chown root:mv-social /etc/mindvortex-social.env
chmod 640 /etc/mindvortex-social.env
chown -R mv-social:mv-social /var/lib/mindvortex-social
sudo -u mv-social /opt/node-mindvortex/bin/node --env-file=/etc/mindvortex-social.env --input-type=module -e 'const {init,pool}=await import("./lib/db.mjs");await init();await pool.end();'
chown -R root:mv-social "$release"
chmod -R g-w,o-rwx "$release"
ln -sfn "$release" /opt/mindvortex-social/current
install -m 644 deploy-web.service /etc/systemd/system/mindvortex-social.service
install -m 644 deploy-worker.service /etc/systemd/system/mindvortex-social-worker.service
systemctl daemon-reload
systemctl restart mindvortex-social
for i in {1..20}; do
 if curl -fsS http://127.0.0.1:3020/studio-social/login >/dev/null; then echo "Secure release active: $release"; exit 0; fi
 sleep 1
done
echo "Activation failed. Previous release: $previous. Worker remains stopped for inspection."
exit 1
