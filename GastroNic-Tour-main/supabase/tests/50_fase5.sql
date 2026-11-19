create or replace function pg_temp.r(label text, ok boolean) returns text language sql as
$$ select case when ok then 'OK     ' else 'FALLO  ' end || label $$;
\set R '60000000-0000-4000-8000-000000000001'
select pg_temp.r('GN-28 URL legada normalizada a https y restricción validada', (select website_url = 'https://www.legado.com.ni' from public.restaurants where id = :'R') and (select convalidated from pg_constraint where conname = 'restaurants_urls_http_check'));
select pg_temp.r('GN-28 máximo de personas ajustado de 80 a 50', (select reservation_max_party_size = 50 from public.restaurants where id = :'R'));
-- Horarios: viernes (5) 18:00-02:00; sábado 2026-11-21 especial 10:00-20:00; domingo (0) 24 h; lunes (1) 08-22
insert into public.restaurant_hours (restaurant_id, day_of_week, opens_at, closes_at, is_closed) values
 (:'R', 5, '18:00', '02:00', false), (:'R', 0, '00:00', '00:00', false), (:'R', 1, '08:00', '22:00', false);
insert into public.restaurant_special_hours (restaurant_id, special_date, opens_at, closes_at, is_closed) values
 (:'R', '2026-11-21', '10:00', '20:00', false), (:'R', '2026-11-30', null, null, true);
select pg_temp.r('GN-29 sábado 01:00 (tramo del viernes) con especial hoy: ABIERTO', public.is_restaurant_open_at(:'R', '2026-11-21 01:00 America/Managua'));
select pg_temp.r('GN-29 sábado 03:00: cerrado', not public.is_restaurant_open_at(:'R', '2026-11-21 03:00 America/Managua'));
select pg_temp.r('GN-29 sábado 12:00 (especial 10-20): abierto', public.is_restaurant_open_at(:'R', '2026-11-21 12:00 America/Managua'));
select pg_temp.r('GN-29 domingo 15:00 (24 h): ABIERTO', public.is_restaurant_open_at(:'R', '2026-11-22 15:00 America/Managua'));
select pg_temp.r('GN-29 lunes 23:00 (08-22): cerrado', not public.is_restaurant_open_at(:'R', '2026-11-23 23:00 America/Managua'));
select pg_temp.r('GN-29 lunes 30 especial cerrado 12:00: cerrado', not public.is_restaurant_open_at(:'R', '2026-11-30 12:00 America/Managua'));
select pg_temp.r('GN-29 viernes 20:00: abierto', public.is_restaurant_open_at(:'R', '2026-11-20 20:00 America/Managua'));
-- GN-26
select pg_temp.r('GN-26 open_status limita a 200 IDs', (select count(*) = 200 from public.get_restaurants_open_status(array(select gen_random_uuid() from generate_series(1,500)))));
-- GN-22 auditoría
select count(*) as a0 from public.audit_logs where table_name = 'restaurants' \gset
update public.restaurants set favorites_count = favorites_count + 1 where id = :'R';
select count(*) as a1 from public.audit_logs where table_name = 'restaurants' \gset
update public.restaurants set short_description = 'cambio real' where id = :'R';
select count(*) as a2 from public.audit_logs where table_name = 'restaurants' \gset
select pg_temp.r('GN-22 cambio de contador NO audita; cambio real SÍ, sin search_document', :a1 = :a0 and :a2 = :a0 + 1 and not exists (select 1 from public.audit_logs where new_data ? 'search_document' and created_at > now() - interval '1 minute'));
-- GN-28 columnas del servidor en reservas
insert into auth.users (id, email, raw_user_meta_data) values ('00000000-0000-4000-8000-0000000000c1','c@x','{"full_name":"C"}');
update public.restaurants set accepts_reservations = true where id = :'R';
begin; set local role authenticated; select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000c1', true);
insert into public.reservations (user_id, restaurant_id, guest_name, guest_phone, reserved_for, party_size, restaurant_notes, cancellation_reason)
 values ('00000000-0000-4000-8000-0000000000c1', :'R', 'C', '1', now() + interval '2 days', 2, 'VIP aprobado', 'x');
commit;
select pg_temp.r('GN-28 el cliente no puede fijar notas del restaurante ni motivo de cancelación', (select restaurant_notes is null and cancellation_reason is null from public.reservations where restaurant_id = :'R'));
