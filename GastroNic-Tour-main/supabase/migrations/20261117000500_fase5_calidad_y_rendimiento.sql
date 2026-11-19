-- =====================================================================
-- GastroNic Tour · Remediación · FASE 5: Calidad y rendimiento
-- =====================================================================
-- Requiere: Fases 1, 2 y 3 aplicadas.
-- Corrige:
--   Fase 2: URLs antiguas que bloqueaban actualizaciones (ver sección 0)
--   GN-20  índices, triggers y funciones duplicados o sin uso
--   GN-22  la auditoría deja de guardar una fila por cada cambio de contador
--   GN-25  funciones de lectura pasan a SECURITY INVOKER (respetan RLS);
--          search_path vacío en las funciones privilegiadas que faltaban
--   GN-26  get_restaurants_open_status acepta como máximo 200 IDs
--   GN-28  restricciones de dominio y columnas que solo fija el servidor
--   GN-29  "abierto ahora" correcto con horarios especiales, medianoche
--          y restaurantes abiertos 24 horas
--   GN-31  índices para claves foráneas sin índice
--
-- No cambia nada visible en la app salvo el cálculo de "abierto ahora",
-- que ahora acierta en los casos que antes fallaba.
--
-- Cómo ejecutar: pegar TODO en el SQL Editor. Una sola transacción.
-- Idempotente.
-- =====================================================================

begin;

-- =====================================================================
-- 2. GN-22 · Auditoría sin ruido
-- =====================================================================

-- No se guarda search_document (texto indexado, grande y redundante).
create or replace function public.write_audit_log()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  audit_record_id uuid;
  row_data jsonb;
  v_old jsonb;
  v_new jsonb;
begin
  if tg_op in ('UPDATE', 'DELETE') then
    v_old := to_jsonb(old) - 'search_document';
  end if;

  if tg_op in ('INSERT', 'UPDATE') then
    v_new := to_jsonb(new) - 'search_document';
  end if;

  row_data := coalesce(v_new, v_old);

  audit_record_id := public.try_uuid(
    coalesce(
      row_data ->> 'id',
      row_data ->> 'restaurant_id',
      row_data ->> 'user_id'
    )
  );

  insert into public.audit_logs (actor_id, action, table_name, record_id, old_data, new_data)
  values ((select auth.uid()), lower(tg_op), tg_table_name, audit_record_id, v_old, v_new);

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

-- En restaurants, los cambios que solo tocan contadores (rating, reseñas,
-- favoritos, visitas) o updated_at ya no generan una fila de auditoría.
drop trigger if exists audit_restaurants_trigger on public.restaurants;
drop trigger if exists audit_restaurants_insert_delete on public.restaurants;
drop trigger if exists audit_restaurants_update on public.restaurants;

create trigger audit_restaurants_insert_delete
  after insert or delete on public.restaurants
  for each row execute function public.write_audit_log();

create trigger audit_restaurants_update
  after update on public.restaurants
  for each row
  when (
    (to_jsonb(old) - array['average_rating', 'reviews_count', 'favorites_count',
                           'visits_count', 'updated_at', 'search_document'])
    is distinct from
    (to_jsonb(new) - array['average_rating', 'reviews_count', 'favorites_count',
                           'visits_count', 'updated_at', 'search_document'])
  )
  execute function public.write_audit_log();

-- =====================================================================
-- 0. CORRECCIÓN URGENTE de la Fase 2 · URLs guardadas antes de ella
-- =====================================================================
-- La Fase 2 creó la restricción restaurants_urls_http_check como NOT VALID
-- y un trigger que normaliza las URLs solo cuando se modifica una URL.
-- Un restaurante con una web antigua sin "https://" (p. ej. www.algo.com)
-- quedaba con cualquier otra actualización bloqueada, incluido el
-- recálculo automático de favoritos y reseñas. Se corrige así:
--   a) el trigger normaliza en CUALQUIER actualización de la fila;
--   b) se normalizan ahora todas las URLs existentes;
--   c) se valida la restricción contra todos los datos.
drop trigger if exists a_normalize_restaurant_urls_trigger on public.restaurants;
create trigger a_normalize_restaurant_urls_trigger
  before insert or update on public.restaurants
  for each row execute function public.normalize_restaurant_urls();

