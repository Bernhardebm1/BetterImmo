"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { ArrowRight, Check, PenLine } from "lucide-react";
import { Composer } from "./Composer";
import { AssistantMark, Reveal, Thinking } from "./Talk";
import { LogoMark } from "@/components/landing/Landing";
import { FEATURE_LABEL, TYPE_LABEL, formatPriceShort } from "@/lib/format";
import { spring } from "@/lib/motion";
import { DRAW_OPTION, TOPICS, type Filters, type Question, type Topic } from "@/lib/types";

export type ChatItem = { id: number; role: "buyer" | "assistant"; text: string; question?: Question | null };

/** How long the "Show homes" button waits before moving on by itself once we know enough. */
const AUTO_SHOW_MS = 2600;

/**
 * After the first message the chat opens up and asks a few follow-ups (where, budget,
 * apartment or house, bedrooms, must-haves), skipping anything the buyer already said.
 * The brief on the side fills in as they answer; they can jump to the homes at any time.
 */
export function Interview({
  chat,
  loading,
  error,
  filters,
  asked,
  total,
  ready,
  onSend,
  onDraw,
  onShow,
}: {
  chat: ChatItem[];
  loading: boolean;
  error: boolean;
  filters: Filters;
  asked: string[];
  total: number;
  ready: boolean;
  onSend: (text: string) => void;
  onDraw: () => void;
  onShow: () => void;
}) {
  const end = useRef<HTMLDivElement>(null);
  const last = chat[chat.length - 1];
  const active = !loading && last?.role === "assistant" ? last.question ?? null : null;

  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [chat.length, loading, ready]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.3 } }} className="min-h-dvh bg-paper">
      <header className="sticky top-0 z-30 flex items-center gap-4 bg-paper/85 px-5 py-4 backdrop-blur-xl sm:px-10 sm:py-6">
        <button type="button" onClick={() => location.reload()} aria-label="Start a new search">
          <LogoMark />
        </button>
        <span className="flex-1" />
        <button
          type="button"
          onClick={onShow}
          className="flex h-10 items-center gap-2 rounded-full border border-ink/20 px-4 text-[13px] text-ink transition-colors hover:border-ink/50 lg:hidden"
        >
          <Count n={total} /> {total === 1 ? "home" : "homes"}
          <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.75} />
        </button>
      </header>

      <div className="mx-auto grid max-w-[1180px] gap-12 px-5 sm:px-10 lg:grid-cols-[minmax(0,1fr)_340px]">
        <main className="mx-auto flex w-full max-w-[660px] flex-col">
          <div className="flex-1 space-y-7 pb-8 pt-4 lg:pt-10" aria-live="polite">
            {chat.map((item) => (
              <Bubble key={item.id} item={item} />
            ))}
            {loading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
                <AssistantMark className="mt-0.5" />
                <Thinking />
              </motion.div>
            )}
            {error && !loading && <p className="pl-9 text-[15px] text-brick">Something went wrong on our side. Try that again?</p>}
            <AnimatePresence>{active && <Options key={active.text} question={active} onSend={onSend} onDraw={onDraw} />}</AnimatePresence>
            <AnimatePresence>{ready && !loading && <ReadyCard total={total} onShow={onShow} />}</AnimatePresence>
            <div ref={end} />
          </div>

          <div className="sticky bottom-0 bg-gradient-to-t from-paper from-70% to-transparent pb-5 pt-6 sm:pb-8">
            <Composer size="chat" loading={loading} onSubmit={onSend} autoFocus placeholder={active ? "Or answer in your own words…" : "Tell me more about the home you want…"} />
          </div>
        </main>

        <aside className="hidden lg:block">
          <Brief filters={filters} asked={asked.filter((t) => t !== active?.topic)} total={total} onShow={onShow} />
        </aside>
      </div>
    </motion.div>
  );
}

