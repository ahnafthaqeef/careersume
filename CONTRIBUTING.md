# Contributing to Careersume

Thanks for being here. Bug reports, docs fixes, and small focused pull requests are all genuinely welcome, and you do not need to ask permission before opening one.

## Dev setup

Same as self-hosting. You need Node 20 or newer and a Supabase project (the free tier is fine).

```bash
git clone https://github.com/<your-username>/careersume.git
cd careersume
npm install
cp .env.example .env.local
```

Fill in the four required variables in `.env.local` (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `BYOK_ENCRYPTION_KEY`). `JSEARCH_API_KEY` is optional and only powers the job scanner's search box, so leave it unset unless you are working on that. Then run these six files in the Supabase SQL editor, in order:

1. `supabase_core.sql`, profiles plus the resume, cover letter, and ATS boost logs
2. `supabase_byok_keys.sql`, encrypted per-user provider keys
3. `supabase_user_profiles.sql`, the master profile
4. `supabase_usage_counters.sql`, daily caps on the helper endpoints
5. `supabase_job_tracker.sql`, saved applications and their stages
6. `supabase_feedback.sql`, in-app bug and idea reports

`supabase_history_migration.sql` is not in that list on purpose: it is a backfill for databases that predate history persistence, and a fresh one already has what it adds.

The [Self-hosting section of the README](README.md#self-hosting) explains what each variable is.

No AI provider keys go in the environment. Careersume is BYOK-only: you connect your own key through `/onboarding` after registering, exactly as any other user would.

## Commands

```bash
npm run dev       # dev server on http://localhost:3001
npm run build     # production build
npm run lint      # next lint
npm test          # jest
npx tsc --noEmit  # type-check
```

If the UI looks stale or wrong after a branch switch, delete `.next/` and restart the dev server.

## Code conventions

- **TypeScript strict.** `strict` is on and `npx tsc --noEmit` must be clean. Avoid `any`; if you truly need an escape hatch, leave a comment saying why.
- **Tailwind tokens only.** The "Paper" design system lives in `tailwind.config.ts` (`paper`, `surface`, `ink`, `line`, `accent`, `score`). Use those tokens. No raw hex values in app code. If a shade you need does not exist, add it to the config rather than inlining it.
- **No em dashes in user-facing copy.** House style. Use commas, colons, or a full stop. This applies to UI strings, docs, and error messages.
- **Match the file you are in.** Naming, comment density, and import order should look like the code around them. There is no separate style guide to memorise.
- **Server-only code stays server-only.** Anything touching `SUPABASE_SERVICE_ROLE_KEY`, `BYOK_ENCRYPTION_KEY`, or a decrypted user key runs in a route handler or a server module, never in a client component.

## Pull requests

- **Small and focused.** One change per PR. A 60-line PR gets reviewed the same day; a 900-line PR that touches six unrelated things does not.
- **Tests for logic changes.** Anything in `src/lib/` with real behaviour needs a test in `src/lib/__tests__/`. UI-only and copy-only changes do not.
- **Green before you open it.** `npm run build` and `npx tsc --noEmit` both pass locally. Say so in the PR description.
- **Explain the why.** One paragraph on what problem the change solves is worth more than a line-by-line description of the diff. Screenshots for anything visual.

## Where to start

Issues labelled [`good-first-issue`](https://github.com/ahnafthaqeef/careersume/labels/good%20first%20issue) are scoped so you can finish them in one sitting.

**Dark mode is the canonical first contribution.** The colour tokens are already centralised in `tailwind.config.ts` and the app uses them consistently, so the work is a real, self-contained feature: add a dark palette, wire a toggle that respects `prefers-color-scheme`, and walk the app surfaces to fix whatever the tokens do not cover. If you want it, say so on the issue first so two people do not build it twice.

Not sure whether an idea fits? Open an issue and ask before you build. That is always cheaper than a rejected PR.
