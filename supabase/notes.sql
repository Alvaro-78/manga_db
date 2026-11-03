-- Notas personales de cada usuario sobre un manga. Ejecútalo después de shared_catalog.sql.
--
-- Son privadas: cada usuario solo ve, escribe y borra las suyas (ni los admins ven las de otros).

create table public.manga_notes (
  manga_id   uuid not null references public.mangas on delete cascade,
  user_id    uuid not null default auth.uid() references auth.users on delete cascade,
  body       text not null check (length(trim(body)) between 1 and 5000),
  updated_at timestamptz not null default now(),
  primary key (manga_id, user_id)
);
create index manga_notes_user_idx on public.manga_notes (user_id);

alter table public.manga_notes enable row level security;

create policy "own notes" on public.manga_notes for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
