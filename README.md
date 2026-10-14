# BetterImmo

An AI-first home search for Belgium. Buyers describe the home they want in their own words; the site turns that into filters they can see and edit, asks when something is unclear, pushes back when the request doesn't add up, and shows a handful of homes that actually fit.

This is the first preview: conversational search, editable filter chips, curated matches with like / not-for-me, and a listing detail view. Listings are sample data until the CRM connectors (Whise, Omnicasa, Zabun, Skarabee) are in.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000.

The search works without any keys, using a rule-based parser in `src/lib/search/local.ts`. To run the assistant on Claude instead, copy `.env.example` to `.env.local` and set `ANTHROPIC_API_KEY`.

## Stack

- **Next.js 16** (App Router, TypeScript) and **Tailwind CSS 4**
- **Motion** for all animation: shared-element transitions from card to detail, spring-based layout changes, swipe to like or pass
- **Claude API** (`@anthropic-ai/sdk`) for the search assistant, with structured output so it always returns valid filters
- Deploys to **Vercel** with no configuration

## Where things live

| Path | What it does |
| --- | --- |
| `src/components/search/SearchExperience.tsx` | The page: hero, conversation, chips, results |
| `src/components/search/MatchCard.tsx` | Result card with swipe and like / not for me |
| `src/components/search/ListingSheet.tsx` | Listing detail overlay |
| `src/components/search/FilterChips.tsx` | Editable filter chips |
| `src/app/api/search/route.ts` | Search endpoint: assistant + matching |
| `src/lib/search/claude.ts` | Claude-backed assistant |
| `src/lib/search/local.ts` | Rule-based assistant (fallback) |
| `src/lib/search/match.ts` | Ranking and "why it matches" reasons |
| `src/lib/listings.ts` | Sample listings |
| `src/lib/places.ts` | Cities, aliases and rough price per m² used for sanity checks |
| `src/app/globals.css` | Design tokens (colours, fonts, shadows) |
