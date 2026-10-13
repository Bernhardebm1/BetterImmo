"use client";

import { AnimatePresence, motion, useMotionValue, useTransform } from "motion/react";
import clsx from "clsx";
import { Bath, BedDouble, Check, Heart, Ruler, ThumbsDown, ThumbsUp, TrainFront } from "lucide-react";
import { SmartImage } from "@/components/SmartImage";
import { formatPrice } from "@/lib/format";
import { spring } from "@/lib/motion";
import type { Match } from "@/lib/search/match";

const SWIPE = 110;

export function MatchCard({
  match,
  index,
  liked,
  onLike,
  onDislike,
  onOpen,
}: {
  match: Match;
  index: number;
  liked: boolean;
  onLike: () => void;
  onDislike: () => void;
  onOpen: () => void;
}) {
  const { listing: l, reasons, misses } = match;
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 0, 200], [-6, 0, 6]);
  const likeOpacity = useTransform(x, [20, SWIPE], [0, 1]);
  const nopeOpacity = useTransform(x, [-SWIPE, -20], [1, 0]);

  return (
    <motion.article
      layout
      custom={index}
      variants={{
        hidden: { opacity: 0, y: 28, scale: 0.97 },
        shown: (i: number) => ({ opacity: 1, y: 0, scale: 1, transition: { ...spring.soft, delay: Math.min(i, 6) * 0.06 } }),
        gone: { opacity: 0, x: -140, rotate: -6, scale: 0.92, transition: { duration: 0.32, ease: [0.4, 0, 1, 1] } },
      }}
      initial="hidden"
      animate="shown"
      exit="gone"
      transition={spring.soft}
      style={{ x, rotate }}
      drag="x"
      dragSnapToOrigin
      dragElastic={0.6}
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={(_, info) => {
        if (info.offset.x > SWIPE) onLike();
        else if (info.offset.x < -SWIPE) onDislike();
      }}
      whileHover={{ y: -4 }}
      className="group relative flex cursor-grab touch-pan-y select-none flex-col overflow-hidden rounded-[22px] border border-line bg-paper-raised shadow-card transition-shadow duration-300 hover:shadow-lift active:cursor-grabbing"
    >
      <button type="button" onClick={onOpen} className="relative block text-left" aria-label={`Open ${l.title}`}>
        <motion.div layoutId={`photo-${l.id}`} transition={spring.gentle} className="overflow-hidden">
          <SmartImage src={l.images[0]} alt={l.title} seed={l.id} className="aspect-[4/3] w-full transition-transform duration-700 ease-out group-hover:scale-[1.03]" />
        </motion.div>
        <span className="absolute left-3 top-3 rounded-full bg-paper-raised/90 px-2.5 py-1 text-xs font-semibold text-ink backdrop-blur">
          EPC {l.epc}
        </span>
        <motion.span style={{ opacity: likeOpacity }} className="absolute right-3 top-3 rounded-full bg-moss px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
          Like
        </motion.span>
        <motion.span style={{ opacity: nopeOpacity }} className="absolute right-3 top-3 rounded-full bg-brick px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
          Not for me
        </motion.span>
      </button>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <p className="font-display text-[28px] leading-none tracking-tight">{formatPrice(l.price)}</p>
          <p className="mt-1 shrink-0 text-xs text-ink-faint">{l.agency}</p>
        </div>
        <h3 className="mt-2 text-[15px] font-medium leading-snug text-ink">{l.title}</h3>
        <p className="mt-0.5 text-sm text-ink-soft">
          {l.neighbourhood}, {l.city}
        </p>

        <dl className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-soft">
          <Stat icon={<BedDouble className="h-4 w-4" />} label={l.bedrooms ? `${l.bedrooms} bed` : "Studio"} />
          <Stat icon={<Bath className="h-4 w-4" />} label={`${l.bathrooms} bath`} />
          <Stat icon={<Ruler className="h-4 w-4" />} label={`${l.area} m²`} />
          {l.nearStation && <Stat icon={<TrainFront className="h-4 w-4" />} label="Station" />}
        </dl>

        {(reasons.length > 0 || misses.length > 0) && (
          <ul className="mt-4 flex flex-wrap gap-1.5">
            {reasons.map((r) => (
              <li key={r} className="flex items-center gap-1 rounded-full bg-moss-soft px-2.5 py-1 text-xs font-medium text-moss">
                <Check className="h-3 w-3" strokeWidth={3} />
                {r}
              </li>
            ))}
            {misses.map((r) => (
              <li key={r} className="rounded-full bg-ink/5 px-2.5 py-1 text-xs font-medium text-ink-faint">
                {r}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-auto flex items-center gap-2 pt-5">
          <motion.button
            type="button"
            whileTap={{ scale: 0.9 }}
            transition={spring.snappy}
            onClick={onDislike}
            className="flex h-10 flex-1 items-center justify-center gap-2 rounded-full border border-line text-sm font-medium text-ink-soft transition-colors hover:border-brick hover:text-brick"
          >
            <ThumbsDown className="h-4 w-4" />
            Not for me
          </motion.button>
          <motion.button
            type="button"
            whileTap={{ scale: 0.9 }}
            transition={spring.snappy}
            onClick={onLike}
            aria-pressed={liked}
            className={clsx(
              "relative flex h-10 flex-1 items-center justify-center gap-2 rounded-full text-sm font-medium transition-colors",
              liked ? "bg-moss text-white" : "border border-line text-ink-soft hover:border-moss hover:text-moss",
            )}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={liked ? "saved" : "like"}
                initial={{ y: 8, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -8, opacity: 0 }}
                transition={spring.snappy}
                className="flex items-center gap-2"
              >
                {liked ? <Heart className="h-4 w-4 fill-current" /> : <ThumbsUp className="h-4 w-4" />}
                {liked ? "Saved" : "Like"}
              </motion.span>
            </AnimatePresence>
            <AnimatePresence>{liked && <Burst />}</AnimatePresence>
          </motion.button>
        </div>
      </div>
    </motion.article>
  );
}

function Stat({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-ink-faint">{icon}</span>
      <span>{label}</span>
    </div>
  );
}

/** Little ring of dots when something is saved. */
function Burst() {
  return (
    <span className="pointer-events-none absolute inset-0" aria-hidden>
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        return (
          <motion.span
            key={i}
            className="absolute left-1/2 top-1/2 h-1.5 w-1.5 rounded-full bg-moss"
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{ x: Math.cos(angle) * 34, y: Math.sin(angle) * 22, opacity: 0, scale: 0.4 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          />
        );
      })}
    </span>
  );
}
