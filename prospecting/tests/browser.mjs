import { chromium } from "playwright";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
const origin = process.env.PROSPECTING_TEST_ORIGIN,
  password = process.env.PROSPECTING_TEST_PASSWORD;
if (!origin || !password) throw Error("Provide test origin and password.");
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
try {
  await page.goto(origin + "/prospecting");
  await page.getByLabel("Hasło do modułu").waitFor();
  assert.equal(
    (await page.request.get(origin + "/prospecting/api")).status(),
    401,
  );
  const cross = await page.request.post(origin + "/prospecting/api", {
    headers: { Origin: "https://example.org" },
    data: { action: "discover" },
  });
  assert.equal(cross.status(), 403);
  await page.getByLabel("Hasło do modułu").fill(password);
  await page.getByRole("button", { name: "Otwórz panel" }).click();
  await page
    .getByRole("heading", { name: "Znajdź kolejną współpracę." })
    .waitFor();
  await page.getByRole("button", { name: "Dodaj firmę" }).click();
  await page
    .getByLabel("Nazwa firmy", { exact: true })
    .fill("QA — test prospectingu");
  await page
    .getByLabel("Adres strony", { exact: true })
    .fill("https://qa-prospecting.example.com");
  await page.getByLabel("E-mail kontaktowy").fill("qa@example.com");
  await page.getByRole("button", { name: "Zapisz firmę", exact: true }).click();
  await page.getByRole("button", { name: /QA — test prospectingu/ }).click();
  await page.getByLabel("E-mail odbiorcy").fill("contact@example.com");
  await page.getByRole("button", { name: "Zapisz kontakt", exact: true }).click();
  await page.getByText("Zapisano.", { exact: true }).waitFor();
  assert.equal(await page.getByText("Zgoda na kontakt handlowy", { exact: true }).count(), 0);
  await page.getByRole("button", { name: "Zleć audyt strony" }).click();
  await page.getByText("Zapisano.", { exact: true }).waitFor();
  await page.getByRole("button", { name: "Zamknij szczegóły" }).click();
  await mkdir("qa/prospecting", { recursive: true });
  for (const width of [1440, 1024, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
      `overflow ${width}`,
    );
    await page.screenshot({
      path: `qa/prospecting/panel-${width}.png`,
      fullPage: true,
    });
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page
    .getByRole("button", { name: "Automatyzacja", exact: false })
    .first()
    .click();
  await page.getByLabel("Maksymalnie analiz na dobę").fill("4");
  await page.getByRole("button", { name: "Zapisz ustawienia" }).click();
  await page.getByText("Zapisano.", { exact: true }).waitFor();
  await page.screenshot({
    path: "qa/prospecting/settings.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Firmy i propozycje" }).click();
  await page.getByRole("button", { name: /QA — test prospectingu/ }).click();
  await page
    .getByRole("button", { name: "Wyłącz firmę z automatyzacji" })
    .click();
  await page.getByText("Zapisano.", { exact: true }).waitFor();
  const snapshot = await (
    await page.request.get(origin + "/prospecting/api")
  ).json();
  assert.equal(
    snapshot.leads.find((l) => l.name === "QA — test prospectingu").status,
    "suppressed",
  );
  await page.getByRole("button", { name: "Wyloguj się" }).click();
  await page.getByLabel("Hasło do modułu").waitFor();
  assert.equal(
    (await page.request.get(origin + "/prospecting/api")).status(),
    401,
  );
  assert.deepEqual(errors, []);
  console.log(
    "Browser: login, CSRF, add, queue, settings, suppression, logout and five viewport widths passed.",
  );
} finally {
  await browser.close();
}
