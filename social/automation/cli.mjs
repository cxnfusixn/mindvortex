import {syncHistory} from './lib/history.mjs';
import {init,pool,settings} from './lib/db.mjs';
import {fillQueue} from './lib/generate.mjs';
import {publishDue,graph} from './lib/instagram.mjs';
await init();
try{
 const command=process.argv[2];
 if(command==='sync')console.log({synced:await syncHistory()});
 else if(command==='generate')console.log({generated:await fillQueue()});
 else if(command==='status')console.log({settings:await settings(),posts:(await pool.query('SELECT day::text,status,error FROM social_posts ORDER BY day')).rows});
 else if(command==='publish')await publishDue();
 else if(command==='check')console.log(await graph('me',{fields:'user_id,username'}));
 else throw Error('Unknown command');
}finally{await pool.end();}
