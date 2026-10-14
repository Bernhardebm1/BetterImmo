"use client";

import { useRef, useState } from "react";

type XY = [number, number];

/**
 * Freehand lasso over a map: press, draw a loop, let go. Hands back the loop in screen
 * pixels (relative to the layer) for the map to turn into coordinates.
 */
export function DrawLayer({ onDone, onWheel }: { onDone: (points: XY[]) => void; onWheel?: (e: React.WheelEvent<HTMLDivElement>) => void }) {
  const [points, setPoints] = useState<XY[]>([]);
  const drawing = useRef(false);

  const at = (e: React.PointerEvent<HTMLDivElement>): XY => {
    const r = e.currentTarget.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top];
  };

  const finish = () => {
    if (!drawing.current) return;
    drawing.current = false;
    const xs = points.map((p) => p[0]);
    const ys = points.map((p) => p[1]);
    const big = points.length > 6 && Math.max(...xs) - Math.min(...xs) > 24 && Math.max(...ys) - Math.min(...ys) > 24;
    if (big) onDone(simplify(points));
    setPoints([]);
  };

  return (
    <div
      className="absolute inset-0 z-20 cursor-crosshair touch-none"
      onWheel={onWheel}
      onPointerDown={(e) => {
        e.stopPropagation();
        e.currentTarget.setPointerCapture(e.pointerId);
        drawing.current = true;
        setPoints([at(e)]);
      }}
      onPointerMove={(e) => {
        if (!drawing.current) return;
        const p = at(e);
        setPoints((prev) => {
          const last = prev[prev.length - 1];
          return last && Math.hypot(p[0] - last[0], p[1] - last[1]) < 4 ? prev : [...prev, p];
        });
      }}
      onPointerUp={finish}
      onPointerCancel={finish}
    >
      {points.length > 1 && (
        <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden>
          <path
            d={`M${points.map((p) => p.join(" ")).join(" L")}`}
            fill="var(--brick)"
            fillOpacity={0.08}
            stroke="var(--brick)"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </div>
  );
}

/** Keep the outline but drop points closer than a few pixels, capped at 80 points. */
function simplify(points: XY[]): XY[] {
  const out: XY[] = [];
  for (const p of points) {
    const last = out[out.length - 1];
    if (!last || Math.hypot(p[0] - last[0], p[1] - last[1]) >= 8) out.push(p);
  }
  if (out.length <= 80) return out;
  const step = out.length / 80;
  return Array.from({ length: 80 }, (_, i) => out[Math.floor(i * step)]);
}

/** Smooth closed SVG path through screen points, for showing a drawn area. */
export function areaPath(points: XY[]): string {
  if (points.length < 3) return "";
  const n = points.length;
  let d = `M${points[0][0].toFixed(1)} ${points[0][1].toFixed(1)}`;
  for (let i = 0; i < n; i++) {
    const a = points[(i - 1 + n) % n];
    const b = points[i];
    const c = points[(i + 1) % n];
    const e = points[(i + 2) % n];
    const c1 = [b[0] + (c[0] - a[0]) / 6, b[1] + (c[1] - a[1]) / 6];
    const c2 = [c[0] - (e[0] - b[0]) / 6, c[1] - (e[1] - b[1]) / 6];
    d += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${c[0].toFixed(1)} ${c[1].toFixed(1)}`;
  }
  return d + "Z";
}
