import {pool,locked,event} from './db.mjs';
import {graph} from './instagram.mjs';

export async function syncHistory(){return locked('social-history',async()=>{
 const me=await graph('me',{fields:'user_id,username'});
 if(me.username!=='mindvortex.pro'||String(me.user_id)!==process.env.INSTAGRAM_USER_ID)throw Error('Instagram account mismatch');
 let after,count=0;
 do{
  const page=await graph(process.env.INSTAGRAM_USER_ID+'/media',{fields:'id,caption,timestamp,permalink,media_type,media_url',limit:100,...(after?{after}:{})});
  for(const p of page.data||[]){
   await pool.query(`INSERT INTO social_history(media_id,caption,published_at,permalink,media_type,media_url) VALUES($1,$2,$3,$4,$5,$6)
    ON CONFLICT(media_id) DO UPDATE SET caption=excluded.caption,permalink=excluded.permalink,media_url=excluded.media_url,synced_at=now()`,[p.id,p.caption||'',p.timestamp,p.permalink,p.media_type,p.media_url||null]);count++;
  }
  after=page.paging?.next?page.paging?.cursors?.after:null;
 }while(after);
 await pool.query("INSERT INTO social_health(name,checked_at) VALUES('instagram-history',now()) ON CONFLICT(name) DO UPDATE SET checked_at=now()");
 await event(`Instagram history synced: ${count} posts`);return count;
});}
export async function contentHistory(excludeId){
 const rows=(await pool.query(`SELECT id::text AS ref,day::text,content,permalink FROM social_posts WHERE ($1::uuid IS NULL OR id<>$1)
 UNION ALL SELECT id::text,day::text,content,permalink FROM social_reels WHERE ($1::uuid IS NULL OR id<>$1)
 UNION ALL SELECT id::text,day::text,content,permalink FROM social_tiktok_jobs WHERE kind='reel' AND reel_id IS NULL AND ($1::uuid IS NULL OR id<>$1)
 UNION ALL SELECT 'ig:'||h.media_id,to_char(h.published_at AT TIME ZONE 'Europe/Warsaw','YYYY-MM-DD'),
 jsonb_build_object('caption',h.caption,'topic',h.editorial_note,'headline','','project','none'),h.permalink
 FROM social_history h WHERE NOT EXISTS(SELECT 1 FROM social_posts p WHERE p.media_id=h.media_id) AND NOT EXISTS(SELECT 1 FROM social_reels r WHERE r.media_id=h.media_id)
 ORDER BY day DESC`,[excludeId||null])).rows;
 return rows.map(x=>({ref:x.ref,day:x.day,permalink:x.permalink,...x.content}));
}
