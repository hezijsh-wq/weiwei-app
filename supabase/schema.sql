-- Run once in the Supabase SQL Editor. Re-running is safe.
-- Private snapshots are accessible only to their authenticated owner.
create table if not exists public.fan_spaces (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  revision bigint not null default 1,
  updated_at timestamptz not null default now(),
  constraint snapshot_size check (octet_length(data::text) <= 1048576)
);
alter table public.fan_spaces enable row level security;
revoke all on public.fan_spaces from anon;
revoke all on public.fan_spaces from authenticated;
grant select on public.fan_spaces to authenticated;
drop policy if exists "Read own fan space" on public.fan_spaces;
create policy "Read own fan space" on public.fan_spaces for select to authenticated using ((select auth.uid()) = user_id);

-- Compare-and-swap prevents a second device from silently overwriting changes.
create or replace function public.save_fan_space(snapshot jsonb, expected_revision bigint)
returns bigint language plpgsql security definer set search_path = '' as $$
declare new_revision bigint;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if snapshot is null or jsonb_typeof(snapshot) <> 'object' then raise exception 'Invalid snapshot'; end if;
  if expected_revision = 0 then
    insert into public.fan_spaces(user_id, data) values(auth.uid(), snapshot)
    on conflict (user_id) do nothing returning revision into new_revision;
  else
    update public.fan_spaces set data = snapshot, revision = revision + 1, updated_at = now()
    where user_id = auth.uid() and revision = expected_revision returning revision into new_revision;
  end if;
  if new_revision is null then raise exception 'SYNC_CONFLICT' using errcode = '40001'; end if;
  return new_revision;
end $$;
revoke all on function public.save_fan_space(jsonb, bigint) from public, anon;
grant execute on function public.save_fan_space(jsonb, bigint) to authenticated;
