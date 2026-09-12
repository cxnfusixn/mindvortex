import fs from 'node:fs/promises';import {buffer} from './social/automation/lib/buffer.mjs';import {tiktokInput} from './social/automation/lib/tiktok.mjs';
process.env.SOCIAL_PUBLIC_URL='https://mindvortex.pro/studio-social';process.env.BUFFER_TIKTOK_CHANNEL_ID='6aa44144cd8b9c702c4f2f4c';
const data=JSON.parse(await fs.readFile('qa/reels-api.json','utf8')),reel=data.reels.find(p=>p.status==='approved'&&p.kind==='education');if(!reel)throw Error('No approved asset');
const input={...tiktokInput({kind:'reel',content:reel.content,assets:[reel.video]}),saveToDraft:true,mode:'addToQueue'};
const r=await buffer('mutation($input:CreatePostInput!){createPost(input:$input){... on PostActionSuccess{post{id status schedulingType}} ... on MutationError{message}}}',{input});
const post=r.createPost?.post;if(!post)throw Error(JSON.stringify(r));await fs.writeFile('qa/buffer-draft-check.json',JSON.stringify(post));console.log(post);
const deleted=await buffer('mutation($input:DeletePostInput!){deletePost(input:$input){__typename ... on MutationError{message}}}',{input:{id:post.id}});console.log(deleted);
