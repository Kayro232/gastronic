\set ADMIN '00000000-0000-4000-8000-00000000000a'
\set OWNER '00000000-0000-4000-8000-00000000000b'
\set USR   '00000000-0000-4000-8000-00000000000c'
\set PRIV '00000000-0000-4000-8000-00000000000f'
create or replace function pg_temp.r(label text, ok boolean) returns text language sql as
$$ select case when ok then 'OK     ' else 'FALLO  ' end || label $$;
insert into public.departments (id, name, slug) values (1, 'Managua', 'managua');
insert into public.municipalities (id, department_id, name, slug) values (1, 1, 'Managua', 'managua');
insert into public.categories (id, name, slug) values (1, 'Nica', 'nica');
insert into auth.users (id, email, raw_user_meta_data) values
 (:'ADMIN','a@x','{"full_name":"Admin","username":"admin1"}'),(:'OWNER','o@x','{"full_name":"Owner"}'),
 (:'USR','u@x','{"full_name":"Reseñador"}'),(:'PRIV','q@x','{"full_name":"Persona Privada"}');
insert into public.user_roles (user_id, role) values (:'ADMIN','admin');

begin; set local role authenticated; select set_config('request.jwt.claim.sub', :'OWNER', true);
select public.create_restaurant_request('{"name":"Casa Tres","address":"x","municipality_id":1,"category_ids":[1]}'::jsonb) as rid \gset
commit;
begin; set local role authenticated; select set_config('request.jwt.claim.sub', :'ADMIN', true);
select public.approve_restaurant(:'rid'); commit;
update public.restaurants set accepts_reservations = true where id = :'rid';
begin; set local role authenticated; select set_config('request.jwt.claim.sub', :'USR', true);
insert into public.reviews (restaurant_id, user_id, rating, comment) values (:'rid', :'USR', 4, 'Buena comida'); commit;

-- GN-12
begin; set local role anon; select set_config('request.jwt.claim.sub', '', true);
select string_agg(full_name, ',' order by full_name) as visibles from public.profiles \gset
select count(*) as stats_anon from public.user_stats \gset
select public.is_username_available('admin1') as tomado, public.is_username_available('nuevo.user') as libre \gset
commit;
select pg_temp.r('GN-12 sin sesión solo se ve al autor de reseñas: ' || :'visibles', :'visibles' = 'Reseñador');
select pg_temp.r('GN-12 sin sesión no se leen puntos de nadie', :stats_anon = 0);
select pg_temp.r('GN-12 is_username_available responde sin exponer perfiles', not :'tomado'::boolean and :'libre'::boolean);
begin; set local role authenticated; select set_config('request.jwt.claim.sub', :'OWNER', true);
select count(*) as owner_ve from public.profiles where id = :'USR' \gset
select count(*) as owner_ve_quiet from public.profiles where id = :'PRIV' \gset
commit;
select pg_temp.r('GN-12 el dueño ve a quien reseñó su restaurante, no a otros', :owner_ve = 1 and :owner_ve_quiet = 0);

-- GN-14
update public.user_settings set personalization_enabled = false where user_id = :'PRIV';
begin; set local role authenticated; select set_config('request.jwt.claim.sub', :'PRIV', true);
insert into public.user_activity_events (user_id, event_type, source, restaurant_id) values (:'PRIV', 'restaurant_view', 'web', :'rid'); commit;
begin; set local role authenticated; select set_config('request.jwt.claim.sub', :'USR', true);
insert into public.user_activity_events (user_id, event_type, source, restaurant_id) values (:'USR', 'restaurant_view', 'web', :'rid'); commit;
select pg_temp.r('GN-14 sin personalización el evento se descarta sin error; con ella se guarda',
  (select count(*) from public.user_activity_events where user_id = :'PRIV') = 0
  and (select count(*) from public.user_activity_events where user_id = :'USR') = 1);

-- GN-13 límite de reservas en un restaurante
\set ON_ERROR_STOP 0
begin; set local role authenticated; select set_config('request.jwt.claim.sub', :'USR', true);
insert into public.reservations (user_id, restaurant_id, guest_name, guest_phone, reserved_for, party_size) values (:'USR', :'rid', 'U', '1', now() + interval '2 days', 2);
insert into public.reservations (user_id, restaurant_id, guest_name, guest_phone, reserved_for, party_size) values (:'USR', :'rid', 'U', '1', now() + interval '3 days', 2);
commit;
begin; set local role authenticated; select set_config('request.jwt.claim.sub', :'USR', true);
insert into public.reservations (user_id, restaurant_id, guest_name, guest_phone, reserved_for, party_size) values (:'USR', :'rid', 'U', '1', now() + interval '4 days', 2);
commit;
\set ON_ERROR_STOP 1
select pg_temp.r('GN-13 la 3.ª reserva activa en el mismo restaurante se rechaza (error arriba)', (select count(*) = 2 from public.reservations where user_id = :'USR'));

