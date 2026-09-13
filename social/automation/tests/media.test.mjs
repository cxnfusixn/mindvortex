import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {Readable} from 'node:stream';
import {GET, HEAD} from '../app/media/[file]/route.js';
test('media reads only requested ranges; HEAD and invalid ranges never read contents', async () => {
  const original = fs.open;
  let streams = [], closed = 0;
  fs.open = async () => ({stat:async()=>({size:8*1024*1024,isFile:()=>true}), close:async()=>{closed++;},
    createReadStream(options){streams.push(options);return Readable.from([Buffer.alloc(options.end-options.start+1)]);}});
  const ctx = {params:Promise.resolve({file:'11111111-1111-4111-8111-111111111111.mp4'})};
  const req = range => new Request('https://example.test', {headers:range ? {range} : {}});
  try {
    const head = await HEAD(req(),ctx); assert.equal(head.status,200); assert.equal(head.headers.get('content-length'),'8388608');
    for (const range of ['bytes=9-1','bytes=8388608-','bytes=-0','bytes=0-1,3-4','bytes=9007199254740993-'])
      assert.equal((await GET(req(range),ctx)).status,416);
    assert.equal(streams.length,0); assert.equal(closed,6);
    const one = await GET(req('bytes=0-0'),ctx); assert.equal(one.status,206); assert.equal((await one.arrayBuffer()).byteLength,1);
    const suffix = await GET(req('bytes=-2'),ctx); assert.equal((await suffix.arrayBuffer()).byteLength,2);
    assert.equal(streams[1].start,8388606);
  } finally { fs.open = original; }
});
test('cancelling media response destroys its file stream', async () => {
  const original = fs.open; let stream;
  fs.open = async()=>({stat:async()=>({size:10000000,isFile:()=>true}),close:async()=>{},createReadStream(){stream=new Readable({read(){this.push(Buffer.alloc(1024));}});return stream;}});
  try {
    const response = await GET(new Request('https://example.test'), {params:Promise.resolve({file:'11111111-1111-4111-8111-111111111111.mp4'})});
    await response.body.cancel(); assert.equal(stream.destroyed,true);
  } finally {fs.open=original;}
});
