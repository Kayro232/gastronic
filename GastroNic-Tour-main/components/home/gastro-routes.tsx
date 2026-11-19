'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

import {
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  LoaderCircle,
  MapPin,
  Play,
  Route,
  Sparkles,
  Trophy,
} from 'lucide-react';

import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

interface RouteRestaurant {
  restaurant_id: string;
  stop_order: number;
}

interface GastroRoute {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  storage_path: string | null;
  external_url: string | null;

  difficulty:
    | 'easy'
    | 'medium'
    | 'hard';

  estimated_minutes: number | null;
  distance_km: number | null;
  points_reward: number;
  status: string;
  is_featured: boolean;

  restaurants:
    | RouteRestaurant[]
    | null;
}

interface UserRoute {
  id: string;
  route_id: string;

  status:
    | 'not_started'
    | 'in_progress'
    | 'completed'
    | 'abandoned';
}

function formatDuration(
  minutes: number | null
) {
  if (!minutes || minutes <= 0) {
    return 'Duración variable';
  }

  const hours = Math.floor(
    minutes / 60
  );

  const remainingMinutes =
    minutes % 60;

  if (hours === 0) {
    return `${remainingMinutes} min`;
  }

  if (remainingMinutes === 0) {
    return `${hours} ${
      hours === 1
        ? 'hora'
        : 'horas'
    }`;
  }

  return `${hours} h ${remainingMinutes} min`;
}

function formatDifficulty(
  difficulty: GastroRoute['difficulty']
) {
  if (difficulty === 'easy') {
    return 'Fácil';
  }

  if (difficulty === 'medium') {
    return 'Moderada';
  }

  return 'Difícil';
}

function getRouteImage(
  route: GastroRoute
) {
  if (route.external_url) {
    return route.external_url;
  }

  if (route.storage_path) {
    const supabaseUrl =
      process.env
        .NEXT_PUBLIC_SUPABASE_URL;

    if (supabaseUrl) {
      return `${supabaseUrl}/storage/v1/object/public/route-images/${route.storage_path}`;
    }
  }

  return null;
}

