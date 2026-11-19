# Pruebas de la remediación (auditoría GastroNic Tour)

Estas pruebas reproducen los flujos de la app (cliente, dueño, admin) y los
ataques de la auditoría contra una **réplica local** del esquema, con usuarios
simulados. Cada línea imprime `OK` o `FALLO`.

| Archivo | Qué prueba |
| --- | --- |
| `10_flujos_app.sql` | Flujos normales de la app y ataques cerrados por la Fase 1 |
| `20_fase2.sql` | Dueños, puntos canjeables, reseñas, verificación, alta de usuarios |
| `30_fase3.sql` | Privacidad, suspensión, límites, imágenes externas, rutas, borrado de cuenta |
| `49_fase5_datos_legados.sql` + `50_fase5.sql` | URLs antiguas, horarios, auditoría, columnas del servidor |

## Cómo ejecutarlas

1. Exporta el esquema de producción: `pg_dump --schema-only` (o el dump de Supabase).
2. Ten un PostgreSQL 15 o superior local y `psql` en el PATH.
3. `./supabase/tests/run_tests.sh ruta/al/esquema.sql`

Antes de aplicar una migración nueva en producción, agrégala a
`supabase/migrations` y vuelve a correr todas las pruebas.

## Limitaciones

- La réplica no tiene PostGIS: el mapa y la búsqueda por distancia no se prueban.
- `00_preamble_replica.sql` simula `auth.users`, `auth.uid()` y los roles de
  Supabase. No sustituye una prueba en el proyecto real.
- `storage.objects` solo existe si se crea a mano; sin él, la parte de Storage
  de la Fase 3 se omite.
