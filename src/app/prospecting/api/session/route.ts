import { openStore } from "../../../../../prospecting/lib/store.mjs";
import {
  login,
  readBody,
  sameOrigin,
  sessionCookie,
  sessionToken,
  digest,
} from "../../../../../prospecting/lib/auth.mjs";
export const runtime = "nodejs";
export async function POST(request: Request) {
  if (!sameOrigin(request))
    return Response.json(
      { error: "Nieprawidłowe źródło żądania." },
      { status: 403 },
    );
  const store = openStore();
  try {
    const data = await readBody(request);
    const token = await login(store, data.password);
    return Response.json(
      { ok: true },
      {
        headers: {
          "Set-Cookie": sessionCookie(token),
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Logowanie nie powiodło się.",
      },
      { status: 401 },
    );
  } finally {
    store.close();
  }
}
export async function DELETE(request: Request) {
  if (!sameOrigin(request)) return new Response(null, { status: 403 });
  const store = openStore();
  try {
    store.db
      .prepare("DELETE FROM sessions WHERE hash=?")
      .run(digest(sessionToken(request)));
    return Response.json(
      { ok: true },
      {
        headers: {
          "Set-Cookie": sessionCookie("", 0),
          "Cache-Control": "no-store",
        },
      },
    );
  } finally {
    store.close();
  }
}
