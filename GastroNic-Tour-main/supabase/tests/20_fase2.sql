\set ADMIN '00000000-0000-4000-8000-00000000000a'
\set OWNER '00000000-0000-4000-8000-00000000000b'
\set USR   '00000000-0000-4000-8000-00000000000c'
\set NEWOWNER '00000000-0000-4000-8000-00000000000e'
create or replace function pg_temp.r(label text, ok boolean) returns text language sql as
$$ select case when ok then 'OK     ' else 'FALLO  ' end || label $$;
insert into public.departments (id, name, slug) values (1, 'Managua', 'managua') on conflict do nothing;
insert into public.municipalities (id, department_id, name, slug) values (1, 1, 'Managua', 'managua') on conflict do nothing;
insert into public.categories (id, name, slug) values (1, 'Nica', 'nica') on conflict do nothing;
insert into public.badges (slug, name, points_required) values ('b10', 'Diez', 10);

-- GN-16/08: altas con metadatos malos
insert into auth.users (id, email, raw_user_meta_data) values (:'ADMIN','a@x','{"full_name":"A","username":"admin1"}');
insert into public.user_roles (user_id, role) values (:'ADMIN','admin');
insert into auth.users (id, email, raw_user_meta_data) values (:'OWNER','o@x','{}');
insert into auth.users (id, email, raw_user_meta_data) values (:'USR','u@x','{"full_name":"U","username":"ADMIN1"}');
insert into auth.users (id, email, raw_user_meta_data) values (:'NEWOWNER','n@x','{"full_name":"N","username":"a"}');
select pg_temp.r('GN-16 alta sin full_name, con username tomado y con username inválido', (select count(*) = 4 from public.profiles));
select pg_temp.r('GN-08 todos con user_stats y user_settings', (select count(*) = 4 from public.user_stats) and (select count(*) = 4 from public.user_settings));

-- restaurante del OWNER, aprobado, con reservas
begin; set local role authenticated; select set_config('request.jwt.claim.sub', :'OWNER', true);
select public.create_restaurant_request('{"name":"Casa Prueba","address":"x","municipality_id":1,"category_ids":[1],"website_url":"www.casaprueba.com.ni"}'::jsonb) as rid \gset
commit;
select pg_temp.r('GN-06 URL sin esquema se normaliza a https', (select website_url = 'https://www.casaprueba.com.ni' from public.restaurants where id = :'rid'));
begin; set local role authenticated; select set_config('request.jwt.claim.sub', :'ADMIN', true);
select public.approve_restaurant(:'rid'); select public.set_restaurant_verified(:'rid', true); commit;
begin; set local role authenticated; select set_config('request.jwt.claim.sub', :'OWNER', true);
select public.set_owned_restaurant_reservations(:'rid', true); commit;

-- GN-02: transferencia a NEWOWNER
insert into public.restaurant_members (restaurant_id, user_id, role) values (:'rid', :'NEWOWNER', 'owner');
delete from public.restaurant_members where restaurant_id = :'rid' and user_id = :'OWNER';
begin; set local role authenticated; select set_config('request.jwt.claim.sub', :'USR', true);
insert into public.reservations (user_id, restaurant_id, guest_name, guest_phone, reserved_for, party_size)
 values (:'USR', :'rid', 'Cliente Privado', '8888', now() + interval '2 days', 2);
commit;
select pg_temp.r('GN-02 la notificación va al owner actual y no al creador removido',
  exists (select 1 from public.notifications where type='business_reservation' and user_id = :'NEWOWNER')
  and not exists (select 1 from public.notifications where type='business_reservation' and user_id = :'OWNER'));
\set ON_ERROR_STOP 0
begin; set local role authenticated; select set_config('request.jwt.claim.sub', :'OWNER', true);
select public.set_owned_restaurant_reservations(:'rid', false);
rollback;
\set ON_ERROR_STOP 1
select pg_temp.r('GN-02 el creador removido ya NO puede cambiar reservas (error arriba)', (select accepts_reservations from public.restaurants where id = :'rid'));
begin; set local role authenticated; select set_config('request.jwt.claim.sub', :'NEWOWNER', true);
select public.set_owned_restaurant_reservations(:'rid', true); commit;
select pg_temp.r('GN-02 el owner actual SÍ puede cambiar reservas', true);

