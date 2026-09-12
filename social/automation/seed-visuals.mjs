import {pool} from './lib/db.mjs';
import {assets,recordVisual} from './lib/visuals.mjs';
import {maintainQueue} from './lib/generate.mjs';
try{
 const sources={'DdJHQyVkTlv':'kierunek-hero','DdJHalZEabu':'marcin-bak-hero','DdJHjPhkaVs':'flc-hero','DdJHLJrkYLT':'text-only','DdJHObfEYuH':'text-only','DdJHUYDETjN':'text-only','DdJHYMYkSYj':'text-only','DdJHer5EeYF':'text-only'};
 for(const [code,source]of Object.entries(sources))await pool.query('UPDATE social_history SET visual_source_key=$1 WHERE permalink LIKE $2',[source,'%/'+code+'/%']);
 for(const project of ['kierunek','marcin-bak','flc']){const a=assets.find(x=>x.project===project&&x.sourceKey===project+'-hero');await recordVisual({project,visualAssetKey:a.key},'imported-existing-post');}
 await maintainQueue();
 console.log((await pool.query("SELECT day::text,status,content->>'project' project,content->>'visualAssetKey' asset FROM social_posts ORDER BY day")).rows);
}finally{await pool.end();}
