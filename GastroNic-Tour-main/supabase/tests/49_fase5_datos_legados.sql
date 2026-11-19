-- Datos legados (insertados saltando triggers, como en producción antes de las fases)
set session_replication_role = replica;
insert into public.departments (id, name, slug) values (1, 'Managua', 'managua');
insert into public.municipalities (id, department_id, name, slug) values (1, 1, 'Managua', 'managua');
insert into auth.users (id, email, raw_user_meta_data) values ('00000000-0000-4000-8000-00000000000a','a@x','{"full_name":"A"}');
insert into public.profiles (id, full_name) values ('00000000-0000-4000-8000-00000000000a','A');
insert into public.restaurants (id, created_by, name, slug, status, website_url, reservation_max_party_size)
 values ('60000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-00000000000a','Legado','legado','approved','www.legado.com.ni', 80);
set session_replication_role = origin;
