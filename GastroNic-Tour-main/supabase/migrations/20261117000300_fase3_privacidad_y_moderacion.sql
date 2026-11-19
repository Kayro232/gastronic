-- =====================================================================
-- GastroNic Tour · Remediación · FASE 3: Privacidad y moderación
-- =====================================================================
-- Requiere: Fases 1 y 2 aplicadas.
-- Corrige:
--   GN-12  perfiles, puntos, insignias y reacciones dejan de ser públicos
--   GN-14  se respeta "desactivar personalización"; retención de datos
--   GN-10  un restaurante suspendido no puede modificar su contenido;
--          un restaurante rechazado puede reenviarse a revisión
--   GN-18  borrar una cuenta ya no queda bloqueado por claves foráneas
--   GN-13  límites contra abuso (reservas, solicitudes, reportes, eventos)
--   GN-15  los usuarios ya no pueden guardar imágenes de dominios externos
--   GN-19  las rutas generadas validan sus paradas y visitas
--
-- Acompaña a este archivo un cambio en el frontend:
--   components/auth/register-form.tsx  (comprobar username con RPC)
-- Aplica primero esta migración y después despliega ese cambio.
--
-- Cómo ejecutar: pegar TODO en el SQL Editor. Una sola transacción.
-- Idempotente.
-- =====================================================================

begin;

-- =====================================================================
-- 1. GN-12 · Datos de usuarios visibles solo cuando hace falta
-- =====================================================================

-- Un perfil es visible para: su dueño, un admin, cualquiera si la persona
-- publicó una reseña en un restaurante aprobado (se muestra su nombre
-- junto a la reseña), y los managers del restaurante que reseñó.
create or replace function public.profile_is_visible(target_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    target_profile_id = (select auth.uid())
    or public.is_admin()
    or exists (
      select 1
      from public.reviews rv
      join public.restaurants r on r.id = rv.restaurant_id
      where rv.user_id = target_profile_id
        and rv.status = 'published'
        and r.status = 'approved'
    )
    or exists (
      select 1 from public.reviews rv
      where rv.user_id = target_profile_id
        and public.can_manage_restaurant(rv.restaurant_id)
    );
$$;

revoke execute on function public.profile_is_visible(uuid) from public;
grant execute on function public.profile_is_visible(uuid) to anon, authenticated;

drop policy if exists "profiles_public_read" on public.profiles;
drop policy if exists "profiles_read_visible" on public.profiles;
create policy "profiles_read_visible" on public.profiles
  for select to anon, authenticated
  using (public.profile_is_visible(id));

-- El registro comprobaba si un username estaba libre leyendo "profiles"
-- sin sesión. Ahora lo hace esta función, que solo responde sí o no.
create or replace function public.is_username_available(p_username text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select p_username is not null
    and lower(btrim(p_username)) ~ '^[a-z0-9._]{3,30}$'
    and not exists (
      select 1 from public.profiles p
      where lower(p.username) = lower(btrim(p_username))
    );
$$;

revoke execute on function public.is_username_available(text) from public;
grant execute on function public.is_username_available(text) to anon, authenticated;

-- Puntos, insignias y reacciones: la app solo lee los del propio usuario.
drop policy if exists "user_stats_public_read" on public.user_stats;
drop policy if exists "user_stats_read_own" on public.user_stats;
create policy "user_stats_read_own" on public.user_stats
  for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));

drop policy if exists "user_badges_public_read" on public.user_badges;
drop policy if exists "user_badges_read_own" on public.user_badges;
create policy "user_badges_read_own" on public.user_badges
  for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));

drop policy if exists "review_reactions_read" on public.review_reactions;
drop policy if exists "review_reactions_read_own" on public.review_reactions;
create policy "review_reactions_read_own" on public.review_reactions
  for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));

-- =====================================================================
-- 2. GN-14 + GN-13 · Eventos de actividad: consentimiento y límites
-- =====================================================================
-- Si el usuario desactivó la personalización, el evento no se guarda.
-- Tampoco se guardan más de 300 eventos por hora y usuario.
-- El trigger devuelve NULL: la inserción se descarta sin error, así que
-- el seguimiento de la app sigue funcionando sin mostrar fallos.
create or replace function public.filter_activity_event()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null or public.is_admin() then
    return new;
  end if;

  if not coalesce(
       (select us.personalization_enabled
        from public.user_settings us
        where us.user_id = new.user_id),
       true
     ) then
    return null;
  end if;

  if (
    select count(*)
    from public.user_activity_events e
    where e.user_id = new.user_id
      and e.created_at > now() - interval '1 hour'
  ) >= 300 then
    return null;
  end if;

  return new;
