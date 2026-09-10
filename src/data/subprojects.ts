export const subprojects = [
  {
    id: "flc",
    title: "FLC",
    subtitle: { pl: "Fort Lauderdale Collection — samochody luksusowe", en: "Fort Lauderdale Collection — luxury automobiles" },
    description: {
      pl: "Filmowa prezentacja kolekcji samochodów luksusowych. Animowane intro, interaktywny katalog i sekwencja Porsche sterowana przewijaniem tworzą doświadczenie cyfrowego salonu.",
      en: "A cinematic showcase of luxury automobiles. An animated intro, interactive inventory and a scroll-controlled Porsche sequence create a digital showroom experience.",
    },
    stack: ["Next.js", "TypeScript", "React", "Motion design"],
  },
  {
    id: "marcin-bak",
    title: "Marcin Bąk",
    subtitle: {
      pl: "Strona internetowa trenera personalnego, boksu i MMA",
      en: "Personal training, boxing & MMA website",
    },
    description: {
      pl: "Filmowa strona trenera boksu i MMA. Przewijanie prowadzi przez kolejne sceny: filozofię treningu, sekcje sportowe i ofertę. Typografia, obraz i animacja budują wspólną narrację.",
      en: "A cinematic website for a boxing and MMA coach. Scrolling moves through a sequence of scenes: training philosophy, disciplines and services. Typography, imagery and motion tell one connected story.",
    },
    stack: ["Next.js", "TypeScript", "GSAP", "Framer Motion"],
  },
  {
    id: "kierunek",
    title: "Kierunek",
    subtitle: {
      pl: "Strona internetowa centrum psychologicznego",
      en: "Psychology centre website",
    },
    description: {
      pl: "Spokojna, czytelna strona centrum psychologicznego. Oferta, cennik, blog i formularz kontaktowy połączone z panelem zarządzania treścią Sanity.",
      en: "A calm, clear website for a psychology centre. Services, pricing, a blog and a contact form connected to a Sanity content management system.",
    },
    stack: ["Next.js", "TypeScript", "Tailwind CSS", "Sanity"],
  },
] as const;
