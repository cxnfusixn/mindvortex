import { test, expect } from "@playwright/test";

for (const locale of ["en", "pl"]) {
  for (const width of [360, 390, 768, 1440]) {
    test(`${locale}: translated, responsive page at ${width}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 1000 });
      await page.emulateMedia({ reducedMotion: "reduce" });
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.goto(`/${locale}`);
      await expect(page.locator("html")).toHaveAttribute("lang", locale);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(
        locale === "pl" ? "KODSPOTYKADESIGN." : "CODEMEETSDESIGN.",
      );
      await expect(
        page.locator('.language-switch a[aria-current="page"]'),
      ).toHaveText(locale.toUpperCase());
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      ).toBeTruthy();
      if (width <= 700) {
        const description = await page.locator(".hero-description").boundingBox();
        const symbol = await page.locator(".hero-symbol").boundingBox();
        expect(description!.y + description!.height).toBeLessThan(symbol!.y);
      }
      await expect(page.locator(".vortex-logo svg").first()).toHaveAttribute(
        "viewBox",
        "385 235 530 530",
      );
      await expect(page.locator(".brand-wordmark")).toHaveAttribute(
        "src",
        "/brand/mv-wordmark.svg",
      );
      await page.screenshot({
        path: `test-results/${locale}-hero-${width}.png`,
      });
      await expect(page.locator("#stack")).toContainText("Kotlin");
      await expect(page.locator("#stack")).toContainText("RabbitMQ / JMS");
      await expect(page.locator("#stack")).toContainText("Micronaut");
      await expect(page.locator("#stack")).toContainText("CorelDRAW");
      await expect(page.locator("#experience")).not.toContainText(
        "COLLABORATIONS",
      );
      await expect(page.locator("#experience")).not.toContainText("Brightstar");
      await expect(page.locator(".live-project")).toHaveCount(3);
      await expect(page.locator("#project-kierunek h4")).toHaveText("Kierunek");
      await page.locator("#stack").scrollIntoViewIfNeeded();
      await page.screenshot({
        path: `test-results/${locale}-stack-${width}.png`,
      });
      await page.locator("#contact").scrollIntoViewIfNeeded();
      await page.screenshot({
        path: `test-results/${locale}-contact-${width}.png`,
      });
      expect(errors).toEqual([]);
    });
  }
}

test("language links preserve the current section in both directions", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/en");
  await page
    .locator(".main-navigation")
    .getByRole("link", { name: "Contact" })
    .click();
  await page
    .locator(".language-switch")
    .getByRole("link", { name: "PL" })
    .click();
  await expect(page).toHaveURL(/\/pl#contact$/);
  await expect(page.locator("#contact")).toBeInViewport();
  await expect(page.locator("html")).toHaveAttribute("lang", "pl");
  await page
    .locator(".language-switch")
    .getByRole("link", { name: "EN" })
    .click();
  await expect(page).toHaveURL(/\/en#contact$/);
  await expect(page.locator("#contact")).toBeInViewport();
});

test("localized SEO and true vector assets", async ({ page, request }) => {
  await page.goto("/pl");
  await expect(page).toHaveTitle(
    "Strony internetowe, backend Java i branding | Mind Vortex",
  );
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    /\/pl$/,
  );
  await expect(page.locator('link[hreflang="en"]')).toHaveAttribute(
    "href",
    /\/en$/,
  );
  for (const asset of ["mv-logo.svg", "mv-symbol.svg", "mv-wordmark.svg"]) {
    const response = await request.get(`/brand/${asset}`);
    expect(response.ok()).toBeTruthy();
    const svg = await response.text();
    expect(svg).toContain("<path");
    expect(svg).not.toMatch(/<image|<text|base64|gradient/i);
  }
  const missing = await request.get("/de");
  expect(missing.status()).toBe(404);
});
