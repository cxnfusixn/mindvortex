import fs from 'node:fs/promises';
const data=JSON.parse(await fs.readFile('qa/social-api.json','utf8'));process.chdir('social/automation');
const {buffer}=await import('./social/automation/lib/buffer.mjs'),{tiktokInput}=await import('./social/automation/lib/tiktok.mjs');
process.env.SOCIAL_PUBLIC_URL='https://mindvortex.pro/studio-social';process.env.BUFFER_TIKTOK_CHANNEL_ID='6aa44144cd8b9c702c4f2f4c';
const job=data.tiktokJobs.find(p=>p.kind==='carousel');if(!job)throw Error('No approved carousel');
const input={...tiktokInput(job),saveToDraft:true,mode:'addToQueue'};
const result=await buffer('mutation($input:CreatePostInput!){createPost(input:$input){... on PostActionSuccess{post{id status schedulingType assets{source}}} ... on MutationError{message}}}',{input});
const p=result.createPost?.post;if(!p)throw Error(JSON.stringify(result));console.log({id:p.id,status:p.status,schedulingType:p.schedulingType,images:p.assets.length});
console.log(await buffer('mutation($input:DeletePostInput!){deletePost(input:$input){__typename ... on MutationError{message}}}',{input:{id:p.id}}));
