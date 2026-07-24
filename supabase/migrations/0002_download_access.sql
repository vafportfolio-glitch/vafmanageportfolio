-- download_access table: presence of a row = that user can (a) download files
-- and (b) manage this table itself (grant/revoke others) via /team-portal/manage-access.
create table if not exists public.download_access (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  granted_at timestamp with time zone not null default now()
);

-- Seed with the emails that were hardcoded in lib/downloadAccess.ts before this
-- table existed. Only matches users who have already signed up (have a profiles row) —
-- anyone else on this list needs to sign up first, then be granted access via the UI.
insert into public.download_access (user_id)
select id from public.profiles
where email in (
  'ayesha.afzaal@vaforce.us',
  'ahtishammalik1478@gmail.com',
  'ifrah@growthguild.us',
  'useram@growthguild.us'
)
on conflict (user_id) do nothing;
