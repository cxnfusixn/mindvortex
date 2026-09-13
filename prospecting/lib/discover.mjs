import { areas, categories } from "./store.mjs";
import { publicUrl, isProfileUrl } from "./network.mjs";
const filters = {
  beauty: '["shop"~"^(hairdresser|beauty|massage)$"]',
  health: '["healthcare"~"^(dentist|physiotherapist|clinic|doctor)$"]',
  food: '["amenity"~"^(restaurant|cafe|fast_food)$"]',
  services: '["craft"]',
  shops: '["shop"]["shop"!~"^(hairdresser|beauty|massage)$"]',
};
export function discoveryQuery(area, category) {
  if (!areas.includes(area) || !Object.hasOwn(categories, category))
    throw Error("Nieprawidłowy obszar lub branża.");
  return `[out:json][timeout:40];area["name"="${area}"]["boundary"="administrative"]->.region;nwr(area.region)${filters[category]}["name"];out center tags 250;`;
}
export async function discover(store, { area, category }) {
  const response = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "MindVortexProspecting/1.0 (+https://mindvortex.pro)",
    },
    body: new URLSearchParams({ data: discoveryQuery(area, category) }),
    signal: AbortSignal.timeout(55000),
  });
  if (!response.ok)
    throw Error(
      `Źródło OpenStreetMap jest niedostępne (HTTP ${response.status}). Spróbuj później.`,
    );
  const data = await response.json();
  if (data.remark || !Array.isArray(data.elements))
    throw Error("Źródło zwróciło niepełne wyniki. Spróbuj później.");
  const before = store.leads().length;
  for (const item of data.elements.slice(0, 250)) {
    const t = item.tags || {};
    let website = t.website || t["contact:website"] || "";
    if (website && !/^https?:\/\//i.test(website))
      website = "https://" + website;
    try {
      if (website) website = publicUrl(website).href;
    } catch {
      website = "";
    }
    if (!t.name || isProfileUrl(website)) continue;
    store.addLead({
      name: t.name,
      website,
      area,
      category,
      source: `https://www.openstreetmap.org/${item.type}/${item.id}`,
      address: [t["addr:street"], t["addr:housenumber"], t["addr:city"]]
        .filter(Boolean)
        .join(" "),
      email: t.email || t["contact:email"] || "",
      phone: t.phone || t["contact:phone"] || t.mobile || t["contact:mobile"] || "",
    });
  }
  store.event(
    `OpenStreetMap: dodano ${store.leads().length - before} firm (${area}). Wyniki mogą być niepełne; dane © OpenStreetMap contributors, ODbL.`,
  );
}
