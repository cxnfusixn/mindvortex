import {pool,locked} from './lib/db.mjs';
import {carouselSlots} from './lib/tiktok-carousel.mjs';
try{await locked('tiktok-carousels',()=>locked('tiktok-publish',async c=>{
 if((await c.query("SELECT 1 FROM social_jobs WHERE name='carousel-cadence-v2'")).rowCount)return;
 const cfg=(await c.query('SELECT *,anchor_day::text FROM social_reel_settings WHERE id=1')).rows[0],slots=carouselSlots(cfg);
 const pending=(await c.query("SELECT id,day::text FROM social_tiktok_jobs WHERE kind='carousel' AND status='ready' ORDER BY day")).rows;
 await c.query('BEGIN');try{for(let i=0;i<pending.length;i++){if(!slots[i])throw Error('More pending carousels than schedule slots');await c.query('UPDATE social_tiktok_jobs SET day=$2,updated_at=now() WHERE id=$1',[pending[i].id,slots[i]]);}await c.query("INSERT INTO social_jobs(name) VALUES('carousel-cadence-v2') ON CONFLICT DO NOTHING");await c.query('COMMIT');console.log('Carousel dates:',slots.join(', '));}catch(e){await c.query('ROLLBACK');throw e;}
}));}finally{await pool.end();}
