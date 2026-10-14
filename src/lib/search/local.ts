// Rule-based search assistant. Runs when no ANTHROPIC_API_KEY is configured, so the
// site works out of the box. Same contract as the Claude-backed version in ./claude.ts.

import { describeFilters, formatPriceShort } from "../format";
import {
  BELGIUM_AVG,
  CITIES,
  KNOWN_ELSEWHERE,
  PRICE_PER_M2,
  cityFromWord,
  closestCity,
} from "../places";
import type { EpcLabel, Feature, Filters, PropertyType, Question, SearchResponse } from "../types";

const TYPE_WORDS: [RegExp, PropertyType][] = [
  [/\b(apartments?|appartements?|appartments?|flats?)\b/, "apartment"],
  [/\b(houses?|huis|huizen|maisons?|woning|townhouse|rijhuis)\b/, "house"],
  [/\bstudios?\b/, "studio"],
  [/\blofts?\b/, "loft"],
  [/\bvillas?\b/, "villa"],
];

const FEATURE_WORDS: [RegExp, Feature][] = [
  [/\b(garden|tuin|jardin|yard)\b/, "garden"],
  [/\b(terrace|terras|terrasse|roof terrace)\b/, "terrace"],
  [/\b(balcony|balkon|balcon)\b/, "balcony"],
  [/\b(parking|parkeerplaats|car space|parking space)\b/, "parking"],
  [/\bgarages?\b/, "garage"],
  [/\b(lift|elevator|ascenseur)\b/, "elevator"],
  [/\b(cellar|basement|kelder|cave)\b/, "cellar"],
];

const NUMBER_WORDS: Record<string, number> = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, een: 1, twee: 2, drie: 3, vier: 4, vijf: 5 };

/** "400k", "€ 1.2m", "400.000", "1,2 miljoen" → euros. */
function parseAmount(raw: string): number | undefined {
  const m = raw.toLowerCase().replace(/\s/g, "").match(/^€?(\d+(?:[.,]\d+)*)(k|m|mio|miljoen|million)?€?$/);
  if (!m) return undefined;
  const [, num, unit] = m;
  let value: number;
  if (unit) value = parseFloat(num.replace(",", "."));
  else value = parseFloat(num.replace(/[.,](?=\d{3}\b)/g, "").replace(",", "."));
  if (unit === "k") value *= 1_000;
  else if (unit) value *= 1_000_000;
  if (value < 1000) value *= 1000; // "budget 350" almost always means 350k
  return Math.round(value);
}

const AMOUNT = String.raw`€?\s?\d+(?:[.,]\d+)*\s?(?:k|m|mio|miljoen|million)?\b`;

function parseBudget(text: string): { min?: number; max?: number } {
  const between = text.match(new RegExp(String.raw`(?:between|tussen|from|van)\s+(${AMOUNT})\s*(?:and|en|to|tot|-)\s*(${AMOUNT})`));
  if (between) return { min: parseAmount(between[1]), max: parseAmount(between[2]) };
  const max = text.match(new RegExp(String.raw`(?:under|below|max(?:imum)?|up to|tot|less than|budget(?: of| is| to)?|max\.?|<|around|about|rond|ongeveer|to)\s*(${AMOUNT})`));
  if (max) return { max: parseAmount(max[1]) };
  const min = text.match(new RegExp(String.raw`(?:over|above|min(?:imum)?|at least|from|vanaf)\s*(${AMOUNT})`));
  if (min) {
    const v = parseAmount(min[1]);
    if (v && v >= 50_000) return { min: v };
  }
  const bare = text.match(new RegExp(String.raw`(€\s?\d+(?:[.,]\d+)*\s?(?:k|m)?|\b\d+(?:[.,]\d+)?\s?(?:k|m)\b)`));
  if (bare) return { max: parseAmount(bare[1]) };
  return {};
}

function parseBudgetSafe(text: string): { min?: number; max?: number } {
  const b = parseBudget(text);
  // "up to 3 bedrooms" is not a budget of €3,000.
  return {
    min: b.min && b.min >= 50_000 ? b.min : undefined,
    max: b.max && b.max >= 50_000 ? b.max : undefined,
  };
}

function parseBedrooms(text: string): number | undefined {
  const m = text.match(/\b(\d|one|two|three|four|five|six|een|twee|drie|vier|vijf)\s*[- ]?(?:bed(?:room)?s?|br|slaapkamers?|slpk|chambres?)\b/);
  if (!m) return undefined;
  return NUMBER_WORDS[m[1]] ?? parseInt(m[1], 10);
}

const NOT_PLACES = new Set([
  "belgium", "belgië", "belgique", "the", "a", "an", "de", "het", "een", "le", "la", "les", "my", "our",
  "centre", "center", "city", "town", "quiet", "good", "nice", "green", "walking", "cycling", "budget",
  "total", "need", "mind", "case", "general", "particular", "terms", "front", "back", "need", "it",
  "het", "stad", "centrum", "school", "schools", "work", "station", "train", "park", "nature",
]);

