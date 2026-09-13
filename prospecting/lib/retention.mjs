import {appendFileSync, existsSync, lstatSync, realpathSync, rmSync} from 'node:fs';
import {join, dirname} from 'node:path';
import {createHash} from 'node:crypto';

export const retentionDays = 180;
export function expiredLeads(store, at = new Date()) {
  const cutoff = new Date(at.getTime() - retentionDays * 86400000).toISOString();
  return store.db.prepare(`SELECT id,status,updated_at FROM leads WHERE updated_at<?
    AND status NOT IN ('auditing','sending') AND NOT EXISTS
    (SELECT 1 FROM jobs WHERE lead_id=leads.id AND status='running') ORDER BY updated_at`).all(cutoff);
}

// Administrative batch maintenance runs offline. The worker may remove idle
// expired leads; an active SMTP/capture is always rejected inside the DB lock.
export function eraseLead(store, id) {
  if (!/^[a-f0-9-]{36}$/.test(id)) throw Error('Invalid lead ID');
  return store.transaction(() => {
    const lead = store.lead(id);
    if (!lead) return false;
    if (['auditing','sending'].includes(lead.status) || store.db.prepare("SELECT 1 FROM jobs WHERE lead_id=? AND status='running'").get(id))
      throw Error('Lead has active work; stop services and recover interrupted jobs first');
    const root = realpathSync(store.directory);
    const assets = join(root,'assets'), folder = join(assets,id);
    // Trust comes from the DB record and private service-owned state directory.
    // Refuse symlink/junction ancestors instead of following them during removal.
    if (existsSync(assets) && (lstatSync(assets).isSymbolicLink() || realpathSync(assets) !== assets))
      throw Error('Unsafe assets root');
    if (existsSync(folder) && (lstatSync(folder).isSymbolicLink() || dirname(realpathSync(folder)) !== assets))
      throw Error('Unsafe lead assets path');
    const erasedAt = new Date().toISOString();
    const hash = createHash('sha256').update(new URL(lead.website).hostname.replace(/^www\./,'').replace(/\.$/,'')).digest('hex');
    // Persist before erasure. Keep the latest journal separately from old backups
    // and replay it on an offline restored copy before enabling any services.
    const journal = join(root,'erasures.jsonl');
    if (existsSync(journal) && lstatSync(journal).isSymbolicLink()) throw Error('Unsafe erasure journal');
    appendFileSync(journal, JSON.stringify({id,hash,erasedAt})+'\n', {mode:0o600,flush:true});
    store.db.prepare('INSERT OR IGNORE INTO excluded_domains VALUES(?,?)').run(hash,erasedAt);
    store.db.prepare('DELETE FROM usage WHERE id IN (SELECT id FROM jobs WHERE lead_id=?)').run(id);
    store.db.prepare('DELETE FROM jobs WHERE lead_id=?').run(id);
    store.db.prepare('DELETE FROM audit_history WHERE lead_id=?').run(id);
    store.db.prepare('DELETE FROM runtime WHERE key=?').run('sent-copy:'+id);
    store.db.prepare('DELETE FROM leads WHERE id=?').run(id);
    // Legacy free-text events have no lead association and can contain names.
    store.db.exec('DELETE FROM events');
    if (existsSync(folder)) rmSync(folder,{recursive:true});
    return true;
  });
}
