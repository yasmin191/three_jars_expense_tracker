create table public.entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  month text not null,                                   -- 'YYYY-MM'
  kind text not null check (kind in ('income','expense')),
  bucket text check (bucket in ('needs','wants','savings')),
  label text not null,
  amount numeric not null check (amount > 0),
  created_at timestamptz not null default now()
);
alter table public.entries enable row level security;
create policy "own rows" on public.entries for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
