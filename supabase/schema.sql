-- Applied to Supabase project lmdfhkrpggdmvdbqitnn (hack4sdg) as migration "initial_schema".
create table public.judges (
  user_id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.submissions (
  id uuid primary key default gen_random_uuid(),
  number integer generated always as identity unique,
  team_name text not null check (char_length(team_name) between 1 and 100),
  members jsonb not null default '[]'::jsonb,
  contact_email text not null,
  sdg smallint not null check (sdg between 1 and 18),
  title text not null check (char_length(title) between 1 and 200),
  summary text,
  deck_path text not null,
  created_at timestamptz not null default now()
);

create table public.criteria (
  id smallint generated always as identity primary key,
  label text not null,
  weight numeric not null default 1 check (weight > 0),
  max_score smallint not null default 10 check (max_score > 0),
  position smallint not null default 0
);

insert into public.criteria (label, weight, max_score, position) values
  ('SDG Relevance & Problem Identification', 1, 10, 1), ('Innovation & Originality', 1, 10, 2),
  ('Social & Environmental Impact', 1, 10, 3), ('Feasibility & Scalability', 1, 10, 4),
  ('Sustainability & Viability', 1, 10, 5);

create table public.scores (
  judge_id uuid not null references public.judges(user_id) on delete cascade,
  submission_id uuid not null references public.submissions(id) on delete cascade,
  criterion_id smallint not null references public.criteria(id) on delete cascade,
  value numeric not null check (value >= 0),
  updated_at timestamptz not null default now(),
  primary key (judge_id, submission_id, criterion_id)
);

create table public.comments (
  judge_id uuid not null references public.judges(user_id) on delete cascade,
  submission_id uuid not null references public.submissions(id) on delete cascade,
  body text not null default '',
  updated_at timestamptz not null default now(),
  primary key (judge_id, submission_id)
);

create function public.is_judge() returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.judges where user_id = (select auth.uid())); $$;
create function public.is_admin() returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.judges where user_id = (select auth.uid()) and is_admin); $$;

create function public.check_score_max() returns trigger language plpgsql set search_path = '' as $$
begin
  if new.value > (select max_score from public.criteria where id = new.criterion_id) then
    raise exception 'score exceeds max for criterion %', new.criterion_id;
  end if;
  new.updated_at = now();
  return new;
end $$;
create trigger scores_check before insert or update on public.scores
  for each row execute function public.check_score_max();

-- Admin-only leaderboard: weighted % per judge, averaged across judges.
create function public.leaderboard()
returns table (submission_id uuid, number integer, team_name text, title text, sdg smallint, judges_scored bigint, score_pct numeric)
language sql stable security definer set search_path = '' as $$
  with per_judge as (
    select s.submission_id, s.judge_id,
           sum(s.value / c.max_score * c.weight) / sum(c.weight) * 100 as pct
    from public.scores s join public.criteria c on c.id = s.criterion_id
    group by s.submission_id, s.judge_id
  )
  select sub.id, sub.number, sub.team_name, sub.title, sub.sdg, count(p.judge_id), round(avg(p.pct), 2)
  from public.submissions sub left join per_judge p on p.submission_id = sub.id
  where public.is_admin()
  group by sub.id order by avg(p.pct) desc nulls last;
$$;
revoke execute on function public.leaderboard() from public, anon;
grant execute on function public.leaderboard() to authenticated;
revoke execute on function public.is_judge(), public.is_admin() from public, anon;
grant execute on function public.is_judge(), public.is_admin() to authenticated;

alter table public.judges enable row level security;
alter table public.submissions enable row level security;
alter table public.criteria enable row level security;
alter table public.scores enable row level security;
alter table public.comments enable row level security;

create policy "judges read self or admin" on public.judges for select to authenticated using (user_id = (select auth.uid()) or public.is_admin());
create policy "admin manages judges" on public.judges for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "anyone can submit" on public.submissions for insert to anon, authenticated with check (true);
create policy "judges read submissions" on public.submissions for select to authenticated using (public.is_judge());
create policy "admin manages submissions" on public.submissions for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "judges read criteria" on public.criteria for select to authenticated using (public.is_judge());
create policy "admin manages criteria" on public.criteria for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "judge reads own scores" on public.scores for select to authenticated using (judge_id = (select auth.uid()) or public.is_admin());
create policy "judge writes own scores" on public.scores for insert to authenticated with check (judge_id = (select auth.uid()) and public.is_judge());
create policy "judge edits own scores" on public.scores for update to authenticated using (judge_id = (select auth.uid())) with check (judge_id = (select auth.uid()));
create policy "judge deletes own scores" on public.scores for delete to authenticated using (judge_id = (select auth.uid()));
create policy "judge reads own comments" on public.comments for select to authenticated using (judge_id = (select auth.uid()) or public.is_admin());
create policy "judge writes own comments" on public.comments for insert to authenticated with check (judge_id = (select auth.uid()) and public.is_judge());
create policy "judge edits own comments" on public.comments for update to authenticated using (judge_id = (select auth.uid())) with check (judge_id = (select auth.uid()));

-- Blind judging: judges can read only non-identifying columns.
revoke select on public.submissions from authenticated, anon;
grant select (id, number, sdg, title, summary, deck_path, created_at) on public.submissions to authenticated;
create function public.submission_identities()
returns table (id uuid, number integer, team_name text, members jsonb, contact_email text)
language sql stable security definer set search_path = '' as $$
  select s.id, s.number, s.team_name, s.members, s.contact_email
  from public.submissions s where public.is_admin() order by s.number; $$;
