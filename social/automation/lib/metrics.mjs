import {pool,locked} from './db.mjs';
import {graph} from './instagram.mjs';

export function metricValue(result){
 const value=result?.data?.[0]?.values?.[0]?.value??result?.data?.[0]?.total_value?.value;
 return typeof value==='number'&&Number.isFinite(value)&&value>=0?value:null;
}
export async function collectMetrics(){return locked('social-metrics',async()=>{
 const media=(await pool.query(`SELECT media_id FROM social_history UNION SELECT media_id FROM social_posts WHERE status='verified' UNION SELECT media_id FROM social_reels WHERE status='verified'`)).rows.filter(p=>p.media_id);
 for(const p of media){
  const metrics={},errors=[];
  for(const name of ['views','reach','likes','comments','saved','shares']){
   try{metrics[name]=metricValue(await graph(p.media_id+'/insights',{metric:name}));if(metrics[name]===null)errors.push(name);}catch{metrics[name]=null;errors.push(name);}
  }
  if(metrics.likes===null||metrics.comments===null){try{const counts=await graph(p.media_id,{fields:'like_count,comments_count'});if(metrics.likes===null&&Number.isFinite(counts.like_count))metrics.likes=counts.like_count;if(metrics.comments===null&&Number.isFinite(counts.comments_count))metrics.comments=counts.comments_count;}catch{}}
  metrics.collectedAt=new Date().toISOString();metrics.unavailable=errors.filter(k=>metrics[k]===null);
  await pool.query(`INSERT INTO social_metrics(media_id,metrics) VALUES($1,$2) ON CONFLICT(media_id) DO UPDATE SET metrics=excluded.metrics`,[p.media_id,metrics]);
  await pool.query("INSERT INTO social_metric_samples(media_id,bucket,metrics) VALUES($1,date_trunc('hour',now()),$2) ON CONFLICT(media_id,bucket) DO UPDATE SET metrics=excluded.metrics",[p.media_id,metrics]);
  await pool.query('UPDATE social_posts SET metrics=$2 WHERE media_id=$1',[p.media_id,metrics]);
 }
});}
export async function dashboardMetrics(){return (await pool.query(`
 WITH publications AS (
 SELECT media_id,day::text AS day,content->>'topic' AS topic,'post' AS format,permalink FROM social_posts WHERE status='verified'
 UNION ALL SELECT media_id,day::text,content->>'topic','reel',permalink FROM social_reels WHERE status='verified'
 UNION ALL SELECT h.media_id,to_char(h.published_at AT TIME ZONE 'Europe/Warsaw','YYYY-MM-DD'),coalesce(nullif(h.editorial_note,''),left(h.caption,100)),CASE WHEN h.media_type='VIDEO' THEN 'reel' ELSE 'post' END,h.permalink FROM social_history h
 WHERE NOT EXISTS(SELECT 1 FROM social_posts p WHERE p.media_id=h.media_id) AND NOT EXISTS(SELECT 1 FROM social_reels r WHERE r.media_id=h.media_id))
 SELECT p.*,m.metrics,'instagram' AS platform FROM publications p LEFT JOIN social_metrics m USING(media_id)
 UNION ALL SELECT 'tt:'||h.id,to_char(h.published_at AT TIME ZONE 'Europe/Warsaw','YYYY-MM-DD'),coalesce(j.content->>'topic',left(h.caption,100)),CASE WHEN j.kind='carousel' THEN 'post' ELSE 'reel' END,h.permalink,h.metrics,'tiktok' FROM social_tiktok_history h LEFT JOIN social_tiktok_jobs j ON j.buffer_id=h.id ORDER BY day DESC`)).rows;}
