"use client";

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import clsx from "clsx";
import {
  ArrowLeft,
  ArrowRight,
  Bath,
  BedDouble,
  Bookmark,
  Car,
  ChevronDown,
  Leaf,
  Maximize2,
  Share,
  Sun,
  TrainFront,
  Trees,
} from "lucide-react";
import { SmartImage } from "@/components/SmartImage";
import { BelgiumMap } from "@/components/map/BelgiumMap";
import { HeartButton } from "./HeartButton";
import { FEATURE_LABEL, TYPE_LABEL, formatPrice } from "@/lib/format";
import { ease, spring } from "@/lib/motion";
import { cameFromResults } from "@/lib/nav";
import { toggleShortlist, useShortlist } from "@/lib/shortlist";
import type { Feature, Listing } from "@/lib/types";

const TABS = ["Overview", "Photos", "Floorplan", "Location", "Similar homes"] as const;
type Tab = (typeof TABS)[number];

const FEATURE_ICON: Partial<Record<Feature, ReactNode>> = {
  garden: <Trees className="h-4 w-4" />,
  terrace: <Sun className="h-4 w-4" />,
  balcony: <Sun className="h-4 w-4" />,
  parking: <Car className="h-4 w-4" />,
  garage: <Car className="h-4 w-4" />,
};

