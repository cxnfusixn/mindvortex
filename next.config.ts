import type { NextConfig } from "next";
const config: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  async headers() {
    return [
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
