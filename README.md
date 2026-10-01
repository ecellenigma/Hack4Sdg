# Hack4SDG – Judging Platform

Homepage and online judging dashboard for **Hack for SDG – The Global Goals Hackathon**, an ideathon by AIESEC. The prelims are hosted at our college by E-Cell Enigma.

## About the event

College students form teams (max 4), pick a problem statement aligned with the UN Sustainable Development Goals (SDG 1–17, or SDG 18: their own idea), and pitch a solution in 7–8 minutes. Prelims are free to enter. The 5 best teams go to the final round.

## What we're building

1. **Homepage** – event info, the SDG problem statements, flow of steps, and the submission link.
2. **Judge dashboard** – judges log in, view each team's presentation (PDF) and details, and score them online.

## Planned architecture

- **Submissions:** teams submit via a form (details plus a PDF deck). Open question: Google Forms → Sheets/Drive, or direct to Supabase.
- **Storage:** PDFs in Supabase Storage (1 GB free) or Cloudflare R2 (10 GB free).
- **Database:** judging scores and judge accounts in Supabase (or MongoDB).
- **Dashboard:** reads submissions, shows the PDF viewer and a scoring form, and ranks teams live to pick the top 5.

## Status

Early planning. Nothing is built yet.

## Event flow

Problem identification → Ideation → Solution development → Pitch → Evaluation → Final round
