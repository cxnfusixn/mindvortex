import { capabilities } from "@/data/capabilities";
import { projects } from "@/data/projects";

export const locales = ["en", "pl"] as const;
export type Locale = (typeof locales)[number];
export const isLocale = (value: string): value is Locale =>
  locales.includes(value as Locale);

const en = {
  metaTitle: "Websites & Custom Web Applications | Mind Vortex",
  metaDescription:
    "Websites, custom web applications and Java backend development by Patryk Pyrka. Mind Vortex combines software engineering with visual identity. View the work.",
  nav: ["Work", "About", "Stack", "Contact"],
  navLabel: "Main navigation",
  homeLabel: "Mind Vortex home",
  skip: "Skip to content",
  language: "Language",
  enter: "ENTER",
  open: "OPEN",
  view: "VIEW",
  intro: "initializing vortex",
  hero: {
    studio: "INDEPENDENT DIGITAL STUDIO",
    disciplines: "ENGINEERING × VISUAL IDENTITY",
    kicker: "WEBSITES · BACKEND · VISUAL IDENTITY",
    lines: ["CODE", "MEETS", "DESIGN"],
    symbol: "FIG. 001 — ORDER INTO POSSIBILITY",
    scroll: "SCROLL TO ENTER",
    copy: "Websites, backend systems and visual identity. From design to deployment.",
    explore: "explore_work",
    contact: "contact_",
    location: "BASED IN POLAND · WORKING EVERYWHERE",
    chapter: "01 — THE INTERSECTION",
    fields: "CODE / SYSTEMS / IDENTITY",
    pauseMotion: "Pause vortex animation",
    resumeMotion: "Resume vortex animation",
  },
  manifesto: {
    label: "[02] / THE MINDSET",
    aside: "NOT TWO DISCIPLINES. ONE PRACTICE.",
    lines: ["I don’t separate", "technology", "from", "design."],
    fields: ["CODE", "SYSTEMS", "IDENTITY"],
    copy: "Code, systems and design — in one studio.",
    ending: "I build all three.",
  },
  capabilitiesLabel: "[03] / WHAT I BUILD_",
  capabilitiesAside: "FROM CONCEPT TO PRODUCTION",
  capabilities,
  experience: {
    label: "[04] / BUILT THROUGH EXPERIENCE_",
    aside: "PRACTICE MAKES PRECISE.",
    software: "YEARS IN SOFTWARE",
    design: "YEARS IN DESIGN",
  },
  work: {
    label: "[05] / SELECTED OUTPUT_",
    aside: "PROJECTS & CONCEPTS / 001—004",
    title: ["Systems with", "character."],
    copy: [
      "A meeting point for logic and instinct.",
      "Different websites. Distinct identities.",
    ],
    concept: "CONCEPT STUDY",
    project: "PROJECT",
    disclaimer:
      "DIGITAL PLATFORM: SELECTED PROJECTS / OTHER DIRECTIONS: CONCEPT STUDIES",
    close: "CLOSE",
    preview: "View",
    previewSuffix: "concept study",
    image: "Abstract composition:",
    detail:
      "This is an illustrative placeholder, not a published client project. Final scope, imagery and outcomes will be added here.",
  },
  projects,
  stack: {
    label: "[06] / UNDER THE HOOD_",
    aside: "SYSTEM MODULES",
    title: ["The right tools.", "No unnecessary noise."],
    copy: ["Chosen for the problem.", "Connected by experience."],
    active: "IN PRACTICE",
  },
  philosophy: {
    label: "[07] / THE SPACE BETWEEN",
    lines: [
      "GOOD DESIGN",
      "WITHOUT ENGINEERING",
      "IS A MOCKUP.",
      "GOOD ENGINEERING",
      "WITHOUT DESIGN",
      "IS INVISIBLE.",
    ],
    ending: ["I WORK", "IN BETWEEN."],
    aside: "ENGINEERED TO WORK. DESIGNED TO MATTER.",
  },
  contact: {
    label: "[08] / NEXT CHAPTER",
    aside: "YOUR IDEA STARTS HERE.",
    title: ["LET’S BUILD", "SOMETHING", "WORTH", "REMEMBERING."],
    copy: ["Need a website, custom web application", "or visual identity?"],
    talk: "Let’s talk.",
    start: "start_a_project_",
    pending: "Contact details coming soon.",
    toAdd: "TO BE ADDED",
    footer: "BUILD / AUTOMATE / DESIGN / REPEAT",
  },
};
export type Copy = typeof en;
const pl: Copy = {
  metaTitle: "Tworzenie stron i aplikacji webowych | Mind Vortex",
  metaDescription:
    "Tworzenie stron internetowych i aplikacji webowych dla firm. Patryk Pyrka — Mind Vortex: backend Java, API i identyfikacja wizualna. Zobacz projekty i opisz swój pomysł.",
  nav: ["Projekty", "O mnie", "Technologie", "Kontakt"],
  navLabel: "Nawigacja główna",
  homeLabel: "Mind Vortex — strona główna",
  skip: "Przejdź do treści",
  language: "Język",
  enter: "WEJDŹ",
  open: "OTWÓRZ",
  view: "ZOBACZ",
  intro: "inicjalizacja vortexu",
  hero: {
    studio: "NIEZALEŻNE STUDIO CYFROWE",
    disciplines: "INŻYNIERIA × IDENTYFIKACJA WIZUALNA",
    kicker: "STRONY INTERNETOWE · BACKEND · IDENTYFIKACJA WIZUALNA",
    lines: ["KOD", "SPOTYKA", "DESIGN"],
    symbol: "RYS. 001 — OD PORZĄDKU DO MOŻLIWOŚCI",
    scroll: "PRZEWIŃ, BY WEJŚĆ",
    copy: "Strony internetowe, backend i identyfikacja wizualna. Od projektu do wdrożenia.",
    explore: "zobacz_projekty",
    contact: "kontakt_",
    location: "Z POLSKI · BEZ GRANIC",
    chapter: "01 — PUNKT STYKU",
    fields: "KOD / SYSTEMY / IDENTYFIKACJA",
    pauseMotion: "Wstrzymaj animację vortexu",
    resumeMotion: "Wznów animację vortexu",
  },
  manifesto: {
    label: "[02] / PODEJŚCIE",
    aside: "DWIE DZIEDZINY. JEDNA PRAKTYKA.",
    lines: ["Nie oddzielam", "technologii", "od", "designu."],
    fields: ["KOD", "SYSTEMY", "IDENTYFIKACJA"],
    copy: "Kod, systemy i design — w jednym studiu.",
    ending: "Dbam o wszystkie trzy.",
  },
  capabilitiesLabel: "[03] / CO TWORZĘ_",
  capabilitiesAside: "OD KONCEPCJI DO PRODUKCJI",
  capabilities: [
    {
      name: "Strony i aplikacje webowe",
      copy: "Projektowanie i tworzenie stron internetowych dla firm oraz dedykowanych aplikacji webowych. Łączę indywidualny projekt graficzny z programowaniem w Next.js i React.",
      tags: ["Next.js", "React", "TypeScript", "Inżynieria interfejsów"],
    },
    {
      name: "Backend i integracje API",
      copy: "Tworzenie i rozwój backendu w Java i Spring. Projektuję REST API, integracje systemów oraz logikę biznesową dopasowaną do potrzeb aplikacji.",
      tags: ["Java", "Spring", "REST", "Bazy danych", "Systemy rozproszone"],
    },
    {
      name: "Logo i identyfikacja wizualna",
      copy: "Projektowanie logo i identyfikacji wizualnej dla firm. Tworzę spójną typografię, kolorystykę i materiały graficzne do wykorzystania na stronie oraz w komunikacji marki.",
      tags: [
        "Identyfikacja wizualna",
        "Kierunek artystyczny",
        "Typografia",
        "Projektowanie logo",
      ],
    },
    {
      name: "Grafika i animacja",
      copy: "Projektowanie graficzne, animacje i interaktywne elementy stron. Łączę grafikę z programowaniem, tworząc materiały dopasowane do charakteru marki.",
      tags: [
        "Projektowanie graficzne",
        "Animacja",
        "Kreatywne programowanie",
        "Sztuka cyfrowa",
      ],
    },
  ],
  experience: {
    label: "[04] / ZBUDOWANE NA DOŚWIADCZENIU_",
    aside: "PRAKTYKA DAJE PRECYZJĘ.",
    software: "LAT W PROGRAMOWANIU",
    design: "LAT W PROJEKTOWANIU",
  },
  work: {
    label: "[05] / WYBRANE PROJEKTY_",
    aside: "PROJEKTY I KONCEPCJE / 001—004",
    title: ["Systemy", "z charakterem."],
    copy: [
      "Miejsce, w którym logika spotyka intuicję.",
      "Różne strony. Wyraziste charaktery.",
    ],
    concept: "KONCEPCJA",
    project: "PROJEKT",
    disclaimer:
      "PLATFORMA CYFROWA: WYBRANE PROJEKTY / POZOSTAŁE KIERUNKI: KONCEPCJE",
    close: "ZAMKNIJ",
    preview: "Zobacz",
    previewSuffix: "koncepcja",
    image: "Kompozycja abstrakcyjna:",
    detail:
      "To przykładowa koncepcja, a nie opublikowana realizacja dla klienta. Docelowy zakres, materiały i rezultaty zostaną dodane później.",
  },
  projects: projects.map((project, i) => ({
    ...project,
    ...[
      {
        title: "System enterprise",
        type: "Architektura backendu / Java / API",
        description:
          "Niezawodny system zaprojektowany z myślą o wydajności, bezpieczeństwie i łatwym utrzymaniu.",
      },
      {
        title: "Platforma cyfrowa",
        type: "Next.js / Backend / UX",
        description:
          "Nowoczesne doświadczenie cyfrowe łączące responsywny interfejs z architekturą aplikacji gotową na produkcję.",
      },
      {
        title: "System wizualny",
        type: "Identyfikacja wizualna / Grafika",
        description:
          "Elastyczny język wizualny, który zachowuje rozpoznawalność w mediach cyfrowych i fizycznych.",
      },
      {
        title: "Cyfrowa kreacja",
        type: "Kreatywne programowanie / Animacja / Web",
        description:
          "Interaktywne doświadczenie cyfrowe, w którym design, kod i ruch tworzą jeden system.",
      },
    ][i],
  })),
  stack: {
    label: "[06] / OD ŚRODKA_",
    aside: "MODUŁY SYSTEMU",
    title: ["Właściwe narzędzia.", "Bez zbędnego szumu."],
    copy: ["Dobrane do zadania.", "Połączone doświadczeniem."],
    active: "W PRAKTYCE",
  },
  philosophy: {
    label: "[07] / POMIĘDZY",
    lines: [
      "DOBRY DESIGN",
      "BEZ INŻYNIERII",
      "TO MAKIETA.",
      "DOBRA INŻYNIERIA",
      "BEZ DESIGNU",
      "JEST NIEWIDOCZNA.",
    ],
    ending: ["DZIAŁAM", "POMIĘDZY."],
    aside: "DZIAŁA, JAK NALEŻY. WYGLĄDA, JAK TRZEBA.",
  },
  contact: {
    label: "[08] / KOLEJNY ROZDZIAŁ",
    aside: "TU ZACZYNA SIĘ TWÓJ POMYSŁ.",
    title: ["STWÓRZMY", "COŚ, CO", "ZOSTAJE", "W PAMIĘCI."],
    copy: [
      "Potrzebujesz strony internetowej, aplikacji webowej",
      "lub identyfikacji wizualnej?",
    ],
    talk: "Porozmawiajmy.",
    start: "zacznijmy_projekt_",
    pending: "Dane kontaktowe już wkrótce.",
    toAdd: "WKRÓTCE",
    footer: "TWÓRZ / AUTOMATYZUJ / PROJEKTUJ / POWTARZAJ",
  },
};
export const content: Record<Locale, Copy> = { en, pl };
