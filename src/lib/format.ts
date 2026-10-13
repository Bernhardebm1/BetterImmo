import type { Feature, Filters, PropertyType } from "./types";

const euro = new Intl.NumberFormat("nl-BE", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

export const formatPrice = (n: number) => euro.format(n);

/** €425k / €1.15M, for chips and tight spaces. */
export function formatPriceShort(n: number): string {
  if (n >= 1_000_000) return `€${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 2).replace(/\.?0+$/, "")}M`;
  return `€${Math.round(n / 1000)}k`;
}

export const TYPE_LABEL: Record<PropertyType, string> = {
  apartment: "Apartment",
  house: "House",
  studio: "Studio",
  loft: "Loft",
  villa: "Villa",
};

export const FEATURE_LABEL: Record<Feature, string> = {
  garden: "Garden",
  terrace: "Terrace",
  balcony: "Balcony",
  parking: "Parking",
  garage: "Garage",
  elevator: "Lift",
  cellar: "Cellar",
};

const FEATURE_PHRASE: Record<Feature, string> = {
  garden: "a garden",
  terrace: "a terrace",
  balcony: "a balcony",
  parking: "parking",
  garage: "a garage",
  elevator: "a lift",
  cellar: "a cellar",
};

function list(items: string[], joiner = "or"): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} ${joiner} ${items[items.length - 1]}`;
}

/** One sentence describing the search, e.g. "a 2-bedroom apartment in Gent under €350k with a terrace". */
export function describeFilters(f: Filters): string {
  const parts: string[] = [];
  const types = f.types.length ? list(f.types.map((t) => TYPE_LABEL[t].toLowerCase())) : "home";
  const beds = f.minBedrooms ? `${f.minBedrooms}+ bedroom ` : "";
  const noun = `${beds}${types}`;
  parts.push(`${/^[aeiou]/i.test(noun) ? "an" : "a"} ${noun}`);
  if (f.cities.length) parts.push(`in ${list(f.cities)}`);
  else parts.push("anywhere in Belgium");
  if (f.minPrice && f.maxPrice) parts.push(`between ${formatPriceShort(f.minPrice)} and ${formatPriceShort(f.maxPrice)}`);
  else if (f.maxPrice) parts.push(`under ${formatPriceShort(f.maxPrice)}`);
  else if (f.minPrice) parts.push(`from ${formatPriceShort(f.minPrice)}`);
  if (f.features.length) parts.push(`with ${list(f.features.map((x) => FEATURE_PHRASE[x]), "and")}`);
  if (f.minArea) parts.push(`of at least ${f.minArea} m²`);
  if (f.nearStation) parts.push("near a train station");
  if (f.maxEpc) parts.push(`with EPC ${f.maxEpc} or better`);
  return parts.join(" ");
}
