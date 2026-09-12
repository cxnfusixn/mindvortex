import {pool,event} from './lib/db.mjs';
import {render} from './lib/render.mjs';
import {publishDue} from './lib/instagram.mjs';
try{
 const id='013e87be-5307-469c-8e9f-3e7a30bbe7f4';
 const p=(await pool.query('SELECT * FROM social_posts WHERE id=$1',[id])).rows[0];
 if(p.status!=='verified'||!p.permalink?.includes('DdJaznGiBFr'))throw Error('Unexpected post state; correction aborted');
 const image=await render(p.content,crypto.randomUUID());
 await event('Visual correction: original DdJaznGiBFr removed through Instagram UI; replacement uses studio-square-v1.');
 await pool.query("UPDATE social_posts SET image=$2,content=$3,status='approved',container_id=NULL,media_id=NULL,permalink=NULL,metrics=NULL,error=NULL,created_at=now(),updated_at=now() WHERE id=$1",[id,image,p.content]);
 await publishDue();
 console.log((await pool.query('SELECT status,permalink FROM social_posts WHERE id=$1',[id])).rows);
}finally{await pool.end();}
