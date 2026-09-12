import test from 'node:test';
import assert from 'node:assert/strict';
import {reelSlots} from '../lib/reel-schedule.mjs';
import {validateReelScenes,reelTemplate} from '../lib/reel-template.mjs';
import {createAmbient} from '../lib/reel-audio.mjs';
test('every two days stays anchored and prepares eleven slots across DST',()=>{
 const cfg={interval_days:2,anchor_day:'2026-09-11',hour:18,horizon:11};
 const slots=reelSlots(cfg,new Date('2026-09-11T17:00:00Z'));
 assert.equal(slots.length,11);assert.equal(slots[0],'2026-09-13');assert.equal(slots.at(-1),'2026-10-03');
 for(let i=1;i<slots.length;i++)assert.equal(new Date(slots[i])-new Date(slots[i-1]),2*86400000);
 assert.equal(reelSlots(cfg,new Date('2026-10-25T16:30:00Z'))[0],'2026-10-25');
 assert.equal(reelSlots(cfg,new Date('2026-10-25T17:30:00Z'))[0],'2026-10-27');
});
test('three weekly slots respect Warsaw time including DST',()=>{
 const cfg={weekday:5,hour:18,horizon:3};
 assert.deepEqual(reelSlots(cfg,new Date('2026-09-11T17:00:00Z')),['2026-09-18','2026-09-25','2026-10-02']);
 assert.deepEqual(reelSlots(cfg,new Date('2026-09-11T15:00:00Z')),['2026-09-11','2026-09-18','2026-09-25']);
 assert.deepEqual(reelSlots(cfg,new Date('2026-10-30T16:30:00Z')),['2026-10-30','2026-11-06','2026-11-13']);
});
test('template duration and scene uniqueness',()=>{
 assert.ok(Math.abs(reelTemplate.intro.duration+reelTemplate.scenes.reduce((a,b)=>a+b,0)+reelTemplate.outroDuration-10)<1e-10);
 assert.throws(()=>validateReelScenes(['hero','HERO','logo']));
});
test('ambient is stereo ten seconds, fades and does not clip',()=>{
 const {pcm,rmsDb}=createAmbient();assert.equal(pcm.length,48000*10*4);assert.equal(pcm.readInt16LE(0),0);let peak=0;for(let i=0;i<pcm.length;i+=2)peak=Math.max(peak,Math.abs(pcm.readInt16LE(i)));assert.ok(peak<32767&&peak>10000);assert.ok(rmsDb<-10&&rmsDb>-25);
});
