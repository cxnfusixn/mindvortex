import type { Locale } from "@/i18n/content";

// Search-result copy is kept separate from the visible editorial content.
export const seo: Record<Locale, { title: string; description: string }> = {
  pl: {
    title: "Strony internetowe, backend Java i branding | Mind Vortex",
    description:
      "Mind Vortex: tworzenie stron internetowych dla firm, aplikacje na zamówienie, backend Java/Spring i projektowanie logo. Zobacz projekty i opisz swoje potrzeby.",
  },
  en: {
    title: "Web Development, Java Backend & Branding | Mind Vortex",
    description:
      "Mind Vortex: business websites, custom web applications, Java/Spring backend development and logo design. Explore the portfolio and discuss your project.",
  },
};
