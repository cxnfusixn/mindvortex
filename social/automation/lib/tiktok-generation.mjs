import {pool,locked,settings,event} from './db.mjs';import {prepareReel,reelConfig} from './reel-generation.mjs';import {reelSlots,tiktokReelSlots} from './reel-schedule.mjs';
export async function prepareTikTokReels(){return locked('tiktok-generation',async()=>{
 if(!process.env.BUFFER_API_KEY||(await settings()).paused)return;
 const planned=new Set(reelSlots(await reelConfig()));
 for(const day of tiktokReelSlots()){
  if(planned.has(day))continue;
  if((await pool.query("SELECT 1 FROM social_reels WHERE day=$1 UNION ALL SELECT 1 FROM social_tiktok_jobs WHERE day=$1 AND kind='reel'",[day])).rowCount)continue;
  const c=await prepareReel(day,undefined,'tiktok');
  await pool.query("INSERT INTO social_tiktok_jobs(id,day,kind,content,assets) VALUES($1,$2,'reel',$3,$4)",[c.id,day,{...c.content,mediaSha:c.sha},JSON.stringify([c.video])]);
  await event('TikTok daily Reel prepared: '+day);
 }
});}
