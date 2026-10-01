# Hack4SDG – Judging Platform

**Live:** https://hack4sdg.vercel.app

Homepage and online judging dashboard for **Hack for SDG – The Global Goals Hackathon**, an ideathon by AIESEC. The prelims are hosted at our college by E-Cell Enigma.

## About the event

College students form teams (max 4), pick a problem statement aligned with the UN Sustainable Development Goals (SDG 1–17, or SDG 18: their own idea), and pitch a solution in 7–8 minutes. Prelims are free to enter. The 5 best teams go to the final round.

## What we're building

1. **Homepage** – event info, the SDG problem statements, flow of steps, and the submission link.
2. **Judge dashboard** – judges log in, view each team's presentation (PDF) and details, and score them online.

## Planned architecture

- **Submissions:** teams submit via our own form (details plus a PDF deck) straight into Supabase.
- **Storage:** PDFs live in a private Supabase Storage bucket (1 GB free), which is what runs today. Cloudflare R2 support is built in but switched off: R2 needs a payment card on file even for the free tier, so we left it alone. To turn it on, add the four `R2_*` values to the environment and set up the bucket CORS from `cloudflare-r2-cors.json`; new uploads then go to R2 and old ones keep working. Judges read decks through `/api/deck-url`, which checks their Supabase login first.
- **Database:** Supabase Postgres with row-level security. Judges only see their own scores; only admins see the leaderboard.
- **Frontend:** Next.js in `web/`.
- **Dashboard:** reads submissions, shows the PDF viewer and a scoring form, and ranks teams live to pick the top 5.

## Status

Built: Supabase schema (`supabase/schema.sql`) and the judge dashboard (`web/`). Next: submission form, then the homepage.

## Run it

```bash
cd web
cp .env.example .env.local   # fill in Supabase URL/key + the four R2_* values
npm install && npm run dev
```

**Judge accounts:** public signup is disabled in Supabase Auth, so only organisers can add judges. Run this in the Supabase SQL editor (use a strong password, emails lowercase):

```sql
do $$ declare u uuid := gen_random_uuid(); begin
  insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change, email_change_token_new)
  values (u, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'judge@example.com', crypt('CHANGE-ME', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', '');
  insert into auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
  values (gen_random_uuid(), u, u::text, 'email', json_build_object('sub', u::text, 'email', 'judge@example.com'), now(), now(), now());
  insert into public.judges (user_id, name, is_admin) values (u, 'Dr. Rao', false);
end $$;
```

(Or add the user under Authentication → Users in the dashboard, then `insert into judges (user_id, name) ...`.)
