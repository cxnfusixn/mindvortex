import {replaceRequested} from './lib/replacements.mjs';
import {prepareTikTokReels} from './lib/tiktok-generation.mjs';
import {syncBufferHistory} from './lib/buffer.mjs';
import {publishTikTok,reconcileTikTok} from './lib/tiktok.mjs';
import {prepareCarousels} from './lib/tiktok-carousel.mjs';
import {collectMetrics} from './lib/metrics.mjs';
import {init,pool,event,settings,locked} from './lib/db.mjs';
import {fillQueue,maintainQueue} from './lib/generate.mjs';
import {publishDue,insights,refreshToken} from './lib/instagram.mjs';
import {dayKey,addDays} from './lib/brand.mjs';
import {sendMail} from './lib/auth.mjs';
import {syncHistory} from './lib/history.mjs';
import {fillReelQueue} from './lib/reel-generation.mjs';
import {publishReels} from './lib/reel-publish.mjs';
await init();
await event('Worker started');
await pool.query("UPDATE social_posts SET status='needs-attention',error='Worker interrupted during upload; no publish request retried' WHERE status='uploading'");
async function once(name,fn){return locked(name,async()=>{
 if((await pool.query('SELECT 1 FROM social_jobs WHERE name=$1',[name])).rowCount)return;
 const attempt=(await pool.query('SELECT * FROM social_job_attempts WHERE name=$1',[name])).rows[0];
 if(attempt&&(attempt.attempts>=3||new Date(attempt.next_at)>new Date()))return;
 await pool.query("INSERT INTO social_job_attempts(name,attempts,next_at) VALUES($1,1,now()+interval '15 minutes') ON CONFLICT(name) DO UPDATE SET attempts=social_job_attempts.attempts+1,next_at=now()+interval '15 minutes'",[name]);
 try{await fn();}catch(e){await event('Job retry scheduled: '+name+' / '+e.message);return;}await pool.query('INSERT INTO social_jobs(name) VALUES($1) ON CONFLICT DO NOTHING',[name]);
});}
const mail=sendMail;
async function tick(){
 const day=dayKey();
 await pool.query("INSERT INTO social_health(name,checked_at) VALUES('worker',now()) ON CONFLICT(name) DO UPDATE SET checked_at=now()");
 await publishDue();
 await publishReels();
 await publishTikTok();
 await replaceRequested();
 await once('history-'+day,syncHistory);
 await pool.query("DELETE FROM social_sessions WHERE expires_at<now(); DELETE FROM social_challenges WHERE expires_at<now(); DELETE FROM social_login_attempts WHERE at<now()-interval '1 day'");
 try{await refreshToken();}catch{await once('token-alert-'+day,()=>mail('Mind Vortex: renew Instagram access','Token refresh failed. Open the social dashboard and renew Instagram access.'));}
 if(!(await settings()).paused){await once('generation-'+day,async()=>{try{await fillQueue();}catch(e){await event(e.message);await once('generation-alert-'+day,()=>mail('Mind Vortex: content generation failed',e.message));throw e;}});}
 if((await settings()).autopilot&&!(await settings()).paused)await once('queue-review-'+day,maintainQueue);
 await publishDue();
 await publishReels();
 await publishTikTok();
 if(!(await settings()).paused)await once('reel-generation-'+day,fillReelQueue);
 const reelErrors=(await pool.query("SELECT day::text,error FROM social_reels WHERE status='needs-attention' OR (day<$1 AND status='approved') ORDER BY day DESC LIMIT 5",[day])).rows;
 if(reelErrors.length)await once('reel-alert-'+day,()=>mail('Mind Vortex: Reel needs attention',reelErrors.map(x=>x.day+': '+(x.error||'Missed slot')).join('\n')));
 const next=(await pool.query('SELECT status FROM social_posts WHERE day=$1',[addDays(day,1)])).rows[0];
 if(!(await settings()).paused&&(!next||next.status==='draft'))await once('queue-alert-'+day,()=>mail('Mind Vortex: tomorrow’s post needs approval','Open https://mindvortex.pro/studio-social and approve the next post or prepare the queue.'));
 await once('buffer-'+new Date().toISOString().slice(0,13),async()=>{await syncBufferHistory();await reconcileTikTok();});
 await once('tiktok-daily-reels-'+day,prepareTikTokReels);
 await once('tiktok-carousels-'+day,prepareCarousels);
 const tiktokErrors=(await pool.query("SELECT day::text,error FROM social_tiktok_jobs WHERE status='needs-attention' OR (day<$1 AND status='ready') OR (status IN ('submitted','submitting') AND updated_at<now()-interval '2 hours') ORDER BY day DESC LIMIT 5",[day])).rows;
 if(tiktokErrors.length)await once('tiktok-alert-'+day,()=>mail('Mind Vortex: TikTok needs attention',tiktokErrors.map(x=>x.day+': '+(x.error||'Publication not confirmed')).join('\n')));
 await once('metrics-'+new Date().toISOString().slice(0,13),collectMetrics);
 const errors=(await pool.query("SELECT day::text,error FROM social_posts WHERE status='needs-attention' ORDER BY day DESC LIMIT 5")).rows;
 if(errors.length)await once('alert-'+day,()=>mail('Mind Vortex: publication needs attention',errors.map(x=>x.day+': '+x.error).join('\n')));
 if(new Date(day+'T12:00:00Z').getUTCDay()===1)await once('report-'+day,async()=>{const posts=(await pool.query("SELECT day::text,content->>'topic' AS topic,metrics,permalink FROM social_posts WHERE status='verified' AND day>=CURRENT_DATE-7 ORDER BY day")).rows;await mail('Mind Vortex: weekly Instagram report',JSON.stringify(posts,null,2));});
}
async function run(){for(;;){try{await tick();}catch(e){await event('Worker cycle error: '+e.message);}await new Promise(r=>setTimeout(r,60000));}}
async function publicationLoop(){for(;;){try{await publishDue();await publishReels();await publishTikTok();}catch(e){await event('Publication cycle: '+e.message);}await new Promise(r=>setTimeout(r,15000));}}
await Promise.all([run(),publicationLoop()]);
