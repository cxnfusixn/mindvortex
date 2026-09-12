import fs from 'node:fs/promises';import {chromium} from '@playwright/test';
const browser=await chromium.launch(),context=await browser.newContext();
try{
await context.addCookies([{name:'__Secure-mv-social-session',value:(await fs.readFile('.env.reels-qa-token','utf8')).trim(),domain:'mindvortex.pro',path:'/studio-social',secure:true,httpOnly:true,sameSite:'Strict'}]);
const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto('https://mindvortex.pro/studio-social');await page.getByRole('button',{name:'Metryki',exact:true}).click();await page.getByRole('heading',{name:'Co działa najlepiej?'}).waitFor();
for(const width of [1440,390]){await page.setViewportSize({width,height:1000});await page.locator('.metrics-panel').scrollIntoViewIfNeeded();await page.screenshot({path:`qa/metrics-${width}.png`});if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error('Page horizontal overflow');}
await page.getByRole('combobox',{name:'Format',exact:true}).selectOption('reel');if(await page.locator('tbody tr').count()!==1)throw Error('Reel filter failed');
await page.getByRole('combobox',{name:'Format',exact:true}).selectOption('all');await page.getByRole('combobox',{name:'Sortowanie',exact:true}).selectOption('views');
for(const width of [1440,390]){await page.setViewportSize({width,height:1000});await page.locator('.chart-panels').screenshot({path:`qa/charts-${width}.png`});if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error('Chart page overflow');}
await page.getByRole('button',{name:'TikTok',exact:true}).click();await page.getByRole('heading',{name:'Rolka codziennie',exact:true}).waitFor();await page.getByRole('button',{name:'Metryki',exact:true}).click();
if(await page.locator('tbody tr').count()!==1)throw Error('TikTok platform isolation failed');
if((await page.locator('tbody').innerText()).includes('Instagram'))throw Error('Mixed metrics');
await page.getByRole('button',{name:'Posty',exact:true}).click();await page.getByRole('heading',{name:'Karuzele · trzy powiązane posty'}).waitFor();
await page.getByRole('button',{name:'Instagram',exact:true}).click();await page.getByRole('heading',{name:'Następne publikacje'}).waitFor();
console.log({rows:await page.locator('tbody tr').count(),errors,filter:'passed',mobile:'table scroll contained'});
if(errors.length)throw Error('Browser errors');
}finally{await browser.close();}
