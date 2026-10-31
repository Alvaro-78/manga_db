-- Catálogo común: la biblioteca es la misma para todos.
-- Cualquier usuario con sesión ve los mangas, sus tags y las portadas;
-- solo los admins crean, editan y borran. Ejecútalo después de roles.sql y tags.sql.

-- Mangas
alter policy "own mangas" on public.mangas to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
alter policy "own mangas" on public.mangas rename to "admins manage mangas";
create policy "mangas readable" on public.mangas for select to authenticated using (true);

-- Tags de cada manga
alter policy "own manga tags" on public.manga_tags
  using ((select private.is_admin())) with check ((select private.is_admin()));
alter policy "own manga tags" on public.manga_tags rename to "admins manage manga tags";
create policy "manga tags readable" on public.manga_tags for select to authenticated using (true);

-- Portadas
alter policy "own images read" on storage.objects to authenticated
  using (bucket_id = 'manga-images');
alter policy "own images read" on storage.objects rename to "images readable";
alter policy "own images insert" on storage.objects to authenticated
  with check (bucket_id = 'manga-images' and (select private.is_admin()));
alter policy "own images insert" on storage.objects rename to "admins insert images";
alter policy "own images update" on storage.objects to authenticated
  using (bucket_id = 'manga-images' and (select private.is_admin()));
alter policy "own images update" on storage.objects rename to "admins update images";
alter policy "own images delete" on storage.objects to authenticated
  using (bucket_id = 'manga-images' and (select private.is_admin()));
alter policy "own images delete" on storage.objects rename to "admins delete images";
