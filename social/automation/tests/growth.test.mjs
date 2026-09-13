import test from 'node:test';
import assert from 'node:assert/strict';
import {experimentFor,growthSummary,perThousand} from '../lib/growth.mjs';
test('daily hook rotation also rotates across every-other-day Instagram slots',()=>{
  assert.equal(new Set(['2026-09-13','2026-09-15','2026-09-17'].map(d=>experimentFor(d).id)).size,3);
  assert.equal(experimentFor('2026-09-13').id,experimentFor('2026-09-13').id);
});
test('growth baseline isolates platforms, excludes future posts and preserves unknown metrics',()=>{
  const rows=[{day:'2026-09-10',platform:'instagram',metrics:{views:200,shares:0}},
    {day:'2026-09-11',platform:'instagram',metrics:{views:null,shares:2}},
    {day:'2026-09-10',platform:'tiktok',metrics:{views:900}},
    {day:'2026-09-20',platform:'instagram',metrics:{views:999}}];
  const s=growthSummary(rows,'instagram',new Date('2026-09-13T12:00:00Z'));
  assert.equal(s.count,2);assert.equal(s.measured,1);assert.equal(s.medianViews,200);
  assert.equal(s.ranked[0].sharesPer1000,0);assert.equal(s.ranked[1].sharesPer1000,null);
  assert.equal(perThousand(2,0),null);assert.equal(perThousand(null,200),null);
});
