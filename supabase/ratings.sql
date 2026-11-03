-- Puntuación de los mangas con estrellas (1 a 5). Ejecútalo después de shared_catalog.sql.
--
-- Cada usuario con sesión puntúa cada manga una vez (puede cambiar o quitar su nota).
-- Todos ven las notas de todos, para calcular la media; cada uno solo escribe las suyas.

create table public.manga_ratings (
  manga_id   uuid not null references public.mangas on delete cascade,
  user_id    uuid not null default auth.uid() references auth.users on delete cascade,
  rating     smallint not null check (rating between 1 and 5),
  updated_at timestamptz not null default now(),
  primary key (manga_id, user_id)
);
create index manga_ratings_user_idx on public.manga_ratings (user_id);

alter table public.manga_ratings enable row level security;

create policy "ratings readable" on public.manga_ratings for select to authenticated using (true);
create policy "insert own rating" on public.manga_ratings for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "update own rating" on public.manga_ratings for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "delete own rating" on public.manga_ratings for delete to authenticated
  using (user_id = (select auth.uid()));
