import type { NextConfig } from "next";
const config: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  async rewrites() {
    return [
      {
        source: "/previews/:project(kierunek|marcin-bak|flc)",
        destination: "/previews/:project/index.html",
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
