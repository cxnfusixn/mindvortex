import test from 'node:test';
import assert from 'node:assert/strict';
import {metricValue} from '../lib/metrics.mjs';
test('insights preserve true zero and distinguish unavailable values',()=>{
 assert.equal(metricValue({data:[{values:[{value:0}]}]}),0);
 assert.equal(metricValue({data:[{total_value:{value:12}}]}),12);
 for(const result of [{},{data:[]},{data:[{values:[{value:null}]}]},{data:[{values:[{value:'4'}]}]}])assert.equal(metricValue(result),null);
});
