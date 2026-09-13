import type { NextConfig } from "next";
const previewOrigin = process.env.NEXT_PUBLIC_PREVIEW_ORIGIN || "";
if (previewOrigin && (new URL(previewOrigin).origin !== previewOrigin || !previewOrigin.startsWith("https://") || previewOrigin === "https://mindvortex.pro"))
  throw Error("NEXT_PUBLIC_PREVIEW_ORIGIN must be a separate HTTPS origin without a path");
const config: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          ...(process.env.NODE_ENV === "production" ? [{key:"Strict-Transport-Security",value:"max-age=31536000"}] : []),
          { key: "Content-Security-Policy", value: `default-src 'self'; script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === "production" ? "" : " 'unsafe-eval'"}; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data: https:; media-src 'self' blob: https:; connect-src 'self' https:${process.env.NODE_ENV === "production" ? "" : " ws:"}; frame-src 'self' ${previewOrigin} https://www.youtube.com https://www.youtube-nocookie.com https://www.google.com; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'` },
        ],
      },
      {
        source: "/prospecting/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
        ],
      },
    ];
  },
  async redirects() {
    return previewOrigin ? [{source:"/previews/:path*",destination:`${previewOrigin}/previews/:path*`,permanent:false}] : [];
  },
  async rewrites() {
    return [
      {
        source: "/previews/:project(kierunek|marcin-bak|flc)",
        destination: "/previews/:project/index.html",
      },
      {
        source: "/previews/:project(flc|marcin-bak)/:path+",
        destination: "/previews/:project/:path+/index.html",
      },
      {
        source: "/previews/kierunek/blog",
        destination: "/previews/kierunek/blog/index.html",
      },
      {
        source: "/previews/kierunek/blog/:slug",
        destination: "/previews/kierunek/blog/:slug/index.html",
      },
      {
        source: "/previews/kierunek/polityka-prywatnosci",
        destination: "/previews/kierunek/polityka-prywatnosci/index.html",
      },
    ];
  },
};
export default config;
