-- Roles de usuario. Ejecútalo después de schema.sql (SQL Editor → New query → Run).
--
-- Cada cuenta tiene un perfil con un rol: 'user' (por defecto) o 'admin'.
-- El primer usuario que se registra pasa a ser admin automáticamente.
-- Los usuarios pueden leer su propio rol, pero no cambiarlo; solo un admin puede cambiar roles.
-- Por ahora el rol no cambia qué datos ve cada uno: cada usuario sigue viendo solo sus mangas.

create type public.app_role as enum ('user', 'admin');

create table public.profiles (
  id         uuid primary key references auth.users on delete cascade,
  email      text,
  role       public.app_role not null default 'user',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Funciones auxiliares en un esquema privado (no expuesto por la API).
create schema if not exists private;

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

grant usage on schema private to authenticated;
revoke all on function private.is_admin() from public;
grant execute on function private.is_admin() to authenticated;

create policy "read own profile or admin" on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select private.is_admin()));

create policy "admins update profiles" on public.profiles for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));

-- Crear el perfil al registrarse. El primer usuario es admin.
create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, role)
  values (
    new.id,
    new.email,
    case when exists (select 1 from public.profiles) then 'user'::public.app_role
         else 'admin'::public.app_role end
  );
  return new;
end;
$$;

revoke all on function private.handle_new_user() from public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- Perfiles para usuarios que ya existían antes de este script (el más antiguo, admin).
insert into public.profiles (id, email, role)
select id, email,
       case when row_number() over (order by created_at) = 1 then 'admin'::public.app_role
            else 'user'::public.app_role end
from auth.users
on conflict (id) do nothing;

-- Para hacer admin a alguien a mano:
--   update public.profiles set role = 'admin' where email = 'correo@ejemplo.com';
