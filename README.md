# MIND VORTEX

An editorial studio portfolio for Patryk Pyrka. Next.js App Router, React, TypeScript, Tailwind CSS, GSAP / ScrollTrigger, Lenis and Framer Motion.

## Local development

Requires Node.js 20.9 or later (Node.js 24 recommended).

```sh
npm ci
npm run dev
```

Open http://localhost:3000 (redirects to `/en`). Polish is available at `/pl`. Production: `npm run build` then `npm start`.

## Checks

```sh
npm run lint
npm run typecheck
npm run build
npx playwright install chromium
npm test
```

Browser checks cover both languages at 360, 390, 768 and 1440px, language switching, SEO, vector geometry and motion, live project navigation, scaled desktop viewports, contact form states and API validation. Tests launch an isolated production server on port 3100. Screenshots are saved in `test-results/`.

## Structure

- `src/app/[locale]/`: statically rendered English and Polish pages, localized metadata, structured data and document language.
- `src/components/layout/StudioPage.tsx`: composition of all eight scenes.
- `src/i18n/`: typed English/Polish copy and locale context. Both language routes provide content without JavaScript.
- `src/components/sections/`: eight independent narrative scenes.
- `src/components/motion/`: session-aware intro, GSAP scene choreography and desktop cursor.
- `src/components/navigation/`: fixed navigation with intersection-based scene counter.
- `src/components/ui/`: magnetic link and terminal label primitives.
- `src/components/vortex/`: reusable SVG symbol based on the supplied logo.
- `src/hooks/useLenis.ts`: desktop-only smooth scrolling with GSAP ticker cleanup.
- `src/data/`: content and contact configuration.
- `public/work/`: original code-native SVG concept compositions, with no gradients.

## Content to finalize

1. Set `NEXT_PUBLIC_SITE_URL` to the real origin (see `.env.example`). The placeholder origin disables indexing; setting a real origin enables it.
2. Email and LinkedIn are configured in `src/data/site.ts`. Set the SMTP variables from `.env.example` in private environment configuration to enable contact form delivery. Never commit `.env.local` or SMTP passwords.
3. Add or update live projects and bilingual descriptions in `src/data/subprojects.ts`. Their self-contained builds belong in `public/previews/`; regeneration is documented below.
4. Edit all technologies and bilingual group names in `src/data/stack.ts`. Six groups remain: backend, frontend, design, architecture/integration, data and cloud. The curated stack includes Micronaut and CorelDRAW; testing/quality, observability and tools/delivery groups are omitted. Company/collaboration lists have been removed; years-of-experience counters remain.
5. Vector assets in `public/brand/`: `mv-logo.svg` is the complete lockup, `mv-symbol.svg` the standalone symbol, and `mv-wordmark.svg` the outlined wordmark. All lettering is paths; there are no embedded bitmaps, gradients or external font dependencies. The favicon uses the same vector symbol. The original PNG is retained only as a source and social-card fallback (social platforms have limited SVG support).

## Vector source

`brand/vortex-symbol.svg` is the canonical symbol. `scripts/build-circular-vortex.py` constructs each continuous curved edge from a single circle with one fixed radius, without intermediate arc joins or changing radii. The branched upper blade has four curved edges; each remaining blade has two. All curves use SVG `A` commands with equal horizontal/vertical radii. The 12 construction circles are shown in `brand/vortex-construction.svg`. The accepted pixel layout and stepped cuts are preserved. Pixels use exact squares and orthogonal contours with `crispEdges` rendering. Run `node scripts/sync-vector-brand.mjs` after editing the master to update the inline React geometry, standalone symbol, full lockup and favicon together.

The website renders the symbol as inline SVG. In the hero, `GalaxyVortex` slowly rotates and gently expands/contracts the accepted geometry while square fragments drift outward, shrink and dissolve. Mobile uses fewer particles and slower rotation. A localized pause control, offscreen/tab visibility suspension and `prefers-reduced-motion` support keep motion optional and efficient. Navigation and contact symbols remain static. The hero has no circular outline. Breathing and rotation share a 16-second / 64-second rhythm on desktop, with subtler, slower breathing on mobile.

