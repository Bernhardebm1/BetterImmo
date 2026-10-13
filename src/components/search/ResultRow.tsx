"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { forwardRef } from "react";
import clsx from "clsx";
import { ArrowRight, Bath, BedDouble, Maximize2, X } from "lucide-react";
import { SmartImage } from "@/components/SmartImage";
import { HeartButton } from "@/components/listing/HeartButton";
import { formatPrice } from "@/lib/format";
import { spring } from "@/lib/motion";
import { markFromResults } from "@/lib/nav";
import type { Match } from "@/lib/search/match";

/** One home in the results list: photo, place, price, the basics, and why it fits. */
export const ResultRow = forwardRef<
  HTMLElement,
  { match: Match; index: number; active: boolean; onHover: (on: boolean) => void; onPass: () => void }
>(function ResultRow({ match, index, active, onHover, onPass }, ref) {
  const { listing: l, reasons, misses } = match;
  return (
    <motion.article
      ref={ref}
      layout
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0, transition: { ...spring.soft, delay: Math.min(index, 8) * 0.05 } }}
      exit={{ opacity: 0, x: -60, scale: 0.96, transition: { duration: 0.25, ease: [0.4, 0, 1, 1] } }}
      transition={spring.soft}
      onPointerEnter={() => onHover(true)}
      onPointerLeave={() => onHover(false)}
      className={clsx(
        "group relative flex min-w-0 gap-4 rounded-xl border p-2.5 transition-[border-color,background-color,box-shadow] duration-300 sm:gap-5",
        active ? "border-brick/70 bg-paper-raised shadow-card" : "border-transparent hover:border-line hover:bg-paper-raised/60",
      )}
    >
      <div className="relative aspect-[16/11] w-[42%] max-w-[200px] shrink-0 overflow-hidden rounded-lg">
        <SmartImage src={l.images[0]} alt="" seed={l.id} className="h-full w-full transition-transform duration-700 ease-out group-hover:scale-[1.04]" />
        <HeartButton id={l.id} className="absolute right-2 top-2 z-10" />
        <button
          type="button"
          onClick={onPass}
          aria-label={`Not for me: ${l.street}`}
          title="Not for me"
          className="absolute left-2 top-2 z-10 grid h-7 w-7 place-items-center rounded-full bg-black/25 text-white opacity-0 backdrop-blur-md transition hover:bg-black/45 focus-visible:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100"
        >
          <X className="h-3.5 w-3.5" strokeWidth={2.25} />
        </button>
      </div>

      <div className="flex min-w-0 flex-1 flex-col py-1.5">
        <h3 className="truncate text-[15px] font-medium text-ink">
          <Link href={`/homes/${l.id}`} onClick={markFromResults} className="after:absolute after:inset-0 after:rounded-xl focus-visible:outline-none">
            {l.city}, {l.neighbourhood}
          </Link>
        </h3>
        <p className="mt-1 font-mono text-[15px] tabular-nums text-ink">{formatPrice(l.price)}</p>
        <ul className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[11px] text-ink-soft">
          <li className="flex items-center gap-1.5">
            <BedDouble className="h-3.5 w-3.5 text-ink-faint" />
            {l.bedrooms ? `${l.bedrooms} beds` : "Studio"}
          </li>
          <li className="flex items-center gap-1.5">
            <Bath className="h-3.5 w-3.5 text-ink-faint" />
            {l.bathrooms} {l.bathrooms === 1 ? "bath" : "baths"}
          </li>
          <li className="flex items-center gap-1.5">
            <Maximize2 className="h-3 w-3 text-ink-faint" />
            {l.area} m²
          </li>
        </ul>
        {(reasons.length > 0 || misses.length > 0) && (
          <p className="mt-auto truncate pt-2 font-mono text-[11px]">
            <span className="text-brick">{reasons.slice(0, 2).join(" · ")}</span>
            {misses.length > 0 && <span className="text-ink-faint">{reasons.length ? " · " : ""}{misses[0]}</span>}
          </p>
        )}
      </div>

      <span
        aria-hidden
        className={clsx(
          "mr-1.5 hidden h-9 w-9 shrink-0 self-center sm:grid place-items-center rounded-full border transition-colors duration-300",
          active ? "border-brick bg-brick text-white" : "border-ink/20 text-ink",
        )}
      >
        <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
      </span>
    </motion.article>
  );
});
