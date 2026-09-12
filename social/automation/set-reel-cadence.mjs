import {init,pool,locked} from './lib/db.mjs';
import {reelSlots} from './lib/reel-schedule.mjs';
try{await init();await locked('reel-generation',()=>locked('social-publish',async c=>{
 const existing=(await c.query('SELECT interval_days,horizon FROM social_reel_settings WHERE id=1')).rows[0];if(existing.interval_days===2&&existing.horizon===11){console.log('Cadence already configured');return;}
 await c.query('BEGIN');try{
 await c.query("UPDATE social_reel_settings SET interval_days=2,anchor_day='2026-09-11',horizon=11 WHERE id=1");
 await c.query("DELETE FROM social_jobs WHERE name LIKE 'reel-generation-%' AND completed_at>=CURRENT_DATE");
 const cfg=(await c.query('SELECT *,anchor_day::text FROM social_reel_settings WHERE id=1')).rows[0],days=reelSlots(cfg);
 const pending=(await c.query("SELECT id,day::text FROM social_reels WHERE status='approved' ORDER BY day")).rows;
 for(let i=0;i<pending.length;i++)await c.query("UPDATE social_reels SET day=DATE '2099-01-01'+$2::int WHERE id=$1",[pending[i].id,i]);
 for(let i=0;i<pending.length;i++)await c.query('UPDATE social_reels SET day=$2,updated_at=now() WHERE id=$1',[pending[i].id,days[i]||days.at(-1)]);
 await c.query('COMMIT');console.log('Cadence: every 2 days; horizon: 11; rescheduled:',pending.length);
 }catch(e){await c.query('ROLLBACK');throw e;}
}));}finally{await pool.end();}
