import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";

test("each continuous vortex edge uses one fixed-radius circular arc", async () => {
  const svg = await readFile("brand/vortex-symbol.svg", "utf8");
  const paths = [
    ...svg.matchAll(/<path\s+[^>]*id="(blade-[^"]+)"[^>]*d="([^"]+)"/g),
  ];
  expect(paths).toHaveLength(5);
  for (const [, id, path] of paths) {
    expect(path).not.toMatch(/[CQST]/i);
    const arcs = [...path.matchAll(/A([\d.]+)\s+([\d.]+)/g)];
    // Four edges on the branched upper blade, two on each remaining blade.
    // An extra arc would reintroduce a radius change within a continuous edge.
    expect(arcs).toHaveLength(id === "blade-upper" ? 4 : 2);
    for (const [, rx, ry] of arcs) expect(Number(rx)).toBe(Number(ry));
  }
  const diagram = await readFile("brand/vortex-construction.svg", "utf8");
  expect(diagram.match(/<circle\s/g)).toHaveLength(12);
});

for (const deviceScaleFactor of [1, 2]) {
  test(`galaxy rotates and dissolves pixels with a working pause at DPR ${deviceScaleFactor}`, async ({
    browser,
    baseURL,
  }) => {
    const context = await browser.newContext({
      baseURL,
      viewport: { width: 1440, height: 1000 },
      deviceScaleFactor,
    });
    const page = await context.newPage();
    await page.addInitScript(() => sessionStorage.setItem("mv-intro", "1"));
    await page.goto("/en");
    const galaxy = page.locator(".galaxy-vortex");
    const rotor = galaxy.locator(".galaxy-rotor");
    await expect(galaxy).toHaveAttribute("data-motion", "running");
    await expect(page.locator(".hero-symbol .orbit")).toHaveCount(0);
    const scale = () =>
      rotor.evaluate((el) => {
        const matrix = (
          el as SVGGraphicsElement
        ).transform.baseVal.consolidate()!.matrix;
        return Math.hypot(matrix.a, matrix.b);
      });
    const initialScale = await scale();
    const initial = await rotor.getAttribute("transform");
    await expect.poll(() => rotor.getAttribute("transform")).not.toBe(initial);
    await expect
      .poll(
        () =>
          galaxy
            .locator("rect")
            .first()
            .evaluate((el) => Number(getComputedStyle(el).opacity)),
        { timeout: 10000 },
      )
      .toBeLessThan(0.7);
    await expect.poll(scale).toBeGreaterThan(initialScale + 0.01);
    await page.getByRole("button", { name: "Pause vortex animation" }).click();
    await expect(galaxy).toHaveAttribute("data-motion", "paused");
    const stopped = await rotor.getAttribute("transform");
    await page.waitForTimeout(300);
    expect(await rotor.getAttribute("transform")).toBe(stopped);
    await page.screenshot({
      path: `test-results/vortex-dpr-${deviceScaleFactor}.png`,
    });
    await page.getByRole("button", { name: "Resume vortex animation" }).click();
    await expect.poll(() => rotor.getAttribute("transform")).not.toBe(stopped);
    await page.locator("#contact").evaluate((el) => el.scrollIntoView());
    await expect(galaxy).toHaveAttribute("data-motion", "paused");
    await context.close();
  });
}

test("galaxy is static with reduced motion on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/pl");
  const galaxy = page.locator(".galaxy-vortex");
  await expect(galaxy).toHaveAttribute("data-motion", "reduced");
  await expect(galaxy.locator("button")).toBeHidden();
  expect(
    await galaxy.locator(".galaxy-rotor").getAttribute("transform"),
  ).toBeNull();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
});
