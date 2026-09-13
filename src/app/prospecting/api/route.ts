import {
  openStore,
  areas,
  categories,
} from "../../../../prospecting/lib/store.mjs";
import {
  authorized,
  readBody,
  sameOrigin,
} from "../../../../prospecting/lib/auth.mjs";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = {
  "Cache-Control": "no-store",
  "X-Robots-Tag": "noindex, nofollow",
  "X-Content-Type-Options": "nosniff",
};
export async function GET(request: Request) {
  const store = openStore();
  try {
    if (!authorized(store, request))
      return Response.json(
        {
          error: "Zaloguj się.",
          configured: Boolean(process.env.PROSPECTING_PASSWORD_HASH),
        },
        { status: 401, headers },
      );
    return Response.json(
      {
        leads: store.leads(),
        jobs: store.jobs(),
        events: store.events(),
        settings: store.settings(),
        usage: store.usage(),
        areas,
        categories,
        heartbeat: store.getRuntime("heartbeat") || null,
        workerOnline: Boolean(
          store.getRuntime("heartbeat") &&
          Date.now() -
            new Date(String(store.getRuntime("heartbeat"))).getTime() <
            90_000,
        ),
        integrations: {
          vision: Boolean(process.env.PROSPECTING_OPENAI_API_KEY),
          delivery:
            process.env.PROSPECTING_SEND_ENABLED === "true" &&
            Boolean(process.env.SMTP_HOST && process.env.SMTP_FROM),
        },
      },
      { headers },
    );
  } finally {
    store.close();
  }
}
export async function POST(request: Request) {
  if (!sameOrigin(request))
    return Response.json(
      { error: "Nieprawidłowe źródło żądania." },
      { status: 403, headers },
    );
  const store = openStore();
  try {
    if (!authorized(store, request))
      return Response.json(
        { error: "Sesja wygasła. Zaloguj się." },
        { status: 401, headers },
      );
    const data = await readBody(request);
    switch (data.action) {
      case "discover": {
        if (
          !areas.includes(data.area) ||
          !Object.hasOwn(categories, data.category)
        )
          throw Error("Wybierz obszar i branżę.");
        store.enqueue("discover", null, {
          area: data.area,
          category: data.category,
        });
        break;
      }
      case "add":
        store.addLead({
          name: data.name,
          website: data.website,
          area: data.area,
          category: data.category,
          source: "manual",
        });
        break;
      case "audit":
        if (typeof data.id !== "string") throw Error("Brak firmy.");
        store.enqueue("audit", data.id);
        break;
      case "settings": {
        const keys = [
          "paused",
          "autoDiscover",
          "autoSend",
          "area",
          "category",
          "dailyLimit",
          "dailyHour",
          "portfolioUrl",
        ];
        const value = Object.fromEntries(
          keys
            .filter((key) => Object.hasOwn(data, key))
            .map((key) => [key, data[key]]),
        );
        store.saveSettings(value);
        break;
      }
      case "consent":
        store.saveConsent(
          String(data.id),
          String(data.email || ""),
          String(data.evidence || ""),
        );
        break;
      case "suppress":
        store.suppress(String(data.id));
        break;
      case "replied":
        store.suppress(String(data.id), "replied");
        break;
      default:
        throw Error("Nieznana operacja.");
    }
    return Response.json({ ok: true }, { headers });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Nie udało się wykonać operacji.",
      },
      { status: 400, headers },
    );
  } finally {
    store.close();
  }
}