function Bubble({ item }: { item: ChatItem }) {
  if (item.role === "buyer") {
    return (
      <motion.div initial={{ opacity: 0, y: 10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={spring.soft} className="flex justify-end">
        <p className="max-w-[80%] rounded-[20px] rounded-br-[6px] bg-ink px-4 py-2.5 text-[15px] leading-relaxed text-paper">{item.text}</p>
      </motion.div>
    );
  }
  const q = item.question;
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={spring.soft} className="flex gap-3">
      <AssistantMark className="mt-0.5" />
      <div className="min-w-0 flex-1">
        {item.text && <Reveal text={item.text} className="text-[15px] leading-relaxed text-ink-soft" />}
        {q && <Reveal text={q.text} delay={0.15} className={clsx("font-serif text-[clamp(22px,2.4vw,28px)] font-light leading-snug text-ink", item.text && "mt-2")} />}
      </div>
    </motion.div>
  );
}

function Options({ question, onSend, onDraw }: { question: Question; onSend: (t: string) => void; onDraw: () => void }) {
  const [picked, setPicked] = useState<string[]>([]);
  const isSkip = (o: string) => /^(nothing else|either is fine|doesn't matter|no fixed budget|anywhere)/i.test(o);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6, transition: { duration: 0.15 } }}
      transition={{ ...spring.soft, delay: 0.3 }}
      className="flex flex-wrap gap-2 pl-9"
    >
      {question.options.map((o, i) => {
        const on = picked.includes(o);
        const draw = o === DRAW_OPTION;
        return (
          <motion.button
            key={o}
            type="button"
            aria-pressed={question.multi ? on : undefined}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0, transition: { ...spring.snappy, delay: 0.35 + i * 0.04 } }}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              if (draw) return onDraw();
              if (!question.multi || isSkip(o)) return onSend(o);
              setPicked((p) => (on ? p.filter((x) => x !== o) : [...p, o]));
            }}
            className={clsx(
              "flex h-10 items-center gap-2 rounded-full border px-4 text-[14px] transition-colors duration-200",
              on ? "border-ink bg-ink text-paper" : draw ? "border-brick/50 text-ink hover:border-brick" : "border-ink/15 bg-paper-raised text-ink hover:border-ink/45",
            )}
          >
            {draw && <PenLine className="h-3.5 w-3.5 text-brick" strokeWidth={1.75} />}
            {on && <Check className="h-3.5 w-3.5" strokeWidth={2} />}
            {o}
          </motion.button>
        );
      })}
      <AnimatePresence>
        {question.multi && picked.length > 0 && (
          <motion.button
            type="button"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={spring.snappy}
            onClick={() => onSend(picked.join(", "))}
            className="flex h-10 items-center gap-2 rounded-full bg-cta px-5 text-[14px] font-medium text-cta-ink"
          >
            Done
            <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function ReadyCard({ total, onShow }: { total: number; onShow: () => void }) {
  // Move on by itself after a moment, unless the buyer has started typing.
  const show = useRef(onShow);
  useEffect(() => {
    show.current = onShow;
  });
  useEffect(() => {
    const t = setTimeout(() => {
      const typing = document.querySelector<HTMLTextAreaElement>("main textarea")?.value;
      if (!typing) show.current();
    }, AUTO_SHOW_MS + 200);
    return () => clearTimeout(t);
  }, []);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring.soft, delay: 0.2 }} className="flex gap-3">
      <AssistantMark className="mt-0.5" />
      <div>
        <p className="font-serif text-[clamp(22px,2.4vw,28px)] font-light leading-snug">
          {total ? `That's enough to go on. I found ${total} ${total === 1 ? "home" : "homes"} that fit.` : "Nothing fits all of that yet. Let's look at what's close."}
        </p>
        <button type="button" onClick={onShow} className="relative mt-4 flex h-11 items-center gap-2 overflow-hidden rounded-full bg-cta px-6 text-[14px] font-medium text-cta-ink">
          <motion.span
            aria-hidden
            className="absolute inset-y-0 left-0 bg-white/15"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: AUTO_SHOW_MS / 1000, ease: "linear", delay: 0.2 }}
          />
          <span className="relative">Show my homes</span>
          <ArrowRight className="relative h-4 w-4" strokeWidth={2} />
        </button>
      </div>
    </motion.div>
  );
}

