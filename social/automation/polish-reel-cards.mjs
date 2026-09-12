import {pool,locked} from './lib/db.mjs';
import {renderEducation} from './lib/reel-education.mjs';
import {verifyFacts} from './lib/reel-generation.mjs';
import {runFFmpeg} from './lib/reel-audio.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';
import {randomUUID,createHash} from 'node:crypto';
const edits={
 'Web Animations API basics':[
  {title:'MOTION, CONTROLLED.',lines:['TIMING IN SYNC']},
  {title:'ONE BROWSER API.',lines:['ANIMATE','PAGE ELEMENTS']},
  {title:'BUILT FOR PEOPLE.',lines:['RESPECT','REDUCED MOTION']},
 ],
 'CSS Container Queries':[
  {title:'BEYOND SCREEN SIZE.',lines:['WATCH THE','CONTAINER']},
  {title:'CARDS THAT ADAPT.',lines:['WIDE OR NARROW']},
  {title:'REUSE THE DESIGN.',lines:['ONE COMPONENT','MANY LAYOUTS']},
 ],
};
try{await locked('reel-generation',async()=>{
 const media=process.env.SOCIAL_MEDIA_DIR;
 for(const p of (await pool.query("SELECT * FROM social_reels WHERE status='approved' AND kind='education'")).rows){
  if(!edits[p.content.topic])continue;
  let c={...p.content,scenes:edits[p.content.topic]};c.points=c.scenes.flatMap(s=>s.lines);c.alt=c.scenes.map(s=>s.title+': '+s.lines.join(' ')).join('. ');c=await verifyFacts(c);
  const id=randomUUID(),dir=path.join(media,'reel-work',id),video=id+'.mp4',rendered=await renderEducation(c,dir),bytes=await fs.readFile(rendered);
  await fs.copyFile(rendered,path.join(media,video));await fs.copyFile(path.join(dir,'hero.jpg'),path.join(media,id+'.jpg'));
  await pool.query('INSERT INTO social_revisions(post_id,content,image,reason) VALUES($1,$2,$3,$4)',[p.id,p.content,p.video,'Editorial polish: natural short English phrases']);
  await pool.query("UPDATE social_reels SET content=$2,video=$3,sha=$4 WHERE id=$1 AND status='approved'",[p.id,c,video,createHash('sha256').update(bytes).digest('hex')]);
  if(!path.resolve(dir).startsWith(path.resolve(media,'reel-work')+path.sep))throw Error('Unexpected directory');await fs.rm(dir,{recursive:true,force:true});console.log('Polished',c.topic);
 }
 for(const r of (await pool.query('SELECT video FROM social_reels')).rows){await runFFmpeg('ffmpeg',['-loglevel','error','-y','-ss','2.3','-i',path.join(media,r.video),'-frames:v','1','-update','1',path.join(media,r.video.replace(/\.mp4$/,'.jpg'))]);}
});}finally{await pool.end();}
