from pathlib import Path
p=Path('/etc/nginx/sites-available/mindvortex');s=p.read_text()
if 'limit_req zone=mv_social' not in s:
 s=s.replace('    location /studio-social {','''    location /studio-social {
        limit_req zone=mv_social burst=60 nodelay;
        limit_req_status 429;
        add_header X-Content-Type-Options nosniff always;
        add_header X-Frame-Options DENY always;
        add_header Referrer-Policy same-origin always;
        add_header Cache-Control "no-store" always;
        add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://*.cdninstagram.com https://*.fbcdn.net; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'" always;''')
 Path('/etc/nginx/sites-available/mindvortex.before-hardening').write_text(p.read_text());p.write_text(s)
Path('/etc/nginx/conf.d/mindvortex-social-limits.conf').write_text('limit_req_zone $binary_remote_addr zone=mv_social:10m rate=5r/s;\n')
