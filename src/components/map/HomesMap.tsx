"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import clsx from "clsx";
import type { Map as MapLibreMap, StyleSpecification } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { BelgiumMap, PinDot, ZoomControls, type MapProps } from "./BelgiumMap";
import { DrawLayer, areaPath } from "./DrawLayer";

/**
 * Street map from OpenFreeMap (free, no key, OpenStreetMap data), styled to match the
 * site. If the tiles can't load (offline, blocked, no WebGL), it falls back to our own
 * SVG map of Belgium so there is always a map.
 */
export function HomesMap(props: MapProps) {
  const [failed, setFailed] = useState(false);
  if (failed) return <BelgiumMap {...props} />;
  return <VectorMap {...props} onFail={() => setFailed(true)} />;
}

const TILES = "https://tiles.openfreemap.org/planet";
const GLYPHS = "https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf";
const BELGIUM: [[number, number], [number, number]] = [[2.5, 49.5], [6.4, 51.5]];

const DARK = "(prefers-color-scheme: dark)";
function useDark() {
  return useSyncExternalStore(
    (l) => {
      const m = matchMedia(DARK);
      m.addEventListener("change", l);
      return () => m.removeEventListener("change", l);
    },
    () => matchMedia(DARK).matches,
    () => false,
  );
}

/** Colours sampled from the reference designs. */
const PALETTE = {
  light: { land: "#f6f3ed", water: "#dfe7ec", park: "#eef0e6", road: "#ffffff", roadCase: "#e6e1d8", minor: "#ece8e0", building: "#efebe4", border: "#c9c3b8", label: "#3d434c", halo: "#f6f3ed" },
  dark: { land: "#252d31", water: "#161d20", park: "#232c2d", road: "#3c464b", roadCase: "#252d31", minor: "#30393d", building: "#2c3539", border: "#4a5559", label: "#eeebe6", halo: "#252d31" },
};

function mapStyle(dark: boolean): StyleSpecification {
  const c = dark ? PALETTE.dark : PALETTE.light;
  const name = ["coalesce", ["get", "name:nl"], ["get", "name:latin"], ["get", "name"]] as unknown as string;
  return {
    version: 8,
    glyphs: GLYPHS,
    sources: { omt: { type: "vector", url: TILES, attribution: '<a href="https://openfreemap.org">OpenFreeMap</a> © <a href="https://www.openmaptiles.org/">OpenMapTiles</a> © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' } },
    layers: [
      { id: "land", type: "background", paint: { "background-color": c.land } },
      { id: "park", type: "fill", source: "omt", "source-layer": "park", paint: { "fill-color": c.park, "fill-opacity": 0.7 } },
      { id: "wood", type: "fill", source: "omt", "source-layer": "landcover", filter: ["==", ["get", "class"], "wood"], paint: { "fill-color": c.park, "fill-opacity": 0.6 } },
      { id: "water", type: "fill", source: "omt", "source-layer": "water", paint: { "fill-color": c.water } },
      {
        id: "waterway",
        type: "line",
        source: "omt",
        "source-layer": "waterway",
        paint: { "line-color": c.water, "line-width": ["interpolate", ["linear"], ["zoom"], 8, 0.6, 14, 3] },
      },
      { id: "building", type: "fill", source: "omt", "source-layer": "building", minzoom: 14, paint: { "fill-color": c.building } },
      {
        id: "minor",
        type: "line",
        source: "omt",
        "source-layer": "transportation",
        minzoom: 11,
        filter: ["in", ["get", "class"], ["literal", ["minor", "service", "tertiary"]]],
        layout: { "line-cap": "round", "line-join": "round" },
        paint: { "line-color": c.minor, "line-width": ["interpolate", ["exponential", 1.5], ["zoom"], 11, 0.4, 16, 5] },
      },
      {
        id: "roads",
        type: "line",
        source: "omt",
        "source-layer": "transportation",
        filter: ["in", ["get", "class"], ["literal", ["primary", "secondary"]]],
        layout: { "line-cap": "round", "line-join": "round" },
        paint: { "line-color": c.road, "line-width": ["interpolate", ["exponential", 1.5], ["zoom"], 7, 0.4, 16, 8] },
      },
      {
        id: "motorways",
        type: "line",
        source: "omt",
        "source-layer": "transportation",
        filter: ["in", ["get", "class"], ["literal", ["motorway", "trunk"]]],
        layout: { "line-cap": "round", "line-join": "round" },
        paint: { "line-color": c.road, "line-width": ["interpolate", ["exponential", 1.5], ["zoom"], 6, 0.6, 16, 10] },
      },
      {
        id: "rail",
        type: "line",
        source: "omt",
        "source-layer": "transportation",
        minzoom: 9,
        filter: ["==", ["get", "class"], "rail"],
        paint: { "line-color": c.roadCase, "line-width": 1, "line-dasharray": [3, 3] },
      },
      {
        id: "border",
        type: "line",
        source: "omt",
        "source-layer": "boundary",
        filter: ["all", ["==", ["get", "admin_level"], 2], ["!=", ["get", "maritime"], 1]],
        paint: { "line-color": c.border, "line-width": 1, "line-dasharray": [4, 3] },
      },
      {
        id: "places",
        type: "symbol",
        source: "omt",
        "source-layer": "place",
        filter: ["in", ["get", "class"], ["literal", ["city", "town"]]],
        layout: {
          "text-field": name,
          "text-font": ["Noto Sans Regular"],
          "text-size": ["interpolate", ["linear"], ["zoom"], 6, ["match", ["get", "class"], "city", 13, 11], 12, ["match", ["get", "class"], "city", 17, 14]],
          "text-anchor": "left",
          "text-offset": [0.6, -0.6],
          "symbol-sort-key": ["match", ["get", "class"], "city", 0, 1],
        },
        paint: { "text-color": c.label, "text-halo-color": c.halo, "text-halo-width": 1.2 },
      },
      {
        id: "neighbourhoods",
        type: "symbol",
        source: "omt",
        "source-layer": "place",
        minzoom: 12,
        filter: ["in", ["get", "class"], ["literal", ["suburb", "quarter", "neighbourhood"]]],
        layout: { "text-field": name, "text-font": ["Noto Sans Regular"], "text-size": 11, "text-transform": "uppercase", "text-letter-spacing": 0.12 },
        paint: { "text-color": c.label, "text-opacity": 0.55, "text-halo-color": c.halo, "text-halo-width": 1 },
      },
    ],
  };
}

