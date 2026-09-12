import {init,pool} from './lib/db.mjs';
import {fillReelQueue} from './lib/reel-generation.mjs';
await init();try{console.log({prepared:await fillReelQueue()});console.log((await pool.query('SELECT day::text,status,content->>\'topic\' AS topic,video FROM social_reels ORDER BY day')).rows);}finally{await pool.end();}
