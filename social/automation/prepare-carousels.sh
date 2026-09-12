#!/usr/bin/env bash
set -euo pipefail
cd /opt/mindvortex-social/current
sudo -u mv-social /opt/node-mindvortex/bin/node --env-file=/etc/mindvortex-social.env seed-tiktok.mjs --carousels
