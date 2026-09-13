import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync} from 'node:fs';import {join} from 'node:path';import {tmpdir} from 'node:os';
import {openStore} from '../lib/store.mjs';
import {googleDiscover} from '../lib/google-discover.mjs';
import {contactFromHtml,websiteHtml} from '../lib/website-contact.mjs';

test('contact extraction ignores scripts and follows only same-origin contact links',async()=>{
 const parsed=contactFromHtml('<title>Firma &amp; Studio</title><script>fake@example.org</script><a href="mailto:biuro%40firma.pl">Mail</a><a href="/kontakt">Kontakt</a><a href="https://evil.example/contact">Contact</a>','https://firma.pl/');
 assert.equal(parsed.email,'biuro@firma.pl');assert.equal(parsed.name,'Firma & Studio');assert.deepEqual(parsed.links,['https://firma.pl/kontakt']);
 assert.equal(contactFromHtml('<style>a@firma.pl</style> Brak kontaktu','https://firma.pl').email,undefined);
 for(const url of ['http://127.0.0.1','http://169.254.169.254','https://booksy.com/pl/test','https://maps.app.goo.gl/test'])await assert.rejects(()=>websiteHtml(url,AbortSignal.timeout(1000)));
});
test('Google candidates need independently verified website contact; no Google listing data is stored',async()=>{
 const s=openStore(mkdtempSync(join(tmpdir(),'mv-google-'))),fetchOriginal=globalThis.fetch,key=process.env.GOOGLE_PLACES_API_KEY;
 process.env.GOOGLE_PLACES_API_KEY='test-key';
 try{
  let request,checks=0,progress;
  globalThis.fetch=async(url,options)=>{request=JSON.parse(options.body);return {ok:true,json:async()=>({places:[
   {websiteUri:'https://booksy.com/pl/abc'}, {businessStatus:'CLOSED_PERMANENTLY',websiteUri:'https://closed.example.com'}, {},
   {websiteUri:'https://own.example.com',displayName:{text:'Google name must not persist'},formattedAddress:'Google address'},
   {websiteUri:'https://noemail.example.com'}, {websiteUri:'https://broken.example.com'},
  ]})};};
  const contact=async url=>{checks++;if(url.includes('noemail'))return null;if(url.includes('broken'))throw Error('Unavailable');return {name:'Name from website',website:url,email:'office@own.example.com',source:url+'contact'};};
  assert.equal(await googleDiscover(s,{area:'Białołęka',category:'all'},x=>progress=x,contact),1);
  assert.equal(checks,3);assert.match(request.textQuery,/firmy Białołęka Warszawa/);assert.equal(request.pageSize,20);
  assert.equal(s.leads()[0].name,'Name from website');assert.equal(s.leads()[0].address,'');assert.equal(progress.withoutEmail,1);assert.equal(progress.unavailable,1);
  assert.equal(await googleDiscover(s,{area:'Białołęka',category:'all'},()=>{},contact),0);
  globalThis.fetch=async()=>({ok:false,status:403});await assert.rejects(()=>googleDiscover(s,{area:'Białołęka',category:'all'}),/HTTP 403/);
 }finally{globalThis.fetch=fetchOriginal;if(key===undefined)delete process.env.GOOGLE_PLACES_API_KEY;else process.env.GOOGLE_PLACES_API_KEY=key;s.close();}
});
