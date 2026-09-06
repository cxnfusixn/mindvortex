export const subprojects = [
  {
    id: "kierunek",
    title: "Kierunek",
    subtitle: { pl: "Centrum psychologiczne", en: "Psychology centre" },
    description: {
      pl: "Spokojna, czytelna strona centrum psychologicznego. Oferta, cennik, blog i formularz kontaktowy połączone z panelem zarządzania treścią Sanity.",
      en: "A calm, clear website for a psychology centre. Services, pricing, a blog and a contact form connected to a Sanity content management system.",
    },
    stack: ["Next.js", "TypeScript", "Tailwind CSS", "Sanity"],
  },
  {
    id: "marcin-bak",
    title: "Marcin Bąk",
    subtitle: {
      pl: "Boks / MMA / trening personalny",
      en: "Boxing / MMA / personal training",
    },
    description: {
      pl: "Filmowa strona trenera boksu i MMA. Przewijanie prowadzi przez kolejne sceny: filozofię treningu, sekcje sportowe i ofertę. Typografia, obraz i animacja budują wspólną narrację.",
      en: "A cinematic website for a boxing and MMA coach. Scrolling moves through a sequence of scenes: training philosophy, disciplines and services. Typography, imagery and motion tell one connected story.",
    },
    stack: ["Next.js", "TypeScript", "GSAP", "Framer Motion"],
  },
] as const;
