"use client";

import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Composer } from "@/components/search/Composer";
import { Typewriter } from "./Typewriter";
import { ease } from "@/lib/motion";

/**
 * Townhouses in Antwerp (Kieran Child, Unsplash License), with terraced houses in
 * Utrecht (M Polinder, Unsplash License) as a backup. Swap for our own photography later.
 */
const HERO_PHOTOS = [
  "https://images.unsplash.com/photo-1782942287958-c10589dcb0e7?auto=format&fit=crop&w=2000&q=80",
  "https://images.unsplash.com/photo-1597009513659-9366603c7e82?auto=format&fit=crop&w=2000&q=80",
];

const ADJECTIVES = ["better", "calmer", "smarter", "kinder", "simpler", "clearer"];

/** When the arrow starts drawing: once the headline and chat box have settled. */
const ARROW_DELAY = 1.4;

const fade = (delay: number, y = 10) => ({
  initial: { opacity: 0, y },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.8, delay, ease: ease.out },
});

export function Landing({ loading, onSubmit }: { loading: boolean; onSubmit: (text: string) => void }) {
  return (
    <motion.main exit={{ opacity: 0, transition: { duration: 0.35 } }} className="relative isolate min-h-dvh overflow-hidden bg-paper">
      <Photo />

      <div className="relative z-10 flex min-h-dvh flex-col px-6 pb-8 pt-6 sm:px-12 sm:pt-8 md:w-[60%] lg:px-16">
        <motion.nav {...fade(0.05, -6)} className="flex items-center gap-8 text-white md:text-ink">
          <Logo />
          <span className="flex-1" />
          <a href="#about" className="hidden font-mono text-[13px] opacity-70 transition-opacity hover:opacity-100 md:block">
            About
          </a>
          <button
            type="button"
            onClick={() => document.querySelector<HTMLTextAreaElement>("main textarea")?.focus()}
            className="rounded-full border border-white/40 px-5 py-2 font-mono text-[13px] backdrop-blur-sm transition-colors hover:bg-white hover:text-black md:border-ink/25 md:backdrop-blur-none md:hover:border-ink md:hover:bg-ink md:hover:text-paper"
          >
            Get started
          </button>
        </motion.nav>

        <div className="flex flex-1 flex-col justify-center pb-[8vh] pt-[42dvh] md:pt-0">
          <Typewriter
            words={ADJECTIVES}
            className="font-mono text-[clamp(1.6rem,7vw,2.4rem)] font-light leading-[1.2] tracking-[-0.02em] md:text-[clamp(2.1rem,4.2vw,3.6rem)]"
          />

          <motion.div {...fade(0.45, 14)} className="mt-8 w-full max-w-[560px] sm:mt-10">
            <Composer size="hero" loading={loading} onSubmit={onSubmit} autoFocus placeholder="A townhouse in Gent with a garden and a home office…" />
            <ArrowNote />
          </motion.div>
        </div>

      </div>

      {/* Sits on the photo, bottom right. */}
      <motion.div {...fade(0.9, 0)} className="absolute bottom-8 right-10 z-10 hidden items-stretch gap-4 text-white md:flex lg:right-14">
        <span className="w-px bg-white/60" />
        <p className="py-0.5 font-mono text-[11px] uppercase leading-[1.9] tracking-wide text-white/90">
          Homes
          <br />
          described,
          <br />
          not filtered.
        </p>
      </motion.div>
    </motion.main>
  );
}

/**
 * The photo panel with its diagonal edge. On wide screens it fills the right side;
 * on phones it sits on top. It drifts a little against the pointer.
 */
