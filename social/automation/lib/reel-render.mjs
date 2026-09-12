import fs from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {reelTemplate,validateReelScenes} from './reel-template.mjs';
import {addAmbient} from './reel-audio.mjs';
import sharp from 'sharp';
import {openSync} from 'fontkit';
const root=path.resolve('.');
export async function renderReel({outputDir,heroImage,websiteVideo,sceneKeys,ffmpeg='ffmpeg'}) {
validateReelScenes(sceneKeys);
const dir=path.resolve(outputDir),ff=ffmpeg;
await fs.mkdir(dir,{recursive:true});
const font=openSync(path.join(root,'public/fonts/mono-regular.woff2'));
const symbol=await fs.readFile(path.join(root,'assets/mv-symbol.svg'),'utf8'),inner=symbol.slice(symbol.indexOf('<g'),symbol.lastIndexOf('</svg>'));
function label(s,y,size,color,tracking=0){const r=font.layout(s),scale=size/font.unitsPerEm;const width=r.positions.reduce((v,p)=>v+p.xAdvance*scale+tracking,0)-tracking;let x=(1080-width)/2;return r.glyphs.map((g,i)=>{const out=`<path fill="${color}" transform="translate(${x} ${y}) scale(${scale} ${-scale})" d="${g.path.toSVG()}"/>`;x+=r.positions[i].xAdvance*scale+tracking;return out;}).join('');}
async function encode(name,count,make,args=[]){const p=spawn(ff,['-y','-f','image2pipe','-vcodec','png','-framerate','30','-i','pipe:0',...args,dir+'/'+name],{windowsHide:true,stdio:['pipe','ignore','pipe']});let err='';p.stderr.on('data',b=>err=b.toString());const done=once(p,'close');for(let i=0;i<count;i++){const b=await make(i);if(!p.stdin.write(b))await once(p.stdin,'drain');}p.stdin.end();if((await done)[0])throw Error(err);}
// Match CinematicIntro.tsx: .85s power3 logo fade, .3s text entrance,
// 1.15s hold then .65s power4.inOut upward exit. Dimensions are 2x site CSS.
const hero=await sharp(heroImage).png().toBuffer();
await encode('intro.mp4',54,async i=>{const t=i/30,opacity=1-Math.pow(1-Math.min(1,t/.85),4),q=Math.max(0,Math.min(1,(t-1.15)/.65)),ease=q<.5?16*q**5:1-(-2*q+2)**5/2,lt=Math.max(0,Math.min(1,(t-.3)/.3));const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920"><g transform="translate(0 ${-1920*ease})"><rect width="1080" height="1920" fill="#050706"/><svg x="375" y="714" width="330" height="330" opacity="${opacity}" viewBox="385 235 530 530">${inner}</svg>${label('MIND VORTEX · SYSTEM // 2026',1137,22,'#f2f4f3',2.42)}<g opacity="${lt}" transform="translate(0 ${20*(1-lt)**2})">${label('> initializing vortex'+(t%1<.5?'_':' '),1206,26,'#35f46a')}</g></g></svg>`;const b=await sharp(hero).composite([{input:Buffer.from(svg)}]).png().toBuffer();if(i===25)await fs.writeFile(dir+'/intro-check.png',b);return b;},['-an','-c:v','libx264','-threads','2','-pix_fmt','yuv420p']);
const cuts=reelTemplate.cuts;
await encode('swipes.mov',300,async i=>{const t=i/30,cut=cuts.find(c=>Math.abs(t-c)<=.15),x=cut===undefined?-5000:((t-cut)/.15)*4000;return sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920"><g transform="translate(${540+x} 960) rotate(35)"><rect x="-1600" y="-2500" width="3200" height="5000" fill="#35f46a"/></g></svg>`)).png().toBuffer();},['-an','-c:v','qtrle','-pix_fmt','argb']);
const p=spawn(ff,['-y','-filter_complex_threads','1','-i',dir+'/intro.mp4','-i',websiteVideo,'-i',path.join(root,'assets/reels/studio-outro-v1.mp4'),'-i',dir+'/swipes.mov','-filter_complex','[2:v]trim=duration=1.8,setpts=PTS-STARTPTS[o];[0:v][1:v][o]concat=n=3:v=1:a=0[c];[c][3:v]overlay=0:0:shortest=1[v]','-map','[v]','-t','10','-c:v','libx264','-threads','2','-preset','fast','-crf','19','-pix_fmt','yuv420p','-movflags','+faststart',dir+'/flc-reel-silent.mp4'],{windowsHide:true,stdio:'ignore'});if((await once(p,'close'))[0])throw Error('Final render failed');
await addAmbient({input:dir+'/flc-reel-silent.mp4',output:dir+'/reel.mp4',ffmpeg:ff});
await fs.writeFile(dir+'/manifest.json',JSON.stringify({template:reelTemplate,sceneKeys,createdAt:new Date().toISOString()},null,2));
return dir+'/reel.mp4';
}
