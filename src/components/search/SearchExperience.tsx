"use client";

import { AnimatePresence, LayoutGroup, MotionConfig, motion } from "motion/react";
import { useCallback, useRef, useState } from "react";
import { Heart, Sparkles } from "lucide-react";
import { Composer } from "./Composer";
import { FilterChips } from "./FilterChips";
import { ListingSheet } from "./ListingSheet";
import { MatchCard } from "./MatchCard";
import { spring } from "@/lib/motion";
import type { Match } from "@/lib/search/match";
import { EMPTY_FILTERS, type Filters, type Question, type SearchResponse, type SearchTurn } from "@/lib/types";

type ApiResult = Partial<SearchResponse> & { filters: Filters; matches: Match[]; total: number };

const STARTERS = [
  "2-bed apartment in Gent near the station",
  "House with a garden under €450k",
  "4 bedrooms in Brussels for €300k",
  "Flat in Shadwell",
];

export function SearchExperience({ listingCount }: { listingCount: number }) {
  const [started, setStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [history, setHistory] = useState<SearchTurn[]>([]);
  const [reply, setReply] = useState<string>("");
  const [question, setQuestion] = useState<Question | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [total, setTotal] = useState(0);
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [disliked, setDisliked] = useState<string[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const requestId = useRef(0);

  const call = useCallback(async (body: { message?: string; filters: Filters; history: SearchTurn[]; exclude: string[] }) => {
    const id = ++requestId.current;
    setLoading(true);
    setError(false);
    try {
      const res = await fetch("/api/search", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as ApiResult;
      if (id !== requestId.current) return null;
      setFilters(data.filters);
      setMatches(data.matches);
      setTotal(data.total);
      return data;
    } catch {
      if (id === requestId.current) setError(true);
      return null;
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, []);

  const send = async (message: string) => {
    setStarted(true);
    setQuestion(null);
    const nextHistory: SearchTurn[] = [...history, { role: "buyer", text: message }];
    setHistory(nextHistory);
    const data = await call({ message, filters, history: nextHistory, exclude: disliked });
    if (!data) return;
    setReply(data.reply ?? "");
    setQuestion(data.question ?? null);
    setHistory([...nextHistory, { role: "assistant", text: [data.reply, data.question?.text].filter(Boolean).join(" ") }]);
  };

  const refilter = (next: Filters, exclude = disliked) => {
    setFilters(next);
    void call({ filters: next, history, exclude });
  };

  const dislike = (id: string) => {
    const next = [...disliked, id];
    setDisliked(next);
    setMatches((m) => m.filter((x) => x.listing.id !== id));
    void call({ filters, history, exclude: next });
  };

  const toggleLike = (id: string) =>
    setLiked((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const openListing = matches.find((m) => m.listing.id === open)?.listing;

  return (
    <MotionConfig reducedMotion="user">
      <LayoutGroup>
        <div className="relative isolate min-h-dvh overflow-x-clip">
          <Glow started={started} />

          <header className="sticky top-0 z-40">
            <div className="absolute inset-0 border-b border-transparent transition-colors duration-500 data-[on=true]:border-line data-[on=true]:bg-paper/70 data-[on=true]:backdrop-blur-xl" data-on={started} />
            <div className="relative mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 sm:flex-nowrap sm:px-6">
              <button type="button" onClick={() => location.reload()} className="shrink-0 font-display text-2xl tracking-tight" aria-label="BetterImmo home">
                Better<span className="italic text-brick">Immo</span>
              </button>
              {started ? (
                <div className="order-last min-w-0 basis-full sm:order-none sm:flex-1 sm:basis-auto">
                  <div className="mx-auto max-w-2xl">
                    <Composer size="compact" loading={loading} onSubmit={send} />
                  </div>
                </div>
              ) : (
                <div className="hidden flex-1 sm:block" />
              )}
              <motion.div layout className="ml-auto flex shrink-0 items-center gap-2 rounded-full border border-line bg-paper-raised px-3 py-1.5 text-sm" aria-label={`${liked.size} saved`}>
                <Heart className="h-4 w-4 text-moss" fill={liked.size ? "currentColor" : "none"} />
                <motion.span key={liked.size} initial={{ y: -8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={spring.snappy} className="tabular-nums">
                  {liked.size}
                </motion.span>
              </motion.div>
            </div>
          </header>

          <AnimatePresence mode="popLayout" initial={false}>
            {!started ? (
              <Hero key="hero" listingCount={listingCount} loading={loading} onSubmit={send} />
            ) : (
              <motion.main
                key="results"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
                className="relative mx-auto max-w-6xl px-4 pb-24 pt-6 sm:px-6"
              >
                <Assistant reply={reply} question={question} loading={loading && !reply} error={error} onAnswer={send} />

                <motion.div layout transition={spring.soft} className="mt-6">
                  <FilterChips filters={filters} onChange={(f) => refilter(f)} />
                </motion.div>

                <motion.div layout transition={spring.soft} className="mt-8 flex items-baseline justify-between gap-4 border-t border-line pt-6">
                  <h2 className="font-display text-3xl tracking-tight sm:text-4xl">
                    {total === 0 && !loading ? "Nothing fits yet" : matches.length === 1 ? "One home that fits" : `${matches.length} homes that fit`}
                  </h2>
                  <p className="hidden text-sm text-ink-faint sm:block">
                    {total > matches.length ? `Best ${matches.length} of ${total}` : "Homes under offer are hidden"}
                  </p>
                </motion.div>

                <motion.div layout className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  <AnimatePresence mode="popLayout">
                    {matches.map((m, i) => (
                      <MatchCard
                        key={m.listing.id}
                        match={m}
                        index={i}
                        liked={liked.has(m.listing.id)}
                        onLike={() => toggleLike(m.listing.id)}
                        onDislike={() => dislike(m.listing.id)}
                        onOpen={() => setOpen(m.listing.id)}
                      />
                    ))}
                  </AnimatePresence>
                </motion.div>

                {total === 0 && !loading && (
                  <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-4 max-w-lg text-ink-soft">
                    Remove a filter above or tell me what you could live without, and I&apos;ll widen the search.
                    {disliked.length > 0 && (
                      <>
                        {" "}
                        <button type="button" className="underline underline-offset-4 hover:text-ink" onClick={() => { setDisliked([]); refilter(filters, []); }}>
                          Bring back the {disliked.length} you passed on
                        </button>
                      </>
                    )}
                  </motion.p>
                )}
              </motion.main>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {openListing && (
              <ListingSheet
                key={openListing.id}
                listing={openListing}
                liked={liked.has(openListing.id)}
                onLike={() => toggleLike(openListing.id)}
                onClose={() => setOpen(null)}
              />
            )}
          </AnimatePresence>
        </div>
      </LayoutGroup>
    </MotionConfig>
  );
}

function Hero({ listingCount, loading, onSubmit }: { listingCount: number; loading: boolean; onSubmit: (t: string) => void }) {
  const words = ["Describe", "the", "home."];
  return (
    <motion.main
      exit={{ opacity: 0, y: -20, filter: "blur(6px)", transition: { duration: 0.3 } }}
      className="relative mx-auto flex min-h-[calc(100dvh-64px)] max-w-3xl flex-col justify-center px-4 pb-24 sm:px-6"
    >
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...spring.soft, delay: 0.05 }}
        className="mb-6 flex items-center gap-2 text-sm text-ink-soft"
      >
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-moss opacity-60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-moss" />
        </span>
        Preview · {listingCount} homes across Belgium
      </motion.p>

      <h1 className="font-display text-[clamp(3rem,9vw,6.5rem)] leading-[0.95] tracking-[-0.02em]">
        {words.map((w, i) => (
          <motion.span
            key={w}
            className="mr-[0.22em] inline-block"
            initial={{ opacity: 0, y: "0.4em", filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ ...spring.soft, delay: 0.1 + i * 0.08 }}
          >
            {w}
          </motion.span>
        ))}
        <br />
        <motion.span
          className="inline-block italic text-brick"
          initial={{ opacity: 0, y: "0.4em", filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ ...spring.soft, delay: 0.42 }}
        >
          We&apos;ll find it.
        </motion.span>
      </h1>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...spring.soft, delay: 0.55 }}
        className="mt-6 max-w-xl text-lg leading-relaxed text-ink-soft"
      >
        No filters to fiddle with. Say what matters in your own words. We ask when something&apos;s unclear, tell you when it doesn&apos;t add up, and show a handful of homes that really fit.
      </motion.p>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring.soft, delay: 0.65 }} className="mt-10">
        <Composer size="hero" loading={loading} onSubmit={onSubmit} autoFocus />
      </motion.div>

      <motion.div
        initial="hidden"
        animate="shown"
        variants={{ shown: { transition: { staggerChildren: 0.05, delayChildren: 0.8 } } }}
        className="mt-5 flex flex-wrap gap-2"
      >
        {STARTERS.map((s) => (
          <motion.button
            key={s}
            type="button"
            variants={{ hidden: { opacity: 0, y: 8 }, shown: { opacity: 1, y: 0, transition: spring.snappy } }}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => onSubmit(s)}
            className="rounded-full border border-line bg-paper-raised/60 px-4 py-2 text-sm text-ink-soft transition-colors hover:border-ink-faint hover:text-ink"
          >
            {s}
          </motion.button>
        ))}
      </motion.div>
    </motion.main>
  );
}

function Assistant({
  reply,
  question,
  loading,
  error,
  onAnswer,
}: {
  reply: string;
  question: Question | null;
  loading: boolean;
  error: boolean;
  onAnswer: (t: string) => void;
}) {
  return (
    <motion.section layout transition={spring.soft} className="flex gap-4" aria-live="polite">
      <motion.div layout className="mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-ink text-paper">
        <Sparkles className="h-4 w-4" />
      </motion.div>
      <div className="min-w-0 flex-1">
        {loading ? (
          <Thinking />
        ) : error ? (
          <p className="text-lg text-brick">Something went wrong on our side. Try that again?</p>
        ) : (
          <Reveal key={reply} text={reply} />
        )}
        <AnimatePresence mode="popLayout">
          {question && !loading && (
            <motion.div
              key={question.text}
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, transition: { duration: 0.15 } }}
              transition={{ ...spring.soft, delay: 0.25 }}
              className="mt-4 max-w-2xl rounded-2xl border border-brick/25 bg-brick-soft/60 p-4 sm:p-5"
            >
              <p className="text-[17px] leading-relaxed text-ink">{question.text}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {question.options.map((o, i) => (
                  <motion.button
                    key={o}
                    type="button"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0, transition: { ...spring.snappy, delay: 0.35 + i * 0.05 } }}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onAnswer(o)}
                    className="rounded-full bg-paper-raised px-4 py-2 text-sm font-medium text-ink shadow-card transition-shadow hover:shadow-lift"
                  >
                    {o}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.section>
  );
}

/** Words fade up one after another, like someone talking. */
function Reveal({ text }: { text: string }) {
  return (
    <p className="max-w-3xl text-xl leading-relaxed text-ink sm:text-2xl">
      {text.split(" ").map((w, i) => (
        <motion.span
          key={i}
          className="inline-block"
          initial={{ opacity: 0, y: 6, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.35, delay: i * 0.025, ease: [0.22, 1, 0.36, 1] }}
        >
          {w}&nbsp;
        </motion.span>
      ))}
    </p>
  );
}

function Thinking() {
  return (
    <div className="flex h-9 items-center gap-1.5" aria-label="Thinking">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-2 w-2 rounded-full bg-ink-faint"
          animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
          transition={{ duration: 1, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

/** Slow-drifting warm glow behind the hero; it settles to the top once results show. */
function Glow({ started }: { started: boolean }) {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden>
      <motion.div
        className="absolute left-1/2 h-[42rem] w-[42rem] -translate-x-1/2 rounded-full bg-brick/20 blur-[120px]"
        animate={started ? { top: "-30rem", opacity: 0.5 } : { top: ["-6rem", "-2rem", "-6rem"], opacity: 1 }}
        transition={started ? spring.gentle : { duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute h-[30rem] w-[30rem] rounded-full bg-moss/15 blur-[120px]"
        animate={started ? { left: "70%", top: "-24rem", opacity: 0.4 } : { left: ["8%", "14%", "8%"], top: ["30%", "36%", "30%"], opacity: 1 }}
        transition={started ? spring.gentle : { duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}
