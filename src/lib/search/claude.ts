import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import { CITIES, PRICE_PER_M2 } from "../places";
import { EPC_LABELS, FEATURES, PROPERTY_TYPES, type Filters, type SearchResponse, type SearchTurn } from "../types";

const client = new Anthropic();

const Output = z.object({
  filters: z.object({
    cities: z.array(z.enum(CITIES as [string, ...string[]])),
    types: z.array(z.enum(PROPERTY_TYPES)),
    minPrice: z.number().nullable(),
    maxPrice: z.number().nullable(),
    minBedrooms: z.number().nullable(),
    minArea: z.number().nullable(),
    features: z.array(z.enum(FEATURES)),
    maxEpc: z.enum(EPC_LABELS).nullable(),
    nearStation: z.boolean().nullable(),
  }),
  reply: z.string(),
  question: z
    .object({ text: z.string(), options: z.array(z.string()) })
    .nullable(),
});

const SYSTEM = `You are the search assistant of a Belgian home-buying website. Buyers describe what they want in their own words (English, Dutch or French). You turn that into search filters and talk to them like a sharp, honest local agent.

Each turn you get the current filters and the buyer's latest message. Return the full updated filters: keep what still applies, change what the buyer changed, drop what they no longer want.

Cities with listings: ${CITIES.join(", ")}. Map neighbourhoods and municipalities to their city (Ixelles → Brussel, Berchem → Antwerpen, Heverlee → Leuven). Indicative asking prices per m² (apartment / house): ${Object.entries(PRICE_PER_M2)
  .map(([c, p]) => `${c} €${p.apartment}/€${p.house}`)
  .join(", ")}.

Rules:
- Never guess a location. If a place is ambiguous, misspelled, outside Belgium or not one of our cities, leave it out of the filters and ask which one they meant, offering the likely cities as options.
- Push back when a request doesn't add up: a budget far below what that home costs in that city, a studio with bedrooms, an apartment that must have a private garden. Say it plainly in one sentence with the rough number, then offer two or three ways forward.
- Ask at most one question per turn, and only when the answer changes the results. Otherwise set question to null.
- Options are short (2 to 5 words) and phrased as the buyer's answer, because tapping one sends it back as their message.
- reply is one or two sentences: what you're now searching for and anything they should know. No greetings, no filler.
- Prices are in euros. "400k" means 400000. Treat a single budget figure as the maximum.`;

export async function runClaudeSearch(message: string, current: Filters, history: SearchTurn[]): Promise<SearchResponse> {
  const transcript = history
    .slice(-8)
    .map((t) => `${t.role === "buyer" ? "Buyer" : "Assistant"}: ${t.text}`)
    .join("\n");

  const response = await client.beta.messages.parse({
    model: "claude-opus-5-5",
    max_tokens: 4000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: "low", format: betaZodOutputFormat(Output) },
    system: SYSTEM,
    messages: [
      {
        role: "user",
        content: `Current filters:\n${JSON.stringify(current)}\n\nConversation so far:\n${transcript || "(none)"}\n\nBuyer's new message:\n${message}`,
      },
    ],
  });

  if (response.stop_reason === "refusal" || !response.parsed_output) {
    throw new Error(`Search assistant returned no usable output (stop_reason: ${response.stop_reason})`);
  }

  const out = response.parsed_output;
  const f = out.filters;
  return {
    filters: {
      cities: f.cities,
      types: f.types,
      features: f.features,
      minPrice: f.minPrice ?? undefined,
      maxPrice: f.maxPrice ?? undefined,
      minBedrooms: f.minBedrooms ?? undefined,
      minArea: f.minArea ?? undefined,
      maxEpc: f.maxEpc ?? undefined,
      nearStation: f.nearStation ?? undefined,
    },
    reply: out.reply,
    question: out.question && out.question.options.length ? out.question : null,
    source: "claude",
  };
}