const TOPIC_LABEL: Record<Topic, string> = { location: "Where", budget: "Budget", type: "Type", bedrooms: "Bedrooms", musts: "Must-haves" };

function value(topic: Topic, f: Filters, asked: boolean): string | null {
  switch (topic) {
    case "location":
      return f.area ? "Area drawn on the map" : f.cities.length ? f.cities.join(", ") : asked ? "Anywhere in Belgium" : null;
    case "budget":
      return f.maxPrice ? `Up to ${formatPriceShort(f.maxPrice)}` : asked ? "Open" : null;
    case "type":
      return f.types.length ? f.types.map((t) => TYPE_LABEL[t]).join(" or ") : asked ? "Any" : null;
    case "bedrooms":
      return f.minBedrooms ? `${f.minBedrooms} or more` : asked ? "Any" : null;
    case "musts": {
      const musts = [...f.features.map((x) => FEATURE_LABEL[x]), ...(f.nearStation ? ["Near a station"] : []), ...(f.maxEpc ? [`EPC ${f.maxEpc}+`] : [])];
      return musts.length ? musts.join(", ") : asked ? "Nothing specific" : null;
    }
  }
}

/** What we know so far, filling in as the buyer answers. */
function Brief({ filters, asked, total, onShow }: { filters: Filters; asked: string[]; total: number; onShow: () => void }) {
  const rows = TOPICS.map((t) => ({ t, v: value(t, filters, asked.includes(t)) }));
  const known = rows.filter((r) => r.v).length;
  return (
    <div className="sticky top-28 mt-10 rounded-[10px] border border-line bg-paper-raised p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-[13px] font-medium uppercase tracking-[0.08em] text-ink-soft">Your search</h2>
        <div className="flex gap-1" aria-label={`${known} of ${rows.length} known`}>
          {rows.map((r) => (
            <motion.span key={r.t} className="h-1.5 w-4 rounded-full" initial={false} animate={{ backgroundColor: r.v ? "var(--brick)" : "var(--line)" }} />
          ))}
        </div>
      </div>
      <dl className="mt-5 space-y-4">
        {rows.map(({ t, v }) => (
          <div key={t} className="flex items-baseline justify-between gap-4 border-b border-line pb-3 last:border-b-0">
            <dt className="text-[13px] text-ink-soft">{TOPIC_LABEL[t]}</dt>
            <dd className="min-w-0 text-right text-[14px] text-ink">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={v ?? "-"}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={spring.snappy}
                  className={clsx("inline-block", !v && "text-ink-faint")}
                >
                  {v ?? "Not yet"}
                </motion.span>
              </AnimatePresence>
            </dd>
          </div>
        ))}
      </dl>
      <div className="mt-6 flex items-end justify-between gap-4">
        <p className="leading-none">
          <span className="block font-serif text-[40px] font-light">
            <Count n={total} />
          </span>
          <span className="mt-1 block text-[12px] text-ink-soft">{total === 1 ? "home matches" : "homes match"} so far</span>
        </p>
        <button type="button" onClick={onShow} className="flex h-10 items-center gap-2 rounded-full border border-ink/20 px-4 text-[13px] text-ink transition-colors hover:border-ink/50">
          Show now
          <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.75} />
        </button>
      </div>
    </div>
  );
}

function Count({ n }: { n: number }) {
  return (
    <AnimatePresence mode="popLayout" initial={false}>
      <motion.span key={n} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={spring.snappy} className="inline-block font-figures">
        {n}
      </motion.span>
    </AnimatePresence>
  );
}
