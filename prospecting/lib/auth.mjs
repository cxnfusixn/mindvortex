import { createHash, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { isIP } from "node:net";
const derive = promisify(scrypt);
let activeLogins = 0;
export const cookieName = "mv-prospecting-session";
export const digest = (value) =>
  createHash("sha256").update(value).digest("hex");
export const publicOrigin = () =>
  new URL(
    process.env.PROSPECTING_PUBLIC_URL ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      "https://mindvortex.pro",
  ).origin;
export function sameOrigin(request) {
  return request.headers.get("origin") === publicOrigin();
}
export function sessionToken(request) {
  return (
    (request.headers.get("cookie") || "")
      .split(";")
      .map((x) => x.trim())
      .find((x) => x.startsWith(cookieName + "="))
      ?.slice(cookieName.length + 1) || ""
  );
}
export function authorized(store, request) {
  const token = sessionToken(request);
  if (!/^[a-f0-9]{64}$/.test(token) || !process.env.PROSPECTING_PASSWORD_HASH)
    return false;
  return Boolean(
    store.db
      .prepare("SELECT 1 FROM sessions WHERE hash=? AND expires>?")
      .get(digest(token), new Date().toISOString()),
  );
}
export async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${(await derive(password, salt, 64)).toString("hex")}`;
}
export function loginSource(request) {
  if (process.env.PROSPECTING_TRUST_PROXY !== "true") {
    if (process.env.NODE_ENV === "production")
      throw Error("Skonfiguruj zaufany reverse proxy dla logowania.");
    return "local";
  }
  // The loopback-only service requires nginx to overwrite this header.
  const ip = request.headers.get("x-real-ip") || "";
  if (!isIP(ip)) throw Error("Brak adresu klienta od zaufanego proxy.");
  return ip;
}
export async function login(store, password, source = "local") {
  const configured = process.env.PROSPECTING_PASSWORD_HASH || "";
  if (!/^[a-f0-9]{32}:[a-f0-9]{128}$/.test(configured))
    throw Error("Logowanie nie jest jeszcze skonfigurowane.");
  if (
    typeof password !== "string" ||
    password.length < 1 ||
    password.length > 256
  )
    throw Error("Nieprawidłowe hasło.");
  store.transaction(() => {
    const cutoff = new Date(Date.now() - 15 * 60_000).toISOString();
    store.db.prepare("DELETE FROM login_attempts WHERE at<?").run(cutoff);
    if (
      store.db.prepare("SELECT count(*) AS n FROM login_attempts WHERE source=?").get(digest(source)).n >= 10
    )
      throw Error("Zbyt wiele prób. Odczekaj 15 minut.");
    store.db
      .prepare("INSERT INTO login_attempts(at,source) VALUES(?,?)")
      .run(new Date().toISOString(), digest(source));
  });
  const [salt, expected] = configured.split(":");
  // Bound expensive hashes across sources without a shared lockout window.
  if (activeLogins >= 4) throw Error("Logowanie zajęte. Spróbuj za chwilę.");
  let actual;
  activeLogins++;
  try { actual = await derive(password, salt, 64); }
  finally { activeLogins--; }
  if (!timingSafeEqual(actual, Buffer.from(expected, "hex")))
    throw Error("Nieprawidłowe hasło.");
  const token = randomBytes(32).toString("hex");
  store.db
    .prepare("DELETE FROM sessions WHERE expires<?")
    .run(new Date().toISOString());
  store.db
    .prepare("INSERT INTO sessions VALUES(?,?)")
    .run(digest(token), new Date(Date.now() + 8 * 3600_000).toISOString());
  return token;
}
export function sessionCookie(token, maxAge = 28800) {
  return `${cookieName}=${token}; Path=/prospecting; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${publicOrigin().startsWith("https:") ? "; Secure" : ""}`;
}
export async function readBody(request) {
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    throw Error("Wymagany format JSON.");
  const reader = request.body?.getReader();
  if (!reader) throw Error("Brak danych.");
  let size = 0;
  const parts = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > 16000) {
      await reader.cancel();
      throw Error("Zbyt duże żądanie.");
    }
    parts.push(value);
  }
  const data = JSON.parse(Buffer.concat(parts).toString("utf8"));
  if (!data || Array.isArray(data) || typeof data !== "object")
    throw Error("Nieprawidłowe dane.");
  return data;
}
