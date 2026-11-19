'use client';

import {
  useEffect,
  useState,
} from 'react';

import Image from 'next/image';
import Link from 'next/link';

import {
  CalendarDays,
  LoaderCircle,
  MapPin,
  Route,
  Sparkles,
  Users,
  Wallet,
} from 'lucide-react';

import userRouteLogo from '@/app/icon.png';

import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

/* ============================================================
 * TYPES
 * ========================================================== */

interface SavedRestaurant {
  id: string;
  name: string;
}

interface SavedStop {
  stop_order: number;

  restaurant:
    | SavedRestaurant
    | null;
}

interface SavedRoute {
  id: string;

  name: string;

  route_mode:
    | 'afternoon'
    | 'food'
    | 'night'
    | 'custom';

  party_size: number;

  total_budget:
    | number
    | string
    | null;

  planned_start_at: string;

  estimated_total_min:
    | number
    | string
    | null;

  estimated_total_max:
    | number
    | string
    | null;

  has_unknown_prices: boolean;

  budget_status: string;

  status:
    | 'saved'
    | 'in_progress'
    | 'completed'
    | 'abandoned';

  created_at: string;

  municipality:
    | {
        name: string;
      }
    | null;

  stops:
    | SavedStop[]
    | null;
}

/* ============================================================
 * HELPERS
 * ========================================================== */

function money(
  value:
    | number
    | string
    | null,
) {
  if (value === null) {
    return null;
  }

  const numeric =
    Number(value);

  if (
    !Number.isFinite(
      numeric,
    )
  ) {
    return null;
  }

  return new Intl.NumberFormat(
    'es-NI',
    {
      style:
        'currency',

      currency:
        'NIO',

      maximumFractionDigits:
        0,
    },
  ).format(
    numeric,
  );
}

function formatDate(
  date: string,
) {
  return new Intl.DateTimeFormat(
    'es-NI',
    {
      timeZone:
        'America/Managua',

      day:
        'numeric',

      month:
        'short',

      hour:
        'numeric',

      minute:
        '2-digit',
    },
  ).format(
    new Date(date),
  );
}

function getStatusLabel(
  status:
    SavedRoute['status'],
) {
  if (
    status ===
    'in_progress'
  ) {
    return 'En progreso';
  }

  if (
    status ===
    'completed'
  ) {
    return 'Completada';
  }

  if (
    status ===
    'abandoned'
  ) {
    return 'Abandonada';
  }

  return 'Guardada';
}

/* ============================================================
 * COMPONENT
 * ========================================================== */

