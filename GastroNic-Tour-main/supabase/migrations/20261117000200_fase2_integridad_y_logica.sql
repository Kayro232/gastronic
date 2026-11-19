-- =====================================================================
-- GastroNic Tour · Remediación · FASE 2: Integridad y lógica de negocio
-- =====================================================================
-- Requiere: Fase 1 aplicada.
-- Corrige:
--   GN-08  user_stats / user_settings para todos los usuarios (alta + backfill)
--   GN-16  el alta ya no falla por metadatos incompletos o username tomado
--   GN-02  autorización y notificaciones según restaurant_members, no created_by
--   GN-38  los dueños vuelven a poder borrar su restaurante
--   GN-03  (residual) puntos de visita: solo restaurantes aprobados, nunca a
--          miembros del propio restaurante, máximo 1 por restaurante y día
--   GN-05  los miembros de un restaurante no pueden reseñarlo
--   GN-17  puntos de reseña solo si está publicada y con visita verificada;
--          se retiran si deja de cumplirlo; insignias con un único criterio
--   GN-06  cambiar nombre, web, redes o ubicación retira la verificación;
--          URLs normalizadas y sin esquemas peligrosos
--   GN-04  approve_restaurant recalcula contadores antes de publicar
--
-- Cómo ejecutar: pegar TODO en el SQL Editor. Una sola transacción.
-- Idempotente. Después, ejecutar las verificaciones del final.
-- =====================================================================

begin;

-- =====================================================================
-- 1. GN-08 + GN-16 · Alta de usuario robusta
-- =====================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_full_name text :=
    left(coalesce(nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''), ''), 120);
  v_username text :=
    nullif(lower(btrim(new.raw_user_meta_data ->> 'username')), '');
begin
  -- Username inválido o ya tomado: se guarda null en lugar de abortar el alta.
  if v_username is not null and (
       v_username !~ '^[a-z0-9._]{3,30}$'
       or exists (
         select 1 from public.profiles p
         where lower(p.username) = v_username and p.id <> new.id
       )
     ) then
    v_username := null;
  end if;

  begin
    insert into public.profiles as p (id, full_name, username)
    values (new.id, v_full_name, v_username)
    on conflict (id) do update
      set full_name  = case when excluded.full_name <> '' then excluded.full_name else p.full_name end,
          username   = coalesce(excluded.username, p.username),
          updated_at = now();
  exception
    when unique_violation then
      -- Carrera por el mismo username: se registra sin username.
      insert into public.profiles as p (id, full_name, username)
      values (new.id, v_full_name, null)
      on conflict (id) do update
        set full_name  = case when excluded.full_name <> '' then excluded.full_name else p.full_name end,
            updated_at = now();
  end;

  insert into public.user_stats (user_id)    values (new.id) on conflict (user_id) do nothing;
  insert into public.user_settings (user_id) values (new.id) on conflict (user_id) do nothing;

  return new;
end;
$$;

-- Backfill de usuarios existentes (22 sin user_stats, 24 sin user_settings).
insert into public.user_stats (user_id)
select p.id from public.profiles p
on conflict (user_id) do nothing;

insert into public.user_settings (user_id)
select p.id from public.profiles p
on conflict (user_id) do nothing;

-- =====================================================================
-- 2. GN-02 · La propiedad la define restaurant_members
-- =====================================================================

