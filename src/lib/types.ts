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
  /** An area the buyer drew on the map, as [lng, lat] points. Replaces cities while set. */
  area?: [number, number][];
};

export const EMPTY_FILTERS: Filters = { cities: [], types: [], features: [] };

/** The follow-ups we ask after the first message, in order. */
export const TOPICS = ["location", "budget", "type", "bedrooms", "musts"] as const;
export type Topic = (typeof TOPICS)[number];

export type Question = {
  text: string;
  /** Each option is a short label; picking one sends it back as the buyer's answer. */
  options: string[];
  /** Set on the follow-ups we ask ourselves, so they are only asked once. */
  topic?: Topic;
  /** The buyer can pick several options before sending. */
  multi?: boolean;
};

/** Option that opens the map to draw an area instead of sending text. */
export const DRAW_OPTION = "Draw on the map";

export type SearchTurn = { role: "buyer" | "assistant"; text: string };

export type SearchResponse = {
  filters: Filters;
  reply: string;
  question: Question | null;
  source: "claude" | "local";
  /** During the follow-ups: we know enough to show homes. */
  ready?: boolean;
};
