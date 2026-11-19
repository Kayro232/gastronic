-- =====================================================================
-- GastroNic Tour · REVERSIÓN de la FASE 1 (solo si algo dejó de funcionar)
-- Restaura los permisos y políticas exactamente como estaban antes.
-- Vuelve a abrir las vulnerabilidades GN-01, GN-03, GN-04, GN-07, GN-09 y GN-27:
-- úsalo solo como medida temporal y avisa qué pantalla falló.
-- =====================================================================

begin;

alter default privileges for role postgres in schema public
  grant all on functions to anon, authenticated;
alter default privileges for role postgres in schema public
  grant all on tables to anon;
alter default privileges for role postgres in schema public
  grant all on sequences to anon;

grant truncate, references, trigger
  on all tables in schema public
  to anon, authenticated;

grant execute on all functions in schema public to anon, authenticated;

drop policy if exists "restaurants_delete_owner" on public.restaurants;
create policy "restaurants_delete_owner" on public.restaurants
  for delete to authenticated
  using (public.is_restaurant_owner(id));

drop policy if exists "restaurants_create_authenticated" on public.restaurants;
create policy "restaurants_create_authenticated" on public.restaurants
  for insert to authenticated
  with check (
    created_by = (select auth.uid())
    and status = any (array['draft', 'pending'])
    and is_verified = false
    and is_featured = false
  );

drop policy if exists "visits_create_own" on public.visits;
create policy "visits_create_own" on public.visits
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and verification_status = 'pending'
  );

drop policy if exists "visits_verify_manager" on public.visits;
create policy "visits_verify_manager" on public.visits
  for update to authenticated
  using (public.can_manage_restaurant(restaurant_id))
  with check (public.can_manage_restaurant(restaurant_id));

drop policy if exists "favorites_delete_own" on public.favorites;
create policy "favorites_delete_own" on public.favorites
  for delete to authenticated
  using (user_id = auth.uid());

drop policy if exists "favorites_select_own" on public.favorites;
create policy "favorites_select_own" on public.favorites
  for select to authenticated
  using (user_id = auth.uid());

commit;
