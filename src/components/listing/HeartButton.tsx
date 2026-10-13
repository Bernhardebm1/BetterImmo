"use client";

import { AnimatePresence, motion } from "motion/react";
import clsx from "clsx";
import { Heart } from "lucide-react";
import { spring } from "@/lib/motion";
import { toggleShortlist, useShortlist } from "@/lib/shortlist";

/** Save to (or remove from) the shortlist, with a small burst when saved. */
export function HeartButton({ id, className, size = "sm" }: { id: string; className?: string; size?: "sm" | "lg" }) {
  const saved = useShortlist().includes(id);
  return (
    <motion.button
      type="button"
      aria-label={saved ? "Remove from shortlist" : "Save to shortlist"}
      aria-pressed={saved}
      whileTap={{ scale: 0.85 }}
      transition={spring.snappy}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleShortlist(id);
      }}
      className={clsx(
        "relative grid place-items-center rounded-full backdrop-blur-md transition-colors",
        size === "lg" ? "h-12 w-12 border border-white/25 bg-black/25 text-white hover:bg-black/40" : "h-7 w-7 bg-black/25 text-white hover:bg-black/45",
        className,
      )}
    >
      <motion.span key={String(saved)} initial={{ scale: saved ? 0.4 : 1 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 600, damping: 14 }}>
        <Heart className={clsx(size === "lg" ? "h-5 w-5" : "h-3.5 w-3.5", saved && "fill-brick text-brick")} strokeWidth={2} />
      </motion.span>
      <AnimatePresence>{saved && <Burst radius={size === "lg" ? 30 : 20} />}</AnimatePresence>
    </motion.button>
  );
}

function Burst({ radius }: { radius: number }) {
  return (
    <span className="pointer-events-none absolute inset-0" aria-hidden>
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        return (
          <motion.span
            key={i}
            className="absolute left-1/2 top-1/2 -ml-[3px] -mt-[3px] h-1.5 w-1.5 rounded-full bg-brick"
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{ x: Math.cos(angle) * radius, y: Math.sin(angle) * radius, opacity: 0, scale: 0.3 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          />
        );
      })}
    </span>
  );
}