-- GN-15 imágenes externas
\set ON_ERROR_STOP 0
begin; set local role authenticated; select set_config('request.jwt.claim.sub', :'OWNER', true);
insert into public.restaurant_images (restaurant_id, kind, external_url) values (:'rid', 'gallery', 'https://tracker.example/x.png'); commit;
\set ON_ERROR_STOP 1
insert into public.restaurant_images (restaurant_id, kind, external_url, alt_text) values (:'rid', 'gallery', 'https://images.unsplash.com/demo', 'demo') returning id as img \gset
begin; set local role authenticated; select set_config('request.jwt.claim.sub', :'OWNER', true);
update public.restaurant_images set alt_text = 'nuevo texto' where id = :'img'; commit;
select pg_temp.r('GN-15 el dueño no puede añadir URL externa (error arriba), pero sí editar una imagen existente',
  (select alt_text = 'nuevo texto' from public.restaurant_images where id = :'img')
  and (select count(*) = 1 from public.restaurant_images where restaurant_id = :'rid'));

-- GN-10 suspensión y reenvío
begin; set local role authenticated; select set_config('request.jwt.claim.sub', :'ADMIN', true);
update public.restaurants set status = 'suspended' where id = :'rid'; commit;
\set ON_ERROR_STOP 0
begin; set local role authenticated; select set_config('request.jwt.claim.sub', :'OWNER', true);
insert into public.menu_items (restaurant_id, name, price) values (:'rid', 'Gallo pinto', 100); commit;
begin; set local role authenticated; select set_config('request.jwt.claim.sub', :'OWNER', true);
update public.restaurants set short_description = 'intento' where id = :'rid'; commit;
begin; set local role authenticated; select set_config('request.jwt.claim.sub', :'OWNER', true);
insert into storage.objects (bucket_id, name) values ('restaurant-images', :'rid' || '/foto.png'); commit;
\set ON_ERROR_STOP 1
select pg_temp.r('GN-10 suspendido: no puede añadir menú, editar ni subir imágenes (3 errores arriba)',
  (select count(*) = 0 from public.menu_items where restaurant_id = :'rid')
  and (select count(*) = 0 from storage.objects));
update public.restaurants set status = 'rejected' where id = :'rid';
begin; set local role authenticated; select set_config('request.jwt.claim.sub', :'OWNER', true);
select public.resubmit_restaurant(:'rid');
insert into storage.objects (bucket_id, name) values ('restaurant-images', :'rid' || '/foto.png');
commit;
select pg_temp.r('GN-10 rechazado: el dueño lo reenvía a revisión y puede subir imágenes',
  (select status = 'pending' from public.restaurants where id = :'rid') and (select count(*) = 1 from storage.objects));

-- GN-19 rutas generadas
insert into public.restaurants (id, created_by, name, slug, status) values ('30000000-0000-4000-8000-000000000001', :'ADMIN', 'Aprobado R', 'aprobado-r', 'approved');
insert into public.visits (id, user_id, restaurant_id, verification_status, verification_method) values ('40000000-0000-4000-8000-000000000001', :'PRIV', '30000000-0000-4000-8000-000000000001', 'verified', 'manual');
insert into public.user_generated_routes (id, user_id, name, route_mode, party_size, planned_start_at, budget_status)
 values ('20000000-0000-4000-8000-000000000001', :'USR', 'Ruta', 'food', 2, now(), 'not_set');
begin; set local role authenticated; select set_config('request.jwt.claim.sub', :'USR', true);
insert into public.user_generated_route_stops (id, generated_route_id, stop_order, stop_key, label, planned_at, restaurant_id)
 values ('50000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 1, 'a', 'Parada', now(), '30000000-0000-4000-8000-000000000001');
commit;
\set ON_ERROR_STOP 0
begin; set local role authenticated; select set_config('request.jwt.claim.sub', :'USR', true);
update public.user_generated_route_stops set visit_id = '40000000-0000-4000-8000-000000000001', completed_at = now() where id = '50000000-0000-4000-8000-000000000001'; commit;
begin; set local role authenticated; select set_config('request.jwt.claim.sub', :'USR', true);
update public.user_generated_route_stops set completed_at = now() where id = '50000000-0000-4000-8000-000000000001'; commit;
\set ON_ERROR_STOP 1
select pg_temp.r('GN-19 no se completa una parada con visita ajena ni sin visita (2 errores arriba)', (select completed_at is null from public.user_generated_route_stops where id = '50000000-0000-4000-8000-000000000001'));

-- GN-18 borrar la cuenta del creador de un restaurante
delete from auth.users where id = :'OWNER';
select pg_temp.r('GN-18 se puede borrar la cuenta del creador; el restaurante queda con created_by nulo',
  (select created_by is null from public.restaurants where id = :'rid'));
