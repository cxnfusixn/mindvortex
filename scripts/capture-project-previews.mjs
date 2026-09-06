import { chromium } from "@playwright/test";
import sharp from "sharp";
import { mkdir } from "node:fs/promises";

// Run the sibling projects locally on these ports before refreshing the previews.
const sources = [
  { slug: "kierunek", url: "http://127.0.0.1:3111", detail: "#badania" },
  {
    slug: "marcin-bak",
    url: "http://127.0.0.1:3112",
    detail: "#scena-trening-sekcje",
  },
];
const browser = await chromium.launch();
try {
  for (const source of sources) {
    const directory = `public/work/${source.slug}`;
    await mkdir(directory, { recursive: true });
    for (const mobile of [false, true]) {
      const page = await browser.newPage({
        viewport: mobile
          ? { width: 390, height: 844 }
          : { width: 1440, height: 1000 },
        reducedMotion: "reduce",
      });
      await page.goto(source.url, {
        waitUntil: "networkidle",
        timeout: 120000,
      });
      await page.evaluate(() => document.fonts.ready);
      await page.addStyleTag({
        content: "nextjs-portal { display: none !important; }",
      });
      await page.waitForTimeout(2500);
      const save = async (name) =>
        sharp(await page.screenshot())
          .webp({ quality: 86 })
          .toFile(`${directory}/${name}.webp`);
      await save(mobile ? "mobile" : "desktop");
      if (!mobile) {
        await page.locator(source.detail).evaluate((el) => el.scrollIntoView());
        await page.waitForTimeout(1800);
        await save("detail");
      }
      await page.close();
    }
    console.log(`Captured ${source.slug}`);
  }
} finally {
  await browser.close();
}
