import fs from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {chromium} from '@playwright/test';
import {createRequire} from 'node:module';
const require=createRequire(new URL('./social/automation/package.json',import.meta.url));
const sharp=require('sharp');
import {openSync} from './social/automation/node_modules/fontkit/dist/module.mjs';
const dir='social/reels/flc/v2',fps=30,duration=20;
await fs.mkdir(dir,{recursive:true});
const ff='social/reels/runtime/imageio_ffmpeg/binaries/ffmpeg-win-x86_64-v7.1.exe';
const mono=openSync('social/automation/public/fonts/mono.woff2'),regular=openSync('social/automation/public/fonts/mono-regular.woff2'),geist=openSync('social/automation/public/fonts/geist.woff2');
const symbol=await fs.readFile('public/brand/mv-symbol.svg','utf8');const inner=symbol.slice(symbol.indexOf('<g'),symbol.lastIndexOf('</svg>'));
function text(s,x,y,size=28,color='#F1F3EF',font=mono){let cursor=0;const scale=size/font.unitsPerEm,run=font.layout(s),track=font===mono?-size*.06:0;return `<g fill="${color}" transform="translate(${x} ${y})">`+run.glyphs.map((g,i)=>{const p=run.positions[i],v=`<path transform="translate(${cursor+p.xOffset*scale} ${-p.yOffset*scale}) scale(${scale} ${-scale})" d="${g.path.toSVG()}"/>`;cursor+=p.xAdvance*scale+track;return v;}).join('')+'</g>';}
const logo=(x,y,size,rotation=0)=>`<g transform="rotate(${rotation} ${x+size/2} ${y+size/2})"><svg x="${x}" y="${y}" width="${size}" height="${size}" viewBox="385 235 530 530">${inner}</svg></g>`;
const svg=body=>Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920"><rect width="1080" height="1920" fill="#050706"/>${body}</svg>`);
const header=logo(72,144,54)+text('MIND VORTEX',145,183,31)+text('DESIGN × DEVELOPMENT',590,180,22,'#929B95',regular)+'<path d="M72 224H1008" stroke="#29312B"/>';
const footer=text('FLC / PORTFOLIO DEMO',72,1630,24,'#929B95',regular)+text('MINDVORTEX.PRO',72,1695,27,'#35F46A',regular);
const titles=['FIRST IMPRESSIONS.','EXPLORE THE COLLECTION.','MORE THAN A HOMEPAGE.','DETAILS IN MOTION.','A COMPLETE EXPERIENCE.','BUILT TO CONNECT.'];
const backgrounds=await Promise.all(titles.map(a=>sharp(svg(header+text(a,72,310,62,'#35F46A')+'<rect x="59" y="350" width="962" height="1234" rx="8" stroke="#39443B" fill="#101712"/>'+text('FLC / INTERACTIVE WEBSITE',84,386,20,'#929B95',regular)+footer)).jpeg({quality:90}).toBuffer()));
const browser=await chromium.launch();const page=await browser.newPage({viewport:{width:960,height:1188},deviceScaleFactor:1});
await page.goto('https://mindvortex.pro/previews/flc/',{waitUntil:'networkidle'});await page.locator('#home').waitFor();
const positions=await page.locator('section').evaluateAll(xs=>Object.fromEntries(xs.map((x,i)=>[x.id||'section-'+i,{top:x.getBoundingClientRect().top+scrollY,height:x.offsetHeight}])));
const inventory=positions.inventory.top,lotus=positions['section-3'].top,experience=positions.experience.top,about=positions.about.top,contact=positions.contact.top;
const encoder=spawn(ff,['-y','-f','image2pipe','-vcodec','mjpeg','-framerate',String(fps),'-i','pipe:0','-an','-c:v','libx264','-preset','fast','-crf','19','-pix_fmt','yuv420p','-movflags','+faststart',dir+'/flc-reel-silent.mp4'],{windowsHide:true,stdio:['pipe','ignore','pipe']});let errors='';encoder.stderr.on('data',b=>errors=b.toString().slice(-3000));
const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
for(let i=0;i<fps*duration;i++){
 const t=i/fps;let frame;
 if(t<1.2){const k=t/1.2;frame=await sharp(svg(logo(354,625,372,-24*(1-smooth(k)))+text('MIND VORTEX',274,1100,70)+text('DESIGN / DEVELOP / LAUNCH',252,1190,30,'#929B95',regular)+`<rect x="252" y="1260" width="576" height="3" fill="#29312B"/><rect x="252" y="1260" width="${576*smooth(k)}" height="3" fill="#35F46A"/>`)).jpeg({quality:90}).toBuffer();}
 else if(t>=17.2){const k=smooth((t-17.2)/.3);frame=await sharp(svg(header+logo(72,440,120)+`<g opacity="${k}">`+text('LET’S BUILD',72,790,92)+text('YOUR NEXT',72,900,92)+text('WEBSITE.',72,1010,92,'#35F46A')+text('DM US “WEBSITE”',72,1240,49)+text('mindvortex.pro/en',72,1320,32,'#929B95',geist)+'</g>'+text('WEB DESIGN + DEVELOPMENT',72,1630,24,'#929B95',regular))).jpeg({quality:90}).toBuffer();}
 else{let scene,scroll=0;
 if(t<3.2){scene=0;scroll=(inventory-360)*smooth((t-1.2)/2);}
 else if(t<7){scene=1;scroll=inventory-70+(positions.inventory.height-500)*smooth((t-3.2)/3.8);}
 else if(t<10){scene=2;scroll=lotus-70+Math.max(400,positions['section-3'].height-600)*smooth((t-7)/3);}
 else if(t<12.8){scene=3;scroll=experience-70+400*smooth((t-10)/2.8);}
 else if(t<15.2){scene=4;scroll=about-70+Math.max(300,positions.about.height-500)*smooth((t-12.8)/2.4);}
 else {scene=5;scroll=contact-70+500*smooth((t-15.2)/2);}

 await page.evaluate(y=>window.scrollTo({top:y,behavior:'instant'}),scroll);
 if(scene===1){await page.mouse.move(350+Math.sin(t*1.5)*100,490);}
 const shot=await page.screenshot({type:'jpeg',quality:90});frame=await sharp(backgrounds[scene]).composite([{input:shot,left:60,top:396}]).jpeg({quality:90}).toBuffer();}
 if([0,18,60,150,255,345,420,480,555].includes(i))await fs.writeFile(dir+'/frame-'+i+'.jpg',frame);
 if(!encoder.stdin.write(frame))await once(encoder.stdin,'drain');if(i%60===0)console.log('Rendered',i,'/',fps*duration);
}
const encoded=once(encoder,'close');encoder.stdin.end();await browser.close();const [code]=await encoded;if(code!==0)throw Error(errors);
// Original low-key sound design: soft synth pulse, pad and subtle transition ticks.
const sr=48000,n=sr*duration,pcm=Buffer.alloc(n*2);let seed=17;
for(let i=0;i<n;i++){const t=i/sr,fade=Math.min(1,t/.3,(duration-t)/.7),beat=t%0.6;seed=(seed*1664525+1013904223)>>>0;let v=.022*(Math.sin(2*Math.PI*110*t)+.5*Math.sin(2*Math.PI*164.81*t)+.35*Math.sin(2*Math.PI*220*t));v+=.1*Math.exp(-beat*19)*Math.sin(2*Math.PI*(55*t+1.4*(1-Math.exp(-beat*14))));for(const cut of [1.2,3.2,7,10,12.8,15.2,17.2])if(t>cut&&t<cut+.16)v+=(seed/4294967296-.5)*.09*Math.exp(-(t-cut)*35);pcm.writeInt16LE(Math.round(Math.max(-1,Math.min(1,v*fade))*32767),i*2);}
await fs.writeFile(dir+'/sound-design.pcm',pcm);
const mux=spawn(ff,['-y','-i',dir+'/flc-reel-silent.mp4','-f','s16le','-ar',String(sr),'-ac','1','-i',dir+'/sound-design.pcm','-c:v','copy','-c:a','aac','-b:a','192k','-shortest','-movflags','+faststart',dir+'/flc-reel.mp4'],{windowsHide:true,stdio:'ignore'});const [result]=await once(mux,'close');if(result)throw Error('Audio mux failed');console.log('Completed',dir+'/flc-reel.mp4');
