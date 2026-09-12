import assert from 'node:assert/strict';
import {init,pool,locked} from '../lib/db.mjs';
await init();
let entered=false;
await locked('social-test-lock',async()=>{await locked('social-test-lock',async()=>{entered=true;});});
assert.equal(entered,false,'Concurrent worker must not enter the same publication lock');
const c=await pool.connect();
try{await c.query('BEGIN');const id=crypto.randomUUID();await c.query("INSERT INTO social_posts(id,day,kind,content,image) VALUES($1,'2099-01-01','test','{}','test.jpg')",[id]);await assert.rejects(()=>c.query("INSERT INTO social_posts(id,day,kind,content,image) VALUES($1,'2099-01-01','test','{}','test.jpg')",[crypto.randomUUID()]),e=>e.code==='23505');}finally{await c.query('ROLLBACK');c.release();await pool.end();}
console.log('Database integration: concurrent lock and unique daily slot verified.');
