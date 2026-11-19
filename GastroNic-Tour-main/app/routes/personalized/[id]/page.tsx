'use client';

import {
  useEffect,
  useState,
} from 'react';

import Image from 'next/image';
import Link from 'next/link';

import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  LoaderCircle,
  MapPin,
  Navigation,
  Play,
  RefreshCw,
  Route,
  Sparkles,
  Users,
  Wallet,
} from 'lucide-react';

import {
  useParams,
} from 'next/navigation';

import userRouteLogo from '@/app/icon.png';

import { MainLayout } from '@/components/layout/main-layout';

import { Button } from '@/components/ui/button';

import { createClient } from '@/lib/supabase/client';
import { getUserFacingErrorMessage } from '@/lib/supabase/errors';

const supabase =
  createClient();

/* ============================================================
 * TYPES
 * ========================================================== */

interface RestaurantData {
  id: string;

  name: string;

  slug:
    | string
    | null;

  address:
    | string
    | null;

  average_rating:
    | number
    | string
    | null;
}

interface PersonalizedRouteStop {
  id: string;

  stop_order: number;

  stop_key: string;

  label: string;

  planned_at: string;

  estimated_total_min:
    | number
    | string
    | null;

  estimated_total_max:
    | number
    | string
    | null;

  reasons: string[];

  visit_id:
    | string
    | null;

  completed_at:
    | string
    | null;

  restaurant:
    | RestaurantData
    | null;
}

interface MissingStop {
  id?: string;
  label?: string;
}

interface PersonalizedRoute {
  id: string;

  user_id: string;

  name: string;

  route_mode: string;

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

  has_unknown_prices:
    boolean;

  budget_status: string;

  status:
    | 'saved'
    | 'in_progress'
    | 'completed'
    | 'abandoned';

  missing_stops:
    MissingStop[];

  created_at: string;

  started_at:
    | string
    | null;

  completed_at:
    | string
    | null;

  municipality:
    | {
        name: string;
      }
    | null;

  stops:
    PersonalizedRouteStop[];
}

interface VerifiedVisit {
  id: string;

  restaurant_id: string;

  visited_at: string;
}

/* ============================================================
 * HELPERS
 * ========================================================== */

