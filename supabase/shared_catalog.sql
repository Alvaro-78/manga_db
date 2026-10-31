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

-- Portadas. Las reglas existentes de storage.objects no se pueden modificar desde SQL
-- (la tabla es de supabase_storage_admin), así que solo se añaden reglas nuevas:
-- todos leen, los admins gestionan cualquier portada y unas reglas restrictivas
-- impiden escribir a quien no sea admin.
create policy "images readable" on storage.objects for select to authenticated
  using (bucket_id = 'manga-images');
create policy "admins manage images" on storage.objects for all to authenticated
  using (bucket_id = 'manga-images' and (select private.is_admin()))
  with check (bucket_id = 'manga-images' and (select private.is_admin()));
create policy "only admins insert images" on storage.objects as restrictive for insert to public
  with check (bucket_id <> 'manga-images' or (select private.is_admin()));
create policy "only admins update images" on storage.objects as restrictive for update to public
  using (bucket_id <> 'manga-images' or (select private.is_admin()));
create policy "only admins delete images" on storage.objects as restrictive for delete to public
  using (bucket_id <> 'manga-images' or (select private.is_admin()));
