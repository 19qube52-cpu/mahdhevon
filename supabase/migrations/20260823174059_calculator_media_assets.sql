create table if not exists public.calculator_media_assets (
  id uuid primary key default gen_random_uuid(),
  calculator_id text not null,
  calculator_slug text not null,
  calculator_title text not null,
  provider text not null default 'xai',
  model text not null,
  prompt text not null,
  storage_path text not null,
  public_url text,
  mime_type text not null,
  byte_size bigint not null check (byte_size > 0 and byte_size <= 15728640),
  sha256 text not null,
  request_id text,
  cost_in_usd_ticks bigint,
  generation_status text not null default 'ready' check (generation_status in ('queued','submitted','processing','ready','failed','expired')),
  approval_status text not null default 'draft' check (approval_status in ('draft','approved','rejected')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  unique (calculator_slug, sha256)
);

alter table public.calculator_media_assets enable row level security;
revoke all on public.calculator_media_assets from anon, authenticated;
grant select on public.calculator_media_assets to anon, authenticated;
create index calculator_media_assets_slug_created_idx on public.calculator_media_assets (calculator_slug, created_at desc);

create policy "approved calculator images are public"
on public.calculator_media_assets for select
to anon, authenticated
using (approval_status = 'approved');

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('calculator-image-drafts', 'calculator-image-drafts', false, 15728640, array['image/jpeg','image/png','image/webp']),
  ('calculator-images', 'calculator-images', true, 15728640, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "approved calculator image objects are public"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'calculator-images');
