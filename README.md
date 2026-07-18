# Dravonix Project Estimator

A client-facing project estimator for Dravonix Media. Clients describe their project, confirm services, answer a
handful of scope questions, and get a deterministic, server-calculated preliminary budget and timeline — in five to
seven screens, two to four minutes.

Production domain: **https://estimate.dravonix.dev**

## Architecture summary

- **Next.js 15 (App Router) + TypeScript strict + Tailwind CSS v4 + shadcn-style components.**
- **One canonical estimator state** (`src/lib/estimator/schema.ts`) — a single Zod-validated TypeScript type shared
  by the wizard UI, client-side validation, the AI merge step, the pricing engine, and Supabase storage.
- **One typed question registry** (`src/lib/estimator/registry.ts`) — every concept the client can be asked about
  has exactly one canonical key, with `appliesWhen` / `isAnswered` / `blocksSubmission` rules.
- **One validation function** (`getMissingRequiredConcepts`, `src/lib/estimator/validation.ts`) — used for step
  completion, the Generate button, client submission, and server-side submission. Only pricing-critical, currently
  applicable concepts can block.
- **One visible-step engine** (`src/lib/estimator/steps.ts`) — derives the ordered, gap-free list of visible
  screens from state. The Assets & Support screen is skipped automatically once it's no longer relevant.
- **One deterministic pricing engine** (`src/lib/pricing/engine.ts`) — pure, server-side, no AI involvement.
- **Claude is interpretation-only.** `src/lib/ai/analyze.ts` calls Claude through a protected server route
  (`/api/analyze`), validates its response against a fixed Zod schema, and never lets it touch pricing. If Claude is
  slow, down, or returns something invalid, the wizard falls back to manual service selection silently — no error
  banner, no mention of AI.

## Folder structure

```
src/
  app/                      Routes (App Router)
    page.tsx                Landing + estimator (single route, no /estimate requirement)
    estimate/route.ts        308 redirect → / (preserves query/UTM)
    result/[reference]/      Estimate result page
    privacy/, terms/         Static policy pages
    admin/                   Administrator dashboard (Supabase Auth gated)
    api/                     Route handlers (analyze, estimate, pdf, leads/draft, admin/*)
  components/
    estimator/               Wizard shell + one component per screen
    ui/                       shadcn-style primitives (Button, Input, ChoiceCard, ...)
    brand/logo.tsx            The one reusable Logo component
    contact/contact-cards.tsx WhatsApp / Email / Contact page cards
    admin/                    Admin-only interactive widgets
  lib/
    estimator/                schema.ts, registry.ts, steps.ts, validation.ts, merge.ts, session.ts
    pricing/                  engine.ts (deterministic), active-services.ts (Supabase-backed, catalog fallback)
    ai/                       analyze.ts (Claude call + fallback), use-analyze.ts (client hook)
    pdf/                      generate.ts (pdf-lib)
    supabase/                 client.ts (browser), server.ts (RSC/route handlers), admin.ts (service role)
  types/database.ts           Hand-written types mirroring the Supabase schema
supabase/
  migrations/0001_init.sql    Full schema + RLS policies
  seed.sql                    Service catalog + default settings (SQL form)
scripts/seed.ts                Same seed, as a Node script (npm run seed)
docs/pricing-cta-snippet.tsx   Reference CTA component for the main Dravonix Media website
```

## Database schema (Supabase / Postgres)

`profiles`, `services`, `leads`, `project_briefs`, `estimates`, `estimate_items`, `lead_activity`, `app_settings` —
see `supabase/migrations/0001_init.sql` for the full DDL and Row Level Security policies. There is no generic
questionnaire table: estimator answers are stored as a single validated JSON blob (`project_briefs.answers`) that
mirrors the canonical `EstimatorState` TypeScript type.

## The seven-screen estimator

1. Client Details — name, business name, WhatsApp/email (at least one required), business stage
2. Project Idea — one description field + optional reference/inspiration links
3. Confirm Services — AI summary (if available) + service selection, "Not Sure", "View All Services"
4. Project Scope — conditional, up to 5 grouped blocks, only for selected services
5. Assets and Support — conditional, skipped once resolved or not applicable
6. Timeline and Investment — launch timeframe, flexibility, budget range, phased delivery
7. Review and Generate — summary with per-section Edit links, consent, Generate button

`/result/[reference]` is a separate page and is not counted as an input screen.

## Local setup

```bash
npm install
cp .env.example .env.local   # fill in Supabase + Claude values (see below)
npm run dev                  # http://localhost:3000
```

Useful scripts:

```bash
npm run typecheck   # tsc --noEmit
npm run lint         # eslint
npm run test          # vitest (unit tests for validation, steps, pricing, redirect, AI fallback)
npm run build          # production build
npm run seed             # seed Supabase with the service catalog + default settings
```

The estimator, PDF download, and admin dashboard all require Supabase to be configured. The wizard itself
(screens 1-7 and pricing preview logic in tests) works without any external service.

## Supabase setup

1. Create a project at https://supabase.com.
2. In the SQL editor, run `supabase/migrations/0001_init.sql`, then `supabase/seed.sql` (or run `npm run seed`
   after setting `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`).
3. Copy **Project URL** → `SUPABASE_URL`, **anon public key** → `SUPABASE_ANON_KEY`, **service_role key** →
   `SUPABASE_SERVICE_ROLE_KEY` (Project Settings → API). The service-role key must never be exposed to the browser
   — it is only read from `src/lib/supabase/admin.ts`, which is marked `server-only`.
