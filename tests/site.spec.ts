import { test, expect } from "@playwright/test";
for (const width of [360, 390, 768, 1440]) {
  test(`responsive layout and navigation at ${width}px`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "CODEMEETSDESIGN.",
    );
    await expect(page.locator("main section[data-scene]")).toHaveCount(8);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBeTruthy();
    await page.screenshot({ path: `test-results/hero-${width}.png` });
    await page
      .getByRole("navigation")
      .getByRole("link", { name: "Contact" })
      .click();
    await expect(page.locator("#contact")).toBeInViewport();
    await expect(
      page.locator('#contact a[href="mailto:patryk.pyrka@mindvortex.pro"]'),
    ).toHaveCount(1);
    await expect(page.getByRole("link", { name: "LinkedIn" })).toHaveAttribute(
      "href",
      "https://www.linkedin.com/in/patryk-p-2793a8379/",
    );
    await expect(page.locator(".contact-main .vortex-logo")).toHaveCount(0);
    expect(errors).toEqual([]);
    await page.screenshot({
      path: `test-results/home-${width}.png`,
      fullPage: true,
    });
  });
}
test("all scenes and all project titles remain available without JavaScript", async ({
  browser,
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:3100");
  await expect(page.locator("main section[data-scene]")).toHaveCount(8);
  await expect(page.locator(".live-project")).toHaveCount(3);
  await expect(
    page.getByRole("heading", { name: "Kierunek", exact: true }),
  ).toBeVisible();
  await context.close();
});
