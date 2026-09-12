import {pool} from './db.mjs';
export async function buffer(query,variables={}){
 if(!process.env.BUFFER_API_KEY)throw Error('Buffer API key is not configured');
 let response;try{response=await fetch('https://api.buffer.com',{method:'POST',headers:{Authorization:'Bearer '+process.env.BUFFER_API_KEY,'Content-Type':'application/json'},body:JSON.stringify({query,variables}),signal:AbortSignal.timeout(45000)});}catch{throw Error('Buffer network outcome uncertain');}
 const body=await response.json();if(!response.ok||body.errors?.length)throw Error('Buffer API request failed (HTTP '+response.status+')');return body.data;
}
export async function verifyBufferChannel(){
 const account=await buffer('{account{organizations{id}}}');
 for(const org of account.account.organizations){const result=await buffer('query($id:OrganizationId!){channels(input:{organizationId:$id}){id name service}}',{id:org.id});
  const channel=result.channels.find(c=>c.id===process.env.BUFFER_TIKTOK_CHANNEL_ID&&c.service==='tiktok');
  if(channel)return {channelId:channel.id,organizationId:org.id};
 }throw Error('Buffer TikTok account mismatch');
}
export function normalizeBufferMetrics(post){
 const raw=new Map((post.metrics||[]).map(m=>[m.type,m.value]));
 const value=key=>Number.isFinite(raw.get(key))?raw.get(key):null;
 return {views:value('views'),likes:value('reactions'),comments:value('comments'),reach:value('reach'),saved:value('saves'),shares:value('shares'),collectedAt:post.metricsUpdatedAt};
}
export async function syncBufferHistory(){
 if(!process.env.BUFFER_API_KEY||!process.env.BUFFER_TIKTOK_CHANNEL_ID)return;
 const cfg={channelId:process.env.BUFFER_TIKTOK_CHANNEL_ID,organizationId:process.env.BUFFER_ORGANIZATION_ID};if(!cfg.organizationId)throw Error('Buffer organization is not configured');let after;
 do{const result=await buffer(`query($org:OrganizationId!,$channel:ChannelId!,$after:String){posts(first:100,after:$after,input:{organizationId:$org,filter:{channelIds:[$channel],status:[sent]}}){edges{node{id text externalLink sentAt metrics{type value} metricsUpdatedAt}}pageInfo{hasNextPage endCursor}}}`,{org:cfg.organizationId,channel:cfg.channelId,after});
  for(const {node:p} of result.posts.edges||[]){const metrics=normalizeBufferMetrics(p);await pool.query(`INSERT INTO social_tiktok_history(id,caption,permalink,published_at,metrics) VALUES($1,$2,$3,$4,$5) ON CONFLICT(id) DO UPDATE SET caption=excluded.caption,permalink=excluded.permalink,metrics=excluded.metrics`,[p.id,p.text,p.externalLink,p.sentAt,metrics]);if(metrics.collectedAt)await pool.query("INSERT INTO social_metric_samples(media_id,bucket,metrics) VALUES($1,date_trunc('hour',$2::timestamptz),$3) ON CONFLICT(media_id,bucket) DO UPDATE SET metrics=excluded.metrics",['tt:'+p.id,metrics.collectedAt,metrics]);}
  after=result.posts.pageInfo.hasNextPage?result.posts.pageInfo.endCursor:null;
 }while(after);
}
