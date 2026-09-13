import test from 'node:test';
import assert from 'node:assert/strict';
import {pool} from '../lib/db.mjs';
import {runDiscovery,discoveryAction} from '../lib/engagement-discovery.mjs';
import {dayKey} from '../lib/brand.mjs';

test('discovery runs on manual requests while disabled, resumes interruption and records failures',async()=>{
  const original={query:pool.query,connect:pool.connect,fetch:globalThis.fetch};
  let state={enabled:false,requested:false,status:'idle',last_day:null},calls=0;
  pool.connect=async()=>({query:async()=>({rows:[{ok:true}]}),release(){}});
  pool.query=async(sql,args=[])=>{
    if(sql.startsWith('SELECT * FROM social_discovery'))return {rows:[{...state}]};
    if(sql.includes('SET enabled=')){state.enabled=args[0];return {};}
    if(sql.includes('SET requested=true')){if(!['queued','running'].includes(state.status))Object.assign(state,{requested:true,status:'queued'});return {};}
    if(sql.includes("status='running',started_at")){Object.assign(state,{requested:false,status:'running',last_day:args[0]});return {};}
    if(sql.includes("status='done',finished_at")){Object.assign(state,{status:'done',result:args[0]});return {};}
    if(sql.includes("status='failed',finished_at")){Object.assign(state,{status:'failed',error:args[0]});return {};}
    if(sql.includes('count(*)'))return {rows:[{count:sql.includes('prepared_at')?5:0}]};
    if(sql.startsWith('SELECT source_url'))return {rows:[]};
    if(sql.startsWith('INSERT INTO social_events'))return {};
    throw Error('Unexpected SQL: '+sql);
  };
  globalThis.fetch=async()=>{calls++;return {ok:true,json:async()=>({status:'completed',output:[]})};};
  try{
    await runDiscovery();assert.equal(calls,0);
    await discoveryAction({action:'engagement-discover'});await discoveryAction({action:'engagement-discover'});
    await runDiscovery();assert.equal(calls,1);assert.equal(state.status,'done');assert.match(state.result,/Nie znaleziono/);
    await discoveryAction({action:'engagement-settings',enabled:true});await runDiscovery();assert.equal(calls,1,'No repeat on same day');
    state.last_day='2000-01-01';await runDiscovery();assert.equal(calls,2);assert.equal(state.last_day,dayKey());
    state.status='running';await runDiscovery();assert.equal(calls,3,'Interrupted job can resume under advisory lock');
    globalThis.fetch=async()=>{throw Error('Provider unavailable');};
    await discoveryAction({action:'engagement-discover'});await runDiscovery();assert.equal(state.status,'failed');assert.equal(state.error,'Provider unavailable');
    await assert.rejects(()=>discoveryAction({action:'engagement-settings',enabled:'yes'}));
  }finally{pool.query=original.query;pool.connect=original.connect;globalThis.fetch=original.fetch;}
});
