import { test, expect } from "@playwright/test";

for (const locale of ["pl", "en"]) {
  test(`contact form handles delivery and failure in ${locale}`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(`/${locale}`);
    const form = page.locator("#project-form");
    const detailsBox = await page.locator(".contact-details").boundingBox();
    const formBox = await form.boundingBox();
    expect(formBox!.x).toBeGreaterThan(detailsBox!.x);
    const links = await page.locator(".contact-details .social-links a").all();
    expect((await links[0].boundingBox())!.y).toBeCloseTo(
      (await links[1].boundingBox())!.y,
      0,
    );
    await form.locator('[name="name"]').fill("Patryk Test");
    await form.locator('[name="email"]').fill("visitor@example.com");
    await form
      .locator('[name="message"]')
      .fill("A new website project with a clear visual identity.");
    await page.route("**/api/contact", (route) =>
      route.fulfill({ status: 503, json: { ok: false } }),
    );
    await form.getByRole("button", { name: /wyślij|send_message/ }).click();
    await expect(form.getByRole("status")).toContainText(
      /niedostępny|unavailable/,
    );
    await expect(form.locator('[name="message"]')).not.toBeEmpty();
    await page.route("**/api/contact", (route) =>
      route.fulfill({ status: 200, json: { ok: true } }),
    );
    await form.getByRole("button", { name: /wyślij|send_message/ }).click();
    await expect(form.getByRole("status")).toContainText(
      /Wiadomość wysłana|Message sent/,
    );
    await expect(form.locator('[name="message"]')).toBeEmpty();
    await expect(page.locator("#contact")).not.toContainText("GitHub");
    await page.screenshot({ path: `test-results/contact-form-${locale}.png` });
  });
}

test("contact API rejects invalid input and foreign origins", async ({
  request,
}) => {
  const invalid = await request.post("/api/contact", { data: { name: "x" } });
  expect(invalid.status()).toBe(400);
  const crossOrigin = await request.post("/api/contact", {
    headers: { origin: "https://unrelated.example" },
    data: {},
  });
  expect(crossOrigin.status()).toBe(403);
  const oversized = await request.post("/api/contact", {
    data: { message: "a".repeat(17000) },
  });
  expect(oversized.status()).toBe(413);
});
