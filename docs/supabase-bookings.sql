create extension if not exists pgcrypto;

create table if not exists public.bookings (
  id text primary key,
  name text,
  type text,
  date text,
  client1 text,
  client2 text,
  brickWordingReceived boolean default false,
  wording text,
  orderStatus text,
  insuranceReceived boolean default false,
  questionnaireReceived boolean default false,
  photoPermission boolean default false,
  photographerLink text,
  projectLink text,
  posted boolean default false,
  completed boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table if not exists public.bookings_backup (
  backup_id uuid primary key default gen_random_uuid(),
  original_id text,
  name text,
  type text,
  date text,
  client1 text,
  client2 text,
  brickWordingReceived boolean default false,
  wording text,
  orderStatus text,
  insuranceReceived boolean default false,
  questionnaireReceived boolean default false,
  photoPermission boolean default false,
  photographerLink text,
  projectLink text,
  posted boolean default false,
  completed boolean default false,
  duplicated_at timestamp with time zone default now()
);

alter table public.bookings enable row level security;
alter table public.bookings_backup enable row level security;

create policy "Allow anon access to bookings"
  on public.bookings
  for all
  using (true)
  with check (true);

create policy "Allow anon access to bookings backup"
  on public.bookings_backup
  for all
  using (true)
  with check (true);
