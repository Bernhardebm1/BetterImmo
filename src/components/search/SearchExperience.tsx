"use client";

import { AnimatePresence, LayoutGroup, MotionConfig, motion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useRef, useState, useSyncExternalStore } from "react";
import clsx from "clsx";
import { ChevronDown, Heart, Sparkles } from "lucide-react";
import { Composer } from "./Composer";
import { Landing, LogoMark } from "@/components/landing/Landing";
import { HomesMap } from "@/components/map/HomesMap";
import { FilterChips } from "./FilterChips";
import { ResultRow } from "./ResultRow";
import { SmartImage } from "@/components/SmartImage";
import { describeFilters, formatPrice, formatPriceShort } from "@/lib/format";
import { spring } from "@/lib/motion";
import { markFromResults } from "@/lib/nav";
import { useShortlist } from "@/lib/shortlist";
import type { Match } from "@/lib/search/match";
import { EMPTY_FILTERS, type Filters, type Question, type SearchResponse, type SearchTurn } from "@/lib/types";

type ApiResult = Partial<SearchResponse> & { filters: Filters; matches: Match[]; total: number };

const SORTS = {
  relevance: { label: "Relevance", sort: () => 0 },
  priceUp: { label: "Price, low to high", sort: (a: Match, b: Match) => a.listing.price - b.listing.price },
  priceDown: { label: "Price, high to low", sort: (a: Match, b: Match) => b.listing.price - a.listing.price },
  area: { label: "Largest first", sort: (a: Match, b: Match) => b.listing.area - a.listing.area },
} as const;
type SortKey = keyof typeof SORTS;

const WIDE = "(min-width: 1024px)";
function useWide() {
  return useSyncExternalStore(
    (l) => {
      const m = matchMedia(WIDE);
      m.addEventListener("change", l);
      return () => m.removeEventListener("change", l);
    },
    () => matchMedia(WIDE).matches,
    () => true,
  );
}

