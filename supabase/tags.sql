-- Tags de los mangas. Ejecútalo después de roles.sql (usa private.is_admin()).
--
-- Los tags son comunes a todos: cualquiera con sesión los ve, pero solo un admin los crea,
-- renombra o borra. Cada usuario elige qué tags lleva cada uno de sus mangas.

create table public.tags (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (length(trim(name)) between 1 and 40),
  created_by uuid default auth.uid() references auth.users on delete set null,
  created_at timestamptz not null default now()
);
create unique index tags_name_unique on public.tags (lower(trim(name)));

alter table public.tags enable row level security;
create policy "tags readable" on public.tags for select to authenticated using (true);
create policy "admins insert tags" on public.tags for insert to authenticated with check ((select private.is_admin()));
create policy "admins update tags" on public.tags for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "admins delete tags" on public.tags for delete to authenticated using ((select private.is_admin()));

create table public.manga_tags (
  manga_id uuid not null references public.mangas on delete cascade,
  tag_id   uuid not null references public.tags on delete cascade,
  primary key (manga_id, tag_id)
);
create index manga_tags_tag_idx on public.manga_tags (tag_id);

alter table public.manga_tags enable row level security;
create policy "own manga tags" on public.manga_tags for all to authenticated
  using (exists (select 1 from public.mangas m where m.id = manga_id and m.user_id = (select auth.uid())))
  with check (exists (select 1 from public.mangas m where m.id = manga_id and m.user_id = (select auth.uid())));
