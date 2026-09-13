import { areas, categories, validEmail } from "./store.mjs";
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
  const selectors = category === "all" ? [""] : [filters[category]];
  const query = selectors.flatMap(filter => ["website","contact:website"].flatMap(site => ["email","contact:email"].map(email => `nwr(area.region)${filter}["name"]["${site}"]["${email}"];`))).join("");
  const region = area === "Warszawa" ? 'area["name"="Warszawa"]["boundary"="administrative"]["admin_level"="8"]->.region;' : `area["name"="Warszawa"]["boundary"="administrative"]["admin_level"="8"]->.city;rel(area.city)["boundary"="administrative"]["admin_level"="9"]["name"="${area}"];map_to_area->.region;`;
  return `[out:json][timeout:40];${region}(${query});out center tags;`;
}
export async function discover(store, { area, category }, progress = () => {}) {
  progress({stage:'fetching',message:'Pobieranie firm z OpenStreetMap. Oczekiwanie na odpowiedź źródła…'});
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
  progress({stage:'filtering',message:`Sprawdzanie ${data.elements.length} wyników: własna strona, e-mail i duplikaty.`,total:data.elements.length});
  for (const item of data.elements) {
    const t = item.tags || {};
    let website = t.website || t["contact:website"] || "";
    if (website && !/^https?:\/\//i.test(website))
      website = "https://" + website;
    try {
      if (website) website = publicUrl(website).href;
    } catch {
      website = "";
    }
    const email = String(t.email || t["contact:email"] || "").trim();
    if (!t.name || !website || isProfileUrl(website) || !validEmail(email)) continue;
    if (store.isExcluded(website)) continue;
    store.addLead({
      name: t.name,
      website,
      area,
      category,
      source: `https://www.openstreetmap.org/${item.type}/${item.id}`,
      address: [t["addr:street"], t["addr:housenumber"], t["addr:city"]]
        .filter(Boolean)
        .join(" "),
      email,
      phone: t.phone || t["contact:phone"] || t.mobile || t["contact:mobile"] || "",
    });
  }
  store.event(
    `OpenStreetMap: dodano ${store.leads().length - before} firm (${area}). Wyniki mogą być niepełne; dane © OpenStreetMap contributors, ODbL.`,
  );
  return store.leads().length - before;
}
