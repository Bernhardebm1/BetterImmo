"use client";

import { motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { ease } from "@/lib/motion";

/** Typing speeds in ms. A little jitter makes it feel like a person, not a ticker. */
const TYPE = 95;
const DELETE = 50;
const JITTER = 60;
const HOLD = 2600;
const BETWEEN = 320;
/** First swap waits for the headline to settle in. */
const FIRST_HOLD = 3000;

/**
 * "A better / real estate search." The sentence animates in once; after that only
 * the adjective is backspaced and retyped (better → calmer → smarter …).
 */
export function Typewriter({ words, className }: { words: string[]; className?: string }) {
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [shown, setShown] = useState(words[0].length);
  const [phase, setPhase] = useState<"hold" | "delete" | "type">("hold");
  const [first, setFirst] = useState(true);
  const word = words[index];

  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const jitter = () => Math.random() * JITTER;

    if (reduce) {
      // No typing: just swap the word now and then.
      t = setTimeout(() => setIndex((i) => (i + 1) % words.length), HOLD + 800);
      return () => clearTimeout(t);
    }

    if (phase === "hold") {
      t = setTimeout(() => {
        setFirst(false);
        setPhase("delete");
      }, first ? FIRST_HOLD : HOLD);
    } else if (phase === "delete") {
      if (shown > 0) t = setTimeout(() => setShown((n) => n - 1), DELETE);
      else
        t = setTimeout(() => {
          setIndex((i) => (i + 1) % words.length);
          setPhase("type");
        }, BETWEEN);
    } else {
      if (shown < word.length) t = setTimeout(() => setShown((n) => n + 1), TYPE + jitter());
      else t = setTimeout(() => setPhase("hold"), 0);
    }
    return () => clearTimeout(t);
  }, [phase, shown, word.length, first, reduce, words.length]);

  const typing = phase !== "hold";
  const lead = ["A"];
  const tail = ["real", "estate", "search."];
  let i = 0;
  const rise = () => ({
    initial: { opacity: 0, y: "0.35em", filter: "blur(6px)" },
    animate: { opacity: 1, y: 0, filter: "blur(0px)" },
    transition: { duration: 0.7, delay: 0.15 + i++ * 0.06, ease: ease.out },
  });

  return (
    <h1 className={className} aria-label={`A ${word} real estate search.`}>
      <span aria-hidden className="block">
        <span className="block whitespace-nowrap">
          {lead.map((w) => (
            <motion.span key={w} {...rise()} className="inline-block">
              {w}&nbsp;
            </motion.span>
          ))}
          <motion.span {...rise()} className="inline-block text-brick">
            {reduce ? word : word.slice(0, shown)}
            {!reduce && <Caret blinking={!typing} />}
          </motion.span>
        </span>
        <span className="block whitespace-nowrap">
          {tail.map((w, n) => (
            <motion.span key={w} {...rise()} className="inline-block">
              {w}
              {n < tail.length - 1 && " "}
            </motion.span>
          ))}
        </span>
      </span>
    </h1>
  );
}

function Caret({ blinking }: { blinking: boolean }) {
  return (
    <span
      className="ml-[0.05em] inline-block h-[0.9em] w-[0.06em] translate-y-[0.12em] bg-brick"
      style={{ animation: blinking ? "caret-blink 1.05s steps(1) infinite" : undefined }}
    />
  );
}
