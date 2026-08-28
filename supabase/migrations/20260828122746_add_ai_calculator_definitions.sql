create table public.calculator_definitions (
  id uuid primary key default gen_random_uuid(),
  calculator_id text not null unique,
  slug text not null unique,
  title text not null,
  category_slug text not null default 'general-tools',
  description text not null,
  inputs jsonb not null default '[]'::jsonb,
  formula jsonb not null,
  result_config jsonb not null default '{}'::jsonb,
  content jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.calculator_definitions enable row level security;
revoke all on public.calculator_definitions from anon, authenticated;
grant select on public.calculator_definitions to anon, authenticated;
create policy "public_read_calculator_definitions" on public.calculator_definitions for select to anon, authenticated using (true);
create index calculator_definitions_slug_idx on public.calculator_definitions (slug);
