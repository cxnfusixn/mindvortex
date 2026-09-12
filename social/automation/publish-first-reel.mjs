import {init,pool,locked,event} from './lib/db.mjs';
import {dayKey} from './lib/brand.mjs';
import {publishReels} from './lib/reel-publish.mjs';
await init();try{
 await locked('social-publish',async()=>{
  const p=(await pool.query("SELECT * FROM social_reels WHERE content->>'approvedAsset'='flc-v6'")).rows[0];if(!p)throw Error('Approved FLC Reel missing');
  if(p.status==='approved'){await pool.query('UPDATE social_reels SET day=$2,updated_at=now() WHERE id=$1',[p.id,dayKey()]);await event('Owner requested immediate publication of approved FLC Reel');}
 });
 await publishReels();console.log((await pool.query("SELECT day::text,status,permalink,error FROM social_reels WHERE content->>'approvedAsset'='flc-v6'")).rows);
}finally{await pool.end();}
