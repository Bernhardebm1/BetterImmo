"use client";

import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Composer } from "@/components/search/Composer";
import { Typewriter } from "./Typewriter";
import { ease } from "@/lib/motion";

/** Swap for our own photography once we have it; anything wide with a lit house at dusk works. */
const HERO_PHOTO = "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=2400&q=80";

const ADJECTIVES = ["better", "calmer", "smarter", "kinder", "simpler", "clearer"];

/** When the arrow starts drawing: roughly when the headline has finished typing. */
const ARROW_DELAY = 2.9;

export function Landing({ loading, onSubmit }: { loading: boolean; onSubmit: (text: string) => void }) {
  return (
    <motion.main
      exit={{ opacity: 0, transition: { duration: 0.35 } }}
      className="relative isolate flex min-h-dvh flex-col overflow-hidden"
    >
      <Backdrop />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.2 }}
        className="relative z-10 px-6 pt-6 font-mono text-xs tracking-[0.4em] text-ink sm:px-10 sm:pt-8"
      >
        BETTERIMMO
      </motion.div>

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-5 pb-[14vh]">
        <div className="w-full max-w-[640px]">
          <Typewriter
            words={ADJECTIVES}
            className="font-mono text-[clamp(2rem,6.4vw,3.6rem)] font-light leading-[1.18] tracking-[-0.02em] text-ink"
          />

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.5, ease: ease.out }}
            className="relative mt-9 sm:mt-11"
          >
            <Composer size="hero" loading={loading} onSubmit={onSubmit} autoFocus placeholder="A house with a garden near Gent…" />
            <ArrowNoteSide />
          </motion.div>
          <ArrowNoteBelow />
        </div>
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.2 }}
        className="absolute bottom-6 left-6 z-10 hidden font-mono text-[11px] leading-5 text-ink-faint sm:bottom-8 sm:left-10 sm:block"
      >
        Homes across Belgium.
        <br />
        Described, not filtered.
      </motion.p>
    </motion.main>
  );
}

/** The photo, drifting gently against the pointer, under a dark wash so the type stays readable. */
function Backdrop() {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const img = useRef<HTMLImageElement>(null);
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const sx = useSpring(px, { stiffness: 40, damping: 18, mass: 1.2 });
  const sy = useSpring(py, { stiffness: 40, damping: 18, mass: 1.2 });
  const x = useTransform(sx, (v) => v * -22);
  const y = useTransform(sy, (v) => v * -14);

  useEffect(() => {
    if (img.current?.complete && img.current.naturalWidth) setLoaded(true);
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      px.set((e.clientX / window.innerWidth) * 2 - 1);
      py.set((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, [px, py]);

  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden>
      {/* Dusk glow, also the fallback if the photo can't load. */}
      <div className="absolute inset-0 bg-[radial-gradient(120%_70%_at_70%_100%,rgb(242_106_33/0.22),transparent_60%)]" />
      {!failed && (
        <motion.div style={{ x, y }} className="absolute -inset-[4%]">
          <motion.img
            ref={img}
            src={HERO_PHOTO}
            alt=""
            onLoad={() => setLoaded(true)}
            onError={() => setFailed(true)}
            initial={false}
            animate={loaded ? { opacity: 0.62, scale: 1 } : { opacity: 0, scale: 1.08 }}
            transition={{ opacity: { duration: 1.6, ease: ease.out }, scale: { duration: 3.2, ease: ease.out } }}
            className="h-full w-full object-cover object-[60%_75%]"
          />
        </motion.div>
      )}
      {/* Darker at the top where the headline sits, opening up towards the house. */}
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,var(--paper)_0%,rgb(13_12_11/0.86)_30%,rgb(13_12_11/0.55)_62%,rgb(13_12_11/0.75)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(90%_80%_at_50%_45%,transparent_40%,rgb(13_12_11/0.7)_100%)]" />
    </div>
  );
}

function Draw({ d, delay, width = 1.6 }: { d: string; delay: number; width?: number }) {
  return (
    <motion.path
      d={d}
      fill="none"
      stroke="currentColor"
      strokeWidth={width}
      strokeLinecap="round"
      strokeLinejoin="round"
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: 1 }}
      transition={{ pathLength: { duration: 0.9, delay, ease: [0.65, 0, 0.35, 1] }, opacity: { duration: 0.01, delay } }}
    />
  );
}

function Note({ className, delay }: { className: string; delay: number }) {
  return (
    <motion.span
      initial={{ clipPath: "inset(-30% 100% -30% 0%)", opacity: 0 }}
      animate={{ clipPath: "inset(-30% -10% -30% 0%)", opacity: 1 }}
      transition={{ duration: 0.9, delay, ease: ease.out }}
      className={`block whitespace-nowrap font-hand text-[26px] leading-none text-ink-soft ${className}`}
    >
      Describe your dream home
    </motion.span>
  );
}

/** Wide screens: the note sits left of the chat box and the arrow loops into its left edge. */
function ArrowNoteSide() {
  return (
    <div className="pointer-events-none absolute right-[calc(100%+14px)] top-1/2 hidden w-[230px] xl:block" aria-hidden>
      <svg viewBox="0 0 150 90" className="ml-auto h-[78px] w-[130px] text-ink-soft">
        <Draw d="M10 84 C 18 52, 52 30, 84 34 C 104 37, 118 30, 140 14" delay={ARROW_DELAY} />
        <Draw d="M126 10 L 141 13 L 135 27" delay={ARROW_DELAY + 0.75} />
      </svg>
      <Note className="-mt-1 -rotate-[4deg]" delay={ARROW_DELAY + 0.35} />
    </div>
  );
}

/** Narrow screens: the note sits under the chat box with the arrow curling up into it. */
function ArrowNoteBelow() {
  return (
    <div className="pointer-events-none mt-3 flex items-start gap-1 pl-3 xl:hidden" aria-hidden>
      <svg viewBox="0 0 60 70" className="h-[58px] w-[50px] shrink-0 text-ink-soft">
        <Draw d="M52 62 C 30 62, 14 50, 14 30 C 14 22, 16 14, 20 6" delay={ARROW_DELAY} />
        <Draw d="M10 14 L 20 5 L 28 15" delay={ARROW_DELAY + 0.75} />
      </svg>
      <Note className="mt-9 -rotate-[3deg]" delay={ARROW_DELAY + 0.35} />
    </div>
  );
}