export function ListingDetail({ listing: l, similar }: { listing: Listing; similar: Listing[] }) {
  const router = useRouter();
  const [photo, setPhoto] = useState(0);
  const [tab, setTab] = useState<Tab>("Overview");

  const showPhoto = (i: number) => {
    setPhoto(i);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <motion.main initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }} className="min-h-dvh bg-paper pb-28 lg:pb-24">
      <Hero
        listing={l}
        index={photo}
        onIndex={setPhoto}
        onBack={() => (cameFromResults() ? router.back() : router.push("/"))}
      />

      <div className="mx-auto grid max-w-[1240px] gap-x-16 px-5 pt-7 sm:px-10 sm:pt-9 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0">
          <Rise delay={0.1}>
            <p className="font-mono text-[12px] uppercase tracking-[0.18em] text-ink-soft">
              {l.city}, {l.neighbourhood}
            </p>
            <h1 className="mt-2 font-serif text-[clamp(40px,5vw,60px)] font-light leading-[1.02] tracking-[-0.015em]">{l.street}</h1>
            <p className="mt-2 font-mono text-[22px] tabular-nums">{formatPrice(l.price)}</p>
          </Rise>

          <Rise delay={0.18}>
            <ul className="mt-7 flex flex-wrap gap-x-7 gap-y-3 border-b border-line pb-7 font-mono text-[13px] text-ink">
              <Fact icon={<BedDouble className="h-4 w-4" />}>{l.bedrooms ? `${l.bedrooms} beds` : "Studio"}</Fact>
              <Fact icon={<Bath className="h-4 w-4" />}>
                {l.bathrooms} {l.bathrooms === 1 ? "bath" : "baths"}
              </Fact>
              <Fact icon={<Maximize2 className="h-3.5 w-3.5" />}>{l.area} m²</Fact>
              {l.features
                .filter((f) => FEATURE_ICON[f])
                .slice(0, 2)
                .map((f) => (
                  <Fact key={f} icon={FEATURE_ICON[f]}>
                    {FEATURE_LABEL[f]}
                  </Fact>
                ))}
              {l.nearStation && <Fact icon={<TrainFront className="h-4 w-4" />}>Near a station</Fact>}
              <Fact icon={<Leaf className="h-4 w-4" />}>Energy label {l.epc}</Fact>
            </ul>
          </Rise>

          <Rise delay={0.26}>
            <About listing={l} />
          </Rise>

          <Rise delay={0.34}>
            <div className="mt-8 grid grid-cols-[1.35fr_1fr_1.15fr] gap-2 sm:gap-3">
              {l.images.slice(1, 4).map((src, i) => {
                const more = i === 2 && l.images.length > 4;
                return (
                  <button
                    key={src}
                    type="button"
                    onClick={() => (more ? setTab("Photos") : showPhoto(i + 1))}
                    className="group relative overflow-hidden rounded-lg"
                    aria-label={more ? "See all photos" : `Show photo ${i + 2}`}
                  >
                    <SmartImage src={src} alt="" seed={`${l.id}-${i + 1}`} className="h-[clamp(96px,16vw,190px)] w-full transition-transform duration-700 ease-out group-hover:scale-[1.04]" />
                    {more && (
                      <span className="absolute bottom-2 right-2 rounded-full bg-black/45 px-2.5 py-1 font-mono text-[11px] text-white backdrop-blur-md">
                        +{l.images.length - 4} photos
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </Rise>

          <Rise delay={0.4}>
            <Tabs value={tab} onChange={setTab} />
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={tab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6, transition: { duration: 0.15 } }}
                transition={{ duration: 0.35, ease: ease.out }}
                className="pt-8"
                role="tabpanel"
              >
                <TabPanel tab={tab} listing={l} similar={similar} onPhoto={showPhoto} />
              </motion.div>
            </AnimatePresence>
          </Rise>
        </div>

        <aside className="hidden lg:block">
          <Rise delay={0.2} className="sticky top-8">
            <Actions listing={l} />
          </Rise>
        </aside>
      </div>

      {/* Phones: the main actions stay within thumb reach. */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-paper/90 px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl lg:hidden">
        <Actions listing={l} compact />
      </div>
    </motion.main>
  );
}

function Rise({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay, ease: ease.out }} className={className}>
      {children}
    </motion.div>
  );
}

function Fact({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <li className="flex items-center gap-2">
      <span className="text-ink-soft">{icon}</span>
      {children}
    </li>
  );
}

function Hero({ listing: l, index, onIndex, onBack }: { listing: Listing; index: number; onIndex: (i: number) => void; onBack: () => void }) {
  const [dir, setDir] = useState(1);
  const [copied, setCopied] = useState(false);
  const count = l.images.length;
  const go = (step: number) => {
    setDir(step);
    onIndex((index + step + count) % count);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest("input, textarea")) return;
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const share = async () => {
    const url = location.href;
    try {
      if (navigator.share) await navigator.share({ title: `${l.street}, ${l.city}`, url });
      else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      }
    } catch {
      // The buyer closed the share sheet.
    }
  };

  return (
    <section className="relative h-[clamp(300px,50vh,580px)] overflow-hidden bg-ink/10" aria-roledescription="carousel" aria-label="Photos">
      <AnimatePresence initial={false} custom={dir}>
        <motion.div
          key={index}
          custom={dir}
          variants={{
            enter: (d: number) => ({ x: `${d * 6}%`, opacity: 0, scale: 1.04 }),
            center: { x: 0, opacity: 1, scale: 1 },
            exit: (d: number) => ({ x: `${d * -6}%`, opacity: 0 }),
          }}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ x: { type: "spring", stiffness: 220, damping: 32 }, opacity: { duration: 0.45 }, scale: { duration: 1.2, ease: ease.out } }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.25}
          onDragEnd={(_, info) => {
            if (info.offset.x < -70) go(1);
            else if (info.offset.x > 70) go(-1);
          }}
          className="absolute inset-0 touch-pan-y"
        >
          <SmartImage src={l.images[index]} alt={`${l.title}, photo ${index + 1} of ${count}`} seed={`${l.id}-${index}`} className="h-full w-full" />
        </motion.div>
      </AnimatePresence>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/35 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/30 to-transparent" />

      <motion.button
        type="button"
        onClick={onBack}
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.15, ...spring.soft }}
        className="group absolute left-4 top-4 flex h-10 items-center gap-2 rounded-full border border-white/20 bg-black/30 px-4 font-mono text-[12px] text-white backdrop-blur-md transition-colors hover:bg-black/45 sm:left-8 sm:top-7"
      >
        <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-0.5" />
        Back to results
      </motion.button>

      <div className="absolute right-4 top-4 flex flex-col gap-3 sm:right-8 sm:top-7">
        <HeartButton id={l.id} size="lg" />
        <div className="relative">
          <motion.button
            type="button"
            whileTap={{ scale: 0.9 }}
            onClick={share}
            aria-label="Share this home"
            className="grid h-12 w-12 place-items-center rounded-full border border-white/25 bg-black/25 text-white backdrop-blur-md transition-colors hover:bg-black/40"
          >
            <Share className="h-5 w-5" />
          </motion.button>
          <AnimatePresence>
            {copied && (
              <motion.span
                initial={{ opacity: 0, x: 6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="absolute right-full top-1/2 mr-3 -translate-y-1/2 whitespace-nowrap rounded-full bg-ink px-3 py-1.5 font-mono text-[11px] text-paper"
              >
                Link copied
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="absolute bottom-4 right-4 flex h-10 items-center gap-1 rounded-full border border-white/20 bg-black/30 px-1 font-mono text-[12px] text-white backdrop-blur-md sm:bottom-7 sm:right-8">
        <button type="button" onClick={() => go(-1)} aria-label="Previous photo" className="grid h-8 w-8 place-items-center rounded-full transition-colors hover:bg-white/15">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <span className="min-w-[42px] text-center tabular-nums" aria-live="polite">
          {index + 1} / {count}
        </span>
        <button type="button" onClick={() => go(1)} aria-label="Next photo" className="grid h-8 w-8 place-items-center rounded-full transition-colors hover:bg-white/15">
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </section>
  );
}

function About({ listing: l }: { listing: Listing }) {
  const [open, setOpen] = useState(false);
  const features = l.features.map((f) => FEATURE_LABEL[f].toLowerCase());
  const more = [
    `Built in ${l.yearBuilt}, with ${l.area} m² of living space${l.plot ? ` on a ${l.plot} m² plot` : ""}.`,
    features.length ? `It comes with ${features.slice(0, -1).join(", ")}${features.length > 1 ? " and " : ""}${features[features.length - 1]}.` : "",
    l.nearStation ? "The nearest train station is within walking distance." : "",
    `Listed by ${l.agency}.`,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="mt-7 max-w-[62ch]">
      <p className="font-mono text-[14px] leading-[1.75] text-ink-soft">{l.summary}</p>
      <AnimatePresence initial={false}>
        {open && (
          <motion.p
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: ease.out }}
            className="overflow-hidden font-mono text-[14px] leading-[1.75] text-ink-soft"
          >
            <span className="block pt-3">{more}</span>
          </motion.p>
        )}
      </AnimatePresence>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="mt-3 flex items-center gap-2 font-mono text-[13px] text-ink transition-opacity hover:opacity-70"
      >
        {open ? "Read less" : "Read more"}
        <ChevronDown className={clsx("h-3.5 w-3.5 transition-transform duration-300", open && "rotate-180")} />
      </button>
    </div>
  );
}

