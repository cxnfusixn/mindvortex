import {requireFreshVisual,recordVisual} from './visuals.mjs';
import {ensureFreshPost} from './generate.mjs';
import {syncHistory} from './history.mjs';
import {requireDistinct} from './duplicates.mjs';
import {TEMPLATE_VERSION} from './render.mjs';
import {pool,locked,event,settings} from './db.mjs';
import {caption,validate,dayKey} from './brand.mjs';
export async function graph(path,params={},method='GET'){
 const token=(await pool.query('SELECT token FROM social_tokens WHERE id=1')).rows[0]?.token;
 if(!token)throw Error('Instagram token missing');
 const url=new URL('https://graph.instagram.com/v26.0/'+path);
 if(method==='GET')for(const [k,v]of Object.entries(params))url.searchParams.set(k,String(v));
 const r=await fetch(url,{method,headers:{Authorization:'Bearer '+token,...(method==='POST'?{'Content-Type':'application/x-www-form-urlencoded'}:{})},body:method==='POST'?new URLSearchParams(params):undefined,signal:AbortSignal.timeout(30000)});
 const data=await r.json();if(!r.ok)throw Error(`Instagram HTTP ${r.status}, code ${data.error?.code||'unknown'}`);return data;
}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
export function sameCaption(a,b){return a?.replace(/\r\n/g,'\n').trim()===b?.replace(/\r\n/g,'\n').trim();}
async function verify(post,id){const media=await graph(id,{fields:'id,caption,permalink,media_type'});if(!sameCaption(media.caption,caption(post.content))||media.media_type!=='IMAGE')throw Error('Published media or caption mismatch');await recordVisual(post.content,id);await pool.query("UPDATE social_posts SET status='verified',media_id=$2,permalink=$3,error=NULL,updated_at=now() WHERE id=$1",[post.id,id,media.permalink]);await event('Publication verified: '+post.day);return media;}
export async function reconcile(post){
 if(post.media_id)return verify(post,post.media_id);
 const recent=await graph(process.env.INSTAGRAM_USER_ID+'/media',{fields:'id,caption,timestamp',limit:50});
 const matches=(recent.data||[]).filter(m=>sameCaption(m.caption,caption(post.content))&&new Date(m.timestamp)>=new Date(post.created_at));
 if(matches.length===1)return verify(post,matches[0].id);
 throw Error('Publication outcome uncertain. Manual reconciliation required; no automatic re-post.');
}
export async function publishDue(){return locked('social-publish',async()=>{
 const cfg=await settings();if(cfg.paused)return;
 const hour=Number(new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Warsaw',hour:'2-digit',hourCycle:'h23'}).format(new Date()));
 let post=(await pool.query("SELECT *,day::text FROM social_posts WHERE (manual_requested_at IS NOT NULL AND status IN ('approved','publishing','verifying')) OR (day=$1 AND $2) ORDER BY manual_requested_at NULLS LAST LIMIT 1",[dayKey(),hour>=cfg.hour])).rows[0];if(!post)return;
 if(post.status==='approved'&&post.content.templateVersion!==TEMPLATE_VERSION)throw Error('Graphic template requires regeneration before publication');
 if(['publishing','verifying'].includes(post.status)){try{await reconcile(post);}catch{await pool.query("UPDATE social_posts SET status='needs-attention',error='Uncertain publication; inspect Instagram before retrying' WHERE id=$1",[post.id]);await event('Uncertain publication requires attention');}return;}
 if(post.status!=='approved'&&!(cfg.autopilot&&post.status==='draft'))return;
 try{
  await syncHistory();
  if(cfg.autopilot)post=await ensureFreshPost(post);else await requireDistinct(post.content,post.id);
  await requireFreshVisual(post.content,post.id);
  validate(post.content);const me=await graph('me',{fields:'user_id,username'});if(me.username!=='mindvortex.pro'||String(me.user_id)!==process.env.INSTAGRAM_USER_ID)throw Error('Instagram account mismatch');
  if((await settings()).paused)return;
  await pool.query("UPDATE social_posts SET status='uploading',updated_at=now() WHERE id=$1",[post.id]);
  const created=await graph(process.env.INSTAGRAM_USER_ID+'/media',{image_url:process.env.SOCIAL_PUBLIC_URL+'/media/'+post.image,caption:caption(post.content),alt_text:post.content.alt},'POST');
  if(!created.id)throw Error('Missing container ID');
  await pool.query('UPDATE social_posts SET container_id=$2 WHERE id=$1',[post.id,created.id]);
  let ready=false;for(let i=0;i<12;i++){const c=await graph(created.id,{fields:'status_code'});if(c.status_code==='FINISHED'){ready=true;break;}if(['ERROR','EXPIRED'].includes(c.status_code))throw Error('Media container failed');await sleep(5000);}if(!ready)throw Error('Container processing timed out');
  if((await settings()).paused){await pool.query("UPDATE social_posts SET status='draft',container_id=NULL WHERE id=$1",[post.id]);return;}
  // Persist intent BEFORE the only publish request. No blind retry after this point.
  await pool.query("UPDATE social_posts SET status='publishing',updated_at=now() WHERE id=$1",[post.id]);post.status='publishing';
  const result=await graph(process.env.INSTAGRAM_USER_ID+'/media_publish',{creation_id:created.id},'POST');
  if(!result.id)throw Error('Publication response missing media ID');
  await pool.query("UPDATE social_posts SET status='verifying',media_id=$2 WHERE id=$1",[post.id,result.id]);
  await sleep(3000);await verify(post,result.id);
 }catch(error){await pool.query("UPDATE social_posts SET status='needs-attention',error=$2,updated_at=now() WHERE id=$1",[post.id,error.message]);await event('Publication requires attention: '+error.message);}
});}
export async function insights(){const posts=(await pool.query("SELECT id,media_id FROM social_posts WHERE status='verified' ORDER BY day DESC LIMIT 30")).rows;for(const p of posts){const metrics={collectedAt:new Date().toISOString()};for(const name of ['reach','saved','likes','comments','shares']){try{const r=await graph(p.media_id+'/insights',{metric:name});metrics[name]=r.data?.[0]?.values?.[0]?.value??null;}catch{metrics[name]=null;}}await pool.query('UPDATE social_posts SET metrics=$2 WHERE id=$1',[p.id,metrics]);}}
export async function refreshToken(){const row=(await pool.query('SELECT * FROM social_tokens WHERE id=1')).rows[0];if(!row||Date.now()-new Date(row.refreshed_at).getTime()<7*86400000)return;
 const url=new URL('https://graph.instagram.com/refresh_access_token');url.searchParams.set('grant_type','ig_refresh_token');url.searchParams.set('access_token',row.token);
 let r;try{r=await fetch(url,{signal:AbortSignal.timeout(30000)});}catch{throw Error('Token refresh network error');}const d=await r.json();if(!r.ok||!d.access_token)throw Error('Instagram token refresh failed');await pool.query('UPDATE social_tokens SET token=$1,refreshed_at=now() WHERE id=1',[d.access_token]);await event('Instagram token refreshed');
}
