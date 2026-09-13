import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {openStore} from '../lib/store.mjs';
import {startDiscovery,executeDiscovery,latestDiscovery} from '../lib/discovery-run.mjs';

test('immediate discovery replaces stale queue, avoids duplicate execution and persists progress',async()=>{
 const s=openStore(mkdtempSync(join(tmpdir(),'mv-direct-discovery-'))),original=globalThis.fetch;
 try{
  const queued=s.enqueue('discover',null,{area:'Białołęka',category:'all'});
  const run=startDiscovery(s,{area:'Wola',category:'all'});
  assert.equal(run.started,true);assert.equal(run.job.status,'running');assert.equal(s.settings().paused,true);
  assert.equal(s.db.prepare('SELECT status FROM jobs WHERE id=?').get(queued).status,'failed');
  assert.equal(startDiscovery(s,{area:'Mokotów',category:'all'}).started,false);
  assert.equal(s.claim(['discover'],true),undefined,'Worker must not execute the HTTP-owned job');
  globalThis.fetch=async()=>{
    assert.equal(latestDiscovery(s).payload.progress.stage,'fetching');
    return {ok:true,json:async()=>({elements:[{type:'node',id:1,tags:{name:'Own website',website:'https://example.com',email:'office@example.com'}}]})};
  };
  await executeDiscovery(s.directory,run.job);
  assert.equal(latestDiscovery(s).status,'done');assert.equal(latestDiscovery(s).payload.progress.added,1);
  const next=startDiscovery(s,{area:'Mokotów',category:'all'});
  globalThis.fetch=async()=>({ok:false,status:504});await executeDiscovery(s.directory,next.job);
  assert.equal(latestDiscovery(s).status,'failed');assert.match(latestDiscovery(s).error,/504/);
  const stale=startDiscovery(s,{area:'Mokotów',category:'all'});
  s.db.prepare('UPDATE jobs SET started_at=? WHERE id=?').run(new Date(Date.now()-180000).toISOString(),stale.job.id);
  assert.equal(startDiscovery(s,{area:'Wola',category:'all'}).started,true);
 }finally{globalThis.fetch=original;s.close();}
});
