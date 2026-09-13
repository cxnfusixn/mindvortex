import {readFileSync,existsSync,realpathSync} from 'node:fs';
import {join,dirname} from 'node:path';
import {openStore} from './lib/store.mjs';
import {expiredLeads,eraseLead,retentionDays} from './lib/retention.mjs';

const args = process.argv.slice(2), command = args[0] || 'preview';
if (!['preview','prune','erase','export','replay'].includes(command)) throw Error('Use preview, prune, erase ID, export ID, or replay JOURNAL');
const apply = args.includes('--apply');
if (apply && !args.includes('--services-stopped')) throw Error('Stop web and worker first, then pass --services-stopped');
const store = openStore();
try {
  if (command === 'export') {
    const lead = store.lead(args[1]);
    if (!lead) throw Error('Lead not found');
    const history = store.db.prepare('SELECT * FROM audit_history WHERE lead_id=?').all(lead.id);
    const assets = {};
    const root = realpathSync(store.directory), folder = join(root,'assets',lead.id);
    for (const file of ['desktop-1.jpg','desktop-2.jpg','desktop-3.jpg','mobile-1.jpg','mobile-2.jpg','mobile-3.jpg','report.html','report.md','audit.json','sent.eml']) {
      const target = join(folder,file);
      if (existsSync(target)) {
        if (dirname(realpathSync(target)) !== folder) throw Error('Unsafe export path');
        assets[file] = readFileSync(target).toString('base64');
      }
    }
    console.log(JSON.stringify({lead,history,assets},null,2));
  } else if (command === 'replay') {
    const records = readFileSync(args[1],'utf8').split('\n').filter(Boolean).map(line=>JSON.parse(line));
    if (records.some(r=> !/^[a-f0-9-]{36}$/.test(r.id) || !/^[a-f0-9]{64}$/.test(r.hash) || !Number.isFinite(Date.parse(r.erasedAt)))) throw Error('Invalid erasure journal');
    if (apply) for (const r of records) {
      store.db.prepare('INSERT OR IGNORE INTO excluded_domains VALUES(?,?)').run(r.hash,r.erasedAt);
      // A restored copy is offline; reset old in-progress states before erasure.
      store.db.prepare("UPDATE jobs SET status='cancelled' WHERE lead_id=?").run(r.id);
      store.db.prepare("UPDATE leads SET status='suppressed' WHERE id=?").run(r.id);
      eraseLead(store,r.id);
    }
    if (apply) store.db.exec('PRAGMA wal_checkpoint(TRUNCATE); VACUUM; PRAGMA wal_checkpoint(TRUNCATE)');
    console.log(JSON.stringify({apply,records:records.length}));
  } else {
    const candidates = command === 'erase' ? [{id:args[1]}] : expiredLeads(store);
    if (apply && command === 'preview') throw Error('Use prune --apply for deletion');
    if (apply) {
      for (const lead of candidates) eraseLead(store,lead.id);
      // secure_delete clears deleted SQLite cells; checkpoint/vacuum removes
      // obsolete pages and truncates WAL after the offline maintenance batch.
      store.db.exec('PRAGMA wal_checkpoint(TRUNCATE); VACUUM; PRAGMA wal_checkpoint(TRUNCATE)');
    }
    console.log(JSON.stringify({retentionDays,apply,candidates},null,2));
  }
} finally {store.close();}
