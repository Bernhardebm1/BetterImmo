import { MAP } from "./geometry";

/** Same Mercator as the generated outlines, so pins land on the right streets. */
export function project(lat: number, lng: number): [number, number] {
  const λ = (lng * Math.PI) / 180;
  const φ = (lat * Math.PI) / 180;
  return [λ * MAP.scale + MAP.tx, -Math.log(Math.tan(Math.PI / 4 + φ / 2)) * MAP.scale + MAP.ty];
}

/** Smooth path through points (Catmull-Rom as cubic Béziers). */
function smooth(points: [number, number][]): string {
  const p = points.map(([lat, lng]) => project(lat, lng));
  let d = `M${p[0][0].toFixed(1)} ${p[0][1].toFixed(1)}`;
  for (let i = 0; i < p.length - 1; i++) {
    const a = p[i - 1] ?? p[i];
    const b = p[i];
    const c = p[i + 1];
    const e = p[i + 2] ?? c;
    const c1 = [b[0] + (c[0] - a[0]) / 6, b[1] + (c[1] - a[1]) / 6];
    const c2 = [c[0] - (e[0] - b[0]) / 6, c[1] - (e[1] - b[1]) / 6];
    d += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${c[0].toFixed(1)} ${c[1].toFixed(1)}`;
  }
  return d;
}

/** Main motorways, roughly traced through the towns they connect. Texture, not navigation. */
export const ROADS = [
  // E40 Oostende – Brugge – Gent – Brussel – Leuven – Liège – Aachen
  [[51.215, 2.92], [51.19, 3.22], [51.11, 3.5], [51.03, 3.7], [50.93, 4.05], [50.87, 4.4], [50.86, 4.7], [50.75, 5.1], [50.64, 5.57], [50.77, 6.08]],
  // E19 Valenciennes – Mons – Brussel – Mechelen – Antwerpen – Breda
  [[50.36, 3.52], [50.45, 3.95], [50.62, 4.2], [50.85, 4.35], [51.03, 4.47], [51.2, 4.43], [51.4, 4.6], [51.58, 4.78]],
  // E17 Lille – Kortrijk – Gent – Antwerpen
  [[50.63, 3.06], [50.82, 3.27], [50.95, 3.5], [51.06, 3.75], [51.15, 4.1], [51.21, 4.4]],
  // E411 Brussel – Namur – Arlon – Luxembourg
  [[50.81, 4.43], [50.65, 4.62], [50.47, 4.87], [50.2, 5.15], [49.9, 5.5], [49.68, 5.81], [49.61, 6.13]],
  // E42 Mons – Charleroi – Namur – Liège
  [[50.45, 3.95], [50.41, 4.44], [50.47, 4.87], [50.55, 5.2], [50.64, 5.57]],
  // E313 Antwerpen – Hasselt – Liège
  [[51.2, 4.45], [51.15, 4.8], [50.93, 5.33], [50.78, 5.48], [50.65, 5.57]],
  // E34 Antwerpen – Turnhout – Eindhoven
  [[51.21, 4.47], [51.32, 4.95], [51.44, 5.47]],
  // E25 Liège – Bastogne – Luxembourg
  [[50.6, 5.6], [50.3, 5.65], [50.0, 5.72], [49.75, 5.95], [49.61, 6.13]],
  // E40 Brugge – Kortrijk link and E403
  [[51.19, 3.22], [51.0, 3.2], [50.82, 3.27], [50.6, 3.39]],
].map((r) => smooth(r as [number, number][]));

export const RIVERS = [
  // Scheldt: Valenciennes – Tournai – Gent – Antwerpen – Westerschelde
  [[50.35, 3.4], [50.61, 3.39], [50.85, 3.6], [51.05, 3.73], [51.03, 4.1], [51.12, 4.25], [51.23, 4.4], [51.35, 4.25], [51.42, 3.9], [51.44, 3.6]],
  // Meuse: Charleville – Dinant – Namur – Liège – Maastricht – north
  [[49.8, 4.75], [50.06, 4.83], [50.26, 4.91], [50.46, 4.87], [50.52, 5.24], [50.63, 5.57], [50.85, 5.69], [51.1, 5.85], [51.45, 5.95]],
  // Sambre: Charleroi – Namur
  [[50.3, 4.1], [50.41, 4.44], [50.46, 4.87]],
].map((r) => smooth(r as [number, number][]));

export const CITIES: { name: string; lat: number; lng: number; major?: boolean }[] = [
  { name: "Brussel", lat: 50.8466, lng: 4.3528, major: true },
  { name: "Antwerpen", lat: 51.2194, lng: 4.4025, major: true },
  { name: "Gent", lat: 51.0543, lng: 3.7174, major: true },
  { name: "Brugge", lat: 51.2093, lng: 3.2247 },
  { name: "Leuven", lat: 50.8798, lng: 4.7005 },
  { name: "Mechelen", lat: 51.0259, lng: 4.4776 },
  { name: "Liège", lat: 50.6326, lng: 5.5797, major: true },
  { name: "Namur", lat: 50.4674, lng: 4.8718 },
  { name: "Charleroi", lat: 50.4108, lng: 4.4446 },
  { name: "Hasselt", lat: 50.9307, lng: 5.3325 },
  { name: "Kortrijk", lat: 50.828, lng: 3.2649 },
  { name: "Oostende", lat: 51.2154, lng: 2.9286 },
  { name: "Mons", lat: 50.4542, lng: 3.9567 },
  { name: "Arlon", lat: 49.6833, lng: 5.8167 },
];

export const REGIONS: { name: string; lat: number; lng: number }[] = [
  { name: "Nederland", lat: 51.62, lng: 5.2 },
  { name: "France", lat: 49.75, lng: 3.6 },
  { name: "Deutschland", lat: 50.45, lng: 6.55 },
  { name: "Noordzee", lat: 51.5, lng: 2.75 },
];
