import editorialSources from './editorial-sources.json' with {type:'json'};
export {editorialSources};
import {createHash} from 'node:crypto';
export const sources=[
 {category:'AI',url:'https://developers.google.com/machine-learning/crash-course/llm/transformers?hl=en'},
 {category:'WEB',url:'https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API'},
 {category:'WEB',url:'https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API'},
 {category:'WEB',url:'https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Containment/Container_queries'},
 {category:'TECH',url:'https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers'},
 {category:'WEB',url:'https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API'},
 {category:'AI',url:'https://developers.google.com/machine-learning/crash-course/embeddings?hl=en'},
 {category:'TECH',url:'https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API'},
 {category:'WEB',url:'https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver'},
 {category:'WEB',url:'https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API'},
 {category:'TECH',url:'https://developer.mozilla.org/en-US/docs/Web/API/AbortController'},
 {category:'TECH',url:'https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API'},
 {category:'WEB',url:'https://developer.mozilla.org/en-US/docs/Web/API/History_API'},
 {category:'TECH',url:'https://developer.mozilla.org/en-US/docs/Web/API/Performance_API'},
 {category:'TECH',url:'https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API'},
 {category:'WEB',url:'https://developer.mozilla.org/en-US/docs/Web/API/HTMLDialogElement'},
 {category:'WEB',url:'https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/picture'},
 {category:'WEB',url:'https://developer.mozilla.org/en-US/docs/Web/API/URL'},
 {category:'WEB',url:'https://developer.mozilla.org/en-US/docs/Web/API/Clipboard_API'},
 {category:'TECH',url:'https://developer.mozilla.org/en-US/docs/Web/API/Streams_API'},
 {category:'WEB',url:'https://developer.mozilla.org/en-US/docs/Web/API/Web_Share_API'},
 {category:'TECH',url:'https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API'},
 {category:'WEB',url:'https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API'},
 {category:'TECH',url:'https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API'},

 {category:'TECH',url:'https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events'},
 {category:'WEB',url:'https://developer.mozilla.org/en-US/docs/Web/API/Fullscreen_API'},
 {category:'TECH',url:'https://developer.mozilla.org/en-US/docs/Web/API/Broadcast_Channel_API'},
];
export async function readSource(url){
 if(![...sources,...editorialSources].some(s=>s.url===url))throw Error('Unregistered editorial source');
 const r=await fetch(url,{redirect:'error',signal:AbortSignal.timeout(25000)});if(!r.ok)throw Error('Editorial source unavailable: '+r.status);
 const html=await r.text();if(html.length>3000000)throw Error('Source too large');
 const main=html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1]||html;
 const text=main.replace(/<(script|style|nav)\b[^>]*>[\s\S]*?<\/\1>/gi,' ').replace(/<[^>]+>/g,' ').replace(/&[^;]+;/g,' ').replace(/\s+/g,' ').slice(0,24000);
 if(text.length<500)throw Error('Insufficient source text');
 return {url,text,checkedAt:new Date().toISOString(),hash:createHash('sha256').update(text).digest('hex')};
}
