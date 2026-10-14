import { runClaudeSearch } from "@/lib/search/claude";
import { nextQuestion, relaxQuestion } from "@/lib/search/interview";
import { runLocalSearch } from "@/lib/search/local";
import { findMatches } from "@/lib/search/match";
import { EMPTY_FILTERS, type Filters, type SearchResponse, type SearchTurn } from "@/lib/types";

type Body = {
  message?: string;
  filters?: Filters;
  history?: SearchTurn[];
  exclude?: string[];
  /** "interview": we're still asking follow-ups before showing homes. */
  mode?: "interview";
  /** Follow-up topics already asked. */
  asked?: string[];
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Body;
  const message = (body.message ?? "").slice(0, 1000).trim();
  const current = cleanFilters(body.filters ?? EMPTY_FILTERS);
  const history = (body.history ?? []).slice(-12);
  const exclude = body.exclude ?? [];

  // Re-run matching only (chip edits, thumbs down, a drawn area) without asking the assistant.
  if (!message) {
    return Response.json({ filters: current, ...findMatches(current, exclude) });
  }

  let result: SearchResponse = runLocalSearch(message, current);
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      result = await runClaudeSearch(message, current, history);
    } catch (err) {
      console.error("Claude search failed, using local parser", err);
    }
  }

  // A drawn area stays until the buyer names a different place.
  if (current.area) {
    const newPlace =
      (result.filters.cities.length > 0 && result.filters.cities.join() !== current.cities.join()) || /anywhere|all of belgium|heel belgië/i.test(message);
    result.filters = newPlace ? { ...result.filters, area: undefined } : { ...result.filters, area: current.area, cities: [] };
  }

  const found = findMatches(result.filters, exclude);
  if (body.mode === "interview" && !result.question) {
    // Nothing left that fits: ask what to give up before asking anything else.
    result.question = found.total === 0 ? relaxQuestion(result.filters) : nextQuestion(result.filters, body.asked ?? []);
    result.ready = !result.question;
  }

  return Response.json({ ...result, ...found });
}

/** Keep a drawn area only if it's a sane polygon inside roughly Benelux. */
function cleanFilters(f: Filters): Filters {
  if (!f.area) return f;
  const ok =
    Array.isArray(f.area) &&
    f.area.length >= 3 &&
    f.area.length <= 200 &&
    f.area.every((p) => Array.isArray(p) && p.length === 2 && Math.abs(p[0] - 4.5) < 6 && Math.abs(p[1] - 50.7) < 4);
  return ok ? f : { ...f, area: undefined };
}
