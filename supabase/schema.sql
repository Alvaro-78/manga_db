-- Ejecuta este script una sola vez en Supabase: SQL Editor → New query → Run.

-- ---------- Tablas ----------

create table if not exists public.mangas (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users on delete cascade,
  title       text not null,
  author      text,
  description text,
  status      text not null default 'leyendo'
              check (status in ('leyendo', 'pendiente', 'terminado', 'abandonado')),
  cover_path  text,
  -- Colección: un solo tomo (single_volume) o varios tomos, con el detalle escrito a mano (volume).
  single_volume boolean not null default false,
  volume        text,
  series_complete boolean not null default false, -- un tomo único siempre es serie completa
  created_at  timestamptz not null default now(),
  constraint mangas_volume_check check (not single_volume or volume is null)
);


-- ---------- Seguridad: cada usuario solo ve lo suyo ----------

alter table public.mangas   enable row level security;

create policy "own mangas"   on public.mangas   for all
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create index if not exists mangas_user_idx on public.mangas (user_id);

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
