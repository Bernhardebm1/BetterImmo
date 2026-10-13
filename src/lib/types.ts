export const PROPERTY_TYPES = ["apartment", "house", "studio", "loft", "villa"] as const;
export type PropertyType = (typeof PROPERTY_TYPES)[number];

export const FEATURES = [
  "garden",
  "terrace",
  "balcony",
  "parking",
  "garage",
  "elevator",
  "cellar",
] as const;
export type Feature = (typeof FEATURES)[number];

export const EPC_LABELS = ["A", "B", "C", "D", "E", "F"] as const;
export type EpcLabel = (typeof EPC_LABELS)[number];

export type Listing = {
  id: string;
  title: string;
  /** Street name only; the house number is shared once a viewing is booked. */
  street: string;
  type: PropertyType;
  city: string;
  neighbourhood: string;
  lat: number;
  lng: number;
  price: number;
  bedrooms: number;
  bathrooms: number;
  area: number;
  plot?: number;
  epc: EpcLabel;
  features: Feature[];
  nearStation: boolean;
  yearBuilt: number;
  images: string[];
  summary: string;
  agency: string;
  status: "available" | "under_offer";
};

/** What the buyer is looking for. Every field is optional: missing means "no preference". */
export type Filters = {
  cities: string[];
  types: PropertyType[];
  minPrice?: number;
  maxPrice?: number;
  minBedrooms?: number;
  minArea?: number;
  features: Feature[];
  maxEpc?: EpcLabel;
  nearStation?: boolean;
};

export const EMPTY_FILTERS: Filters = { cities: [], types: [], features: [] };

export type Question = {
  text: string;
  /** Each option is a short label; picking one sends it back as the buyer's answer. */
  options: string[];
};

export type SearchTurn = { role: "buyer" | "assistant"; text: string };

export type SearchResponse = {
  filters: Filters;
  reply: string;
  question: Question | null;
  source: "claude" | "local";
};
