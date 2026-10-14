"use client";

import { motion } from "motion/react";
import clsx from "clsx";
import { Sparkles } from "lucide-react";

/** The assistant's small avatar. */
export function AssistantMark({ className }: { className?: string }) {
  return (
    <div className={clsx("grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brick text-white", className)}>
      <Sparkles className="h-3.5 w-3.5" />
    </div>
  );
}

/** Words fade up one after another, like someone talking. */
export function Reveal({ text, className = "text-[14px] leading-relaxed text-ink-soft", delay = 0 }: { text: string; className?: string; delay?: number }) {
  return (
    <p className={className}>
      {text.split(" ").map((w, i) => (
        <motion.span
          key={i}
          className="inline-block"
          initial={{ opacity: 0, y: 4, filter: "blur(3px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.35, delay: delay + i * 0.02, ease: [0.22, 1, 0.36, 1] }}
        >
          {w}&nbsp;
        </motion.span>
      ))}
    </p>
  );
}

export function Thinking() {
  return (
    <div className="flex h-7 items-center gap-1.5" aria-label="Thinking">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-ink-faint"
          animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
          transition={{ duration: 1, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}
