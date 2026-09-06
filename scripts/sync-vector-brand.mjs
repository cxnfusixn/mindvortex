import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = fileURLToPath(new URL("../", import.meta.url));
const master = await readFile(
  path.join(root, "brand/vortex-symbol.svg"),
  "utf8",
);
const symbolGroup = master.match(/<g id="symbol">[\s\S]*?<\/g>/)?.[0];
if (!symbolGroup) throw new Error("Missing canonical symbol group");
const lockupPath = path.join(root, "public/brand/mv-logo.svg");
const lockup = await readFile(lockupPath, "utf8");
if (!/<g id="symbol">[\s\S]*?<\/g>/.test(lockup))
  throw new Error("Missing lockup symbol group");
await writeFile(
  lockupPath,
  lockup.replace(/<g id="symbol">[\s\S]*?<\/g>/, symbolGroup),
);
await writeFile(path.join(root, "public/brand/mv-symbol.svg"), master);
await writeFile(path.join(root, "src/app/icon.svg"), master);
const geometry = [...symbolGroup.matchAll(/<(path|rect)\s+([^>]+)\/>/g)].map(
  (match) => {
    const attributes = Object.fromEntries(
      [...match[2].matchAll(/([\w-]+)="([^"]*)"/g)].map((attribute) => [
        attribute[1] === "shape-rendering" ? "shapeRendering" : attribute[1],
        attribute[2],
      ]),
    );
    return { tag: match[1], attributes };
  },
);
if (!geometry.length) throw new Error("No inline vector geometry found");
await writeFile(
  path.join(root, "src/components/vortex/geometry.ts"),
  "// Generated from brand/vortex-symbol.svg by scripts/sync-vector-brand.mjs.\nexport const vortexGeometry = " +
    JSON.stringify(geometry, null, 2) +
    " as const;\n",
);
console.log(
  "Updated symbol, complete lockup and favicon from canonical vector geometry.",
);
