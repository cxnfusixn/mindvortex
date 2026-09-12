from pathlib import Path
import os
incoming=Path('/home/ubuntu/.buffer-incoming')
try:
    lines=incoming.read_text(encoding='utf-8-sig').splitlines()
    token=next(line.split('=',1)[1].strip() for line in lines if line.startswith('BUFFER_API_KEY='))
    if len(token)<20 or any(c.isspace() for c in token): raise ValueError('Invalid Buffer key file')
    target=Path('/etc/mindvortex-social.env')
    values={'BUFFER_API_KEY':token,'BUFFER_TIKTOK_CHANNEL_ID':'6aa44144cd8b9c702c4f2f4c','BUFFER_ORGANIZATION_ID':'6aa44066ad2abb79fc51766e'}
    current=[line for line in target.read_text().splitlines() if line.split('=',1)[0] not in values]
    target.write_text('\n'.join(current+[key+'='+value for key,value in values.items()])+'\n')
    print('Buffer server configuration installed; credentials omitted')
finally:
    incoming.unlink(missing_ok=True)
