import {dashboardMetrics} from '../../lib/metrics.mjs';
import {requireFreshVisual} from '../../lib/visuals.mjs';
import {authorized} from '../../lib/auth.mjs';
import {syncHistory} from '../../lib/history.mjs';
import {requireDistinct} from '../../lib/duplicates.mjs';
import {init,pool,settings,locked,event} from '../../lib/db.mjs';
import {fillQueue} from '../../lib/generate.mjs';
import {validate,dayKey} from '../../lib/brand.mjs';
import {render} from '../../lib/render.mjs';
import {reconcile} from '../../lib/instagram.mjs';
import {reconcileReel} from '../../lib/reel-publish.mjs';
export const dynamic='force-dynamic';
export async function GET(req){if(!await authorized(req))return new Response(null,{status:401});await init();return Response.json({tiktokConnected:Boolean(process.env.BUFFER_API_KEY),tiktokJobs:(await pool.query("SELECT id,manual_requested_at,reel_id,day::text,kind,content,assets,status,permalink,error FROM social_tiktok_jobs ORDER BY day DESC LIMIT 100")).rows,analytics:await dashboardMetrics(),metricSamples:(await pool.query("SELECT media_id,bucket,metrics FROM social_metric_samples WHERE bucket>=now()-interval '90 days' ORDER BY bucket")).rows,settings:await settings(),reelSettings:(await pool.query('SELECT * FROM social_reel_settings WHERE id=1')).rows[0],reels:(await pool.query('SELECT id,manual_requested_at,day::text,kind,content,video,status,permalink,error FROM social_reels ORDER BY day DESC LIMIT 100')).rows.reverse(),history:(await pool.query('SELECT h.* FROM social_history h WHERE NOT EXISTS(SELECT 1 FROM social_posts p WHERE p.media_id=h.media_id) AND NOT EXISTS(SELECT 1 FROM social_reels r WHERE r.media_id=h.media_id) ORDER BY published_at DESC')).rows,posts:(await pool.query('SELECT id,day::text,kind,content,image,status,permalink,error,metrics FROM social_posts ORDER BY day DESC LIMIT 90')).rows,events:(await pool.query('SELECT created_at,message FROM social_events ORDER BY id DESC LIMIT 20')).rows},{headers:{'Cache-Control':'no-store'}});}
export async function POST(req){
 if(!await authorized(req))return new Response(null,{status:401});
 if(req.headers.get('origin')!==new URL(process.env.SOCIAL_PUBLIC_URL).origin)return Response.json({error:'Origin rejected'},{status:403});
 if(Number(req.headers.get('content-length')||0)>20000)return new Response(null,{status:413});
 try{await init();const body=await req.text();if(body.length>20000)throw Error('Request too large');const b=JSON.parse(body);
  if(['publish-now','replace-content'].includes(b.action)&&b.target==='tiktok-reel'){
   if(!/^[0-9a-f-]{36}$/.test(b.id||''))throw Error('Invalid Reel');
   const r=(await pool.query("SELECT * FROM social_reels WHERE id=$1 AND status IN ('approved','verified')",[b.id])).rows[0];if(!r)throw Error('Rolka nie jest gotowa.');
   await pool.query("INSERT INTO social_tiktok_jobs(id,reel_id,day,kind,content,assets) VALUES($1,$2,$3,'reel',$4,$5) ON CONFLICT(reel_id) DO NOTHING",[crypto.randomUUID(),r.id,r.day,{...r.content,mediaSha:r.sha},JSON.stringify([r.video])]);
   b.id=(await pool.query('SELECT id FROM social_tiktok_jobs WHERE reel_id=$1',[r.id])).rows[0].id;b.target='tiktok';
  }
 if(b.action==='replace-content'){
  const targets={post:'social_posts',reel:'social_reels',tiktok:'social_tiktok_jobs'},table=targets[b.target];if(!table||! /^[0-9a-f-]{36}$/.test(b.id||''))throw Error('Invalid content');
  const result=await locked(b.target==='tiktok'?'tiktok-publish':'social-publish',async c=>{const p=(await c.query('SELECT * FROM '+table+' WHERE id=$1',[b.id])).rows[0];if(!p||p.manual_requested_at||!['draft','approved','ready','replacement-failed'].includes(p.status))throw Error('Można zastąpić tylko oczekującą treść.');await c.query('BEGIN');try{await c.query('INSERT INTO social_revisions(post_id,content,image,reason) VALUES($1,$2,$3,$4)',[p.id,p.content,p.image||p.video||p.assets?.[0],'Owner removed content; generate replacement']);await c.query("UPDATE "+table+" SET status='regenerating',manual_requested_at=NULL,error=NULL,updated_at=now() WHERE id=$1",[p.id]);await c.query('COMMIT');}catch(e){await c.query('ROLLBACK');throw e;}return true;});if(result===null)throw Error('Publikowanie trwa. Spróbuj za chwilę.');
 }else if(b.action==='publish-now'){


  const targets={post:['social_posts','approved','social-publish'],reel:['social_reels','approved','social-publish'],tiktok:['social_tiktok_jobs','ready','tiktok-publish']};
  const target=targets[b.target];if(!target||! /^[0-9a-f-]{36}$/.test(b.id||''))throw Error('Invalid publication');
  if((await settings()).paused)throw Error('Najpierw wznów publikowanie.');
  if(b.target!=='post'&&!(await pool.query('SELECT enabled FROM social_reel_settings WHERE id=1')).rows[0].enabled)throw Error('Najpierw wznów rolki.');
  const result=await locked(target[2],async c=>{const row=await c.query('UPDATE '+target[0]+' SET manual_requested_at=COALESCE(manual_requested_at,now()),updated_at=now() WHERE id=$1 AND status=$2 RETURNING id',[b.id,target[1]]);if(!row.rowCount)throw Error('Treść nie jest gotowa albo została już wysłana.');await event('Manual publication requested: '+b.target+' / '+b.id);return true;});if(result===null)throw Error('Publikowanie trwa. Spróbuj za chwilę.');
 }else if(b.action==='settings'){

  if(typeof b.paused!=='boolean'||typeof b.autopilot!=='boolean'||!Number.isInteger(b.hour)||b.hour<0||b.hour>23)throw Error('Invalid settings');
  await pool.query('UPDATE social_settings SET paused=$1,autopilot=$2,hour=$3 WHERE id=1',[b.paused,b.autopilot,b.hour]);await event('Settings changed');
 }else if(b.action==='reel-settings'){if(typeof b.enabled!=='boolean')throw Error('Invalid setting');await pool.query('UPDATE social_reel_settings SET enabled=$1 WHERE id=1',[b.enabled]);await event('Reel automation '+(b.enabled?'enabled':'paused'));}
 else if(b.action==='reel-reconcile'){const result=await locked('social-publish',async()=>{const p=(await pool.query("SELECT * FROM social_reels WHERE id=$1 AND status='needs-attention'",[b.id])).rows[0];if(!p)throw Error('Reel not found');await reconcileReel(p);return true;});if(result===null)throw Error('Publication is running');}
 else if(b.action==='sync'){await syncHistory();}
 else if(b.action==='generate'){await fillQueue();}
 else if(b.action==='approve-all'){await syncHistory();const outcome=await locked('social-publish',async()=>{const posts=(await pool.query("SELECT * FROM social_posts WHERE status='draft' AND day >= $1",[dayKey()])).rows;for(const p of posts){await requireDistinct(p.content,p.id);}await pool.query("UPDATE social_posts SET status='approved',updated_at=now() WHERE status='draft' AND day >= $1",[dayKey()]);return true;});if(outcome===null)throw Error('Publication is running');}
 else if(['save','approve','draft','reconcile'].includes(b.action)){
  if(b.action==='approve'||b.action==='save')await syncHistory();
  const result=await locked('social-publish',async()=>{
   const p=(await pool.query('SELECT * FROM social_posts WHERE id=$1',[b.id])).rows[0];if(!p)throw Error('Post not found');
   if(b.action==='reconcile'){if(p.status!=='needs-attention')throw Error('Nothing to reconcile');await reconcile(p);return;}
   if(!['draft','approved'].includes(p.status))throw Error('Post cannot be edited in this state');
   if(b.action==='save'){const c=validate(b.content);await requireDistinct(c,p.id);await requireFreshVisual(c,p.id);const image=await render(c,crypto.randomUUID());await pool.query("UPDATE social_posts SET content=$2,image=$3,status='draft',updated_at=now() WHERE id=$1",[p.id,c,image]);}
   else {if(b.action==='approve')await requireDistinct(p.content,p.id);await pool.query('UPDATE social_posts SET status=$2,updated_at=now() WHERE id=$1',[p.id,b.action==='approve'?'approved':'draft']);}
   return true;
  });if(result===null)throw Error('Publication is running; try again shortly');
 }else throw Error('Unknown action');
 return Response.json({ok:true});
 }catch(e){return Response.json({error:e.message},{status:400});}
}
