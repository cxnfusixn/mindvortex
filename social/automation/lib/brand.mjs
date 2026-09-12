export const brand = `Mind Vortex is an independent digital studio in Poland working worldwide. Communicate in English as a studio: we, our, us. We design and develop custom websites, visual identities and web applications. Audience: owners of service businesses seeking a clear professional website. Goal: qualified project enquiries. Tone: clear, helpful, specific, calm. Never introduce Patryk, invent team size, client quotes, awards, traffic, conversion rates or performance results. No fear-based sales or 'why should I trust you'. Educational posts should be accessible curiosities about UX, AI, frontend, backend and digital technology, with an everyday example and a human or business implication. Avoid API names, code tutorials and dry technical definitions. Never invent a news event. Mention mindvortex.pro/en for portfolio or contact. No current news or external statistics without supplied sources.
Verified portfolio DEMOS: Kierunek is a psychology centre website with calm visual direction, services, pricing, articles and contact, plus Sanity content management. Marcin Bak is a boxing and MMA coach website with cinematic training imagery, strong typography and scroll-led presentation of philosophy, disciplines and services. FLC is a luxury automotive demonstration website with cinematic imagery, interactive inventory and a scroll-led vehicle presentation. None is evidence of client outcomes. Label portfolio posts as demos. Alternate portfolio and non-portfolio posts. Fonts: JetBrains Mono headings and Geist body. Black, white, green.`;
export const writingRules='Typography and colors describe OUR graphic templates, not advice for every client website. Do not present our portfolio as audited, certified or accessible unless explicitly verified. Use natural short sentences, 70-120 words, and one concrete practical takeaway. Avoid generic adjectives like crucial, seamless, stunning, elevate. Do not claim decorative images need alt text. Alt must describe the actual text card or portfolio screenshot, never invented icons or interfaces.';
export const kinds=['education','portfolio','process','checklist','portfolio','detail','offer'];
export function dayKey(date=new Date()){return new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Warsaw',year:'numeric',month:'2-digit',day:'2-digit'}).format(date);}
export function addDays(day,n){const d=new Date(day+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10);}
export function kindFor(day){return kinds[(new Date(day+'T12:00:00Z').getUTCDay()+6)%7];}
export function validate(p){
 if(!p||typeof p!=='object')throw Error('Invalid content');
 for(const [key,max] of [['topic',120],['headline',55],['caption',1800],['alt',700]])if(typeof p[key]!=='string'||!p[key].trim()||p[key].length>max)throw Error('Invalid '+key);
 if(!Array.isArray(p.points)||p.points.length<2||p.points.length>3||p.points.some(x=>typeof x!=='string'||x.length>65||!x.trim()))throw Error('Invalid graphic points');
 if(!Array.isArray(p.hashtags)||p.hashtags.length!==5||p.hashtags.some(x=>typeof x!=='string'||!/^#[A-Za-z][A-Za-z0-9]{1,35}$/.test(x))||new Set(p.hashtags.map(x=>x.toLowerCase())).size!==5||!p.hashtags.includes('#MindVortex'))throw Error('Invalid hashtags');
 if(/\b(I am|I'm|I’m|my work|tell me|send me|why should i trust you)\b/i.test(p.caption+' '+p.headline))throw Error('Studio voice required');
 if(!['none','kierunek','marcin-bak','flc'].includes(p.project))throw Error('Unknown portfolio project');
 if(p.project!=='none'&&!/demo|demonstration/i.test(p.caption))throw Error('Portfolio demo disclosure required');
 if(p.caption.includes('#'))throw Error('Hashtags belong in separate field');
 return p;
}
export function caption(p){return p.caption.trim()+'\n\n'+p.hashtags.join(' ');}
