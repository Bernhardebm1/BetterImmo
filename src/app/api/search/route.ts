import { runClaudeSearch } from "@/lib/search/claude";
import { runLocalSearch } from "@/lib/search/local";
import { findMatches } from "@/lib/search/match";
import { EMPTY_FILTERS, type Filters, type SearchTurn } from "@/lib/types";

type Body = { message?: string; filters?: Filters; history?: SearchTurn[]; exclude?: string[] };

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Body;
  const message = (body.message ?? "").slice(0, 1000).trim();
  const current = body.filters ?? EMPTY_FILTERS;
  const history = (body.history ?? []).slice(-12);
  const exclude = body.exclude ?? [];

  // Re-run matching only (chip edits, thumbs down) without asking the assistant.
  if (!message) {
    return Response.json({ filters: current, ...findMatches(current, exclude) });
  }

  let result = runLocalSearch(message, current, history);
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      result = await runClaudeSearch(message, current, history);
    } catch (err) {
      console.error("Claude search failed, using local parser", err);
    }
  }

  return Response.json({ ...result, ...findMatches(result.filters, exclude) });
}