-- 2a. Activar o desactivar reservas: owners del restaurante o admin.
create or replace function public.set_owned_restaurant_reservations(
  p_restaurant_id uuid,
  p_accepts_reservations boolean
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'Debes iniciar sesión.';
  end if;

  if not exists (select 1 from public.restaurants where id = p_restaurant_id) then
    raise exception 'El restaurante no existe.';
  end if;

  if not public.is_restaurant_owner(p_restaurant_id) then
    raise exception 'No tienes permisos para administrar este restaurante.';
  end if;

  update public.restaurants
  set accepts_reservations = p_accepts_reservations,
      updated_at = now()
  where id = p_restaurant_id;

  return p_accepts_reservations;
end;
$$;

-- 2b. Borrar restaurante: owners del restaurante o admin (antes: created_by).
create or replace function public.delete_owned_restaurant(p_restaurant_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_active_reservations integer;
begin
  if (select auth.uid()) is null then
    raise exception 'Debes iniciar sesión para eliminar un restaurante.';
  end if;

  perform 1 from public.restaurants where id = p_restaurant_id for update;
  if not found then
    raise exception 'El restaurante no existe.';
  end if;

  if not public.is_restaurant_owner(p_restaurant_id) then
    raise exception 'No tienes permisos para eliminar este restaurante.';
  end if;

  select count(*)::integer into v_active_reservations
  from public.reservations
  where restaurant_id = p_restaurant_id
    and status in ('pending', 'confirmed');

  if v_active_reservations > 0 then
    raise exception
      'No puedes eliminar este restaurante porque tiene % reservación(es) activa(s). Debes completarlas o cancelarlas primero.',
      v_active_reservations;
  end if;

  delete from public.restaurants where id = p_restaurant_id;
end;
$$;

-- 2c. Notificaciones de negocio: a todos los owners y managers actuales.
create or replace function public.notify_owner_new_reservation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_restaurant_name text;
begin
  select r.name into v_restaurant_name
  from public.restaurants r
  where r.id = new.restaurant_id;

  if not found then
    return new;
  end if;

  insert into public.notifications (user_id, type, title, message, data, is_read)
  select
    rm.user_id,
    'business_reservation',
    'Nueva reservación',
    format(
      '%s solicitó una mesa en %s para %s %s.',
      new.guest_name,
      v_restaurant_name,
      new.party_size,
      case when new.party_size = 1 then 'persona' else 'personas' end
    ),
    jsonb_build_object(
      'url', format('/owner/restaurants/%s/reservations', new.restaurant_id),
      'scope', 'business',
      'reservation_id', new.id,
      'restaurant_id', new.restaurant_id,
      'restaurant_name', v_restaurant_name,
      'guest_name', new.guest_name,
      'party_size', new.party_size,
      'reserved_for', new.reserved_for,
      'status', new.status
    ),
    false
  from public.restaurant_members rm
  where rm.restaurant_id = new.restaurant_id
    and rm.role in ('owner', 'manager');

  return new;
end;
$$;

create or replace function public.notify_owner_new_review()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_restaurant_name text;
begin
  if tg_op = 'INSERT' and new.status <> 'published' then
    return new;
  end if;

  if tg_op = 'UPDATE' and (old.status = 'published' or new.status <> 'published') then
    return new;
  end if;

  select r.name into v_restaurant_name
  from public.restaurants r
  where r.id = new.restaurant_id;

  insert into public.notifications (user_id, type, title, message, data, is_read, read_at, created_at)
  select
    rm.user_id,
    'business_review',
    'Nueva reseña',
    coalesce(v_restaurant_name, 'Tu restaurante')
      || ' recibió una reseña de ' || new.rating::text || ' estrellas.',
    jsonb_build_object(
      'scope', 'business',
      'restaurant_id', new.restaurant_id,
      'review_id', new.id,
      'rating', new.rating,
      'url', '/owner/restaurants/' || new.restaurant_id::text || '/reviews'
    ),
    false,
    null,
    now()
  from public.restaurant_members rm
  where rm.restaurant_id = new.restaurant_id
    and rm.role in ('owner', 'manager');

  return new;
end;
$$;

create or replace function public.notify_owner_restaurant_status()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_title text;
  v_message text;
begin
  if old.status is not distinct from new.status then
    return new;
  end if;

  if new.status not in ('approved', 'rejected', 'suspended') then
    return new;
  end if;

  if new.status = 'approved' then
    v_title := 'Restaurante aprobado';
    v_message := '"' || new.name || '" ya está aprobado en GastroNic Tour.';
  elsif new.status = 'rejected' then
    v_title := 'Tu solicitud requiere cambios';
    v_message := '"' || new.name || '" necesita correcciones antes de poder publicarse.';
  else
    v_title := 'Restaurante suspendido';
    v_message := '"' || new.name || '" fue suspendido temporalmente.';
  end if;

  insert into public.notifications (user_id, type, title, message, data, is_read, read_at, created_at)
  select
    rm.user_id,
    'business_restaurant_status',
    v_title,
    v_message,
    jsonb_build_object(
      'scope', 'business',
      'restaurant_id', new.id,
      'status', new.status,
      'url', '/owner/restaurants/' || new.id::text
    ),
    false,
    null,
    now()
  from public.restaurant_members rm
  where rm.restaurant_id = new.id
    and rm.role = 'owner';

  return new;
end;
$$;

-- =====================================================================
-- 3. GN-38 · El último owner puede irse cuando se borra el restaurante
-- =====================================================================
create or replace function public.protect_last_restaurant_owner()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  owner_count integer;
begin
  if public.is_admin() or (select auth.uid()) is null then
    if tg_op = 'DELETE' then return old; end if;
    return new;
  end if;

  -- Borrado en cascada del propio restaurante: la fila padre ya no existe.
  if tg_op = 'DELETE'
     and not exists (select 1 from public.restaurants r where r.id = old.restaurant_id)
  then
    return old;
  end if;

  if old.role = 'owner' and (tg_op = 'DELETE' or new.role <> 'owner') then
    -- Bloqueo de la fila del restaurante para evitar carreras (GN-30).
    perform 1 from public.restaurants r where r.id = old.restaurant_id for update;

    select count(*)::integer into owner_count
    from public.restaurant_members rm
    where rm.restaurant_id = old.restaurant_id
      and rm.role = 'owner';

    if owner_count <= 1 then
      raise exception 'El restaurante debe conservar al menos un propietario';
    end if;
  end if;

  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

-- =====================================================================
-- 4. GN-03 (residual) + GN-17 · Puntos canjeables con reglas estrictas
-- =====================================================================

-- 4a. Helper: ¿es miembro del restaurante?
create or replace function public.is_restaurant_member(target_restaurant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.restaurant_members rm
    where rm.restaurant_id = target_restaurant_id
      and rm.user_id = (select auth.uid())
  );
$$;

revoke execute on function public.is_restaurant_member(uuid) from public, anon;
grant execute on function public.is_restaurant_member(uuid) to authenticated;

-- 4b. ¿Una visita verificada da puntos?
create or replace function public.visit_earns_points(p_visit_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.visits v
    join public.restaurants r on r.id = v.restaurant_id
    where v.id = p_visit_id
      and v.verification_status = 'verified'
      and r.status = 'approved'
      -- nunca a miembros del propio restaurante
      and not exists (
        select 1 from public.restaurant_members rm
        where rm.restaurant_id = v.restaurant_id and rm.user_id = v.user_id
      )
      -- máximo una visita con puntos por restaurante y día (hora de Nicaragua)
      and not exists (
        select 1
        from public.point_transactions pt
        join public.visits v2 on v2.id = pt.source_id
        where pt.user_id = v.user_id
          and pt.source_type = 'visit'
          and v2.id <> v.id
          and v2.restaurant_id = v.restaurant_id
          and (v2.visited_at at time zone 'America/Managua')::date
            = (v.visited_at at time zone 'America/Managua')::date
      )
  );
$$;

revoke execute on function public.visit_earns_points(uuid) from public, anon, authenticated;

create or replace function public.award_visit_points()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.verification_status = 'verified'
     and (tg_op = 'INSERT' or old.verification_status is distinct from 'verified')
  then
    if public.visit_earns_points(new.id) then
      insert into public.point_transactions (user_id, amount, source_type, source_id, description)
      values (new.user_id, 10, 'visit', new.id, 'Visita verificada a un restaurante')
      on conflict (user_id, source_type, source_id) do nothing;
    end if;
  elsif tg_op = 'UPDATE'
        and old.verification_status = 'verified'
        and new.verification_status <> 'verified'
  then
    delete from public.point_transactions
    where user_id = new.user_id and source_type = 'visit' and source_id = new.id;
  end if;

  return new;
end;
$$;

-- 4c. Reseñas: puntos solo si está publicada y respaldada por visita verificada.
create or replace function public.award_review_points()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'published' and new.is_verified_visit then
    insert into public.point_transactions (user_id, amount, source_type, source_id, description)
    values (new.user_id, 20, 'review', new.id, 'Reseña publicada con visita verificada')
    on conflict (user_id, source_type, source_id) do nothing;
  else
    delete from public.point_transactions
    where user_id = new.user_id and source_type = 'review' and source_id = new.id;
  end if;

  return new;
end;
$$;

drop trigger if exists award_review_points_trigger on public.reviews;
create trigger award_review_points_trigger
  after insert or update of status, is_verified_visit on public.reviews
  for each row execute function public.award_review_points();

-- 4d. Insignias: un único criterio (solo insignias por puntos, sin duplicados).
create or replace function public.check_user_badges(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_points integer;
begin
  select coalesce(points, 0) into current_points
  from public.user_stats
  where user_id = p_user_id;

  insert into public.user_badges (user_id, badge_id)
  select p_user_id, b.id
  from public.badges b
  where b.is_active = true
    and b.criteria = '{}'::jsonb
    and b.points_required <= coalesce(current_points, 0)
  on conflict (user_id, badge_id) do nothing;
end;
$$;

-- =====================================================================
-- 5. GN-05 · Los miembros no reseñan su propio restaurante
-- =====================================================================
drop policy if exists "reviews_create_own" on public.reviews;
create policy "reviews_create_own" on public.reviews
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and public.is_restaurant_public(restaurant_id)
    and status = any (array['pending', 'published'])
    and not public.is_restaurant_member(restaurant_id)
  );

-- =====================================================================
-- 6. GN-06 · Cambios sensibles retiran la verificación; URLs seguras
-- =====================================================================
create or replace function public.guard_restaurant_sensitive_fields()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (select auth.uid()) is not null
     and current_user not in ('postgres', 'service_role', 'supabase_admin')
     and not public.is_admin()
  then
    new.created_by := old.created_by;
    new.status := old.status;
    new.is_verified := old.is_verified;
    new.is_featured := old.is_featured;
    new.published_at := old.published_at;
    new.average_rating := old.average_rating;
    new.reviews_count := old.reviews_count;
    new.favorites_count := old.favorites_count;
    new.visits_count := old.visits_count;
    new.rejection_reason := old.rejection_reason;
    new.created_at := old.created_at;

    -- Un restaurante verificado que cambia su identidad pierde el sello
    -- hasta que un admin lo revise de nuevo.
    if new.name            is distinct from old.name
       or new.slug         is distinct from old.slug
       or new.website_url  is distinct from old.website_url
       or new.facebook_url is distinct from old.facebook_url
       or new.instagram_url is distinct from old.instagram_url
       or new.address      is distinct from old.address
       or new.municipality_id is distinct from old.municipality_id
       or new.location::text is distinct from old.location::text
    then
      new.is_verified := false;
    end if;
  end if;

  return new;
end;
$$;

create or replace function public.normalize_restaurant_urls()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_col text;
  v_val text;
begin
  foreach v_col in array array['website_url', 'facebook_url', 'instagram_url'] loop
    v_val := nullif(btrim(
      case v_col
        when 'website_url'   then new.website_url
        when 'facebook_url'  then new.facebook_url
        else new.instagram_url
      end), '');

    if v_val is not null then
      if v_val ~* '^[a-z][a-z0-9+.-]*:' and v_val !~* '^https?://' then
        raise exception 'La dirección web no es válida: solo se aceptan enlaces http o https.';
      end if;
      if v_val !~* '^https?://' then
        v_val := 'https://' || v_val;
      end if;
      if v_val ~ '\s' or length(v_val) > 500 then
        raise exception 'La dirección web no es válida.';
      end if;
    end if;

    case v_col
      when 'website_url'  then new.website_url := v_val;
      when 'facebook_url' then new.facebook_url := v_val;
      else new.instagram_url := v_val;
    end case;
  end loop;

  return new;
end;
$$;

-- Nombre con prefijo "a_" para que corra ANTES del guard (orden alfabético).
drop trigger if exists a_normalize_restaurant_urls_trigger on public.restaurants;
create trigger a_normalize_restaurant_urls_trigger
  before insert or update of website_url, facebook_url, instagram_url on public.restaurants
  for each row execute function public.normalize_restaurant_urls();

-- Red de seguridad para escrituras futuras (NOT VALID: no revisa filas viejas).
alter table public.restaurants drop constraint if exists restaurants_urls_http_check;
alter table public.restaurants add constraint restaurants_urls_http_check check (
  (website_url   is null or website_url   ~* '^https?://')
  and (facebook_url  is null or facebook_url  ~* '^https?://')
  and (instagram_url is null or instagram_url ~* '^https?://')
) not valid;

-- =====================================================================
-- 7. GN-04 · Aprobar recalcula los contadores
-- =====================================================================
create or replace function public.approve_restaurant(p_restaurant_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_status text;
begin
  if (select auth.uid()) is null then
    raise exception 'Debes iniciar sesión para realizar esta acción.';
  end if;

  if not public.is_admin() then
    raise exception 'No tienes permisos para aprobar restaurantes.';
  end if;

  select status into v_status
  from public.restaurants
  where id = p_restaurant_id
  for update;

  if not found then
    raise exception 'El restaurante no existe.';
  end if;

  if v_status <> 'pending' then
    raise exception
      'Solo se pueden aprobar restaurantes pendientes de revisión. Estado actual: %.',
      v_status;
  end if;

  perform public.refresh_restaurant_review_stats(p_restaurant_id);
  perform public.refresh_restaurant_favorite_stats(p_restaurant_id);

  update public.restaurants
  set status = 'approved',
      published_at = now(),
      rejection_reason = null,
      visits_count = (
        select count(*)::integer from public.visits v
        where v.restaurant_id = p_restaurant_id
          and v.verification_status = 'verified'
      )
  where id = p_restaurant_id;
end;
$$;

-- =====================================================================
-- 8. Recalcular puntos y estadísticas con las reglas nuevas
-- =====================================================================

-- 8a. Puntos de reseñas que ya no califican.
delete from public.point_transactions pt
using public.reviews rv
where pt.source_type = 'review'
  and pt.source_id = rv.id
  and not (rv.status = 'published' and rv.is_verified_visit);

-- 8b. Reseñas que sí califican y no tenían puntos.
insert into public.point_transactions (user_id, amount, source_type, source_id, description)
select rv.user_id, 20, 'review', rv.id, 'Reseña publicada con visita verificada'
from public.reviews rv
where rv.status = 'published' and rv.is_verified_visit
on conflict (user_id, source_type, source_id) do nothing;

-- 8c. Puntos de visitas que no califican (restaurante no aprobado o miembro).
delete from public.point_transactions pt
using public.visits v
join public.restaurants r on r.id = v.restaurant_id
where pt.source_type = 'visit'
  and pt.source_id = v.id
  and (
    r.status <> 'approved'
    or exists (
      select 1 from public.restaurant_members rm
      where rm.restaurant_id = v.restaurant_id and rm.user_id = v.user_id
    )
  );

-- 8d. Estadísticas de todos los usuarios.
select public.refresh_user_points(p.id)       from public.profiles p;
select public.refresh_user_review_stats(p.id) from public.profiles p;
select public.refresh_user_route_stats(p.id)  from public.profiles p;
update public.user_stats us
set visits_count = (
      select count(*)::integer from public.visits v
      where v.user_id = us.user_id and v.verification_status = 'verified'
    ),
    updated_at = now();

commit;

-- =====================================================================
-- VERIFICACIÓN (solo lectura)
-- =====================================================================
-- V1. Todos los perfiles con user_stats y user_settings (ambos deben ser 0):
-- select
--   (select count(*) from public.profiles p where not exists (select 1 from public.user_stats s where s.user_id = p.id)) as sin_stats,
--   (select count(*) from public.profiles p where not exists (select 1 from public.user_settings s where s.user_id = p.id)) as sin_settings;
--
-- V2. Puntos coherentes con el libro (debe ser 0):
-- select count(*) from public.user_stats s
-- where s.points <> greatest(coalesce((select sum(amount) from public.point_transactions pt where pt.user_id = s.user_id), 0), 0);
--
-- V3. Prueba en la app: como DUEÑO de uno de tus 6 restaurantes,
--     activar/desactivar reservas y recibir la notificación de una reserva nueva.
-- =====================================================================
