"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "motion/react";

const LEAD = "A ";
const TAIL = "real estate search";

/** Typing speeds in ms. A little jitter makes it feel like a person, not a ticker. */
const TYPE = 85;
const DELETE = 45;
const JITTER = 55;
const HOLD = 2400;
const BETWEEN = 380;

type State = {
  /** Characters of "A <adjective>" shown on line one. */
  head: number;
  /** Characters of the tail shown on line two. */
  tail: number;
  word: number;
  /** Where the caret sits: end of line one (editing the adjective) or end of line two (intro). */
  caret: "head" | "tail";
  typing: boolean;
};

/**
 * Types "A better / real estate search", then moves the caret back after the
 * adjective and keeps swapping it: backspace "better", type "calmer", and so on.
 */
export function Typewriter({ words, className }: { words: string[]; className?: string }) {
  const reduce = useReducedMotion();
  const [s, setS] = useState<State>({ head: 0, tail: 0, word: 0, caret: "head", typing: true });
  const [phase, setPhase] = useState<"intro" | "hold" | "delete" | "type">("intro");

  const word = words[s.word];
  const headText = LEAD + word;

  useEffect(() => {
    // Reduced motion: no typing, just swap the word every few seconds.
    if (reduce) {
      const id = setInterval(
        () => setS((x) => ({ ...x, head: 99, tail: 99, word: (x.word + 1) % words.length, typing: false, caret: "head" })),
        HOLD + 600,
      );
      return () => clearInterval(id);
    }

    const jitter = () => Math.random() * JITTER;
    let t: ReturnType<typeof setTimeout>;

    if (phase === "intro") {
      if (s.head < headText.length) t = setTimeout(() => setS((x) => ({ ...x, head: x.head + 1 })), TYPE + jitter());
      else if (s.tail < TAIL.length)
        t = setTimeout(() => setS((x) => ({ ...x, tail: x.tail + 1, caret: "tail" })), (s.tail === 0 ? 220 : TYPE) + jitter());
      else
        t = setTimeout(() => {
          setS((x) => ({ ...x, typing: false }));
          setPhase("hold");
        }, 200);
    } else if (phase === "hold") {
      t = setTimeout(() => {
        setS((x) => ({ ...x, caret: "head", typing: true }));
        setPhase("delete");
      }, HOLD);
    } else if (phase === "delete") {
      if (s.head > LEAD.length) t = setTimeout(() => setS((x) => ({ ...x, head: x.head - 1 })), DELETE);
      else
        t = setTimeout(() => {
          setS((x) => ({ ...x, word: (x.word + 1) % words.length }));
          setPhase("type");
        }, BETWEEN);
    } else {
      if (s.head < headText.length) t = setTimeout(() => setS((x) => ({ ...x, head: x.head + 1 })), TYPE + jitter());
      else
        t = setTimeout(() => {
          setS((x) => ({ ...x, typing: false }));
          setPhase("hold");
        }, 120);
    }
    return () => clearTimeout(t);
  }, [phase, s.head, s.tail, headText.length, reduce, words.length]);

  const head = reduce ? headText : headText.slice(0, s.head);
  const tail = reduce ? TAIL : TAIL.slice(0, s.tail);
  const caretAt = reduce ? null : s.caret;
  const caret = <Caret blinking={!s.typing} />;

  return (
    <h1 className={className} aria-label={`A ${word} real estate search`}>
      <span aria-hidden className="block">
        <span className="block whitespace-pre">
          {head.slice(0, LEAD.length)}
          <span className="text-brick">{head.slice(LEAD.length)}</span>
          {caretAt === "head" && caret}
          {/* Keeps the line's height while it is still empty. */}
          {!head && "​"}
        </span>
        <span className="block whitespace-pre">
          {tail}
          {caretAt === "tail" && caret}
          {!tail && "​"}
        </span>
      </span>
    </h1>
  );
}

function Caret({ blinking }: { blinking: boolean }) {
  return (
    <span
      className="ml-[0.06em] inline-block h-[0.95em] w-[0.07em] translate-y-[0.14em] bg-brick"
      style={{ animation: blinking ? "caret-blink 1.05s steps(1) infinite" : undefined }}
    />
  );
}
