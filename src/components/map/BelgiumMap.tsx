"use client";

import { AnimatePresence, motion, useMotionValue, useSpring, useTransform, type MotionValue } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { Minus, Plus } from "lucide-react";
import { COUNTRIES, MAP } from "@/lib/map/geometry";
import { CITIES, REGIONS, RIVERS, ROADS, project } from "@/lib/map/project";

export type Pin = { id: string; lat: number; lng: number; label: string };

const CAMERA = { stiffness: 120, damping: 26, mass: 1 };
/** Closest zoom, in map units across the shorter side. */
const MIN_SPAN = 200;
const MAX_SPAN = 1400;

type Camera = { x: MotionValue<number>; y: MotionValue<number>; w: MotionValue<number> };

/**
 * Our own map of Belgium: real borders (Natural Earth), main motorways and rivers drawn
 * as texture, and HTML pins on top so they stay crisp at every zoom. It glides to fit
 * whatever is pinned, and can be dragged and zoomed.
 */
export function BelgiumMap({
  pins,
  active,
  onHover,
  onSelect,
  interactive = true,
  className,
}: {
  pins: Pin[];
  active?: string | null;
  onHover?: (id: string | null) => void;
  onSelect?: (id: string) => void;
  interactive?: boolean;
  className?: string;
}) {
  const box = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  // Camera: top-left corner and width of the visible area, in map units.
  const tx = useMotionValue(0);
  const ty = useMotionValue(0);
  const tw = useMotionValue(MAP.width);
  const cam: Camera = { x: useSpring(tx, CAMERA), y: useSpring(ty, CAMERA), w: useSpring(tw, CAMERA) };
  const aspect = size.h && size.w ? size.h / size.w : MAP.height / MAP.width;
  const viewBox = useTransform([cam.x, cam.y, cam.w], ([x, y, w]: number[]) => `${x} ${y} ${w} ${w * aspect}`);

  const points = useMemo(() => pins.map((p) => ({ ...p, xy: project(p.lat, p.lng) })), [pins]);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setSize({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Glide to fit the pins whenever they (or the panel size) change.
  const fitKey = points.map((p) => p.id).join(",");
  useEffect(() => {
    if (!size.w) return;
    const xs = points.map((p) => p.xy[0]);
    const ys = points.map((p) => p.xy[1]);
    let [x0, x1, y0, y1] = xs.length ? [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)] : [40, 960, 30, 730];
    const padX = Math.max(60, (x1 - x0) * 0.3);
    const padY = Math.max(60, (y1 - y0) * 0.3);
    x0 -= padX;
    x1 += padX;
    y0 -= padY;
    y1 += padY;
    let w = Math.max(x1 - x0, (y1 - y0) / aspect, MIN_SPAN / Math.min(1, aspect));
    w = Math.min(w, MAX_SPAN);
    const h = w * aspect;
    const first = tw.get() === MAP.width && tx.get() === 0;
    tx.set((x0 + x1) / 2 - w / 2);
    ty.set((y0 + y1) / 2 - h / 2);
    tw.set(w);
    if (first) {
      // First paint: start a little wider than the fit so the map settles in.
      cam.x.jump((x0 + x1) / 2 - (w * 1.25) / 2);
      cam.y.jump((y0 + y1) / 2 - (h * 1.25) / 2);
      cam.w.jump(w * 1.25);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refit on pin set or panel size only
  }, [fitKey, size.w, size.h]);

  const zoom = (factor: number, cx = 0.5, cy = 0.5) => {
    const w = tw.get();
    const nw = Math.min(MAX_SPAN, Math.max(MIN_SPAN, w * factor));
    tx.set(tx.get() + (w - nw) * cx);
    ty.set(ty.get() + (w - nw) * aspect * cy);
    tw.set(nw);
  };

  // Drag to pan, wheel to zoom around the cursor.
  const drag = useRef<{ x: number; y: number; tx: number; ty: number } | null>(null);
  useEffect(() => {
    const el = box.current;
    if (!el || !interactive) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const r = el.getBoundingClientRect();
      zoom(Math.exp(e.deltaY * 0.0022), (e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  });

  return (
    <div
      ref={box}
      className={clsx("relative overflow-hidden bg-[var(--map-sea)] select-none", interactive && "cursor-grab active:cursor-grabbing", className)}
      onPointerDown={(e) => {
        if (!interactive || (e.target as HTMLElement).closest("button")) return;
        drag.current = { x: e.clientX, y: e.clientY, tx: tx.get(), ty: ty.get() };
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        const d = drag.current;
        if (!d) return;
        const unit = size.w ? tw.get() / size.w : 1;
        tx.set(d.tx - (e.clientX - d.x) * unit);
        ty.set(d.ty - (e.clientY - d.y) * unit);
        cam.x.jump(tx.get());
        cam.y.jump(ty.get());
      }}
      onPointerUp={() => (drag.current = null)}
      onPointerCancel={() => (drag.current = null)}
    >
      <motion.svg viewBox={viewBox} preserveAspectRatio="xMidYMid meet" className="absolute inset-0 h-full w-full" aria-hidden>
        {Object.entries(COUNTRIES).map(([id, d]) => (
          <path key={id} d={d} fill={id === "be" ? "var(--map-home)" : "var(--map-land)"} stroke="var(--map-border)" strokeWidth={id === "be" ? 1.4 : 0.8} vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
        ))}
        {RIVERS.map((d, i) => (
          <path key={`r${i}`} d={d} fill="none" stroke="var(--map-river)" strokeWidth={2.2} vectorEffect="non-scaling-stroke" strokeLinecap="round" />
        ))}
        {ROADS.map((d, i) => (
          <path key={`m${i}`} d={d} fill="none" stroke="var(--map-road)" strokeWidth={1.3} vectorEffect="non-scaling-stroke" strokeLinecap="round" />
        ))}
      </motion.svg>

      {size.w > 0 && (
        <div className="pointer-events-none absolute inset-0">
          {REGIONS.map((r) => (
            <Place key={r.name} cam={cam} size={size} xy={project(r.lat, r.lng)}>
              <span className="-translate-x-1/2 font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--map-label)] opacity-60">{r.name}</span>
            </Place>
          ))}
          {CITIES.map((c) => (
            <Place key={c.name} cam={cam} size={size} xy={project(c.lat, c.lng)}>
              {/* Name sits up and to the right of the town, so pins on the town itself stay clear. */}
              <span className="flex -translate-x-[2px] -translate-y-full items-end gap-1.5">
                <span className="mb-[-2px] h-1 w-1 shrink-0 rounded-full bg-[var(--map-label)] opacity-50" />
                <span className={clsx("mb-2 whitespace-nowrap font-mono text-[var(--map-label)]", c.major ? "text-[13px]" : "text-[11px] opacity-80")}>{c.name}</span>
              </span>
            </Place>
          ))}
          {points.map((p) => (
            <Place key={p.id} cam={cam} size={size} xy={p.xy} z={p.id === active ? 20 : 10}>
              <PinDot label={p.label} active={p.id === active} onHover={(on) => onHover?.(on ? p.id : null)} onSelect={() => onSelect?.(p.id)} />
            </Place>
          ))}
        </div>
      )}

      {interactive && (
        <div className="absolute bottom-5 right-5 flex flex-col overflow-hidden rounded-full border border-line bg-paper-raised/90 shadow-card backdrop-blur">
          <button type="button" aria-label="Zoom in" onClick={() => zoom(0.7)} className="grid h-9 w-9 place-items-center text-ink-soft hover:text-ink">
            <Plus className="h-4 w-4" />
          </button>
          <span className="mx-2 h-px bg-line" />
          <button type="button" aria-label="Zoom out" onClick={() => zoom(1.4)} className="grid h-9 w-9 place-items-center text-ink-soft hover:text-ink">
            <Minus className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

/** Positions its child at a map coordinate, following the camera every frame. */
function Place({ cam, size, xy, z = 1, children }: { cam: Camera; size: { w: number; h: number }; xy: [number, number]; z?: number; children: React.ReactNode }) {
  const left = useTransform([cam.x, cam.w], ([x, w]: number[]) => ((xy[0] - x) / w) * size.w);
  const top = useTransform([cam.y, cam.w], ([y, w]: number[]) => ((xy[1] - y) / w) * size.w);
  return (
    <motion.div className="absolute left-0 top-0" style={{ x: left, y: top, zIndex: z }}>
      {children}
    </motion.div>
  );
}

function PinDot({ label, active, onHover, onSelect }: { label: string; active: boolean; onHover: (on: boolean) => void; onSelect: () => void }) {
  return (
    <div className="relative -translate-x-1/2 -translate-y-1/2">
      <button
        type="button"
        aria-label={label}
        onPointerEnter={() => onHover(true)}
        onPointerLeave={() => onHover(false)}
        onFocus={() => onHover(true)}
        onBlur={() => onHover(false)}
        onClick={onSelect}
        className="pointer-events-auto relative grid h-8 w-8 place-items-center"
      >
        <motion.span
          className="absolute rounded-full border border-brick/60"
          initial={false}
          animate={active ? { width: 34, height: 34, opacity: 1 } : { width: 18, height: 18, opacity: 0 }}
          transition={{ type: "spring", stiffness: 420, damping: 26 }}
        />
        <motion.span
          className="relative rounded-full border-[1.5px] shadow-[0_1px_4px_rgb(0_0_0/0.18)]"
          initial={{ scale: 0 }}
          animate={
            active
              ? { scale: 1, width: 20, height: 20, backgroundColor: "var(--brick)", borderColor: "var(--brick)" }
              : { scale: 1, width: 15, height: 15, backgroundColor: "var(--pin)", borderColor: "var(--pin-border)" }
          }
          transition={{ type: "spring", stiffness: 420, damping: 26 }}
        />
      </button>
      <AnimatePresence>
        {active && (
          <motion.span
            initial={{ opacity: 0, y: 4, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.9, transition: { duration: 0.12 } }}
            transition={{ type: "spring", stiffness: 520, damping: 32 }}
            className="absolute bottom-full left-1/2 mb-1 -translate-x-1/2 whitespace-nowrap rounded-full bg-ink px-2.5 py-1 font-mono text-[11px] text-paper shadow-card"
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}
