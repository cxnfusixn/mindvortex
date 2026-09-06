import nodemailer from "nodemailer";
import { createHash } from "node:crypto";
import { contactServices } from "@/data/contact-form";
import { site } from "@/data/site";

export const runtime = "nodejs";
const attempts = new Map<string, { count: number; until: number }>();
const limit = 16 * 1024;

export async function POST(request: Request) {
  const fail = (status: number) => Response.json({ ok: false }, { status });
  const origin = request.headers.get("origin");
  if (
    origin &&
    origin !== new URL(request.url).origin &&
    origin !== process.env.NEXT_PUBLIC_SITE_URL
  )
    return fail(403);
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    return fail(415);
  if (Number(request.headers.get("content-length")) > limit) return fail(413);
  let body: Record<string, unknown>;
  try {
    const reader = request.body?.getReader();
    if (!reader) return fail(400);
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > limit) {
        await reader.cancel();
        return fail(413);
      }
      chunks.push(value);
    }
    body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    if (!body || typeof body !== "object" || Array.isArray(body))
      return fail(400);
  } catch {
    return fail(400);
  }
  const { name, email, service, message, website } = body;
  if (
    typeof name !== "string" ||
    name.trim().length < 2 ||
    name.length > 80 ||
    /[\r\n]/.test(name) ||
    typeof email !== "string" ||
    email.length > 254 ||
    !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email) ||
    typeof service !== "string" ||
    !contactServices.includes(service as (typeof contactServices)[number]) ||
    typeof message !== "string" ||
    message.trim().length < 10 ||
    message.length > 5000 ||
    website !== ""
  )
    return fail(400);
  const now = Date.now();
  for (const [key, entry] of attempts)
    if (entry.until < now) attempts.delete(key);
  // Per-process protection; configure shared rate limiting at the proxy for multi-instance deployments.
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const key = createHash("sha256").update(ip).digest("hex");
  const entry = attempts.get(key) || { count: 0, until: now + 15 * 60 * 1000 };
  if (entry.count >= 5 || attempts.size >= 10000) return fail(429);
  entry.count++;
  attempts.set(key, entry);
  const { SMTP_HOST: host, SMTP_USER: user, SMTP_PASSWORD: pass } = process.env;
  const port = Number(process.env.SMTP_PORT || 587);
  const from = process.env.SMTP_FROM || user;
  if (
    !host ||
    !user ||
    !pass ||
    !from ||
    !Number.isInteger(port) ||
    port < 1 ||
    port > 65535
  )
    return fail(503);
  try {
    const transport = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      requireTLS: port !== 465,
      auth: { user, pass },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
      disableFileAccess: true,
      disableUrlAccess: true,
    });
    const result = await transport.sendMail({
      from: { name: "Mind Vortex", address: from },
      to: site.email,
      replyTo: { name: name.trim(), address: email.trim() },
      subject: `Mind Vortex — nowy projekt / ${service}`,
      text: `Imię: ${name.trim()}\nE-mail: ${email.trim()}\nZakres: ${service}\n\n${message.trim()}`,
    });
    if (!result.accepted.length) return fail(502);
    return Response.json({ ok: true });
  } catch {
    return fail(502);
  }
}
