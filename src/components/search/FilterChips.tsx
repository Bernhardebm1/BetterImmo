"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import clsx from "clsx";
import { ChevronDown, Minus, Plus, X } from "lucide-react";
import { FEATURE_LABEL, TYPE_LABEL, formatPriceShort } from "@/lib/format";
import { spring } from "@/lib/motion";
import { EPC_LABELS, type Filters } from "@/lib/types";

type Chip = {
  key: string;
  label: string;
  remove: (f: Filters) => Filters;
  editor?: "price" | "beds" | "area" | "epc";
};

function chipsFor(f: Filters): Chip[] {
  const chips: Chip[] = [];
  for (const c of f.cities) chips.push({ key: `city:${c}`, label: c, remove: (x) => ({ ...x, cities: x.cities.filter((y) => y !== c) }) });
  for (const t of f.types) chips.push({ key: `type:${t}`, label: TYPE_LABEL[t], remove: (x) => ({ ...x, types: x.types.filter((y) => y !== t) }) });
  if (f.minPrice || f.maxPrice) {
    const label =
      f.minPrice && f.maxPrice
        ? `${formatPriceShort(f.minPrice)} – ${formatPriceShort(f.maxPrice)}`
        : f.maxPrice
          ? `Under ${formatPriceShort(f.maxPrice)}`
          : `From ${formatPriceShort(f.minPrice!)}`;
    chips.push({ key: "price", label, editor: "price", remove: (x) => ({ ...x, minPrice: undefined, maxPrice: undefined }) });
  }
  if (f.minBedrooms) chips.push({ key: "beds", label: `${f.minBedrooms}+ bedrooms`, editor: "beds", remove: (x) => ({ ...x, minBedrooms: undefined }) });
  if (f.minArea) chips.push({ key: "area", label: `${f.minArea}+ m²`, editor: "area", remove: (x) => ({ ...x, minArea: undefined }) });
  for (const ft of f.features) chips.push({ key: `feature:${ft}`, label: FEATURE_LABEL[ft], remove: (x) => ({ ...x, features: x.features.filter((y) => y !== ft) }) });
  if (f.maxEpc) chips.push({ key: "epc", label: `EPC ${f.maxEpc} or better`, editor: "epc", remove: (x) => ({ ...x, maxEpc: undefined }) });
  if (f.nearStation) chips.push({ key: "station", label: "Near a station", remove: (x) => ({ ...x, nearStation: undefined }) });
  return chips;
}

