import fs from 'node:fs/promises';
import path from 'node:path';
import {randomUUID,createHash} from 'node:crypto';
import {init,pool,event} from './lib/db.mjs';
import {reelSlots} from './lib/reel-schedule.mjs';
await init();
try{
 const found=(await pool.query("SELECT id FROM social_reels WHERE content->>'approvedAsset'='flc-v6'" )).rows[0];
 if(!found){const id=randomUUID(),video=id+'.mp4',bytes=await fs.readFile(process.argv[2]),day=reelSlots({weekday:5,hour:18,horizon:3})[0];
 await fs.copyFile(process.argv[2],path.join(process.env.SOCIAL_MEDIA_DIR,video));
 const content={topic:'FLC — an interactive automotive website',headline:'Designed to move',points:['Cinematic first impression','Interactive Porsche','Animated FLC identity'],caption:'A website should give people a reason to explore.\n\nFor our FLC portfolio demo, we brought together cinematic visuals, an interactive Porsche and a winged identity that moves. Each detail is part of the experience — from the first impression to the small moments of discovery.\n\nWe design and develop websites with a clear visual direction and purposeful interaction.\n\nPlanning your next website? DM us “WEBSITE” or explore mindvortex.pro/en.\n\nPortfolio demo.',hashtags:['#WebDesign','#WebDevelopment','#MotionDesign','#CreativeStudio','#MindVortex'],project:'flc',templateVersion:'studio-demo-v1',approvedAsset:'flc-v6',sceneKeys:['flc:hero','flc:porsche-interactive','flc:wing-logo']};
 await pool.query("INSERT INTO social_reels(id,day,kind,content,video,sha) VALUES($1,$2,'portfolio',$3,$4,$5)",[id,day,content,video,createHash('sha256').update(bytes).digest('hex')]);await event('Owner-approved FLC Reel scheduled for '+day);console.log({day,video});}
 await pool.query('UPDATE social_reel_settings SET enabled=true,weekday=5,hour=18 WHERE id=1');
}finally{await pool.end();}
