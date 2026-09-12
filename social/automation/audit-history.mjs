import {pool} from './lib/db.mjs';
import {checkDuplicates} from './lib/duplicates.mjs';
try{
 const notes={'DdJHLJrkYLT':'Studio introduction: Code meets design. Websites, visual identity, concept to launch.','DdJHObfEYuH':'One studio, connected work: websites, visual identities, web apps and integrations.','DdJHQyVkTlv':'Kierunek psychology centre portfolio demo: designed to feel calm.','DdJHUYDETjN':'Three questions, clear answers: what do you offer, is this a good fit for me, what should I do next?','DdJHYMYkSYj':'Have a website in mind? Start with your business, audience, goals and timeline. Contact our studio.','DdJHalZEabu':'Marcin Bak boxing and MMA coach website demo. Built with character.','DdJHer5EeYF':'Motion with a purpose: guide attention, explain an interaction, bring the brand to life.','DdJHjPhkaVs':'FLC luxury automotive website portfolio demo: a digital showroom.'};
 for(const [code,note]of Object.entries(notes))await pool.query('UPDATE social_history SET editorial_note=$1 WHERE permalink LIKE $2',[note,'%/'+code+'/%']);
 const posts=(await pool.query("SELECT id,day::text,content FROM social_posts WHERE status IN ('draft','approved') ORDER BY day")).rows;
 for(const p of posts){const result=await checkDuplicates(p.content,p.id);console.log(p.day,result);if(result.duplicate)await pool.query("UPDATE social_posts SET status='draft',error=$2 WHERE id=$1",[p.id,'Powtórzenie treści: '+result.reason]);}
 console.log('History count:',(await pool.query('SELECT count(*) FROM social_history')).rows[0].count);
}finally{await pool.end();}
