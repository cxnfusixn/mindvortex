# Mind Vortex / OVH

Production: https://mindvortex.pro (`www` redirects to the apex). VPS: `ubuntu@51.83.185.27`. First production app release: `ac96eb56d41f5db52f65c860e378a05bc9ee7d03`, deployed on 2026-09-06. HTTPS, both languages, live previews, SMTP acceptance and the certificate renewal dry run were checked. The certificate renews through `certbot.timer`.

Operational checks: `sudo systemctl status mindvortex nginx`, `curl -fsS http://127.0.0.1:3001/api/health`, `sudo journalctl -u mindvortex -n 80 --no-pager`. The active release is `/opt/mindvortex/current`; private SMTP configuration is `/etc/mindvortex.env`.

Target: Ubuntu 24.04, `mindvortex.pro` and `www.mindvortex.pro`, system user/service `mindvortex`, local port **3001**, separate Node 24 at `/opt/node-mindvortex`. Source repositories for the embedded previews and Sanity credentials are not needed on the server.

1. Run `sudo bash deploy/bootstrap.sh` once. It installs host packages and an isolated Node runtime, without replacing the global Node installation.
2. Install `deploy/mindvortex.service` into `/etc/systemd/system/`, then `sudo systemctl daemon-reload`.
3. Create `/etc/mindvortex.env`, owned by `root:mindvortex`, mode `0640`. Use `.env.example` with the real SMTP password, `NEXT_PUBLIC_SITE_URL=https://mindvortex.pro`, `SMTP_PORT=465`, and `SMTP_FROM=patryk.pyrka@mindvortex.pro`. Never source this file as shell code. systemd loads it for the build and service. `CONTACT_EMAIL` is not used; the recipient is configured in `src/data/site.ts`.
4. Export the committed source using `git archive --format=tar -o mindvortex-source.tar HEAD` and transfer it over SSH. Run `sudo bash deploy/release.sh /absolute/path/mindvortex-source.tar FULL_COMMIT_HASH`. The script builds a separate release, copies `public` and `.next/static`, switches the current symlink and checks `/api/health`. Failed activation restores the previous release when available. Releases remain for rollback; no existing release is deleted.
5. Install `deploy/nginx.conf` as `/etc/nginx/sites-available/mindvortex` and enable it using a symlink in `sites-enabled`. Run `sudo nginx -t` before reloading. Preserve other sites. The config overwrites incoming forwarded IP headers so clients cannot bypass the contact limiter with a forged header.
6. After both DNS names resolve to the server and HTTP is reachable: `sudo certbot --nginx -d mindvortex.pro -d www.mindvortex.pro --email patryk.pyrka@mindvortex.pro --agree-tos --redirect --non-interactive`. Do not replace the Nginx file with the HTTP template after Certbot modifies it.
7. Check HTTPS `/api/health`, `/pl`, `/en`, both `/previews/.../` paths and mail submission. Keep the `www` to apex redirect in the HTTPS block so all contact requests use the canonical origin. Run `sudo certbot renew --dry-run --no-random-sleep-on-renew` and check its renewal timer.

For updates, repeat step 4 with a new committed archive. `REVISION` records the full Git hash. Builds happen on Linux; never deploy Windows `node_modules` or a Windows standalone build. A restart briefly interrupts service. SMTP changes require a service restart; public URL changes require a rebuild. Keep a private backup of `/etc/mindvortex.env` and the live Nginx TLS configuration.

Standalone packaging follows the [Next.js output documentation](https://nextjs.org/docs/app/api-reference/config/next-config-js/output).

For a preview-only refresh, export and test the selected preview locally. Create an archive containing the contents of `public/previews/flc`, transfer it and `deploy/preview-release.sh`, then run `sudo bash preview-release.sh /absolute/preview.tar flc FULL_COMMIT_HASH`. This clones the active standalone application into a new release, replaces only the chosen preview, restarts and health-checks with rollback. Application `REVISION` stays unchanged; the selected preview's commit is recorded in `preview-revisions/flc`. Other unshipped application changes are not deployed. The preview must use the existing route prefix and rewrites.