export function SearchExperience() {
  const [started, setStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [history, setHistory] = useState<SearchTurn[]>([]);
  const [reply, setReply] = useState<string>("");
  const [question, setQuestion] = useState<Question | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [total, setTotal] = useState(0);
  const [disliked, setDisliked] = useState<string[]>([]);
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

  const pass = (id: string) => {
    const next = [...disliked, id];
    setDisliked(next);
    setMatches((m) => m.filter((x) => x.listing.id !== id));
    void call({ filters, history, exclude: next });
  };

  return (
    <MotionConfig reducedMotion="user">
      <LayoutGroup>
        <div className="relative isolate min-h-dvh overflow-x-clip">
          <AnimatePresence mode="popLayout" initial={false}>
            {!started ? (
              <Landing key="landing" loading={loading} onSubmit={send} />
            ) : (
              <Results
                key="results"
                loading={loading}
                error={error}
                reply={reply}
                question={question}
                filters={filters}
                matches={matches}
                total={total}
                disliked={disliked}
                onSend={send}
                onFilters={(f) => refilter(f)}
                onPass={pass}
                onRestore={() => {
                  setDisliked([]);
                  refilter(filters, []);
                }}
              />
            )}
          </AnimatePresence>
        </div>
      </LayoutGroup>
    </MotionConfig>
  );
}

function Results({
  loading,
  error,
  reply,
  question,
  filters,
  matches,
  total,
  disliked,
  onSend,
  onFilters,
  onPass,
  onRestore,
}: {
  loading: boolean;
  error: boolean;
  reply: string;
  question: Question | null;
  filters: Filters;
  matches: Match[];
  total: number;
  disliked: string[];
  onSend: (t: string) => void;
  onFilters: (f: Filters) => void;
  onPass: (id: string) => void;
  onRestore: () => void;
}) {
  const router = useRouter();
  const wide = useWide();
  // Wide screens open on list + map; phones open on the list.
  const [wideView, setWideView] = useState<"list" | "map">("map");
  const [phoneView, setPhoneView] = useState<"list" | "map">("list");
  const view = wide ? wideView : phoneView;
  const setView = wide ? setWideView : setPhoneView;
  const [sort, setSort] = useState<SortKey>("relevance");
  const [hovered, setHovered] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const rows = useRef(new Map<string, HTMLElement>());
  const saved = useShortlist();

  const sorted = useMemo(() => [...matches].sort(SORTS[sort].sort), [matches, sort]);
  const pins = useMemo(() => matches.map((m) => ({ id: m.listing.id, lat: m.listing.lat, lng: m.listing.lng, label: formatPriceShort(m.listing.price) })), [matches]);
  const active = hovered ?? selected;
  const headline = describeFilters(filters);
  const picked = matches.find((m) => m.listing.id === selected)?.listing;

  const selectPin = (id: string) => {
    if (selected === id && wide) {
      markFromResults();
      router.push(`/homes/${id}`);
      return;
    }
    setSelected(id);
    if (wide) rows.current.get(id)?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  };

  const shortlist = (
    <span
      className="flex h-10 items-center gap-2 rounded-full border border-ink/25 px-5 text-[14px] text-ink"
      aria-label={`${saved.length} on your shortlist`}
    >
      <Heart className={clsx("h-3.5 w-3.5", saved.length ? "fill-brick text-brick" : "text-ink")} strokeWidth={1.75} />
      Shortlist
      <motion.span key={saved.length} initial={{ y: -6, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={spring.snappy} className="font-figures tabular-nums">
        {saved.length}
      </motion.span>
    </span>
  );
  const mapBeside = wide && view === "map";

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.45 }} className="relative lg:h-dvh lg:overflow-hidden">
      <aside
        className={clsx(
          "relative z-10 flex min-h-dvh flex-col bg-paper lg:h-dvh lg:min-h-0 lg:overflow-y-auto",
          mapBeside ? "lg:w-[min(620px,46vw)]" : "lg:w-full",
        )}
      >
        <header className="sticky top-0 z-30 flex items-center gap-4 bg-paper/90 px-5 py-4 backdrop-blur-xl sm:px-10 sm:py-6">
          <button type="button" onClick={() => location.reload()} className="shrink-0" aria-label="Start a new search">
            <LogoMark />
          </button>
          <div className={clsx("hidden min-w-0 flex-1 md:block", mapBeside ? "max-w-[340px] lg:ml-auto" : "mx-auto max-w-[420px]")}>
            <Composer size="compact" loading={loading} onSubmit={onSend} />
          </div>
          <span className="flex-1 md:hidden" />
          {!mapBeside && (
            <div className="flex items-center gap-3">
              <ViewToggle view={view} onChange={setView} />
              <span className="hidden sm:block">{shortlist}</span>
            </div>
          )}
        </header>

        <div className="flex-1 px-5 pb-24 sm:px-10">
          <div className={clsx(!mapBeside && "lg:mx-auto lg:max-w-6xl")}>
            <div className="md:hidden">
              <Composer size="compact" loading={loading} onSubmit={onSend} />
            </div>

            <motion.h1
              key={headline}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="mt-7 max-w-[19ch] font-serif text-[clamp(32px,3.3vw,48px)] font-light leading-[1.12] tracking-[-0.005em] first-letter:uppercase sm:mt-6"
            >
              {headline}.
            </motion.h1>

            <Assistant reply={reply} question={question} loading={loading && !reply} error={error} onAnswer={onSend} />

            <motion.div layout transition={spring.soft} className="mt-7">
              <FilterChips filters={filters} onChange={onFilters} />
            </motion.div>

            <motion.div layout transition={spring.soft} className="mt-12 flex items-end justify-between gap-4">
              <div>
                <h2 className="font-serif text-[30px] font-light leading-none">
                  {total === 0 && !loading ? "No homes yet" : `${matches.length} ${matches.length === 1 ? "home" : "homes"}`}
                </h2>
                <SortMenu value={sort} onChange={setSort} />
              </div>
              <p className="pb-1 text-right text-[11px] text-ink-faint">
                {total > matches.length ? `Best ${matches.length} of ${total}` : "Homes under offer are hidden"}
              </p>
            </motion.div>

            <div
              className={clsx(
                "mt-3 grid transition-opacity duration-300",
                loading && "opacity-60",
                !mapBeside && wide && "lg:grid-cols-2 lg:gap-x-8",
              )}
            >
              <AnimatePresence mode="popLayout">
                {sorted.map((m, i) => (
                  <motion.div key={m.listing.id} layout exit={{ opacity: 0, transition: { duration: 0.2 } }} transition={spring.soft} className="border-b border-line py-2.5 last:border-b-0">
                    <ResultRow
                      ref={(el) => {
                        if (el) rows.current.set(m.listing.id, el);
                        else rows.current.delete(m.listing.id);
                      }}
                      match={m}
                      index={i}
                      active={active === m.listing.id}
                      onHover={(on) => setHovered(on ? m.listing.id : null)}
                      onPass={() => onPass(m.listing.id)}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {total === 0 && !loading && (
              <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-2 max-w-md text-[15px] leading-relaxed text-ink-soft">
                Change a filter above or tell me what you could live without, and I&apos;ll widen the search.
                {disliked.length > 0 && (
                  <>
                    {" "}
                    <button type="button" className="underline underline-offset-4 hover:text-ink" onClick={onRestore}>
                      Bring back the {disliked.length} you passed on
                    </button>
                  </>
                )}
              </motion.p>
            )}
          </div>
        </div>
      </aside>

      <AnimatePresence>
        {view === "map" && (
          <motion.section
            key="map"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.2 } }}
            transition={{ duration: 0.5 }}
            className="fixed inset-x-0 bottom-0 top-[72px] z-20 lg:absolute lg:inset-y-0 lg:left-[min(620px,46vw)] lg:right-0 lg:top-0 lg:z-0"
            aria-label="Map of the results"
          >
            {/* Soft left edge, so the map melts into the list instead of meeting it at a line. */}
            <HomesMap pins={pins} active={active} onHover={setHovered} onSelect={selectPin} className="h-full w-full lg:[mask-image:linear-gradient(to_right,transparent,black_110px)]" />
            {wide && (
              <div className="pointer-events-none absolute inset-x-0 top-0 flex flex-col items-end gap-5 px-10 pt-6">
                <div className="pointer-events-auto flex items-center gap-8">
                  <Link href="/#about" className="text-[14px] text-ink transition-opacity hover:opacity-70">
                    About
                  </Link>
                  {shortlist}
                </div>
                <div className="pointer-events-auto">
                  <ViewToggle view={view} onChange={setView} />
                </div>
              </div>
            )}
            {/* Phones: the picked home slides up from the bottom of the map. */}
            <AnimatePresence>
              {!wide && picked && (
                <motion.button
                  key={picked.id}
                  type="button"
                  initial={{ y: 40, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 40, opacity: 0 }}
                  transition={spring.soft}
                  onClick={() => {
                    markFromResults();
                    router.push(`/homes/${picked.id}`);
                  }}
                  className="absolute inset-x-4 bottom-5 z-30 flex items-center gap-3 rounded-[8px] border border-line bg-paper p-2 text-left shadow-lift"
                >
                  <SmartImage src={picked.images[0]} alt="" seed={picked.id} className="h-16 w-24 shrink-0 rounded-[4px]" />
                  <span className="min-w-0">
                    <span className="block truncate text-[14px]">
                      {picked.city}, {picked.neighbourhood}
                    </span>
                    <span className="block font-figures text-[15px]">{formatPrice(picked.price)}</span>
                  </span>
                </motion.button>
              )}
            </AnimatePresence>
          </motion.section>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/** List / Map, as in the reference: outlined pill, the chosen side filled. */
function ViewToggle({ view, onChange }: { view: "list" | "map"; onChange: (v: "list" | "map") => void }) {
  return (
    <div className="flex items-center gap-1.5" role="tablist" aria-label="Show results as">
      {(["list", "map"] as const).map((v) => (
        <button
          key={v}
          type="button"
          role="tab"
          aria-selected={view === v}
          onClick={() => onChange(v)}
          className={clsx(
            "relative h-9 rounded-full border px-5 text-[13px] capitalize transition-colors duration-300",
            view === v ? "border-transparent text-cta-ink" : "border-ink/25 text-ink hover:border-ink/50",
          )}
        >
          {view === v && <motion.span layoutId="view-pill" transition={spring.snappy} className="absolute -inset-px rounded-full bg-[var(--toggle)]" />}
          <span className="relative">{v}</span>
        </button>
      ))}
    </div>
  );
}

function SortMenu({ value, onChange }: { value: SortKey; onChange: (s: SortKey) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative mt-2">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        onBlur={(e) => !e.currentTarget.parentElement?.contains(e.relatedTarget) && setOpen(false)}
        aria-expanded={open}
        className="flex items-center gap-8 text-[11px] text-ink-faint transition-colors hover:text-ink"
      >
        {SORTS[value].label}
        <ChevronDown className={clsx("h-3 w-3 transition-transform duration-300", open && "rotate-180")} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.ul
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97, transition: { duration: 0.12 } }}
            transition={spring.snappy}
            style={{ transformOrigin: "top left" }}
            className="absolute left-0 top-6 z-30 w-48 rounded-xl border border-line bg-paper-raised p-1 shadow-lift"
          >
            {(Object.keys(SORTS) as SortKey[]).map((k) => (
              <li key={k}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(k);
                    setOpen(false);
                  }}
                  className={clsx("w-full rounded-lg px-3 py-2 text-left text-[13px] transition-colors hover:bg-ink/5", k === value ? "text-ink" : "text-ink-soft")}
                >
                  {SORTS[k].label}
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
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
    <motion.section layout transition={spring.soft} className="mt-4 flex max-w-[52ch] gap-2.5" aria-live="polite">
      <div className="mt-[3px] grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brick text-white">
        <Sparkles className="h-3 w-3" />
      </div>
      <div className="min-w-0 flex-1">
        {loading ? (
          <Thinking />
        ) : error ? (
          <p className="text-[15px] text-brick">Something went wrong on our side. Try that again?</p>
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
              className="mt-3 rounded-[8px] border border-brick/30 bg-brick-soft/50 p-4"
            >
              <p className="text-[15px] leading-relaxed text-ink">{question.text}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {question.options.map((o, i) => (
                  <motion.button
                    key={o}
                    type="button"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0, transition: { ...spring.snappy, delay: 0.35 + i * 0.05 } }}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onAnswer(o)}
                    className="h-9 rounded-full border border-ink/20 bg-paper px-4 text-[13px] text-ink transition-colors hover:border-ink/50"
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
    <p className="text-[14px] leading-relaxed text-ink-soft">
      {text.split(" ").map((w, i) => (
        <motion.span
          key={i}
          className="inline-block"
          initial={{ opacity: 0, y: 4, filter: "blur(3px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.35, delay: i * 0.02, ease: [0.22, 1, 0.36, 1] }}
        >
          {w}&nbsp;
        </motion.span>
      ))}
    </p>
  );
}

function Thinking() {
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
