-- Ejecuta este script una sola vez en Supabase: SQL Editor → New query → Run.

-- ---------- Tablas ----------

create table if not exists public.mangas (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users on delete cascade,
  title       text not null,
  author      text,
  description text,
  status      text not null default 'leyendo'
              check (status in ('leyendo', 'pendiente', 'pedido', 'terminado', 'abandonado')),
  cover_path  text,
  -- Tomo: o es tomo único (serie completa) o se indica el tomo a mano (serie incompleta).
  single_volume boolean not null default false,
  volume        text,
  created_at  timestamptz not null default now(),
  constraint mangas_volume_check check (not single_volume or volume is null)
);

create table if not exists public.chapters (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users on delete cascade,
  manga_id   uuid not null references public.mangas on delete cascade,
  number     numeric not null,
  title      text,
  notes      text,
  created_at timestamptz not null default now()
);

create table if not exists public.pages (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users on delete cascade,
  chapter_id  uuid not null references public.chapters on delete cascade,
  page_number int not null,
  image_path  text not null,
  created_at  timestamptz not null default now()
);

create index if not exists chapters_manga_idx on public.chapters (manga_id, number);
create index if not exists pages_chapter_idx  on public.pages (chapter_id, page_number);

-- ---------- Seguridad: cada usuario solo ve lo suyo ----------

alter table public.mangas   enable row level security;
alter table public.chapters enable row level security;
alter table public.pages    enable row level security;

create policy "own mangas"   on public.mangas   for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own chapters" on public.chapters for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own pages"    on public.pages    for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------- Storage: bucket privado para las imágenes ----------
-- Las rutas tienen la forma <user_id>/..., así que la primera carpeta identifica al dueño.

insert into storage.buckets (id, name, public)
values ('manga-images', 'manga-images', false)
on conflict (id) do nothing;

create policy "own images read" on storage.objects for select
  using (bucket_id = 'manga-images' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own images insert" on storage.objects for insert
  with check (bucket_id = 'manga-images' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own images update" on storage.objects for update
  using (bucket_id = 'manga-images' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own images delete" on storage.objects for delete
  using (bucket_id = 'manga-images' and (storage.foldername(name))[1] = auth.uid()::text);