-- GN-06: cambio de nombre retira la verificación; javascript: rechazado
begin; set local role authenticated; select set_config('request.jwt.claim.sub', :'NEWOWNER', true);
update public.restaurants set short_description = 'solo descripción' where id = :'rid'; commit;
select pg_temp.r('GN-06 editar la descripción NO retira la verificación', (select is_verified from public.restaurants where id = :'rid'));
begin; set local role authenticated; select set_config('request.jwt.claim.sub', :'NEWOWNER', true);
update public.restaurants set name = 'Otro Nombre' where id = :'rid'; commit;
select pg_temp.r('GN-06 cambiar el nombre SÍ retira la verificación', (select not is_verified from public.restaurants where id = :'rid'));
\set ON_ERROR_STOP 0
begin; set local role authenticated; select set_config('request.jwt.claim.sub', :'NEWOWNER', true);
update public.restaurants set website_url = 'javascript:alert(1)' where id = :'rid'; rollback;
\set ON_ERROR_STOP 1
select pg_temp.r('GN-06 javascript: rechazado (error arriba)', (select website_url like 'https://%' from public.restaurants where id = :'rid'));

-- GN-05: el owner actual no puede reseñar su restaurante; el cliente sí
\set ON_ERROR_STOP 0
begin; set local role authenticated; select set_config('request.jwt.claim.sub', :'NEWOWNER', true);
insert into public.reviews (restaurant_id, user_id, rating, comment) values (:'rid', :'NEWOWNER', 5, 'Somos los mejores'); rollback;
\set ON_ERROR_STOP 1
begin; set local role authenticated; select set_config('request.jwt.claim.sub', :'USR', true);
insert into public.reviews (restaurant_id, user_id, rating, comment) values (:'rid', :'USR', 4, 'Bueno sin visita') returning id as rev \gset
commit;
select pg_temp.r('GN-05 owner no puede auto-reseñarse (error arriba), cliente sí', (select count(*) = 1 from public.reviews where restaurant_id = :'rid'));
select pg_temp.r('GN-17 reseña SIN visita verificada no da puntos', not exists (select 1 from public.point_transactions where source_type='review' and source_id = :'rev'));

-- Reserva completada => visita verificada => puntos de visita y de reseña
set session_replication_role = replica; update public.reservations set reserved_for = now() - interval '1 hour' where restaurant_id = :'rid'; set session_replication_role = origin;
begin; set local role authenticated; select set_config('request.jwt.claim.sub', :'NEWOWNER', true);
select public.manage_reservation_status(id, 'confirmed', null) from public.reservations where restaurant_id = :'rid';
select public.manage_reservation_status(id, 'completed', null) from public.reservations where restaurant_id = :'rid';
commit;
select pg_temp.r('Reserva completada da 10 puntos de visita', (select coalesce(sum(amount),0) = 10 from public.point_transactions where user_id = :'USR' and source_type='visit'));
select pg_temp.r('GN-17 la reseña pasa a verificada y ahora SÍ da 20 puntos', exists (select 1 from public.point_transactions where source_type='review' and source_id = :'rev'));
select pg_temp.r('GN-08 user_stats refleja 30 puntos e insignia', (select points = 30 from public.user_stats where user_id = :'USR') and exists (select 1 from public.user_badges where user_id = :'USR'));

-- GN-17: ocultar la reseña retira sus puntos
update public.reviews set status = 'hidden' where id = :'rev';
select pg_temp.r('GN-17 ocultar la reseña retira los 20 puntos', (select points = 10 from public.user_stats where user_id = :'USR'));

-- GN-03 residual: segunda visita el mismo día no suma
insert into public.visits (user_id, restaurant_id, verification_status, verification_method, visited_at)
values (:'USR', :'rid', 'verified', 'manual', now());
select pg_temp.r('GN-03 segunda visita del mismo día no da puntos', (select points = 10 from public.user_stats where user_id = :'USR'));

-- GN-38: el owner puede borrar su restaurante (sin reservas activas)
begin; set local role authenticated; select set_config('request.jwt.claim.sub', :'NEWOWNER', true);
select public.delete_owned_restaurant(:'rid'); commit;
select pg_temp.r('GN-38 el owner borra su restaurante por la RPC', not exists (select 1 from public.restaurants where id = :'rid'));
