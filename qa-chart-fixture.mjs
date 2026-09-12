// Isolated browser-only fixture: never writes analytics or publications to production.
import fs from 'node:fs/promises';import assert from 'node:assert/strict';import {chromium} from '@playwright/test';
const browser=await chromium.launch(),context=await browser.newContext();
try{await context.addCookies([{name:'__Secure-mv-social-session',value:(await fs.readFile('.env.reels-qa-token','utf8')).trim(),domain:'mindvortex.pro',path:'/studio-social',secure:true,httpOnly:true,sameSite:'Strict'}]);
const response=await context.request.get('https://mindvortex.pro/studio-social/api');assert.equal(response.status(),200);const data=await response.json();await fs.writeFile('qa/social-api.json',JSON.stringify(data));
const row=data.analytics.find(p=>p.platform==='instagram'),now=Date.now();row.metrics={views:120,likes:6,comments:2,saved:1,shares:1,collectedAt:new Date(now).toISOString()};
data.metricSamples=[10,60,120].map((views,i)=>({media_id:row.media_id,bucket:new Date(now-(2-i)*3600000).toISOString(),metrics:{views,likes:i*3,comments:i}}));
const page=await context.newPage();await page.route('**/studio-social/api',route=>route.fulfill({json:data}));await page.goto('https://mindvortex.pro/studio-social');await page.getByRole('button',{name:'Metryki',exact:true}).click();
await page.locator('.chart-panels').waitFor();assert.equal((await page.locator('.chart-card polyline').first().getAttribute('points')).split(' ').length,3);assert.equal(await page.locator('.donut-layout circle').count(),5);
await page.getByRole('combobox',{name:'Metryka wykresu liniowego'}).selectOption('comments');assert.match(await page.locator('.chart-reading').innerText(),/^2/);
await page.setViewportSize({width:390,height:1000});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await page.locator('.chart-panels').screenshot({path:'qa/chart-fixture-mobile.png'});
console.log('Fixture passed: three-point line, four donut sectors, metric switch, mobile containment');
}finally{await browser.close();}
