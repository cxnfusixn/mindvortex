import type { Locale } from "@/i18n/content";

// Search-result copy is kept separate from the visible editorial content.
export const seo: Record<Locale, { title: string; description: string }> = {
  pl: {
    title: "Strony internetowe, backend Java i branding | Mind Vortex",
    description:
      "Patryk Pyrka — strony i aplikacje webowe, backend Java/Spring, integracje API, logo i identyfikacja wizualna. Poznaj portfolio Mind Vortex i omów swój projekt.",
  },
  en: {
    title: "Web Development, Java Backend & Branding | Mind Vortex",
    description:
      "Patryk Pyrka builds websites, web applications and Java/Spring backends, with API integrations, logo design and visual identity. Explore Mind Vortex’s portfolio.",
  },
};
