import fs from 'node:fs/promises';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {reelTemplate} from './reel-template.mjs';
export function runFFmpeg(ffmpeg, args) {
  return new Promise((resolve,reject)=>{
    const p=spawn(ffmpeg,args,{windowsHide:true,stdio:['ignore','ignore','pipe']});let error='';
    p.stderr.on('data',b=>{error=(error+b).slice(-4000);});
    p.on('error',reject);p.on('close',code=>code===0?resolve():reject(Error(error)));
  });
}
// Original synthesized stereo ambient: slow minor pad, sub drone and airy swells.
// No downloaded recordings, vocals, or third-party music assets.
export function createAmbient() {
  const {duration,cuts,audio}=reelTemplate,sr=audio.sampleRate,n=sr*duration;
  const samples=new Float64Array(n*2),notes=[55,110,130.8128,164.8138,220,261.6256];
  let seed=1927,noise=0,peak=0,sum=0;
  for(let i=0;i<n;i++){
    const t=i/sr,fade=Math.sin(Math.min(1,t/1.1)*Math.PI/2)*Math.sin(Math.min(1,(duration-t)/1.5)*Math.PI/2);
    seed=(1664525*seed+1013904223)>>>0;noise=.97*noise+.03*(seed/4294967296*2-1);
    for(let c=0;c<2;c++){
      let v=0;for(let j=0;j<notes.length;j++){
        const f=notes[j]*(1+(c===0?-1:1)*.0015),phase=2*Math.PI*f*t;
        const swell=.65+.35*Math.sin(t*.43+j*.7+c*.25);
        v+=(Math.sin(phase+.18*Math.sin(t*.7+j))+ .16*Math.sin(phase*2)) *swell/(7+j*2);
      }
      v+=noise*.13;
      for(const cut of cuts){const d=(t-cut)/.105;v+=noise*.75*Math.exp(-d*d);}
      const delay=Math.round((c===0?.317:.433)*sr);
      if(i>delay)v+=samples[(i-delay)*2+c]*.24;
      v*=fade;samples[i*2+c]=v;peak=Math.max(peak,Math.abs(v));
    }
  }
  const gain=Math.pow(10,audio.peakDb/20)/peak,pcm=Buffer.alloc(n*4);
  for(let i=0;i<samples.length;i++){const v=samples[i]*gain;sum+=v*v;pcm.writeInt16LE(Math.round(v*32767),i*2);}
  return {pcm,peakDb:audio.peakDb,rmsDb:20*Math.log10(Math.sqrt(sum/samples.length))};
}
export async function addAmbient({input,output,ffmpeg='ffmpeg'}) {
  if(path.resolve(input)===path.resolve(output))throw Error('Output must differ from the source video.');
  await fs.mkdir(path.dirname(output),{recursive:true});
  const pcmPath=output+'.pcm', {pcm,...levels}=createAmbient();
  await fs.writeFile(pcmPath,pcm);
  try{await runFFmpeg(ffmpeg,['-y','-i',input,'-f','s16le','-ar','48000','-ac','2','-i',pcmPath,'-map','0:v:0','-map','1:a:0','-c:v','copy','-c:a','aac','-b:a','256k','-t','10','-shortest','-movflags','+faststart',output]);}
  finally{await fs.rm(pcmPath,{force:true});}
  return levels;
}
