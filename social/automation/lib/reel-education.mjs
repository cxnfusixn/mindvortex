import fs from 'node:fs/promises';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import sharp from 'sharp';
import {openSync} from 'fontkit';
import {fileURLToPath} from 'node:url';
import {renderReel} from './reel-render.mjs';
const root=path.resolve('.');
const bold=openSync(path.join(root,'public/fonts/mono.woff2')),mono=openSync(path.join(root,'public/fonts/mono-regular.woff2'));
const symbol=await fs.readFile(path.join(root,'assets/mv-symbol.svg'),'utf8'),inner=symbol.slice(symbol.indexOf('<g'),symbol.lastIndexOf('</svg>'));
function text(s,x,y,size,color='#f2f4f3',font=bold){let cursor=0;const scale=size/font.unitsPerEm,r=font.layout(s),track=font===bold?-size*.06:0;const width=r.positions.reduce((v,p)=>v+p.xAdvance*scale+track,0);if(width>936)throw Error('Reel text exceeds fixed typography: '+s);return `<g fill="${color}">`+r.glyphs.map((g,i)=>{const out=`<path transform="translate(${x+cursor} ${y}) scale(${scale} ${-scale})" d="${g.path.toSVG()}"/>`;cursor+=r.positions[i].xAdvance*scale+track;return out;}).join('')+'</g>';}
export function educationalFrame(content,i){
 const scene=i<72?0:i<144?1:2,start=[0,72,144][scene],duration=[72,72,48][scene],q=(i-start)/duration,s=content.scenes[scene];
 const rise=24*Math.max(0,1-q*6)**2;
 return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920"><rect width="1080" height="1920" fill="#050706"/><svg x="72" y="144" width="54" height="54" viewBox="385 235 530 530">${inner}</svg>${text('MIND VORTEX',145,183,31)}${text('DESIGN × DEVELOPMENT',590,180,22,'#929b95',mono)}<path d="M72 224H1008" stroke="#29312b"/>${text(s.title.toUpperCase(),72,310,62,'#35f46a')}<rect x="60" y="375" width="960" height="1200" fill="#101411"/>${text(content.category+' / '+String(scene+1).padStart(2,'0'),110,490,24,'#929b95',mono)}<g transform="translate(0 ${rise})">${s.lines.map((l,j)=>text(l.toUpperCase(),110,800+j*100,72)).join('')}</g><path d="M110 1220H970" stroke="#29312b" stroke-width="3"/><path d="M110 1220H${110+860*q}" stroke="#35f46a" stroke-width="3"/>${text('MORE IN THE CAPTION',110,1430,26,'#929b95',mono)}${text(content.category+' / STUDIO NOTES',72,1640,24,'#929b95',mono)}${text('MINDVORTEX.PRO',72,1710,27,'#35f46a',mono)}</svg>`);
}
export async function renderEducation(content,dir){
 await fs.mkdir(dir,{recursive:true});const ff=process.env.FFMPEG_PATH||'ffmpeg';
 const p=spawn(ff,['-y','-f','image2pipe','-vcodec','mjpeg','-framerate','30','-i','pipe:0','-an','-c:v','libx264','-threads','2','-preset','fast','-crf','19','-pix_fmt','yuv420p',path.join(dir,'website.mp4')],{windowsHide:true,stdio:['pipe','ignore','pipe']});let error='';p.stderr.on('data',b=>error=b.toString());const done=once(p,'close');p.on('error',()=>{});
 try{for(let i=0;i<192;i++){const frame=await sharp(educationalFrame(content,i)).jpeg({quality:94}).toBuffer();if(i===0)await fs.writeFile(path.join(dir,'hero.jpg'),frame);if(!p.stdin.write(frame))await once(p.stdin,'drain');}p.stdin.end();if((await done)[0])throw Error(error);}catch(e){p.kill();throw e;}
 return renderReel({outputDir:dir,heroImage:path.join(dir,'hero.jpg'),websiteVideo:path.join(dir,'website.mp4'),sceneKeys:content.scenes.map(s=>content.topic+':'+s.title),ffmpeg:ff});
}