update public.restaurants
set website_url = website_url
where website_url is not null or facebook_url is not null or instagram_url is not null;

alter table public.restaurants validate constraint restaurants_urls_http_check;
alter table public.user_activity_events validate constraint user_activity_events_metadata_size;

-- =====================================================================
-- 1. GN-20 · Duplicados
-- =====================================================================

-- Índices idénticos a otros que ya existen.
drop index if exists public.favorites_restaurant_id_idx;          -- = favorites_restaurant_idx
drop index if exists public.notifications_user_idx;               -- = notifications_user_read_created_at_idx
drop index if exists public.profiles_username_unique_idx;         -- = profiles_username_unique_lower
drop index if exists public.point_transactions_source_unique;     -- cubierto por la restricción única

-- Dos triggers recalculaban favoritos en cada "me gusta": queda uno.
drop trigger if exists sync_favorites_count_insert on public.favorites;
drop trigger if exists sync_favorites_count_delete on public.favorites;
drop function if exists public.sync_restaurant_favorites_count();

-- Funciones sin ningún uso (ni triggers ni otras funciones las llaman,
-- ni el frontend).
drop function if exists public.sync_restaurant_review_stats();
drop function if exists public.update_reservation_status(uuid, text, text);

-- gastronic_v2_touch_updated_at era una copia de set_updated_at.
drop trigger if exists recommendation_feedback_touch_updated_at on public.recommendation_feedback;
create trigger recommendation_feedback_touch_updated_at
  before update on public.recommendation_feedback
  for each row execute function public.set_updated_at();

drop trigger if exists user_category_preferences_touch_updated_at on public.user_category_preferences;
create trigger user_category_preferences_touch_updated_at
  before update on public.user_category_preferences
  for each row execute function public.set_updated_at();

drop trigger if exists user_municipality_preferences_touch_updated_at on public.user_municipality_preferences;
create trigger user_municipality_preferences_touch_updated_at
  before update on public.user_municipality_preferences
  for each row execute function public.set_updated_at();

drop trigger if exists user_preferences_touch_updated_at on public.user_preferences;
create trigger user_preferences_touch_updated_at
  before update on public.user_preferences
  for each row execute function public.set_updated_at();

drop function if exists public.gastronic_v2_touch_updated_at();

-- =====================================================================
-- 3. GN-29 · "Abierto ahora" correcto
-- =====================================================================

-- Horario efectivo de un día: el especial si existe; si no, el semanal.
create or replace function public.restaurant_effective_hours(
  p_restaurant_id uuid,
  p_date date
)
returns table (is_open_day boolean, opens_at time, closes_at time)
language sql
stable
set search_path = ''
as $$
  with special as (
    select
      (not rsh.is_closed and rsh.opens_at is not null and rsh.closes_at is not null) as is_open_day,
      rsh.opens_at,
      rsh.closes_at
    from public.restaurant_special_hours rsh
    where rsh.restaurant_id = p_restaurant_id
      and rsh.special_date = p_date
    limit 1
  ),
  weekly as (
    select
      (not rh.is_closed and rh.opens_at is not null and rh.closes_at is not null) as is_open_day,
      rh.opens_at,
      rh.closes_at
    from public.restaurant_hours rh
    where rh.restaurant_id = p_restaurant_id
      and rh.day_of_week = extract(dow from p_date)::smallint
    limit 1
  )
  select * from special
  union all
  select * from weekly where not exists (select 1 from special)
  limit 1;
$$;

revoke execute on function public.restaurant_effective_hours(uuid, date) from public;
grant execute on function public.restaurant_effective_hours(uuid, date) to anon, authenticated;

