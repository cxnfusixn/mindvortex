import {
  cp,
  mkdir,
  readFile,
  writeFile,
  readdir,
  symlink,
  rm,
} from "node:fs/promises";
import path from "node:path";
import { homedir } from "node:os";
import { spawn } from "node:child_process";

const root = process.cwd();
const selected = process.argv[2];
const projects = [
  {
    id: "kierunek",
    folder: "kierunek-centrum-psychologiczne",
    app: "src/app",
    dirs: ["src", "public"],
    configs: ["postcss.config.mjs", "tsconfig.json", "package.json"],
  },
  {
    id: "marcin-bak",
    folder: "marcin-bak",
    app: "app",
    dirs: ["app", "components", "public"],
    configs: [
      "postcss.config.mjs",
      "tailwind.config.ts",
      "tsconfig.json",
      "package.json",
    ],
  },
  {
    id: "flc",
    folder: path.join(homedir(), "Documents", "ChatGPT", "flc"),
    app: "app",
    dirs: ["app", "public"],
    configs: ["tsconfig.json", "package.json"],
  },
].filter((p) => !selected || p.id === selected);

async function walk(directory) {
  const result = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) result.push(...(await walk(file)));
    else result.push(file);
  }
  return result;
}

for (const project of projects) {
  const source =
    selected && process.argv[3]
      ? path.resolve(process.argv[3])
      : path.resolve(root, "..", project.folder);
  // Always build from a clean snapshot, including files removed in the source app.
  const target = path.join(
    root,
    ".preview-build",
    `${project.id}-${Date.now()}`,
  );
  const base = `/previews/${project.id}`;
  await mkdir(target, { recursive: true });
  for (const directory of project.dirs) {
    await cp(path.join(source, directory), path.join(target, directory), {
      recursive: true,
      filter: (file) =>
        !/[\\/](api|studio)[\\/]?/.test(file) &&
        !/[\\/](sitemap|robots)\.ts$/.test(file),
    });
  }
  for (const file of project.configs)
    await cp(path.join(source, file), path.join(target, file));
  try {
    await symlink(
      path.join(source, "node_modules"),
      path.join(target, "node_modules"),
      "junction",
    );
  } catch (error) {
    if (error.code !== "EEXIST") throw error;
  }
  await writeFile(
    path.join(target, "next.config.ts"),
    `export default { output: "export", basePath: "${base}", trailingSlash: true, images: { unoptimized: true }, ${project.id === "marcin-bak" ? "eslint: { ignoreDuringBuilds: true }," : ""} };`,
  );

  for (const directory of project.dirs.filter((d) => d !== "public" || project.id === "flc")) {
    for (const file of await walk(path.join(target, directory))) {
      if (!/\.(tsx?|css)$/.test(file)) continue;
      let text = await readFile(file, "utf8");
      text = text.replace(/(["'`(])\/(images|videos)\//g, `$1${base}/$2/`);
      if (project.id === "flc") {
        text = text.replace(/action="\/inventory"/g, `action="${base}/inventory"`);
        text = text.replace(/(["'`(])\/themes\//g, `$1${base}/themes/`);
        text = text.replace(
          /(["'])\/(flc-[^"']+\.svg|logo\.svg)/g,
          `$1${base}/$2`,
        );
      }
      await writeFile(file, text);
    }
  }

  if (project.id === "kierunek") {
    // Read only public CMS configuration; never copy credentials into the export.
    const envText = await readFile(
      path.join(source, ".env.local"),
      "utf8",
    ).catch(() => "");
    const publicValue = (name) =>
      envText.match(new RegExp(`^${name}=["']?([^"'\\r\\n]+)`, "m"))?.[1];
    const projectId = publicValue("NEXT_PUBLIC_SANITY_PROJECT_ID");
    let homeImport = "defaultHomeContent";
    if (projectId) {
      const dataset = publicValue("NEXT_PUBLIC_SANITY_DATASET") || "production";
      const query =
        '*[_id == "homePage"][0] { ..., hero { ..., "imageUrl": image.asset->url }, about { ..., "imageUrl": image.asset->url }, twilight { ..., "imageUrl": image.asset->url } }';
      const response = await fetch(
        `https://${projectId}.api.sanity.io/v2026-08-01/data/query/${dataset}?perspective=published&query=${encodeURIComponent(query)}`,
      );
      if (!response.ok) throw new Error("Cannot capture published CMS content");
      const { result } = await response.json();
      if (result) {
        const assets = path.join(target, "public/images/preview-cms");
        await mkdir(assets, { recursive: true });
        for (const section of ["hero", "about", "twilight"]) {
          const url = result[section]?.imageUrl;
          if (!url) continue;
          const image = await fetch(url);
          if (!image.ok) throw new Error("Cannot capture CMS image");
          const filename = `${section}${path.extname(new URL(url).pathname)}`;
          await writeFile(
            path.join(assets, filename),
            Buffer.from(await image.arrayBuffer()),
          );
          result[section].imageUrl = `${base}/images/preview-cms/${filename}`;
        }
        await writeFile(
          path.join(target, "src/data/preview-home.json"),
          JSON.stringify(result),
        );
        homeImport = "previewHome";
      }
    }
    await writeFile(
      path.join(target, "src/sanity/lib/fetch.ts"),
      `import { blogPosts, getPostBySlug } from "@/data/blog"; import { defaultHomeContent } from "@/data/home"; ${homeImport === "previewHome" ? 'import previewHome from "@/data/preview-home.json";' : ""} export async function getPosts(){return blogPosts;} export async function getHomeContent(){return ${homeImport};} export async function getPost(slug:string){return getPostBySlug(slug);}`,
    );
    const article = path.join(target, "src/app/blog/[slug]/page.tsx");
    await writeFile(
      article,
      (await readFile(article, "utf8")) +
        '\nexport async function generateStaticParams(){ const {blogPosts}=await import("@/data/blog"); return blogPosts.map(post=>({slug:post.slug})); }\n',
    );
    const service = path.join(target, "src/lib/contact-service.ts");
    const text = await readFile(service, "utf8");
    await writeFile(
      service,
      text.slice(0, text.indexOf("export async function")) +
        "export async function submitContactForm(_payload: ContactPayload): Promise<void> { return; }",
    );
    const form = path.join(
      target,
      "src/components/sections/appointment-form.tsx",
    );
    let formText = await readFile(form, "utf8");
    formText = formText.replace(
      "<form",
      '<p role="note" className="mb-6 text-sm">Wersja demonstracyjna portfolio — formularz nie wysyła zgłoszeń.</p><form',
    );
    formText = formText.replace(
      "Zgłoszenie zostało poprawnie wysłane.",
      "Formularz sprawdzony. To demonstracja — zgłoszenie nie zostało wysłane.",
    );
    await writeFile(form, formText);
  }

  if (project.id === "flc") {
    const globals = path.join(target, "app/globals.css");
    let css = await readFile(globals, "utf8");
    const imports = [
      ...css.matchAll(
        /@import url\(['"](https:\/\/fonts\.googleapis\.com\/[^'"]+)['"]\);/g,
      ),
    ];
    await mkdir(path.join(target, "public/fonts"), { recursive: true });
    let fontIndex = 0;
    for (const match of imports) {
      const response = await fetch(match[1], {
        headers: { "User-Agent": "Mozilla/5.0 Chrome/125.0.0.0 Safari/537.36" },
      });
      if (!response.ok) throw new Error("Cannot capture FLC font styles");
      let fonts = await response.text();
      for (const url of new Set(
        [
          ...fonts.matchAll(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/g),
        ].map((m) => m[1]),
      )) {
        const font = await fetch(url);
        if (!font.ok) throw new Error("Cannot capture FLC font file");
        const filename = `font-${fontIndex++}${path.extname(new URL(url).pathname)}`;
        await writeFile(
          path.join(target, "public/fonts", filename),
          Buffer.from(await font.arrayBuffer()),
        );
        fonts = fonts.replaceAll(url, `${base}/fonts/${filename}`);
      }
      css = css.replace(match[0], fonts);
    }
    await writeFile(globals, css);
  } else {
    // Preserve original font CSS from the local app's compiled output, without Google fetches.
    const staticDirectory = path.join(source, ".next/static");
    const cssFiles = (await walk(staticDirectory)).filter((f) =>
      f.endsWith(".css"),
    );
    let fontCss = "";
    for (const file of cssFiles) {
      const css = await readFile(file, "utf8");
      for (const match of css.matchAll(/@font-face\s*\{[^}]+\}/g))
        fontCss += match[0] + "\n";
    }
    fontCss = fontCss.replace(
      /(?:\.\.\/media\/|\/_next\/static\/media\/)/g,
      `${base}/fonts/`,
    );
    await mkdir(path.join(target, "public/fonts"), { recursive: true });
    const media = path.join(source, ".next/static/media");
    for (const file of await readdir(media))
      if (/\.woff2?$/.test(file))
        await cp(
          path.join(media, file),
          path.join(target, "public/fonts", file),
        );
    const layout = path.join(target, project.app, "layout.tsx");
    let layoutText = await readFile(layout, "utf8");
    layoutText = layoutText.replace(
      /import \{[^}]+\} from "next\/font\/google";\s*/g,
      "",
    );
    layoutText = layoutText.replace(
      /const (display|body|bebas|inter) = [\s\S]*?\}\);/g,
      'const $1 = { variable: "" };',
    );
    layoutText = layoutText.replace(
      /export const metadata: Metadata = \{/,
      "export const metadata: Metadata = { robots: { index: false, follow: false },",
    );
    await writeFile(layout, layoutText);
    const globals = path.join(target, project.app, "globals.css");
    const variables =
      project.id === "kierunek"
        ? ':root { --font-display: "Cormorant Garamond"; --font-body: "Manrope"; }'
        : ':root { --font-bebas: "Bebas Neue"; --font-inter: "Inter"; }';
    await writeFile(
      globals,
      (await readFile(globals, "utf8")) + "\n" + fontCss + variables,
    );
  }
  console.log(`Building live preview: ${project.id}`);
  await new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      [
        path.join(source, "node_modules/next/dist/bin/next"),
        "build",
        ...(project.id !== "marcin-bak" ? ["--webpack"] : []),
      ],
      { cwd: target, stdio: "inherit" },
    );
    child.on("exit", (code) =>
      code === 0
        ? resolve()
        : reject(new Error(`Build failed: ${project.id} (${code})`)),
    );
  });
  const previewRoot = path.resolve(root, "public", "previews");
  const destination = path.resolve(previewRoot, project.id);
  if (path.dirname(destination) !== previewRoot)
    throw new Error(
      "Preview destination must be a direct child of public/previews",
    );
  // Replace only this generated preview after a successful build.
  await rm(destination, { recursive: true, force: true });
  await cp(path.join(target, "out"), destination, { recursive: true });
  console.log(`Exported ${base}/index.html`);
}
