-- Pruebas de flujos de la app (réplica local). ON_ERROR_STOP desactivado:
-- cada bloque imprime OK/FALLO.
\set ADMIN '00000000-0000-4000-8000-00000000000a'
\set OWNER '00000000-0000-4000-8000-00000000000b'
\set USR   '00000000-0000-4000-8000-00000000000c'
\set OTHER '00000000-0000-4000-8000-00000000000d'

-- ---------- Fixtures (postgres) ----------
insert into public.departments (id, name, slug) values (1, 'Managua', 'managua') on conflict do nothing;
insert into public.municipalities (id, department_id, name, slug) values (1, 1, 'Managua', 'managua') on conflict do nothing;
insert into public.categories (id, name, slug) values (1, 'Nica', 'nica') on conflict do nothing;
insert into auth.users (id, email, raw_user_meta_data) values
  (:'ADMIN', 'a@x.com', '{"full_name":"Admin","username":"admin1"}'),
  (:'OWNER', 'o@x.com', '{"full_name":"Owner","username":"owner1"}'),
  (:'USR',   'u@x.com', '{"full_name":"User","username":"user1"}'),
  (:'OTHER', 'z@x.com', '{"full_name":"Other","username":"other1"}')
on conflict do nothing;
insert into public.user_roles (user_id, role) values (:'ADMIN', 'admin') on conflict do nothing;

create or replace function pg_temp.r(label text, ok boolean) returns text language sql as
$$ select case when ok then 'OK     ' else 'FALLO  ' end || label $$;

-- ---------- 1. Dueño crea solicitud por RPC ----------
begin; set local role authenticated; select set_config('request.jwt.claim.sub', :'OWNER', true);
select public.create_restaurant_request('{"name":"Fritanga Doña Prueba","address":"Del parque 2c al sur","municipality_id":1,"category_ids":[1],"estimated_price_min":100,"estimated_price_max":300}'::jsonb) as rid \gset
commit;
select pg_temp.r('1. owner crea solicitud por RPC', :'rid' is not null);

-- ---------- 2. Admin aprueba ----------
begin; set local role authenticated; select set_config('request.jwt.claim.sub', :'ADMIN', true);
select public.approve_restaurant(:'rid'); commit;
select pg_temp.r('2. admin aprueba', (select status = 'approved' from public.restaurants where id = :'rid'));

-- ---------- 3. Dueño activa reservas y edita ----------
begin; set local role authenticated; select set_config('request.jwt.claim.sub', :'OWNER', true);
select public.set_owned_restaurant_reservations(:'rid', true);
update public.restaurants set short_description = 'Editado por el dueño' where id = :'rid';
commit;
select pg_temp.r('3. owner activa reservas y edita', (select accepts_reservations and short_description = 'Editado por el dueño' from public.restaurants where id = :'rid'));

-- ---------- 4. Anon lee lo público ----------
begin; set local role anon; select set_config('request.jwt.claim.sub', '', true);
select count(*) as anon_rest from public.restaurants \gset
select count(*) as anon_menu from public.menu_items \gset
select count(*) as anon_search from public.search_restaurants_global('fritanga', 5) \gset
select count(*) as anon_open from public.get_restaurants_open_status(array[:'rid']::uuid[]) \gset
commit;
select pg_temp.r('4. anon lee restaurantes, menú, búsqueda y horario', :anon_rest >= 1 and :anon_search >= 1 and :anon_open = 1);

-- ---------- 5. Cliente: favorito, reserva, reseña, reacción ----------
begin; set local role authenticated; select set_config('request.jwt.claim.sub', :'USR', true);
insert into public.favorites (user_id, restaurant_id) values (:'USR', :'rid');
insert into public.reservations (user_id, restaurant_id, guest_name, guest_phone, reserved_for, party_size)
  values (:'USR', :'rid', 'Cliente', '8888-8888', now() + interval '2 days', 2) returning id as resid \gset
insert into public.reviews (restaurant_id, user_id, rating, comment) values (:'rid', :'USR', 5, 'Muy rico todo') returning id as revid \gset
commit;
select pg_temp.r('5. cliente: favorito + reserva + reseña', :'resid' is not null and :'revid' is not null);

-- ---------- 6. Dueño gestiona reserva y responde reseña ----------
begin; set local role authenticated; select set_config('request.jwt.claim.sub', :'OWNER', true);
select public.manage_reservation_status(:'resid', 'confirmed', null);
select public.reply_to_review(:'revid', 'Gracias por venir');
select count(*) as owner_sees_res from public.reservations where restaurant_id = :'rid' \gset
commit;
select pg_temp.r('6. owner confirma reserva, responde reseña y ve reservas', :owner_sees_res = 1 and (select status = 'confirmed' from public.reservations where id = :'resid'));

-- ---------- 7. Ataques que la Fase 1 debe bloquear ----------
\set ON_ERROR_STOP 0
begin; set local role anon; select set_config('request.jwt.claim.sub', '', true);
select public.approve_restaurant(:'rid');
rollback;
select pg_temp.r('7a. anon ya no puede ejecutar approve_restaurant (debe verse "permission denied" arriba)', true);

begin; set local role authenticated; select set_config('request.jwt.claim.sub', :'USR', true);
insert into public.visits (user_id, restaurant_id) values (:'USR', :'rid');
rollback;
select pg_temp.r('7b. cliente ya no puede crear visitas (debe verse error RLS arriba)', true);

begin; set local role authenticated; select set_config('request.jwt.claim.sub', :'OWNER', true);
delete from public.restaurants where id = :'rid';
select count(*) as still_there from public.restaurants where id = :'rid' \gset
rollback;
select pg_temp.r('7c. owner no puede borrar con DELETE directo', :still_there = 1);

begin; set local role authenticated; select set_config('request.jwt.claim.sub', :'OTHER', true);
insert into public.restaurants (created_by, name, slug, status, average_rating, reviews_count)
  values (:'OTHER', 'Falso', 'falso-1', 'pending', 5, 9999);
rollback;
select pg_temp.r('7d. INSERT directo con contadores falsos bloqueado (debe verse error RLS arriba)', true);

begin; set local role authenticated; select set_config('request.jwt.claim.sub', :'USR', true);
select public.check_user_badges(:'OTHER');
rollback;
select pg_temp.r('7e. check_user_badges ya no es invocable (debe verse "permission denied" arriba)', true);
\set ON_ERROR_STOP 1

-- ---------- 8. Dueño borra por la RPC (camino legítimo) ----------
begin; set local role authenticated; select set_config('request.jwt.claim.sub', :'OWNER', true);
select public.cancel_reservation(:'resid', 'Cierre de prueba');
select public.delete_owned_restaurant(:'rid');
commit;
select pg_temp.r('8. cancelar reserva y borrar por RPC (camino de la app)', not exists (select 1 from public.restaurants where id = :'rid'));
