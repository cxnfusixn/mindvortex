import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {pool,locked,settings,event} from './db.mjs';
import {graph,sameCaption} from './instagram.mjs';
import {dayKey,caption} from './brand.mjs';
import {warsawHour} from './reel-schedule.mjs';
import {reelConfig,verifyFacts,prepareReel} from './reel-generation.mjs';
import {checkDuplicates} from './duplicates.mjs';
import {syncHistory} from './history.mjs';
async function verify(p,id){
 const m=await graph(id,{fields:'id,caption,media_type,media_product_type,permalink'});
 if(m.media_type!=='VIDEO'||m.media_product_type!=='REELS'||!sameCaption(m.caption,caption(p.content)))throw Error('Published Reel verification mismatch');
 await pool.query("UPDATE social_reels SET status='verified',media_id=$2,permalink=$3,error=NULL,updated_at=now() WHERE id=$1",[p.id,id,m.permalink]);await event('Reel verified: '+p.day);
}
export async function reconcileReel(p){
 if(p.media_id)return verify(p,p.media_id);
 const recent=await graph(process.env.INSTAGRAM_USER_ID+'/media',{fields:'id,caption,timestamp,media_type',limit:50});
 const matches=(recent.data||[]).filter(m=>m.media_type==='VIDEO'&&sameCaption(m.caption,caption(p.content))&&new Date(m.timestamp)>=new Date(p.created_at));
 if(matches.length!==1)throw Error('Uncertain Reel outcome; no automatic re-post');return verify(p,matches[0].id);
}
export async function publishReels(){return locked('social-publish',async()=>{
 const cfg=await reelConfig();if(!cfg.enabled||(await settings()).paused)return;
 // Resume submitted work even after midnight, never replay a publish request.
 let p=(await pool.query("SELECT *,day::text FROM social_reels WHERE status IN ('uploading','publishing','verifying') ORDER BY social_reels.day LIMIT 1")).rows[0];
 if(!p){p=(await pool.query("SELECT *,day::text FROM social_reels WHERE (manual_requested_at IS NOT NULL AND status='approved') OR (day=$1 AND $2) ORDER BY manual_requested_at NULLS LAST LIMIT 1",[dayKey(),warsawHour()>=cfg.hour])).rows[0];}
 if(!p||!['approved','uploading','publishing','verifying'].includes(p.status))return;
 try{
  if(['publishing','verifying'].includes(p.status)){await reconcileReel(p);return;}
  if(p.status==='approved'){
   await syncHistory();
   if(p.kind==='education'){
    let reason='';try{const d=await checkDuplicates(p.content,p.id);if(d.duplicate)throw Error(d.reason);p.content=await verifyFacts(p.content);}catch(e){reason=e.message;}
    if(reason){const c=await prepareReel(p.day,p.id);await pool.query('INSERT INTO social_revisions(post_id,content,image,reason) VALUES($1,$2,$3,$4)',[p.id,p.content,p.video,'Reel replacement: '+reason]);await pool.query('UPDATE social_reels SET content=$2,video=$3,sha=$4,updated_at=now() WHERE id=$1',[p.id,c.content,c.video,c.sha]);p={...p,...c,id:p.id};}
   }
   if(p.content.templateVersion!=='studio-demo-v1')throw Error('Unapproved Reel template');
   const file=path.join(process.env.SOCIAL_MEDIA_DIR,p.video),sha=createHash('sha256').update(await fs.readFile(file)).digest('hex');if(sha!==p.sha)throw Error('Reel file checksum mismatch');
   const me=await graph('me',{fields:'user_id,username'});if(me.username!=='mindvortex.pro'||String(me.user_id)!==process.env.INSTAGRAM_USER_ID)throw Error('Instagram account mismatch');
   if((await settings()).paused||!(await reelConfig()).enabled)return;
   await pool.query("UPDATE social_reels SET status='uploading',updated_at=now() WHERE id=$1",[p.id]);
   const c=await graph(process.env.INSTAGRAM_USER_ID+'/media',{media_type:'REELS',video_url:process.env.SOCIAL_PUBLIC_URL+'/media/'+p.video,caption:caption(p.content),share_to_feed:'true'},'POST');
   if(!c.id)throw Error('Reel container missing');await pool.query('UPDATE social_reels SET container_id=$2 WHERE id=$1',[p.id,c.id]);p.container_id=c.id;p.updated_at=new Date();
  }
  if(!p.container_id)throw Error('Interrupted Reel upload; inspect before retrying');
  const status=await graph(p.container_id,{fields:'status_code'});
  if(status.status_code==='IN_PROGRESS'){if(Date.now()-new Date(p.updated_at)>30*60000)throw Error('Reel processing exceeded 30 minutes');return;}
  if(status.status_code!=='FINISHED')throw Error('Reel container status: '+status.status_code);
  if(!p.manual_requested_at&&p.day!==dayKey())throw Error('Reel slot missed; reschedule explicitly');
  if((await settings()).paused||!(await reelConfig()).enabled)return;
  await pool.query("UPDATE social_reels SET status='publishing',updated_at=now() WHERE id=$1",[p.id]);
  const result=await graph(process.env.INSTAGRAM_USER_ID+'/media_publish',{creation_id:p.container_id},'POST');if(!result.id)throw Error('Missing Reel publication ID');
  await pool.query("UPDATE social_reels SET status='verifying',media_id=$2,updated_at=now() WHERE id=$1",[p.id,result.id]);
  // Verify on the next tick, allowing Meta to make the published media readable.
 }catch(e){await pool.query("UPDATE social_reels SET status='needs-attention',error=$2,updated_at=now() WHERE id=$1",[p.id,e.message]);await event('Reel needs attention: '+e.message);}
});}