function Photo() {
  const [attempt, setAttempt] = useState(0);
  const failed = attempt >= HERO_PHOTOS.length;
  const [loaded, setLoaded] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const img = useRef<HTMLImageElement>(null);
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const sx = useSpring(px, { stiffness: 40, damping: 18, mass: 1.2 });
  const sy = useSpring(py, { stiffness: 40, damping: 18, mass: 1.2 });
  const x = useTransform(sx, (v) => v * -16);
  const y = useTransform(sy, (v) => v * -10);

  useEffect(() => {
    if (img.current?.complete && img.current.naturalWidth) setLoaded(true);
    // Wipe the panel open on the next frame so the transition runs.
    const raf = requestAnimationFrame(() => setRevealed(true));
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      px.set((e.clientX / window.innerWidth) * 2 - 1);
      py.set((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", onMove);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
    };
  }, [px, py]);

  return (
    <div
      aria-hidden
      className={[
        "pointer-events-none absolute inset-x-0 top-0 h-[40dvh] overflow-hidden md:inset-y-0 md:left-auto md:right-0 md:h-full md:w-[52%]",
        // Diagonal: bottom edge slants on phones, left edge slants on wide screens.
        "[--clip-from:polygon(0_0,100%_0,100%_0,0_0)] [--clip-to:polygon(0_0,100%_0,100%_80%,0_100%)]",
        "md:[--clip-from:polygon(100%_0,100%_0,100%_100%,100%_100%)] md:[--clip-to:polygon(40%_0,100%_0,100%_100%,0_100%)]",
        "transition-[clip-path] duration-[1300ms] ease-[cubic-bezier(0.76,0,0.24,1)]",
        revealed ? "[clip-path:var(--clip-to)]" : "[clip-path:var(--clip-from)]",
      ].join(" ")}
    >
      {/* Golden-hour glow; also what shows if the photo can't load. */}
      <div className="absolute inset-0 bg-[linear-gradient(160deg,#3b3f45_0%,#6d5a4a_45%,#d98a4e_100%)]" />
      {!failed && (
        <motion.div style={{ x, y }} className="absolute -inset-[3%]">
          <motion.img
            ref={img}
            key={attempt}
            src={HERO_PHOTOS[attempt]}
            alt=""
            onLoad={() => setLoaded(true)}
            onError={() => setAttempt((a) => a + 1)}
            initial={false}
            animate={loaded ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 1.1 }}
            transition={{ opacity: { duration: 1, ease: ease.out }, scale: { duration: 2.6, ease: ease.out } }}
            className="h-full w-full object-cover object-[55%_60%]"
          />
        </motion.div>
      )}
      {/* Keeps the nav (phones) and the caption (wide screens) readable on the photo. */}
      <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/45 to-transparent md:hidden" />
      <div className="absolute inset-x-0 bottom-0 hidden h-48 bg-gradient-to-t from-black/50 to-transparent md:block" />
    </div>
  );
}

function Draw({ d, delay }: { d: string; delay: number }) {
  return (
    <motion.path
      d={d}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: 1 }}
      transition={{ pathLength: { duration: 0.8, delay, ease: [0.65, 0, 0.35, 1] }, opacity: { duration: 0.01, delay } }}
    />
  );
}

/** Hand-drawn arrow curling up into the chat box, with a scribbled note. */
function ArrowNote() {
  return (
    <div className="pointer-events-none mt-2 flex items-start gap-1 pl-4 text-ink-soft" aria-hidden>
      <svg viewBox="0 0 60 70" className="h-[56px] w-[48px] shrink-0">
        <Draw d="M52 62 C 30 62, 14 50, 14 30 C 14 22, 16 14, 20 6" delay={ARROW_DELAY} />
        <Draw d="M10 14 L 20 5 L 28 15" delay={ARROW_DELAY + 0.65} />
      </svg>
      <motion.span
        initial={{ clipPath: "inset(-30% 100% -30% 0%)", opacity: 0 }}
        animate={{ clipPath: "inset(-30% -10% -30% 0%)", opacity: 1 }}
        transition={{ duration: 0.9, delay: ARROW_DELAY + 0.3, ease: ease.out }}
        className="mt-8 block -rotate-[3deg] whitespace-nowrap font-hand text-[26px] leading-none"
      >
        Describe your dream home
      </motion.span>
    </div>
  );
}

/** House outline with a blinking caret inside: describe the home, we find it. */
export function LogoMark() {
  return (
    <span className="flex items-center gap-2.5">
      <svg viewBox="0 0 24 24" className="h-[22px] w-[22px]" fill="none" aria-hidden>
        <path d="M3.5 10.6 12 3.6l8.5 7V20.4h-17z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
        <rect x="11.1" y="11.6" width="1.8" height="5.6" rx="0.5" className="fill-brick" style={{ animation: "caret-blink 1.05s steps(1) infinite" }} />
      </svg>
      <span className="font-mono text-[15px] font-medium tracking-[-0.01em]">
        better<span className="font-normal opacity-60">immo</span>
      </span>
    </span>
  );
}

function Logo() {
  return (
    <Link href="/" aria-label="BetterImmo home">
      <LogoMark />
    </Link>
  );
}
