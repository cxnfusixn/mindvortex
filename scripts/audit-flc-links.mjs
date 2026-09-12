import { chromium, request } from "@playwright/test";
import { readdir, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const origin = process.argv[2] || "https://mindvortex.pro";
const project = process.argv[3] || "flc";
if (!["flc", "marcin-bak"].includes(project))
  throw new Error("Unknown preview");
const prefix = "/previews/" + project;
async function routes(dir, relative = "") {
  const found = [];
  for (const item of await readdir(dir, { withFileTypes: true })) {
    if (
      item.isDirectory() &&
      !["_next", "images", "fonts", "themes", "404"].includes(item.name)
    )
      found.push(
        ...(await routes(
          path.join(dir, item.name),
          `${relative}${item.name}/`,
        )),
      );
    else if (item.name === "index.html") found.push(`${prefix}/${relative}`);
  }
  return found;
}
const pages = await routes("public/previews/" + project);
const browser = await chromium.launch();
const api = await request.newContext();
const destinations = new Set();
const external = new Set();
const missingPrefix = [],
  badPages = [],
  badDestinations = [],
  missingFragments = [];
let cursor = 0,
  done = 0,
  linkCount = 0;
await Promise.all(
  Array.from({ length: 4 }, async () => {
    const parser = await browser.newPage();
    while (cursor < pages.length) {
      const route = pages[cursor++];
      const response = await api.get(origin + route);
      if (response.status() !== 200) {
        badPages.push({ route, status: response.status() });
        continue;
      }
      const links = await parser.evaluate(
        (html) => {
          const doc = new DOMParser().parseFromString(html, "text/html");
          return [...doc.querySelectorAll("a[href],form[action]")].map((el) => {
            const href = el.getAttribute(
              el.tagName === "FORM" ? "action" : "href",
            );
            return {
              href,
              text: el.textContent.trim().slice(0, 90),
              missingFragment:
                href?.startsWith("#") &&
                href.length > 1 &&
                !doc.getElementById(decodeURIComponent(href.slice(1))),
            };
          });
        },
        await response.text(),
      );
      for (const link of links) {
        linkCount++;
        if (link.missingFragment) missingFragments.push({ route, ...link });
        const url = new URL(link.href, origin + route);
        if (!["http:", "https:"].includes(url.protocol)) continue;
        if (url.origin !== new URL(origin).origin) {
          external.add(url.href);
          continue;
        }
        if (url.pathname !== prefix && !url.pathname.startsWith(prefix + "/"))
          missingPrefix.push({ route, ...link, target: url.href });
        url.hash = "";
        destinations.add(url.href);
      }
      if (++done % 40 === 0)
        console.log(`Audited ${done}/${pages.length} pages`);
    }
    await parser.close();
  }),
);
const urls = [...destinations];
cursor = 0;
await Promise.all(
  Array.from({ length: 6 }, async () => {
    while (cursor < urls.length) {
      const url = urls[cursor++];
      try {
        const response = await api.get(url);
        if (response.status() !== 200)
          badDestinations.push({ url, status: response.status() });
      } catch (error) {
        badDestinations.push({ url, error: error.message });
      }
    }
  }),
);
const report = {
  target: origin + prefix + "/",
  timestamp: new Date().toISOString(),
  scope:
    "All exported preview HTML pages, internal anchors and GET form destinations; external links inventoried only",
  pages: pages.length,
  links: linkCount,
  uniqueInternalDestinations: destinations.size,
  missingPrefix,
  badPages,
  badDestinations,
  missingFragments,
  external: [...external],
};
await mkdir("test-results", { recursive: true });
await writeFile(
  `test-results/${project}-link-audit.json`,
  JSON.stringify(report, null, 2),
);
console.log(JSON.stringify({ ...report, external: external.size }, null, 2));
await api.dispose();
await browser.close();
if (
  missingPrefix.length ||
  badPages.length ||
  badDestinations.length ||
  missingFragments.length
)
  process.exitCode = 1;