function Tabs({ value, onChange }: { value: Tab; onChange: (t: Tab) => void }) {
  return (
    <div className="no-scrollbar -mx-5 mt-10 overflow-x-auto px-5 sm:mx-0 sm:px-0" role="tablist">
      <div className="flex min-w-max border-b border-line">
        {TABS.map((t, i) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={value === t}
            onClick={() => onChange(t)}
            className={clsx(
              "relative h-12 flex-1 whitespace-nowrap px-6 font-mono text-[13px] transition-colors duration-300",
              value === t ? "text-ink" : "text-ink-soft hover:text-ink",
            )}
          >
            {value === t && (
              <motion.span layoutId="tab-pill" transition={spring.snappy} className="absolute inset-x-0 inset-y-1 rounded-full bg-paper-raised shadow-card" />
            )}
            {i > 0 && value !== t && value !== TABS[i - 1] && <span className="absolute left-0 top-1/2 h-5 w-px -translate-y-1/2 bg-line" />}
            <span className="relative">{t}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function TabPanel({ tab, listing: l, similar, onPhoto }: { tab: Tab; listing: Listing; similar: Listing[]; onPhoto: (i: number) => void }) {
  if (tab === "Photos") {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        {l.images.map((src, i) => (
          <button key={src} type="button" onClick={() => onPhoto(i)} className="group overflow-hidden rounded-lg" aria-label={`Show photo ${i + 1}`}>
            <SmartImage src={src} alt="" seed={`${l.id}-${i}`} className="aspect-[4/3] w-full transition-transform duration-700 ease-out group-hover:scale-[1.03]" />
          </button>
        ))}
      </div>
    );
  }
  if (tab === "Floorplan") {
    return (
      <div className="rounded-xl border border-dashed border-line p-8 text-center">
        <p className="font-serif text-2xl font-light">No floorplan yet</p>
        <p className="mx-auto mt-2 max-w-[44ch] font-mono text-[13px] leading-relaxed text-ink-soft">
          {l.agency} hasn&apos;t added one. We&apos;ll ask for it when you book a viewing.
        </p>
      </div>
    );
  }
  if (tab === "Location") {
    return (
      <div>
        <BelgiumMap pins={[{ id: l.id, lat: l.lat, lng: l.lng, label: l.street }]} active={l.id} className="h-[360px] rounded-xl" />
        <p className="mt-4 font-mono text-[13px] leading-relaxed text-ink-soft">
          {l.street}, {l.neighbourhood}, {l.city}. The house number is shared once your viewing is booked.
          {l.nearStation && " A train station is within walking distance."}
        </p>
      </div>
    );
  }
  if (tab === "Similar homes") {
    if (!similar.length) return <p className="font-mono text-[13px] text-ink-soft">Nothing close to this one yet.</p>;
    return (
      <div className="grid gap-4 sm:grid-cols-3">
        {similar.map((s) => (
          <Link key={s.id} href={`/homes/${s.id}`} className="group block">
            <SmartImage src={s.images[0]} alt="" seed={s.id} className="aspect-[4/3] w-full rounded-lg transition-transform duration-700 ease-out group-hover:scale-[1.02]" />
            <p className="mt-3 text-[14px] font-medium">
              {s.city}, {s.neighbourhood}
            </p>
            <p className="font-mono text-[14px] tabular-nums text-ink-soft">{formatPrice(s.price)}</p>
          </Link>
        ))}
      </div>
    );
  }
  const facts: [string, string][] = [
    ["Type", TYPE_LABEL[l.type]],
    ["Living area", `${l.area} m²`],
    ...(l.plot ? ([["Plot", `${l.plot} m²`]] as [string, string][]) : []),
    ["Bedrooms", l.bedrooms ? String(l.bedrooms) : "Studio"],
    ["Bathrooms", String(l.bathrooms)],
    ["Energy label", l.epc],
    ["Built", String(l.yearBuilt)],
    ["Price per m²", formatPrice(Math.round(l.price / l.area))],
  ];
  return (
    <div>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
        {facts.map(([k, v]) => (
          <div key={k}>
            <dt className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">{k}</dt>
            <dd className="mt-1 font-mono text-[15px] tabular-nums">{v}</dd>
          </div>
        ))}
      </dl>
      {l.features.length > 0 && (
        <ul className="mt-7 flex flex-wrap gap-2">
          {l.features.map((f) => (
            <li key={f} className="rounded-full border border-ink/20 px-3.5 py-1.5 font-mono text-[12px]">
              {FEATURE_LABEL[f]}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Actions({ listing: l, compact }: { listing: Listing; compact?: boolean }) {
  const saved = useShortlist().includes(l.id);
  const [soon, setSoon] = useState<"viewing" | "interest" | "contact" | null>(null);

  const note =
    soon === "viewing"
      ? "Coming next: pick a slot straight from the agent's agenda, no phone calls."
      : soon === "interest"
        ? "Coming next: a non-binding interest bid, with the bid count and range shown when the seller allows it."
        : soon === "contact"
          ? `Coming next: message ${l.agency} from here, with their replies in one place.`
          : null;

  if (compact) {
    return (
      <div>
        <AnimatePresence>
          {note && (
            <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden font-mono text-[12px] leading-relaxed text-ink-soft">
              <span className="block pb-3">{note}</span>
            </motion.p>
          )}
        </AnimatePresence>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => toggleShortlist(l.id)}
            aria-pressed={saved}
            aria-label={saved ? "Remove from shortlist" : "Save to shortlist"}
            className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-ink/25"
          >
            <Bookmark className={clsx("h-4 w-4", saved && "fill-current")} />
          </button>
          <Primary className="flex-1" onClick={() => setSoon("viewing")}>
            Book a viewing
          </Primary>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <Primary onClick={() => setSoon("viewing")}>Book a viewing</Primary>
      <motion.button
        type="button"
        whileTap={{ scale: 0.97 }}
        transition={spring.snappy}
        onClick={() => toggleShortlist(l.id)}
        aria-pressed={saved}
        className="flex h-12 items-center justify-center gap-2.5 rounded-full border border-ink/25 font-mono text-[13px] transition-colors hover:border-ink"
      >
        <Bookmark className={clsx("h-4 w-4 transition-all", saved && "fill-current")} />
        <AnimatePresence mode="wait" initial={false}>
          <motion.span key={String(saved)} initial={{ y: 6, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -6, opacity: 0 }} transition={spring.snappy}>
            {saved ? "On your shortlist" : "Save to shortlist"}
          </motion.span>
        </AnimatePresence>
      </motion.button>
      <div className="mt-1 flex justify-between px-1 font-mono text-[12px] text-ink-soft">
        <button type="button" onClick={() => setSoon("interest")} className="underline-offset-4 hover:text-ink hover:underline">
          Register interest
        </button>
        <button type="button" onClick={() => setSoon("contact")} className="underline-offset-4 hover:text-ink hover:underline">
          Contact agent
        </button>
      </div>
      <AnimatePresence>
        {note && (
          <motion.p
            key={soon}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-xl bg-brick-soft/70 p-4 font-mono text-[12px] leading-relaxed text-ink"
          >
            {note}
          </motion.p>
        )}
      </AnimatePresence>
      <p className="mt-4 border-t border-line pt-4 font-mono text-[11px] leading-relaxed text-ink-faint">Listed by {l.agency}</p>
    </div>
  );
}

function Primary({ children, onClick, className }: { children: ReactNode; onClick: () => void; className?: string }) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.97 }}
      whileHover={{ y: -1 }}
      transition={spring.snappy}
      onClick={onClick}
      className={clsx("group flex h-12 items-center justify-center gap-2.5 rounded-full bg-cta font-mono text-[13px] text-cta-ink shadow-card transition-shadow hover:shadow-lift", className)}
    >
      {children}
      <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
    </motion.button>
  );
}
