'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  LoaderCircle,
  MapPin,
  Navigation,
  Play,
  Route as RouteIcon,
  Star,
  Trophy,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { getUserFacingErrorMessage } from '@/lib/supabase/errors';

const supabase = createClient();

interface Restaurant {
  id: string;
  name: string;
  slug: string | null;
  short_description: string | null;
  address: string | null;
  average_rating: number | null;
}

interface RouteRestaurant {
  restaurant_id: string;
  stop_order: number;
  notes: string | null;
  estimated_minutes: number | null;
  restaurant: Restaurant | null;
}

interface GastroRoute {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  storage_path: string | null;
  external_url: string | null;
  difficulty: 'easy' | 'medium' | 'hard';
  estimated_minutes: number | null;
  distance_km: number | null;
  points_reward: number;
  status: string;
  is_featured: boolean;
  restaurants: RouteRestaurant[] | null;
}

interface UserRoute {
  id: string;
  user_id: string;
  route_id: string;
  status:
    | 'not_started'
    | 'in_progress'
    | 'completed'
    | 'abandoned';
  started_at: string | null;
  completed_at: string | null;
}

interface CompletedStop {
  user_route_id: string;
  restaurant_id: string;
  visit_id: string | null;
  completed_at: string | null;
}

interface RouteDetailProps {
  routeId: string;
}


