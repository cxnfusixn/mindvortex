import { test, expect } from "@playwright/test";
const base = "/previews/marcin-bak";
test.use({ reducedMotion: "reduce" });
test("blog search, pagination and article reload preserve preview path", async ({
  page,
}) => {
  await page.goto(base + "/blog/");
  await expect(page.locator(".pub-pagination")).toContainText("1 /");
  await page.locator(".pub-pagination").getByText("Następne").click();
  await expect(page.locator(".pub-pagination")).toContainText("2 /");
  await page.locator("input[name=q]").fill("sandbag");
  await page.getByRole("button", { name: "Szukaj", exact: true }).click();
  await expect(page.locator(".pub-card").first()).toBeVisible();
  const link = page.locator(".pub-card a").first();
  await link.click();
  await page.reload();
  expect(new URL(page.url()).pathname).toMatch(
    /^\/previews\/marcin-bak\/blog\/.+/,
  );
  await expect(page.locator("h1")).toContainText(/sandbag/i);
});
test("contact is a browser-only demo", async ({ page }) => {
  const writes: string[] = [];
  page.on("request", (r) => {
    if (r.method() === "POST" || /\/api\//.test(r.url())) writes.push(r.url());
  });
  await page.goto(base + "/kontakt/");
  await page.locator("input[name=name]").fill("Portfolio Test");
  await page.locator("input[name=replyTo]").fill("preview@example.test");
  await page
    .locator("textarea[name=message]")
    .fill("Test demonstracyjny formularza kontaktowego.");
  await page.locator("form button[type=submit]").click();
  await expect(page.getByRole("status")).toContainText(
    "nie zostało wysłane ani zapisane",
  );
  expect(writes).toEqual([]);
});
test("gallery, references pagination and English version work", async ({
  page,
}) => {
  await page.goto(base + "/galeria/");
  await page.locator(".photo-tile").first().click();
  await expect(page.locator("dialog[open]")).toBeVisible();
  await page.keyboard.press("ArrowRight");
  await expect(page.locator("dialog[open] .photo-dialog-bar")).toContainText(
    "2 /",
  );
  await page.keyboard.press("Escape");
  await expect(page.locator("dialog[open]")).toHaveCount(0);
  await page.goto(base + "/referencje/");
  await page.locator(".references-pagination").getByText("Następne").click();
  await expect(page.locator(".references-pagination")).toContainText(
    "Strona 2",
  );
  await page.reload();
  await expect(page.locator(".references-pagination")).toContainText(
    "Strona 2",
  );
  await page.goto(base + "/en/");
  await expect(page.locator("h1")).toContainText(/PERSONAL TRAINING/);
});
for (const width of [390, 1440])
  test(`responsive preview at ${width}px`, async ({ page }, info) => {
    await page.setViewportSize({ width, height: 900 });
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(base + "/");
    await expect(page.locator("h1")).toBeVisible();
    await page.waitForTimeout(1200);
    await page.screenshot({ path: info.outputPath("homepage.png") });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    ).toBe(true);
    await page.goto(base + "/blog/");
    await expect(page.locator(".pub-card").first()).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    ).toBe(true);
    expect(errors).toEqual([]);
  });
