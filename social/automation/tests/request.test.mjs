import test from 'node:test';
import assert from 'node:assert/strict';
import {readJson} from '../lib/request.mjs';
test('chunked JSON is stopped at the byte limit and the stream is cancelled', async () => {
  let cancelled = false, reads = 0;
  const body = new ReadableStream({pull(c){reads++; c.enqueue(Buffer.alloc(1024, 32));},cancel(){cancelled=true;}});
  const req = new Request('https://example.test', {method:'POST',body,duplex:'half',headers:{'content-type':'application/json'}});
  await assert.rejects(readJson(req, 2048), e => e.status === 413);
  assert.equal(cancelled,true); assert.ok(reads <= 4);
});
test('JSON objects work, malformed and non-object payloads fail', async () => {
  const request = body => new Request('https://example.test', {method:'POST',body,headers:{'content-type':'application/json'}});
  assert.deepEqual(await readJson(request('{"action":"login"}')), {action:'login'});
  for (const body of ['null','[]','{']) await assert.rejects(readJson(request(body)), e=>e.status===400);
});
