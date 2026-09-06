import { test, expect } from "@playwright/test";

for (const width of [390, 1440]) {
  test(`two live websites are usable on the homepage at ${width}px`, async ({
    page,
  }) => {
    test.setTimeout(60000);
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("/pl");
    await expect(page.locator(".live-project")).toHaveCount(2);
    const kierunek = page.locator("#project-kierunek");
    await kierunek.scrollIntoViewIfNeeded();
    const centre = page.frameLocator('iframe[title^="Kierunek"]');
    await expect(centre.locator("h1")).toContainText("Badania psychologiczne");
    const heroImage = centre.locator('#start img[src*="preview-cms/hero"]');
    await expect
      .poll(
        () => heroImage.evaluate((el) => (el as HTMLImageElement).naturalWidth),
        { timeout: 15000 },
      )
      .toBeGreaterThan(0);
    expect(
      await centre
        .locator("html")
        .evaluate(() => ({ width: innerWidth, height: innerHeight })),
    ).toEqual({ width: 1920, height: 1080 });
    await expect
      .poll(() =>
        centre
          .locator("button")
          .first()
          .evaluate((el) =>
            Object.keys(el).some((key) => key.startsWith("__reactProps")),
          ),
      )
      .toBeTruthy();
    await centre
      .getByRole("button", { name: "Przełącz jasny lub ciemny motyw" })
      .click();
    await expect(centre.locator("html")).toHaveAttribute("data-theme", "dark");
    await centre
      .getByRole("button", { name: "Przełącz jasny lub ciemny motyw" })
      .click();
    if (width === 390) {
      await kierunek
        .getByRole("button", { name: "Mobile", exact: true })
        .click();
      await centre.getByRole("button", { name: "Otwórz menu" }).click();
      await expect(
        centre.getByRole("navigation", { name: "Nawigacja mobilna" }),
      ).toBeVisible();
      await centre.getByRole("button", { name: "Zamknij menu" }).click();
    }
    await expect(centre.locator("img").first()).toBeVisible();
    await page.screenshot({ path: `test-results/live-kierunek-${width}.png` });
    const marcin = page.locator("#project-marcin-bak");
    await marcin.scrollIntoViewIfNeeded();
    const coach = page.frameLocator('iframe[title^="Marcin"]');
    await expect
      .poll(() => coach.locator("html").evaluate(() => innerWidth))
      .toBe(1920);
    await expect(coach.locator("h1")).toContainText("NIE TRENUJĘ EGO.");
    await coach
      .getByRole("link", { name: "Rozpocznij trening", exact: true })
      .click();
    await expect(coach.locator("#scena-cennik")).toBeInViewport();
    await expect(centre.locator("#start")).toBeInViewport();
    await coach.locator("#scena-faq").scrollIntoViewIfNeeded();
    const faq = coach.locator("#scena-faq button").last();
    await faq.click();
    await expect(faq.locator("..").locator("p")).toBeVisible();
    await coach.locator("h1").scrollIntoViewIfNeeded();
    await page.screenshot({ path: `test-results/live-marcin-${width}.png` });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBeTruthy();
    expect(errors).toEqual([]);
  });
}

test("exported Kierunek blog and full-page preview work", async ({ page }) => {
  await page.goto("/previews/kierunek/");
  await page.getByRole("link", { name: "Wszystkie artykuły" }).click();
  await expect(page).toHaveURL(/\/previews\/kierunek\/blog/);
  await expect(page.locator("h1")).toBeVisible();
  await page.goto("/previews/marcin-bak/");
  await expect(page.locator("h1")).toContainText("NIE TRENUJĘ EGO.");
});
