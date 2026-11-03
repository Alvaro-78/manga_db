-- Colores de los tags. Ejecútalo después de tags.sql.
--
-- Cada tag tiene un tono (hue, 0–359) con el que la app lo pinta. Para que no se repitan:
-- los tags existentes se reparten a la misma distancia en la rueda de color, y cada tag
-- nuevo recibe el tono más alejado de los que ya hay (el centro del mayor hueco libre).

alter table public.tags
  add column if not exists hue smallint not null default 0
  check (hue between 0 and 359);

-- Tono para un tag nuevo: el punto medio del mayor hueco entre los tonos usados.
create or replace function private.next_tag_hue()
returns smallint
language sql
stable
security definer
set search_path = ''
as $$
  with h as (select distinct hue from public.tags),
  gaps as (
    select hue,
           coalesce(lead(hue) over (order by hue), (select min(hue) from h) + 360) - hue as gap
    from h
  )
  select coalesce(
    (select ((hue + gap / 2) % 360)::smallint from gaps order by gap desc, hue limit 1),
    floor(random() * 360)::smallint -- primer tag: cualquiera
  );
$$;

create or replace function private.tag_set_hue()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.hue := private.next_tag_hue();
  return new;
end;
$$;

revoke all on function private.next_tag_hue() from public;
revoke all on function private.tag_set_hue() from public;

drop trigger if exists tags_set_hue on public.tags;
create trigger tags_set_hue
  before insert on public.tags
  for each row execute function private.tag_set_hue();

-- Reparte los tonos de los tags existentes a la misma distancia, en orden aleatorio
-- para que tags parecidos de nombre no queden con colores vecinos.
-- Se puede volver a ejecutar cuando se quiera re-sortear los colores.
with ordered as (
  select id, row_number() over (order by random()) - 1 as i, count(*) over () as n
  from public.tags
)
update public.tags t
set hue = (round(o.i * 360.0 / o.n)::int % 360)::smallint
from ordered o
where t.id = o.id;
