'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ComponentType } from 'react';

import Image from 'next/image';
import Link from 'next/link';

import {
  AlertCircle,
  Bookmark,
  CalendarDays,
  CheckCircle2,
  CircleOff,
  LoaderCircle,
  MapPin,
  Navigation,
  Plus,
  Route as RouteIcon,
  Sparkles,
  Trash2,
  Users,
  Wallet,
} from 'lucide-react';

import userRouteLogo from '@/app/icon.png';

import { MainLayout } from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';

import { createClient } from '@/lib/supabase/client';
import { useConfirm } from '@/components/common/confirm-dialog';
import { getUserFacingErrorMessage } from '@/lib/supabase/errors';

const supabase = createClient();

/* ============================================================
 * TYPES
 * ========================================================== */

type RouteStatus =
  | 'saved'
  | 'in_progress'
  | 'completed'
  | 'abandoned';

type ActiveTab =
  | 'saved'
  | 'in_progress'
  | 'completed';

interface RouteRestaurant {
  name: string;
}

interface MyRouteStop {
  id: string;

  stop_order: number;

  completed_at: string | null;

  restaurant:
    | RouteRestaurant
    | null;
}

interface MyRoute {
  id: string;

  name: string;

  status: RouteStatus;

  party_size: number;

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
    | MyRouteStop[]
    | null;
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
  if (value === null) {
    return null;
  }

  const numeric = Number(value);

  if (!Number.isFinite(numeric)) {
    return null;
  }

