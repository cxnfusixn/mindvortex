import { expect, test } from "@playwright/test";

test("FLC is the first preview with working vehicle pages and mobile navigation", async ({
  page,
}) => {
  test.setTimeout(60000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/pl");
  await expect(page.locator(".live-project").first()).toHaveAttribute("id", "project-flc");
  const project = page.locator("#project-flc");
  await project.scrollIntoViewIfNeeded();
  const flc = page.frameLocator('iframe[title^="FLC"]');
  await expect(flc.locator("h1")).toContainText("extraordinary");
  await expect(flc.locator(".brand-intro")).toHaveCount(0, { timeout: 15000 });
  expect(
    await flc
      .locator("html")
      .evaluate(() => ({ width: innerWidth, height: innerHeight })),
  ).toEqual({ width: 1920, height: 1080 });
  await expect(flc.locator(".logo svg")).toBeVisible();
  await page.screenshot({ path: "test-results/flc-desktop.png" });
  const palette = flc.getByRole("button", { name: "Espresso color palette" });
  const accent = () => flc.locator("html").evaluate(el => getComputedStyle(el).getPropertyValue("--accent").trim());
  await expect.poll(accent).toBe("#d6c19a");
  await palette.click();
  await expect.poll(accent).toBe("#c57936");
  await expect(flc.locator('link[href="/previews/flc/themes/original.css"]')).toHaveAttribute("media", "all");
  await palette.click();
  await expect.poll(accent).toBe("#d6c19a");
  await flc
    .getByRole("link", { name: "Explore the collection", exact: true })
    .click();
  await flc
    .getByRole("combobox", { name: "Vehicle make", exact: true })
    .selectOption("Porsche");
  await expect(flc.locator(".cars > .car")).toHaveCount(1);
  const pricing = flc.locator(".car-info .pricing-enquiry");
  await expect(pricing).toHaveText("Contact dealer for pricing");
  expect(await pricing.evaluate(el => el.getBoundingClientRect().top >= el.previousElementSibling!.getBoundingClientRect().bottom)).toBe(true);
  await expect(flc.locator("body")).not.toContainText(/\$[\d,]+/);
  await flc
    .getByRole("button", { name: "View 2024 Porsche 911", exact: true })
    .click();
  await expect(flc.locator("h1")).toContainText("Porsche");
  await expect.poll(() => flc.locator("html").evaluate(() => location.pathname)).toMatch(/\/previews\/flc\/inventory\/porsche-911\/?$/);
  await project.getByRole("button", { name: "Mobile", exact: true }).click();
  await expect
    .poll(() => flc.locator("html").evaluate(() => innerWidth))
    .toBe(390);
  await flc.getByRole("button", { name: "Open full menu", exact: true }).click();
  await expect(
    flc.getByRole("navigation", { name: "All pages" }),
  ).toBeVisible();
  await page.screenshot({ path: "test-results/flc-mobile.png" });
  expect(errors).toEqual([]);
});

test("FLC exported subpages support direct navigation and refresh", async ({ page }) => {
  for (const route of ["inventory", "inventory/porsche-911", "services/appointment", "account", "brands/porsche"]) {
    const response = await page.goto(`/previews/flc/${route}/`);
    expect(response?.status()).toBe(200);
    await expect(page.locator("h1").first()).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  }
});

test("FLC full page uses prefixed local video, frame and font assets", async ({
  page,
  request,
}) => {
  await page.goto("/previews/flc/");
  await expect(page.locator(".brand-intro")).toHaveCount(0, { timeout: 15000 });
  const video = page.locator(".hero-motion video");
  await expect(video).toHaveAttribute(
    "src",
    "/previews/flc/images/hero-2-test.mp4",
  );
  await expect
    .poll(() => video.evaluate((el: HTMLVideoElement) => el.readyState), {
      timeout: 15000,
    })
    .toBeGreaterThanOrEqual(2);
  const frame = await request.get(
    "/previews/flc/images/porsche-frames/frame-000.jpg",
  );
  expect(frame.status()).toBe(200);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    /noindex/,
  );
});
