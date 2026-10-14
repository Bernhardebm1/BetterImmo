// The follow-up questions asked after the buyer's first message, so the search is pinned
// down before we show homes. Each topic is asked once, and only if the buyer hasn't
// already told us. The assistant's own questions (pushback, unclear places) come first.

import { FEATURE_LABEL, formatPriceShort } from "../format";
import { CITIES } from "../places";
import { DRAW_OPTION, TOPICS, type Filters, type Question, type Topic } from "../types";
import { estimatePrice } from "./local";

const round = (n: number) => Math.round(n / 25_000) * 25_000;

function ask(topic: Topic, f: Filters): Question | null {
  const flat = f.types.length > 0 && f.types.every((t) => t === "apartment" || t === "studio" || t === "loft");
  switch (topic) {
    case "location":
      if (f.cities.length || f.area) return null;
      return {
        topic,
        text: "Where would you like to live? Pick a city, or draw the exact area on the map.",
        options: [...CITIES.slice(0, 5), DRAW_OPTION, "Anywhere in Belgium"],
      };
    case "budget": {
      if (f.maxPrice) return null;
      const est = estimatePrice({ ...f, types: f.types.length ? f.types : ["apartment"] }) ?? 400_000;
      const steps = [...new Set([round(est * 0.75), round(est), round(est * 1.35)])];
      return {
        topic,
        text: "What's the most you'd like to spend?",
        options: [...steps.map((s) => `Up to ${formatPriceShort(s)}`), "No fixed budget"],
      };
    }
    case "type":
      if (f.types.length) return null;
      return { topic, text: "An apartment or a house?", options: ["An apartment", "A house", "Either is fine"] };
    case "bedrooms":
      if (f.minBedrooms || f.types.includes("studio")) return null;
      return { topic, text: "How many bedrooms do you need at least?", options: ["1 bedroom", "2 bedrooms", "3 bedrooms", "4 bedrooms", "Doesn't matter"] };
    case "musts": {
      const options = flat
        ? ["Terrace", "Balcony", "Lift", "Parking", "Near a station", "Energy efficient"]
        : ["Garden", "Parking", "Garage", "Near a station", "Energy efficient"];
      const have = new Set<string>(f.features.map((x) => x));
      const left = options.filter((o) => !have.has(o.toLowerCase()) && !(o === "Lift" && have.has("elevator")) && !(o === "Near a station" && f.nearStation) && !(o === "Energy efficient" && f.maxEpc));
      return {
        topic,
        text: f.features.length ? "Anything else you can't do without? Pick as many as you like." : "Anything you can't do without? Pick as many as you like.",
        options: [...left, "Nothing else"],
        multi: true,
      };
    }
  }
}

/** The next follow-up, or null when we know enough to show homes. */
export function nextQuestion(f: Filters, asked: string[]): Question | null {
  for (const topic of TOPICS) {
    if (asked.includes(topic)) continue;
    const q = ask(topic, f);
    if (q) return q;
  }
  return null;
}

/** When nothing fits any more: offer to drop one thing at a time. */
export function relaxQuestion(f: Filters): Question | null {
  const options = [
    ...f.features.map((x) => `Without ${FEATURE_LABEL[x].toLowerCase()}`),
    ...(f.nearStation ? ["Station not needed"] : []),
    ...(f.maxEpc ? ["Any energy label"] : []),
    ...(f.minBedrooms && f.minBedrooms > 1 ? [`${f.minBedrooms - 1} bedrooms is fine`] : []),
    ...(f.maxPrice ? [`Raise budget to ${formatPriceShort(round(f.maxPrice * 1.2))}`] : []),
    ...(f.cities.length || f.area ? ["Anywhere in Belgium"] : []),
  ].slice(0, 5);
  if (!options.length) return null;
  return { text: "Nothing fits all of that yet. What could you give up?", options };
}
