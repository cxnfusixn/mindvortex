import { openStore } from "../../../../../prospecting/lib/store.mjs";
import { reportHtml } from "../../../../../prospecting/lib/report.mjs";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  if (!/^[a-f0-9]{48}$/.test(token))
    return new Response("Raport niedostępny.", { status: 404 });
  const store = openStore();
  try {
    const lead = store.share(token);
    if (!lead?.audit)
      return new Response("Raport wygasł lub jest niedostępny.", {
        status: 404,
      });
    return new Response(
      reportHtml(
        lead,
        (screen: { file: string }) =>
          `/prospecting/api/assets/${lead.id}/${screen.file}?token=${token}`,
        store.settings().portfolioUrl,
      ),
      {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-store",
          "X-Robots-Tag": "noindex, nofollow, noarchive",
          "Referrer-Policy": "no-referrer",
          "X-Content-Type-Options": "nosniff",
          "Content-Security-Policy":
            "default-src 'none'; style-src 'unsafe-inline'; img-src 'self' data:; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
        },
      },
    );
  } finally {
    store.close();
  }
}
