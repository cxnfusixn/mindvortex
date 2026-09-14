import fs from 'node:fs/promises';

export function redact(text, env = process.env) {
 let value=String(text);
 for(const [key,secret] of Object.entries(env)) if(/PASSWORD|TOKEN|SECRET|KEY|DATABASE_URL/i.test(key)&&secret?.length>=6)value=value.split(secret).join('[ukryto]');
 return value.replace(/Bearer\s+\S+/gi,'Bearer [ukryto]').replace(/(https?:\/\/)[^\s/@]+:[^\s/@]+@/g,'$1[ukryto]@').slice(0,6000);
}
export async function diagnose({query, fetchPage=fetch, statfs=fs.statfs, now=Date.now(), url=process.env.SOCIAL_PUBLIC_URL}) {
 const checks=[];
 async function check(component, action){try{const result=await action();checks.push({component,...result});}catch(e){checks.push({component,ok:false,detail:redact(e.message)});}}
 await check('Panel Social Studio',async()=>{const r=await fetchPage(url+'/login',{signal:AbortSignal.timeout(10000)});return {ok:r.ok,detail:`HTTP ${r.status} · ${url}/login`};});
 await check('Baza danych PostgreSQL',async()=>{await query('SELECT 1');return {ok:true,detail:'Połączenie i zapytanie działają.'};});
 if(checks.at(-1).ok)await check('Worker publikacji',async()=>{const row=(await query("SELECT checked_at FROM social_health WHERE name='worker'")).rows[0];const age=row?Math.max(0,Math.floor((now-new Date(row.checked_at).getTime())/60000)):null;return {ok:age!==null&&age<10,detail:age===null?'Brak zapisanego heartbeat.':`Ostatni heartbeat: ${row.checked_at.toISOString?.()||row.checked_at} (${age} min temu; próg 10 min).`};});
 else checks.push({component:'Worker publikacji',ok:null,detail:'Nie można sprawdzić heartbeat z powodu niedostępności bazy.'});
 await check('Dysk serwera',async()=>{const s=await statfs('/var/lib/mindvortex-social');const fraction=s.bavail/s.blocks;return {ok:fraction>=0.1,detail:`Wolne ${(s.bavail*s.bsize/1024**3).toFixed(2)} GB (${(fraction*100).toFixed(1)}%; próg 10%).`};});
 let logs=[];if(checks.some(c=>c.ok===false)&&checks.find(c=>c.component==='Baza danych PostgreSQL').ok){try{logs=(await query("SELECT created_at,message FROM social_events WHERE created_at>now()-interval '30 minutes' ORDER BY id DESC LIMIT 8")).rows.map(r=>`${r.created_at.toISOString?.()||r.created_at} · ${redact(r.message)}`);}catch(e){logs=[`Odczyt logów nie powiódł się: ${redact(e.message)}`];}}
 return {at:new Date(now).toISOString(),checks,logs};
}
export function alertMessage(report){
 const failed=report.checks.filter(c=>c.ok===false),names=failed.map(c=>c.component);
 const analysis=[];
 if(names.includes('Dysk serwera'))analysis.push('Potwierdzony niski zapas miejsca. Może powodować błędy zapisu w bazie, generowania plików i publikacji; sam alert nie potwierdza wystąpienia tych skutków. Sprawdź rozmiar archiwów i starych wydań.');
 if(names.includes('Baza danych PostgreSQL'))analysis.push('Baza nie odpowiada. Stan workera pozostaje nieznany, ponieważ heartbeat jest odczytywany z tej samej bazy.');
 if(names.includes('Worker publikacji'))analysis.push('Worker nie aktualizuje heartbeat. Sprawdź usługę mindvortex-social-worker i jej logi; możliwe zatrzymanie lub zablokowane zadanie.');
 if(names.includes('Panel Social Studio'))analysis.push('Adres panelu nie odpowiada prawidłowo. Sprawdź mindvortex-social, reverse proxy i DNS.');
 return {subject:`Mind Vortex: awaria — ${names.join(', ')}`,text:redact(`Czas kontroli: ${report.at}\n\n${report.checks.map(c=>`${c.ok===null?'NIEZNANY':c.ok?'OK':'BŁĄD'} — ${c.component}: ${c.detail}`).join('\n')}\n\nAnaliza:\n${analysis.join('\n')}\n\nOstatnie zdarzenia aplikacji (kontekst, nie dowód przyczyny):\n${report.logs.join('\n')||'Brak dostępnych zdarzeń z ostatnich 30 minut.'}\n\nLogi usług: journalctl -u mindvortex-social -u mindvortex-social-worker --since "30 minutes ago"`)};
}
