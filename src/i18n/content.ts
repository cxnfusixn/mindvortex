import { capabilities } from "@/data/capabilities";
import { projects } from "@/data/projects";

export const locales = ["en", "pl"] as const;
export type Locale = (typeof locales)[number];
export const isLocale = (value: string): value is Locale =>
  locales.includes(value as Locale);

const en = {
  metaTitle: "Mind Vortex — Development, Backend & Design",
  metaDescription:
    "Mind Vortex is the digital studio of Patryk Pyrka, combining software engineering, web development, backend systems and visual identity.",
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
    kicker: "CREATIVE MIND. ENGINEERED OUTPUT.",
    lines: ["CODE", "MEETS", "DESIGN"],
    symbol: "FIG. 001 — ORDER INTO POSSIBILITY",
    scroll: "SCROLL TO ENTER",
    copy: "Engineering digital products with the precision of code and the character of design.",
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
    copy: "A digital product should work flawlessly, communicate clearly and have a visual identity worth remembering.",
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
      "Two websites. Two distinct identities.",
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
    copy: ["Need a digital product, backend system", "or visual identity?"],
    talk: "Let’s talk.",
    start: "start_a_project_",
    pending: "Contact details coming soon.",
    toAdd: "TO BE ADDED",
    footer: "BUILD / AUTOMATE / DESIGN / REPEAT",
  },
};
export type Copy = typeof en;
const pl: Copy = {
  metaTitle: "Mind Vortex — Strony internetowe, backend i design",
  metaDescription:
    "Mind Vortex to studio cyfrowe Patryka Pyrki. Łączę inżynierię oprogramowania, tworzenie stron internetowych, systemy backendowe i identyfikację wizualną.",
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
    kicker: "KREATYWNY UMYSŁ. PRECYZYJNE WYKONANIE.",
    lines: ["KOD", "SPOTYKA", "DESIGN"],
    symbol: "RYS. 001 — OD PORZĄDKU DO MOŻLIWOŚCI",
    scroll: "PRZEWIŃ, BY WEJŚĆ",
    copy: "Tworzę produkty cyfrowe, łącząc precyzję kodu z charakterem dobrego designu.",
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
    copy: "Produkt cyfrowy powinien działać bez zarzutu, jasno komunikować swoją wartość i mieć identyfikację wizualną, która zostaje w pamięci.",
    ending: "Dbam o wszystkie trzy.",
  },
  capabilitiesLabel: "[03] / CO TWORZĘ_",
  capabilitiesAside: "OD KONCEPCJI DO PRODUKCJI",
  capabilities: [
    {
      name: "Web",
      copy: "Szybkie, dopracowane strony i aplikacje. Przejrzyste, wydajne i zaprojektowane z myślą o interakcji.",
      tags: ["Next.js", "React", "TypeScript", "Inżynieria interfejsów"],
    },
    {
      name: "Backend",
      copy: "Niezawodne systemy, API i usługi gotowe na produkcję, skalowanie i wieloletni rozwój.",
      tags: ["Java", "Spring", "REST", "Bazy danych", "Systemy rozproszone"],
    },
    {
      name: "Marka",
      copy: "Systemy wizualne, które nadają produktom cyfrowym wyrazisty, spójny i rozpoznawalny charakter.",
      tags: [
        "Identyfikacja wizualna",
        "Kierunek artystyczny",
        "Typografia",
        "Projektowanie logo",
      ],
    },
    {
      name: "Kreacja",
      copy: "Grafika i doświadczenia cyfrowe, w których technologia staje się częścią języka wizualnego.",
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
      "Dwie strony. Dwa różne charaktery.",
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
      "Potrzebujesz produktu cyfrowego, backendu",
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
