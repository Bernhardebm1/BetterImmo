"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import clsx from "clsx";
import { ChevronDown, Minus, PenLine, Plus } from "lucide-react";
import { FEATURE_LABEL, TYPE_LABEL, formatPriceShort } from "@/lib/format";
import { spring } from "@/lib/motion";
import { CITIES } from "@/lib/places";
import { EPC_LABELS, FEATURES, PROPERTY_TYPES, type Filters } from "@/lib/types";

type Key = "where" | "price" | "type" | "beds" | "more";

/**
 * Location, Price, Type, Bedrooms and More filters, as in the reference design. The assistant
 * fills them in from what the buyer wrote; each label shows the current value and opens an editor.
 */
export function FilterChips({ filters: f, onChange, onDraw }: { filters: Filters; onChange: (f: Filters) => void; onDraw: () => void }) {
  const [open, setOpen] = useState<Key | null>(null);
  const more = f.features.length + (f.minArea ? 1 : 0) + (f.maxEpc ? 1 : 0) + (f.nearStation ? 1 : 0);

  const labels: Record<Key, { text: string; set: boolean }> = {
    where: {
      text: f.area ? "Drawn area" : f.cities.length > 2 ? `${f.cities.length} cities` : f.cities.length ? f.cities.join(", ") : "Location",
      set: Boolean(f.area || f.cities.length),
    },
    price: {
      text:
        f.minPrice && f.maxPrice
          ? `${formatPriceShort(f.minPrice)} – ${formatPriceShort(f.maxPrice)}`
          : f.maxPrice
            ? `Under ${formatPriceShort(f.maxPrice)}`
            : f.minPrice
              ? `From ${formatPriceShort(f.minPrice)}`
              : "Price",
      set: Boolean(f.minPrice || f.maxPrice),
    },
    type: { text: f.types.length ? f.types.map((t) => TYPE_LABEL[t]).join(", ") : "Type", set: f.types.length > 0 },
    beds: { text: f.minBedrooms ? `${f.minBedrooms}+ bedrooms` : "Bedrooms", set: Boolean(f.minBedrooms) },
    more: { text: more ? `More filters · ${more}` : "More filters", set: more > 0 },
  };

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      {(Object.keys(labels) as Key[]).map((k) => (
        <div key={k} className="relative">
          <button
            type="button"
            onClick={() => setOpen(open === k ? null : k)}
            aria-expanded={open === k}
            className={clsx(
              "flex h-10 items-center gap-2.5 rounded-full border px-5 text-[13px] transition-colors duration-200",
              open === k ? "border-ink bg-ink text-paper" : labels[k].set ? "border-ink/45 text-ink" : "border-ink/15 text-ink hover:border-ink/40",
            )}
          >
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span key={labels[k].text} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={spring.snappy}>
                {labels[k].text}
              </motion.span>
            </AnimatePresence>
            <ChevronDown className={clsx("h-3.5 w-3.5 opacity-70 transition-transform duration-300", open === k && "rotate-180")} strokeWidth={1.75} />
          </button>
          <AnimatePresence>
            {open === k && (
              <Popover onClose={() => setOpen(null)} wide={k === "more" || k === "where"}>
                {k === "where" && (
                  <div className="space-y-5">
                    <Toggles label="Cities" options={CITIES.map((c) => [c, c])} value={f.area ? [] : f.cities} onChange={(cities) => onChange({ ...f, cities, area: undefined })} />
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line pt-4">
                      <button
                        type="button"
                        onClick={() => {
                          setOpen(null);
                          onDraw();
                        }}
                        className="flex h-9 items-center gap-2 rounded-full border border-ink/15 px-4 text-[13px] text-ink transition-colors hover:border-ink/40"
                      >
                        <PenLine className="h-3.5 w-3.5" strokeWidth={1.75} />
                        {f.area ? "Redraw on the map" : "Draw on the map"}
                      </button>
                      {f.area && (
                        <button type="button" onClick={() => onChange({ ...f, area: undefined })} className="text-[12px] text-ink-soft underline underline-offset-4 hover:text-ink">
                          Remove drawn area
                        </button>
                      )}
                    </div>
                  </div>
                )}
                {k === "price" && <PriceEditor filters={f} onChange={onChange} />}
                {k === "type" && (
                  <Toggles
                    label="Property type"
                    options={PROPERTY_TYPES.map((t) => [t, TYPE_LABEL[t]])}
                    value={f.types}
                    onChange={(types) => onChange({ ...f, types: types as Filters["types"] })}
                  />
                )}
                {k === "beds" && (
                  <Stepper
                    label="Bedrooms, at least"
                    value={f.minBedrooms ?? 0}
                    step={1}
                    min={0}
                    format={(n) => (n ? `${n}+` : "Any")}
                    onChange={(n) => onChange({ ...f, minBedrooms: n || undefined })}
                  />
                )}
                {k === "more" && <MoreFilters filters={f} onChange={onChange} />}
              </Popover>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}

function Popover({ children, onClose, wide }: { children: ReactNode; onClose: () => void; wide?: boolean }) {
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
      initial={{ opacity: 0, y: -6, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -4, scale: 0.97, transition: { duration: 0.12 } }}
      transition={spring.snappy}
      style={{ transformOrigin: "top left" }}
      className={clsx(
        "absolute left-0 top-12 z-40 rounded-2xl border border-line bg-paper-raised p-5 shadow-lift",
        wide ? "w-[min(340px,calc(100vw-40px))]" : "w-72",
      )}
    >
      {children}
    </motion.div>
  );
}

function Stepper({
  label,
  value,
  step,
  min,
  onChange,
  format = String,
}: {
  label: string;
  value: number;
  step: number;
  min: number;
  onChange: (n: number) => void;
  format?: (n: number) => string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[13px] text-ink-soft">{label}</span>
      <div className="flex items-center gap-3">
        <button type="button" aria-label="Less" onClick={() => onChange(Math.max(min, value - step))} className="grid h-8 w-8 place-items-center rounded-full border border-ink/15 hover:border-ink/40">
          <Minus className="h-3.5 w-3.5" />
        </button>
        <motion.span key={value} initial={{ y: -6, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="w-14 text-center font-figures text-[14px] tabular-nums">
          {format(value)}
        </motion.span>
        <button type="button" aria-label="More" onClick={() => onChange(value + step)} className="grid h-8 w-8 place-items-center rounded-full border border-ink/15 hover:border-ink/40">
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

function Toggles({ label, options, value, onChange }: { label: string; options: [string, string][]; value: string[]; onChange: (v: string[]) => void }) {
  return (
    <div>
      <p className="mb-3 text-[12px] text-ink-faint">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map(([k, text]) => {
          const on = value.includes(k);
          return (
            <button
              key={k}
              type="button"
              aria-pressed={on}
              onClick={() => onChange(on ? value.filter((x) => x !== k) : [...value, k])}
              className={clsx(
                "h-9 rounded-full border px-4 text-[13px] transition-colors duration-200",
                on ? "border-ink bg-ink text-paper" : "border-ink/15 text-ink hover:border-ink/40",
              )}
            >
              {text}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function MoreFilters({ filters: f, onChange }: { filters: Filters; onChange: (f: Filters) => void }) {
  return (
    <div className="space-y-6">
      <Toggles
        label="Must have"
        options={FEATURES.map((x) => [x, FEATURE_LABEL[x]])}
        value={f.features}
        onChange={(features) => onChange({ ...f, features: features as Filters["features"] })}
      />
      <Stepper
        label="Living area, at least"
        value={f.minArea ?? 0}
        step={10}
        min={0}
        format={(n) => (n ? `${n} m²` : "Any")}
        onChange={(n) => onChange({ ...f, minArea: n || undefined })}
      />
      <div>
        <p className="mb-3 text-[12px] text-ink-faint">Energy label, at least</p>
        <div className="flex gap-1.5">
          {EPC_LABELS.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => onChange({ ...f, maxEpc: f.maxEpc === l ? undefined : l })}
              className={clsx(
                "h-9 flex-1 rounded-full font-figures text-[13px] transition-colors",
                f.maxEpc === l ? "bg-ink text-paper" : "bg-ink/5 text-ink hover:bg-ink/10",
              )}
            >
              {l}
            </button>
          ))}
        </div>
      </div>
      <label className="flex cursor-pointer items-center justify-between text-[13px] text-ink-soft">
        Near a train station
        <input
          type="checkbox"
          checked={Boolean(f.nearStation)}
          onChange={(e) => onChange({ ...f, nearStation: e.target.checked || undefined })}
          className="h-4 w-4 accent-[var(--brick)]"
        />
      </label>
    </div>
  );
}

function PriceEditor({ filters, onChange }: { filters: Filters; onChange: (f: Filters) => void }) {
  const [max, setMax] = useState(filters.maxPrice ?? 500_000);
  // Commit on release so we don't refetch on every pixel of the drag.
  const commit = () => onChange({ ...filters, maxPrice: max });
  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between">
        <span className="text-[13px] text-ink-soft">Maximum price</span>
        <span className="font-figures text-lg tabular-nums">{formatPriceShort(max)}</span>
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
      <div className="mt-1 flex justify-between font-figures text-[11px] text-ink-faint">
        <span>€100k</span>
        <span>€1.5M</span>
      </div>
      {(filters.maxPrice || filters.minPrice) && (
        <button type="button" onClick={() => onChange({ ...filters, minPrice: undefined, maxPrice: undefined })} className="mt-4 text-[12px] text-ink-soft underline underline-offset-4 hover:text-ink">
          Any price
        </button>
      )}
    </div>
  );
}
