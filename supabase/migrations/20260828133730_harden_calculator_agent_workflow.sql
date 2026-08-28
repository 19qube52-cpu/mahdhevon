alter table public.calculator_definitions
  add column status text not null default 'draft' check (status in ('draft','published','archived')),
  add column version integer not null default 1 check (version > 0),
  add column tests jsonb not null default '[]'::jsonb,
  add column published_at timestamptz;

drop policy if exists "public_read_calculator_definitions" on public.calculator_definitions;
create policy "published calculator definitions are public"
on public.calculator_definitions for select to anon, authenticated
using (status = 'published' or auth.uid() is not null);

create table public.calculator_definition_versions (
  id uuid primary key default gen_random_uuid(),
  calculator_definition_id uuid not null references public.calculator_definitions(id) on delete cascade,
  version integer not null,
  snapshot jsonb not null,
  change_summary text not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (calculator_definition_id, version)
);
alter table public.calculator_definition_versions enable row level security;
revoke all on public.calculator_definition_versions from anon, authenticated;

create table public.admin_activity_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  status text not null check (status in ('success','error','pending')),
  message text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.admin_activity_logs enable row level security;
revoke all on public.admin_activity_logs from anon, authenticated;
create index admin_activity_logs_created_idx on public.admin_activity_logs (created_at desc);

create table public.ai_usage_ledger (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  model text not null,
  operation text not null,
  calculator_slug text,
  cost_in_usd_ticks bigint,
  success boolean not null,
  created_at timestamptz not null default now()
);
alter table public.ai_usage_ledger enable row level security;
revoke all on public.ai_usage_ledger from anon, authenticated;
create index ai_usage_ledger_created_idx on public.ai_usage_ledger (created_at desc);

create table public.ai_budget_settings (
  id boolean primary key default true check (id),
  daily_text_calls integer not null default 100 check (daily_text_calls between 1 and 1000),
  daily_image_calls integer not null default 20 check (daily_image_calls between 1 and 200),
  updated_at timestamptz not null default now()
);
alter table public.ai_budget_settings enable row level security;
revoke all on public.ai_budget_settings from anon, authenticated;
insert into public.ai_budget_settings (id) values (true) on conflict do nothing;

create or replace function public.save_calculator_draft(
  p_definition jsonb,
  p_queue_id uuid default null,
  p_change_summary text default 'AI draft created'
) returns public.calculator_definitions
language plpgsql security definer set search_path = public
as $$
declare
  result public.calculator_definitions;
  next_position integer;
begin
  if coalesce(p_definition->>'slug','') !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' then raise exception 'invalid slug'; end if;
  select coalesce(max(position),0)+1 into next_position from public.calculator_queue where status='pending';
  insert into public.calculator_definitions (calculator_id,slug,title,category_slug,description,inputs,formula,result_config,content,tests,status,updated_at)
  values (p_definition->>'calculator_id',p_definition->>'slug',p_definition->>'title',coalesce(p_definition->>'category_slug','general-tools'),p_definition->>'description',p_definition->'inputs',p_definition->'formula',coalesce(p_definition->'result_config','{}'),coalesce(p_definition->'content','{}'),coalesce(p_definition->'tests','[]'),'draft',now())
  on conflict (slug) do update set title=excluded.title, category_slug=excluded.category_slug, description=excluded.description, inputs=excluded.inputs, formula=excluded.formula, result_config=excluded.result_config, content=excluded.content, tests=excluded.tests, status='draft', version=calculator_definitions.version+1, updated_at=now()
  returning * into result;
  insert into public.calculator_definition_versions (calculator_definition_id,version,snapshot,change_summary)
  values (result.id,result.version,to_jsonb(result),p_change_summary) on conflict do nothing;
  if p_queue_id is null then
    insert into public.calculator_queue (calculator_id,calculator_slug,calculator_title,calculator_category,position,status,notes)
    select result.calculator_id,result.slug,result.title,result.category_slug,next_position,'pending','טיוטת AI מלאה'
    where not exists (select 1 from public.calculator_queue q where q.calculator_slug=result.slug and q.status='pending');
  else
    update public.calculator_queue set calculator_id=result.calculator_id, calculator_slug=result.slug, calculator_title=result.title, calculator_category=result.category_slug, status='pending' where id=p_queue_id;
  end if;
  return result;
end $$;
revoke all on function public.save_calculator_draft(jsonb,uuid,text) from public, anon, authenticated;

create or replace function public.publish_calculator(p_slug text) returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not exists (select 1 from public.calculator_definitions where slug=p_slug) then raise exception 'missing calculator definition'; end if;
  update public.calculator_definitions set status='published', published_at=now(), updated_at=now() where slug=p_slug;
  update public.calculator_queue set status='published', published_at=now() where calculator_slug=p_slug and status='pending';
end $$;
revoke all on function public.publish_calculator(text) from public, anon, authenticated;
