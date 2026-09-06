export function GET() {
  return Response.json(
    { status: "ok", service: "mindvortex" },
    { headers: { "Cache-Control": "no-store" } },
  );
}