function VectorMap({ pins, active, onHover, onSelect, interactive = true, className, area, drawing, onDraw, onFail }: MapProps & { onFail: () => void }) {
  const box = useRef<HTMLDivElement>(null);
  const map = useRef<MapLibreMap | null>(null);
  // The live map, once it has loaded; kept in state so render can place the pins.
  const [m, setM] = useState<MapLibreMap | null>(null);
  const [, setFrame] = useState(0);
  const dark = useDark();
  const fail = useRef(onFail);
  useEffect(() => {
    fail.current = onFail;
  });

  useEffect(() => {
    let cancelled = false;
    let loaded = false;
    const timer = setTimeout(() => !loaded && fail.current(), 9000);
    (async () => {
      const { default: maplibregl } = await import("maplibre-gl");
      if (cancelled || !box.current) return;
      try {
        const m = new maplibregl.Map({
          container: box.current,
          style: mapStyle(matchMedia(DARK).matches),
          bounds: BELGIUM,
          attributionControl: { compact: true },
          scrollZoom: interactive,
          dragRotate: false,
          pitchWithRotate: false,
          touchPitch: false,
        });
        map.current = m;
        m.touchZoomRotate.disableRotation();
        // Tiles or the tile index failing before anything rendered means we fall back.
        m.on("error", () => !loaded && fail.current());
        m.on("load", () => {
          loaded = true;
          clearTimeout(timer);
          setM(m);
        });
        m.on("move", () => setFrame((f) => f + 1));
        m.on("resize", () => setFrame((f) => f + 1));
      } catch {
        fail.current();
      }
    })();
    return () => {
      cancelled = true;
      clearTimeout(timer);
      map.current?.remove();
      map.current = null;
      setM(null);
    };
  }, [interactive]);

  // Follow the system theme.
  useEffect(() => {
    m?.setStyle(mapStyle(dark));
  }, [dark, m]);

  // While drawing, a drag draws instead of panning.
  useEffect(() => {
    if (!m) return;
    if (drawing) m.dragPan.disable();
    else if (interactive) m.dragPan.enable();
  }, [m, drawing, interactive]);

  // Glide to fit the pins (and any drawn area) whenever they change.
  const fitKey = pins.map((p) => p.id).join(",") + (area ? area.length + ":" + area[0].join() : "");
  useEffect(() => {
    if (!m || (!pins.length && !area)) return;
    const lngs = [...pins.map((p) => p.lng), ...(area ?? []).map((p) => p[0])];
    const lats = [...pins.map((p) => p.lat), ...(area ?? []).map((p) => p[1])];
    const pad = Math.min(90, Math.round(Math.min(m.getContainer().clientWidth, m.getContainer().clientHeight) / 5));
    m.fitBounds(
      [
        [Math.min(...lngs), Math.min(...lats)],
        [Math.max(...lngs), Math.max(...lats)],
      ],
      { padding: pad, maxZoom: pins.length === 1 ? 13 : 12.5, duration: 1400, essential: true },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refit when the set of pins changes
  }, [fitKey, m]);

  return (
    <div className={clsx("relative overflow-hidden bg-[var(--map-land)]", className)}>
      {/* MapLibre makes its container position: relative, so size it with h/w rather than inset. */}
      <div ref={box} className="h-full w-full" />
      {m && area && (
        <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden>
          <path
            d={areaPath(area.map(([lng, lat]) => { const p = m.project([lng, lat]); return [p.x, p.y]; }))}
            fill="var(--brick)"
            fillOpacity={0.1}
            stroke="var(--brick)"
            strokeWidth={2}
            strokeDasharray="6 5"
          />
        </svg>
      )}
      {m && (
        <div className="pointer-events-none absolute inset-0">
          {pins.map((p) => {
            const { x, y } = m.project([p.lng, p.lat]);
            return (
              <div key={p.id} className="absolute left-0 top-0" style={{ transform: `translate(${x}px, ${y}px)`, zIndex: p.id === active ? 20 : 10 }}>
                <PinDot label={p.label} active={p.id === active} onHover={(on) => onHover?.(on ? p.id : null)} onSelect={() => onSelect?.(p.id)} />
              </div>
            );
          })}
        </div>
      )}
      {m && drawing && (
        <DrawLayer
          onDone={(pts) => onDraw?.(pts.map(([x, y]) => { const ll = m.unproject([x, y]); return [ll.lng, ll.lat]; }))}
          onWheel={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            m.easeTo({ zoom: m.getZoom() - e.deltaY * 0.004, around: m.unproject([e.clientX - r.left, e.clientY - r.top]), duration: 120 });
          }}
        />
      )}
      {interactive && m && <ZoomControls onIn={() => m.zoomIn()} onOut={() => m.zoomOut()} />}
    </div>
  );
}