-- Reglas:
--   1. Primero el tramo después de medianoche del día anterior
--      (antes se ignoraba si HOY tenía horario especial).
--   2. Después el horario de hoy. opens_at = closes_at significa
--      abierto las 24 horas (antes daba "cerrado").
create or replace function public.is_restaurant_open_at(
  p_restaurant_id uuid,
  p_at timestamp with time zone
)
returns boolean
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  v_local timestamp := timezone('America/Managua', coalesce(p_at, now()));
  v_today date := v_local::date;
  v_time time := v_local::time;
  v_yesterday record;
  v_today_hours record;
begin
  select * into v_yesterday
  from public.restaurant_effective_hours(p_restaurant_id, v_today - 1);

  if coalesce(v_yesterday.is_open_day, false)
     and v_yesterday.closes_at < v_yesterday.opens_at
     and v_time < v_yesterday.closes_at
  then
    return true;
  end if;

  select * into v_today_hours
  from public.restaurant_effective_hours(p_restaurant_id, v_today);

  if not coalesce(v_today_hours.is_open_day, false) then
    return false;
  end if;

  if v_today_hours.opens_at = v_today_hours.closes_at then
    return true;
  end if;

  if v_today_hours.closes_at > v_today_hours.opens_at then
    return v_time >= v_today_hours.opens_at
       and v_time < v_today_hours.closes_at;
  end if;

  -- Cruza medianoche: hoy solo cuenta el tramo desde la apertura.
  return v_time >= v_today_hours.opens_at;
end;
$$;

create or replace function public.is_restaurant_open_now(p_restaurant_id uuid)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select public.is_restaurant_open_at(p_restaurant_id, now());
$$;

-- GN-26: como máximo 200 restaurantes por llamada.
create or replace function public.get_restaurants_open_status(p_restaurant_ids uuid[])
returns table (restaurant_id uuid, is_open boolean)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    ids.restaurant_id,
    public.is_restaurant_open_now(ids.restaurant_id) as is_open
  from unnest(p_restaurant_ids[1:200]) as ids(restaurant_id);
$$;

-- =====================================================================
-- 4. GN-25 · Lecturas públicas respetan RLS; search_path vacío
-- =====================================================================
-- Estas funciones ya filtraban por restaurantes aprobados: con
-- SECURITY INVOKER, además, la base de datos lo garantiza con RLS.
alter function public.get_restaurants_nearby(double precision, double precision) security invoker;
alter function public.search_restaurants_global(text, integer) security invoker;

-- Funciones privilegiadas que tenían search_path = public. Usan nombres
-- con esquema, así que el cambio no altera su comportamiento.
alter function public.refresh_restaurant_review_stats(uuid) set search_path = '';
alter function public.sync_completed_reservation_visit() set search_path = '';
alter function public.sync_review_verified_visit() set search_path = '';

-- =====================================================================
-- 5. GN-28 · Restricciones de dominio
-- =====================================================================
-- Se validan contra los datos existentes. Si alguna fila no cumple,
-- la migración entera se revierte con un error que nombra la
-- restricción: en ese caso, envía el error y se corrige el dato.
-- (Una restricción NOT VALID dejaría esa fila imposible de editar.)

-- Datos que se ajustan antes de validar:
update public.restaurants
set reservation_max_party_size = 50
where reservation_max_party_size > 50;

update public.restaurants
set reservation_min_party_size = least(reservation_min_party_size, reservation_max_party_size)
where reservation_min_party_size > reservation_max_party_size;


alter table public.restaurants drop constraint if exists restaurants_reservation_party_size_max_50;
alter table public.restaurants add constraint restaurants_reservation_party_size_max_50
  check (reservation_max_party_size <= 50);   -- reservations.party_size también es 50

