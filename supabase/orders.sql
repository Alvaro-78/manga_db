-- Pedidos a tiendas. Ejecútalo después de roles.sql (usa private.is_admin()).
-- Solo los admins pueden ver y editar esta lista; es común a todos los admins.

create table public.orders (
  id         uuid primary key default gen_random_uuid(),
  title      text not null check (length(trim(title)) > 0),
  author     text,
  volume     text,
  publisher  text,
  created_by uuid default auth.uid() references auth.users on delete set null,
  created_at timestamptz not null default now()
);
create index orders_created_by_idx on public.orders (created_by);

alter table public.orders enable row level security;
create policy "admins manage orders" on public.orders for all to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));

-- Segunda mano: mismos campos y permisos que los pedidos.
create table public.second_hand (
  id         uuid primary key default gen_random_uuid(),
  title      text not null check (length(trim(title)) > 0),
  author     text,
  volume     text,
  publisher  text,
  created_by uuid default auth.uid() references auth.users on delete set null,
  created_at timestamptz not null default now()
);
create index second_hand_created_by_idx on public.second_hand (created_by);

alter table public.second_hand enable row level security;
create policy "admins manage second hand" on public.second_hand for all to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
