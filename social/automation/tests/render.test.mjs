import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import {render,TEMPLATE_VERSION} from '../lib/render.mjs';
test('fixed square template rejects overflow instead of shrinking typography',async()=>{
 const previous=process.env.SOCIAL_MEDIA_DIR,dir=await fs.mkdtemp(path.join(os.tmpdir(),'mv-template-'));
 process.env.SOCIAL_MEDIA_DIR=dir;
 try{
 const p={headline:'START WITH THE RIGHT QUESTIONS',points:['Who is the website for?','What should it help them do?','What needs to change?'],project:'none'};
 const name=await render(p,'test');const meta=await sharp(path.join(dir,name)).metadata();
 assert.equal(meta.width,1080);assert.equal(meta.height,1080);assert.equal(p.templateVersion,TEMPLATE_VERSION);
 await assert.rejects(render({...p,headline:'X'.repeat(60)},'overflow'),/shorten/);
 await assert.rejects(render({...p,points:['A very long graphic point '.repeat(8)]},'overflow'),/shorten/);
 }finally{if(previous===undefined)delete process.env.SOCIAL_MEDIA_DIR;else process.env.SOCIAL_MEDIA_DIR=previous;await fs.rm(dir,{recursive:true,force:true});}
});
