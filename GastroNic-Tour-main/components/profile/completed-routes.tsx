'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  LoaderCircle,
  MapPin,
  Route,
  Trophy,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

interface RouteRestaurant {
  restaurant_id: string;
  stop_order: number;
}

interface GastroRoute {
  id: string;
  name: string;
  description: string | null;
  external_url: string | null;
  storage_path: string | null;
  difficulty: 'easy' | 'medium' | 'hard';
  estimated_minutes: number | null;
  distance_km: number | null;
  points_reward: number;
  restaurants: RouteRestaurant[] | null;
}

interface UserRouteRow {
  id: string;
  completed_at: string | null;
  route: GastroRoute | GastroRoute[] | null;
}

function unwrapRoute(route: GastroRoute | GastroRoute[] | null) {
  if (!route) return null;
  return Array.isArray(route) ? route[0] ?? null : route;
}

function formatDuration(minutes: number | null) {
  if (!minutes || minutes <= 0) return 'Duración variable';
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (!hours) return `${rest} min`;
  if (!rest) return `${hours} ${hours === 1 ? 'hora' : 'horas'}`;
  return `${hours} h ${rest} min`;
}

function formatDifficulty(value: GastroRoute['difficulty']) {
  if (value === 'easy') return 'Fácil';
  if (value === 'medium') return 'Moderada';
  return 'Difícil';
}

function getRouteImage(route: GastroRoute) {
  if (route.external_url) return route.external_url;
  if (!route.storage_path) return null;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return null;
  return `${supabaseUrl}/storage/v1/object/public/route-images/${route.storage_path}`;
}

export function CompletedRoutes() {
  const [rows, setRows] = useState<UserRouteRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    async function loadRoutes() {
      setIsLoading(true);
      setErrorMessage('');

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        if (userError) console.error('Error obteniendo usuario:', userError);
        setErrorMessage('No se pudo obtener tu sesión.');
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('user_routes')
        .select(`
          id,
          completed_at,
          route:gastro_routes!inner (
            id,
            name,
            description,
            external_url,
            storage_path,
            difficulty,
            estimated_minutes,
            distance_km,
            points_reward,
            restaurants:route_restaurants (
              restaurant_id,
              stop_order
            )
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false });

      if (error) {
        console.error('Error cargando rutas completadas:', error);
        setErrorMessage('No se pudieron cargar tus rutas completadas.');
        setRows([]);
      } else {
        setRows((data ?? []) as unknown as UserRouteRow[]);
      }

      setIsLoading(false);
    }

    loadRoutes();
  }, []);

  if (isLoading) return <StatusBox loading text="Cargando tus rutas..." />;
  if (errorMessage) return <StatusBox error text={errorMessage} />;

  const routes = rows
    .map((row) => ({ ...row, route: unwrapRoute(row.route) }))
    .filter((row): row is UserRouteRow & { route: GastroRoute } => Boolean(row.route));

  if (routes.length === 0) {
    return (
      <div className="flex min-h-[260px] items-center justify-center rounded-card border border-dashed border-border bg-white px-6 py-10 text-center sm:min-h-[300px] sm:rounded-sheet">
        <div className="max-w-md">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <Route className="h-6 w-6 text-action" />
          </div>
          <h3 className="mt-5 text-lg font-bold text-ink">Todavía no has completado rutas</h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Explora rutas gastronómicas y completa sus paradas para verlas aquí.
          </p>
          <Button asChild className="mt-5 h-10 rounded-xl px-5 font-bold">
            <Link href="/routes">Explorar rutas</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-5 sm:mb-7">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.08em] text-action sm:text-xs">
          <Route className="h-3.5 w-3.5" />
          Aventuras completadas
        </div>
        <h3 className="mt-1.5 text-xl font-bold tracking-[-0.025em] text-ink sm:text-2xl">Rutas completadas</h3>
        <p className="mt-1.5 text-xs text-muted-foreground sm:text-sm">
          Has completado {routes.length} {routes.length === 1 ? 'ruta' : 'rutas'}.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {routes.map(({ id, completed_at, route }) => {
          const image = getRouteImage(route);
          const stops = route.restaurants?.length ?? 0;

          return (
            <article key={id} className="overflow-hidden rounded-card border border-border/70 bg-white shadow-sm">
              <div className="relative h-40 bg-primary/10">
                {image ? (
                  <img src={image} alt={route.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Route className="h-12 w-12 text-primary/35" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
                <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-ink backdrop-blur">
                  {formatDifficulty(route.difficulty)}
                </span>
                <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-1 text-xs font-bold text-white">
                  <CheckCircle2 className="h-3 w-3" /> Completada
                </span>
              </div>

              <div className="p-5">
                <h4 className="text-lg font-bold text-ink">{route.name}</h4>
                <p className="mt-2 line-clamp-2 min-h-[40px] text-xs leading-5 text-muted-foreground">
                  {route.description || 'Una experiencia gastronómica completada en GastroNic.'}
                </p>

                <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 text-action" />{stops} paradas</div>
                  <div className="flex items-center gap-2"><Clock3 className="h-3.5 w-3.5 text-action" />{formatDuration(route.estimated_minutes)}</div>
                  {route.distance_km !== null && (
                    <div className="flex items-center gap-2"><Route className="h-3.5 w-3.5 text-action" />{Number(route.distance_km).toLocaleString('es-NI', { maximumFractionDigits: 1 })} km</div>
                  )}
                  {route.points_reward > 0 && (
                    <div className="flex items-center gap-2 font-semibold text-[#A37712]"><Trophy className="h-3.5 w-3.5" />+{route.points_reward} pts</div>
                  )}
                </div>

                {completed_at && (
                  <p className="mt-4 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                    Completada {new Intl.DateTimeFormat('es-NI', { dateStyle: 'medium', timeZone: 'America/Managua' }).format(new Date(completed_at))}
                  </p>
                )}

                <Button asChild variant="outline" className="mt-4 h-10 w-full rounded-xl font-bold">
                  <Link href={`/routes/${route.id}`}>Ver ruta</Link>
                </Button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function StatusBox({ loading, error, text }: { loading?: boolean; error?: boolean; text: string }) {
  return (
    <div className={`flex min-h-[240px] items-center justify-center rounded-card border p-6 ${error ? 'border-danger/25 bg-red-50/60 text-danger' : 'border-border/70 bg-white text-muted-foreground'}`}>
      {loading ? <LoaderCircle className="mr-3 h-5 w-5 animate-spin text-action" /> : <AlertCircle className="mr-3 h-5 w-5" />}
      <span className="text-sm">{text}</span>
    </div>
  );
}