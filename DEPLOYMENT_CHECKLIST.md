# Deployment Checklist

Use this checklist before publishing APE to GitHub Pages or Vercel.

## Pre-Commit Checks

- `git status --short` shows only intentional changes.
- `git diff --check` passes.
- Inline app script parses successfully with Node.
- `index.html` includes closing `</body>` and `</html>` tags.
- No service role keys or private secrets are present.
- New app behavior has been tested with localStorage data.

## Supabase Checks

- Migrations in `supabase/migrations/` match client field names.
- RLS is enabled on exposed tables.
- Coach-scoped policies are present for coaches, athletes, teams, sessions, and coach settings.
- Browser client uses only the anon key.
- New columns used by `index.html` exist in migrations.
- Sign in, sign out, local sync, and pull-from-cloud flows are tested.

## GitHub Pages

- Static app loads from `index.html`.
- CDN scripts load over HTTPS:
  - Chart.js
  - XLSX
  - Supabase JS
- Supabase Auth redirect URLs include the GitHub Pages URL.
- Reports and print/PDF layout work in Chrome and Safari.

## Future Vercel

- Add Vercel project without introducing an unnecessary framework.
- Configure environment variables from `.env.example`.
- Add the Vercel deployment URL to Supabase Auth redirect URLs.
- Confirm static routing serves `index.html`.
- Re-test Supabase auth, exports, reports, and mobile layout after deployment.

## Product Release Smoke Test

- Coach can sign in.
- Coach can create an athlete.
- Coach can run an evaluation.
- Raw APE score appears.
- Position-adjusted score appears separately.
- Athlete report renders.
- Progress graph renders after multiple sessions.
- Export works.
- Team creation and assignment works.
- Mobile layout remains usable.
