import { expect, test } from "@playwright/test";

test("search discovery lists only canonical language pages", async ({
  request,
}) => {
  const page = await request.get("/pl");
  const html = await page.text();
  const canonical = html.match(/rel="canonical" href="([^"]+)"/)?.[1];
  expect(canonical).toBeTruthy();
  const origin = new URL(canonical!).origin;
  const robots = await request.get("/robots.txt");
  expect(robots.status()).toBe(200);
  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.status()).toBe(200);
  if (origin.includes(".example")) {
    expect(await robots.text()).toContain("Disallow: /");
    expect(await sitemap.text()).not.toContain("<loc>");
    return;
  }
  expect(await robots.text()).toContain(`Sitemap: ${origin}/sitemap.xml`);
  const xml = await sitemap.text();
  expect(
    [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]).sort(),
  ).toEqual([`${origin}/en`, `${origin}/pl`]);
  expect(xml).toContain('hreflang="pl"');
  expect(xml).toContain('hreflang="en"');
  expect(xml).not.toContain("/previews/");
});

test("both languages describe all visible services in structured data", async ({
  page,
}) => {
  for (const locale of ["pl", "en"]) {
    await page.goto(`/${locale}`);
    const scripts = await page
      .locator('script[type="application/ld+json"]')
      .allTextContents();
    const graph = scripts.flatMap(
      (script) => JSON.parse(script)["@graph"] ?? [],
    );
    const organization = graph.find(
      (entry) => entry["@type"] === "Organization",
    );
    const offers = organization.hasOfferCatalog.itemListElement;
    const visibleServices = await page
      .locator("#capabilities article .capability-copy p")
      .allTextContents();
    expect(
      offers.map(
        (offer: { itemOffered: { description: string } }) =>
          offer.itemOffered.description,
      ),
    ).toEqual(visibleServices);
    expect(offers).toHaveLength(4);
  }
});
