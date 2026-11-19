#!/usr/bin/env bash
# Ejecuta las pruebas de remediación contra una réplica local de PostgreSQL.
# Uso: ./supabase/tests/run_tests.sh ruta/al/esquema.sql
# Requiere: psql, createdb, dropdb y un PostgreSQL 15+ (variables PGHOST, PGUSER, ...).
set -uo pipefail
SCHEMA="${1:?Indica la ruta del dump del esquema (pg_dump --schema-only)}"
DIR="$(cd "$(dirname "$0")" && pwd)"
MIG="$DIR/../migrations"
TMP="$(mktemp -d)"
TOTAL_OK=0; TOTAL_FAIL=0

# El dump de Supabase usa PostGIS; la réplica lo reemplaza por texto.
sed -E 's/"extensions"\."geography"\(Point,4326\)/text/g; /CREATE EXTENSION IF NOT EXISTS "(postgis|supabase_vault|pg_stat_statements)"/d' \
  "$SCHEMA" > "$TMP/schema.sql"

run_suite () {
  local suite="$1"; shift
  dropdb --if-exists gn_test >/dev/null 2>&1
  createdb gn_test || { echo "No se pudo crear la base gn_test"; exit 1; }
  psql -q -d gn_test -f "$DIR/00_preamble_replica.sql" >/dev/null 2>&1
  psql -q -d gn_test -f "$TMP/schema.sql" >/dev/null 2>&1
  psql -q -d gn_test -c "create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();" >/dev/null 2>&1
  for pre in "$@"; do
    psql -q -v ON_ERROR_STOP=1 -d gn_test -f "$pre" >/dev/null 2>"$TMP/err" || { echo "Falló $pre:"; cat "$TMP/err"; return; }
  done
  for m in "$MIG"/*.sql; do
    psql -q -v ON_ERROR_STOP=1 -d gn_test -f "$m" >/dev/null 2>"$TMP/err" || { echo "Falló la migración $(basename "$m"):"; grep ERROR "$TMP/err"; return; }
  done
  echo "== $suite"
  psql -At -d gn_test -f "$DIR/$suite" 2>/dev/null | grep -E '^(OK|FALLO)' > "$TMP/out"
  cat "$TMP/out"
  TOTAL_OK=$((TOTAL_OK + $(grep -c '^OK' "$TMP/out")))
  TOTAL_FAIL=$((TOTAL_FAIL + $(grep -c '^FALLO' "$TMP/out")))
}

run_suite 10_flujos_app.sql
run_suite 20_fase2.sql
run_suite 30_fase3.sql
run_suite 50_fase5.sql "$DIR/49_fase5_datos_legados.sql"
dropdb --if-exists gn_test >/dev/null 2>&1

echo
echo "Resultado: $TOTAL_OK OK, $TOTAL_FAIL FALLO"
[ "$TOTAL_FAIL" -eq 0 ]
