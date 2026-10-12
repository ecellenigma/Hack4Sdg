-- Read-only AIESEC partner dashboard. Partners are NOT judges: they see identities but never scores.
create table public.partners (
  user_id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);
create table public.partner_invites (
  email text primary key check (email = lower(email)),
  name text not null,
  created_at timestamptz not null default now()
);
alter table public.partners enable row level security;
alter table public.partner_invites enable row level security;
create policy "partner reads self" on public.partners for select to authenticated using (user_id = (select auth.uid()));
create policy "admin manages partners" on public.partners for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin manages partner invites" on public.partner_invites for all to authenticated using (public.is_admin()) with check (public.is_admin());

create function public.is_partner() returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.partners where user_id = (select auth.uid())); $$;
revoke execute on function public.is_partner() from public, anon;
grant execute on function public.is_partner() to authenticated;

-- Same sign-up trigger as judges: a pre-approved email becomes a partner automatically.
create or replace function public.apply_judge_invite() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.judges (user_id, name, is_admin)
  select new.id, i.name, i.is_admin from public.judge_invites i where i.email = lower(new.email)
  on conflict do nothing;
  insert into public.partners (user_id, name)
  select new.id, p.name from public.partner_invites p where p.email = lower(new.email)
  on conflict do nothing;
  return new;
end $$;

-- Track deck replacements so the partner view can show "last updated".
alter table public.submissions add column updated_at timestamptz not null default now();
update public.submissions set updated_at = created_at;
create or replace function public.replace_deck(p_id uuid, p_token uuid, p_path text, p_store text)
returns boolean language plpgsql security definer set search_path = '' as $$
begin
  if now() > (select e.submissions_close from public.event_settings e) then
    raise exception 'Submissions are closed';
  end if;
  update public.submissions set deck_path = p_path, deck_store = p_store, updated_at = now() where id = p_id and edit_token = p_token;
  return found;
end $$;

-- Explicit column list: edit_token, deck_path and every score table stay out of reach.
create function public.partner_submissions()
returns table (id uuid, number integer, team_name text, members jsonb, contact_email text, contact_phone text,
               sdg smallint, title text, summary text, created_at timestamptz, updated_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select s.id, s.number, s.team_name, s.members, s.contact_email, s.contact_phone, s.sdg, s.title, s.summary, s.created_at, s.updated_at
  from public.submissions s where public.is_partner() order by s.created_at desc; $$;

create function public.partner_deck(p_id uuid)
returns table (number integer, team_name text, deck_path text, deck_store text)
language sql stable security definer set search_path = '' as $$
  select s.number, s.team_name, s.deck_path, s.deck_store from public.submissions s where s.id = p_id and public.is_partner(); $$;

revoke execute on function public.partner_submissions(), public.partner_deck(uuid) from public, anon;
grant execute on function public.partner_submissions(), public.partner_deck(uuid) to authenticated;

-- Fallback store only; R2 decks are signed by the API route after the role check.
create policy "partners read decks" on storage.objects for select to authenticated using (bucket_id = 'decks' and public.is_partner());
