import type { Listing } from "./types";

// Sample data until the CRM connectors (Whise, Omnicasa, Zabun, Skarabee) feed real listings.
// Agencies, addresses and prices are invented.

const img = (id: string) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1400&q=80`;

const HOUSES = [
  "1600596542815-ffad4c1539a9",
  "1600585154340-be6161a56a0c",
  "1568605114967-8130f3a36994",
  "1570129477492-45c003edd2be",
  "1564013799919-ab600027ffc6",
  "1580587771525-78b9dba3b914",
  "1613490493576-7fde63acd811",
  "1600607687939-ce8a6c25118c",
  "1605276374104-dee2a0ed3cd6",
  "1600047509807-ba8f99d2cdde",
  "1558036117-15d82a90b9b1",
  "1449844908441-8829872d2607",
];

const INTERIORS = [
  "1502672260266-1c1ef2d93688",
  "1560448204-e02f11c3d0e2",
  "1493809842364-78817add7ffb",
  "1522708323590-d24dbb6b0267",
  "1505691938895-1758d7feb511",
  "1484154218962-a197022b5858",
  "1554995207-c18c203602cb",
  "1586023492125-27b2c045efd7",
  "1600566753190-17f0baa2a6c3",
  "1512917774080-9991f1c4c750",
];

/** Six photos per home: the lead shot, then interiors, with a second exterior in the mix. */
function gallery(i: number, exteriorFirst: boolean): string[] {
  const outside = HOUSES[i % HOUSES.length];
  const inside = [0, 3, 6, 8].map((n) => INTERIORS[(i + n) % INTERIORS.length]);
  const second = HOUSES[(i + 5) % HOUSES.length];
  const lead = exteriorFirst ? [outside, inside[0]] : [inside[0], outside];
  return [...lead, inside[1], second, inside[2], inside[3]].map(img);
}

type Seed = Omit<Listing, "id" | "images" | "status"> & { status?: Listing["status"] };

const SEEDS: Seed[] = [
  {
    title: "Bright corner apartment with south terrace",
    type: "apartment", city: "Gent", neighbourhood: "Sint-Pieters",
    street: "Sint-Denijslaan", lat: 51.0362, lng: 3.7098,
    price: 345000, bedrooms: 2, bathrooms: 1, area: 92, epc: "B",
    features: ["terrace", "elevator", "cellar"], nearStation: true, yearBuilt: 2014,
    summary: "Five minutes on foot from Gent-Sint-Pieters. Open kitchen, two quiet bedrooms at the back and a 12 m² terrace that gets the afternoon sun.",
    agency: "Atelier Wonen",
  },
  {
    title: "Renovated townhouse with city garden",
    type: "house", city: "Gent", neighbourhood: "Muide-Meulestede",
    street: "Meulestedekaai", lat: 51.0718, lng: 3.7262,
    price: 429000, bedrooms: 3, bathrooms: 2, area: 158, plot: 140, epc: "C",
    features: ["garden", "cellar"], nearStation: false, yearBuilt: 1925,
    summary: "A 1920s worker's house renovated top to bottom in 2021. High ceilings, original tiles in the hall and a walled garden facing west.",
    agency: "Huis & Haard",
  },
  {
    title: "Loft in a converted textile mill",
    type: "loft", city: "Gent", neighbourhood: "Dampoort",
    street: "Dampoortstraat", lat: 51.0566, lng: 3.7398,
    price: 395000, bedrooms: 2, bathrooms: 1, area: 124, epc: "B",
    features: ["elevator", "parking"], nearStation: true, yearBuilt: 2009,
    summary: "Four-metre ceilings, steel windows and a mezzanine office. Underground parking space included.",
    agency: "Atelier Wonen",
  },
  {
    title: "Family house near the Bourgoyen nature reserve",
    type: "house", city: "Gent", neighbourhood: "Mariakerke",
    street: "Driesstraat", lat: 51.0712, lng: 3.6755,
    price: 515000, bedrooms: 4, bathrooms: 2, area: 196, plot: 520, epc: "A",
    features: ["garden", "garage", "terrace"], nearStation: false, yearBuilt: 2019,
    summary: "Recent build with a heat pump and solar panels. Large garden, double garage and cycling distance to the centre.",
    agency: "Leie Vastgoed",
  },
  {
    title: "Compact studio by the Korenmarkt",
    type: "studio", city: "Gent", neighbourhood: "Centrum",
    street: "Korenmarkt", lat: 51.0546, lng: 3.7212,
    price: 189000, bedrooms: 0, bathrooms: 1, area: 38, epc: "C",
    features: ["elevator"], nearStation: false, yearBuilt: 1978,
    summary: "Well-kept studio in the historic centre. Ideal first purchase or pied-à-terre.",
    agency: "Huis & Haard",
  },
  {
    title: "Art deco apartment on the Cogels-Osylei",
    type: "apartment", city: "Antwerpen", neighbourhood: "Zurenborg",
    street: "Cogels-Osylei", lat: 51.2062, lng: 4.4298,
    price: 465000, bedrooms: 3, bathrooms: 1, area: 128, epc: "D",
    features: ["balcony", "cellar"], nearStation: true, yearBuilt: 1906,
    summary: "Stained glass, parquet and a front balcony on Antwerp's most photographed street. Berchem station is a short walk.",
    agency: "Scheldehuis",
  },
  {
    title: "New-build flat on the Eilandje docks",
    type: "apartment", city: "Antwerpen", neighbourhood: "Eilandje",
    street: "Londenstraat", lat: 51.2318, lng: 4.4052,
    price: 389000, bedrooms: 2, bathrooms: 2, area: 96, epc: "A",
    features: ["terrace", "elevator", "parking"], nearStation: false, yearBuilt: 2023,
    summary: "Floor-to-ceiling windows over the Willemdok. Two en-suite bedrooms and a covered terrace.",
    agency: "Scheldehuis",
  },
  {
    title: "Terraced house with deep garden",
    type: "house", city: "Antwerpen", neighbourhood: "Berchem",
    street: "Driekoningenstraat", lat: 51.1928, lng: 4.4187,
    price: 449000, bedrooms: 3, bathrooms: 1, area: 165, plot: 210, epc: "C",
    features: ["garden", "cellar"], nearStation: true, yearBuilt: 1932,
    summary: "Classic Berchem townhouse with a 25 m deep garden and a sunny kitchen extension.",
    agency: "Noord Makelaars",
  },
  {
    title: "Starter apartment near Park Spoor Noord",
    type: "apartment", city: "Antwerpen", neighbourhood: "Dam",
    street: "Viaductdam", lat: 51.2335, lng: 4.4268,
    price: 239000, bedrooms: 1, bathrooms: 1, area: 64, epc: "B",
    features: ["balcony", "elevator"], nearStation: false, yearBuilt: 2016,
    summary: "Efficient one-bedroom with a balcony over the park. Low service charges.",
    agency: "Noord Makelaars",
  },
  {
    title: "Villa with pool in the green belt",
    type: "villa", city: "Antwerpen", neighbourhood: "Schoten",
    street: "Kasteeldreef", lat: 51.2521, lng: 4.5018,
    price: 895000, bedrooms: 5, bathrooms: 3, area: 310, plot: 1800, epc: "B",
    features: ["garden", "garage", "terrace"], nearStation: false, yearBuilt: 2005,
    summary: "Architect-designed villa on a wooded plot with a heated pool and a separate home office.",
    agency: "Scheldehuis",
  },
  {
    title: "Maison de maître with a garden in Ixelles",
    type: "house", city: "Brussel", neighbourhood: "Elsene",
    street: "Rue du Lac", lat: 50.8268, lng: 4.3714,
    price: 1150000, bedrooms: 5, bathrooms: 3, area: 330, plot: 260, epc: "D",
    features: ["garden", "cellar", "terrace"], nearStation: false, yearBuilt: 1898,
    summary: "Grand mansion near the Flagey ponds with mouldings, fireplaces and a south-facing garden.",
    agency: "Maison Lumière",
  },
  {
    title: "Two-bed apartment near Place Flagey",
    type: "apartment", city: "Brussel", neighbourhood: "Elsene",
    street: "Place Flagey", lat: 50.8312, lng: 4.3722,
    price: 410000, bedrooms: 2, bathrooms: 1, area: 88, epc: "C",
    features: ["balcony", "elevator", "cellar"], nearStation: false, yearBuilt: 1962,
    summary: "Renovated apartment on the fourth floor with views over the ponds. Trams to the centre at the door.",
    agency: "Maison Lumière",
  },
  {
    title: "Penthouse with wraparound terrace",
    type: "apartment", city: "Brussel", neighbourhood: "Sint-Gillis",
    street: "Rue de la Victoire", lat: 50.8282, lng: 4.3462,
    price: 625000, bedrooms: 3, bathrooms: 2, area: 132, epc: "B",
    features: ["terrace", "elevator", "parking"], nearStation: true, yearBuilt: 2018,
    summary: "Top-floor apartment with a 40 m² terrace and views to the Atomium. Ten minutes from Brussels-South.",
    agency: "Capitale Immo",
  },
  {
    title: "Family house in leafy Woluwe",
    type: "house", city: "Brussel", neighbourhood: "Sint-Pieters-Woluwe",
    street: "Avenue de Tervueren", lat: 50.8355, lng: 4.4302,
    price: 745000, bedrooms: 4, bathrooms: 2, area: 220, plot: 450, epc: "C",
    features: ["garden", "garage"], nearStation: false, yearBuilt: 1958,
    summary: "Detached family house a short walk from the Woluwe park, with a garage and a mature garden.",
    agency: "Capitale Immo",
  },
  {
    title: "Studio near the European Quarter",
    type: "studio", city: "Brussel", neighbourhood: "Etterbeek",
    street: "Rue Froissart", lat: 50.8378, lng: 4.3852,
    price: 215000, bedrooms: 0, bathrooms: 1, area: 41, epc: "C",
    features: ["elevator"], nearStation: true, yearBuilt: 1985,
    summary: "Furnished-ready studio close to Schuman. Strong rental demand in the area.",
    agency: "Maison Lumière",
  },
  {
    title: "Modern apartment by the Vaartkom",
    type: "apartment", city: "Leuven", neighbourhood: "Vaartkom",
    street: "Vaartkom", lat: 50.8891, lng: 4.7052,
    price: 375000, bedrooms: 2, bathrooms: 1, area: 89, epc: "A",
    features: ["terrace", "elevator", "parking"], nearStation: true, yearBuilt: 2021,
    summary: "Quiet two-bed in the redeveloped canal district, with a terrace and a parking space. Leuven station on foot.",
    agency: "Dijle Woningen",
  },
  {
    title: "Townhouse with garden in Heverlee",
    type: "house", city: "Leuven", neighbourhood: "Heverlee",
    street: "Naamsesteenweg", lat: 50.8661, lng: 4.6951,
    price: 559000, bedrooms: 3, bathrooms: 2, area: 172, plot: 260, epc: "B",
    features: ["garden", "terrace"], nearStation: false, yearBuilt: 1974,
    summary: "Renovated semi-detached house near the Arenberg campus and the Heverlee woods.",
    agency: "Dijle Woningen",
  },
  {
    title: "Canal-side house with original beams",
    type: "house", city: "Brugge", neighbourhood: "Sint-Anna",
    street: "Potterierei", lat: 51.2132, lng: 3.2352,
    price: 485000, bedrooms: 3, bathrooms: 1, area: 150, plot: 110, epc: "D",
    features: ["garden", "cellar"], nearStation: false, yearBuilt: 1750,
    summary: "Listed 18th-century house with exposed beams, a small courtyard garden and views over the canal.",
    agency: "Reie Vastgoed",
  },
  {
    title: "Apartment near Brugge station",
    type: "apartment", city: "Brugge", neighbourhood: "Sint-Michiels",
    street: "Spoorwegstraat", lat: 51.1902, lng: 3.2148,
    price: 279000, bedrooms: 2, bathrooms: 1, area: 82, epc: "B",
    features: ["balcony", "elevator", "parking"], nearStation: true, yearBuilt: 2012,
    summary: "Practical two-bed with a parking space, a few minutes' walk from the station.",
    agency: "Reie Vastgoed",
  },
  {
    title: "Family home with large garden",
    type: "house", city: "Mechelen", neighbourhood: "Nekkerspoel",
    street: "Nekkerspoelstraat", lat: 51.0302, lng: 4.4902,
    price: 419000, bedrooms: 4, bathrooms: 1, area: 180, plot: 400, epc: "C",
    features: ["garden", "garage"], nearStation: true, yearBuilt: 1965,
    summary: "Spacious house close to Mechelen-Nekkerspoel station, 20 minutes from Brussels and Antwerp.",
    agency: "Dijlestad Immo",
  },
  {
    title: "Riverside apartment on the Dijle",
    type: "apartment", city: "Mechelen", neighbourhood: "Centrum",
    street: "Haverwerf", lat: 51.0272, lng: 4.4778,
    price: 319000, bedrooms: 2, bathrooms: 1, area: 85, epc: "A",
    features: ["terrace", "elevator"], nearStation: false, yearBuilt: 2020,
    summary: "Recent apartment with a terrace over the Dijle and the Vlietjes walking routes on your doorstep.",
    agency: "Dijlestad Immo",
  },
  {
    title: "Maison de maître in the Carré",
    type: "house", city: "Liège", neighbourhood: "Centre",
    street: "Rue Louvrex", lat: 50.6382, lng: 5.5622,
    price: 295000, bedrooms: 4, bathrooms: 2, area: 215, plot: 120, epc: "E",
    features: ["garden", "cellar"], nearStation: false, yearBuilt: 1890,
    summary: "Characterful mansion with high ceilings and a city garden. Some updating needed, priced accordingly.",
    agency: "Meuse Habitat",
  },
  {
    title: "Apartment with views over the Meuse",
    type: "apartment", city: "Namur", neighbourhood: "Jambes",
    street: "Boulevard de la Meuse", lat: 50.4568, lng: 4.8742,
    price: 249000, bedrooms: 2, bathrooms: 1, area: 90, epc: "B",
    features: ["balcony", "elevator", "parking"], nearStation: true, yearBuilt: 2015,
    summary: "Bright apartment facing the Citadel with a parking space and a balcony over the river.",
    agency: "Meuse Habitat",
  },
  {
    title: "Semi-detached house with garden",
    type: "house", city: "Namur", neighbourhood: "Salzinnes",
    street: "Rue de Gembloux", lat: 50.4688, lng: 4.8452,
    price: 339000, bedrooms: 3, bathrooms: 1, area: 155, plot: 300, epc: "C",
    features: ["garden", "garage"], nearStation: false, yearBuilt: 1972,
    summary: "Quiet street, garden with a view of the Sambre valley and a garage.",
    agency: "Meuse Habitat",
    status: "under_offer",
  },
];

export const LISTINGS: Listing[] = SEEDS.map((seed, i) => ({
  ...seed,
  id: `be-${String(i + 1).padStart(3, "0")}`,
  images: gallery(i, seed.type !== "apartment" && seed.type !== "studio" && seed.type !== "loft"),
  status: seed.status ?? "available",
}));

export function getListing(id: string): Listing | undefined {
  return LISTINGS.find((l) => l.id === id);
}
