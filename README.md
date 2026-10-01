# Hack4SDG – Judging Platform

Homepage and online judging dashboard for **Hack for SDG – The Global Goals Hackathon**, an ideathon by AIESEC. The prelims are hosted at our college by E-Cell Enigma.

## About the event

College students form teams (max 4), pick a problem statement aligned with the UN Sustainable Development Goals (SDG 1–17, or SDG 18: their own idea), and pitch a solution in 7–8 minutes. Prelims are free to enter. The 5 best teams go to the final round.

## What we're building

1. **Homepage** – event info, the SDG problem statements, flow of steps, and the submission link.
2. **Judge dashboard** – judges log in, view each team's presentation (PDF) and details, and score them online.

## Planned architecture

- **Submissions:** teams submit via our own form (details plus a PDF deck) straight into Supabase.
- **Storage:** PDFs in a private Supabase Storage bucket (1 GB free; R2 is the fallback).
- **Database:** Supabase Postgres with row-level security. Judges only see their own scores; only admins see the leaderboard.
- **Frontend:** Next.js in `web/`.
- **Dashboard:** reads submissions, shows the PDF viewer and a scoring form, and ranks teams live to pick the top 5.

## Status

Built: Supabase schema (`supabase/schema.sql`) and the judge dashboard (`web/`). Next: submission form, then the homepage.

## Run it

```bash
cd web
cp .env.example .env.local   # fill in the Supabase URL + publishable key
npm install && npm run dev
```

**Approving a judge:** they sign up at `/login`, then an admin runs
`insert into judges (user_id, name, is_admin) select id, 'Name', false from auth.users where email = 'judge@example.com';`

## Event flow

Problem identification → Ideation → Solution development → Pitch → Evaluation → Final round
