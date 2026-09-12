#!/usr/bin/env bash
# Deploy a tested static preview while preserving the active portfolio application.
# sudo bash deploy/preview-release.sh /absolute/preview.tar flc FULL_COMMIT_HASH
set -Eeuo pipefail
[[ $EUID == 0 ]] || { echo 'Run as root'; exit 1; }
archive="$(realpath "${1:?Preview archive required}")"
project="${2:?Preview project required}"
revision="${3:?Commit hash required}"
[[ "$project" =~ ^(flc|marcin-bak|kierunek)$ ]]
[[ "$revision" =~ ^[a-f0-9]{40}$ ]]
exec 9>/run/lock/mindvortex-deploy.lock
flock -n 9 || { echo 'A deployment is already running'; exit 1; }
root=/opt/mindvortex
previous="$(readlink -f "$root/current")"
[[ "$previous" == "$root"/releases/*/.next/standalone ]]
test -f "$previous/server.js"
release="$root/releases/$(date -u +%Y%m%d%H%M%S)-preview-$project"
test ! -e "$release"
install -d -m 0750 "$release/.next"
standalone="$release/.next/standalone"
cp -a "$previous" "$standalone"
# Preserve application revision; preview revisions are recorded separately.
cp "$previous/../../REVISION" "$release/REVISION"
if [[ -d "$previous/../../preview-revisions" ]]; then
  cp -a "$previous/../../preview-revisions" "$release/"
fi
mkdir -p "$release/preview-revisions"
printf '%s\n' "$revision" > "$release/preview-revisions/$project"
destination="$standalone/public/previews/$project"
[[ "$(realpath "$destination")" == "$release/.next/standalone/public/previews/$project" ]]
rm -rf -- "$destination"
mkdir -p "$destination"
# Archives are made locally from the selected generated preview only.
tar -xf "$archive" -C "$destination" --no-same-owner
test -s "$destination/index.html"
test -d "$destination/_next/static"
chown -R mindvortex:mindvortex "$release"
ln -sfn "$standalone" "$root/current.new"
mv -Tf "$root/current.new" "$root/current"
healthy=0
if systemctl restart mindvortex; then
  for attempt in {1..30}; do
    if curl --fail --silent --max-time 3 "http://127.0.0.1:3001/previews/$project/" >/dev/null &&
       curl --fail --silent --max-time 3 http://127.0.0.1:3001/api/health >/dev/null; then
      healthy=1; break
    fi
    sleep 2
  done
fi
if [[ "$healthy" == 1 ]]; then
  echo "Deployed preview $project at $revision to $release"
  exit 0
fi
ln -sfn "$previous" "$root/current.new"
mv -Tf "$root/current.new" "$root/current"
systemctl restart mindvortex
echo 'Preview deployment failed; restored previous release'
exit 1
