"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import { Hand, Pencil, RotateCcw, X } from "lucide-react";
import { HomesMap } from "./HomesMap";
import { formatPriceShort } from "@/lib/format";
import { LISTINGS } from "@/lib/listings";
import { spring } from "@/lib/motion";
import { insideArea } from "@/lib/search/match";

type Area = [number, number][];

/**
 * Full-screen map for drawing a search area by hand, for places that don't follow city or
 * district lines. Every home we have is shown faintly so the buyer can see where they are.
 */
export function DrawAreaDialog({ open, initial, onClose, onUse }: { open: boolean; initial?: Area; onClose: () => void; onUse: (area: Area) => void }) {
  return <AnimatePresence>{open && <Dialog initial={initial} onClose={onClose} onUse={onUse} />}</AnimatePresence>;
}

function Dialog({ initial, onClose, onUse }: { initial?: Area; onClose: () => void; onUse: (area: Area) => void }) {
  const [area, setArea] = useState<Area | undefined>(initial);
  const [mode, setMode] = useState<"draw" | "move">(initial ? "move" : "draw");
  const inside = area ? LISTINGS.filter((l) => l.status === "available" && insideArea(l.lng, l.lat, area)).length : null;
  const pins = useMemo(
    () => LISTINGS.filter((l) => l.status === "available").map((l) => ({ id: l.id, lat: l.lat, lng: l.lng, label: formatPriceShort(l.price) })),
    [],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose]);

  return (
    <motion.div
      role="dialog"
      aria-modal
      aria-label="Draw your search area"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.2 } }}
      className="fixed inset-0 z-[60] flex flex-col bg-paper"
    >
      <motion.header
        initial={{ y: -12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ ...spring.soft, delay: 0.05 }}
        className="flex items-start gap-4 px-5 pb-4 pt-5 sm:px-10 sm:pt-7"
      >
        <div className="min-w-0 flex-1">
          <h2 className="font-serif text-[clamp(26px,3vw,36px)] font-light leading-tight">Draw your area</h2>
          <p className="mt-1 max-w-[56ch] text-[14px] text-ink-soft">
            {mode === "draw"
              ? "Press and drag a loop around where you'd like to live. Zoom with the buttons or your scroll wheel."
              : "Move and zoom the map, then switch back to Draw."}
          </p>
        </div>
        <button type="button" onClick={onClose} aria-label="Close" className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-ink/15 text-ink transition-colors hover:border-ink/40">
          <X className="h-4 w-4" strokeWidth={1.75} />
        </button>
      </motion.header>

      <div className="relative min-h-0 flex-1 overflow-hidden border-y border-line">
        <HomesMap
          pins={pins}
          area={area}
          drawing={mode === "draw"}
          onDraw={(a) => {
            setArea(a);
            setMode("move");
          }}
          className="h-full w-full"
        />
        <div className="absolute left-4 top-4 z-30 flex items-center gap-1 rounded-full border border-ink/15 bg-paper/90 p-1 backdrop-blur sm:left-6 sm:top-6" role="tablist" aria-label="Map mode">
          {(
            [
              ["draw", "Draw", Pencil],
              ["move", "Move", Hand],
            ] as const
          ).map(([k, label, Icon]) => (
            <button
              key={k}
              type="button"
              role="tab"
              aria-selected={mode === k}
              onClick={() => setMode(k)}
              className={clsx("relative flex h-8 items-center gap-1.5 rounded-full px-3.5 text-[13px] transition-colors", mode === k ? "text-cta-ink" : "text-ink-soft hover:text-ink")}
            >
              {mode === k && <motion.span layoutId="draw-mode" transition={spring.snappy} className="absolute inset-0 rounded-full bg-[var(--toggle)]" />}
              <Icon className="relative h-3.5 w-3.5" strokeWidth={1.75} />
              <span className="relative">{label}</span>
            </button>
          ))}
        </div>
      </div>

      <footer className="flex items-center justify-between gap-3 px-5 py-4 sm:px-10">
        <button
          type="button"
          disabled={!area}
          onClick={() => {
            setArea(undefined);
            setMode("draw");
          }}
          className="flex h-11 items-center gap-2 rounded-full border border-ink/15 px-5 text-[14px] text-ink transition-[border-color,opacity] hover:border-ink/40 disabled:opacity-40"
        >
          <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.75} />
          Redraw
        </button>
        <span className="flex-1 text-center text-[13px] text-ink-soft" aria-live="polite">
          {inside === null ? "" : inside === 0 ? "No homes in this area yet" : `${inside} ${inside === 1 ? "home" : "homes"} in this area`}
        </span>
        <motion.button
          type="button"
          disabled={!area}
          onClick={() => area && onUse(area)}
          whileTap={{ scale: 0.97 }}
          className="h-11 rounded-full bg-cta px-6 text-[14px] font-medium text-cta-ink transition-opacity disabled:opacity-40"
        >
          Search this area
        </motion.button>
      </footer>
    </motion.div>
  );
}
