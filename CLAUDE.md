# Project: Careersume
**Status:** Free, open-source, BYOK-only resume tool. No tiers, no Stripe, no pooled AI keys.
**Goal:** Paste a job description + your profile, get a tailored, ATS-optimized resume, cover
letter, job-fit scoring, and an application tracker, all run on an AI key you bring and own.
**Stack:** Next.js 15, TypeScript, Tailwind CSS, Supabase (auth + Postgres), provider adapters for
Gemini / Groq / OpenAI / Anthropic.
**Design system:** "Highlight": Swiss grotesque on paper white, ink chrome, and one marker
yellow used only as a highlighter stroke. Tokens in `tailwind.config.ts`, `globals.css`, and
`src/lib/theme.ts`. Spec: `docs/superpowers/specs/2026-08-04-careersume-highlight-rebrand-design.md`
in the EA repo. The device itself is `.mark` in `globals.css` plus `src/components/Mark.tsx`.
**Local URL:** http://localhost:3001
**Live URL:** https://careersume.univa.my
**GitHub:** repo to become `github.com/ahnafthaqeef/careersume` (currently a private path repo)

## How BYOK works
- Every AI call runs on the signed-in user's own key. The server holds no provider keys.
- `/onboarding` is the key wizard: pick a provider (Gemini recommended, free key, no card),
  paste a key, it's validated live against the provider and encrypted at rest.
- `src/lib/providers/`: one adapter per provider (`gemini.ts`, `groq.ts`, `openai.ts`,
  `anthropic.ts`), a shared `types.ts`, and `index.ts` as the registry (`PROVIDERS`, `getProvider`).
- `src/lib/ai.ts`: thin façade that routes a call to the user's chosen provider adapter.
- Keys are encrypted with `BYOK_ENCRYPTION_KEY` (AES-256-GCM, key derived by HKDF-SHA256); rotating
  it invalidates all saved keys and users must re-enter theirs. Stored ciphertext carries a `v2:`
  marker; anything without it is treated as unreadable and the user is asked for their key again.
- Master profile (parsed resume, saved facts reused across tailoring runs) lives in Supabase, not
  localStorage.

## Key Files
- `src/app/page.tsx`: marketing landing page
- `src/app/builder/page.tsx`: the resume builder (job → profile → template → output)
- `src/app/onboarding/page.tsx`: BYOK key wizard entry point
- `src/app/account/byok/page.tsx`: view/replace/revoke the connected key
- `src/app/api/generate-resume/route.ts`: core AI generation (streaming)
- `src/app/api/analyze-job/route.ts`: job description analysis
- `src/app/api/token-stats/route.ts`: admin-only per-provider usage (no pooled limits)
- `src/components/ResumeOutput.tsx`, `KeyWizard.tsx`, `AppNav.tsx`: key UI surfaces
- `src/lib/templates.ts`: resume template definitions
- `src/lib/parse-resume-file.ts`: PDF/DOCX/TXT to text, in the browser (pdfjs-dist + mammoth,
  both lazily imported). Resume files are never uploaded; there is no server parsing endpoint
- `src/types/index.ts`: shared TypeScript interfaces

## Environment
Exactly four required vars, see `.env.example`:
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `BYOK_ENCRYPTION_KEY`: generate with `openssl rand -base64 48`

One optional var: `JSEARCH_API_KEY` (RapidAPI), used only by the job scanner's search box. Without
it `/api/search-jobs` answers 503 "Job search is not configured on this instance." and the rest of
the app is unaffected.

No provider API keys and no `STRIPE_*` vars belong in the server environment anymore.

`next dev` reads `.env.local`; the Workers runtime reads `.dev.vars` locally and `wrangler secret`
values in production. `.dev.vars.example` mirrors `.env.example` for that reason.

## Database (Supabase)
Run these migrations, in order, against a fresh project:
- `supabase_core.sql`: `profiles` (+ the `on_auth_user_created` trigger that fills it), and the
  `resume_generations` / `cover_letters` / `ats_boosts` logs. Must run first, the others reference it
- `supabase_byok_keys.sql`: encrypted per-user provider keys
- `supabase_user_profiles.sql`: master profile storage
- `supabase_usage_counters.sql`: per-user daily caps on the two helper endpoints that consume our
  infra (fetch-job-url, search-jobs); resume generation itself is unlimited. Re-running it deletes
  any leftover `parse-profile` counters, which the endpoint-name constraint no longer allows
- `supabase_job_tracker.sql`: saved applications and their stages
- `supabase_feedback.sql`: in-app bug/idea reports, admin-only reads

`supabase_history_migration.sql` is legacy-only: it backfills pre-history databases and a fresh
project needs none of it.

## Commands
```bash
npm run dev     # starts on http://localhost:3001
npm run build   # production build
npm run lint    # next lint
npm test        # jest
npx tsc --noEmit  # type-check
```

## Deploy: Cloudflare Workers via OpenNext
The app ships as a single Worker built by `@opennextjs/cloudflare`; a plain `next build` still works
for self-hosters. Config lives in `wrangler.jsonc` (worker `careersume`, `nodejs_compat` +
`global_fetch_strictly_public`) and `open-next.config.ts` (defaults, no incremental cache: nothing
here uses ISR).

**It fits the Workers FREE plan, and should stay that way.** Two things keep it there, and both are
easy to undo by accident:
- **Bundle under the 3 MB gzip limit.** Check with `npx opennextjs-cloudflare build && npx wrangler
  deploy --dry-run`, which prints `Total Upload / gzip`. Anything heavy that a client component
  imports lands in the server bundle too, because "use client" files are compiled for SSR as well;
  `next.config.ts` resolves pdfjs-dist and mammoth to an empty module on the server for exactly
  that reason. **That exclusion is a webpack-only `resolve.alias`, and Turbopack ignores it without
  complaining**, so `next.config.ts` throws on load when `process.env.TURBOPACK` is set: never build
  this project with `--turbopack`. `scripts/assert-worker-lean.mjs` is the backstop, and
  `npm run deploy:cf` runs it before deploying.
- **No CPU-heavy work in a request.** The free plan allows 10ms CPU per request. Resume parsing is
  a browser job, and BYOK key derivation uses HKDF (microseconds) rather than a memory-hard KDF.

```bash
npm run preview    # opennextjs-cloudflare build && preview, real workerd on :8787
npm run deploy:cf  # build, assert the Worker is still lean, then deploy
```

- Local Workers secrets go in `.dev.vars` (gitignored); copy `.dev.vars.example`.
- Production secrets are set once with `wrangler secret put NEXT_PUBLIC_SUPABASE_URL`,
  and the same for `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`,
  `BYOK_ENCRYPTION_KEY`, and `JSEARCH_API_KEY` if the instance wants job search.
- `careersume.univa.my` is on the univa.my zone (moved 2026-08-13; resume.aibizmy.com 301s to it). The `routes` stanza in `wrangler.jsonc` is
  commented out; uncomment it when the custom domain is attached at deploy time.

## Known Issues / Notes
- `.next/` build cache can cause stale JS; delete it and restart if UI feels wrong

**Who deploys:** production deploys only work from the Cloudflare account that owns the `univa.my` zone (Ahnaf's). Contributors: push to `main` and ask for a deploy; running `deploy:cf` from another account uploads a stray worker and fails at the domain step.
