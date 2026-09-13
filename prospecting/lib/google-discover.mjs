import {areas,categories} from './store.mjs';
import {isProfileUrl,publicUrl} from './network.mjs';
import {websiteContact} from './website-contact.mjs';

const queries={all:'firmy',beauty:'salony urody i fryzjerzy',health:'gabinety medyczne i fizjoterapia',food:'restauracje i kawiarnie',services:'usługi lokalne',shops:'sklepy'};
export async function googleDiscover(store,{area,category},progress=()=>{},readContact=websiteContact){
  if(!areas.includes(area)||!Object.hasOwn(categories,category))throw Error('Wybierz obszar i branżę.');
  const key=process.env.GOOGLE_PLACES_API_KEY;
  if(!key)throw Error('Brak klucza Google Places API.');
  progress({stage:'fetching',message:'Wyszukiwanie firm w Google Maps…'});
  const response=await fetch('https://places.googleapis.com/v1/places:searchText',{method:'POST',headers:{'Content-Type':'application/json','X-Goog-Api-Key':key,'X-Goog-FieldMask':'places.websiteUri,places.businessStatus'},body:JSON.stringify({textQuery:`${queries[category]} ${area==='Warszawa'?'Warszawa':area+' Warszawa'}`,pageSize:20,languageCode:'pl',regionCode:'PL'}),signal:AbortSignal.timeout(20000)});
  if(!response.ok)throw Error(`Google Places API: HTTP ${response.status}. Sprawdź aktywację API, rozliczenia i ograniczenia klucza.`);
  const data=await response.json();
  if(data.places!==undefined&&!Array.isArray(data.places))throw Error('Nieprawidłowa odpowiedź Google.');
  // Google data stays in memory. Only independently read website content is persisted.
  const candidates=[...new Set((data.places||[]).slice(0,20).flatMap(p=>{try{return p.websiteUri&&p.businessStatus!=='CLOSED_PERMANENTLY'&&!isProfileUrl(p.websiteUri)?[publicUrl(p.websiteUri).href]:[];}catch{return [];}}))];
  const known=new Set(store.db.prepare('SELECT dedupe FROM leads').all().map(x=>x.dedupe));
  let added=0,checked=0,withoutEmail=0,unavailable=0,duplicate=0,index=0;
  const update=()=>progress({stage:'checking',message:`Google Maps: sprawdzono ${checked}/${candidates.length} stron. Dodano ${added}; bez e-maila ${withoutEmail}; niedostępne ${unavailable}; już w bazie ${duplicate}.`,checked,total:candidates.length,added,withoutEmail,unavailable,duplicate});
  update();
  await Promise.all(Array.from({length:4},async()=>{
    while(index<candidates.length){
      const url=candidates[index++];
      try{
        const host=new URL(url).hostname.replace(/^www\./,'').replace(/\.$/,'');
        if(known.has(host)||store.isExcluded(url)){duplicate++;continue;}
        const contact=await readContact(url,AbortSignal.timeout(8000));
        if(!contact){withoutEmail++;continue;}
        const finalHost=new URL(contact.website).hostname.replace(/^www\./,'').replace(/\.$/,'');
        if(known.has(finalHost)||store.isExcluded(contact.website)){duplicate++;continue;}
        store.addLead({...contact,area,category});known.add(finalHost);added++;
      }catch{unavailable++;}
      finally{checked++;update();}
    }
  }));
  store.event(`Google Maps: ${data.places?.length||0} wyników, ${candidates.length} własnych stron, dodano ${added} firm z e-mailem. Sprawdzono pierwszą stronę wyników (maks. 20).`);
  return added;
}
