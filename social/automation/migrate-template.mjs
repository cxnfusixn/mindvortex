import {pool} from './lib/db.mjs';
import {render,TEMPLATE_VERSION} from './lib/render.mjs';
try {
 const posts=(await pool.query("SELECT id,content,status FROM social_posts WHERE status IN ('draft','approved')")).rows;
 for(const p of posts){const image=await render(p.content,crypto.randomUUID());await pool.query('UPDATE social_posts SET image=$2,content=$3,updated_at=now() WHERE id=$1',[p.id,image,p.content]);}
 console.log('Updated queued graphics:',posts.length,TEMPLATE_VERSION);
} finally {await pool.end();}
