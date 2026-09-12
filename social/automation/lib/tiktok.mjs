import {randomUUID} from 'node:crypto';
import {createHash} from 'node:crypto';import fs from 'node:fs/promises';import path from 'node:path';
import {pool,locked,settings,event} from './db.mjs';
import {buffer,verifyBufferChannel} from './buffer.mjs';
import {dayKey,caption} from './brand.mjs';
import {warsawHour} from './reel-schedule.mjs';
import {checkDuplicates} from './duplicates.mjs';import {verifyFacts,prepareReel} from './reel-generation.mjs';
const normalize=s=>s?.replace(/\s+/g,' ').trim();
export function tiktokInput(job){
 const text=caption(job.content);if(text.length>2200||job.content.hashtags.length!==5)throw Error('TikTok caption exceeds constraints');
 if(!Array.isArray(job.assets)||!job.assets.length||job.assets.some(a=>!(/^[0-9a-f-]{36}\.(jpg|mp4)$/).test(a)))throw Error('Invalid TikTok assets');
 if(job.kind==='reel'&&(job.assets.length!==1||!job.assets[0].endsWith('.mp4')))throw Error('Invalid TikTok video');
 if(job.kind==='carousel'&&(job.assets.length!==3||new Set(job.assets).size!==3||job.assets.some(a=>!a.endsWith('.jpg'))))throw Error('Carousel requires three distinct images');
 return {channelId:process.env.BUFFER_TIKTOK_CHANNEL_ID,text,mode:'shareNow',schedulingType:'automatic',needsApproval:false,aiAssisted:true,assets:job.assets.map(a=>a.endsWith('.mp4')?{video:{url:process.env.SOCIAL_PUBLIC_URL+'/media/'+a,metadata:{thumbnailOffset:2200}}}:{image:{url:process.env.SOCIAL_PUBLIC_URL+'/media/'+a}}),metadata:{tiktok:job.kind==='reel'?{isAiGenerated:false}:{title:job.content.topic.slice(0,90)}}};
}
export async function publishTikTok(){return locked('tiktok-publish',async()=>{
 if(!process.env.BUFFER_API_KEY||(await settings()).paused)return;
 const cfg=(await pool.query('SELECT * FROM social_reel_settings WHERE id=1')).rows[0];if(!cfg.enabled)return;
 // Mirror only the actual, verified Instagram asset. A duplicate replacement on Instagram is copied here too.
 const reels=(await pool.query("SELECT * FROM social_reels WHERE day=$1 AND status='verified'",[dayKey()])).rows;
 for(const r of reels)await pool.query("INSERT INTO social_tiktok_jobs(id,reel_id,day,kind,content,assets) VALUES($1,$2,$3,'reel',$4,$5) ON CONFLICT(reel_id) DO NOTHING",[randomUUID(),r.id,r.day,r.content,JSON.stringify([r.video])]);
 let job=(await pool.query("SELECT * FROM social_tiktok_jobs WHERE (manual_requested_at IS NOT NULL OR (day=$1 AND $2)) AND status='ready' ORDER BY manual_requested_at NULLS LAST,kind LIMIT 1",[dayKey(),warsawHour()>=cfg.hour])).rows[0];if(!job)return;
 if(job.kind==='reel'&&!job.reel_id){
  let reason='';try{const d=await checkDuplicates(job.content,job.id);if(d.duplicate)throw Error(d.reason);await verifyFacts(job.content);}catch(e){reason=e.message;}
  if(reason){const fresh=await prepareReel(dayKey(),job.id),content={...fresh.content,mediaSha:fresh.sha};await pool.query('INSERT INTO social_revisions(post_id,content,image,reason) VALUES($1,$2,$3,$4)',[job.id,job.content,job.assets[0],'TikTok replacement: '+reason]);await pool.query('UPDATE social_tiktok_jobs SET content=$2,assets=$3 WHERE id=$1',[job.id,content,JSON.stringify([fresh.video])]);job={...job,content,assets:[fresh.video]};}
 }
 await verifyBufferChannel();const input=tiktokInput(job);
 if(job.content.mediaSha){const bytes=await fs.readFile(path.join(process.env.SOCIAL_MEDIA_DIR,job.assets[0]));if(createHash('sha256').update(bytes).digest('hex')!==job.content.mediaSha)throw Error('TikTok video checksum mismatch');}
 if((await settings()).paused)return;
 await pool.query("UPDATE social_tiktok_jobs SET status='submitting',updated_at=now() WHERE id=$1",[job.id]);
 try{const result=await buffer('mutation($input:CreatePostInput!){createPost(input:$input){... on PostActionSuccess{post{id status externalLink schedulingType}} ... on MutationError{message}}}',{input});
  const p=result.createPost?.post;if(!p?.id)throw Error('Buffer rejected post; review required');
  if(p.schedulingType!=='automatic')throw Error('Buffer requires manual publishing');
  await pool.query("UPDATE social_tiktok_jobs SET buffer_id=$2,status=$3,permalink=$4,updated_at=now() WHERE id=$1",[job.id,p.id,p.status==='sent'?'published':'submitted',p.externalLink]);
  await event('TikTok submitted to Buffer: '+job.day);
 }catch(e){await pool.query("UPDATE social_tiktok_jobs SET status='needs-attention',error=$2,updated_at=now() WHERE id=$1",[job.id,e.message]);await event('TikTok needs reconciliation; no automatic repost');}
});}
export async function reconcileTikTok(){
 if(!process.env.BUFFER_API_KEY)return;
 const jobs=(await pool.query("SELECT * FROM social_tiktok_jobs WHERE status IN ('submitting','submitted','needs-attention')")).rows;
 const history=(await pool.query('SELECT * FROM social_tiktok_history')).rows;
 for(const job of jobs){const matches=history.filter(h=>normalize(h.caption)===normalize(caption(job.content))&&new Date(h.published_at)>=new Date(job.created_at));if(matches.length===1)await pool.query("UPDATE social_tiktok_jobs SET status='published',buffer_id=$2,permalink=$3,error=NULL,updated_at=now() WHERE id=$1",[job.id,matches[0].id,matches[0].permalink]);}
 for(const job of jobs.filter(j=>j.buffer_id)){const result=await buffer('query($id:PostId!){post(input:{id:$id}){status externalLink}}',{id:job.buffer_id});const p=result.post;if(p?.status==='sent')await pool.query("UPDATE social_tiktok_jobs SET status='published',permalink=$2,error=NULL WHERE id=$1",[job.id,p.externalLink]);else if(p?.status==='error')await pool.query("UPDATE social_tiktok_jobs SET status='needs-attention',error='Buffer publishing error: review in Buffer; no automatic retry' WHERE id=$1",[job.id]);}
}
