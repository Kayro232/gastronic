-- =====================================================================
-- GastroNic Tour · Remediación · FASE 1: Contención de permisos
-- =====================================================================
-- Corrige:  GN-07 (privilegios por defecto), GN-09 (check_user_badges),
--           GN-27 (TRUNCATE/TRIGGER/REFERENCES para anon)
-- Cierra las vías directas que la app NO usa:
--           GN-01 (DELETE directo de restaurants)
--           GN-03 (crear/verificar visitas desde el cliente)
--           GN-04 (INSERT directo de restaurants con contadores falsos)
--
-- Impacto en la app: ninguno esperado. Se verificó en el código que:
--   * los restaurantes se crean solo con create_restaurant_request (RPC);
--   * se borran solo vía /api/owner/restaurants/[id] -> delete_owned_restaurant (RPC);
--   * el frontend nunca inserta ni actualiza "visits";
--   * todas las RPC que llama la app se vuelven a conceder abajo.
--
-- Cómo ejecutar: pegar TODO el archivo en el SQL Editor y ejecutar.
-- Es una sola transacción: si algo falla, no se aplica nada.
-- Es idempotente: se puede ejecutar más de una vez.
-- Reversión: supabase/rollbacks/20261117000100_fase1_contencion_permisos.rollback.sql
-- =====================================================================

begin;

-- ---------------------------------------------------------------------
-- 1. Privilegios por defecto para objetos FUTUROS (GN-07)
--    Desde ahora, cada función o tabla nueva nace cerrada y hay que
--    conceder permisos de forma explícita.
-- ---------------------------------------------------------------------
alter default privileges for role postgres in schema public
  revoke execute on functions from public, anon, authenticated;

alter default privileges for role postgres in schema public
  revoke all on tables from anon;

alter default privileges for role postgres in schema public
  revoke all on sequences from anon;

-- ---------------------------------------------------------------------
-- 2. Privilegios innecesarios sobre tablas existentes (GN-27)
--    RLS no aplica a TRUNCATE; ningún cliente necesita estos permisos.
-- ---------------------------------------------------------------------
revoke truncate, references, trigger
  on all tables in schema public
  from anon, authenticated;

-- ---------------------------------------------------------------------
-- 3. Funciones: cerrar todo y reabrir solo lo necesario (GN-07, GN-09)
--    Las funciones internas (triggers, refresh_*, sync_*, check_user_badges,
--    update_reservation_status, etc.) quedan solo para postgres/service_role.
--    Los triggers siguen funcionando: PostgreSQL no comprueba EXECUTE
--    al disparar un trigger.
-- ---------------------------------------------------------------------
revoke execute on all functions in schema public
  from public, anon, authenticated;

-- 3a. Helpers que usan las políticas RLS evaluadas como anon y authenticated.
--     Si se quitaran, las lecturas públicas fallarían con "permission denied".
grant execute on function public.is_admin()                        to anon, authenticated;
grant execute on function public.can_manage_restaurant(uuid)       to anon, authenticated;
grant execute on function public.is_restaurant_public(uuid)        to anon, authenticated;
grant execute on function public.is_route_public(uuid)             to anon, authenticated;

-- 3b. Lecturas públicas que la app llama sin sesión.
grant execute on function public.get_map_restaurants()                                   to anon, authenticated;
grant execute on function public.get_map_restaurants_v2(integer)                         to anon, authenticated;
grant execute on function public.get_restaurants_nearby(double precision, double precision) to anon, authenticated;
grant execute on function public.nearby_restaurants(double precision, double precision, integer, integer) to anon, authenticated;
grant execute on function public.get_restaurants_open_status(uuid[])                     to anon, authenticated;
grant execute on function public.is_restaurant_open_now(uuid)                            to anon, authenticated;
grant execute on function public.is_restaurant_open_at(uuid, timestamp with time zone)   to anon, authenticated;
grant execute on function public.search_restaurants_global(text, integer)                to anon, authenticated;
grant execute on function public.get_personalized_restaurants_v2(double precision, double precision, integer) to anon, authenticated;
grant execute on function public.get_smart_route_candidates_v1(integer, smallint, integer, timestamp with time zone, numeric, boolean, integer) to anon, authenticated;

