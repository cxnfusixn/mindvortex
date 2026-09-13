/** Read at most limit bytes, including chunked requests without Content-Length. */
export async function readJson(req, limit = 20000) {
  const fail = (message, status) => Object.assign(new Error(message), {status});
  if (!req.headers.get('content-type')?.startsWith('application/json')) throw fail('JSON required', 415);
  if (Number(req.headers.get('content-length')) > limit) throw fail('Request too large', 413);
  const reader = req.body?.getReader();
  if (!reader) throw fail('Request body required', 400);
  const parts = []; let size = 0;
  try {
    while (true) {
      const {done, value} = await reader.read();
      if (done) break;
      size += value.length;
      if (size > limit) {
        await reader.cancel();
        throw fail('Request too large', 413);
      }
      parts.push(value);
    }
  } finally { reader.releaseLock(); }
  let data;
  try { data = JSON.parse(Buffer.concat(parts).toString('utf8')); }
  catch { throw fail('Invalid JSON', 400); }
  if (!data || Array.isArray(data) || typeof data !== 'object') throw fail('JSON object required', 400);
  return data;
}
