import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { chromium } from "playwright";
import { browserProxy, publicUrl, isProfileUrl } from "./network.mjs";

export async function capture(lead, directory, { timeoutMs = 180000 } = {}) {
  if (isProfileUrl(lead.website))
    throw Error("Profil platformy zewnętrznej nie jest własną stroną firmy.");
  const proxy = await browserProxy();
  let browser, server, timer;
  let expired = false;
  const screens = [];
  const errors = [];
  try {
    server = await chromium.launchServer({
      host: "127.0.0.1",
      timeout: 30000,
      headless: true,
      chromiumSandbox: process.env.PROSPECTING_CHROMIUM_SANDBOX !== "false",
      proxy: { server: proxy.url, bypass: "<-loopback>" },
      args: [
        "--force-webrtc-ip-handling-policy=disable_non_proxied_udp",
        "--disable-quic",
      ],
    });
    browser = await chromium.connect(server.wsEndpoint(), { timeout: 10000 });
    timer = setTimeout(() => {
      expired = true;
      void server.kill().catch(() => {});
    }, timeoutMs);
    const folder = join(directory, "assets", lead.id);
    await mkdir(folder, { recursive: true });
    const urls = [
      { url: publicUrl(lead.website).href, label: "Strona główna" },
    ];
    for (const viewport of [
      { width: 1440, height: 1000 },
      { width: 390, height: 844 },
    ]) {
      const context = await browser.newContext({
        viewport,
        locale: "pl-PL",
        serviceWorkers: "block",
        acceptDownloads: false,
        permissions: [],
        userAgent: "Mozilla/5.0 MindVortexAudit/1.0 (+https://mindvortex.pro)",
      });
      await context.route("**/*", async (route) => {
        const req = route.request();
        try {
          publicUrl(req.url());
          if (
            !["GET", "HEAD"].includes(req.method()) ||
            ["media", "websocket"].includes(req.resourceType())
          )
            throw Error("Blocked");
          await route.continue();
        } catch {
          await route.abort();
        }
      });
      const page = await context.newPage();
      page.setDefaultTimeout(12000);
      for (let index = 0; index < urls.length && index < 3; index++) {
        const target = urls[index];
        try {
          const response = await page.goto(target.url, {
            waitUntil: "domcontentloaded",
            timeout: 25000,
          });
          if (
            (response && response.status() >= 400) ||
            (!response && index === 0)
          )
            throw Error("Strona niedostępna.");
          await page.waitForTimeout(1200);
          await page.waitForLoadState("load", {timeout:10000}).catch(() => {});
          const declineCookies = page.getByRole("button", {name:/^(Odmowa|Odrzuć wszystkie|Odrzuć|Reject all|Decline)$/i}).first();
          if (await declineCookies.isVisible()) {
            await declineCookies.click();
            await page.waitForTimeout(600);
          }
          await waitForFonts(page);
          if (isProfileUrl(page.url()))
            throw Error("Przekierowanie do platformy zewnętrznej — pominięto audyt profilu.");
          if (screens.some((screen) => screen.width === viewport.width && screen.url === page.url()))
            continue;
          if (index === 0 && viewport.width === 1440) {
            const links = await page.locator("a[href]").evaluateAll((nodes) =>
              nodes.map((n) => ({
                url: n.href,
                label: (n.textContent || "").trim(),
              })),
            );
            const host = new URL(page.url()).hostname.replace(/^www\./, "");
            for (const rule of [
              /kontakt|contact/i,
              /oferta|usługi|uslugi|services|cennik/i,
            ]) {
              const link = links.find((l) => {
                try {
                  return (
                    rule.test(l.label) &&
                    new URL(l.url).hostname.replace(/^www\./, "") === host &&
                    !urls.some((x) => x.url === l.url)
                  );
                } catch {
                  return false;
                }
              });
              if (link)
                urls.push({
                  url: publicUrl(link.url).href,
                  label: link.label.slice(0, 80),
                });
            }
          }
          const text = (await page.locator("body").innerText()).slice(0, 1800);
          if (
            text.length < 50 ||
            /just a moment|verify you are human|checking your browser|access denied/i.test(
              text.slice(0, 350),
            )
          )
            throw Error("Strona pusta lub blokada dostępu.");
          // Bounded viewport images preserve readable text and keep vision costs predictable.
          const file = `${viewport.width === 390 ? "mobile" : "desktop"}-${index + 1}.jpg`;
          await page.screenshot({
            path: join(folder, file),
            type: "jpeg",
            quality: 80,
            animations: "disabled",
          });
          screens.push({
            technical: await page.evaluate(() => ({
              title: document.title,
              description: document.querySelector('meta[name="description"]')?.getAttribute("content") || "",
              h1Count: document.querySelectorAll("h1").length,
              imagesWithoutAlt: document.querySelectorAll("img:not([alt])").length,
              imageCount: document.images.length,
              horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
              viewport: document.querySelector('meta[name="viewport"]')?.getAttribute("content") || "",
              https: location.protocol === "https:",
            })),
            file,
            label: target.label,
            url: page.url(),
            width: viewport.width,
            height: viewport.height,
            text,
            capturedAt: new Date().toISOString(),
          });
        } catch (error) {
          if (expired) throw Error("Przekroczono limit czasu zbierania materiału.");
          errors.push(
            `${target.label} (${viewport.width}px): ${error instanceof Error ? error.message.split("\n")[0].slice(0, 160) : "nie udało się zebrać materiału."}`,
          );
        }
      }
      await context.close();
    }
    if (
      screens.some((s) => isProfileUrl(s.url)) ||
      !screens.some((s) => s.width === 390) ||
      !screens.some((s) => s.width === 1440)
    )
      throw Error(
        "Brak materiału z obu platform. " + errors.join(" ").slice(0, 300),
      );
    return { screens, errors };
  } finally {
    clearTimeout(timer);
    try { await server?.kill(); }
    finally { await proxy.close(); }
  }
}

// Playwright enforces this timeout outside the page-controlled Promise.
export async function waitForFonts(page, timeout = 5000) {
  await page.waitForFunction(() => document.fonts.status === "loaded", undefined, { timeout });
}
