import fs from 'node:fs/promises';import {chromium} from '@playwright/test';
const data=JSON.parse(await fs.readFile('qa/social-api.json','utf8')),browser=await chromium.launch();
try{const page=await browser.newPage({viewport:{width:1800,height:650}});let i=0;for(const job of data.tiktokJobs.filter(p=>p.kind==='carousel')){
await page.setContent('<html><body style="margin:0;background:#050706;color:white;font:18px sans-serif"><p style="padding-left:16px">'+job.day+' · '+job.content.topic+'</p><div style="display:flex">'+job.assets.map((a,i)=>'<img alt="Slide '+(i+1)+'" width="600" height="600" src="https://mindvortex.pro/studio-social/media/'+a+'">').join('')+'</div></body></html>');await page.locator('img').evaluateAll(imgs=>Promise.all(imgs.map(i=>i.decode())));await page.screenshot({path:'qa/carousel-'+(++i)+'.png'});console.log({day:job.day,caption:job.content.caption,hashtags:job.content.hashtags});}
}finally{await browser.close();}
