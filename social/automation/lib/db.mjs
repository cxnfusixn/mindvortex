import pg from 'pg';
export const pool = new pg.Pool({connectionString:process.env.SOCIAL_DATABASE_URL,max:5});
export async function init() {
 await pool.query(`CREATE TABLE IF NOT EXISTS social_settings (id int PRIMARY KEY CHECK(id=1), paused boolean NOT NULL DEFAULT true, autopilot boolean NOT NULL DEFAULT false, hour int NOT NULL DEFAULT 10 CHECK(hour BETWEEN 0 AND 23));
 INSERT INTO social_settings(id) VALUES(1) ON CONFLICT DO NOTHING;
 CREATE TABLE IF NOT EXISTS social_reel_settings(id int PRIMARY KEY CHECK(id=1),enabled boolean NOT NULL DEFAULT false,weekday int NOT NULL DEFAULT 5 CHECK(weekday BETWEEN 0 AND 6),hour int NOT NULL DEFAULT 18 CHECK(hour BETWEEN 0 AND 23),horizon int NOT NULL DEFAULT 3 CHECK(horizon=3));
 ALTER TABLE social_reel_settings DROP CONSTRAINT IF EXISTS social_reel_settings_horizon_check;
 ALTER TABLE social_reel_settings ADD COLUMN IF NOT EXISTS interval_days int;
 ALTER TABLE social_reel_settings ADD COLUMN IF NOT EXISTS anchor_day date;
 INSERT INTO social_reel_settings(id) VALUES(1) ON CONFLICT DO NOTHING;
 CREATE TABLE IF NOT EXISTS social_reels(id uuid PRIMARY KEY,day date UNIQUE NOT NULL,kind text NOT NULL,content jsonb NOT NULL,video text NOT NULL,sha text NOT NULL UNIQUE,status text NOT NULL DEFAULT 'approved',container_id text,media_id text,permalink text,error text,created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now());
 CREATE TABLE IF NOT EXISTS social_posts(id uuid PRIMARY KEY, day date UNIQUE NOT NULL, kind text NOT NULL, content jsonb NOT NULL, image text NOT NULL, status text NOT NULL DEFAULT 'draft', container_id text, media_id text, permalink text, error text, metrics jsonb, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());
 CREATE TABLE IF NOT EXISTS social_tiktok_assets(sha text PRIMARY KEY,job_id uuid NOT NULL);
 CREATE TABLE IF NOT EXISTS social_tiktok_history(id text PRIMARY KEY,caption text NOT NULL,permalink text,published_at timestamptz,metrics jsonb);
 CREATE TABLE IF NOT EXISTS social_tiktok_jobs(id uuid PRIMARY KEY,reel_id uuid UNIQUE,day date NOT NULL,kind text NOT NULL,content jsonb NOT NULL,assets jsonb NOT NULL,source_ids jsonb,status text NOT NULL DEFAULT 'ready',buffer_id text UNIQUE,permalink text,error text,created_at timestamptz DEFAULT now(),updated_at timestamptz DEFAULT now());
 ALTER TABLE social_posts ADD COLUMN IF NOT EXISTS manual_requested_at timestamptz;
 ALTER TABLE social_reels ADD COLUMN IF NOT EXISTS manual_requested_at timestamptz;
 ALTER TABLE social_tiktok_jobs ADD COLUMN IF NOT EXISTS manual_requested_at timestamptz;
 CREATE TABLE IF NOT EXISTS social_metric_samples(media_id text NOT NULL,bucket timestamptz NOT NULL,metrics jsonb NOT NULL,PRIMARY KEY(media_id,bucket));
 CREATE TABLE IF NOT EXISTS social_metrics(media_id text PRIMARY KEY,metrics jsonb NOT NULL);
 CREATE TABLE IF NOT EXISTS social_events(id bigserial PRIMARY KEY, created_at timestamptz DEFAULT now(), message text NOT NULL);
 CREATE TABLE IF NOT EXISTS social_tokens(id int PRIMARY KEY CHECK(id=1), token text NOT NULL, refreshed_at timestamptz DEFAULT now());
 CREATE TABLE IF NOT EXISTS social_visual_reviews(asset_key text NOT NULL,history_revision text NOT NULL,repeated boolean NOT NULL,PRIMARY KEY(asset_key,history_revision));
 CREATE TABLE IF NOT EXISTS social_visual_usage(source_key text PRIMARY KEY,sha text NOT NULL,perceptual text NOT NULL,media_id text,used_at timestamptz NOT NULL DEFAULT now());
 CREATE TABLE IF NOT EXISTS social_revisions(id bigserial PRIMARY KEY,post_id uuid NOT NULL,content jsonb NOT NULL,image text,reason text,created_at timestamptz NOT NULL DEFAULT now());
 CREATE TABLE IF NOT EXISTS social_sessions(token_hash text PRIMARY KEY,expires_at timestamptz NOT NULL);
 CREATE TABLE IF NOT EXISTS social_challenges(token_hash text PRIMARY KEY,code_hash text NOT NULL,expires_at timestamptz NOT NULL,attempts int NOT NULL DEFAULT 0);
 CREATE TABLE IF NOT EXISTS social_login_attempts(ip_hash text NOT NULL,at timestamptz NOT NULL DEFAULT now());
 CREATE INDEX IF NOT EXISTS social_login_attempts_recent ON social_login_attempts(ip_hash,at);
 CREATE TABLE IF NOT EXISTS social_job_attempts(name text PRIMARY KEY,attempts int NOT NULL DEFAULT 0,next_at timestamptz NOT NULL DEFAULT now());
 CREATE TABLE IF NOT EXISTS social_history(media_id text PRIMARY KEY,caption text NOT NULL DEFAULT '',published_at timestamptz NOT NULL,permalink text,media_type text,media_url text,editorial_note text NOT NULL DEFAULT '',synced_at timestamptz NOT NULL DEFAULT now());
 ALTER TABLE social_history ADD COLUMN IF NOT EXISTS visual_source_key text;
 CREATE TABLE IF NOT EXISTS social_health(name text PRIMARY KEY,checked_at timestamptz NOT NULL DEFAULT now());
 CREATE TABLE IF NOT EXISTS social_jobs(name text PRIMARY KEY, completed_at timestamptz NOT NULL DEFAULT now());`);
 if(process.env.INSTAGRAM_ACCESS_TOKEN) await pool.query('INSERT INTO social_tokens(id,token) VALUES(1,$1) ON CONFLICT DO NOTHING',[process.env.INSTAGRAM_ACCESS_TOKEN]);
}
export async function event(message){await pool.query('INSERT INTO social_events(message) VALUES($1)',[message.slice(0,1000)]);}
export async function settings(){return (await pool.query('SELECT * FROM social_settings WHERE id=1')).rows[0];}
export async function locked(name,fn){const c=await pool.connect();try{const r=await c.query('SELECT pg_try_advisory_lock(hashtext($1)) AS ok',[name]);if(!r.rows[0].ok)return null;try{return await fn(c);}finally{await c.query('SELECT pg_advisory_unlock(hashtext($1))',[name]);}}finally{c.release();}}
