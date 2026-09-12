import {pool} from './lib/db.mjs';
import {contentHistory} from './lib/history.mjs';
import {freshCandidate} from './lib/generate.mjs';
try{
 const p=(await pool.query("SELECT *,day::text FROM social_posts WHERE day='2026-09-18'")).rows[0];
 if(p.status!=='approved'||p.content.project!=='none')throw Error('Slot changed; aborting');
 const {content,image}=await freshCandidate(p.day,'portfolio',await contentHistory(p.id),p.id);
 await pool.query('INSERT INTO social_revisions(post_id,content,image,reason) VALUES($1,$2,$3,$4)',[p.id,p.content,p.image,'Use a distinct website section as authorized']);
 await pool.query('UPDATE social_posts SET content=$2,image=$3,error=NULL WHERE id=$1',[p.id,content,image]);
 console.log({day:p.day,topic:content.topic,section:content.visualAssetKey,image});
}finally{await pool.end();}