revoke execute on function public.submission_identities() from public, anon;
grant execute on function public.submission_identities() to authenticated;

create index on public.scores (submission_id);
create index on public.submissions (sdg);

-- PDFs live in Cloudflare R2 (see web/app/api/*), with Supabase Storage as fallback.
alter table public.submissions add column deck_store text not null default 'r2' check (deck_store in ('r2','supabase'));
grant select (deck_store) on public.submissions to authenticated;
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  values ('decks', 'decks', false, 15728640, array['application/pdf']) on conflict do nothing;
create policy "anyone uploads decks" on storage.objects for insert to anon, authenticated with check (bucket_id = 'decks');
create policy "judges read decks" on storage.objects for select to authenticated using (bucket_id = 'decks' and public.is_judge());
create policy "admin deletes decks" on storage.objects for delete to authenticated using (bucket_id = 'decks' and public.is_admin());
alter table public.submissions add constraint deck_path_format check (deck_path ~ '^[0-9a-f-]{36}\.pdf$');

-- Pre-approve judges by email: when they sign up they're added to judges automatically.
create table public.judge_invites (
  email text primary key check (email = lower(email)),
  name text not null,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.judge_invites enable row level security;
create policy "admin manages invites" on public.judge_invites for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create function public.apply_judge_invite() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.judges (user_id, name, is_admin)
  select new.id, i.name, i.is_admin from public.judge_invites i where i.email = lower(new.email)
  on conflict do nothing;
  return new;
end $$;
revoke execute on function public.apply_judge_invite() from public, anon, authenticated;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.apply_judge_invite();
-- Add a judge:  insert into public.judge_invites (email, name) values ('judge@example.com', 'Dr. Rao');

-- Team lead phone (judges can't read it; admins get it via submission_identities())
alter table public.submissions add column contact_phone text check (contact_phone is null or contact_phone ~ '^\+?[0-9 ()-]{7,20}$');
drop function public.submission_identities();
create function public.submission_identities()
returns table (id uuid, number integer, team_name text, members jsonb, contact_email text, contact_phone text)
language sql stable security definer set search_path = '' as $$
  select s.id, s.number, s.team_name, s.members, s.contact_email, s.contact_phone
  from public.submissions s where public.is_admin() order by s.number; $$;
revoke execute on function public.submission_identities() from public, anon;
grant execute on function public.submission_identities() to authenticated;

-- Migration "event_settings_receipts_finalists": deadline enforced on insert, private receipt
-- links that let a team replace its deck, and finalists the admin can publish on the homepage.
create table public.event_settings (
  id boolean primary key default true check (id), -- single row
  submissions_close timestamptz not null,
  finalists smallint not null default 10 check (finalists > 0),
  results_published boolean not null default false
);
insert into public.event_settings (submissions_close) values ('2026-10-10 23:59:59+05:30');
alter table public.event_settings enable row level security;
create policy "anyone reads settings" on public.event_settings for select to anon, authenticated using (true);
create policy "admin edits settings" on public.event_settings for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy "anyone can submit" on public.submissions;
create policy "anyone can submit before the deadline" on public.submissions for insert to anon, authenticated
  with check (now() <= (select submissions_close from public.event_settings));

-- The team keeps (id, edit_token) as a private link. Nobody can read the token back.
alter table public.submissions add column edit_token uuid;

create function public.submission_receipt(p_id uuid, p_token uuid)
returns table (number integer, team_name text, title text, sdg smallint, created_at timestamptz, editable boolean)
language sql stable security definer set search_path = '' as $$
  select s.number, s.team_name, s.title, s.sdg, s.created_at, now() <= (select e.submissions_close from public.event_settings e)
  from public.submissions s where s.id = p_id and s.edit_token = p_token; $$;

create function public.replace_deck(p_id uuid, p_token uuid, p_path text, p_store text)
returns boolean language plpgsql security definer set search_path = '' as $$
begin
  if now() > (select e.submissions_close from public.event_settings e) then
    raise exception 'Submissions are closed';
  end if;
  update public.submissions set deck_path = p_path, deck_store = p_store where id = p_id and edit_token = p_token;
  return found;
end $$;

-- Public once published: the top entries by the same score as leaderboard(), listed by entry number, not rank.
create function public.finalists()
returns table (number integer, team_name text, title text, sdg smallint)
language sql stable security definer set search_path = '' as $$
  with per_judge as (
    select s.submission_id, s.judge_id,
           sum(s.value / c.max_score * c.weight) / sum(c.weight) * 100 as pct
    from public.scores s join public.criteria c on c.id = s.criterion_id
    group by s.submission_id, s.judge_id
  ), ranked as (
    select sub.number, sub.team_name, sub.title, sub.sdg
    from public.submissions sub join per_judge p on p.submission_id = sub.id
    group by sub.id order by avg(p.pct) desc, sub.number
    limit (select e.finalists from public.event_settings e)
  )
  select r.number, r.team_name, r.title, r.sdg from ranked r
  where (select e.results_published from public.event_settings e) order by r.number;
$$;
grant execute on function public.submission_receipt(uuid, uuid), public.replace_deck(uuid, uuid, text, text), public.finalists() to anon, authenticated;
