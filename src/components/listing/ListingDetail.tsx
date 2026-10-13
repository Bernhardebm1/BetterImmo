"use client";

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import clsx from "clsx";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Bath,
  BedDouble,
  Bookmark,
  Car,
  FileBadge,
  Share,
  SquareArrowOutUpRight,
  Sprout,
  Sun,
  TrainFront,
} from "lucide-react";
import { SmartImage } from "@/components/SmartImage";
import { HomesMap } from "@/components/map/HomesMap";
import { HeartButton } from "./HeartButton";
import { FEATURE_LABEL, TYPE_LABEL, formatPrice } from "@/lib/format";
import { ease, spring } from "@/lib/motion";
import { cameFromResults } from "@/lib/nav";
import { toggleShortlist, useShortlist } from "@/lib/shortlist";
import type { Feature, Listing } from "@/lib/types";

const TABS = ["Overview", "Photos", "Floorplan", "Location", "Similar homes"] as const;
type Tab = (typeof TABS)[number];

const ICON = { className: "h-4 w-4", strokeWidth: 1.5 };
const FEATURE_ICON: Partial<Record<Feature, ReactNode>> = {
  garden: <Sprout {...ICON} />,
  terrace: <Sun {...ICON} />,
  balcony: <Sun {...ICON} />,
  parking: <Car {...ICON} />,
  garage: <Car {...ICON} />,
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
    <motion.main initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }} className="min-h-dvh bg-paper pb-32 lg:pb-24">
      <Hero listing={l} index={photo} onIndex={setPhoto} onBack={() => (cameFromResults() ? router.back() : router.push("/"))} />

      <div className="mx-auto max-w-[1280px] px-5 pt-7 sm:px-10 sm:pt-8">
        <div className="flex items-start justify-between gap-10">
          <Rise delay={0.1}>
            <p className="font-figures text-[12px] tracking-[0.08em] text-ink">
              {l.city}, {l.neighbourhood}
            </p>
            <h1 className="mt-2 font-serif text-[clamp(38px,4.4vw,56px)] font-normal leading-[1.05] tracking-[-0.01em]">{l.street}</h1>
            <p className="mt-2 font-figures text-[22px] tabular-nums">{formatPrice(l.price)}</p>
          </Rise>
          <Rise delay={0.18} className="hidden w-[300px] shrink-0 pt-2 lg:block">
            <Actions listing={l} />
          </Rise>
        </div>

        <Rise delay={0.22}>
          <ul className="mt-6 flex flex-wrap gap-x-8 gap-y-3 border-b border-line pb-6 text-[13px] text-ink">
            <Fact icon={<BedDouble {...ICON} />}>{l.bedrooms ? `${l.bedrooms} beds` : "Studio"}</Fact>
            <Fact icon={<Bath {...ICON} />}>
              {l.bathrooms} {l.bathrooms === 1 ? "bath" : "baths"}
            </Fact>
            <Fact icon={<SquareArrowOutUpRight className="h-3.5 w-3.5" strokeWidth={1.5} />}>{l.area} m²</Fact>
            {l.features
              .filter((f) => FEATURE_ICON[f])
              .slice(0, 2)
              .map((f) => (
                <Fact key={f} icon={FEATURE_ICON[f]}>
                  {FEATURE_LABEL[f]}
                </Fact>
              ))}
            {l.nearStation && <Fact icon={<TrainFront {...ICON} />}>Near a station</Fact>}
            <Fact icon={<FileBadge {...ICON} />}>Energy label {l.epc}</Fact>
          </ul>
        </Rise>

        <Rise delay={0.28}>
          <About listing={l} />
        </Rise>

        <Rise delay={0.34}>
          <div className="mt-7 grid grid-cols-[1.4fr_1fr_1.14fr] gap-2 sm:gap-2.5">
            {l.images.slice(1, 4).map((src, i) => {
              const more = i === 2 && l.images.length > 4;
              return (
                <button
                  key={src}
                  type="button"
                  onClick={() => (more ? setTab("Photos") : showPhoto(i + 1))}
                  className="group relative overflow-hidden rounded-[6px]"
                  aria-label={more ? "See all photos" : `Show photo ${i + 2}`}
                >
                  <SmartImage src={src} alt="" seed={`${l.id}-${i + 1}`} className="h-[clamp(96px,15vw,230px)] w-full transition-transform duration-700 ease-out group-hover:scale-[1.04]" />
                  {more && (
                    <span className="absolute bottom-2 right-2 rounded-full bg-glass px-3 py-1 text-[11px] text-glass-ink backdrop-blur-md">+{l.images.length - 4} photos</span>
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

      {/* Phones and tablets: the main actions stay within thumb reach. */}
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
    <li className="flex items-center gap-2.5">
      <span className="text-ink">{icon}</span>
      {children}
    </li>
  );
}

/** Light: solid white buttons on the photo. Dark: smoked glass with a hairline. */
const GLASS = "border border-glass-line bg-glass text-glass-ink shadow-[0_2px_10px_rgb(0_0_0/0.12)] backdrop-blur-md";

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
    <section className="relative h-[clamp(300px,44vh,520px)] overflow-hidden bg-ink/10" aria-roledescription="carousel" aria-label="Photos">
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

      <motion.button
        type="button"
        onClick={onBack}
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.15, ...spring.soft }}
        className={clsx("group absolute left-4 top-4 flex h-10 items-center gap-2.5 rounded-full px-5 text-[13px] sm:left-10 sm:top-9", GLASS)}
      >
        <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-0.5" strokeWidth={1.75} />
        Back to results
      </motion.button>

      <div className="absolute right-4 top-4 flex flex-col gap-3.5 sm:right-8 sm:top-5">
        <HeartButton id={l.id} size="lg" className={GLASS} />
        <div className="relative">
          <motion.button type="button" whileTap={{ scale: 0.9 }} onClick={share} aria-label="Share this home" className={clsx("grid h-12 w-12 place-items-center rounded-full", GLASS)}>
            <Share className="h-[18px] w-[18px]" strokeWidth={1.75} />
          </motion.button>
          <AnimatePresence>
            {copied && (
              <motion.span
                initial={{ opacity: 0, x: 6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="absolute right-full top-1/2 mr-3 -translate-y-1/2 whitespace-nowrap rounded-full bg-ink px-3 py-1.5 text-[12px] text-paper"
              >
                Link copied
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className={clsx("absolute bottom-4 right-4 flex h-10 items-center gap-0.5 rounded-full px-1 sm:bottom-6 sm:right-8", GLASS)}>
        <button type="button" onClick={() => go(-1)} aria-label="Previous photo" className="grid h-8 w-8 place-items-center rounded-full transition-opacity hover:opacity-60">
          <ArrowLeft className="h-4 w-4" strokeWidth={1.75} />
        </button>
        <span className="grid h-8 min-w-[42px] place-items-center rounded-full border border-current/25 px-2 font-figures text-[11px] tabular-nums" aria-live="polite">
          {index + 1}/{count}
        </span>
        <button type="button" onClick={() => go(1)} aria-label="Next photo" className="grid h-8 w-8 place-items-center rounded-full transition-opacity hover:opacity-60">
          <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
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
    <div className="mt-6 max-w-[64ch]">
      <p className="text-[15px] leading-[1.7] text-ink">{l.summary}</p>
      <AnimatePresence initial={false}>
        {open && (
          <motion.p
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: ease.out }}
            className="overflow-hidden text-[15px] leading-[1.7] text-ink"
          >
            <span className="block pt-3">{more}</span>
          </motion.p>
        )}
      </AnimatePresence>
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="mt-3 flex items-center gap-5 text-[13px] text-ink transition-opacity hover:opacity-60">
        {open ? "Read less" : "Read more"}
        <ArrowDown className={clsx("h-3.5 w-3.5 transition-transform duration-300", open && "rotate-180")} strokeWidth={1.75} />
      </button>
    </div>
  );
}

function Tabs({ value, onChange }: { value: Tab; onChange: (t: Tab) => void }) {
  return (
    <div className="no-scrollbar -mx-5 mt-7 overflow-x-auto px-5 sm:mx-0 sm:px-0" role="tablist">
      <div className="flex min-w-max border-y border-line">
        {TABS.map((t, i) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={value === t}
            onClick={() => onChange(t)}
            className={clsx("relative h-11 flex-1 whitespace-nowrap px-7 text-[13px] transition-colors duration-300", value === t ? "text-[var(--tab-ink)]" : "text-ink hover:opacity-70")}
          >
            {value === t && (
              <motion.span
                layoutId="tab-pill"
                transition={spring.snappy}
                className="absolute -inset-y-1 inset-x-0 rounded-full bg-[var(--tab)] shadow-[0_2px_8px_rgb(0_0_0/0.08)]"
              />
            )}
            {i > 0 && <span className="absolute left-0 top-0 h-full w-px bg-line" />}
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
      <div className="grid gap-2.5 sm:grid-cols-2">
        {l.images.map((src, i) => (
          <button key={src} type="button" onClick={() => onPhoto(i)} className="group overflow-hidden rounded-[6px]" aria-label={`Show photo ${i + 1}`}>
            <SmartImage src={src} alt="" seed={`${l.id}-${i}`} className="aspect-[4/3] w-full transition-transform duration-700 ease-out group-hover:scale-[1.03]" />
          </button>
        ))}
      </div>
    );
  }
  if (tab === "Floorplan") {
    return (
      <div className="rounded-[6px] border border-dashed border-line p-8 text-center">
        <p className="font-serif text-2xl">No floorplan yet</p>
        <p className="mx-auto mt-2 max-w-[44ch] text-[14px] leading-relaxed text-ink-soft">
          {l.agency} hasn&apos;t added one. We&apos;ll ask for it when you book a viewing.
        </p>
      </div>
    );
  }
  if (tab === "Location") {
    return (
      <div>
        <HomesMap pins={[{ id: l.id, lat: l.lat, lng: l.lng, label: l.street }]} active={l.id} className="h-[380px] rounded-[6px]" />
        <p className="mt-4 text-[14px] leading-relaxed text-ink-soft">
          {l.street}, {l.neighbourhood}, {l.city}. The house number is shared once your viewing is booked.
          {l.nearStation && " A train station is within walking distance."}
        </p>
      </div>
    );
  }
  if (tab === "Similar homes") {
    if (!similar.length) return <p className="text-[14px] text-ink-soft">Nothing close to this one yet.</p>;
    return (
      <div className="grid gap-5 sm:grid-cols-3">
        {similar.map((s) => (
          <Link key={s.id} href={`/homes/${s.id}`} className="group block">
            <SmartImage src={s.images[0]} alt="" seed={s.id} className="aspect-[4/3] w-full rounded-[6px] transition-transform duration-700 ease-out group-hover:scale-[1.02]" />
            <p className="mt-3 text-[14px]">
              {s.city}, {s.neighbourhood}
            </p>
            <p className="mt-0.5 font-figures text-[15px] tabular-nums">{formatPrice(s.price)}</p>
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
      <dl className="grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-4">
        {facts.map(([k, v]) => (
          <div key={k}>
            <dt className="text-[12px] text-ink-faint">{k}</dt>
            <dd className="mt-1 font-figures text-[15px] tabular-nums">{v}</dd>
          </div>
        ))}
      </dl>
      {l.features.length > 0 && (
        <ul className="mt-7 flex flex-wrap gap-2">
          {l.features.map((f) => (
            <li key={f} className="rounded-full border border-ink/15 px-4 py-1.5 text-[13px]">
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
  const [soon, setSoon] = useState(false);
  const note = soon ? `Coming next: pick a slot straight from ${l.agency}'s agenda, no phone calls.` : null;

  const save = (
    <motion.button
      type="button"
      whileTap={{ scale: 0.97 }}
      transition={spring.snappy}
      onClick={() => toggleShortlist(l.id)}
      aria-pressed={saved}
      aria-label={compact ? (saved ? "Remove from shortlist" : "Save to shortlist") : undefined}
      className={clsx(
        "flex h-12 items-center justify-center gap-2.5 rounded-full border border-ink/30 text-[13px] transition-colors hover:border-ink",
        compact && "w-12 shrink-0",
      )}
    >
      <Bookmark className={clsx("h-4 w-4 transition-all", saved && "fill-current")} strokeWidth={1.75} />
      {!compact && (
        <AnimatePresence mode="wait" initial={false}>
          <motion.span key={String(saved)} initial={{ y: 6, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -6, opacity: 0 }} transition={spring.snappy}>
            {saved ? "On your shortlist" : "Save to shortlist"}
          </motion.span>
        </AnimatePresence>
      )}
    </motion.button>
  );

  return (
    <div>
      {compact && <Note text={note} className="pb-3" />}
      <div className={clsx("flex gap-3", !compact && "flex-col")}>
        {compact && save}
        <Primary className={compact ? "flex-1" : undefined} onClick={() => setSoon(true)}>
          Book a viewing
        </Primary>
        {!compact && save}
      </div>
      {!compact && <Note text={note} className="pt-4" />}
    </div>
  );
}

function Note({ text, className }: { text: string | null; className?: string }) {
  return (
    <AnimatePresence>
      {text && (
        <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden text-[13px] leading-relaxed text-ink-soft">
          <span className={clsx("block", className)}>{text}</span>
        </motion.p>
      )}
    </AnimatePresence>
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
      className={clsx("group flex h-12 items-center justify-center gap-3 rounded-full bg-cta text-[13px] font-medium text-cta-ink transition-shadow hover:shadow-lift", className)}
    >
      {children}
      <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" strokeWidth={1.75} />
    </motion.button>
  );
}
