import {pool,settings} from './db.mjs';
import {dashboardMetrics} from './metrics.mjs';
import {growthPolicy,growthSummary,median,perThousand,experimentFor} from './growth.mjs';
import {reelSlots,carouselSlots,tiktokReelSlots,queueHorizons} from './reel-schedule.mjs';
import {dayKey,addDays,kindFor,brand,writingRules} from './brand.mjs';
export async function growthData(){
  const now=new Date(),day=dayKey(now),cfg=(await pool.query('SELECT *,anchor_day::text FROM social_reel_settings WHERE id=1')).rows[0],postCfg=await settings();
  const analytics=await dashboardMetrics();
  const meta=(await pool.query("SELECT media_id,content FROM social_posts WHERE status='verified' UNION ALL SELECT media_id,content FROM social_reels WHERE status='verified' UNION ALL SELECT 'tt:'||buffer_id,content FROM social_tiktok_jobs WHERE status='published'")).rows;
  const metadata=new Map(meta.map(x=>[x.media_id,x.content]));
  const rows=analytics.map(x=>({...x,growth:metadata.get(x.media_id)?.growth,category:metadata.get(x.media_id)?.category}));
  const prepared=(await pool.query("SELECT day::text,'instagram' AS platform,'post' AS format,status,content->>'topic' AS topic FROM social_posts UNION ALL SELECT day::text,'instagram','reel',status,content->>'topic' FROM social_reels UNION ALL SELECT day::text,'tiktok',CASE WHEN kind='carousel' THEN 'post' ELSE 'reel' END,status,content->>'topic' FROM social_tiktok_jobs")).rows;
  const slots=[];
  function add(days,platform,format,hour){for(const d of days){const item=prepared.find(x=>x.day===d&&x.platform===platform&&x.format===format);const mirror=platform==='tiktok'&&format==='reel'?prepared.find(x=>x.day===d&&x.platform==='instagram'&&x.format==='reel'):null;slots.push({day:d,platform,format,hour,status:item?.status||(mirror?'mirror':'missing'),topic:item?.topic||mirror?.topic||'',kind:format==='post'&&platform==='instagram'?kindFor(d):format,hook:item?'existing':experimentFor(d).id});}}
  add(Array.from({length:queueHorizons.posts},(_,i)=>addDays(day,i+1)),'instagram','post',postCfg.hour);
  add(reelSlots(cfg,now),'instagram','reel',cfg.hour);add(tiktokReelSlots(now),'tiktok','reel',cfg.hour);add(carouselSlots(cfg,now),'tiktok','post',cfg.hour);
  const reports=(await pool.query('SELECT day::text,data,created_at FROM social_growth_reports ORDER BY day DESC LIMIT 6')).rows;
  return {policy:growthPolicy,brand,writingRules,paused:postCfg.paused,reelsEnabled:cfg.enabled,slots:slots.sort((a,b)=>a.day.localeCompare(b.day)||a.hour-b.hour),
    summaries:Object.fromEntries(['instagram','tiktok'].map(p=>[p,growthSummary(rows,p,now)])),reports,
    discoverySettings:(await pool.query('SELECT * FROM social_discovery WHERE id=1')).rows[0],
    engagement:(await pool.query('SELECT * FROM social_engagement ORDER BY created_at DESC LIMIT 100')).rows,
    discovery:(await pool.query("SELECT message,created_at FROM social_events WHERE message LIKE 'Growth:%' OR message LIKE 'Job retry scheduled: growth-discovery-%' ORDER BY id DESC LIMIT 1")).rows[0]||null};
}
export async function captureGrowthReport(){
  const day=dayKey(),monday=addDays(day,-((new Date(day+'T12:00:00Z').getUTCDay()+6)%7));
  if((await pool.query('SELECT 1 FROM social_growth_reports WHERE day=$1',[monday])).rowCount)return;
  const data=await growthData();
  // Compare first available readings between 48 and 72 hours after actual publication.
  // Historical posts without that reading are not silently compared at different ages.
  const samples=(await pool.query(`WITH published AS (
    SELECT h.media_id,h.published_at,coalesce(p.content,r.content) AS content,CASE WHEN h.media_type='VIDEO' THEN 'reel' ELSE 'post' END AS format,'instagram' AS platform FROM social_history h LEFT JOIN social_posts p USING(media_id) LEFT JOIN social_reels r USING(media_id)
    UNION ALL SELECT 'tt:'||h.id,h.published_at,j.content,CASE WHEN j.kind='carousel' THEN 'post' ELSE 'reel' END,'tiktok' FROM social_tiktok_history h JOIN social_tiktok_jobs j ON j.buffer_id=h.id)
    SELECT p.*,s.metrics FROM published p JOIN LATERAL (SELECT metrics FROM social_metric_samples WHERE media_id=p.media_id AND bucket>=p.published_at+interval '48 hours' AND bucket<p.published_at+interval '72 hours' ORDER BY bucket LIMIT 1) s ON true WHERE p.published_at>=now()-interval '30 days' AND p.content->'growth'->>'version'=$1`,[growthPolicy.version])).rows;
  const experiments=[];
  for(const platform of ['instagram','tiktok'])for(const format of ['post','reel'])for(const hook of growthPolicy.hooks){
    const group=samples.filter(p=>p.platform===platform&&p.format===format&&p.content.growth.hook===hook.id&&p.metrics.views>=growthPolicy.minimumViews&&Number.isFinite(p.metrics.shares));
    experiments.push({platform,format,hook:hook.id,n:group.length,medianSharesPer1000:median(group.map(p=>perThousand(p.metrics.shares,p.metrics.views))),ready:group.length>=growthPolicy.minimumExamples});
  }
  const report={summaries:data.summaries,experiments,createdAt:new Date().toISOString()};
  await pool.query('INSERT INTO social_growth_reports(day,data) VALUES($1,$2) ON CONFLICT DO NOTHING',[monday,report]);
}
export async function growthExperiment(day,platform,format){
  const baseline=experimentFor(day);
  // Freeze the chosen review for a two-week generation window; never rewrite queued assets.
  const boundary=new Date(Math.floor(Date.parse(day+'T12:00:00Z')/(14*86400000))*14*86400000).toISOString().slice(0,10);
  const review=(await pool.query('SELECT data FROM social_growth_reports WHERE day<=$1 ORDER BY day DESC LIMIT 1',[boundary])).rows[0]?.data;
  const groups=(review?.experiments||[]).filter(g=>g.platform===platform&&g.format===format);
  if(groups.length!==3||groups.some(g=>!g.ready))return baseline;
  const sorted=groups.sort((a,b)=>b.medianSharesPer1000-a.medianSharesPer1000);
  if(sorted[0].medianSharesPer1000<=sorted[1].medianSharesPer1000)return baseline;
  // Keep one third of slots exploring other hooks. This is an editorial heuristic, not causality.
  const ordinal=Math.floor(Date.parse(day+'T12:00:00Z')/86400000);
  if(ordinal%3===0)return {...growthPolicy.hooks[Math.floor(ordinal/3)%3],version:growthPolicy.version};
  return {...growthPolicy.hooks.find(h=>h.id===sorted[0].hook),version:growthPolicy.version,review:boundary};
}
