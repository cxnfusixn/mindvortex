#!/usr/bin/env bash
set -Eeuo pipefail
umask 077
install -d -m 700 /var/backups/mindvortex-social
stamp=$(date -u +%Y%m%dT%H%M%SZ)
work=$(mktemp -d /var/backups/mindvortex-social/.work-XXXXXXXX)
trap 'rm -rf -- "$work"' EXIT
sudo -u postgres pg_dump -Fc mindvortex_social > "$work/database.dump"
tar -czf "$work/media.tar.gz" -C /var/lib/mindvortex-social media
cp /etc/mindvortex-social.env "$work/service.env"
tar -cf - -C "$work" database.dump media.tar.gz service.env | openssl enc -aes-256-cbc -salt -pbkdf2 -iter 200000 -pass file:/root/mindvortex-social-backup.key -out "/var/backups/mindvortex-social/$stamp.enc"
sha256sum "/var/backups/mindvortex-social/$stamp.enc" > "/var/backups/mindvortex-social/$stamp.enc.sha256"
find /var/backups/mindvortex-social -maxdepth 1 -type f -name '*.enc*' -mtime +14 -delete
