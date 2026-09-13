import { isIP, connect } from "node:net";
import { lookup } from "node:dns/promises";
import { createServer, request as httpRequest } from "node:http";

export function isProfileUrl(value) {
  if (!value) return false;
  return /(^|\.)(facebook\.com|fb\.com|instagram\.com|booksy\.(com|pl)|maps\.google\.com|tiktok\.com)$/.test(
    new URL(value).hostname.toLowerCase().replace(/\.$/, ""),
  );
}

export function isPublicIP(ip) {
  if (isIP(ip) === 4) {
    const [a, b] = ip.split(".").map(Number);
    return !(
      a === 0 ||
      a === 10 ||
      a === 127 ||
      a >= 224 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && (b === 0 || b === 168)) ||
      (a === 198 && (b === 18 || b === 19 || b === 51)) ||
      (a === 203 && b === 0)
    );
  }
  // Only native global unicast IPv6; exclude transition and special allocations.
  return (
    isIP(ip) === 6 &&
    /^[23][0-9a-f]{3}:/i.test(ip) &&
    !/^200[12]:/i.test(ip) &&
    !/^3fff:/i.test(ip)
  );
}
export function publicUrl(value) {
  if (typeof value !== "string" || value.length > 2000)
    throw Error("Nieprawidłowy adres strony.");
  const url = new URL(value);
  const host = url.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.port ||
    (!host.includes(".") && !isIP(host)) ||
    /(^|\.)(localhost|local|internal|test|invalid)$/.test(host) ||
    (isIP(host) && !isPublicIP(host))
  )
    throw Error(
      "Dozwolone są wyłącznie publiczne strony HTTP(S), na standardowych portach.",
    );
  return url;
}
export async function publicAddress(host) {
  host = host.replace(/^\[|\]$/g, "");
  const addresses = isIP(host)
    ? [{ address: host, family: isIP(host) }]
    : await lookup(host, { all: true });
  if (!addresses.length || addresses.some((x) => !isPublicIP(x.address)))
    throw Error("Adres docelowy nie jest publiczny.");
  return addresses[0];
}

// Chromium uses this proxy for every connection, including redirects and assets.
// DNS is resolved once and the approved IP is passed to the socket (no rebinding).
export async function browserProxy() {
  const sockets = new Set();
  let requests = 0;
  let transferred = 0;
  const allowed = () => ++requests <= 1500;
  const server = createServer(async (req, res) => {
    try {
      if (!allowed() || !["GET", "HEAD"].includes(req.method))
        throw Error("Blocked");
      const url = publicUrl(req.url);
      if (url.protocol !== "http:") throw Error("Blocked");
      const addr = await publicAddress(url.hostname);
      const upstream = httpRequest(
        {
          hostname: addr.address,
          port: 80,
          path: url.pathname + url.search,
          method: req.method,
          headers: { ...req.headers, host: url.host },
          timeout: 12000,
        },
        (response) => {
          res.writeHead(response.statusCode || 502, response.headers);
          response.on("data", (chunk) => {
            transferred += chunk.length;
            if (transferred > 100 * 1024 * 1024) response.destroy();
          });
          response.pipe(res);
        },
      );
      upstream.on("timeout", () => upstream.destroy());
      upstream.on("error", () => res.destroy());
      req.pipe(upstream);
    } catch {
      res.writeHead(403);
      res.end();
    }
  });
  server.on("connect", async (req, client, head) => {
    try {
      if (!allowed()) throw Error("Blocked");
      const target = new URL("https://" + req.url);
      if (target.port && target.port !== "443") throw Error("Blocked");
      const url = publicUrl(target.href),
        addr = await publicAddress(url.hostname);
      const upstream = connect({ host: addr.address, port: 443 });
      sockets.add(upstream);
      upstream.setTimeout(15000, () => upstream.destroy());
      upstream.on("connect", () => {
        client.write("HTTP/1.1 200 Connection Established\r\n\r\n");
        if (head.length) upstream.write(head);
        client.pipe(upstream);
        upstream.pipe(client);
      });
      upstream.on("data", (chunk) => {
        transferred += chunk.length;
        if (transferred > 100 * 1024 * 1024) upstream.destroy();
      });
      upstream.on("error", () => client.destroy());
      client.on("error", () => upstream.destroy());
      client.on("close", () => upstream.destroy());
      upstream.on("close", () => {
        sockets.delete(upstream);
        client.destroy();
      });
    } catch {
      client.end("HTTP/1.1 403 Forbidden\r\n\r\n");
    }
  });
  server.on("connection", (socket) => {
    sockets.add(socket);
    socket.on("close", () => sockets.delete(socket));
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  return {
    url: `http://127.0.0.1:${server.address().port}`,
    close: async () => {
      for (const socket of sockets) socket.destroy();
      await new Promise((resolve) => server.close(resolve));
    },
  };
}
