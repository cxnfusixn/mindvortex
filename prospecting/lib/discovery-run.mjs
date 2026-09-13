import {areas,categories,openStore} from './store.mjs';
import {discover} from './discover.mjs';

export function latestDiscovery(store){
  const row=store.db.prepare("SELECT * FROM jobs WHERE kind='discover' ORDER BY created_at DESC,rowid DESC LIMIT 1").get();
  return row?{...row,payload:JSON.parse(row.payload)}:null;
}

export function startDiscovery(store,payload){
  if(!areas.includes(payload.area)||!Object.hasOwn(categories,payload.category))throw Error('Wybierz obszar i branżę.');
  return store.transaction(()=>{
    // Discovery has a 55-second network deadline; older running records are abandoned.
    store.db.prepare("UPDATE jobs SET status='failed',finished_at=?,error='Wyszukiwanie zostało przerwane. Możesz uruchomić je ponownie.' WHERE kind='discover' AND status='running' AND started_at<?").run(new Date().toISOString(),new Date(Date.now()-120000).toISOString());
    const running=store.db.prepare("SELECT * FROM jobs WHERE kind='discover' AND status='running'").get();
    if(running)return {started:false,job:{...running,payload:JSON.parse(running.payload)}};
    store.db.prepare("UPDATE jobs SET status='failed',finished_at=?,error='Zastąpiono ręcznym wyszukiwaniem uruchomionym natychmiast.' WHERE kind='discover' AND status='queued'").run(new Date().toISOString());
    const id=store.enqueue('discover',null,{...payload,manual:true,progress:{stage:'starting',message:'Łączenie ze źródłem firm…'}});
    store.db.prepare("UPDATE jobs SET status='running',started_at=? WHERE id=?").run(new Date().toISOString(),id);
    return {started:true,job:latestDiscovery(store)};
  });
}

export async function executeDiscovery(directory,job){
  const store=openStore(directory);
  try{
    const progress=value=>store.db.prepare("UPDATE jobs SET payload=json_set(payload,'$.progress',json(?)) WHERE id=? AND status='running'").run(JSON.stringify(value),job.id);
    const added=await discover(store,job.payload,progress);
    progress({stage:'done',message:`Zakończono wyszukiwanie. Dodano ${added} nowych firm.`,added});
    store.finish(job.id);
  }catch(error){store.finish(job.id,error.name==='TimeoutError' ? 'Źródło firm nie odpowiedziało w ciągu 55 sekund. Spróbuj ponownie później.' : String(error.message));}
  finally{store.close();}
}