export function GastroRoutes() {
  const [routes, setRoutes] =
    useState<GastroRoute[]>([]);

  const [userRoutes, setUserRoutes] =
    useState<UserRoute[]>([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState('');

  useEffect(() => {
    let mounted = true;

    async function loadRoutes() {
      setIsLoading(true);
      setErrorMessage('');

      const [
        routesResult,
        userResult,
      ] = await Promise.all([
        supabase
          .from('gastro_routes')
          .select(`
            id,
            name,
            slug,
            description,
            storage_path,
            external_url,
            difficulty,
            estimated_minutes,
            distance_km,
            points_reward,
            status,
            is_featured,

            restaurants:route_restaurants (
              restaurant_id,
              stop_order
            )
          `)
          .eq(
            'status',
            'published'
          )
          .order(
            'is_featured',
            {
              ascending: false,
            }
          )
          .order(
            'created_at',
            {
              ascending: false,
            }
          ),

        supabase.auth.getUser(),
      ]);

      if (!mounted) {
        return;
      }

      if (routesResult.error) {
        console.error(
          'Error cargando rutas:',
          routesResult.error
        );

        setErrorMessage(
          'No se pudieron cargar las rutas gastronómicas.'
        );

        setIsLoading(false);
        return;
      }

      setRoutes(
        (routesResult.data ??
          []) as unknown as GastroRoute[]
      );

      const user =
        userResult.data.user;

      if (user) {
        const {
          data,
          error,
        } = await supabase
          .from('user_routes')
          .select(`
            id,
            route_id,
            status
          `)
          .eq(
            'user_id',
            user.id
          );

        if (!mounted) {
          return;
        }

        if (error) {
          console.error(
            'Error cargando rutas del usuario:',
            error
          );

          setUserRoutes([]);
        } else {
          setUserRoutes(
            (data ??
              []) as UserRoute[]
          );
        }
      } else {
        setUserRoutes([]);
      }

      setIsLoading(false);
    }

    loadRoutes();

    return () => {
      mounted = false;
    };
  }, []);

  /* ======================================================== */
  /* LOADING                                                  */
  /* ======================================================== */

  if (isLoading) {
    return (
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map(
          (item) => (
            <div
              key={item}
              className="overflow-hidden rounded-card border border-border/70 bg-white"
            >
              <div className="h-64 animate-pulse bg-muted" />

              <div className="space-y-4 p-5">
                <div className="h-5 w-2/3 animate-pulse rounded-lg bg-muted" />

                <div className="space-y-2">
                  <div className="h-3 w-full animate-pulse rounded bg-muted" />

                  <div className="h-3 w-4/5 animate-pulse rounded bg-muted" />
                </div>

                <div className="h-11 animate-pulse rounded-xl bg-muted" />
              </div>
            </div>
          )
        )}
      </div>
    );
  }

  /* ======================================================== */
  /* ERROR                                                    */
  /* ======================================================== */

  if (errorMessage) {
    return (
      <div className="rounded-card border border-danger/25 bg-red-50/60 px-6 py-12 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-danger-soft">
          <Route className="h-5 w-5 text-danger" />
        </div>

        <h3 className="mt-4 font-bold text-red-900">
          No pudimos cargar las rutas
        </h3>

        <p className="mt-2 text-sm text-danger">
          {errorMessage}
        </p>
      </div>
    );
  }

  /* ======================================================== */
  /* EMPTY                                                    */
  /* ======================================================== */

  if (routes.length === 0) {
    return (
      <div className="rounded-sheet border border-dashed border-border bg-canvas px-6 py-16 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
          <Route className="h-6 w-6 text-action" />
        </div>

        <h3 className="mt-5 text-lg font-bold text-ink">
          Nuevas rutas en camino
        </h3>

        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
          Estamos preparando nuevas
          experiencias para recorrer
          Nicaragua a través de sus
          sabores.
        </p>
      </div>
    );
  }

  /* ======================================================== */
  /* ROUTES                                                   */
  /* ======================================================== */

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {routes.map(
        (route, index) => {
          const userRoute =
            userRoutes.find(
              (item) =>
                item.route_id ===
                route.id
            );

          const completed =
            userRoute?.status ===
            'completed';

          const inProgress =
            userRoute?.status ===
            'in_progress';

          const stops =
            route.restaurants
              ?.length ?? 0;

          const imageUrl =
            getRouteImage(route);

          return (
            <article
              key={route.id}
              className="group relative overflow-hidden rounded-card border border-border/70 bg-white shadow-none transition-shadow duration-300 hover:shadow-raised"
            >
              {/* ============================================== */}
              {/* IMAGE                                          */}
              {/* ============================================== */}

              <Link
                href={`/routes/${route.id}`}
                className="block"
              >
                <div className="relative h-[260px] overflow-hidden bg-[#E8EFED]">
                  {imageUrl ? (
                    <div
                      className="h-full w-full bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-[1.06]"
                      style={{
                        backgroundImage:
                          `url("${imageUrl}")`,
                      }}
                    />
                  ) : (
                    <div className="relative flex h-full items-center justify-center overflow-hidden bg-gradient-to-br from-[#DDEDE9] via-[#EFF5F3] to-[#F5EFE2]">
                      <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-primary/10 blur-3xl" />

                      <div className="absolute -bottom-16 -left-12 h-44 w-44 rounded-full bg-secondary/20 blur-3xl" />

                      <div className="relative flex h-20 w-20 items-center justify-center rounded-card border border-white/70 bg-white/60 shadow-lg backdrop-blur">
                        <Route className="h-9 w-9 text-primary/70" />
                      </div>
                    </div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-[#071D1B]/85 via-[#071D1B]/10 to-black/10" />

                  {/* Difficulty */}
                  <div className="absolute left-4 top-4">
                    <div className="rounded-full border border-white/20 bg-black/20 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-md">
                      {formatDifficulty(
                        route.difficulty
                      )}
                    </div>
                  </div>

                  {/* Featured */}
                  {route.is_featured &&
                    !completed &&
                    !inProgress && (
                      <div className="absolute right-4 top-4">
                        <div className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-xs font-bold uppercase tracking-[0.08em] text-ink shadow-sm">
                          <Sparkles className="h-3 w-3" />

                          Destacada
                        </div>
                      </div>
                    )}

                  {/* Completed */}
                  {completed && (
                    <div className="absolute right-4 top-4">
                      <div className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-success shadow-lg">
                        <CheckCircle2 className="h-3.5 w-3.5" />

                        Completada
                      </div>
                    </div>
                  )}

                  {/* Progress */}
                  {!completed &&
                    inProgress && (
                      <div className="absolute right-4 top-4">
                        <div className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-action shadow-lg">
                          <Play className="h-3 w-3 fill-primary" />

                          En progreso
                        </div>
                      </div>
                    )}

                  {/* Image text */}
                  <div className="absolute inset-x-0 bottom-0 p-5">
                    <div className="mb-2 flex items-center gap-2 text-xs font-medium text-white/70">
                      <MapPin className="h-3.5 w-3.5" />

                      {stops}{' '}
                      {stops === 1
                        ? 'parada'
                        : 'paradas'}
                    </div>

                    <h3 className="line-clamp-2 text-xl font-bold leading-tight tracking-[-0.02em] text-white">
                      {route.name}
                    </h3>
                  </div>
                </div>
              </Link>

              {/* ============================================== */}
              {/* CONTENT                                        */}
              {/* ============================================== */}

              <div className="flex min-h-[300px] flex-col p-5">
                <p className="line-clamp-2 min-h-[48px] text-sm leading-6 text-muted-foreground">
                  {route.description ||
                    'Descubre una experiencia gastronómica única y recorre nuevos sabores de Nicaragua.'}
                </p>

                {/* Stats */}
                <div className="mt-5 grid grid-cols-2 gap-2">
                  <RouteStat
                    icon={Clock}
                    label="Duración"
                    value={formatDuration(
                      route.estimated_minutes
                    )}
                  />

                  <RouteStat
                    icon={Route}
                    label="Distancia"
                    value={
                      route.distance_km !==
                      null
                        ? `${Number(
                            route.distance_km
                          ).toLocaleString(
                            'es-NI',
                            {
                              maximumFractionDigits: 1,
                            }
                          )} km`
                        : 'Variable'
                    }
                  />
                </div>

                {/* Reward */}
                {route.points_reward >
                  0 && (
                  <div className="mt-3 flex items-center justify-between rounded-xl bg-secondary/[0.12] px-3.5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-secondary/25">
                        <Trophy className="h-3.5 w-3.5 text-[#8B6813]" />
                      </div>

                      <span className="text-xs font-semibold text-[#66511B]">
                        Recompensa
                      </span>
                    </div>

                    <span className="text-xs font-bold text-[#8B6813]">
                      +
                      {
                        route.points_reward
                      }{' '}
                      puntos
                    </span>
                  </div>
                )}

                {/* Progress visual */}
                {inProgress && (
                  <div className="mt-4">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-semibold text-muted-foreground">
                        Ruta iniciada
                      </span>

                      <span className="text-xs font-bold text-action">
                        En progreso
                      </span>
                    </div>

                    <div className="h-1.5 overflow-hidden rounded-full bg-primary/10">
                      <div className="h-full w-1/2 rounded-full bg-action" />
                    </div>
                  </div>
                )}

                {completed && (
                  <div className="mt-4 flex items-center gap-2 rounded-xl bg-success-soft px-3.5 py-3 text-xs font-semibold text-success">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-success-soft">
                      <Check className="h-3.5 w-3.5" />
                    </div>

                    Ruta completada
                  </div>
                )}

                {/* CTA */}
                <div className="mt-auto pt-5">
                  <Link
                    href={`/routes/${route.id}`}
                    className={`group/button flex h-11 w-full items-center justify-between rounded-xl px-4 text-sm font-bold transition-all ${
                      completed
                        ? 'border border-border bg-white text-ink hover:border-primary/30 hover:bg-primary/[0.03]'
                        : 'bg-ink text-white shadow-overlay hover:bg-action'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      {completed ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-success" />
                          Ver ruta
                        </>
                      ) : inProgress ? (
                        <>
                          <Play className="h-4 w-4" />
                          Continuar ruta
                        </>
                      ) : (
                        <>
                          <Route className="h-4 w-4" />
                          Explorar ruta
                        </>
                      )}
                    </span>

                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover/button:translate-x-1" />
                  </Link>
                </div>
              </div>
            </article>
          );
        }
      )}
    </div>
  );
}

/* ========================================================== */
/* ROUTE STAT                                                 */
/* ========================================================== */

function RouteStat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{
    className?: string;
  }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-canvas p-3">
      <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        <Icon className="h-3.5 w-3.5 text-action" />

        {label}
      </div>

      <p className="mt-1.5 truncate text-xs font-bold text-ink">
        {value}
      </p>
    </div>
  );
}