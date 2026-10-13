import { EPC_LABELS, type Filters, type Listing } from "../types";
import { FEATURE_LABEL, formatPriceShort } from "../format";
import { LISTINGS } from "../listings";

export type Match = { listing: Listing; score: number; reasons: string[]; misses: string[] };

const epcRank = (l: string) => EPC_LABELS.indexOf(l as (typeof EPC_LABELS)[number]);

/**
 * Hard filters (city, type, budget with 5% headroom, bedrooms, size, EPC) decide what is shown;
 * wanted features rank the rest. Listings under offer are hidden by default.
 */
export function findMatches(f: Filters, exclude: string[] = [], limit = 8): { matches: Match[]; total: number } {
  const candidates = LISTINGS.filter((l) => {
    if (l.status !== "available") return false;
    if (exclude.includes(l.id)) return false;
    if (f.cities.length && !f.cities.includes(l.city)) return false;
    if (f.types.length && !f.types.includes(l.type)) return false;
    if (f.maxPrice && l.price > f.maxPrice * 1.05) return false;
    if (f.minPrice && l.price < f.minPrice) return false;
    if (f.minBedrooms && l.bedrooms < f.minBedrooms) return false;
    if (f.minArea && l.area < f.minArea * 0.95) return false;
    if (f.maxEpc && epcRank(l.epc) > epcRank(f.maxEpc)) return false;
    if (f.nearStation && !l.nearStation) return false;
    return true;
  });

  const scored = candidates.map((l): Match => {
    const reasons: string[] = [];
    const misses: string[] = [];
    let score = 0;

    for (const feature of f.features) {
      const has = l.features.includes(feature) || (feature === "parking" && l.features.includes("garage"));
      if (has) {
        score += 10;
        reasons.push(FEATURE_LABEL[feature]);
      } else {
        misses.push(`No ${FEATURE_LABEL[feature].toLowerCase()}`);
      }
    }
    if (f.maxPrice) {
      const diff = f.maxPrice - l.price;
      if (diff >= 0) {
        reasons.push(diff >= 10_000 ? `${formatPriceShort(diff)} under budget` : "Within budget");
        score += 4 - Math.abs(diff / f.maxPrice - 0.1) * 10; // sweet spot: ~10% under budget
      } else {
        misses.push(`${formatPriceShort(-diff)} over budget`);
        score -= 6;
      }
    }
    if (f.nearStation) reasons.push("Near a station");
    if (f.maxEpc) reasons.push(`EPC ${l.epc}`);
    if (f.minBedrooms && l.bedrooms > f.minBedrooms) {
      reasons.push(`Extra bedroom`);
      score += 1;
    }
    if (epcRank(l.epc) <= 1) score += 1;
    return { listing: l, score, reasons, misses };
  });

  scored.sort((a, b) => b.score - a.score || a.listing.price - b.listing.price);
  return { matches: scored.slice(0, limit), total: scored.length };
}
