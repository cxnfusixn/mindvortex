import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { openStore } from "../../../../../../../prospecting/lib/store.mjs";
import { authorized } from "../../../../../../../prospecting/lib/auth.mjs";
export const runtime = "nodejs";
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; file: string }> },
) {
  const { id, file } = await params;
  if (
    !/^[a-f0-9-]{36}$/.test(id) ||
    !(/^(mobile|desktop)-[1-3]\.jpg$/.test(file) || file === "report.html")
  )
    return new Response(null, { status: 404 });
  const store = openStore();
  try {
    const lead = store.lead(id),
      owner = authorized(store, request);
    if (
      !lead ||
      !owner
    )
      return new Response(null, { status: 404 });
    if (
      file !== "report.html" &&
      !lead.screens.some((s: { file: string }) => s.file === file)
    )
      return new Response(null, { status: 404 });
    const buffer = await readFile(join(store.directory, "assets", id, file));
    return new Response(buffer, {
      headers: {
        "Content-Type": file.endsWith(".jpg")
          ? "image/jpeg"
          : "text/html; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Robots-Tag": "noindex, nofollow",
        "X-Content-Type-Options": "nosniff",
        ...(file === "report.html"
          ? {
              "Content-Disposition":
                'attachment; filename="audyt-mindvortex.html"',
            }
          : {}),
      },
    });
  } catch {
    return new Response(null, { status: 404 });
  } finally {
    store.close();
  }
}
