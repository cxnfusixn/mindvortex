import test from 'node:test';import assert from 'node:assert/strict';
import {socialSource,citedSocialSources} from '../lib/engagement-source.mjs';
test('source links reject non-public targets and canonicalize tracking parameters',()=>{
  assert.equal(socialSource('https://instagram.com/p/ABC/?utm_source=test').url,'https://www.instagram.com/p/ABC/');
  for(const s of ['http://instagram.com/p/ABC','https://instagram.com.evil.test/p/ABC','https://user@instagram.com/p/ABC','https://127.0.0.1/p/ABC','https://instagram.com/mindvortex.pro','https://www.tiktok.com/@studio'])assert.throws(()=>socialSource(s));
});
test('discovery accepts only actual citation annotations, never model-invented links',()=>{
  const r={output:[{content:[{type:'output_text',text:'https://instagram.com/p/INVENTED/',annotations:[{type:'url_citation',url:'https://www.instagram.com/p/REAL/'},{type:'url_citation',url:'https://evil.test/p/x'}]}]}]};
  assert.deepEqual(citedSocialSources(r).map(x=>x.url),['https://www.instagram.com/p/REAL/']);
});