alter table public.restaurants drop constraint if exists restaurants_text_lengths;
alter table public.restaurants add constraint restaurants_text_lengths
  check (
    (description is null or char_length(description) <= 5000)
    and (address is null or char_length(address) <= 300)
    and (email is null or (char_length(email) <= 254 and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'))
    and (phone is null or char_length(phone) <= 40)
  );

alter table public.reservations drop constraint if exists reservations_text_lengths;
alter table public.reservations add constraint reservations_text_lengths
  check (
    char_length(guest_name) <= 120
    and (guest_phone is null or char_length(guest_phone) <= 40)
    and (guest_email is null or char_length(guest_email) <= 254)
    and (special_requests is null or char_length(special_requests) <= 1000)
    and (restaurant_notes is null or char_length(restaurant_notes) <= 1000)
  );

alter table public.user_generated_routes drop constraint if exists user_generated_routes_bounds;
alter table public.user_generated_routes add constraint user_generated_routes_bounds
  check (
    party_size <= 50
    and (total_budget is null or total_budget >= 0)
    and char_length(name) <= 120
  );

alter table public.reports drop constraint if exists reports_text_lengths;
alter table public.reports add constraint reports_text_lengths
  check (
    (details is null or char_length(details) <= 2000)
    and (resolution_notes is null or char_length(resolution_notes) <= 2000)
  );

-- Columnas que solo puede fijar el servidor al crear una fila.
create or replace function public.force_server_columns()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (select auth.uid()) is null or public.is_admin() then
    return new;
  end if;

  if tg_table_name = 'reservations' then
    new.restaurant_notes := null;
    new.cancellation_reason := null;
    new.cancelled_at := null;
    new.created_at := now();
  elsif tg_table_name = 'reports' then
    new.reviewed_by := null;
    new.reviewed_at := null;
    new.resolution_notes := null;
    new.created_at := now();
  end if;

  return new;
end;
$$;

drop trigger if exists a_force_server_columns on public.reservations;
create trigger a_force_server_columns
  before insert on public.reservations
  for each row execute function public.force_server_columns();

drop trigger if exists a_force_server_columns on public.reports;
create trigger a_force_server_columns
  before insert on public.reports
  for each row execute function public.force_server_columns();

-- =====================================================================
-- 6. GN-31 · Índices para claves foráneas
-- =====================================================================
create index if not exists reviews_visit_idx on public.reviews (visit_id);
create index if not exists user_route_stops_visit_idx on public.user_route_stops (visit_id);
create index if not exists visits_verified_by_idx on public.visits (verified_by);
create index if not exists reports_reviewed_by_idx on public.reports (reviewed_by);
create index if not exists reports_target_idx on public.reports (target_type, target_id);
create index if not exists gastro_routes_created_by_idx on public.gastro_routes (created_by);
create index if not exists user_generated_route_stops_restaurant_idx on public.user_generated_route_stops (restaurant_id);
create index if not exists user_generated_routes_municipality_idx on public.user_generated_routes (municipality_id);

commit;

-- Estadísticas del planificador (Q11 mostró n_live_tup = 0).
analyze;

-- =====================================================================
-- OPCIONAL · GN-11: exigir MFA a los administradores
-- =====================================================================
-- NO lo ejecutes hasta haber activado MFA en Authentication y haber
-- registrado un segundo factor en la cuenta admin. Si lo ejecutas antes,
-- el admin pierde el acceso al panel de administración.
--
-- create or replace function public.is_admin()
-- returns boolean language sql stable security definer set search_path = '' as $$
--   select exists (
--     select 1 from public.user_roles
--     where user_id = (select auth.uid()) and role = 'admin'
--   )
--   and coalesce((select auth.jwt()) ->> 'aal', '') = 'aal2';
-- $$;
-- =====================================================================

-- =====================================================================
-- VERIFICACIÓN (solo lectura)
-- =====================================================================
-- V1. Ya no hay índices duplicados (debe devolver 0):
-- select count(*) from pg_indexes where schemaname = 'public'
--   and indexname in ('favorites_restaurant_id_idx', 'notifications_user_idx',
--                     'profiles_username_unique_idx', 'point_transactions_source_unique');
--
-- V2. En la app: marcar y desmarcar un favorito cambia el contador en 1.
-- V3. En la app: el indicador "abierto ahora" coincide con el horario.
-- =====================================================================
