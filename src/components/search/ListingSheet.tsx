"use client";

import { motion } from "motion/react";
import { useEffect, useState } from "react";
import clsx from "clsx";
import { CalendarDays, Gavel, Heart, X } from "lucide-react";
import { SmartImage } from "@/components/SmartImage";
import { FEATURE_LABEL, TYPE_LABEL, formatPrice } from "@/lib/format";
import { spring } from "@/lib/motion";
import type { Listing } from "@/lib/types";

export function ListingSheet({ listing: l, liked, onLike, onClose }: { listing: Listing; liked: boolean; onLike: () => void; onClose: () => void }) {
  const [photo, setPhoto] = useState(0);
  const [soon, setSoon] = useState<string | null>(null);

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

  const facts: [string, string][] = [
    ["Type", TYPE_LABEL[l.type]],
    ["Living area", `${l.area} m²`],
    ...(l.plot ? ([["Plot", `${l.plot} m²`]] as [string, string][]) : []),
    ["Bedrooms", l.bedrooms ? String(l.bedrooms) : "Studio"],
    ["Bathrooms", String(l.bathrooms)],
    ["EPC", l.epc],
    ["Built", String(l.yearBuilt)],
    ["Price per m²", formatPrice(Math.round(l.price / l.area))],
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal aria-label={l.title}>
      <motion.div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        onClick={onClose}
      />
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0, transition: { duration: 0.2 } }}
        transition={spring.gentle}
        className="relative max-h-[92dvh] w-full max-w-4xl overflow-y-auto rounded-t-[28px] bg-paper-raised shadow-lift sm:rounded-[28px]"
      >
        <motion.div layoutId={`photo-${l.id}`} transition={spring.gentle} className="relative overflow-hidden">
          <SmartImage key={photo} src={l.images[photo]} alt={l.title} seed={`${l.id}-${photo}`} className="aspect-[16/10] w-full sm:aspect-[16/8]" />
        </motion.div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-paper-raised/90 text-ink shadow-card backdrop-blur transition hover:scale-105"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="absolute left-4 top-4 flex gap-1.5">
          {l.images.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Photo ${i + 1}`}
              onClick={() => setPhoto(i)}
              className={clsx("h-1.5 rounded-full bg-white shadow transition-all duration-300", i === photo ? "w-6 opacity-100" : "w-1.5 opacity-60")}
            />
          ))}
        </div>

        <motion.div
          initial="hidden"
          animate="shown"
          variants={{ shown: { transition: { staggerChildren: 0.05, delayChildren: 0.12 } } }}
          className="grid gap-8 p-6 sm:grid-cols-[1fr_280px] sm:p-8"
        >
          <div>
            <Rise>
              <p className="font-display text-5xl leading-none tracking-tight">{formatPrice(l.price)}</p>
            </Rise>
            <Rise>
              <h2 className="mt-3 text-xl font-medium">{l.title}</h2>
              <p className="text-ink-soft">
                {l.neighbourhood}, {l.city} · listed by {l.agency}
              </p>
            </Rise>
            <Rise>
              <p className="mt-6 text-[17px] leading-relaxed text-ink-soft">{l.summary}</p>
            </Rise>
            <Rise>
              <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
                {facts.map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-xs uppercase tracking-wider text-ink-faint">{k}</dt>
                    <dd className="mt-0.5 font-medium">{v}</dd>
                  </div>
                ))}
              </dl>
            </Rise>
            {l.features.length > 0 && (
              <Rise>
                <ul className="mt-8 flex flex-wrap gap-2">
                  {l.features.map((f) => (
                    <li key={f} className="rounded-full border border-line px-3 py-1.5 text-sm">
                      {FEATURE_LABEL[f]}
                    </li>
                  ))}
                  {l.nearStation && <li className="rounded-full border border-line px-3 py-1.5 text-sm">Near a station</li>}
                </ul>
              </Rise>
            )}
          </div>

          <Rise className="flex flex-col gap-3 sm:sticky sm:top-8 sm:self-start">
            <ActionButton primary icon={<CalendarDays className="h-4 w-4" />} onClick={() => setSoon("viewing")}>
              Book a viewing
            </ActionButton>
            <ActionButton icon={<Gavel className="h-4 w-4" />} onClick={() => setSoon("bid")}>
              Register interest
            </ActionButton>
            <ActionButton icon={<Heart className={clsx("h-4 w-4", liked && "fill-current text-moss")} />} onClick={onLike}>
              {liked ? "Saved to shortlist" : "Save"}
            </ActionButton>
            {soon && (
              <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl bg-brick-soft p-4 text-sm leading-relaxed text-ink">
                {soon === "viewing"
                  ? "Coming next: pick a slot straight from the agent's agenda, no phone calls."
                  : "Coming next: a non-binding interest bid, with the bid count and range shown when the seller allows it."}
              </motion.p>
            )}
          </Rise>
        </motion.div>
      </motion.div>
    </div>
  );
}

function Rise({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      variants={{ hidden: { opacity: 0, y: 14 }, shown: { opacity: 1, y: 0, transition: spring.soft } }}
    >
      {children}
    </motion.div>
  );
}

function ActionButton({ children, icon, primary, onClick }: { children: React.ReactNode; icon: React.ReactNode; primary?: boolean; onClick: () => void }) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.97 }}
      whileHover={{ y: -1 }}
      transition={spring.snappy}
      onClick={onClick}
      className={clsx(
        "flex h-12 items-center justify-center gap-2 rounded-full text-[15px] font-medium transition-colors",
        primary ? "bg-ink text-paper hover:bg-ink/90" : "border border-line hover:border-ink-faint",
      )}
    >
      {icon}
      {children}
    </motion.button>
  );
}
