import fs from 'node:fs/promises';
const p=new URL('./captions.md',import.meta.url);
let s=await fs.readFile(p,'utf8');
s=s.slice(0,s.indexOf('## Completion checklist'));
s=s.replace(/Status:.*\n/,'Status: replacement publication in progress. Publish 01 first (oldest) through 08 last (newest).\n');
s=s.replace('I’m Patryk, the person behind Mind Vortex.','Mind Vortex is an independent digital studio bringing design and development together.').replace('I bring design and development together to create','We create').replace('Here, I’ll share my work, explain the decisions behind it and show how visual details connect with what happens under the hood.','Here, we share our work and the thinking behind it: how a website looks, how it works and how it represents your business.').replaceAll('Send me','Send us').replaceAll('Tell me','Tell us').replaceAll('tell me','tell us').replaceAll('I design','we design').replaceAll('I created','we created');
await fs.writeFile(p,s);
