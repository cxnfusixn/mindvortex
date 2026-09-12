#!/usr/bin/env bash
set -Eeuo pipefail
if [[ ! -s /root/mindvortex-social-backup.key ]]; then umask 077; openssl rand -hex 32 >/root/mindvortex-social-backup.key; fi
install -m 700 /opt/mindvortex-social/current/backup.sh /usr/local/sbin/mindvortex-social-backup
sed -i '1s/^\xEF\xBB\xBF//;s/\r$//' /usr/local/sbin/mindvortex-social-backup
cat >/etc/systemd/system/mindvortex-social-backup.service <<'UNIT'
[Unit]
Description=Encrypted Mind Vortex Social backup
[Service]
Type=oneshot
ExecStart=/usr/local/sbin/mindvortex-social-backup
UNIT
cat >/etc/systemd/system/mindvortex-social-backup.timer <<'UNIT'
[Unit]
Description=Daily social database and media backup
[Timer]
OnCalendar=*-*-* 03:15:00
Persistent=true
[Install]
WantedBy=timers.target
UNIT
cat >/etc/systemd/system/mindvortex-social-monitor.service <<'UNIT'
[Unit]
Description=Mind Vortex Social health monitor
[Service]
Type=oneshot
User=mv-social
Group=mv-social
WorkingDirectory=/opt/mindvortex-social/current
EnvironmentFile=/etc/mindvortex-social.env
ExecStart=/opt/node-mindvortex/bin/node monitor.mjs
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=true
PrivateTmp=true
ReadWritePaths=/var/lib/mindvortex-social
UNIT
cat >/etc/systemd/system/mindvortex-social-monitor.timer <<'UNIT'
[Unit]
Description=Monitor social service every five minutes
[Timer]
OnBootSec=10min
OnUnitActiveSec=5min
[Install]
WantedBy=timers.target
UNIT
systemctl daemon-reload
systemctl enable --now mindvortex-social-backup.timer
systemctl start mindvortex-social-backup.service
# Same-host backup restore drill: a separate database, no application attached.
work=$(mktemp -d /root/social-restore-XXXXXXXX)
trap 'rm -rf -- "$work"' EXIT
file=$(find /var/backups/mindvortex-social -maxdepth 1 -name '*.enc' | sort | tail -1)
openssl enc -d -aes-256-cbc -pbkdf2 -iter 200000 -pass file:/root/mindvortex-social-backup.key -in "$file" | tar -xf - -C "$work"
sudo -u postgres createdb mv_social_restore_check
cat "$work/database.dump" | sudo -u postgres pg_restore --no-owner --no-acl --exit-on-error -d mv_social_restore_check
sudo -u postgres psql -d mv_social_restore_check -Atc 'SELECT count(*) FROM social_history; SELECT count(*) FROM social_posts;'
sudo -u postgres dropdb mv_social_restore_check
printf 'Backup restore passed\n'