4. Enable Email/Password sign-in under Authentication → Providers.
5. Create your first administrator: Authentication → Users → Add User, then insert a matching row into `profiles`:
   ```sql
   insert into profiles (id, email, role) values ('<auth-user-uuid>', 'you@dravonixmedia.com', 'admin');
   ```
6. Row Level Security is enabled on every table. Public estimator traffic writes through the service-role key from
   server-only API routes (bypassing RLS by design); the admin dashboard reads/writes through the anon key with the
   signed-in user's session, gated by the `is_admin()` policy helper.

## Claude API setup

1. Get an API key from https://console.anthropic.com.
2. Set `CLAUDE_API_KEY` (and optionally `CLAUDE_MODEL`, default `claude-sonnet-5`) in `.env.local`.
3. That's it — `/api/analyze` picks it up automatically. If the key is missing, invalid, or the API is unreachable,
   the estimator silently falls back to manual service selection (see `src/lib/ai/analyze.ts` and
   `src/components/estimator/steps/step-confirm-services.tsx`).

Claude is only ever asked to summarize the project description and extract already-stated scope details into a
fixed, Zod-validated schema (`aiInterpretationSchema`). It cannot calculate or influence prices, and its prompt
explicitly tells it to ignore any instructions embedded in the client's text.

## Cloudflare deployment

This app deploys to Cloudflare via [`@opennextjs/cloudflare`](https://opennext.js.org/cloudflare), which supports
the Node.js-runtime API routes this app uses (Supabase JS, pdf-lib, the Anthropic SDK).

```bash
npm run cf:build     # builds the Next.js app and adapts it for Cloudflare Workers
npm run cf:preview    # local preview against the Workers runtime
npm run cf:deploy      # deploy (requires `wrangler login` first)
```

Configuration lives in `wrangler.toml` and `open-next.config.ts`. Set secrets before deploying:

```bash
wrangler secret put SUPABASE_SERVICE_ROLE_KEY
wrangler secret put CLAUDE_API_KEY
```

Non-secret variables (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `NEXT_PUBLIC_*`) can be set as plain Worker environment
variables in the Cloudflare dashboard or under `[vars]` in `wrangler.toml` for non-sensitive values.

### DNS and custom domain for estimate.dravonix.dev

1. In the Cloudflare dashboard, open the Worker (or Pages project) created by `npm run cf:deploy`.
2. Under **Settings → Domains & Routes**, add a custom domain: `estimate.dravonix.dev`.
3. If `dravonix.dev` is already on Cloudflare, the CNAME/AAAA record is created automatically. Otherwise add a
   CNAME for `estimate` pointing at the Worker's `*.workers.dev` hostname, then attach the custom domain.
4. Confirm `NEXT_PUBLIC_ESTIMATOR_URL=https://estimate.dravonix.dev` is set for the production environment — it
   drives canonical URLs, Open Graph tags, the sitemap, and the WhatsApp/PDF/result links.

### Staging deployments

Deploy a second Worker (e.g. `dravonix-estimator-staging`) with `NEXT_PUBLIC_ALLOW_INDEXING=false` so
`robots.ts` blocks indexing, while production keeps it enabled.

## Main website pricing CTA

`docs/pricing-cta-snippet.tsx` is a reference component for the **main Dravonix Media website** (a separate
codebase) to add to `/pricing`. It links to `https://estimate.dravonix.dev`, preserves any UTM parameters from the
current page, and opens in the same tab. Copy it in and adjust styling to match the main site's design system.

## Future `/pricing/estimate` integration

The estimator already supports being mounted under a sub-path without code changes:

1. Set `NEXT_PUBLIC_ESTIMATOR_BASE_PATH=/pricing/estimate` (this flows into `next.config.ts`'s `basePath`).
2. Redeploy the estimator behind a Cloudflare Worker route or reverse proxy for
   `www.dravonixmedia.com/pricing/estimate/*`.
3. Update `NEXT_PUBLIC_ESTIMATOR_URL` accordingly so canonical URLs and result/PDF links stay correct.

No iframe is used or required.

## Testing

```bash
npm run test
```

Automated tests cover: missing-required-concept calculation, visible-step calculation (including empty-step
skipping and gap-free numbering), pricing calculations (logo tiers, SEO tiers never defaulting to the maximum,
monthly vs one-time separation, custom-quotation detection), Not Sure / flexible-timeline handling, AI merge
(`mergeScope`), the silent AI fallback when no API key is configured, and the `/estimate` → `/` redirect with UTM
preservation.

Manual verification checklist (see the PR/report for full results): AI-enabled and AI-disabled flows, mobile
layouts at 360–1440px, Supabase persistence, administrator authentication, PDF generation, WhatsApp/email/contact
links, and the production build.

## Environment variables

See `.env.example` for the full list with descriptions. Never commit real values — `SUPABASE_SERVICE_ROLE_KEY` and
`CLAUDE_API_KEY` are server-only secrets and must only be set as deployment secrets (Cloudflare `wrangler secret`,
or your host's equivalent), never as `NEXT_PUBLIC_*` variables.

## Brand assets

`/public/brand/` contains the Dravonix mark and wordmark lockups (`icon.svg`, `logo-light.svg`, `logo-dark.svg`),
consumed exclusively through the reusable `<Logo />` component (`src/components/brand/logo.tsx`). These were
recreated from the brand reference sheet shared for this project (colours, typography, and the arrow/"D" motif) —
replace them with the studio's original vector exports if pixel-exact fidelity to an existing asset library is
required; the `<Logo />` component and design tokens will pick up new files without any other code changes.
