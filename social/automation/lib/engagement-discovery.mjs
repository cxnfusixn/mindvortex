import {pool,locked} from './db.mjs';
import {dayKey} from './brand.mjs';
import {discoverEngagement,prepareEngagement} from './engagement.mjs';

export async function discoveryAction(body){
  if(body.action==='engagement-settings'){
    if(typeof body.enabled!=='boolean')throw Error('Nieprawidłowe ustawienie wyszukiwania.');
    await pool.query('UPDATE social_discovery SET enabled=$1 WHERE id=1',[body.enabled]);
  }else{
    await pool.query("UPDATE social_discovery SET requested=true,status='queued',error='' WHERE id=1 AND status NOT IN ('queued','running')");
  }
}

export async function runDiscovery(){return locked('growth-discovery-cycle',async()=>{
  const cfg=(await pool.query('SELECT * FROM social_discovery WHERE id=1')).rows[0];
  const today=dayKey();
  if(!cfg.requested&&!(cfg.enabled&&cfg.last_day!==today)&&cfg.status!=='running')return;
  await pool.query("UPDATE social_discovery SET requested=false,status='running',started_at=now(),error='',last_day=$1 WHERE id=1",[today]);
  try{
    const result=await discoverEngagement();
    await prepareEngagement();
    await pool.query("UPDATE social_discovery SET status='done',finished_at=now(),result=$1 WHERE id=1",[result||'Wyszukiwanie zakończone.']);
  }catch(error){
    await pool.query("UPDATE social_discovery SET status='failed',finished_at=now(),error=$1 WHERE id=1",[String(error.message).slice(0,1000)]);
  }
});}