`scripts/vectorize-logo.py` traces the lettering from the untouched `mv_logo.png` and incorporates the canonical symbol without retracing it. It uses Python 3.13 with `Pillow`, `numpy` and `vtracer==0.6.12`. These Python tools are only needed to regenerate lettering, not to run or build the website. All vector assets use flat identity colors and transparent backgrounds.

## Motion and accessibility

Portfolio sections scroll naturally. The project row scrolls horizontally, and embedded pages scroll independently. GSAP adds hero parallax, reveals and once-only counters; Framer Motion handles magnetic links. Lenis shares GSAP's ticker. All effects clean up on unmount and media-query changes. Reduced motion removes smooth scrolling, parallax, cursor animation and the intro. Content and full-page project links remain server-rendered and visible without JavaScript. The short intro is non-interactive, skipped on repeat session visits, and never blocks navigation. Preview videos are muted.

Fonts are self-hosted through `next/font/local`, with Latin Extended subsets for Polish characters; builds do not need Google Fonts access. Visible branding and project artwork use local SVGs through `next/image`. Verify real content, final contrast, and field Core Web Vitals again before launch.

## Live project row

`ProjectsScene` renders an extensible horizontal row of `LiveProject` panels: FLC (Fort Lauderdale Collection), Kierunek and Marcin Bak. Desktop shows two panels at a time; scroll the row horizontally to reach further projects. Each panel embeds the actual exported React website with its own vertical scrollbar, responsive width switch and full-page link. Iframes mount near the viewport to avoid loading all applications in the hero.

Edit projects in `src/data/subprojects.ts`. Deployable HTML, JavaScript, CSS and assets live under `public/previews/`. No sibling server is needed to run or deploy the portfolio. Next rewrites serve preview landing pages and Kierunek blog routes.

To refresh the previews, run `node scripts/build-live-previews.mjs` (or append `kierunek`, `marcin-bak` or `flc`). Kierunek and Marcin Bak default to sibling repositories; FLC defaults to `Documents/ChatGPT/flc` under the current user's home. An optional third argument overrides the selected project's source, for example:

```powershell
node scripts/build-live-previews.mjs flc "C:\Users\48502\Documents\ChatGPT\flc"
```

The script copies source into ignored `.preview-build/`, exports each app using its own installed dependencies, then copies the output into `public/previews/`. Original repositories are untouched. Kierunek and Marcin Bak reuse font files from their local compiled `.next/static` output. FLC downloads its Google Fonts during export and serves them locally alongside its logo, hero video and Porsche animation frames. Its vehicle inventory retains the source site's external image URLs, illustrative pricing and preview-only enquiry form. Kierunek captures its published CMS homepage and downloads its images at export time (falling back to repository data when no public CMS configuration exists); its form validates but does not send submissions. Preview pages have noindex metadata.

## Contact email

The bilingual form posts to `/api/contact` and sends mail only to `patryk.pyrka@mindvortex.pro`, with the visitor as Reply-To. Configure `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD` and `SMTP_FROM` in `.env.local` or deployment secrets (see `.env.example`). Ports 465 and 587 use TLS; SMTP_FROM must be authorized by the provider. Without credentials the endpoint returns 503 and the UI offers direct email, never a false delivery confirmation. The API validates content, caps body size, rejects foreign browser origins and limits attempts per process. Multi-instance deployments should add shared rate limiting at the trusted reverse proxy. Do not expose SMTP variables through NEXT_PUBLIC prefixes.

Preview Desktop uses a 1920 x 1080 iframe scaled by ResizeObserver. Mobile uses 390 x 844. Each embedded page retains its own vertical scrollbar; the extensible project row scrolls horizontally.

FLC includes its exported dealership subpages (inventory, vehicles, marques, services and account demo). Nested preview routes are served from their generated index.html files. Native search forms use the preview prefix; Next.js links and router navigation use basePath. Demo requests stay in the browser and do not send messages.
