from pathlib import Path
import shutil
p=Path('/etc/nginx/sites-available/mindvortex')
s=p.read_text()
marker='    location / {\n'
block='''    location /studio-social {
        proxy_pass http://127.0.0.1:3020;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 900s;
        client_max_body_size 24k;
        add_header X-Robots-Tag "noindex, nofollow" always;
    }

'''
if 'location /studio-social' not in s:
    if s.count(marker)!=1: raise RuntimeError('Unexpected nginx configuration')
    backup=Path('/etc/nginx/sites-available/mindvortex.before-social')
    if not backup.exists(): shutil.copy2(p,backup)
    p.write_text(s.replace(marker,block+marker,1))
