import assert from 'node:assert/strict';
import {pool,init} from '../lib/db.mjs';
import {updateEngagement,addEngagement} from '../lib/engagement.mjs';
import {growthData,growthExperiment} from '../lib/growth-data.mjs';
await init();
const client=await pool.connect(),original=pool.query;
try{
 await client.query('BEGIN');pool.query=client.query.bind(client);
 const url='https://www.instagram.com/p/QA_'+crypto.randomUUID().replaceAll('-','')+'/';
 await addEngagement(url,'A test of readable navigation and clear website labels.');
 await addEngagement(url+'?utm_source=duplicate','A test of readable navigation and clear website labels.');
 const rows=(await pool.query('SELECT * FROM social_engagement WHERE source_url=$1',[url])).rows;assert.equal(rows.length,1);
 const b={id:rows[0].id,draft:'Clear labels help people predict where a link leads.',outcome:''};
 await assert.rejects(()=>updateEngagement({...b,status:'done'}));
 await updateEngagement({...b,status:'approved'});await updateEngagement({...b,status:'done',outcome:'QA transaction only'});
 assert.equal((await pool.query('SELECT status FROM social_engagement WHERE id=$1',[b.id])).rows[0].status,'done');
 const data=await growthData();assert.ok(data.slots.some(s=>s.platform==='instagram'));assert.ok(data.slots.some(s=>s.platform==='tiktok'));
 assert.equal((await growthExperiment('2026-09-13','instagram','reel')).version,'growth-v1');
 const experiments=['observation','question','contrast'].map(hook=>({platform:'instagram',format:'reel',hook,n:5,ready:true,medianSharesPer1000:hook==='contrast'?20:5}));
 await pool.query("INSERT INTO social_growth_reports(day,data) VALUES('2098-01-01',$1)",[{experiments}]);
 const days=['2099-01-01','2099-01-02','2099-01-03','2099-01-04','2099-01-05','2099-01-06','2099-01-07','2099-01-08','2099-01-09'];
 const choices=[];for(const day of days)choices.push(await growthExperiment(day,'instagram','reel'));
 assert.ok(choices.filter(c=>c.id==='contrast').length>=6);assert.equal(new Set(choices.map(c=>c.id)).size,3,'Exploration must retain all hooks');
 await pool.query("UPDATE social_growth_reports SET data=$1 WHERE day='2098-01-01'",[{experiments:experiments.map(x=>({...x,ready:false,n:1}))}]);
 const unchanged=[];for(const day of days.slice(0,3))unchanged.push(await growthExperiment(day,'instagram','reel'));assert.equal(new Set(unchanged.map(c=>c.id)).size,3,'Small samples must not bias allocation');
 console.log('Growth integration: real queries, queue integration, deduplicated targets and manual-only transitions passed; test records rolled back.');
}finally{pool.query=original;await client.query('ROLLBACK');client.release();await pool.end();}
