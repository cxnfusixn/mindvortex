import fs from 'node:fs/promises';
import path from 'node:path';
import {Readable} from 'node:stream';

async function serve(req, {params}, head = false) {
  const {file} = await params;
  if (!/^[0-9a-f-]{36}\.(jpg|mp4)$/.test(file)) return new Response(null, {status:404});
  let handle;
  try {
    handle = await fs.open(/* turbopackIgnore: true */ path.join(/* turbopackIgnore: true */ process.env.SOCIAL_MEDIA_DIR || path.resolve('media'), file), 'r');
    const stat = await handle.stat();
    if (!stat.isFile()) return new Response(null, {status:404});
    const size = stat.size;
    const headers = {'Content-Type':file.endsWith('.mp4') ? 'video/mp4' : 'image/jpeg',
      'Cache-Control':'public, max-age=86400', 'X-Content-Type-Options':'nosniff',
      'Accept-Ranges':'bytes', 'Content-Length':String(size)};
    if (head) return new Response(null, {headers});
    let start = 0, end = size - 1, status = 200;
    const range = req.headers.get('range');
    if (range) {
      const match = /^bytes=(\d*)-(\d*)$/.exec(range);
      const invalid = () => new Response(null, {status:416, headers:{'Content-Range':`bytes */${size}`}});
      if (!size || !match || (!match[1] && !match[2])) return invalid();
      const first = Number(match[1]), last = Number(match[2]);
      if (!Number.isSafeInteger(first) || !Number.isSafeInteger(last)) return invalid();
      if (!match[1]) {
        if (last === 0) return invalid();
        start = Math.max(0, size - last);
      } else {
        start = first;
        end = match[2] ? Math.min(last, end) : end;
      }
      if (start > end || start >= size) return invalid();
      status = 206;
      headers['Content-Length'] = String(end - start + 1);
      headers['Content-Range'] = `bytes ${start}-${end}/${size}`;
    }
    if (!size) return new Response(null, {headers});
    if (req.signal.aborted) return new Response(null, {status:499});
    const stream = handle.createReadStream({start, end, highWaterMark:64 * 1024});
    handle = undefined; // The stream now owns and closes the descriptor.
    const abort = () => stream.destroy(new Error('Request aborted'));
    req.signal.addEventListener('abort', abort, {once:true});
    stream.once('close', () => req.signal.removeEventListener('abort', abort));
    return new Response(Readable.toWeb(stream, {strategy:{highWaterMark:64 * 1024, size:chunk => chunk.length}}), {status, headers});
  } catch {
    return new Response(null, {status:404});
  } finally {
    await handle?.close();
  }
}
export const GET = (req, ctx) => serve(req, ctx);
export const HEAD = (req, ctx) => serve(req, ctx, true);
