# APE - Athlete Performance Evaluator

APE is a static coach-facing performance evaluation app for turning athlete test data into scores, reports, progress views, exports, and training recommendations.

The current production shape is intentionally simple:

- Static `index.html`
- Vanilla HTML/CSS/JavaScript
- Supabase Auth + Postgres sync
- GitHub Pages hosting today
- Vercel-ready static deployment path later

## Current Capabilities

- Athlete profile creation and editing
- Team management
- Evaluation scoring across jump, sprint, RSI, GPS, and force-transfer metrics
- Raw APE score preservation
- Position-adjusted score as a separate additive layer
- Sport-gated position context to avoid ambiguous matches such as football guard vs basketball guard
- Athlete history and progress graphs
- Premium-style client reports
- Suggested program generation
- Excel exports
- Coach settings and report branding
- Supabase email/password auth and coach-scoped data sync

## Core Files

- `index.html` - complete static app
- `BENCHMARK_NOTES.md` - benchmark assumptions, scoring context, and validation roadmap
- `supabase/migrations/` - Supabase schema migrations
- `.env.example` - environment variable reference for future build/deploy targets
- `DEPLOYMENT_CHECKLIST.md` - release checks for GitHub Pages and future Vercel deployment
- `CHANGELOG.md` - project change history

## Development

No build step is required.

Open `index.html` directly in a browser, or serve the folder with any static file server when testing CDN scripts, fonts, auth redirects, or deployment behavior.

Suggested sanity checks before committing:

```powershell
node -e "const fs=require('fs'); const html=fs.readFileSync('index.html','utf8'); const m=html.match(/<script>([\s\S]*?)<\/script>/); if(!m) throw new Error('No inline script'); new Function(m[1]); console.log('inline script parses');"
git diff --check
git status --short
```

## Supabase

The browser app uses the public Supabase anon key. Data isolation must be enforced with Row Level Security policies, not key secrecy.

Important rules:

- Never expose a service role key in the browser.
- Keep migrations in `supabase/migrations/`.
- Ensure client upsert fields match migration column names.
- Run RLS checks before production release.

## Product Direction

APE is moving toward a polished coach SaaS MVP while preserving the existing scoring engine.

Near-term priorities:

- Repo hygiene and deployment readiness
- Position-aware scoring hardening
- Premium dashboard and report presentation
- Coach/Admin workflow polish
- Future Athlete Viewer and Parent Viewer roles

Athlete and Parent viewers should eventually see progress, reports, graphs, and strengths/weaknesses. They should not see coach notes, programming, or internal scoring logic.
