import fs from 'node:fs/promises';
let file='social/automation/app/page.js',s=await fs.readFile(file,'utf8');s=s.replace("setFormat(key==='tiktok'?'reels':'posts');","setFormat(current=>current==='metrics'?'metrics':key==='tiktok'?'reels':'posts');");await fs.writeFile(file,s);
file='social/automation/app/MetricsPanel.js';s=await fs.readFile(file,'utf8');s=s.replace('<h2>Co działa najlepiej?</h2>',"<h2>Metryki · {platform==='tiktok'?'TikTok':'Instagram'}</h2>");await fs.writeFile(file,s);