function formatDuration(minutes: number | null) {
  if (!minutes || minutes <= 0) {
    return 'Duración variable';
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours === 0) {
    return `${remainingMinutes} min`;
  }

  if (remainingMinutes === 0) {
    return `${hours} ${
      hours === 1 ? 'hora' : 'horas'
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

function getRouteImage(route: GastroRoute) {
  if (route.external_url) {
    return route.external_url;
  }

  if (!route.storage_path) {
    return null;
  }

  
  if (
    route.storage_path.startsWith('http://') ||
    route.storage_path.startsWith('https://')
  ) {
    return route.storage_path;
  }


  return null;
}

export function RouteDetail({
  routeId,
}: RouteDetailProps) {
  const [route, setRoute] =
    useState<GastroRoute | null>(null);

  const [userRoute, setUserRoute] =
    useState<UserRoute | null>(null);

  const [completedStops, setCompletedStops] =
    useState<CompletedStop[]>([]);

  const [userId, setUserId] =
    useState<string | null>(null);

  const [isLoading, setIsLoading] =
    useState(true);

  const [isStarting, setIsStarting] =
    useState(false);

  const [
    completingRestaurantId,
    setCompletingRestaurantId,
  ] = useState<string | null>(null);

  const [errorMessage, setErrorMessage] =
    useState('');

  const [successMessage, setSuccessMessage] =
    useState('');

  /*
   * Carga toda la información de la ruta.
   */
  useEffect(() => {
    async function loadRoute() {
      setIsLoading(true);
      setErrorMessage('');
      setSuccessMessage('');

     
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setUserId(user?.id ?? null);

      const {
        data: routeData,
        error: routeError,
      } = await supabase
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
            stop_order,
            notes,
            estimated_minutes,

            restaurant:restaurants (
              id,
              name,
              slug,
              short_description,
              address,
              average_rating
            )
          )
        `)
        .eq('id', routeId)
        .eq('status', 'published')
        .single();

      if (routeError || !routeData) {
        console.error(
          'Error cargando detalle de ruta:',
          routeError
        );

        setErrorMessage(
          'No se pudo cargar esta ruta gastronómica.'
        );

        setIsLoading(false);
        return;
      }

      const loadedRoute =
        routeData as unknown as GastroRoute;

    
      if (loadedRoute.restaurants) {
        loadedRoute.restaurants.sort(
          (a, b) =>
            a.stop_order - b.stop_order
        );
      }

      setRoute(loadedRoute);

      /*
       * Si no hay usuario autenticado,
       * solamente mostramos la ruta.
       */
      if (!user) {
        setIsLoading(false);
        return;
      }

      const {
        data: existingUserRoute,
        error: userRouteError,
      } = await supabase
        .from('user_routes')
        .select(`
          id,
          user_id,
          route_id,
          status,
          started_at,
          completed_at
        `)
        .eq('user_id', user.id)
        .eq('route_id', routeId)
        .maybeSingle();

      if (userRouteError) {
        console.error(
          'Error cargando progreso de ruta:',
          userRouteError
        );
      }

      if (existingUserRoute) {
        const currentUserRoute =
          existingUserRoute as UserRoute;

        setUserRoute(currentUserRoute);

       
        const {
          data: stopsData,
          error: stopsError,
        } = await supabase
          .from('user_route_stops')
          .select(`
            user_route_id,
            restaurant_id,
            visit_id,
            completed_at
          `)
          .eq(
            'user_route_id',
            currentUserRoute.id
          );

        if (stopsError) {
          console.error(
            'Error cargando paradas completadas:',
            stopsError
          );
        } else {
          setCompletedStops(
            (stopsData ??
              []) as CompletedStop[]
          );
        }
      }

      setIsLoading(false);
    }

    loadRoute();
  }, [routeId]);

  /*
   * Iniciar una ruta.
   */
  async function handleStartRoute() {
    if (!route) {
      return;
    }

    setErrorMessage('');
    setSuccessMessage('');

    /*
     * Obtenemos nuevamente el usuario
     * para evitar trabajar con una sesión vieja.
     */
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setErrorMessage(
        'Debes iniciar sesión para comenzar una ruta.'
      );
      return;
    }

    setUserId(user.id);
    setIsStarting(true);

    /*
     * Si ya existe la ruta del usuario,
     * solamente la ponemos en progreso.
     */
    if (userRoute) {
      if (userRoute.status === 'completed') {
        setSuccessMessage(
          'Esta ruta ya fue completada.'
        );

        setIsStarting(false);
        return;
      }

      const {
        data,
        error,
      } = await supabase
        .from('user_routes')
        .update({
          status: 'in_progress',
          started_at:
            userRoute.started_at ??
            new Date().toISOString(),
        })
        .eq('id', userRoute.id)
        .select(`
          id,
          user_id,
          route_id,
          status,
          started_at,
          completed_at
        `)
        .single();

      if (error) {
        console.error(
          'Error continuando ruta:',
          error
        );

        setErrorMessage(
          getUserFacingErrorMessage(error, 'No se pudo continuar la ruta.')
        );

        setIsStarting(false);
        return;
      }

      setUserRoute(data as UserRoute);

      setSuccessMessage(
        '✓ Ruta reanudada correctamente.'
      );

      setIsStarting(false);
      return;
    }

    /*
     * Si nunca la había iniciado,
     * creamos user_routes.
     */
    const {
      data,
      error,
    } = await supabase
      .from('user_routes')
      .insert({
        user_id: user.id,
        route_id: route.id,
        status: 'in_progress',
        started_at: new Date().toISOString(),
      })
      .select(`
        id,
        user_id,
        route_id,
        status,
        started_at,
        completed_at
      `)
      .single();

    if (error) {
      console.error(
        'Error iniciando ruta:',
        error
      );

      setErrorMessage(
        getUserFacingErrorMessage(error, 'No se pudo iniciar la ruta.')
      );

      setIsStarting(false);
      return;
    }

    setUserRoute(data as UserRoute);

    setSuccessMessage(
      '🚀 ¡Ruta iniciada! Ya puedes completar las paradas.'
    );

    setIsStarting(false);
  }

  
  async function handleCompleteStop(
    restaurantId: string
  ) {
    
    if (!userRoute || !userId || !route) {
      setErrorMessage(
        'Primero debes iniciar la ruta.'
      );

      return;
    }

    if (userRoute.status === 'completed') {
      setErrorMessage(
        'Esta ruta ya fue completada.'
      );

      return;
    }

    const alreadyCompleted =
      completedStops.some(
        (stop) =>
          stop.restaurant_id ===
          restaurantId
      );

    if (alreadyCompleted) {
      setSuccessMessage(
        'Esta parada ya está completada.'
      );

      return;
    }

    setCompletingRestaurantId(
      restaurantId
    );

    setErrorMessage('');
    setSuccessMessage('');

   
    const {
      data: verifiedVisit,
      error: visitError,
    } = await supabase
      .from('visits')
      .select('id')
      .eq('user_id', userId)
      .eq('restaurant_id', restaurantId)
      .eq(
        'verification_status',
        'verified'
      )
      .order('visited_at', {
        ascending: false,
      })
      .limit(1)
      .maybeSingle();

    if (visitError) {
      console.error(
        'Error comprobando visita:',
        visitError
      );

      setErrorMessage(
        getUserFacingErrorMessage(visitError, 'No se pudo comprobar la visita.')
      );

      setCompletingRestaurantId(null);
      return;
    }

   
    if (!verifiedVisit) {
      setErrorMessage(
        'Debes tener una visita verificada a este restaurante para completar esta parada.'
      );

      setCompletingRestaurantId(null);
      return;
    }

    
    const completedAt =
      new Date().toISOString();

    const {
      data: insertedStop,
      error: stopError,
    } = await supabase
      .from('user_route_stops')
      .insert({
        user_route_id: userRoute.id,
        restaurant_id: restaurantId,
        visit_id: verifiedVisit.id,
        completed_at: completedAt,
      })
      .select(`
        user_route_id,
        restaurant_id,
        visit_id,
        completed_at
      `)
      .single();

    if (stopError) {
      console.error(
        'Error completando parada:',
        stopError
      );

      setErrorMessage(
        getUserFacingErrorMessage(stopError, 'No se pudo completar la parada.')
      );

      setCompletingRestaurantId(null);
      return;
    }

    const newCompletedStop =
      insertedStop as CompletedStop;

   
    const updatedCompletedStops = [
      ...completedStops,
      newCompletedStop,
    ];

    setCompletedStops(
      updatedCompletedStops
    );

    
    const {
      data: routeStopsData,
      error: routeStopsError,
    } = await supabase
      .from('route_restaurants')
      .select('restaurant_id')
      .eq('route_id', route.id);

    if (routeStopsError) {
      console.error(
        'Error comprobando paradas de la ruta:',
        routeStopsError
      );

      setErrorMessage(
        getUserFacingErrorMessage(routeStopsError, 'La parada fue completada, pero no se pudo comprobar el progreso total.')
      );

      setCompletingRestaurantId(null);
      return;
    }

    const totalStops =
      routeStopsData?.length ?? 0;

  
    const {
      count: completedCount,
      error: completedCountError,
    } = await supabase
      .from('user_route_stops')
      .select('*', {
        count: 'exact',
        head: true,
      })
      .eq(
        'user_route_id',
        userRoute.id
      );

    if (completedCountError) {
      console.error(
        'Error contando paradas completadas:',
        completedCountError
      );

      setErrorMessage(
        getUserFacingErrorMessage(completedCountError, 'La parada fue completada, pero no se pudo comprobar el progreso.')
      );

      setCompletingRestaurantId(null);
      return;
    }

  
    if (
      totalStops > 0 &&
      (completedCount ?? 0) >= totalStops
    ) {
      const {
        data: completedRoute,
        error: completeRouteError,
      } = await supabase
        .from('user_routes')
        .update({
          status: 'completed',
          completed_at:
            new Date().toISOString(),
        })
        .eq('id', userRoute.id)
        .select(`
          id,
          user_id,
          route_id,
          status,
          started_at,
          completed_at
        `)
        .single();

      if (completeRouteError) {
        console.error(
          'Error completando ruta:',
          completeRouteError
        );

        setErrorMessage(
          getUserFacingErrorMessage(completeRouteError, 'La parada fue registrada, pero no se pudo finalizar la ruta.')
        );

        setCompletingRestaurantId(null);
        return;
      }

      setUserRoute(
        completedRoute as UserRoute
      );

      setSuccessMessage(
        `🏆 ¡Ruta completada! Has ganado ${route.points_reward} puntos.`
      );
    } else {
      setSuccessMessage(
        '✓ Parada completada correctamente.'
      );
    }

    setCompletingRestaurantId(null);
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <LoaderCircle className="h-8 w-8 animate-spin text-action" />

          <p className="text-sm text-muted-foreground">
            Cargando ruta gastronómica...
          </p>
        </div>
      </div>
    );
  }


  if (!route) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-danger/25 bg-danger-soft p-8 text-center">
        <RouteIcon className="mx-auto mb-4 h-10 w-10 text-red-500" />

        <h1 className="text-xl font-bold text-danger">
          Ruta no disponible
        </h1>

        <p className="mt-2 text-sm text-danger">
          {errorMessage ||
            'No encontramos esta ruta gastronómica.'}
        </p>

        <Button
          asChild
          className="mt-6"
        >
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al inicio
          </Link>
        </Button>
      </div>
    );
  }

  const routeImage =
    getRouteImage(route);

  const totalStops =
    route.restaurants?.length ?? 0;

  const completedStopsCount =
    completedStops.filter((stop) =>
      route.restaurants?.some(
        (routeStop) =>
          routeStop.restaurant_id ===
          stop.restaurant_id
      )
    ).length;

  const progress =
    totalStops > 0
      ? Math.min(
          (completedStopsCount /
            totalStops) *
            100,
          100
        )
      : 0;

  const isCompleted =
    userRoute?.status === 'completed';

  const isInProgress =
    userRoute?.status === 'in_progress';

  return (
    <div className="space-y-8">
      {/* Volver */}
      <div>
        <Button
          asChild
          variant="ghost"
          size="sm"
        >
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a rutas
          </Link>
        </Button>
      </div>

      {/* HERO */}
      <section className="overflow-hidden rounded-3xl border border-border bg-white shadow-lg">
        <div className="relative min-h-[320px] overflow-hidden bg-gradient-to-br from-primary to-primary/70">
          {routeImage && (
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: `url("${routeImage}")`,
              }}
            />
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10" />

          <div className="relative flex min-h-[320px] flex-col justify-end p-6 text-white md:p-10">
            <div className="mb-4 flex flex-wrap gap-2">
              <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur">
                {formatDifficulty(
                  route.difficulty
                )}
              </span>

              {route.is_featured && (
                <span className="rounded-full bg-secondary px-3 py-1 text-xs font-bold text-text-dark">
                  Destacada
                </span>
              )}

              {isCompleted && (
                <span className="flex items-center gap-1 rounded-full bg-green-600 px-3 py-1 text-xs font-bold">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Completada
                </span>
              )}

              {!isCompleted &&
                isInProgress && (
                  <span className="rounded-full bg-blue-600 px-3 py-1 text-xs font-bold">
                    En progreso
                  </span>
                )}
            </div>

            <h1 className="max-w-3xl text-3xl font-bold md:text-5xl">
              {route.name}
            </h1>

            {route.description && (
              <p className="mt-4 max-w-3xl text-sm leading-relaxed text-white/90 md:text-base">
                {route.description}
              </p>
            )}
          </div>
        </div>

        {/* Información */}
        <div className="grid grid-cols-2 gap-4 p-6 md:grid-cols-4">
          <div className="rounded-xl bg-muted/50 p-4">
            <MapPin className="mb-2 h-5 w-5 text-action" />

            <p className="text-xl font-bold">
              {totalStops}
            </p>

            <p className="text-xs text-muted-foreground">
              Paradas
            </p>
          </div>

          <div className="rounded-xl bg-muted/50 p-4">
            <Clock className="mb-2 h-5 w-5 text-action" />

            <p className="font-bold">
              {formatDuration(
                route.estimated_minutes
              )}
            </p>

            <p className="text-xs text-muted-foreground">
              Duración
            </p>
          </div>

          <div className="rounded-xl bg-muted/50 p-4">
            <Navigation className="mb-2 h-5 w-5 text-action" />

            <p className="font-bold">
              {route.distance_km !== null
                ? `${Number(
                    route.distance_km
                  ).toLocaleString(
                    'es-NI',
                    {
                      maximumFractionDigits: 1,
                    }
                  )} km`
                : 'Variable'}
            </p>

            <p className="text-xs text-muted-foreground">
              Distancia
            </p>
          </div>

          <div className="rounded-xl bg-secondary/10 p-4">
            <Trophy className="mb-2 h-5 w-5 text-secondary" />

            <p className="text-xl font-bold text-secondary">
              +{route.points_reward}
            </p>

            <p className="text-xs text-muted-foreground">
              Puntos
            </p>
          </div>
        </div>
      </section>

      {/* Mensajes */}
      {errorMessage && (
        <div className="rounded-xl border border-danger/25 bg-danger-soft p-4 text-sm text-danger">
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div className="rounded-xl border border-success/25 bg-success-soft p-4 text-sm font-medium text-success">
          {successMessage}
        </div>
      )}

      {/* Estado */}
      {!userId && (
        <section className="rounded-2xl border border-border bg-white p-6 text-center shadow-sm">
          <Trophy className="mx-auto mb-3 h-8 w-8 text-secondary" />

          <h2 className="font-bold">
            ¿Quieres completar esta ruta?
          </h2>

          <p className="mt-2 text-sm text-muted-foreground">
            Inicia sesión para registrar tu
            progreso y ganar puntos.
          </p>

          <Button
            asChild
            className="mt-5"
          >
            <Link href="/auth/login">
              Iniciar sesión
            </Link>
          </Button>
        </section>
      )}

      {userId && !userRoute && (
        <section className="rounded-2xl border border-primary/20 bg-primary/5 p-6">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
            <div>
              <h2 className="text-xl font-bold">
                ¿Listo para comenzar?
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Inicia esta ruta y completa
                sus {totalStops} paradas para
                ganar {route.points_reward}{' '}
                puntos.
              </p>
            </div>

            <Button
              onClick={
                handleStartRoute
              }
              disabled={isStarting}
            >
              {isStarting ? (
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Play className="mr-2 h-4 w-4" />
              )}

              Iniciar ruta
            </Button>
          </div>
        </section>
      )}

      {/* Progreso */}
      {userRoute && (
        <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-4">
            <div>
              <h2 className="font-bold">
                Tu progreso
              </h2>

              <p className="text-sm text-muted-foreground">
                {completedStopsCount} de{' '}
                {totalStops} paradas
                completadas
              </p>
            </div>

            <span className="text-xl font-bold text-action">
              {Math.round(progress)}%
            </span>
          </div>

          <div className="h-3 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-action transition-all duration-500"
              style={{
                width: `${progress}%`,
              }}
            />
          </div>

          {isCompleted && (
            <div className="mt-5 flex items-center gap-3 rounded-xl bg-success-soft p-4 text-success">
              <Trophy className="h-6 w-6" />

              <div>
                <p className="font-bold">
                  ¡Ruta completada!
                </p>

                <p className="text-sm">
                  Ganaste{' '}
                  {route.points_reward}{' '}
                  puntos.
                </p>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Paradas */}
      <section>
        <div className="mb-6">
          <h2 className="text-2xl font-bold">
            Paradas de la ruta
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Visita cada restaurante para
            completar la experiencia.
          </p>
        </div>

        {totalStops === 0 ? (
          <div className="rounded-2xl border border-border bg-white p-8 text-center">
            <RouteIcon className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />

            <p className="text-sm text-muted-foreground">
              Esta ruta todavía no tiene
              restaurantes asociados.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {route.restaurants?.map(
              (stop) => {
                const completed =
                  completedStops.some(
                    (item) =>
                      item.restaurant_id ===
                      stop.restaurant_id
                  );

                const restaurant =
                  stop.restaurant;

                return (
                  <article
                    key={
                      stop.restaurant_id
                    }
                    className={`rounded-2xl border bg-white p-5 shadow-sm transition ${
                      completed
                        ? 'border-green-300 bg-green-50/30'
                        : 'border-border'
                    }`}
                  >
                    <div className="flex flex-col gap-5 md:flex-row md:items-center">
                      {/* Número */}
                      <div
                        className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full font-bold ${
                          completed
                            ? 'bg-green-600 text-white'
                            : 'bg-action text-white'
                        }`}
                      >
                        {completed ? (
                          <CheckCircle2 className="h-6 w-6" />
                        ) : (
                          stop.stop_order
                        )}
                      </div>

                      {/* Información */}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-bold">
                            {restaurant?.name ??
                              'Restaurante'}
                          </h3>

                          {completed && (
                            <span className="rounded-full bg-success-soft px-2 py-1 text-xs font-semibold text-success">
                              Completada
                            </span>
                          )}
                        </div>

                        {restaurant?.short_description && (
                          <p className="mt-1 text-sm text-muted-foreground">
                            {
                              restaurant.short_description
                            }
                          </p>
                        )}

                        <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
                          {restaurant?.address && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5" />

                              {
                                restaurant.address
                              }
                            </span>
                          )}

                          {restaurant?.average_rating !==
                            null &&
                            restaurant?.average_rating !==
                              undefined && (
                              <span className="flex items-center gap-1">
                                <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />

                                {Number(
                                  restaurant.average_rating
                                ).toFixed(
                                  1
                                )}
                              </span>
                            )}

                          {stop.estimated_minutes && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />

                              {formatDuration(
                                stop.estimated_minutes
                              )}
                            </span>
                          )}
                        </div>

                        {stop.notes && (
                          <p className="mt-3 rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">
                            {stop.notes}
                          </p>
                        )}
                      </div>

                      {/* Acciones */}
                      <div className="flex flex-shrink-0 flex-col gap-2 sm:flex-row md:flex-col">
                        {restaurant && (
                          <Button
                            asChild
                            variant="outline"
                            size="sm"
                          >
                            <Link
                              href={`/restaurant/${restaurant.id}`}
                            >
                              Ver restaurante
                            </Link>
                          </Button>
                        )}

                        {userRoute &&
                          !isCompleted &&
                          !completed && (
                            <Button
                              size="sm"
                              onClick={() =>
                                handleCompleteStop(
                                  stop.restaurant_id
                                )
                              }
                              disabled={
                                completingRestaurantId ===
                                stop.restaurant_id
                              }
                            >
                              {completingRestaurantId ===
                              stop.restaurant_id ? (
                                <>
                                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                                  Comprobando...
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="mr-2 h-4 w-4" />
                                  Completar parada
                                </>
                              )}
                            </Button>
                          )}

                        {completed && (
                          <div className="flex items-center justify-center gap-2 rounded-lg bg-success-soft px-4 py-2 text-sm font-semibold text-success">
                            <CheckCircle2 className="h-4 w-4" />
                            Visitado
                          </div>
                        )}
                      </div>
                    </div>
                  </article>
                );
              }
            )}
          </div>
        )}
      </section>
    </div>
  );
}