export function FilterChips({ filters, onChange }: { filters: Filters; onChange: (f: Filters) => void }) {
  const [open, setOpen] = useState<string | null>(null);
  const chips = chipsFor(filters);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <AnimatePresence mode="popLayout" initial={false}>
        {chips.map((chip, i) => (
          <motion.div
            key={chip.key}
            layout
            initial={{ opacity: 0, scale: 0.8, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0, transition: { ...spring.snappy, delay: i * 0.035 } }}
            exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.15 } }}
            transition={spring.snappy}
            className="relative"
          >
            <div
              className={clsx(
                "flex h-9 items-center rounded-full border font-mono text-[12px] transition-colors duration-200",
                open === chip.key ? "border-ink bg-ink text-paper" : "border-ink/20 text-ink hover:border-ink/50",
              )}
            >
              <button
                type="button"
                className={clsx("h-full pl-3.5", chip.editor ? "cursor-pointer pr-1.5" : "cursor-default pr-1.5")}
                onClick={() => chip.editor && setOpen(open === chip.key ? null : chip.key)}
                aria-expanded={chip.editor ? open === chip.key : undefined}
              >
                <span className="flex items-center gap-1.5">
                  {chip.label}
                  {chip.editor && <ChevronDown className={clsx("h-3 w-3 opacity-60 transition-transform duration-300", open === chip.key && "rotate-180")} />}
                </span>
              </button>
              <button
                type="button"
                aria-label={`Remove ${chip.label}`}
                onClick={() => {
                  setOpen(null);
                  onChange(chip.remove(filters));
                }}
                className="mr-1 grid h-7 w-7 place-items-center rounded-full opacity-50 transition hover:bg-ink/10 hover:opacity-100"
              >
                <X className="h-3.5 w-3.5" strokeWidth={2.5} />
              </button>
            </div>
            <AnimatePresence>
              {open === chip.key && chip.editor && (
                <Popover onClose={() => setOpen(null)}>
                  <Editor kind={chip.editor} filters={filters} onChange={onChange} />
                </Popover>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function Popover({ children, onClose }: { children: ReactNode; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.parentElement?.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: -6, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -4, scale: 0.97, transition: { duration: 0.12 } }}
      transition={spring.snappy}
      style={{ transformOrigin: "top left" }}
      className="absolute left-0 top-11 z-30 w-72 rounded-2xl border border-line bg-paper-raised p-4 shadow-lift"
    >
      {children}
    </motion.div>
  );
}

function Stepper({ label, value, step, min, onChange, suffix = "" }: { label: string; value: number; step: number; min: number; onChange: (n: number) => void; suffix?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-ink-soft">{label}</span>
      <div className="flex items-center gap-3">
        <button type="button" aria-label="Less" onClick={() => onChange(Math.max(min, value - step))} className="grid h-8 w-8 place-items-center rounded-full border border-line hover:border-ink-faint">
          <Minus className="h-3.5 w-3.5" />
        </button>
        <motion.span key={value} initial={{ y: -6, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="w-14 text-center font-medium tabular-nums">
          {value}
          {suffix}
        </motion.span>
        <button type="button" aria-label="More" onClick={() => onChange(value + step)} className="grid h-8 w-8 place-items-center rounded-full border border-line hover:border-ink-faint">
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

function Editor({ kind, filters, onChange }: { kind: NonNullable<Chip["editor"]>; filters: Filters; onChange: (f: Filters) => void }) {
  if (kind === "beds") {
    return <Stepper label="Bedrooms, at least" value={filters.minBedrooms ?? 1} step={1} min={1} onChange={(n) => onChange({ ...filters, minBedrooms: n })} />;
  }
  if (kind === "area") {
    return <Stepper label="Living area, at least" value={filters.minArea ?? 60} step={10} min={20} suffix=" m²" onChange={(n) => onChange({ ...filters, minArea: n })} />;
  }
  if (kind === "epc") {
    return (
      <div>
        <p className="mb-3 text-sm text-ink-soft">Energy label (EPC), at least</p>
        <div className="flex gap-1.5">
          {EPC_LABELS.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => onChange({ ...filters, maxEpc: l })}
              className={clsx(
                "h-9 flex-1 rounded-lg text-sm font-semibold transition-colors",
                filters.maxEpc === l ? "bg-ink text-paper" : "bg-ink/5 text-ink hover:bg-ink/10",
              )}
            >
              {l}
            </button>
          ))}
        </div>
      </div>
    );
  }
  return <PriceEditor filters={filters} onChange={onChange} />;
}

function PriceEditor({ filters, onChange }: { filters: Filters; onChange: (f: Filters) => void }) {
  const [max, setMax] = useState(filters.maxPrice ?? 500_000);
  // Commit on release so we don't refetch on every pixel of the drag.
  const commit = () => onChange({ ...filters, maxPrice: max });
  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between">
        <span className="text-sm text-ink-soft">Maximum price</span>
        <span className="font-mono text-xl tabular-nums">{formatPriceShort(max)}</span>
      </div>
      <input
        type="range"
        min={100_000}
        max={1_500_000}
        step={5_000}
        value={max}
        onChange={(e) => setMax(Number(e.target.value))}
        onPointerUp={commit}
        onKeyUp={commit}
        className="w-full accent-[var(--brick)]"
        aria-label="Maximum price"
      />
      <div className="mt-1 flex justify-between text-xs text-ink-faint">
        <span>€100k</span>
        <span>€1.5M</span>
      </div>
    </div>
  );
}
