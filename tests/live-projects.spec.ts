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

test("updated Marcin preview loads local fonts and scroll-controlled video", async ({ page }) => {
  test.setTimeout(60000);
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto("/previews/marcin-bak/");
  const background = page.locator(".walk-background");
  await expect(background).toHaveAttribute("data-section", "1");
  await page.evaluate(() => document.fonts.ready);
  expect(await page.evaluate(() => document.fonts.check('16px "Bebas Neue"'))).toBe(true);
  await expect(page.locator(".training-sequence article")).toHaveCount(10);
  const video = page.locator('[data-walk-clip="1"] video');
  await expect(video).toHaveAttribute("src", /^\/previews\/marcin-bak\/videos\//);
  await expect.poll(() => video.evaluate((el: HTMLVideoElement) => el.readyState)).toBeGreaterThanOrEqual(2);
  await page.evaluate(() => {
    const next = document.getElementById("scena-filozofia")!;
    window.scrollTo({ top: (next.getBoundingClientRect().top + scrollY) * 0.7, behavior: "instant" });
  });
  await expect.poll(() => video.evaluate((el: HTMLVideoElement) => el.currentTime)).toBeGreaterThan(2);
  await expect(video).toBeVisible();
  expect(await video.evaluate((el: HTMLVideoElement) => el.paused)).toBe(true);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/previews/marcin-bak/");
  await expect(background).toHaveAttribute("data-section", "1");
  await expect(page.locator(".walk-video[src]")).toHaveCount(0);
  const poster = page.locator('[data-walk-clip="1"] img');
  await expect.poll(() => poster.evaluate((el: HTMLImageElement) => el.naturalWidth)).toBeGreaterThan(0);
  expect(errors).toEqual([]);
});
