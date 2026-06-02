# Changelog

All notable changes to APE will be documented here.

## Unreleased

- Added repo hygiene baseline with `.gitignore`, `.gitattributes`, and `.env.example`.
- Added current SaaS MVP app baseline to the repo.
- Added Supabase migration source files.
- Added benchmark notes covering current assumptions, position context, and validation flags.
- Aligned athlete Supabase upsert naming with the `nk` schema column.
- Added migration for athlete `height` field used by the profile UI.
- Added a structured programs and training groups data model foundation for generated 6-week plans.
- Added coach-facing Programming tabs, default Schroeder/Ryan Paul bucket templates, group assignment actions, and editable training days.
- Renamed programming buckets with branded labels and replaced browser prompts with APE-styled dialog panels.
- Updated the public landing page with coach-first positioning, parent/report messaging, platform audience sections, USR positioning, founder credibility, and early demo CTA.
- Expanded the coach-only programming module with six-week volume bars, readiness KPI inputs, force-velocity profile cards, phase-change confirmation, and a drill picker.
- Added internal-testing polish for dashboard search, roster import duplicate updates, achievement badges, coach alerts, speed badges, and export summaries.
- Upgraded Event Mode with dropdown filters, sport-specific positions, active station setup, station completion counters, partial station saves, and event export status fields.
- Fixed Event Mode station highlighting so every checked station remains visible and highlighted while station navigation stays independent.
- Made the app header logo clickable so coaches can return to the landing page from inside the app.
- Added a public Sample Experience with read-only mock dashboard and client report previews before login.

## Earlier History

- Built athlete saving, reports, exports, graphs, suggested programs, and Supabase sync.
- Added APE scoring, deficiency classification, dashboard, leaderboard, team management, progress history, and client reports.
