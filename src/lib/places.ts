/** Cities we have listings for, with the names people actually type (NL / FR / EN). */
export const CITY_ALIASES: Record<string, string[]> = {
  Gent: ["gent", "ghent", "gand"],
  Antwerpen: ["antwerpen", "antwerp", "anvers"],
  Brussel: ["brussel", "brussels", "bruxelles", "brussels-capital"],
  Leuven: ["leuven", "louvain"],
  Brugge: ["brugge", "bruges"],
  Mechelen: ["mechelen", "malines"],
  Liège: ["liège", "liege", "luik"],
  Namur: ["namur", "namen"],
};

/** Neighbourhoods and municipalities that belong to one of the cities above. */
export const NEIGHBOURHOODS: Record<string, string> = {
  "sint-pieters": "Gent",
  dampoort: "Gent",
  mariakerke: "Gent",
  muide: "Gent",
  zurenborg: "Antwerpen",
  berchem: "Antwerpen",
  eilandje: "Antwerpen",
  schoten: "Antwerpen",
  ixelles: "Brussel",
  elsene: "Brussel",
  "saint-gilles": "Brussel",
  "sint-gillis": "Brussel",
  etterbeek: "Brussel",
  woluwe: "Brussel",
  uccle: "Brussel",
  ukkel: "Brussel",
  schaerbeek: "Brussel",
  schaarbeek: "Brussel",
  heverlee: "Leuven",
  kessel: "Leuven",
  jambes: "Namur",
  salzinnes: "Namur",
};

/** Belgian places we recognise but have no listings for yet. */
export const KNOWN_ELSEWHERE = [
  "hasselt", "kortrijk", "aalst", "oostende", "ostend", "genk", "sint-niklaas", "roeselare",
  "charleroi", "mons", "bergen", "tournai", "doornik", "wavre", "waver", "ottignies", "arlon",
  "turnhout", "lier", "dendermonde", "knokke", "de panne", "ieper", "ypres",
];

/** Rough asking price per m² used to sanity-check a budget. Indicative 2026 figures, not market data. */
export const PRICE_PER_M2: Record<string, { apartment: number; house: number }> = {
  Gent: { apartment: 3500, house: 2900 },
  Antwerpen: { apartment: 3300, house: 2800 },
  Brussel: { apartment: 3700, house: 3300 },
  Leuven: { apartment: 3900, house: 3300 },
  Brugge: { apartment: 3300, house: 3000 },
  Mechelen: { apartment: 3300, house: 2500 },
  Liège: { apartment: 2300, house: 1700 },
  Namur: { apartment: 2700, house: 2200 },
};

export const BELGIUM_AVG = { apartment: 3200, house: 2600 };

export const CITIES = Object.keys(CITY_ALIASES);

export function cityFromWord(word: string): string | undefined {
  const w = word.toLowerCase().trim();
  for (const [city, aliases] of Object.entries(CITY_ALIASES)) {
    if (aliases.includes(w)) return city;
  }
  return NEIGHBOURHOODS[w];
}

function levenshtein(a: string, b: string): number {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
  }
  return dp[a.length][b.length];
}

/** Closest city for a likely typo ("Gend" → Gent), or undefined when nothing is close. */
export function closestCity(word: string): string | undefined {
  const w = word.toLowerCase();
  let best: { city: string; d: number } | undefined;
  for (const [city, aliases] of Object.entries(CITY_ALIASES)) {
    for (const alias of aliases) {
      const d = levenshtein(w, alias);
      if (!best || d < best.d) best = { city, d };
    }
  }
  return best && best.d <= 2 ? best.city : undefined;
}
