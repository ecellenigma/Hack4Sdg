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

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('decks', 'decks', false, 15728640, array['application/pdf']);
create policy "anyone uploads decks" on storage.objects for insert to anon, authenticated with check (bucket_id = 'decks');
create policy "judges read decks" on storage.objects for select to authenticated using (bucket_id = 'decks' and public.is_judge());
create policy "admin deletes decks" on storage.objects for delete to authenticated using (bucket_id = 'decks' and public.is_admin());
