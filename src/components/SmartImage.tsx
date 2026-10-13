"use client";

import { useEffect, useRef, useState } from "react";
import clsx from "clsx";

/**
 * Image that fades in when loaded and falls back to a warm gradient if the
 * photo can't be fetched, so a broken image never shows.
 */
export function SmartImage({ src, alt, className, seed = "" }: { src: string; alt: string; className?: string; seed?: string }) {
  const [state, setState] = useState<"loading" | "loaded" | "error">("loading");
  const ref = useRef<HTMLImageElement>(null);
  // Images served from cache can finish loading before React attaches onLoad.
  useEffect(() => {
    const el = ref.current;
    if (el?.complete) setState(el.naturalWidth ? "loaded" : "error");
  }, [src]);
  const hue = [...seed].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 20);

  return (
    <div
      className={clsx("relative overflow-hidden", className)}
      style={{ background: `linear-gradient(135deg, hsl(${hue} 30% 78%), hsl(${(hue + 40) % 360} 25% 62%))` }}
    >
      {state !== "error" && (
        // eslint-disable-next-line @next/next/no-img-element -- remote demo photos; swap for next/image once listings come from the CRM feed
        <img
          ref={ref}
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          draggable={false}
          onLoad={() => setState("loaded")}
          onError={() => setState("error")}
          className={clsx(
            "absolute inset-0 h-full w-full object-cover transition-[opacity,transform] duration-700 ease-out",
            state === "loaded" ? "scale-100 opacity-100" : "scale-[1.03] opacity-0",
          )}
        />
      )}
      {state === "error" && (
        <svg viewBox="0 0 24 24" className="absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 text-white/70" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
          <path d="M3 10.5 12 3l9 7.5V21H3z" />
          <path d="M9 21v-6h6v6" />
        </svg>
      )}
    </div>
  );
}