  return new Intl.NumberFormat('es-NI', {
    style: 'currency',
    currency: 'NIO',
    maximumFractionDigits: 0,
  }).format(numeric);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('es-NI', {
    timeZone: 'America/Managua',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

function getStatusLabel(
  status: RouteStatus,
) {
  if (status === 'in_progress') {
    return 'En progreso';
  }

  if (status === 'completed') {
    return 'Completada';
  }

  if (status === 'abandoned') {
    return 'Abandonada';
  }

  return 'Guardada';
}

/* ============================================================
 * PAGE
 * ========================================================== */

export default function MyRoutesPage() {
  const [
    routes,
    setRoutes,
  ] = useState<MyRoute[]>([]);

  const [
    activeTab,
    setActiveTab,
  ] = useState<ActiveTab>('in_progress');

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    notAuthenticated,
    setNotAuthenticated,
  ] = useState(false);

  const [
    actionRouteId,
    setActionRouteId,
  ] = useState<string | null>(null);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState('');

  const [
    successMessage,
    setSuccessMessage,
  ] = useState('');

  /* ========================================================
   * LOAD ROUTES
   * ====================================================== */

  useEffect(() => {
    let mounted = true;

    async function loadRoutes() {
      setLoading(true);
      setErrorMessage('');

      const {
        data: {
          user,
        },
      } =
        await supabase.auth.getUser();

      if (!mounted) {
        return;
      }

      if (!user) {
        setNotAuthenticated(true);
        setLoading(false);

        return;
      }

      const {
        data,
        error,
      } =
        await supabase
          .from('user_generated_routes')
          .select(`
            id,
            name,
            status,
            party_size,
            planned_start_at,
            estimated_total_min,
            estimated_total_max,
            has_unknown_prices,
            created_at,
            started_at,
            completed_at,

            municipality:municipalities (
              name
            ),

            stops:user_generated_route_stops (
              id,
              stop_order,
              completed_at,

              restaurant:restaurants (
                name
              )
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', {
            ascending: false,
          });

      if (!mounted) {
        return;
      }

      if (error) {
        console.error(
          'Error cargando mis rutas:',
          error,
        );

        setErrorMessage(
          'No pudimos cargar tus rutas.',
        );

        setLoading(false);

        return;
      }

      const loaded =
        (data ?? []) as unknown as MyRoute[];

      for (const route of loaded) {
        route.stops =
          (route.stops ?? []).sort(
            (a, b) =>
              a.stop_order -
              b.stop_order,
          );
      }

      setRoutes(loaded);

      /*
       * Elegimos automáticamente
       * una pestaña que tenga contenido.
       */
      const hasInProgress =
        loaded.some(
          (route) =>
            route.status ===
            'in_progress',
        );

      const hasSaved =
        loaded.some(
          (route) =>
            route.status ===
            'saved',
        );

      if (hasInProgress) {
        setActiveTab('in_progress');
      } else if (hasSaved) {
        setActiveTab('saved');
      } else {
        setActiveTab('completed');
      }

      setLoading(false);
    }

    loadRoutes();

    return () => {
      mounted = false;
    };
  }, []);

  /* ========================================================
   * COUNTS
   * ====================================================== */

  const counts = useMemo(
    () => ({
      saved:
        routes.filter(
          (route) =>
            route.status ===
            'saved',
        ).length,

      in_progress:
        routes.filter(
          (route) =>
            route.status ===
            'in_progress',
        ).length,

      completed:
        routes.filter(
          (route) =>
            route.status ===
            'completed',
        ).length,
    }),
    [routes],
  );

  /* ========================================================
   * FILTER
   * ====================================================== */

  const visibleRoutes =
    useMemo(
      () =>
        routes.filter(
          (route) =>
            route.status ===
            activeTab,
        ),
      [
        routes,
        activeTab,
      ],
    );

  /* ========================================================
   * DELETE SAVED ROUTE
   * ====================================================== */

  const confirm = useConfirm();

  async function handleDeleteRoute(
    routeId: string,
  ) {
    const confirmed =
      await confirm({
        title: '¿Eliminar esta ruta guardada?',
        description: 'Esta acción no se puede deshacer.',
        confirmLabel: 'Eliminar ruta',
        tone: 'danger',
      });

    if (!confirmed) {
      return;
    }

    setActionRouteId(routeId);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const {
        data: {
          user,
        },
      } =
        await supabase.auth.getUser();

      if (!user) {
        setErrorMessage(
          'Debes iniciar sesión.',
        );

        return;
      }

      const {
        error,
      } =
        await supabase
          .from('user_generated_routes')
          .delete()
          .eq('id', routeId)
          .eq('user_id', user.id)
          .eq('status', 'saved');

      if (error) {
        throw error;
      }

      setRoutes(
        (current) =>
          current.filter(
            (route) =>
              route.id !== routeId,
          ),
      );

      setSuccessMessage(
        'Ruta eliminada correctamente.',
      );

    } catch (error) {
      console.error(
        'Error eliminando ruta:',
        error,
      );

      setErrorMessage(
        getUserFacingErrorMessage(error, 'No pudimos eliminar la ruta.'),
      );

    } finally {
      setActionRouteId(null);
    }
  }

  /* ========================================================
   * ABANDON ACTIVE ROUTE
   * ====================================================== */

  async function handleAbandonRoute(
    routeId: string,
  ) {
    const confirmed =
      await confirm({
        title: '¿Seguro que quieres abandonar esta ruta?',
        confirmLabel: 'Abandonar ruta',
        tone: 'danger',
      });

    if (!confirmed) {
      return;
    }

    setActionRouteId(routeId);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const {
        data: {
          user,
        },
      } =
        await supabase.auth.getUser();

      if (!user) {
        setErrorMessage(
          'Debes iniciar sesión.',
        );

        return;
      }

      const now =
        new Date().toISOString();

      const {
        error,
      } =
        await supabase
          .from('user_generated_routes')
          .update({
            status: 'abandoned',
            updated_at: now,
          })
          .eq('id', routeId)
          .eq('user_id', user.id)
          .eq(
            'status',
            'in_progress',
          );

      if (error) {
        throw error;
      }

      setRoutes(
        (current) =>
          current.map(
            (route) =>
              route.id === routeId
                ? {
                    ...route,
                    status:
                      'abandoned',
                  }
                : route,
          ),
      );

      setSuccessMessage(
        'La ruta fue abandonada.',
      );

    } catch (error) {
      console.error(
        'Error abandonando ruta:',
        error,
      );

      setErrorMessage(
        getUserFacingErrorMessage(error, 'No pudimos abandonar la ruta.'),
      );

    } finally {
      setActionRouteId(null);
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
            <div className="flex flex-col items-center gap-3">
              <LoaderCircle className="h-7 w-7 animate-spin text-action" />

              <p className="text-sm text-muted-foreground">
                Cargando tus rutas...
              </p>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  /* ========================================================
   * NOT AUTHENTICATED
   * ====================================================== */

  if (notAuthenticated) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-canvas px-4 py-20">
          <div className="mx-auto max-w-xl rounded-sheet border border-border/70 bg-white p-8 text-center shadow-sm">

            <RouteIcon className="mx-auto h-10 w-10 text-action" />

            <h1 className="mt-4 text-2xl font-bold text-ink">
              Tus rutas te esperan
            </h1>

            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Inicia sesión para guardar,
              iniciar y seguir tus rutas
              gastronómicas.
            </p>

            <Button
              asChild
              className="mt-6 rounded-xl"
            >
              <Link href="/auth/login">
                Iniciar sesión
              </Link>
            </Button>

          </div>
        </div>
      </MainLayout>
    );
  }

  /* ========================================================
   * RENDER
   * ====================================================== */

  return (
    <MainLayout>

      <div className="min-h-screen bg-canvas pb-20">

        {/* HERO */}

        <section className="relative overflow-hidden border-b border-border/60 bg-white">



          <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">

            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">

              <div>

                <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.08em] text-action">

                  <Sparkles className="h-3.5 w-3.5" />

                  Tu espacio GastroNic

                </div>

                <h1 className="mt-4 text-3xl font-bold tracking-[-0.04em] text-ink sm:text-5xl">

                  Mis rutas

                </h1>

                <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">

                  Guarda experiencias,
                  continúa recorridos y
                  recuerda las rutas que ya
                  completaste.

                </p>

              </div>

              <Button
                asChild
                size="lg"
                className="h-12 rounded-xl px-6 font-bold"
              >

                <Link href="/routes/create">

                  <Plus className="mr-2 h-4 w-4" />

                  Crear nueva ruta

                </Link>

              </Button>

            </div>

          </div>

        </section>

        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">

          {/* MESSAGES */}

          {errorMessage && (
            <div className="mb-6 flex items-start gap-3 rounded-2xl border border-danger/25 bg-danger-soft p-4 text-sm text-danger">

              <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />

              {errorMessage}

            </div>
          )}

          {successMessage && (
            <div className="mb-6 flex items-start gap-3 rounded-2xl border border-success/25 bg-success-soft p-4 text-sm text-success">

              <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0" />

              {successMessage}

            </div>
          )}

          {/* TABS */}

          <div className="overflow-x-auto pb-2">

            <div className="inline-flex min-w-full gap-2 rounded-2xl border border-border/70 bg-white p-2 sm:min-w-0">

              <RouteTab
                active={
                  activeTab ===
                  'saved'
                }
                icon={Bookmark}
                label="Guardadas"
                count={counts.saved}
                onClick={() =>
                  setActiveTab(
                    'saved',
                  )
                }
              />

              <RouteTab
                active={
                  activeTab ===
                  'in_progress'
                }
                icon={Navigation}
                label="En progreso"
                count={
                  counts.in_progress
                }
                onClick={() =>
                  setActiveTab(
                    'in_progress',
                  )
                }
              />

              <RouteTab
                active={
                  activeTab ===
                  'completed'
                }
                icon={
                  CheckCircle2
                }
                label="Completadas"
                count={
                  counts.completed
                }
                onClick={() =>
                  setActiveTab(
                    'completed',
                  )
                }
              />

            </div>

          </div>

          {/* EMPTY */}

          {visibleRoutes.length === 0 ? (

            <EmptyState
              activeTab={
                activeTab
              }
            />

          ) : (

            <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">

              {visibleRoutes.map(
                (route) => (

                  <RouteCard
                    key={
                      route.id
                    }
                    route={
                      route
                    }
                    busy={
                      actionRouteId ===
                      route.id
                    }
                    onDelete={() =>
                      handleDeleteRoute(
                        route.id,
                      )
                    }
                    onAbandon={() =>
                      handleAbandonRoute(
                        route.id,
                      )
                    }
                  />

                ),
              )}

            </div>

          )}

        </div>

      </div>

    </MainLayout>
  );
}

/* ============================================================
 * TAB
 * ========================================================== */

function RouteTab({
  active,
  icon: Icon,
  label,
  count,
  onClick,
}: {
  active: boolean;

  icon: ComponentType<{
    className?: string;
  }>;

  label: string;

  count: number;

  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-4 py-3 text-sm font-bold transition ${
        active
          ? 'bg-action text-white shadow-sm'
          : 'text-muted-foreground hover:bg-canvas hover:text-ink'
      }`}
    >

      <Icon className="h-4 w-4" />

      {label}

      <span
        className={`rounded-full px-2 py-0.5 text-xs ${
          active
            ? 'bg-white/20 text-white'
            : 'bg-muted text-muted-foreground'
        }`}
      >
        {count}
      </span>

    </button>
  );
}

/* ============================================================
 * ROUTE CARD
 * ========================================================== */

function RouteCard({
  route,
  busy,
  onDelete,
  onAbandon,
}: {
  route: MyRoute;

  busy: boolean;

  onDelete: () => void;

  onAbandon: () => void;
}) {
  const stops =
    route.stops ?? [];

  const completedStops =
    stops.filter(
      (stop) =>
        Boolean(
          stop.completed_at,
        ),
    ).length;

  const totalStops =
    stops.length;

  const progress =
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

  const min =
    formatMoney(
      route.estimated_total_min,
    );

  const max =
    formatMoney(
      route.estimated_total_max,
    );

  return (
    <article className="overflow-hidden rounded-card border border-border/70 bg-white shadow-none">

      {/* IMAGE */}

      <div className="relative flex h-52 items-center justify-center overflow-hidden bg-gradient-to-br from-[#E3F5F2] via-white to-[#FFF5D8]">

        <RouteIcon className="absolute h-40 w-40 text-primary/[0.04]" />

        <div className="relative flex h-28 w-28 items-center justify-center rounded-card border border-white bg-white/80 p-3 shadow-lg">

          <Image
            src={userRouteLogo}
            alt="GastroNic Tour"
            width={100}
            height={100}
            className="h-full w-full object-contain"
          />

        </div>

        <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.08em] text-action shadow-sm">

          Ruta personalizada

        </span>

        <span className="absolute right-4 top-4 rounded-full bg-ink/85 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.08em] text-white">

          {getStatusLabel(
            route.status,
          )}

        </span>

      </div>

      {/* BODY */}

      <div className="p-5">

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">

          <MapPin className="h-3.5 w-3.5 text-action" />

          {route.municipality
            ?.name ??
            'Nicaragua'}

        </div>

        <h2 className="mt-2 line-clamp-2 text-xl font-bold text-ink">

          {route.name}

        </h2>

        <div className="mt-4 grid grid-cols-2 gap-2">

          <SmallInfo
            icon={
              CalendarDays
            }
            text={formatDate(
              route.planned_start_at,
            )}
          />

          <SmallInfo
            icon={Users}
            text={`${route.party_size} ${
              route.party_size ===
              1
                ? 'persona'
                : 'personas'
            }`}
          />

        </div>

        {/* BUDGET */}

        <div className="mt-3 rounded-xl bg-canvas p-3">

          <div className="flex items-center gap-2 text-xs text-muted-foreground">

            <Wallet className="h-4 w-4 text-action" />

            {route.has_unknown_prices
              ? 'Estimación parcial'
              : 'Presupuesto estimado'}

          </div>

          <p className="mt-1 text-sm font-bold text-ink">

            {min ??
              'Por confirmar'}

            {max &&
              max !== min &&
              ` – ${max}`}

          </p>

          {route.has_unknown_prices && (
            <p className="mt-1 text-xs font-semibold text-action">
              + precios por confirmar
            </p>
          )}

        </div>

        {/* PROGRESS */}

        {route.status !==
          'saved' && (

          <div className="mt-4">

            <div className="flex items-center justify-between text-xs">

              <span className="font-semibold text-muted-foreground">
                Progreso
              </span>

              <span className="font-bold text-action">
                {completedStops}/
                {totalStops}
              </span>

            </div>

            <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#E8EFED]">

              <div
                className="h-full rounded-full bg-action transition-all"
                style={{
                  width: `${
                    route.status ===
                    'completed'
                      ? 100
                      : progress
                  }%`,
                }}
              />

            </div>

          </div>

        )}

        {/* STOPS PREVIEW */}

        {stops.length >
          0 && (

          <div className="mt-4 border-t border-border/60 pt-4">

            <p className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">

              {stops.length}{' '}

              {stops.length === 1
                ? 'parada'
                : 'paradas'}

            </p>

            <div className="mt-2 space-y-1.5">

              {stops
                .slice(0, 3)
                .map(
                  (stop) => (

                    <div
                      key={
                        stop.id
                      }
                      className="flex items-center gap-2 text-xs text-ink"
                    >

                      {stop.completed_at ? (

                        <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-success" />

                      ) : (

                        <span className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-action">

                          {
                            stop.stop_order
                          }

                        </span>

                      )}

                      <span className="truncate">

                        {stop.restaurant
                          ?.name ??
                          'Restaurante'}

                      </span>

                    </div>

                  ),
                )}

            </div>

          </div>

        )}

        {/* ACTIONS */}

        <div className="mt-5 flex gap-2">

          <Button
            asChild
            className="flex-1 rounded-xl font-bold"
          >

            <Link
              href={`/routes/personalized/${route.id}`}
            >

              {route.status ===
              'in_progress'
                ? 'Continuar ruta'
                : route.status ===
                    'completed'
                  ? 'Ver recorrido'
                  : 'Ver detalle'}

            </Link>

          </Button>

          {route.status ===
            'saved' && (

            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={onDelete}
              className="h-10 w-10 rounded-xl p-0 text-danger hover:bg-danger-soft hover:text-danger"
              aria-label="Eliminar ruta"
            >

              {busy ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}

            </Button>

          )}

          {route.status ===
            'in_progress' && (

            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={onAbandon}
              className="h-10 w-10 rounded-xl p-0 text-muted-foreground hover:bg-warning-soft hover:text-warning"
              aria-label="Abandonar ruta"
            >

              {busy ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <CircleOff className="h-4 w-4" />
              )}

            </Button>

          )}

        </div>

      </div>

    </article>
  );
}

/* ============================================================
 * SMALL INFO
 * ========================================================== */

function SmallInfo({
  icon: Icon,
  text,
}: {
  icon: ComponentType<{
    className?: string;
  }>;

  text: string;
}) {
  return (
    <div className="rounded-xl bg-canvas p-3">

      <Icon className="h-4 w-4 text-action" />

      <p className="mt-1.5 text-xs font-bold text-ink">
        {text}
      </p>

    </div>
  );
}

/* ============================================================
 * EMPTY STATE
 * ========================================================== */

function EmptyState({
  activeTab,
}: {
  activeTab: ActiveTab;
}) {
  let title =
    'No tienes rutas guardadas';

  let description =
    'Crea una ruta personalizada y aparecerá aquí.';

  let Icon = Bookmark;

  if (
    activeTab ===
    'in_progress'
  ) {
    title =
      'No tienes rutas en progreso';

    description =
      'Cuando inicies una ruta, podrás continuarla desde aquí.';

    Icon = Navigation;
  }

  if (
    activeTab ===
    'completed'
  ) {
    title =
      'Todavía no has completado rutas';

    description =
      'Tus experiencias terminadas aparecerán aquí para que puedas recordarlas.';

    Icon = CheckCircle2;
  }

  return (
    <div className="mt-8 rounded-sheet border border-dashed border-border bg-white px-6 py-14 text-center">

      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">

        <Icon className="h-6 w-6 text-action" />

      </div>

      <h2 className="mt-5 text-xl font-bold text-ink">
        {title}
      </h2>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
        {description}
      </p>

      <Button
        asChild
        className="mt-6 rounded-xl"
      >
        <Link href="/routes/create">

          <Plus className="mr-2 h-4 w-4" />

          Crear una ruta

        </Link>
      </Button>

    </div>
  );
}