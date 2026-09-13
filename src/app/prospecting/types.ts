export type Finding = {
  id: string;
  title: string;
  severity: number;
  screen: string;
  evidence: string;
  recommendation: string;
  heuristic: string;
};
export type Lead = {
  id: string;
  name: string;
  website: string;
  canAudit: boolean;
  category: string;
  area: string;
  address: string;
  source: string;
  email: string;
  phone: string;
  status: string;
  screens: { file: string; label: string; width: number }[];
  audit: null | {
    summary: string;
    confidence: string;
    offer: string;
    offerReason: string;
    findings: Finding[];
    positives: { description: string }[];
  };
  draft: string;
  share_token: string | null;
  share_expires: string | null;
};
export type Settings = {
  paused: boolean;
  autoDiscover: boolean;
  autoSend: boolean;
  area: string;
  category: string;
  dailyLimit: number;
  dailyHour: number;
  portfolioUrl: string;
};
export type Snapshot = {
  leads: Lead[];
  settings: Settings;
  areas: string[];
  categories: Record<string, string>;
  jobs: { id: string; kind: string; status: string; error: string }[];
  events: { id: number; at: string; message: string }[];
  usage: { calls: number; inputTokens: number; outputTokens: number };
  heartbeat: string | null;
  workerOnline: boolean;
  integrations: { vision: boolean; delivery: boolean };
};
export type Act = (data: Record<string, unknown>) => Promise<boolean>;
export const statuses: Record<string, string> = {
  new: "Nowa firma",
  auditing: "Trwa audyt",
  ready: "Gotowa propozycja",
  error: "Wymaga sprawdzenia",
  suppressed: "Wyłączona",
  sent: "Przekazano do poczty",
  sending: "Wysyłanie",
  uncertain: "Sprawdź wysyłkę",
  replied: "Odpowiedź otrzymana",
};
export const offers: Record<string, string> = {
  website: "Strona i identyfikacja",
  social: "Automatyzacja social mediów",
  crm: "Dedykowany CRM",
  none: "Bez propozycji",
};
