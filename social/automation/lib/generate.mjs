import {availableAsset,requireFreshVisual} from './visuals.mjs';
import {syncHistory,contentHistory} from './history.mjs';
import {requireDistinct,checkDuplicates} from './duplicates.mjs';
import {randomUUID} from 'node:crypto';
import {pool,settings,locked,event} from './db.mjs';
import {brand,writingRules,validate,dayKey,addDays,kindFor} from './brand.mjs';
import {render} from './render.mjs';
const str={type:'string'};
const schema={type:'object',additionalProperties:false,properties:{topic:str,headline:str,points:{type:'array',items:str,minItems:2,maxItems:3},caption:str,hashtags:{type:'array',items:str,minItems:5,maxItems:5},alt:str,project:{type:'string',enum:['none','kierunek','marcin-bak','flc']}},required:['topic','headline','points','caption','hashtags','alt','project']};
export async function generateOne(day,kind,history,feedback=''){
 const response=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{Authorization:'Bearer '+process.env.SOCIAL_OPENAI_API_KEY,'Content-Type':'application/json'},body:JSON.stringify({model:process.env.SOCIAL_OPENAI_MODEL||'gpt-4.1-mini',store:false,max_output_tokens:1800,instructions:brand+writingRules,input:`Create a ${kind} post for ${day}. Previous rejected attempt feedback: ${feedback}. Avoid repeating topics in this history: ${JSON.stringify(history.slice(0,90))}. Headline 3-6 short words, max 34 chars, fitting two lines of at most 21 chars each; 2-3 useful graphic points max 32 chars each; caption max 1800 chars, no hashtags inside caption. Exactly 5 relevant hashtags including #MindVortex. Write descriptive alt text. For portfolio posts choose one verified project and use only the facts provided. For ALL other kinds project MUST be none and the caption MUST NOT mention Kierunek, Marcin Bak, FLC or any other project or client. Match the requested kind: offer invites a project enquiry; process explains our workflow; checklist gives a practical check; detail focuses on one small design decision. For portfolio rotate projects from history. Return JSON.`,text:{format:{type:'json_schema',name:'studio_post',strict:true,schema}}}),signal:AbortSignal.timeout(90000)});
 const body=await response.json();if(!response.ok)throw Error('AI request failed: HTTP '+response.status+' '+(body.error?.code||''));
 if(body.status!=='completed')throw Error('AI response incomplete');
 const raw=body.output?.flatMap(x=>x.content||[]).filter(x=>x.type==='output_text').map(x=>x.text).join('');
 const content=JSON.parse(raw);
 content.hashtags=[...new Set((content.hashtags||[]).filter(x=>typeof x==='string'&&/^#[A-Za-z][A-Za-z0-9]{1,35}$/.test(x)&&x.toLowerCase()!=='#mindvortex'))].slice(0,4);
 for(const tag of ['#WebDesign','#UserExperience','#DigitalStudio','#WebDevelopment'])if(content.hashtags.length<4&&!content.hashtags.includes(tag))content.hashtags.push(tag);
 content.hashtags.push('#MindVortex');
 if(kind!=='portfolio')content.project='none';
 if(kind==='portfolio'&&content.project==='none')throw Error('Portfolio day requires a known project');
 if(kind==='portfolio'&&!/demo|demonstration/i.test(content.caption))content.caption+='\n\nPortfolio demo.';
 validate(content);
 if(kind!=='portfolio'&&/Kierunek|Marcin|\bFLC\b/i.test(content.caption))throw Error('Non-portfolio post contains project claims; editorial review required');
 content.alt=`Mind Vortex studio note in white and green on black. ${content.headline}. ${content.project==='none'?content.points.join('. '):'Screenshot of the '+content.project+' website portfolio demo.'}`;
 if(history.some(x=>x.topic?.toLowerCase()===content.topic.toLowerCase()))throw Error('Duplicate topic');
 return content;
}
export async function fillQueue(){return locked('social-generation',async()=>{
 await syncHistory();
 const config=await settings();const existing=(await pool.query('SELECT day::text,content FROM social_posts ORDER BY day DESC LIMIT 90')).rows;
 const history=await contentHistory();let count=0;
 // Always prepare tomorrow onward. Missed dates are never backfilled publicly.
 for(let i=1;i<=7;i++){const day=addDays(dayKey(),i);if(existing.some(x=>x.day===day))continue;
  const kind=kindFor(day),id=randomUUID();
  const {content,image}=await freshCandidate(day,kind,history);
  await pool.query('INSERT INTO social_posts(id,day,kind,content,image,status) VALUES($1,$2,$3,$4,$5,$6)',[id,day,kind,content,image,config.autopilot?'approved':'draft']);history.unshift(content);count++;
 }
 await event(`Prepared ${count} posts`);return count;
});}



export async function freshCandidate(day,kind,history,excludeId){
 let feedback='',chosen;
 if(kind==='portfolio'){for(const project of ['kierunek','marcin-bak','flc']){chosen=await availableAsset(project,excludeId);if(chosen)break;}if(!chosen){kind='education';feedback='No unused portfolio sections remain. Create a useful text-only educational post.';}else feedback='Use ONLY project '+chosen.project+'. Focus on this unused website section: '+chosen.section;}
 for(let attempt=0;attempt<4;attempt++){
  try{const content=await generateOne(day,kind,history,feedback);if(chosen&&content.project!==chosen.project)throw Error('Use only project '+chosen.project);if(chosen)content.visualAssetKey=chosen.key;await requireFreshVisual(content,excludeId);await requireDistinct(content,excludeId);const image=await render(content,randomUUID());return {content,image};}
  catch(e){feedback=e.message;await event('Candidate rejected: '+day+' / '+feedback);}
 }
 throw Error('No valid distinct candidate after four attempts: '+day);
}
// Caller owns social-publish lock. Keep the slot and audit the previous version.
export async function ensureFreshPost(post){
 if(!['draft','approved'].includes(post.status))throw Error('Only waiting posts may be replaced');
 const result=await checkDuplicates(post.content,post.id);
 if(!result.duplicate){try{const previous=post.content.visualAssetKey;await requireFreshVisual(post.content,post.id);if(previous!==post.content.visualAssetKey){const image=await render(post.content,randomUUID());await pool.query('UPDATE social_posts SET content=$2,image=$3 WHERE id=$1',[post.id,post.content,image]);post.image=image;}}catch(e){result.duplicate=true;result.reason=e.message;}}
 if(!result.duplicate){if(post.status==='draft')await pool.query("UPDATE social_posts SET status='approved',error=NULL WHERE id=$1",[post.id]);return {...post,status:'approved'};}
 await event('Replacing duplicate in slot '+post.day+': '+result.reason);
 await pool.query("UPDATE social_posts SET status='draft',error=$2 WHERE id=$1",[post.id,result.reason]);
 const history=await contentHistory(post.id),{content,image}=await freshCandidate(post.day,post.kind,history,post.id);
 await pool.query('INSERT INTO social_revisions(post_id,content,image,reason) VALUES($1,$2,$3,$4)',[post.id,post.content,post.image,result.reason]);
 await pool.query("UPDATE social_posts SET content=$2,image=$3,status='approved',error=NULL,updated_at=now() WHERE id=$1 AND status IN ('draft','approved')",[post.id,content,image]);
 await event('Automatic replacement ready: '+post.day);return {...post,content,image,status:'approved'};
}
export async function maintainQueue(){return locked('social-publish',async()=>{
 await syncHistory();
 const posts=(await pool.query("SELECT *,day::text FROM social_posts WHERE day >= $1 AND status IN ('draft','approved') ORDER BY social_posts.day",[dayKey()])).rows;
 for(const post of posts)await ensureFreshPost(post);
});}
