import {request as http} from 'node:http';
import {request as https} from 'node:https';
import {publicUrl,publicAddress,isProfileUrl} from './network.mjs';
import {validEmail} from './store.mjs';

export async function websiteHtml(value,signal,redirects=0){
  signal.throwIfAborted();
  const url=publicUrl(value);
  if(isProfileUrl(url.href)||redirects>4)throw Error('Strona platformy lub zbyt wiele przekierowań.');
  let address,onAbort;
  try{address=await Promise.race([publicAddress(url.hostname),new Promise((resolve,reject)=>{onAbort=()=>reject(signal.reason);signal.addEventListener('abort',onAbort,{once:true});})]);}
  finally{if(onAbort)signal.removeEventListener('abort',onAbort);}
  signal.throwIfAborted();
  const result=await new Promise((resolve,reject)=>{
    const req=(url.protocol==='https:'?https:http)(url,{signal,headers:{'User-Agent':'MindVortexProspecting/1.0 (+https://mindvortex.pro)','Accept':'text/html'},lookup:(host,options,callback)=>callback(null,options.all?[address]:address.address,address.family)},res=>{
      if([301,302,303,307,308].includes(res.statusCode)&&res.headers.location){res.resume();resolve({redirect:new URL(res.headers.location,url).href});return;}
      if(res.statusCode!==200||!String(res.headers['content-type']).includes('text/html')){res.resume();reject(Error('Brak dostępnej strony HTML.'));return;}
      const chunks=[];let bytes=0;
      res.on('data',chunk=>{bytes+=chunk.length;if(bytes>1024*1024){req.destroy(Error('Strona przekracza limit odczytu.'));return;}chunks.push(chunk);});
      res.on('error',reject);res.on('end',()=>resolve({url:url.href,html:Buffer.concat(chunks).toString('utf8')}));
    });req.on('error',reject);req.end();
  });
  return result.redirect?websiteHtml(result.redirect,signal,redirects+1):result;
}
const decode=text=>text.replace(/&#(x[0-9a-f]+|\d+);/gi,(match,n)=>{const code=n[0].toLowerCase()==='x'?parseInt(n.slice(1),16):Number(n);return code<=0x10ffff?String.fromCodePoint(code):'';}).replace(/&amp;/gi,'&').replace(/&quot;/gi,'"').replace(/&nbsp;/gi,' ');
export function contactFromHtml(html,url){
  const clean=decode(html.replace(/<!--[^]*?-->|<script\b[^]*?<\/script\s*>|<style\b[^]*?<\/style\s*>/gi,''));
  const mails=[...clean.matchAll(/mailto:([^\s"'<>?]+)/gi)].map(x=>{try{return decodeURIComponent(x[1]);}catch{return '';}});
  mails.push(...(clean.replace(/<[^>]+>/g,' ').match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi)||[]));
  const email=mails.find(e=>validEmail(e)&&!/(?:example\.(?:com|org)|sentry\.io|wixpress\.com)$/i.test(e));
  const title=clean.match(/<title\b[^>]*>([^]*?)<\/title>/i)?.[1]?.replace(/<[^>]+>/g,'').replace(/\s+/g,' ').trim().slice(0,180);
  const links=[...clean.matchAll(/<a\b[^>]*href\s*=\s*["']([^"']+)["'][^>]*>([^]*?)<\/a>/gi)].filter(x=>/kontakt|contact/i.test(x[1]+' '+x[2])).flatMap(x=>{try{const u=new URL(x[1],url);return u.origin===new URL(url).origin&&u.href!==url?[u.href]:[];}catch{return [];}});
  return {email,name:title||new URL(url).hostname,links:[...new Set(links)].slice(0,2)};
}
export async function websiteContact(url,signal){
  const page=await websiteHtml(url,signal),info=contactFromHtml(page.html,page.url);
  if(info.email)return {name:info.name,email:info.email,website:page.url,source:page.url};
  for(const link of info.links){
    try{const contact=await websiteHtml(link,signal);if(new URL(contact.url).origin!==new URL(page.url).origin)continue;
      const found=contactFromHtml(contact.html,contact.url);
      if(found.email)return {name:info.name,email:found.email,website:page.url,source:contact.url};
    }catch{signal.throwIfAborted();}
  }
  return null;
}
