"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { ArrowUp } from "lucide-react";
import { spring } from "@/lib/motion";

const EXAMPLES = [
  "A 2-bed apartment in Gent near the station, under €375k",
  "Family house with a garden around Leuven, max 600k",
  "Something energy-efficient in Antwerp with a terrace",
  "Een huis met tuin in Mechelen, 4 slaapkamers",
  "Loft or apartment in Brussels, parking is a must",
];

export function Composer({
  size,
  loading,
  onSubmit,
  autoFocus,
}: {
  size: "hero" | "compact";
  loading: boolean;
  onSubmit: (text: string) => void;
  autoFocus?: boolean;
}) {
  const [value, setValue] = useState("");
  const [example, setExample] = useState(0);
  const ref = useRef<HTMLTextAreaElement>(null);
  const hero = size === "hero";

  useEffect(() => {
    if (value) return;
    const id = setInterval(() => setExample((i) => (i + 1) % EXAMPLES.length), 3600);
    return () => clearInterval(id);
  }, [value]);

  // Grow with the text, up to a few lines.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.min(el.scrollHeight, hero ? 180 : 120)}px`;
  }, [value, hero]);

  const submit = () => {
    const text = value.trim();
    if (!text || loading) return;
    onSubmit(text);
    setValue("");
  };

  return (
    <motion.form
      layoutId="composer"
      transition={spring.gentle}
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className={clsx(
        "group relative flex w-full items-end gap-3 border border-line bg-paper-raised shadow-card",
        "transition-[border-color,box-shadow] duration-300 focus-within:border-ink-faint focus-within:shadow-lift",
        hero ? "rounded-[28px] p-3 pl-6" : "rounded-[22px] p-2 pl-5",
      )}
    >
      <div className="relative min-w-0 flex-1 self-center">
        <textarea
          ref={ref}
          rows={1}
          value={value}
          autoFocus={autoFocus}
          aria-label="Describe the home you're looking for"
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          className={clsx(
            "block w-full resize-none bg-transparent text-ink outline-none focus-visible:outline-none",
            hero ? "py-3 text-lg leading-7 sm:text-xl" : "py-2 text-base leading-6",
          )}
        />
        {!value && (
          <div className={clsx("pointer-events-none absolute inset-x-0 overflow-hidden text-ink-faint", hero ? "top-3 h-7 text-lg sm:text-xl" : "top-2 h-6 text-base")}>
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={example}
                className="block truncate"
                initial={{ y: "100%", opacity: 0, filter: "blur(4px)" }}
                animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                exit={{ y: "-100%", opacity: 0, filter: "blur(4px)" }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              >
                {hero ? EXAMPLES[example] : "Refine your search, e.g. “add a garden” or “max 400k”"}
              </motion.span>
            </AnimatePresence>
          </div>
        )}
      </div>
      <motion.button
        type="submit"
        aria-label="Search"
        disabled={!value.trim() || loading}
        whileTap={{ scale: 0.92 }}
        transition={spring.snappy}
        className={clsx(
          "relative grid shrink-0 place-items-center rounded-full bg-ink text-paper transition-opacity duration-200",
          "disabled:cursor-default disabled:opacity-25",
          hero ? "h-12 w-12" : "h-10 w-10",
        )}
      >
        <AnimatePresence mode="wait" initial={false}>
          {loading ? (
            <motion.span
              key="spin"
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1, rotate: 360 }}
              exit={{ opacity: 0, scale: 0.6 }}
              transition={{ rotate: { repeat: Infinity, duration: 0.9, ease: "linear" }, default: spring.snappy }}
              className="block h-4 w-4 rounded-full border-2 border-paper/30 border-t-paper"
            />
          ) : (
            <motion.span key="arrow" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={spring.snappy}>
              <ArrowUp className={hero ? "h-5 w-5" : "h-4 w-4"} strokeWidth={2.25} />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </motion.form>
  );
}
