"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { ArrowRight } from "lucide-react";
import { spring } from "@/lib/motion";

export function Composer({
  size,
  loading,
  onSubmit,
  autoFocus,
  placeholder,
}: {
  size: "hero" | "compact";
  loading: boolean;
  onSubmit: (text: string) => void;
  autoFocus?: boolean;
  placeholder?: string;
}) {
  const [value, setValue] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);
  const hero = size === "hero";

  // Grow with the text, up to a few lines. Empty stays one line even if the placeholder wraps.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "";
    if (value) el.style.height = `${Math.min(el.scrollHeight, hero ? 168 : 120)}px`;
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
        "group relative flex w-full items-center gap-3 border border-ink/15",
        "transition-[border-color,background-color,box-shadow] duration-300",
        "focus-within:border-ink/35 focus-within:shadow-[0_0_0_4px_rgb(251_116_41/0.08)]",
        hero ? "rounded-lg bg-paper-raised/60 p-2.5 pl-5 shadow-card backdrop-blur-xl focus-within:bg-paper-raised/80" : "rounded-full p-1 pl-4 focus-within:bg-paper-raised/60",
      )}
    >
      <textarea
        ref={ref}
        rows={1}
        value={value}
        autoFocus={autoFocus}
        placeholder={placeholder ?? "Refine, e.g. “add a garden” or “max 400k”"}
        aria-label="Describe the home you're looking for"
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            submit();
          }
        }}
        className={clsx(
          "block min-w-0 flex-1 resize-none overflow-hidden bg-transparent text-ink caret-brick outline-none placeholder:truncate placeholder:text-ink-faint focus-visible:outline-none",
          hero ? "h-7 py-0.5 font-mono text-sm leading-6" : "h-6 text-[13px] leading-6",
        )}
      />
      <motion.button
        type="submit"
        aria-label="Search"
        disabled={loading}
        whileTap={{ scale: 0.9 }}
        whileHover={{ scale: 1.06 }}
        transition={spring.snappy}
        className={clsx(
          "relative grid shrink-0 place-items-center rounded-full text-white transition-[background-color,opacity] duration-300",
          value.trim() ? "bg-brick" : "bg-brick/80",
          hero ? "h-11 w-11" : "h-8 w-8",
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
              className="block h-4 w-4 rounded-full border-2 border-white/30 border-t-white"
            />
          ) : (
            <motion.span key="arrow" initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 6 }} transition={spring.snappy}>
              <ArrowRight className={hero ? "h-[18px] w-[18px]" : "h-4 w-4"} strokeWidth={2.25} />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </motion.form>
  );
}
