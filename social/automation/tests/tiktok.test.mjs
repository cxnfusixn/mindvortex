import test from 'node:test';import assert from 'node:assert/strict';import {tiktokInput} from '../lib/tiktok.mjs';import {normalizeBufferMetrics} from '../lib/buffer.mjs';
test('TikTok uses automatic publishing, ordered photos and validates duplicates',()=>{
 process.env.SOCIAL_PUBLIC_URL='https://mindvortex.pro/studio-social';process.env.BUFFER_TIKTOK_CHANNEL_ID='test-channel';
 const job={kind:'carousel',content:{topic:'Website checklist',caption:'Three useful website checks.',hashtags:['#WebDesign','#WebDevelopment','#UXDesign','#CreativeStudio','#MindVortex']},assets:['11111111-1111-1111-1111-111111111111.jpg','22222222-2222-2222-2222-222222222222.jpg','33333333-3333-3333-3333-333333333333.jpg']};
 const input=tiktokInput(job);assert.equal(input.schedulingType,'automatic');assert.equal(input.mode,'shareNow');assert.equal(input.assets[1].image.url,process.env.SOCIAL_PUBLIC_URL+'/media/'+job.assets[1]);
 assert.throws(()=>tiktokInput({...job,assets:[job.assets[0],job.assets[0],job.assets[2]]}));
 assert.throws(()=>tiktokInput({...job,assets:['../../secret.jpg',...job.assets.slice(1)]}));
});
test('Buffer metrics distinguish absent values and genuine zero',()=>{
 const m=normalizeBufferMetrics({metrics:[{type:'views',value:23},{type:'reactions',value:0}],metricsUpdatedAt:'2026-09-11T17:58:30Z'});assert.equal(m.views,23);assert.equal(m.likes,0);assert.equal(m.comments,null);assert.equal(m.collectedAt,'2026-09-11T17:58:30Z');
});
