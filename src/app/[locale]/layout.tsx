import type { Metadata } from "next";
import localFont from "next/font/local";
import { site } from "@/data/site";
import { seo } from "@/data/seo";
import { notFound } from "next/navigation";
import { content, isLocale, locales } from "@/i18n/content";
import { LocaleProvider } from "@/i18n/LocaleProvider";
import "../globals.css";
const geist = localFont({
  src: "../../../node_modules/@fontsource/geist/files/geist-latin-400-normal.woff2",
  variable: "--font-geist",
  adjustFontFallback: false,
  display: "swap",
});
const mono = localFont({
  src: [
    {
      path: "../../../node_modules/@fontsource/jetbrains-mono/files/jetbrains-mono-latin-400-normal.woff2",
      weight: "400",
    },
    {
      path: "../../../node_modules/@fontsource/jetbrains-mono/files/jetbrains-mono-latin-700-normal.woff2",
      weight: "700",
    },
  ],
  variable: "--font-mono",
  adjustFontFallback: false,
  display: "swap",
});
const geistExtended = localFont({
  src: "../../../node_modules/@fontsource/geist/files/geist-latin-ext-400-normal.woff2",
  variable: "--font-geist-ext",
  display: "swap",
  adjustFontFallback: false,
});
const monoExtended = localFont({
  src: [
    {
      path: "../../../node_modules/@fontsource/jetbrains-mono/files/jetbrains-mono-latin-ext-400-normal.woff2",
      weight: "400",
    },
    {
      path: "../../../node_modules/@fontsource/jetbrains-mono/files/jetbrains-mono-latin-ext-700-normal.woff2",
      weight: "700",
    },
  ],
  variable: "--font-mono-ext",
  display: "swap",
  adjustFontFallback: false,
});
export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}
type Props = { children: React.ReactNode; params: Promise<{ locale: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const copy = seo[locale];
  return {
    metadataBase: new URL(site.url),
    title: copy.title,
    description: copy.description,
    authors: [{ name: site.owner, url: site.linkedin }],
    verification: {
      google: "HMcGxtD8ZUF5W9bSg9cGWaehahBrJSFez416znOZynM",
    },
    alternates: {
      canonical: `/${locale}`,
      languages: { en: "/en", pl: "/pl", "x-default": "/en" },
    },
    openGraph: {
      type: "website",
      locale: locale === "pl" ? "pl_PL" : "en_US",
      alternateLocale: locale === "pl" ? "en_US" : "pl_PL",
      siteName: site.name,
      title: copy.title,
      description: copy.description,
      url: `/${locale}`,
      images: [
        {
          url: "/brand/mv-logo.png",
          width: 1254,
          height: 1254,
          alt: "Mind Vortex — Patryk Pyrka",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: copy.title,
      description: copy.description,
      images: ["/brand/mv-logo.png"],
    },
    robots: { index: !site.url.includes(".example"), follow: true },
  };
}
export default async function RootLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${site.url}/#organization`,
        name: site.name,
        url: site.url,
        founder: { "@id": `${site.url}/#person` },
        logo: `${site.url}/brand/mv-logo.svg`,
        // The LinkedIn profile identifies the founder, not the organization.
        hasOfferCatalog: {
          "@type": "OfferCatalog",
          name: locale === "pl" ? "Usługi Mind Vortex" : "Mind Vortex services",
          itemListElement: content[locale].capabilities.map((capability) => ({
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name: capability.name,
              description: capability.copy,
              serviceType: capability.tags,
              url: `${site.url}/${locale}#capabilities`,
              provider: { "@id": `${site.url}/#organization` },
            },
          })),
        },
      },
      {
        "@type": "Person",
        "@id": `${site.url}/#person`,
        name: site.owner,
        jobTitle:
          locale === "pl"
            ? "Inżynier oprogramowania i projektant graficzny"
            : "Software engineer & graphic designer",
        knowsAbout: [
          "Java",
          "Web development",
          "Backend engineering",
          "Visual identity",
          "Graphic design",
        ],
        sameAs: [site.linkedin, site.instagram].filter(Boolean),
      },
    ],
  };
  return (
    <html
      lang={locale}
      className={`${geist.variable} ${mono.variable} ${geistExtended.variable} ${monoExtended.variable}`}
    >
      <body>
        <LocaleProvider locale={locale}>{children}</LocaleProvider>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(schema).replace(/</g, "\\u003c"),
          }}
        />
      </body>
    </html>
  );
}