-- 3c. Helpers usados por triggers SECURITY INVOKER y por políticas de Storage
--     (se ejecutan con el rol del usuario autenticado).
grant execute on function public.is_restaurant_owner(uuid)       to authenticated;
grant execute on function public.can_complete_user_route(uuid)   to authenticated;
grant execute on function public.try_uuid(text)                  to authenticated;
grant execute on function public.current_user_role()             to authenticated;
grant execute on function public.restaurant_member_role(uuid)    to authenticated;

-- 3d. RPC de negocio y administración: SOLO usuarios con sesión.
--     Cada una valida internamente auth.uid(), is_admin() o membresía.
grant execute on function public.approve_restaurant(uuid)                         to authenticated;
grant execute on function public.reject_restaurant(uuid, text)                    to authenticated;
grant execute on function public.set_restaurant_featured(uuid, boolean)           to authenticated;
grant execute on function public.set_restaurant_verified(uuid, boolean)           to authenticated;
grant execute on function public.create_restaurant_request(jsonb)                 to authenticated;
grant execute on function public.delete_owned_restaurant(uuid)                    to authenticated;
grant execute on function public.set_owned_restaurant_reservations(uuid, boolean) to authenticated;
grant execute on function public.set_restaurant_cover(uuid, uuid)                 to authenticated;
grant execute on function public.cancel_reservation(uuid, text)                   to authenticated;
grant execute on function public.manage_reservation_status(uuid, text, text)      to authenticated;
grant execute on function public.update_reservation_notes(uuid, text)             to authenticated;
grant execute on function public.reply_to_review(uuid, text)                      to authenticated;
grant execute on function public.delete_review_reply(uuid)                        to authenticated;
grant execute on function public.mark_notification_read(uuid)                     to authenticated;
grant execute on function public.mark_all_business_notifications_read()          to authenticated;
grant execute on function public.update_owner_settings(text, text, text, text, text, text, boolean, boolean, boolean, boolean) to authenticated;

-- ---------------------------------------------------------------------
-- 4. Políticas peligrosas que la app no usa
-- ---------------------------------------------------------------------

-- GN-01: el DELETE directo saltaba la protección de reservas activas
--        y la limpieza de Storage. El borrado sigue funcionando por la RPC.
drop policy if exists "restaurants_delete_owner" on public.restaurants;

-- GN-04: el INSERT directo permitía enviar rating y contadores falsos.
--        La creación sigue funcionando por create_restaurant_request.
drop policy if exists "restaurants_create_authenticated" on public.restaurants;

-- GN-03: cualquier usuario podía crear visitas en su propio restaurante
--        y verificarlas para ganar puntos sin límite. Las visitas
--        verificadas siguen naciendo de las reservas completadas.
drop policy if exists "visits_create_own" on public.visits;
drop policy if exists "visits_verify_manager" on public.visits;

-- GN-20: políticas duplicadas de favoritos (quedan las versiones con
--        (select auth.uid()), que son las eficientes).
drop policy if exists "favorites_delete_own" on public.favorites;
drop policy if exists "favorites_select_own" on public.favorites;

commit;

-- =====================================================================
-- VERIFICACIÓN (ejecutar después, solo lectura)
-- =====================================================================
-- V1. Funciones que anon puede ejecutar: deben ser solo las 14 de 3a y 3b.
-- select p.proname
-- from pg_proc p
-- where p.pronamespace = 'public'::regnamespace
--   and has_function_privilege('anon', p.oid, 'EXECUTE')
-- order by 1;
--
-- V2. Las políticas eliminadas ya no existen (debe devolver 0 filas).
-- select tablename, policyname from pg_policies
-- where schemaname = 'public'
--   and policyname in ('restaurants_delete_owner', 'restaurants_create_authenticated',
--                      'visits_create_own', 'visits_verify_manager',
--                      'favorites_delete_own', 'favorites_select_own');
--
-- V3. Prueba manual en la app, con y sin sesión:
--     mapa, búsqueda, ficha de restaurante, favoritos, crear reserva,
--     panel del dueño (reservas, reseñas, menú, imágenes), panel admin
--     (aprobar, destacar, verificar), crear solicitud de restaurante.
-- =====================================================================
