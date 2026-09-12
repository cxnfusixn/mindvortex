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
import { spawn } from "node:child_process";

async function walk(dir) {
  const files = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) files.push(...(await walk(p)));
    else files.push(p);
  }
  return files;
}
export async function buildMarcinPreview(sourceOverride) {
  const root = process.cwd(),
    source = path.resolve(sourceOverride || path.join(root, "../marcin-bak"));
  const target = path.join(root, ".preview-build", `marcin-bak-${Date.now()}`),
    base = "/previews/marcin-bak",
    origin = process.env.MARCIN_PREVIEW_SOURCE_URL || "http://127.0.0.1:3000";
  await mkdir(target, { recursive: true });
  await cp(path.join(source, "app/(frontend)"), path.join(target, "app"), {
    recursive: true,
    filter: (f) => !/[\\/](studio|api|podglad)([\\/]|$)/.test(f),
  });
  await cp(path.join(source, "components"), path.join(target, "components"), {
    recursive: true,
    filter: (f) => !f.endsWith("visual-editor.tsx"),
  });
  await cp(path.join(source, "public"), path.join(target, "public"), {
    recursive: true,
  });
  await mkdir(path.join(target, "cms"), { recursive: true });
  for (const f of [
    "defaults.ts",
    "map-content.ts",
    "visual-model.ts",
    "payload-types.ts",
    "english-content.ts",
    "english-copy.json",
  ])
    await cp(path.join(source, "cms", f), path.join(target, "cms", f));
  for (const f of [
    "package.json",
    "tsconfig.json",
    "tailwind.config.ts",
    "postcss.config.mjs",
  ])
    await cp(path.join(source, f), path.join(target, f));
  await symlink(
    path.join(source, "node_modules"),
    path.join(target, "node_modules"),
    "junction",
  );
  const get = async (p) => {
    const r = await fetch(origin + p);
    if (!r.ok) throw Error(`Public content unavailable: ${p} (${r.status})`);
    return r.json();
  };
  const fixture = {};
  // Capture only public editorial collections. Never read env, accounts, inquiries or database files.
  for (const collection of [
    "posts",
    "pages",
    "training-offers",
    "categories",
    "tags",
  ]) {
    const docs = [];
    let page = 1,
      last = 1;
    do {
      const r = await get(
        `/api/${collection}?depth=2&limit=100&page=${page}${["posts", "pages", "training-offers"].includes(collection) ? "&where[_status][equals]=published" : ""}`,
      );
      docs.push(...r.docs);
      last = r.totalPages;
      page++;
    } while (page <= last);
    fixture[collection] = docs;
  }
  const html = await (await fetch(origin)).text();
  const flight = [
    ...html.matchAll(/self\.__next_f\.push\(\[1,("(?:[^"\\]|\\.)*")\]\)/g),
  ]
    .map((m) => JSON.parse(m[1]))
    .join("");
  const rows = new Map();
  for (const line of flight.split("\n")) {
    const split = line.indexOf(":");
    try {
      rows.set(line.slice(0, split), JSON.parse(line.slice(split + 1)));
    } catch {}
  }
  function resolveFlight(v) {
    if (typeof v === "string" && /^\$[0-9a-f]+(?::|$)/.test(v)) {
      const [id, ...keys] = v.slice(1).split(":");
      let found = rows.get(id);
      for (const key of keys) {
        if (key === "props" && Array.isArray(found) && found[0] === "$")
          found = found[3];
        else found = found?.[key];
      }
      if (found !== undefined) return resolveFlight(found);
    }
    if (Array.isArray(v)) return v.map(resolveFlight);
    if (v && typeof v === "object")
      return Object.fromEntries(
        Object.entries(v).map(([k, x]) => [k, resolveFlight(x)]),
      );
    return v;
  }
  function findContent(v) {
    if (!v || typeof v !== "object") return null;
    if (v.content?.scenes) return v.content;
    for (const x of Object.values(v)) {
      const found = findContent(x);
      if (found) return found;
    }
    return null;
  }
  for (const row of rows.values()) {
    const content = findContent(row);
    if (content) {
      fixture.site = resolveFlight(content);
      break;
    }
  }
  if (!fixture.site) throw Error("Public homepage content missing");
  const media = new Map();
  async function localize(value) {
    if (Array.isArray(value)) return Promise.all(value.map(localize));
    if (value && typeof value === "object") {
      const out = {};
      for (const [k, v] of Object.entries(value)) out[k] = await localize(v);
      return out;
    }
    if (typeof value !== "string") return value;
    const legacyLinks = {
      "/witaminy": "/blog/witamina",
      "/czym-jest-sandbag-czesc-1": "/blog/czym-jest-sandbag-czesc-1-worek",
      "/produkt/sztuki-walki": "/treningi/sporty-walki",
      "/przyjazn-slow-przyjazni": "/blog/przyjazn-kilka-slow-o-przyjazni",
      "/przewrot-w-tyl-metodyka-nauczania": "/blog/przewrot-w-tyl",
      "/street-workout": "/blog/kalistenika",
      "/motywacja": "/blog/motywacja-w-sporcie",
    };
    if (/^https?:\/\/(?:www\.)?marcinbak\.pl\//.test(value)) {
      const u = new URL(value);
      value = u.pathname + u.search + u.hash;
    }
    const legacyKey = value.replace(/\/$/, "");
    if (legacyLinks[legacyKey]) value = legacyLinks[legacyKey];
    if (/^(?:https?:\/\/[^/]+)?\/api\/media\/file\//.test(value)) {
      const url = new URL(value, origin);
      const name = decodeURIComponent(path.posix.basename(url.pathname));
      if (!media.has(name)) {
        const r = await fetch(origin + url.pathname);
        if (!r.ok) throw Error(`Media unavailable: ${name}`);
        await mkdir(path.join(target, "public/media"), { recursive: true });
        await writeFile(
          path.join(target, "public/media", name),
          Buffer.from(await r.arrayBuffer()),
        );
        media.set(name, true);
      }
      return `${base}/media/${encodeURIComponent(name)}`;
    }
    if (
      value.startsWith("/") &&
      !value.startsWith("//") &&
      !value.startsWith(base)
    )
      return base + value;
    if (/^https?:\/\/(?:www\.)?marcinbak\.pl\//.test(value))
      return (
        base +
        new URL(value).pathname +
        new URL(value).search +
        new URL(value).hash
      );
    return value;
  }
  const data = await localize(fixture);
  await writeFile(path.join(target, "cms/fixture.json"), JSON.stringify(data));
  await writeFile(
    path.join(target, "cms/content.ts"),
    `import data from './fixture.json';import type {SiteContent} from './defaults';export async function getSiteContent(){return data.site as unknown as SiteContent;}`,
  );
  await writeFile(
    path.join(target, "cms/publications.ts"),
    `import data from './fixture.json';import type {Payload,Where} from 'payload';
const collections=data as Record<string,any>;
function match(doc:any,w:any):boolean{if(!w)return true;return Object.entries(w).every(([k,v]:[string,any])=>{if(k==='and')return v.every((x:any)=>match(doc,x));if(k==='or')return v.some((x:any)=>match(doc,x));const values=[doc[k]].flat().map((x:any)=>x&&typeof x==='object'?x.id:x);return Object.entries(v).every(([op,val]:[string,any])=>op==='equals'?values.includes(val):op==='not_equals'?!values.includes(val):op==='in'?values.some(x=>val.includes(x)):op==='like'?String(doc[k]||'').toLowerCase().includes(String(val).toLowerCase()):true);});}
export async function cms(){return {find:async({collection,where,limit=12,page=1,sort}:any)=>{let docs=(collections[collection]||[]).filter((d:any)=>match(d,where));if(sort){const desc=sort.startsWith('-'),key=desc?sort.slice(1):sort;docs=[...docs].sort((a:any,b:any)=>String(a[key]??'').localeCompare(String(b[key]??''),undefined,{numeric:true})*(desc?-1:1));}const totalDocs=docs.length,totalPages=Math.max(1,Math.ceil(totalDocs/limit));return {docs:docs.slice((page-1)*limit,page*limit),totalDocs,totalPages,page,hasNextPage:page<totalPages,hasPrevPage:page>1};}} as unknown as Payload;}
export async function publishedItems(collection:'posts'|'pages'|'training-offers',options:{limit?:number;page?:number;where?:Where;sort?:string}={}){return (await cms()).find({collection,limit:options.limit??12,page:options.page??1,where:options.where,sort:options.sort??(collection==='posts'?'-publishedAt':'title')});}
export async function publicDocument(collection:'posts'|'pages'|'training-offers',slug:string){return (await publishedItems(collection,{limit:1,where:{slug:{equals:slug}}})).docs[0];}
export async function redirectTarget(_from:string){return null as string|null;}
`,
  );
  // Prefix every native anchor, including dynamic links and CMS-generated navigation.
  await writeFile(
    path.join(target, "components/preview-anchor.tsx"),
    `import type {ComponentProps} from 'react';export function PreviewAnchor({href,...props}:ComponentProps<'a'>){return <a {...props} href={href?.startsWith('/')&&!href.startsWith('//')&&!href.startsWith('${base}')?'${base}'+href:href}/>;}`,
  );
  for (const file of [
    ...(await walk(path.join(target, "app"))),
    ...(await walk(path.join(target, "components"))),
    ...(await walk(path.join(target, "cms"))),
  ]) {
    if (!/\.(tsx?|css)$/.test(file) || file.endsWith("preview-anchor.tsx"))
      continue;
    let text = await readFile(file, "utf8");
    text = text
      .replace(/(["'\x60(])\/(images|videos)\//g, `$1${base}/$2/`)
      .replace(/export const dynamic\s*=\s*'force-dynamic';/g, "");
    if (file.endsWith(".tsx") && /<a[\s>]/.test(text)) {
      text = text
        .replace(/<a(?=[\s>])/g, "<PreviewAnchor")
        .replace(/<\/a>/g, "</PreviewAnchor>");
      const imp =
        "\nimport {PreviewAnchor} from '@/components/preview-anchor';\n";
      if (/^['"]use client['"];/.test(text))
        text = text.replace(/^(['"]use client['"];)/, "$1" + imp);
      else text = imp + text;
    }
    if (file.endsWith("contact-form.tsx")) {
      text = text.replace(
        /const response=await fetch\([\s\S]*?if \(!response.ok\) throw new Error\([^;]+;/,
        "await Promise.resolve();",
      );
      text = text
        .replace(
          "Thank you. Your request has been saved. Marcin will contact you using the details you provided.",
          "Demo complete. Your request has not been sent or stored.",
        )
        .replace(
          "Dziękuję. Twoje zgłoszenie zostało zapisane. Marcin skontaktuje się z Tobą, korzystając z podanych danych.",
          "Demonstracja zakończona. Zgłoszenie nie zostało wysłane ani zapisane.",
        );
      text = text.replace(
        "<h3>{copy.form}</h3>",
        "<h3>{copy.form}</h3><p role=\"note\">{english?'Portfolio demo — no messages are sent.':'Demonstracja portfolio — formularz nie wysyła wiadomości.'}</p>",
      );
    }
    await writeFile(file, text);
  }
  for (const [route, collection, param] of [
    ["blog/[slug]", "posts", "slug"],
    ["treningi/[slug]", "training-offers", "slug"],
    ["[...path]", "pages", "path"],
  ]) {
    const file = path.join(target, "app", route, "page.tsx");
    let text = await readFile(file, "utf8");
    if (param === "path")
      text = text.replace(
        "const query = await searchParams;",
        "const query: Record<string,string> = {};",
      );
    text += `\nexport async function generateStaticParams(){const {publishedItems}=await import('@/cms/publications');return (await publishedItems('${collection}',{limit:10000})).docs.map(doc=>({${param}:${param === "path" ? "[doc.slug]" : "doc.slug"}}));}\n`;
    await writeFile(file, text);
  }
  // Blog search and pagination operate on public snapshot data entirely in the browser.
  const originalBlog = await readFile(
    path.join(target, "app/blog/page.tsx"),
    "utf8",
  );
  const rendered = originalBlog
    .slice(originalBlog.indexOf("  return <PublicationShell>"))
    .replace("  return <PublicationShell>", "  return <>")
    .replace("</PublicationShell>;", "</>;");
  let blogClient = `'use client';import {useSearchParams} from 'next/navigation';import {PublicationCards} from '@/components/publications/cards';import {PreviewAnchor} from '@/components/preview-anchor';import data from '@/cms/fixture.json';import type {Post} from '@/cms/payload-types';
export function BlogListing(){const params=useSearchParams();const q=params.get('q')||'',category=params.get('kategoria')||'',tag=params.get('tag')||'',page=Math.max(1,Number(params.get('strona'))||1);const cats={docs:data.categories};const filtered=(data.posts as unknown as Post[]).filter(p=>(!q||(p.title+' '+p.excerpt).toLowerCase().includes(q.toLowerCase()))&&(!category||p.categories?.some(c=>typeof c==='object'&&c.slug===category))&&(!tag||p.tags?.some(t=>typeof t==='object'&&t.slug===tag)));const posts={docs:filtered.slice((page-1)*12,page*12),totalPages:Math.ceil(filtered.length/12),hasPrevPage:page>1,hasNextPage:page*12<filtered.length};const pageHref=(n:number)=>'/blog?'+new URLSearchParams({q,kategoria:category,tag,strona:String(n)});\n${rendered}`;
  blogClient = blogClient.replace('action="/blog"', `action="${base}/blog"`);
  await writeFile(
    path.join(target, "components/publications/preview-blog.tsx"),
    blogClient,
  );
  await writeFile(
    path.join(target, "app/blog/page.tsx"),
    `import {Suspense} from 'react';import {PublicationShell} from '@/components/publications/shell';import {BlogListing} from '@/components/publications/preview-blog';export default function Page(){return <PublicationShell><Suspense fallback={<p>Ładowanie bloga…</p>}><BlogListing/></Suspense></PublicationShell>}`,
  );
  const refs = path.join(target, "components/publications/references.tsx");
  let rt = await readFile(refs, "utf8");
  rt = "'use client';\nimport {useState,useEffect} from 'react';\n" + rt;
  rt = rt.replace(
    "  const nodes = body.root.children;",
    "  const [selected,setSelected]=useState(page);useEffect(()=>{setSelected(Number(new URLSearchParams(location.search).get('strona'))||1)},[]);\n  const nodes = body.root.children;",
  );
  rt = rt
    .replace(
      "Number.isSafeInteger(page) ? page : 1",
      "Number.isSafeInteger(selected) ? selected : 1",
    )
    .replace(
      'className="references-pagination"',
      "className=\"references-pagination\" onClick={event=>{const a=(event.target as HTMLElement).closest('a');if(a){event.preventDefault();const next=Number(new URL(a.href).searchParams.get('strona'))||1;setSelected(next);history.replaceState(null,'',a.href);document.getElementById('referencje')?.scrollIntoView();}}}",
    );
  await writeFile(refs, rt);
  // Reuse already-built local fonts; no Google font request at build or runtime.
  let fontCss = "";
  for (const f of await walk(path.join(source, ".next/static")))
    if (f.endsWith(".css"))
      for (const m of (await readFile(f, "utf8")).matchAll(
        /@font-face\s*\{[^}]+\}/g,
      ))
        fontCss += m[0] + "\n";
  fontCss = fontCss.replace(
    /(?:\.\.\/media\/|\/_next\/static\/media\/)/g,
    `${base}/fonts/`,
  );
  await mkdir(path.join(target, "public/fonts"), { recursive: true });
  for (const f of await readdir(path.join(source, ".next/static/media")))
    if (/\.(woff2?|otf|ttf)$/.test(f))
      await cp(
        path.join(source, ".next/static/media", f),
        path.join(target, "public/fonts", f),
      );
  const layout = path.join(target, "app/layout.tsx");
  let lt = await readFile(layout, "utf8");
  lt = lt
    .replace(/import \{[^}]+\} from "next\/font\/google";\s*/g, "")
    .replace(
      /const (bebas|inter|prose) = [\s\S]*?\}\);/g,
      'const $1 = { variable: "" };',
    )
    .replace(
      "export const metadata: Metadata = {",
      "export const metadata: Metadata = { robots: {index:false,follow:false},",
    );
  await writeFile(layout, lt);
  const css = path.join(target, "app/globals.css");
  await writeFile(
    css,
    (await readFile(css, "utf8")) +
      "\n" +
      fontCss +
      ':root{--font-bebas:"Bebas Neue";--font-inter:"Inter";--font-prose:"Source Sans 3";}',
  );
  await writeFile(
    path.join(target, "next.config.ts"),
    `export default {output:'export',basePath:'${base}',trailingSlash:true,images:{unoptimized:true}};`,
  );
  console.log(
    `Public snapshot: ${data.posts.length} posts, ${data.pages.length} pages, ${data["training-offers"].length} training offers, ${media.size} media files. No database or API runtime.`,
  );
  await new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      [
        path.join(source, "node_modules/next/dist/bin/next"),
        "build",
        "--webpack",
      ],
      { cwd: target, stdio: "inherit" },
    );
    child.on("exit", (code) =>
      code === 0 ? resolve() : reject(Error("Marcin preview build failed")),
    );
  });
  const destination = path.resolve(root, "public/previews/marcin-bak");
  if (path.dirname(destination) !== path.resolve(root, "public/previews"))
    throw Error("Unsafe destination");
  await rm(destination, { recursive: true, force: true });
  await cp(path.join(target, "out"), destination, { recursive: true });
  console.log("Exported " + base);
}