/** Words after "in"/"near" that look like a place but aren't one we know. */
function findPlaces(original: string): { known: string[]; elsewhere: string[]; unknown: string[] } {
  const known = new Set<string>();
  const elsewhere: string[] = [];
  const unknown: string[] = [];
  const lower = original.toLowerCase();

  for (const word of lower.match(/[\p{L}'-]+/gu) ?? []) {
    const city = cityFromWord(word);
    if (city) known.add(city);
  }
  for (const place of KNOWN_ELSEWHERE) {
    if (new RegExp(String.raw`\b${place}\b`).test(lower)) elsewhere.push(place);
  }

  const re = /\b(?:in|near|around|rond|bij|à|nabij|close to)\s+([\p{L}'-]+)/giu;
  for (const m of original.matchAll(re)) {
    const word = m[1];
    const lw = word.toLowerCase();
    if (cityFromWord(lw) || KNOWN_ELSEWHERE.includes(lw)) continue;
    if (NOT_PLACES.has(lw)) continue;
    unknown.push(word);
  }
  return { known: [...known], elsewhere, unknown };
}

const titleCase = (s: string) => s.replace(/(^|[\s-])\p{L}/gu, (c) => c.toUpperCase());

/** Typical floor area for a home with this many bedrooms, used for the budget sanity check. */
function typicalArea(type: "apartment" | "house", bedrooms: number): number {
  if (type === "apartment") return [50, 65, 90, 115, 140][Math.min(bedrooms, 4)];
  return [90, 100, 130, 165, 200, 240][Math.min(bedrooms, 5)];
}

export function estimatePrice(f: Filters): number | undefined {
  const flatLike = (t: PropertyType) => t === "apartment" || t === "studio" || t === "loft";
  let kind: "apartment" | "house" | undefined;
  if (f.types.length) kind = f.types.every(flatLike) ? "apartment" : f.types.some(flatLike) ? "apartment" : "house";
  else if (f.minBedrooms) kind = f.minBedrooms >= 3 ? "house" : "apartment";
  if (!kind) return undefined;
  const beds = f.minBedrooms ?? (kind === "apartment" ? 2 : 3);
  const area = Math.max(f.minArea ?? 0, typicalArea(kind, beds));
  const perM2 = f.cities.length
    ? Math.min(...f.cities.map((c) => (PRICE_PER_M2[c] ?? BELGIUM_AVG)[kind]))
    : BELGIUM_AVG[kind];
  return Math.round((area * perM2) / 5000) * 5000;
}

function cheapestCityFor(f: Filters): string | undefined {
  const kind = f.types.includes("house") ? "house" : "apartment";
  return [...CITIES]
    .filter((c) => !f.cities.includes(c))
    .sort((a, b) => PRICE_PER_M2[a][kind] - PRICE_PER_M2[b][kind])[0];
}

export function runLocalSearch(message: string, current: Filters): SearchResponse {
  const text = message.toLowerCase();
  const next: Filters = {
    ...current,
    cities: [...current.cities],
    types: [...current.types],
    features: [...current.features],
  };
  const notes: string[] = [];

  // Answers to our own clarifying questions.
  const raise = text.match(new RegExp(String.raw`raise (?:the )?budget to\s*(${AMOUNT})`));
  if (raise) next.maxPrice = parseAmount(raise[1]);
  const fewerBeds = text.match(/(\d) bedrooms? is fine/);
  if (fewerBeds) next.minBedrooms = parseInt(fewerBeds[1], 10);
  if (/terrace is fine|terrace is ok/.test(text)) {
    next.features = next.features.filter((x) => x !== "garden");
    if (!next.features.includes("terrace")) next.features.push("terrace");
  }
  if (/look at houses too|houses too/.test(text) && !next.types.includes("house")) next.types.push("house");
  if (/must be a garden|garden is a must/.test(text) && !next.types.includes("house")) next.types.push("house");
  if (/1-bedroom apartment/.test(text)) {
    next.types = ["apartment"];
    next.minBedrooms = 1;
  }
  if (/studio is fine/.test(text)) next.minBedrooms = undefined;
  const tryCity = text.match(/^try (.+)$/);
  if (tryCity) {
    const city = cityFromWord(tryCity[1]);
    if (city) next.cities = [city];
  }
  const anywhere = /anywhere|doesn't matter|no preference|all of belgium|heel belgië/.test(text);
  if (anywhere) next.cities = [];

  // Places.
  const places = findPlaces(message);
  if (places.known.length && !tryCity) {
    const additive = /\b(also|too|as well|ook)\b/.test(text);
    next.cities = additive ? [...new Set([...next.cities, ...places.known])] : places.known;
  }

  // Property type: a new type replaces the old one unless the buyer says "or"/"too".
  const types = TYPE_WORDS.filter(([re]) => re.test(text)).map(([, t]) => t);
  if (types.length && !/look at houses too|must be a garden|1-bedroom apartment/.test(text)) {
    const additive = /\b(also|too|ook)\b/.test(text);
    next.types = additive ? [...new Set([...next.types, ...types])] : [...new Set(types)];
  }

  // Budget, bedrooms, size.
  if (!raise) {
    const budget = parseBudgetSafe(text);
    if (budget.max) next.maxPrice = budget.max;
    if (budget.min) next.minPrice = budget.min;
  }
  if (!fewerBeds) {
    const beds = parseBedrooms(text);
    if (beds !== undefined) next.minBedrooms = beds || undefined;
  }
  const area = text.match(/(\d{2,4})\s?(?:m2|m²|sqm|square met(?:er|re)s?|vierkante meter)/);
  if (area) next.minArea = parseInt(area[1], 10);

  // Features. "No garden" / "without garden" removes; otherwise mentioning adds.
  for (const [re, feature] of FEATURE_WORDS) {
    const m = text.match(re);
    if (!m) continue;
    const negated = new RegExp(String.raw`(?:no|without|zonder|sans|don't need(?: a)?)\s+(?:\w+\s)?${m[0]}`).test(text);
    if (negated) next.features = next.features.filter((x) => x !== feature);
    else if (!next.features.includes(feature) && !/terrace is fine/.test(text)) next.features.push(feature);
  }

  const epc = text.match(/\bepc\s*(?:label\s*)?([a-f])\b/);
  if (epc) next.maxEpc = epc[1].toUpperCase() as EpcLabel;
  else if (/energy[- ]efficient|energiezuinig|low energy|well insulated|zuinig/.test(text)) next.maxEpc = "B";
  if (/station not needed|no station|without (?:a )?station/.test(text)) next.nearStation = undefined;
  else if (/\b(station|train|trein|gare|commute by train)\b/.test(text)) next.nearStation = true;
  if (/any energy label|any epc/.test(text)) next.maxEpc = undefined;

  // Clarifying questions, most important first. One per turn.
  let question: Question | null = null;

  if (places.unknown.length) {
    const word = places.unknown[0];
    const guess = closestCity(word);
    question = guess
      ? { text: `I don't know "${word}". Did you mean ${guess}?`, options: [`Try ${guess}`, "Anywhere in Belgium"] }
      : {
          text: `I couldn't place "${word}" in Belgium, so I left it out rather than guess. Which city did you mean?`,
          options: [...CITIES.slice(0, 4).map((c) => `Try ${c}`), "Anywhere in Belgium"],
        };
  } else if (places.elsewhere.length && !places.known.length) {
    const place = titleCase(places.elsewhere[0]);
    question = {
      text: `We don't have listings in ${place} yet. Want to try one of these cities instead?`,
      options: [...CITIES.slice(0, 3).map((c) => `Try ${c}`), "Anywhere in Belgium"],
    };
  } else if (next.types.length === 1 && next.types[0] === "studio" && (next.minBedrooms ?? 0) >= 1) {
    question = {
      text: "A studio doesn't have a separate bedroom. Did you mean a 1-bedroom apartment?",
      options: ["1-bedroom apartment", "Studio is fine"],
    };
  } else {
    const estimate = estimatePrice(next);
    if (estimate && next.maxPrice && next.maxPrice < estimate * 0.75) {
      const cheaper = cheapestCityFor(next);
      const beds = next.minBedrooms ?? 0;
      question = {
        text: `Honest check: ${describeFilters({ ...next, maxPrice: undefined })} usually costs around ${formatPriceShort(estimate)}. At ${formatPriceShort(next.maxPrice)} you'll see very little. What matters most?`,
        options: [
          `Raise budget to ${formatPriceShort(Math.round(estimate * 0.9 / 5000) * 5000)}`,
          ...(beds > 1 ? [`${beds - 1} bedrooms is fine`] : []),
          ...(cheaper ? [`Try ${cheaper}`] : []),
        ],
      };
    } else if (
      next.types.length === 1 &&
      next.types[0] === "apartment" &&
      next.features.includes("garden") &&
      !/must be a garden|garden is a must/.test(text)
    ) {
      question = {
        text: "Apartments with a private garden are rare. Would a big terrace work, or should I include houses?",
        options: ["Terrace is fine", "Look at houses too", "Must be a garden"],
      };
    }
  }

  const changed = JSON.stringify(next) !== JSON.stringify(current);
  const skipped = /either|no preference|nothing else|that's everything|no fixed budget|doesn't matter|any number|not sure/.test(text);
  const reply = /area i drew|drawn area/.test(text)
    ? "Searching inside the area you drew."
    : changed
      ? `Looking for ${describeFilters(next)}.${notes.length ? " " + notes.join(" ") : ""}`
      : skipped
        ? "Fine, I'll leave that open."
        : "I didn't catch anything new there. Try a city, a budget, the number of bedrooms or something like a garden.";

  return { filters: next, reply, question, source: "local" };
}
