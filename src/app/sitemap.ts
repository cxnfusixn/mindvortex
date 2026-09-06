import type { MetadataRoute } from "next";
import { site } from "@/data/site";
import { locales } from "@/i18n/content";

export default function sitemap(): MetadataRoute.Sitemap {
  if (site.url.includes(".example")) return [];
  const languages = {
    en: new URL("/en", site.url).href,
    pl: new URL("/pl", site.url).href,
    "x-default": new URL("/en", site.url).href,
  };
  return locales.map((locale) => ({
    url: new URL(`/${locale}`, site.url).href,
    alternates: { languages },
  }));
}
