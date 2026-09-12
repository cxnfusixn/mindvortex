import {createRequire} from 'node:module';
import fs from 'node:fs/promises';
const require=createRequire(new URL('../../package.json',import.meta.url));
const {chromium}=require('@playwright/test');
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({httpCredentials:{username:'studio',password:process.env.SOCIAL_ADMIN_PASSWORD}});
await fs.mkdir('qa',{recursive:true});
const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto('https://mindvortex.pro/studio-social');
await page.getByRole('heading',{name:'Następne publikacje'}).waitFor();
await page.locator('.card img').first().waitFor();
await page.evaluate(async()=>{await Promise.all([...document.images].map(img=>img.decode()));});
if(await page.locator('.card img').evaluateAll(imgs=>imgs.some(img=>!img.naturalWidth)))throw Error('Broken post image');
for(const width of [1440,390]){await page.setViewportSize({width,height:1000});await page.screenshot({path:`qa/dashboard-${width}.png`,fullPage:true});const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);if(overflow)throw Error('Horizontal overflow at '+width);}
await page.getByRole('button',{name:'Podgląd feedu',exact:true}).click();await page.screenshot({path:'qa/feed-mobile.png',fullPage:true});
await page.getByRole('button',{name:/Kolejka/}).click();
if(await page.getByRole('button',{name:'Edytuj',exact:true}).count()){await page.getByRole('button',{name:'Edytuj',exact:true}).first().click();await page.getByRole('dialog').waitFor();await page.screenshot({path:'qa/editor-mobile.png'});await page.getByRole('button',{name:'Anuluj',exact:true}).click();}
await browser.close();if(errors.length)throw Error(errors.join('; '));console.log('Dashboard, feed, editor and responsive widths verified.');