function formatMoney(
  value:
    | number
    | string
    | null,
) {
  if (
    value === null
  ) {
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
  value: string,
) {
  return new Intl.DateTimeFormat(
    'es-NI',
    {
      timeZone:
        'America/Managua',

      weekday:
        'long',

      day:
        'numeric',

      month:
        'long',

      year:
        'numeric',
    },
  ).format(
    new Date(value),
  );
}


function formatTime(
  value: string,
) {
  return new Intl.DateTimeFormat(
    'es-NI',
    {
      timeZone:
        'America/Managua',

      hour:
        'numeric',

      minute:
        '2-digit',

      hour12:
        true,
    },
  ).format(
    new Date(value),
  );
}


function getStatusLabel(
  status:
    PersonalizedRoute['status'],
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
 * PAGE
 * ========================================================== */

export default function PersonalizedRoutePage() {
  const params =
    useParams();

  const routeId =
    params.id as string;

  const [
    route,
    setRoute,
  ] = useState<
    PersonalizedRoute | null
  >(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    starting,
    setStarting,
  ] = useState(false);

  const [
    syncing,
    setSyncing,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState('');

  const [
    successMessage,
    setSuccessMessage,
  ] = useState('');

  /* ========================================================
   * SYNCHRONIZE VERIFIED VISITS
   * ====================================================== */

  async function synchronizeProgress(
    currentRoute:
      PersonalizedRoute,

    userId:
      string,

    showMessage:
      boolean = false,
  ): Promise<PersonalizedRoute> {

    /*
     * Solo registramos progreso una vez
     * iniciada la ruta.
     */
    if (
      currentRoute.status !==
      'in_progress'
    ) {
      return currentRoute;
    }

    const pendingStops =
      currentRoute.stops.filter(
        (stop) =>
          !stop.completed_at &&
          stop.restaurant,
      );

    /*
     * Si no quedan pendientes pero la ruta
     * sigue marcada como in_progress,
     * la finalizamos.
     */
    if (
      pendingStops.length ===
      0
    ) {
      if (
        currentRoute.stops.length >
        0
      ) {
        const completedAt =
          new Date()
            .toISOString();

        const {
          error,
        } =
          await supabase
            .from(
              'user_generated_routes',
            )
            .update({
              status:
                'completed',

              completed_at:
                completedAt,

              updated_at:
                completedAt,
            })
            .eq(
              'id',
              currentRoute.id,
            )
            .eq(
              'user_id',
              userId,
            );

        if (error) {
          throw error;
        }

        if (showMessage) {
          setSuccessMessage(
            '🏆 ¡Ruta completada! Completaste todas las paradas.',
          );
        }

        return {
          ...currentRoute,

          status:
            'completed',

          completed_at:
            completedAt,
        };
      }

      return currentRoute;
    }

    /* ======================================================
     * RESTAURANT IDS
     * ==================================================== */

    const restaurantIds =
      pendingStops
        .map(
          (stop) =>
            stop.restaurant?.id,
        )
        .filter(
          (
            id,
          ): id is string =>
            Boolean(id),
        );

    if (
      restaurantIds.length ===
      0
    ) {
      return currentRoute;
    }

    /* ======================================================
     * FIND VERIFIED VISITS
     * ==================================================== */

    const {
      data:
        visitsData,

      error:
        visitsError,
    } =
      await supabase
        .from(
          'visits',
        )
        .select(`
          id,
          restaurant_id,
          visited_at
        `)
        .eq(
          'user_id',
          userId,
        )
        .eq(
          'verification_status',
          'verified',
        )
        .in(
          'restaurant_id',
          restaurantIds,
        )
        .order(
          'visited_at',
          {
            ascending:
              false,
          },
        );

    if (visitsError) {
      throw visitsError;
    }

    const verifiedVisits =
      (
        visitsData ??
        []
      ) as VerifiedVisit[];

    /*
     * Como están ordenadas de la visita
     * más reciente a la más antigua,
     * nos quedamos con la primera
     * de cada restaurante.
     */
    const latestVisitByRestaurant =
      new Map<
        string,
        VerifiedVisit
      >();

    for (
      const visit
      of verifiedVisits
    ) {
      if (
        !latestVisitByRestaurant.has(
          visit.restaurant_id,
        )
      ) {
        latestVisitByRestaurant.set(
          visit.restaurant_id,
          visit,
        );
      }
    }

    /* ======================================================
     * UPDATE STOPS
     * ==================================================== */

    const updatedStops =
      currentRoute.stops.map(
        (stop) => ({
          ...stop,
        }),
      );

    let newlyCompleted =
      0;

    for (
      const pendingStop
      of pendingStops
    ) {
      const restaurantId =
        pendingStop
          .restaurant
          ?.id;

      if (!restaurantId) {
        continue;
      }

      const verifiedVisit =
        latestVisitByRestaurant.get(
          restaurantId,
        );

      if (!verifiedVisit) {
        continue;
      }

      const completedAt =
        new Date()
          .toISOString();

      const {
        error:
          stopError,
      } =
        await supabase
          .from(
            'user_generated_route_stops',
          )
          .update({
            visit_id:
              verifiedVisit.id,

            completed_at:
              completedAt,
          })
          .eq(
            'id',
            pendingStop.id,
          )
          .eq(
            'generated_route_id',
            currentRoute.id,
          );

      if (stopError) {
        throw stopError;
      }

      const localStop =
        updatedStops.find(
          (stop) =>
            stop.id ===
            pendingStop.id,
        );

      if (localStop) {
        localStop.visit_id =
          verifiedVisit.id;

        localStop.completed_at =
          completedAt;
      }

      newlyCompleted++;
    }

    /* ======================================================
     * CHECK TOTAL PROGRESS
     * ==================================================== */

    const completedCount =
      updatedStops.filter(
        (stop) =>
          Boolean(
            stop.completed_at,
          ),
      ).length;

    const totalStops =
      updatedStops.length;

    let updatedRoute:
      PersonalizedRoute = {
        ...currentRoute,

        stops:
          updatedStops,
      };

    /* ======================================================
     * COMPLETE ROUTE
     * ==================================================== */

    if (
      totalStops > 0 &&
      completedCount >=
        totalStops
    ) {
      const completedAt =
        new Date()
          .toISOString();

      const {
        error:
          routeError,
      } =
        await supabase
          .from(
            'user_generated_routes',
          )
          .update({
            status:
              'completed',

            completed_at:
              completedAt,

            updated_at:
              completedAt,
          })
          .eq(
            'id',
            currentRoute.id,
          )
          .eq(
            'user_id',
            userId,
          );

      if (routeError) {
        throw routeError;
      }

      updatedRoute = {
        ...updatedRoute,

        status:
          'completed',

        completed_at:
          completedAt,
      };

      if (showMessage) {
        setSuccessMessage(
          '🏆 ¡Ruta completada! Completaste todas las paradas.',
        );
      }

      return updatedRoute;
    }

    /* ======================================================
     * MESSAGE
     * ==================================================== */

    if (showMessage) {
      if (
        newlyCompleted >
        0
      ) {
        setSuccessMessage(
          newlyCompleted ===
          1
            ? '✓ Encontramos una nueva visita verificada. Parada completada.'
            : `✓ ${newlyCompleted} nuevas paradas completadas.`,
        );

      } else {
        setSuccessMessage(
          'No encontramos nuevas visitas verificadas todavía.',
        );
      }
    }

    return updatedRoute;
  }

  /* ========================================================
   * LOAD
   * ====================================================== */

  useEffect(() => {
    if (!routeId) {
      return;
    }

    let mounted = true;

    async function loadRoute() {
      setLoading(true);

      setErrorMessage('');
      setSuccessMessage('');

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
        setErrorMessage(
          'Debes iniciar sesión para ver esta ruta.',
        );

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
            user_id,
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
            missing_stops,
            created_at,
            started_at,
            completed_at,

            municipality:municipalities (
              name
            ),

            stops:user_generated_route_stops (
              id,
              stop_order,
              stop_key,
              label,
              planned_at,
              estimated_total_min,
              estimated_total_max,
              reasons,
              visit_id,
              completed_at,

              restaurant:restaurants (
                id,
                name,
                slug,
                address,
                average_rating
              )
            )
          `)
          .eq(
            'id',
            routeId,
          )
          .eq(
            'user_id',
            user.id,
          )
          .single();

      if (!mounted) {
        return;
      }

      if (error) {
        console.error(
          'Error cargando ruta:',
          error,
        );

        setErrorMessage(
          'No encontramos esta ruta o no tienes acceso a ella.',
        );

        setLoading(false);

        return;
      }

      let parsed =
        data as unknown as
          PersonalizedRoute;

      parsed.stops =
        (
          parsed.stops ??
          []
        ).sort(
          (
            a,
            b,
          ) =>
            a.stop_order -
            b.stop_order,
        );

      parsed.missing_stops =
        parsed.missing_stops ??
        [];

      /*
       * Si la ruta ya está activa,
       * comprobamos automáticamente
       * si hay nuevas visitas verificadas.
       */
      if (
        parsed.status ===
        'in_progress'
      ) {
        try {
          parsed =
            await synchronizeProgress(
              parsed,
              user.id,
              false,
            );

        } catch (
          syncError
        ) {
          console.error(
            'Error sincronizando progreso:',
            syncError,
          );
        }
      }

      if (!mounted) {
        return;
      }

      setRoute(
        parsed,
      );

      setLoading(false);
    }

    loadRoute();

    return () => {
      mounted = false;
    };

  }, [
    routeId,
  ]);

  /* ========================================================
   * START ROUTE
   * ====================================================== */

  async function handleStartRoute() {
    if (!route) {
      return;
    }

    if (
      route.status !==
      'saved'
    ) {
      return;
    }

    setStarting(true);

    setErrorMessage('');
    setSuccessMessage('');

    try {
      const {
        data: {
          user,
        },
      } =
        await supabase.auth
          .getUser();

      if (!user) {
        setErrorMessage(
          'Debes iniciar sesión para iniciar esta ruta.',
        );

        return;
      }

      const startedAt =
        new Date()
          .toISOString();

      const {
        error,
      } =
        await supabase
          .from(
            'user_generated_routes',
          )
          .update({
            status:
              'in_progress',

            started_at:
              startedAt,

            updated_at:
              startedAt,
          })
          .eq(
            'id',
            route.id,
          )
          .eq(
            'user_id',
            user.id,
          );

      if (error) {
        throw error;
      }

      let startedRoute:
        PersonalizedRoute = {
          ...route,

          status:
            'in_progress',

          started_at:
            startedAt,
      };

      /*
       * Comprobamos inmediatamente
       * si ya existe alguna visita
       * verificada.
       */
      startedRoute =
        await synchronizeProgress(
          startedRoute,
          user.id,
          false,
        );

      setRoute(
        startedRoute,
      );

      if (
        startedRoute.status ===
        'completed'
      ) {
        setSuccessMessage(
          '🏆 ¡Ruta completada! Ya tenías visitas verificadas en todas las paradas.',
        );

      } else {
        setSuccessMessage(
          '🚀 Ruta iniciada. Ya estamos siguiendo tu progreso.',
        );
      }

    } catch (error) {
      console.error(
        'Error iniciando ruta:',
        error,
      );

      setErrorMessage(
        getUserFacingErrorMessage(error, 'No pudimos iniciar esta ruta.'),
      );

    } finally {
      setStarting(false);
    }
  }

  /* ========================================================
   * MANUAL REFRESH PROGRESS
   * ====================================================== */

  async function handleRefreshProgress() {
    if (!route) {
      return;
    }

    if (
      route.status !==
      'in_progress'
    ) {
      return;
    }

    setSyncing(true);

    setErrorMessage('');
    setSuccessMessage('');

    try {
      const {
        data: {
          user,
        },
      } =
        await supabase.auth
          .getUser();

      if (!user) {
        setErrorMessage(
          'Debes iniciar sesión para actualizar el progreso.',
        );

        return;
      }

      const updatedRoute =
        await synchronizeProgress(
          route,
          user.id,
          true,
        );

      setRoute(
        updatedRoute,
      );

    } catch (error) {
      console.error(
        'Error actualizando progreso:',
        error,
      );

      setErrorMessage(
        getUserFacingErrorMessage(error, 'No pudimos actualizar el progreso.'),
      );

    } finally {
      setSyncing(false);
    }
  }

  /* ========================================================
   * LOADING
   * ====================================================== */

  if (loading) {
    return (
      <MainLayout>

        <div className="min-h-screen bg-canvas">

          <div className="flex min-h-[70vh] items-center justify-center">

            <LoaderCircle className="h-7 w-7 animate-spin text-action" />

          </div>

        </div>

      </MainLayout>
    );
  }

  /* ========================================================
   * NOT FOUND
   * ====================================================== */

  if (!route) {
    return (
      <MainLayout>

        <div className="min-h-screen bg-canvas py-16">

          <div className="mx-auto max-w-3xl px-4">

            <div className="rounded-sheet border border-danger/25 bg-white p-8 text-center shadow-sm">

              <AlertCircle className="mx-auto h-8 w-8 text-red-500" />

              <p className="mt-4 font-bold text-ink">
                Ruta no disponible
              </p>

              <p className="mt-2 text-sm text-muted-foreground">
                {errorMessage}
              </p>

              <Button
                asChild
                className="mt-6 rounded-xl"
              >

                <Link href="/">
                  Volver al inicio
                </Link>

              </Button>

            </div>

          </div>

        </div>

      </MainLayout>
    );
  }

  /* ========================================================
   * DERIVED DATA
   * ====================================================== */

  const min =
    formatMoney(
      route
        .estimated_total_min,
    );

  const max =
    formatMoney(
      route
        .estimated_total_max,
    );

  const completedStops =
    route.stops.filter(
      (stop) =>
        Boolean(
          stop.completed_at,
        ),
    ).length;

  const totalStops =
    route.stops.length;

  const progressPercent =
    totalStops > 0
      ? Math.min(
          100,
          Math.round(
            (
              completedStops /
              totalStops
            ) *
            100,
          ),
        )
      : 0;

  /* ========================================================
   * RENDER
   * ====================================================== */

  return (
    <MainLayout>

      <div className="min-h-screen bg-canvas pb-20">

        {/* ==================================================
         * HERO
         * ================================================ */}

        <section className="relative overflow-hidden bg-ink text-white">



          <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">

            <Link
              href="/#rutas"
              className="inline-flex items-center gap-2 text-sm font-semibold text-white/60 transition hover:text-white"
            >

              <ArrowLeft className="h-4 w-4" />

              Volver a rutas

            </Link>

            <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px] lg:items-center">

              <div>

                <div className="flex flex-wrap items-center gap-2">

                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.08em] text-secondary">

                    <Sparkles className="h-3.5 w-3.5" />

                    Ruta personalizada

                  </span>

                  <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.08em] text-white/70">

                    {getStatusLabel(
                      route.status,
                    )}

                  </span>

                </div>

                <h1 className="mt-5 max-w-3xl text-3xl font-bold tracking-[-0.04em] sm:text-5xl">

                  {
                    route.name
                  }

                </h1>

                <div className="mt-5 flex flex-wrap gap-x-6 gap-y-3 text-sm text-white/65">

                  <div className="flex items-center gap-2">

                    <MapPin className="h-4 w-4 text-action" />

                    {
                      route
                        .municipality
                        ?.name ??
                      'Nicaragua'
                    }

                  </div>

                  <div className="flex items-center gap-2">

                    <CalendarDays className="h-4 w-4 text-action" />

                    {formatDate(
                      route
                        .planned_start_at,
                    )}

                  </div>

                  <div className="flex items-center gap-2">

                    <Clock3 className="h-4 w-4 text-action" />

                    {formatTime(
                      route
                        .planned_start_at,
                    )}

                  </div>

                </div>

              </div>

              {/* LOGO */}

              <div className="relative mx-auto flex h-64 w-full max-w-sm items-center justify-center overflow-hidden rounded-sheet bg-gradient-to-br from-[#E3F5F2] via-white to-[#FFF4CC] shadow-modal">

                <Route className="absolute h-52 w-52 text-primary/[0.04]" />

                <Image
                  src={
                    userRouteLogo
                  }
                  alt="GastroNic Tour"
                  width={180}
                  height={180}
                  className="relative z-10 h-40 w-40 object-contain"
                />

              </div>

            </div>

          </div>

        </section>

        {/* ==================================================
         * CONTENT
         * ================================================ */}

        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">

          {/* INFO */}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

            <InfoCard
              icon={Users}
              title="Personas"
              value={`${route.party_size} ${
                route.party_size ===
                1
                  ? 'persona'
                  : 'personas'
              }`}
            />

            <InfoCard
              icon={Route}
              title="Paradas"
              value={`${totalStops}`}
            />

            <InfoCard
              icon={Wallet}
              title={
                route.has_unknown_prices
                  ? 'Estimación parcial'
                  : 'Presupuesto estimado'
              }
              value={
                min
                  ? max &&
                    max !==
                      min
                    ? `${min} – ${max}`
                    : min
                  : 'Por confirmar'
              }
            />

            <InfoCard
              icon={Clock3}
              title="Estado"
              value={
                getStatusLabel(
                  route.status,
                )
              }
            />

          </div>

          {/* PRICE WARNING */}

          {route.has_unknown_prices && (

            <div className="mt-4 rounded-2xl border border-primary/15 bg-primary/[0.05] px-4 py-3 text-sm text-action">

              Esta es una estimación parcial porque algunos restaurantes todavía no tienen precios registrados.

            </div>

          )}

          {/* ERROR */}

          {errorMessage && (

            <div className="mt-6 flex items-start gap-3 rounded-2xl border border-danger/25 bg-danger-soft p-4 text-sm text-danger">

              <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />

              <p>
                {errorMessage}
              </p>

            </div>

          )}

          {/* SUCCESS / INFO */}

          {successMessage && (

            <div className="mt-6 flex items-start gap-3 rounded-2xl border border-success/25 bg-success-soft p-4 text-sm text-success">

              <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0" />

              <p>
                {successMessage}
              </p>

            </div>

          )}

          {/* ==================================================
           * ACTION
           * ================================================ */}

          <section className="mt-8 rounded-sheet border border-border/70 bg-white p-5 shadow-none sm:p-7">

            {route.status ===
            'saved' ? (

              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

                <div>

                  <p className="text-xs font-bold uppercase tracking-[0.08em] text-action">
                    Lista para comenzar
                  </p>

                  <h2 className="mt-2 text-xl font-bold text-ink">
                    ¿Empezamos esta ruta?
                  </h2>

                  <p className="mt-1 text-sm text-muted-foreground">
                    Al iniciar la ruta, GastroNic comenzará a registrar tu recorrido.
                  </p>

                </div>

                <Button
                  type="button"
                  size="lg"
                  disabled={
                    starting
                  }
                  onClick={
                    handleStartRoute
                  }
                  className="h-12 rounded-xl px-7 font-bold"
                >

                  {starting ? (

                    <>
                      <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />

                      Iniciando...
                    </>

                  ) : (

                    <>
                      <Play className="mr-2 h-4 w-4 fill-current" />

                      Iniciar ruta
                    </>

                  )}

                </Button>

              </div>

            ) : route.status ===
            'in_progress' ? (

              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

                <div>

                  <p className="text-xs font-bold uppercase tracking-[0.08em] text-action">
                    Ruta activa
                  </p>

                  <h2 className="mt-2 text-xl font-bold text-ink">
                    Tu recorrido está en progreso
                  </h2>

                  <p className="mt-1 max-w-2xl text-sm text-muted-foreground">

                    GastroNic comprobará tus visitas verificadas y actualizará automáticamente las paradas completadas.

                  </p>

                </div>

                <div className="flex flex-col gap-2 sm:flex-row">

                  <div className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary/10 px-5 font-bold text-action">

                    <Navigation className="h-4 w-4" />

                    En progreso

                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    disabled={
                      syncing
                    }
                    onClick={
                      handleRefreshProgress
                    }
                    className="h-12 rounded-xl px-5 font-bold"
                  >

                    {syncing ? (

                      <>
                        <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />

                        Comprobando...
                      </>

                    ) : (

                      <>
                        <RefreshCw className="mr-2 h-4 w-4" />

                        Actualizar progreso
                      </>

                    )}

                  </Button>

                </div>

              </div>

            ) : route.status ===
            'completed' ? (

              <div className="flex items-center gap-4">

                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success-soft">

                  <CheckCircle2 className="h-6 w-6 text-success" />

                </div>

                <div>

                  <p className="font-bold text-ink">
                    Ruta completada
                  </p>

                  <p className="mt-1 text-sm text-muted-foreground">
                    Completaste todas las paradas de esta experiencia.
                  </p>

                </div>

              </div>

            ) : (

              <div className="flex items-center gap-4">

                <AlertCircle className="h-6 w-6 text-muted-foreground" />

                <div>

                  <p className="font-bold text-ink">
                    Ruta abandonada
                  </p>

                  <p className="mt-1 text-sm text-muted-foreground">
                    Esta ruta ya no está activa.
                  </p>

                </div>

              </div>

            )}

          </section>

          {/* ==================================================
           * PROGRESS
           * ================================================ */}

          <section className="mt-8 rounded-sheet border border-border/70 bg-white p-5 shadow-none sm:p-7">

            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

              <div>

                <p className="text-xs font-bold uppercase tracking-[0.08em] text-action">
                  Tu progreso
                </p>

                <h2 className="mt-2 text-2xl font-bold text-ink">

                  {completedStops} de {totalStops} paradas

                </h2>

                <p className="mt-1 text-sm text-muted-foreground">

                  Las paradas se completan usando visitas verificadas.

                </p>

              </div>

              <p className="text-3xl font-bold text-action">

                {progressPercent}%

              </p>

            </div>

            {/* BAR */}

            <div className="mt-5 h-3 overflow-hidden rounded-full bg-[#E8EFED]">

              <div
                className="h-full rounded-full bg-action transition-all duration-500"
                style={{
                  width:
                    `${progressPercent}%`,
                }}
              />

            </div>

          </section>

          {/* ==================================================
           * STOPS
           * ================================================ */}

          <section className="mt-10">

            <div className="mb-6">

              <p className="text-xs font-bold uppercase tracking-[0.08em] text-action">
                Tu recorrido
              </p>

              <h2 className="mt-2 text-3xl font-bold tracking-[-0.03em] text-ink">
                Paradas de la ruta
              </h2>

              <p className="mt-2 text-sm text-muted-foreground">

                Seguí el recorrido en el orden sugerido por GastroNic.

              </p>

            </div>

            <div className="space-y-4">

              {route.stops.map(
                (
                  stop,
                  index,
                ) => {

                  const stopMin =
                    formatMoney(
                      stop
                        .estimated_total_min,
                    );

                  const stopMax =
                    formatMoney(
                      stop
                        .estimated_total_max,
                    );

                  const completed =
                    Boolean(
                      stop.completed_at,
                    );

                  return (

                    <div
                      key={
                        stop.id
                      }
                      className="relative flex gap-4"
                    >

                      {index <
                        route.stops.length -
                          1 && (

                        <div
                          className={`absolute left-[23px] top-12 h-[calc(100%+0.5rem)] w-px ${
                            completed
                              ? 'bg-emerald-300'
                              : 'bg-border'
                          }`}
                        />

                      )}

                      {/* NUMBER / CHECK */}

                      <div
                        className={`relative z-10 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full font-bold shadow-md ${
                          completed
                            ? 'bg-emerald-600 text-white'
                            : 'bg-action text-white'
                        }`}
                      >

                        {completed ? (

                          <CheckCircle2 className="h-6 w-6" />

                        ) : (

                          stop.stop_order

                        )}

                      </div>

                      <article
                        className={`flex-1 rounded-card border bg-white p-5 shadow-none ${
                          completed
                            ? 'border-success/25'
                            : 'border-border/70'
                        }`}
                      >

                        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">

                          <div>

                            <div className="flex flex-wrap items-center gap-2">

                              <p className="text-xs font-bold uppercase tracking-[0.08em] text-action">

                                {formatTime(
                                  stop.planned_at,
                                )}

                                {' · '}

                                {
                                  stop.label
                                }

                              </p>

                              {completed ? (

                                <span className="rounded-full bg-success-soft px-2.5 py-1 text-xs font-bold uppercase tracking-[0.08em] text-success">

                                  ✓ Completada

                                </span>

                              ) : (

                                <span className="rounded-full bg-[#F0F4F3] px-2.5 py-1 text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">

                                  Pendiente

                                </span>

                              )}

                            </div>

                            <h3 className="mt-1 text-xl font-bold text-ink">

                              {
                                stop
                                  .restaurant
                                  ?.name ??
                                'Restaurante'
                              }

                            </h3>

                            {stop.restaurant
                              ?.address && (

                              <div className="mt-2 flex items-start gap-2 text-sm text-muted-foreground">

                                <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0" />

                                <span>

                                  {
                                    stop.restaurant
                                      .address
                                  }

                                </span>

                              </div>

                            )}

                            {completed &&
                              stop.completed_at && (

                              <div className="mt-2 flex items-center gap-2 text-xs font-semibold text-success">

                                <CheckCircle2 className="h-4 w-4" />

                                Visita verificada ·{' '}

                                {formatTime(
                                  stop.completed_at,
                                )}

                              </div>

                            )}

                          </div>

                          {stop.restaurant && (

                            <Button
                              asChild
                              variant="outline"
                              className="rounded-xl"
                            >

                              <Link
                                href={`/restaurant/${stop.restaurant.id}`}
                              >
                                Ver restaurante
                              </Link>

                            </Button>

                          )}

                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">

                          {stop.restaurant
                            ?.average_rating !==
                            null &&
                            stop.restaurant
                              ?.average_rating !==
                              undefined && (

                            <span className="rounded-lg bg-secondary/15 px-2.5 py-1.5 text-xs font-semibold text-[#735A16]">

                              ★{' '}

                              {
                                stop.restaurant
                                  .average_rating
                              }

                            </span>

                          )}

                          <span className="rounded-lg bg-primary/[0.07] px-2.5 py-1.5 text-xs font-semibold text-action">

                            {stopMin
                              ? stopMax &&
                                stopMax !==
                                  stopMin
                                ? `${stopMin} – ${stopMax}`
                                : `Desde ${stopMin}`
                              : 'Precio por confirmar'}

                          </span>

                        </div>

                        {stop.reasons &&
                          stop.reasons.length >
                            0 && (

                          <div className="mt-4 flex flex-wrap gap-2">

                            {stop.reasons
                              .slice(
                                0,
                                3,
                              )
                              .map(
                                (
                                  reason,
                                ) => (

                                  <span
                                    key={
                                      reason
                                    }
                                    className="inline-flex items-center gap-1.5 rounded-full bg-canvas px-2.5 py-1 text-xs font-medium text-muted-foreground"
                                  >

                                    <Sparkles className="h-3 w-3 text-action" />

                                    {
                                      reason
                                    }

                                  </span>

                                ),
                              )}

                          </div>

                        )}

                      </article>

                    </div>

                  );
                },
              )}

            </div>

          </section>

          {/* ==================================================
           * ADAPTED ROUTE
           * ================================================ */}

          {route.missing_stops.length >
            0 && (

            <section className="mt-8 rounded-card border border-warning/25 bg-warning-soft p-5">

              <div className="flex gap-3">

                <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-warning" />

                <div>

                  <p className="font-bold text-amber-900">
                    Ruta adaptada
                  </p>

                  <p className="mt-1 text-sm leading-6 text-warning">

                    GastroNic no encontró opciones disponibles para:{' '}

                    {route.missing_stops
                      .map(
                        (
                          stop,
                        ) =>
                          stop.label ??
                          'una parada',
                      )
                      .join(
                        ', ',
                      )}

                    .

                  </p>

                </div>

              </div>

            </section>

          )}

        </div>

      </div>

    </MainLayout>
  );
}

/* ============================================================
 * INFO CARD
 * ========================================================== */

function InfoCard({
  icon: Icon,
  title,
  value,
}: {
  icon:
    React.ComponentType<{
      className?: string;
    }>;

  title: string;

  value: string;
}) {
  return (

    <div className="rounded-2xl border border-border/70 bg-white p-4 shadow-none">

      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">

        <Icon className="h-4 w-4 text-action" />

      </div>

      <p className="mt-3 text-xs font-semibold text-muted-foreground">
        {title}
      </p>

      <p className="mt-1 font-bold text-ink">
        {value}
      </p>

    </div>

  );
}