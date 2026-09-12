import {assets} from './visuals.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import {openSync} from 'fontkit';
const bold=openSync(path.resolve('public/fonts/mono.woff2'));
const mono=openSync(path.resolve('public/fonts/mono-regular.woff2'));
const geist=openSync(path.resolve('public/fonts/geist.woff2'));
const symbol=await fs.readFile(path.resolve('assets/mv-symbol.svg'),'utf8');
const inner=symbol.slice(symbol.indexOf('<g'),symbol.lastIndexOf('</svg>'));
export const TEMPLATE_VERSION='studio-square-v1';
function width(s,f,size,tracking=0){return f.layout(s).positions.reduce((n,p)=>n+p.xAdvance*size/f.unitsPerEm+tracking,0);}
function text(s,x,y,size=44,color='#F2F4F3',weight=400){
 const f=weight===700?bold:size<=27?mono:geist,tracking=weight===700?-size*.06:0;
 if(width(s,f,size,tracking)>1016-x)throw Error('Studio template: shorten text; fixed typography exceeds width: '+s);
 let cursor=0;const scale=size/f.unitsPerEm,run=f.layout(s);
 return `<g fill="${color}" transform="translate(${x} ${y})">`+run.glyphs.map((g,i)=>{const p=run.positions[i];const v=`<path transform="translate(${cursor+p.xOffset*scale} ${-p.yOffset*scale}) scale(${scale} ${-scale})" d="${g.path.toSVG()}"/>`;cursor+=p.xAdvance*scale+tracking;return v;}).join('')+'</g>';
}
function headlineLines(s){
 const words=s.toUpperCase().split(/\s+/);let best;
 for(let i=1;i<words.length;i++){const lines=[words.slice(0,i).join(' '),words.slice(i).join(' ')];const widths=lines.map(l=>width(l,bold,78,-78*.06));if(Math.max(...widths)<=952&&(!best||Math.abs(widths[0]-widths[1])<best.score))best={lines,score:Math.abs(widths[0]-widths[1])};}
 if(!best)throw Error('Studio template: headline must fit two fixed 78px lines; shorten it');return best.lines;
}
export const mediaDir=()=>process.env.SOCIAL_MEDIA_DIR||path.resolve('media');
export async function render(p,id){
 await fs.mkdir(mediaDir(),{recursive:true});
 let svg='<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080"><rect width="1080" height="1080" fill="#050706"/><path d="M64 140H1016M64 960H1016" stroke="#29312B"/>';
 svg+=`<svg x="60" y="55" width="54" height="54" viewBox="385 235 530 530">${inner}</svg>`;
 svg+=text('MIND VORTEX',132,92,27,'#F1F3EF',700)+text('DESIGN × DEVELOPMENT',650,92,21,'#929B95');
 svg+=text(p.project==='none'?'WEBSITE NOTES':'PROJECT SPOTLIGHT',64,215,22,'#929B95');
 headlineLines(p.headline).forEach((l,i)=>svg+=text(l,64,336+i*92,78,i?'#35F46A':'#F1F3EF',700));
 if(p.project!=='none'){
 const asset=assets.find(a=>a.key===p.visualAssetKey&&a.project===p.project);if(!asset)throw Error('Portfolio graphic requires a registered section');
 const img=await sharp(path.resolve('assets',asset.file)).resize(950,410,{fit:'contain',background:'#050706'}).png().toBuffer();
 svg+=`<image x="65" y="475" width="950" height="410" href="data:image/png;base64,${img.toString('base64')}"/>`;
 svg+=text('PORTFOLIO DEMO / '+p.project.toUpperCase(),64,910,26,'#929B95');
 }else{
 p.points.forEach((point,i)=>svg+=text(String(i+1).padStart(2,'0')+'   '+point,64,571+i*117,44));
 svg+=text('Design + development, from concept to launch.',64,910,26,'#929B95');
 }
 svg+=text('MINDVORTEX.PRO',64,1011,21,'#35F46A')+text('STUDIO NOTES',785,1011,18,'#929B95')+'</svg>';
 const name=id+'.jpg';await sharp(Buffer.from(svg)).jpeg({quality:93}).toFile(path.join(mediaDir(),name));p.templateVersion=TEMPLATE_VERSION;return name;
}