export function UserSavedRoutes() {
  const [
    routes,
    setRoutes,
  ] = useState<
    SavedRoute[]
  >([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  /* ========================================================
   * LOAD
   * ====================================================== */

  useEffect(() => {
    let mounted = true;

    async function loadRoutes() {
      const {
        data: {
          user,
        },
      } =
        await supabase.auth
          .getUser();

      if (!mounted) {
        return;
      }

      if (!user) {
        setLoading(false);

        return;
      }

      const {
        data,
        error,
      } =
        await supabase
          .from(
            'user_generated_routes',
          )
          .select(`
            id,
            name,
            route_mode,
            party_size,
            total_budget,
            planned_start_at,
            estimated_total_min,
            estimated_total_max,
            has_unknown_prices,
            budget_status,
            status,
            created_at,

            municipality:municipalities (
              name
            ),

            stops:user_generated_route_stops (
              stop_order,

              restaurant:restaurants (
                id,
                name
              )
            )
          `)
          .eq(
            'user_id',
            user.id,
          )
          .order(
            'created_at',
            {
              ascending:
                false,
            },
          )
          .limit(6);

      if (!mounted) {
        return;
      }

      if (error) {
        console.error(
          'Error cargando rutas guardadas:',
          error,
        );

        setRoutes([]);

        setLoading(false);

        return;
      }

      const loaded =
        (
          data ??
          []
        ) as unknown as
          SavedRoute[];

      for (
        const route
        of loaded
      ) {
        route.stops
          ?.sort(
            (
              a,
              b,
            ) =>
              a.stop_order -
              b.stop_order,
          );
      }

      setRoutes(
        loaded,
      );

      setLoading(false);
    }

    loadRoutes();

    return () => {
      mounted = false;
    };
  }, []);

  /* ========================================================
   * LOADING
   * ====================================================== */

  if (loading) {
    return (
      <div className="mb-10 flex items-center justify-center rounded-card border border-border/60 bg-canvas py-8">

        <LoaderCircle className="h-5 w-5 animate-spin text-action" />

      </div>
    );
  }

  /* ========================================================
   * EMPTY
   * ====================================================== */

  if (
    routes.length ===
    0
  ) {
    return null;
  }

  /* ========================================================
   * RENDER
   * ====================================================== */

  return (
    <div className="mb-12">

      <div className="mb-6">

        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.08em] text-action">

          <Sparkles className="h-4 w-4" />

          Creadas para ti

        </div>

        <h3 className="mt-2 text-2xl font-bold text-ink sm:text-3xl">

          Tus rutas guardadas

        </h3>

        <p className="mt-2 text-sm text-muted-foreground">

          Recorridos creados según tus preferencias y tu plan.

        </p>

      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">

        {routes.map(
          (
            route,
          ) => {
            const min =
              money(
                route
                  .estimated_total_min,
              );

            const max =
              money(
                route
                  .estimated_total_max,
              );

            const stops =
              route.stops ??
              [];

            return (
              <Link
                key={
                  route.id
                }
                href={`/routes/personalized/${route.id}`}
                className="block"
              >

                <article className="group overflow-hidden rounded-card border border-border/70 bg-white shadow-none transition duration-300 hover:-translate-y-1 hover:shadow-raised">

                  {/* PORTADA */}

                  <div className="relative flex h-[230px] items-center justify-center overflow-hidden bg-gradient-to-br from-[#E3F5F2] via-[#F4FAF8] to-[#FFF5D8]">

                    <div className="absolute -right-10 -top-10 h-44 w-44 rounded-full bg-primary/15 blur-3xl" />

                    <div className="absolute -bottom-16 -left-10 h-44 w-44 rounded-full bg-secondary/25 blur-3xl" />

                    <Route className="absolute h-40 w-40 text-primary/[0.04]" />

                    <div className="relative z-10 flex h-32 w-32 items-center justify-center rounded-sheet border border-white/70 bg-white/75 p-3 shadow-xl backdrop-blur">

                      <Image
                        src={
                          userRouteLogo
                        }
                        alt="GastroNic Tour"
                        width={112}
                        height={112}
                        className="h-full w-full object-contain"
                      />

                    </div>

                    {/* BADGE PERSONALIZADA */}

                    <div className="absolute left-4 top-4 rounded-full border border-white/70 bg-white/90 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.08em] text-action shadow-sm backdrop-blur">

                      Ruta personalizada

                    </div>

                    {/* STATUS */}

                    <div className="absolute right-4 top-4 rounded-full border border-white/60 bg-ink/80 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.08em] text-white backdrop-blur">

                      {getStatusLabel(
                        route.status,
                      )}

                    </div>

                    {/* INFO */}

                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/95 via-ink/70 to-transparent px-5 pb-5 pt-16 text-white">

                      <div className="flex items-center gap-1.5 text-xs text-white/70">

                        <MapPin className="h-3.5 w-3.5" />

                        {
                          route
                            .municipality
                            ?.name ??
                          'Nicaragua'
                        }

                      </div>

                      <h4 className="mt-1 line-clamp-2 text-xl font-bold">

                        {
                          route.name
                        }

                      </h4>

                    </div>

                  </div>

                  {/* BODY */}

                  <div className="p-5">

                    <div className="grid grid-cols-2 gap-2">

                      <div className="rounded-xl bg-canvas p-3">

                        <CalendarDays className="h-4 w-4 text-action" />

                        <p className="mt-1.5 text-xs font-bold text-ink">

                          {formatDate(
                            route
                              .planned_start_at,
                          )}

                        </p>

                      </div>

                      <div className="rounded-xl bg-canvas p-3">

                        <Users className="h-4 w-4 text-action" />

                        <p className="mt-1.5 text-xs font-bold text-ink">

                          {
                            route.party_size
                          }{' '}

                          {
                            route.party_size ===
                            1
                              ? 'persona'
                              : 'personas'
                          }

                        </p>

                      </div>

                    </div>

                    {/* PRESUPUESTO */}

                    <div className="mt-3 rounded-xl bg-primary/[0.05] p-3">

                      <div className="flex items-center gap-2">

                        <Wallet className="h-4 w-4 text-action" />

                        <p className="text-xs font-semibold text-muted-foreground">

                          {route.has_unknown_prices
                            ? 'Estimación parcial'
                            : 'Presupuesto estimado'}

                        </p>

                      </div>

                      <p className="mt-1 font-bold text-ink">

                        {min ??
                          'Por confirmar'}

                        {max &&
                          max !==
                            min && (
                            <>
                              {' – '}
                              {max}
                            </>
                          )}

                      </p>

                      {route.has_unknown_prices && (

                        <p className="mt-1 text-xs font-semibold text-action">

                          + precios por confirmar

                        </p>

                      )}

                    </div>

                    {/* STOPS */}

                    <div className="mt-4">

                      <p className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">

                        {
                          stops.length
                        }{' '}

                        {
                          stops.length ===
                          1
                            ? 'parada'
                            : 'paradas'
                        }

                      </p>

                      <div className="mt-2 space-y-1.5">

                        {stops
                          .slice(
                            0,
                            3,
                          )
                          .map(
                            (
                              stop,
                            ) => (

                              <div
                                key={
                                  stop.stop_order
                                }
                                className="flex items-center gap-2 text-xs text-ink"
                              >

                                <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-action">

                                  {
                                    stop.stop_order
                                  }

                                </span>

                                <span className="truncate font-medium">

                                  {
                                    stop
                                      .restaurant
                                      ?.name ??
                                    'Restaurante'
                                  }

                                </span>

                              </div>

                            ),
                          )}

                      </div>

                    </div>

                    <div className="mt-5 border-t border-border/60 pt-4">

                      <span className="text-xs font-bold text-action">

                        Ver ruta completa →

                      </span>

                    </div>

                  </div>

                </article>

              </Link>
            );
          },
        )}

      </div>

    </div>
  );
}