end;
$$;

drop trigger if exists a_filter_activity_event on public.user_activity_events;
create trigger a_filter_activity_event
  before insert on public.user_activity_events
  for each row execute function public.filter_activity_event();

alter table public.user_activity_events
  drop constraint if exists user_activity_events_metadata_size;
alter table public.user_activity_events
  add constraint user_activity_events_metadata_size
  check (metadata is null or pg_column_size(metadata) <= 4096) not valid;

-- Retención: eventos de comportamiento 180 días, auditoría 365 días.
create or replace function public.purge_old_personal_data()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.user_activity_events
  where created_at < now() - interval '180 days';

  delete from public.audit_logs
  where created_at < now() - interval '365 days';
end;
$$;

revoke execute on function public.purge_old_personal_data() from public, anon, authenticated;

-- Para programarla todos los días (requiere activar la extensión pg_cron
-- en Database → Extensions). Ejecutar aparte, una sola vez:
--   select cron.schedule('gastronic-purge-personal-data', '15 9 * * *',
--                        $$select public.purge_old_personal_data()$$);

-- =====================================================================
-- 3. GN-10 · Restaurantes suspendidos y reenvío tras rechazo
-- =====================================================================

-- ¿Puede el usuario actual modificar el contenido de este restaurante?
create or replace function public.can_edit_restaurant_content(target_restaurant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_admin()
    or (
      public.can_manage_restaurant(target_restaurant_id)
      and exists (
        select 1 from public.restaurants r
        where r.id = target_restaurant_id
          and r.status <> 'suspended'
      )
    );
$$;

revoke execute on function public.can_edit_restaurant_content(uuid) from public, anon;
grant execute on function public.can_edit_restaurant_content(uuid) to authenticated;

-- Bloqueo de escrituras sobre el contenido de un restaurante suspendido.
create or replace function public.guard_suspended_restaurant_content()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row jsonb;
  v_restaurant_id uuid;
  v_status text;
begin
  if (select auth.uid()) is null or public.is_admin() then
    if tg_op = 'DELETE' then return old; end if;
    return new;
  end if;

  if tg_op = 'DELETE' then
    v_row := to_jsonb(old);
  else
    v_row := to_jsonb(new);
  end if;

  v_restaurant_id := nullif(v_row ->> 'restaurant_id', '')::uuid;

  if v_restaurant_id is null and v_row ? 'menu_item_id' then
    select mi.restaurant_id into v_restaurant_id
    from public.menu_items mi
    where mi.id = (v_row ->> 'menu_item_id')::uuid;
  end if;

  if v_restaurant_id is not null then
    select r.status into v_status
    from public.restaurants r
    where r.id = v_restaurant_id;

    if v_status = 'suspended' then
      raise exception 'Este restaurante está suspendido: no se puede modificar su contenido hasta que un administrador lo reactive.';
    end if;
  end if;

  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

do $$
declare
  t text;
begin
  foreach t in array array[
    'restaurant_images', 'menu_categories', 'menu_items', 'menu_item_variants',
    'menu_item_addons', 'restaurant_hours', 'restaurant_special_hours',
    'restaurant_categories', 'restaurant_amenities'
  ] loop
    execute format('drop trigger if exists guard_suspended_content on public.%I', t);
    execute format(
      'create trigger guard_suspended_content before insert or update or delete on public.%I
         for each row execute function public.guard_suspended_restaurant_content()', t);
  end loop;
end;
$$;

-- El propio restaurante suspendido tampoco puede editarse (salvo admin).
create or replace function public.guard_suspended_restaurant_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (select auth.uid()) is not null
     and current_user not in ('postgres', 'service_role', 'supabase_admin')
     and not public.is_admin()
     and old.status = 'suspended'
  then
    raise exception 'Este restaurante está suspendido: no se puede modificar hasta que un administrador lo reactive.';
  end if;

  return new;
end;
$$;

drop trigger if exists guard_suspended_restaurant_update on public.restaurants;
create trigger guard_suspended_restaurant_update
  before update on public.restaurants
  for each row execute function public.guard_suspended_restaurant_update();

-- Reenviar a revisión un restaurante rechazado (antes era imposible).
create or replace function public.resubmit_restaurant(p_restaurant_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_status text;
begin
  if (select auth.uid()) is null then
    raise exception 'Debes iniciar sesión.';
  end if;

  select status into v_status
  from public.restaurants
  where id = p_restaurant_id
  for update;

  if not found then
    raise exception 'El restaurante no existe.';
  end if;

  if not public.is_restaurant_owner(p_restaurant_id) then
    raise exception 'No tienes permisos para administrar este restaurante.';
  end if;

  if v_status <> 'rejected' then
    raise exception 'Solo se pueden reenviar restaurantes rechazados. Estado actual: %.', v_status;
  end if;

  update public.restaurants
  set status = 'pending',
      rejection_reason = null,
      updated_at = now()
  where id = p_restaurant_id;
end;
$$;

revoke execute on function public.resubmit_restaurant(uuid) from public, anon;
grant execute on function public.resubmit_restaurant(uuid) to authenticated;

-- Storage: subir, cambiar o borrar imágenes de un restaurante suspendido.
do $$
begin
  if to_regclass('storage.objects') is not null then
    drop policy if exists "storage_restaurant_images_insert_manager" on storage.objects;
    create policy "storage_restaurant_images_insert_manager" on storage.objects
      for insert to authenticated
      with check (bucket_id = 'restaurant-images'
        and public.can_edit_restaurant_content(public.try_uuid((storage.foldername(name))[1])));

    drop policy if exists "storage_restaurant_images_update_manager" on storage.objects;
    create policy "storage_restaurant_images_update_manager" on storage.objects
      for update to authenticated
      using (bucket_id = 'restaurant-images'
        and public.can_edit_restaurant_content(public.try_uuid((storage.foldername(name))[1])))
      with check (bucket_id = 'restaurant-images'
        and public.can_edit_restaurant_content(public.try_uuid((storage.foldername(name))[1])));

    drop policy if exists "storage_restaurant_images_delete_manager" on storage.objects;
    create policy "storage_restaurant_images_delete_manager" on storage.objects
      for delete to authenticated
      using (bucket_id = 'restaurant-images'
        and public.can_edit_restaurant_content(public.try_uuid((storage.foldername(name))[1])));

    drop policy if exists "storage_menu_images_insert_manager" on storage.objects;
    create policy "storage_menu_images_insert_manager" on storage.objects
      for insert to authenticated
      with check (bucket_id = 'menu-images'
        and public.can_edit_restaurant_content(public.try_uuid((storage.foldername(name))[1])));

    drop policy if exists "storage_menu_images_update_manager" on storage.objects;
    create policy "storage_menu_images_update_manager" on storage.objects
      for update to authenticated
      using (bucket_id = 'menu-images'
        and public.can_edit_restaurant_content(public.try_uuid((storage.foldername(name))[1])))
      with check (bucket_id = 'menu-images'
        and public.can_edit_restaurant_content(public.try_uuid((storage.foldername(name))[1])));

    drop policy if exists "storage_menu_images_delete_manager" on storage.objects;
    create policy "storage_menu_images_delete_manager" on storage.objects
      for delete to authenticated
      using (bucket_id = 'menu-images'
        and public.can_edit_restaurant_content(public.try_uuid((storage.foldername(name))[1])));
  end if;
end;
$$;

-- =====================================================================
-- 4. GN-18 · Borrar una cuenta ya no queda bloqueado
-- =====================================================================
-- created_by pasa a ser un dato histórico: si la cuenta se borra, queda
-- en NULL. La propiedad real ya vive en restaurant_members (Fase 2).
alter table public.restaurants alter column created_by drop not null;
alter table public.restaurants drop constraint if exists restaurants_created_by_fkey;
alter table public.restaurants
  add constraint restaurants_created_by_fkey
  foreign key (created_by) references public.profiles (id) on delete set null;

alter table public.gastro_routes alter column created_by drop not null;
alter table public.gastro_routes drop constraint if exists gastro_routes_created_by_fkey;
alter table public.gastro_routes
  add constraint gastro_routes_created_by_fkey
  foreign key (created_by) references public.profiles (id) on delete set null;

-- Una ruta guardada por un usuario ya no impide borrar un restaurante:
-- la parada se elimina con él.
alter table public.user_generated_route_stops
  drop constraint if exists user_generated_route_stops_restaurant_id_fkey;
alter table public.user_generated_route_stops
  add constraint user_generated_route_stops_restaurant_id_fkey
  foreign key (restaurant_id) references public.restaurants (id) on delete cascade;

-- =====================================================================
-- 5. GN-13 · Límites contra abuso
-- =====================================================================
create or replace function public.limit_user_writes()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_count integer;
begin
  if v_uid is null or public.is_admin() then
    return new;
  end if;

  if tg_table_name = 'reservations' then
    select count(*)::integer into v_count
    from public.reservations r
    where r.user_id = new.user_id
      and r.status in ('pending', 'confirmed')
      and r.reserved_for >= now();

    if v_count >= 5 then
      raise exception 'Tienes demasiadas reservaciones activas. Cancela o completa alguna antes de crear otra.';
    end if;

    select count(*)::integer into v_count
    from public.reservations r
    where r.user_id = new.user_id
      and r.restaurant_id = new.restaurant_id
      and r.status in ('pending', 'confirmed')
      and r.reserved_for >= now();

    if v_count >= 2 then
      raise exception 'Ya tienes reservaciones activas en este restaurante.';
    end if;

  elsif tg_table_name = 'restaurants' then
    select count(*)::integer into v_count
    from public.restaurants r
    where r.created_by = v_uid
      and r.status in ('draft', 'pending');

    if v_count >= 3 then
      raise exception 'Ya tienes 3 solicitudes de restaurante en revisión. Espera a que se resuelvan.';
    end if;

  elsif tg_table_name = 'reports' then
    select count(*)::integer into v_count
    from public.reports r
    where r.reporter_id = v_uid
      and r.created_at > now() - interval '24 hours';

    if v_count >= 10 then
      raise exception 'Alcanzaste el límite de reportes por día.';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists limit_user_writes on public.reservations;
create trigger limit_user_writes
  before insert on public.reservations
  for each row execute function public.limit_user_writes();

drop trigger if exists limit_user_writes on public.restaurants;
create trigger limit_user_writes
  before insert on public.restaurants
  for each row execute function public.limit_user_writes();

drop trigger if exists limit_user_writes on public.reports;
create trigger limit_user_writes
  before insert on public.reports
  for each row execute function public.limit_user_writes();

-- =====================================================================
-- 6. GN-15 · Sin imágenes de dominios externos desde la app
-- =====================================================================
-- Las imágenes de usuarios y dueños deben subirse a Storage.
-- Las URLs externas ya guardadas (p. ej. Unsplash de demostración) se
-- conservan mientras no se modifiquen; solo un admin puede fijar nuevas.
create or replace function public.guard_external_image_url()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (select auth.uid()) is null or public.is_admin() then
    return new;
  end if;

  if tg_table_name = 'profiles' then
    if new.avatar_path is distinct from old.avatar_path
       and new.avatar_path ~* '^[a-z][a-z0-9+.-]*:'
    then
      raise exception 'La foto de perfil debe subirse a GastroNic Tour.';
    end if;
  elsif new.external_url is not null
        and (tg_op = 'INSERT' or new.external_url is distinct from old.external_url)
  then
    raise exception 'Solo se permiten imágenes subidas a GastroNic Tour.';
  end if;

  return new;
end;
$$;

drop trigger if exists guard_external_image_url on public.restaurant_images;
create trigger guard_external_image_url
  before insert or update on public.restaurant_images
  for each row execute function public.guard_external_image_url();

drop trigger if exists guard_external_image_url on public.menu_items;
create trigger guard_external_image_url
  before insert or update on public.menu_items
  for each row execute function public.guard_external_image_url();

drop trigger if exists guard_external_image_url on public.review_images;
create trigger guard_external_image_url
  before insert or update on public.review_images
  for each row execute function public.guard_external_image_url();

drop trigger if exists guard_external_image_url on public.profiles;
create trigger guard_external_image_url
  before update on public.profiles
  for each row execute function public.guard_external_image_url();

-- =====================================================================
-- 7. GN-19 · Rutas generadas: políticas solo para usuarios con sesión
--    y validación de paradas
-- =====================================================================
alter policy "read own generated routes" on public.user_generated_routes
  to authenticated using ((select auth.uid()) = user_id);
alter policy "insert own generated routes" on public.user_generated_routes
  to authenticated with check ((select auth.uid()) = user_id);
alter policy "update own generated routes" on public.user_generated_routes
  to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
alter policy "delete own generated routes" on public.user_generated_routes
  to authenticated using ((select auth.uid()) = user_id);

alter policy "read own generated route stops" on public.user_generated_route_stops
  to authenticated using (exists (
    select 1 from public.user_generated_routes ugr
    where ugr.id = user_generated_route_stops.generated_route_id
      and ugr.user_id = (select auth.uid())));
alter policy "insert own generated route stops" on public.user_generated_route_stops
  to authenticated with check (exists (
    select 1 from public.user_generated_routes ugr
    where ugr.id = user_generated_route_stops.generated_route_id
      and ugr.user_id = (select auth.uid())));
alter policy "update own generated route stops" on public.user_generated_route_stops
  to authenticated
  using (exists (
    select 1 from public.user_generated_routes ugr
    where ugr.id = user_generated_route_stops.generated_route_id
      and ugr.user_id = (select auth.uid())))
  with check (exists (
    select 1 from public.user_generated_routes ugr
    where ugr.id = user_generated_route_stops.generated_route_id
      and ugr.user_id = (select auth.uid())));
alter policy "delete own generated route stops" on public.user_generated_route_stops
  to authenticated using (exists (
    select 1 from public.user_generated_routes ugr
    where ugr.id = user_generated_route_stops.generated_route_id
      and ugr.user_id = (select auth.uid())));

create or replace function public.validate_generated_route_stop()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_owner uuid;
begin
  if (select auth.uid()) is null or public.is_admin() then
    return new;
  end if;

  select ugr.user_id into v_owner
  from public.user_generated_routes ugr
  where ugr.id = new.generated_route_id;

  if tg_op = 'INSERT' or new.restaurant_id is distinct from old.restaurant_id then
    if not exists (
      select 1 from public.restaurants r
      where r.id = new.restaurant_id and r.status = 'approved'
    ) then
      raise exception 'Cada parada debe ser un restaurante publicado.';
    end if;
  end if;

  if new.visit_id is not null
     and (tg_op = 'INSERT' or new.visit_id is distinct from old.visit_id)
  then
    if not exists (
      select 1 from public.visits v
      where v.id = new.visit_id
        and v.user_id = v_owner
        and v.restaurant_id = new.restaurant_id
        and v.verification_status = 'verified'
    ) then
      raise exception 'La visita indicada no corresponde a esta parada.';
    end if;
  end if;

  if new.completed_at is not null and new.visit_id is null then
    raise exception 'Una parada solo se completa con una visita verificada.';
  end if;

  return new;
end;
$$;

drop trigger if exists validate_generated_route_stop on public.user_generated_route_stops;
create trigger validate_generated_route_stop
  before insert or update on public.user_generated_route_stops
  for each row execute function public.validate_generated_route_stop();

commit;

-- =====================================================================
-- VERIFICACIÓN (solo lectura)
-- =====================================================================
-- V1. Sin sesión ya no se listan todos los usuarios: en la app, abre la
--     ficha de un restaurante con reseñas sin iniciar sesión; los nombres
--     de los autores deben seguir viéndose.
--
-- V2. Políticas nuevas presentes (debe devolver 4):
-- select count(*) from pg_policies
-- where schemaname = 'public'
--   and policyname in ('profiles_read_visible', 'user_stats_read_own',
--                      'user_badges_read_own', 'review_reactions_read_own');
--
-- V3. Claves foráneas que ya no bloquean (debe devolver 0):
-- select count(*) from pg_constraint
-- where contype = 'f' and confdeltype = 'r'
--   and conname in ('restaurants_created_by_fkey', 'gastro_routes_created_by_fkey',
--                   'user_generated_route_stops_restaurant_id_fkey');
-- =====================================================================
