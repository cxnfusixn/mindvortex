import { test, expect } from "@playwright/test";
import nodemailer from "nodemailer";
import { createContactEmail } from "../src/lib/contact-email";

const sample = {
  name: "Anna Kowalska",
  email: "anna@example.com",
  service: "identity" as const,
  message:
    "Cześć Patryk!\n\nPracujemy nad nową marką i szukamy kogoś, kto połączy identyfikację wizualną z dopracowaną stroną internetową.\n\nChętnie porozmawiam o zakresie projektu i możliwym terminie.\nPozdrawiam,\nAnna",
};

for (const width of [360, 800]) {
  test(`email template is readable at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1100 });
    const email = createContactEmail(sample, new Date("2026-09-06T12:00:00Z"));
    await page.setContent(email.html);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "NOWYPROJEKT_",
    );
    await expect(
      page.getByText("Identyfikacja wizualna", { exact: true }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBeTruthy();
    await expect(
      page.getByRole("link", { name: /odpowiedz_na_projekt/ }),
    ).toHaveAttribute("href", /^mailto:anna%40example\.com\?subject=/);
    await page.screenshot({
      path: `test-results/contact-email-${width}.png`,
      fullPage: true,
    });
  });
}

test("visitor content remains text and cannot inject email HTML", async ({
  page,
}) => {
  const message =
    '<img src=x onerror="window.hacked=true">\n<script>window.hacked=true</script>\n' +
    "longword".repeat(80);
  const email = createContactEmail({
    ...sample,
    name: "Anna <Admin> & Co",
    message,
  });
  await page.setViewportSize({ width: 360, height: 800 });
  await page.setContent(email.html);
  expect(email.text).toContain(message);
  await expect(page.locator("img, script")).toHaveCount(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  expect(email.html).toContain("Anna &lt;Admin&gt; &amp; Co");
});

test("email has both HTML and plain-text MIME parts without sending mail", async () => {
  const transport = nodemailer.createTransport({
    streamTransport: true,
    buffer: true,
  });
  const result = await transport.sendMail({
    from: "studio@example.com",
    to: "owner@example.com",
    replyTo: sample.email,
    ...createContactEmail(sample),
  });
  const mime = result.message.toString();
  expect(mime).toContain("multipart/alternative");
  expect(mime).toContain("text/plain; charset=utf-8");
  expect(mime).toContain("text/html; charset=utf-8");
  expect(mime).toContain("Reply-To: anna@example.com");
});
