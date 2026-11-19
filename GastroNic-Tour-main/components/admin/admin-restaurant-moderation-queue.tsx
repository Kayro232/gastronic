'use client';

import {
  useMemo,
  useState,
} from 'react';

import Link from 'next/link';

import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Filter,
  RotateCcw,
  Search,
  Store,
  TimerReset,
  UserRound,
  XCircle,
} from 'lucide-react';

export interface ModerationRestaurant {
  id: string;
  name: string;

  short_description:
    | string
    | null;

  status: string;

  rejection_reason:
    | string
    | null;

  created_by: string;

  created_at: string;
  updated_at: string;

  owner_name: string;

  owner_username:
    | string
    | null;
}

interface Props {
  initialRestaurants:
    ModerationRestaurant[];

  initialPendingCount:
    number;

  initialRejectedCount:
    number;

  initialErrorMessage?:
    | string
    | null;
}

type ModerationFilter =
  | 'all'
  | 'pending'
  | 'rejected';

type OrderFilter =
  | 'priority'
  | 'newest'
  | 'oldest';

/* ========================================================== */
/* COMPONENT                                                  */
/* ========================================================== */

export function AdminRestaurantModerationQueue({
  initialRestaurants,
  initialPendingCount,
  initialRejectedCount,
  initialErrorMessage = null,
}: Props) {
  const [
    search,
    setSearch,
  ] = useState('');

  const [
    statusFilter,
    setStatusFilter,
  ] =
    useState<ModerationFilter>(
      'all'
    );

  const [
    order,
    setOrder,
  ] =
    useState<OrderFilter>(
      'priority'
    );

  /* ======================================================== */
  /* FILTER                                                   */
  /* ======================================================== */

  const filteredRestaurants =
    useMemo(() => {
      const term =
        search
          .trim()
          .toLowerCase();

      const result =
        initialRestaurants.filter(
          (restaurant) => {
            const statusMatch =
              statusFilter ===
                'all' ||
              restaurant.status ===
                statusFilter;

            const searchMatch =
              !term ||
              restaurant.name
                .toLowerCase()
                .includes(term) ||
              restaurant.owner_name
                .toLowerCase()
                .includes(term) ||
              restaurant.owner_username
                ?.toLowerCase()
                .includes(term) ||
              restaurant.short_description
                ?.toLowerCase()
                .includes(term) ||
              restaurant.id
                .toLowerCase()
                .includes(term);

            return (
              statusMatch &&
              searchMatch
            );
          }
        );

      return [
        ...result,
      ].sort(
        (a, b) => {
          if (
            order ===
            'newest'
          ) {
            return (
              new Date(
                b.created_at
              ).getTime() -
              new Date(
                a.created_at
              ).getTime()
            );
          }

          if (
            order ===
            'oldest'
          ) {
            return (
              new Date(
                a.created_at
              ).getTime() -
              new Date(
                b.created_at
              ).getTime()
            );
          }

          const priority = {
            pending: 1,
            rejected: 2,
          };

          const statusDifference =
            (
              priority[
                a.status as keyof typeof priority
              ] ??
              99
            ) -
            (
              priority[
                b.status as keyof typeof priority
              ] ??
              99
            );

          if (
            statusDifference !==
            0
          ) {
            return statusDifference;
          }

          return (
            new Date(
              a.created_at
            ).getTime() -
            new Date(
              b.created_at
            ).getTime()
          );
        }
      );
    }, [
      initialRestaurants,
      order,
      search,
      statusFilter,
    ]);

  const oldestPending =
    useMemo(() => {
      return initialRestaurants
        .filter(
          (restaurant) =>
            restaurant.status ===
            'pending'
        )
        .sort(
          (a, b) =>
            new Date(
              a.created_at
            ).getTime() -
            new Date(
              b.created_at
            ).getTime()
        )[0] ?? null;
    }, [initialRestaurants]);

  const oldestAge =
    oldestPending
      ? getRequestAge(
          oldestPending.created_at
        )
      : null;

  const hasFilters =
    Boolean(
      search.trim()
    ) ||
    statusFilter !==
      'all' ||
    order !==
      'priority';

  function clearFilters() {
    setSearch('');
    setStatusFilter(
      'all'
    );
    setOrder(
      'priority'
    );
  }

  return (
    <div className="space-y-5">
      {/* ====================================================== */}
      {/* LOAD FEEDBACK                                          */}
      {/* ====================================================== */}

      {initialErrorMessage && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-2xl border border-danger/25 bg-danger-soft px-4 py-3.5 text-sm text-danger"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>
            {initialErrorMessage}
          </span>
        </div>
      )}

      {/* ====================================================== */}
      {/* OPERATIONAL SUMMARY                                    */}
      {/* ====================================================== */}

      <section className="grid gap-3 md:grid-cols-3">
        <SummaryCard
          icon={Clock3}
          label="Pendientes"
          value={
            initialPendingCount
          }
          helper="Esperan una decisión"
          tone="attention"
        />

        <SummaryCard
          icon={XCircle}
          label="Correcciones"
          value={
            initialRejectedCount
          }
          helper="Rechazadas en seguimiento"
          tone="danger"
        />

        <SummaryCard
          icon={TimerReset}
          label="Mayor espera"
          value={
            oldestAge?.label ??
            'Al día'
          }
          helper={
            oldestPending
              ? 'Solicitud pendiente más antigua'
              : 'No hay solicitudes pendientes'
          }
          tone="neutral"
          textValue
        />
      </section>

      {/* ====================================================== */}
      {/* OLDEST PENDING                                         */}
      {/* ====================================================== */}

      {oldestPending && (
        <section className="flex flex-col gap-4 rounded-2xl border border-warning/25 bg-amber-50/70 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="flex min-w-0 items-start gap-3.5">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white text-warning shadow-sm">
              <AlertCircle className="h-4.5 w-4.5" />
            </div>

            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.08em] text-amber-700/70">
                Prioridad de revisión
              </p>

              <p className="mt-1 truncate text-sm font-bold text-ink">
                {oldestPending.name}
              </p>

              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Lleva {oldestAge?.label.toLowerCase()} esperando una decisión.
              </p>
            </div>
          </div>

          <Link
            href={`/admin/restaurants/${oldestPending.id}`}
            className="inline-flex h-10 flex-shrink-0 items-center justify-center gap-2 rounded-xl bg-[#0E2725] px-4 text-xs font-bold text-white transition hover:bg-action"
          >
            Revisar ahora
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </section>
      )}

      {/* ====================================================== */}
      {/* FILTERS                                                */}
      {/* ====================================================== */}

      <section className="rounded-2xl border border-border/70 bg-white p-4 shadow-none">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_190px_190px_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

            <input
              value={search}
              onChange={(
                event
              ) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Buscar restaurante, propietario o ID..."
              aria-label="Buscar solicitudes"
              className="h-11 w-full rounded-xl border border-border bg-canvas pl-10 pr-4 text-sm outline-none transition placeholder:text-muted-foreground/65 focus:border-primary/30 focus:bg-white focus:ring-4 focus:ring-primary/[0.06]"
            />
          </div>

          <SelectField
            value={
              statusFilter
            }
            onChange={(
              value
            ) =>
              setStatusFilter(
                value as ModerationFilter
              )
            }
            ariaLabel="Filtrar por estado"
          >
            <option value="all">
              Todos los estados
            </option>

            <option value="pending">
              Pendientes
            </option>

            <option value="rejected">
              Correcciones
            </option>
          </SelectField>

          <SelectField
            value={order}
            onChange={(
              value
            ) =>
              setOrder(
                value as OrderFilter
              )
            }
            ariaLabel="Ordenar solicitudes"
          >
            <option value="priority">
              Prioridad
            </option>

            <option value="oldest">
              Más antiguas
            </option>

            <option value="newest">
              Más recientes
            </option>
          </SelectField>

          {hasFilters ? (
            <button
              type="button"
              onClick={
                clearFilters
              }
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-white px-4 text-xs font-bold text-muted-foreground transition hover:border-primary/20 hover:text-action"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Limpiar
            </button>
          ) : (
            <div className="flex h-11 items-center justify-center gap-2 rounded-xl border border-border/60 bg-canvas px-4 text-xs font-semibold text-muted-foreground">
              <Filter className="h-3.5 w-3.5" />
              Pendientes primero
            </div>
          )}
        </div>
      </section>

      {/* ====================================================== */}
      {/* QUEUE                                                  */}
      {/* ====================================================== */}

      <section className="overflow-hidden rounded-2xl border border-border/70 bg-white shadow-none">
        <div className="flex flex-col gap-3 border-b border-border/60 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-action">
              Moderación
            </p>

            <h2 className="mt-1 text-lg font-bold text-ink">
              Cola de revisión
            </h2>
          </div>

          <div className="rounded-full bg-surface-2 px-3 py-1.5 text-xs font-bold text-muted-foreground">
            {filteredRestaurants.length}{' '}
            {filteredRestaurants.length ===
            1
              ? 'resultado'
              : 'resultados'}
          </div>
        </div>

        {filteredRestaurants.length ===
        0 ? (
          <EmptyState
            filtering={
              hasFilters
            }
          />
        ) : (
          <div className="divide-y divide-border/60">
            {filteredRestaurants.map(
              (restaurant) => (
                <ModerationRow
                  key={
                    restaurant.id
                  }
                  restaurant={
                    restaurant
                  }
                />
              )
            )}
          </div>
        )}
      </section>
    </div>
  );
}

/* ========================================================== */
/* SUMMARY CARD                                               */
/* ========================================================== */

function SummaryCard({
  icon: Icon,
  label,
  value,
  helper,
  tone,
  textValue = false,
}: {
  icon: React.ComponentType<{
    className?: string;
  }>;
  label: string;
  value: number | string;
  helper: string;
  tone:
    | 'attention'
    | 'danger'
    | 'neutral';
  textValue?: boolean;
}) {
  const toneClasses = {
    attention: {
      icon: 'bg-warning-soft text-warning',
      accent: 'bg-amber-400',
    },
    danger: {
      icon: 'bg-danger-soft text-danger',
      accent: 'bg-red-400',
    },
    neutral: {
      icon: 'bg-primary/[0.08] text-action',
      accent: 'bg-action',
    },
  }[tone];

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-white p-4 shadow-none sm:p-5">
      <span
        className={`absolute inset-y-4 left-0 w-[3px] rounded-r-full ${toneClasses.accent}`}
      />

      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">
            {label}
          </p>

          <p
            className={`mt-2 font-bold tracking-[-0.035em] text-ink ${
              textValue
                ? 'text-xl sm:text-2xl'
                : 'text-3xl'
            }`}
          >
            {value}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            {helper}
          </p>
        </div>

        <div
          className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${toneClasses.icon}`}
        >
          <Icon className="h-4.5 w-4.5" />
        </div>
      </div>
    </div>
  );
}

/* ========================================================== */
/* ROW                                                        */
/* ========================================================== */

function ModerationRow({
  restaurant,
}: {
  restaurant:
    ModerationRestaurant;
}) {
  const pending =
    restaurant.status ===
    'pending';

  const config =
    pending
      ? {
          icon: Clock3,
          label: 'Pendiente',
          badge:
            'border-warning/25 bg-warning-soft text-warning',
          iconClass:
            'bg-warning-soft text-warning',
          action:
            'Revisar solicitud',
        }
      : {
          icon: XCircle,
          label: 'Correcciones',
          badge:
            'border-danger/25 bg-danger-soft text-danger',
          iconClass:
            'bg-danger-soft text-danger',
          action:
            'Ver seguimiento',
        };

  const StatusIcon =
    config.icon;

  const age =
    getRequestAge(
      restaurant.created_at
    );

  const priority =
    pending &&
    age.days >= 3;

  return (
    <article className="px-5 py-5 transition hover:bg-canvas sm:px-6">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_190px_auto] xl:items-center">
        <div className="flex min-w-0 items-start gap-4">
          <div
            className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl ${config.iconClass}`}
          >
            <Store className="h-4.5 w-4.5" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-bold text-ink sm:text-base">
                {restaurant.name}
              </h3>

              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${config.badge}`}
              >
                <StatusIcon className="h-3 w-3" />
                {config.label}
              </span>

              {priority && (
                <span className="inline-flex items-center gap-1 rounded-full bg-warning-soft px-2.5 py-1 text-xs font-bold text-warning">
                  <AlertCircle className="h-3 w-3" />
                  Prioritaria
                </span>
              )}
            </div>

            {restaurant.short_description && (
              <p className="mt-2 line-clamp-2 max-w-3xl text-xs leading-5 text-muted-foreground">
                {restaurant.short_description}
              </p>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <UserRound className="h-3.5 w-3.5 text-action" />
                {restaurant.owner_name}

                {restaurant.owner_username && (
                  <span className="text-muted-foreground/60">
                    @{restaurant.owner_username}
                  </span>
                )}
              </span>

              <span className="hidden h-1 w-1 rounded-full bg-border sm:block" />

              <span>
                Enviado {formatDate(
                  restaurant.created_at
                )}
              </span>

              <span className="hidden h-1 w-1 rounded-full bg-border sm:block" />

              <span className="font-mono text-xs">
                {restaurant.id.slice(
                  0,
                  8
                )}
              </span>
            </div>

            {!pending &&
              restaurant.rejection_reason && (
                <div className="mt-3 max-w-3xl rounded-xl border border-danger/25 bg-red-50/60 px-3 py-2.5">
                  <p className="line-clamp-2 text-xs leading-5 text-danger">
                    <strong>
                      Motivo:
                    </strong>{' '}
                    {restaurant.rejection_reason}
                  </p>
                </div>
              )}
          </div>
        </div>

        <div className="rounded-xl border border-border/60 bg-canvas px-4 py-3">
          <p className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">
            {pending
              ? 'Tiempo en cola'
              : 'Último cambio'}
          </p>

          <p
            className={`mt-1 text-sm font-bold ${
              priority
                ? 'text-warning'
                : 'text-ink'
            }`}
          >
            {pending
              ? age.label
              : formatRelativeDate(
                  restaurant.updated_at
                )}
          </p>

          <p className="mt-0.5 text-xs text-muted-foreground">
            {pending
              ? `Actualizado ${formatRelativeDate(
                  restaurant.updated_at
                )}`
              : 'Esperando nueva revisión'}
          </p>
        </div>

        <div className="flex xl:justify-end">
          <Link
            href={`/admin/restaurants/${restaurant.id}`}
            className={`group inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-xs font-bold transition ${
              pending
                ? 'bg-[#0E2725] text-white shadow-raised hover:bg-action'
                : 'border border-border bg-white text-ink hover:border-primary/20 hover:text-action'
            }`}
          >
            {config.action}
            <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </article>
  );
}

/* ========================================================== */
/* SELECT                                                     */
/* ========================================================== */

function SelectField({
  value,
  onChange,
  children,
  ariaLabel,
}: {
  value: string;
  onChange: (
    value: string
  ) => void;
  children:
    React.ReactNode;
  ariaLabel: string;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(
          event
        ) =>
          onChange(
            event.target.value
          )
        }
        aria-label={ariaLabel}
        className="h-11 w-full appearance-none rounded-xl border border-border bg-canvas px-4 pr-10 text-xs font-semibold text-ink outline-none transition focus:border-primary/30 focus:bg-white focus:ring-4 focus:ring-primary/[0.06]"
      >
        {children}
      </select>

      <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
}

/* ========================================================== */
/* EMPTY                                                      */
/* ========================================================== */

function EmptyState({
  filtering,
}: {
  filtering: boolean;
}) {
  return (
    <div className="flex min-h-[320px] items-center justify-center px-6 py-14 text-center">
      <div className="max-w-sm">
        <div className="mx-auto flex h-13 w-13 items-center justify-center rounded-2xl bg-success-soft text-success">
          <CheckCircle2 className="h-5 w-5" />
        </div>

        <h3 className="mt-4 text-base font-bold text-ink">
          {filtering
            ? 'No encontramos resultados'
            : 'Moderación al día'}
        </h3>

        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {filtering
            ? 'Prueba cambiando la búsqueda o los filtros seleccionados.'
            : 'No hay solicitudes pendientes ni correcciones en seguimiento.'}
        </p>
      </div>
    </div>
  );
}

/* ========================================================== */
/* DATE                                                       */
/* ========================================================== */

function getRequestAge(
  value: string
) {
  const created =
    new Date(value);

  const now =
    new Date();

  const difference =
    Math.max(
      0,
      now.getTime() -
        created.getTime()
    );

  const hours =
    Math.floor(
      difference /
        3_600_000
    );

  const days =
    Math.floor(
      hours /
        24
    );

  if (hours < 1) {
    return {
      days: 0,
      label:
        'Menos de 1 hora',
    };
  }

  if (hours < 24) {
    return {
      days: 0,
      label: `${hours} ${
        hours === 1
          ? 'hora'
          : 'horas'
      }`,
    };
  }

  return {
    days,
    label: `${days} ${
      days === 1
        ? 'día'
        : 'días'
    }`,
  };
}

function formatDate(
  value: string
) {
  return new Intl.DateTimeFormat(
    'es-NI',
    {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }
  ).format(
    new Date(value)
  );
}

function formatRelativeDate(
  value: string
) {
  const date =
    new Date(value);

  const now =
    new Date();

  const difference =
    Math.max(
      0,
      now.getTime() -
        date.getTime()
    );

  const minutes =
    Math.floor(
      difference /
        60_000
    );

  if (minutes < 1) {
    return 'ahora';
  }

  if (minutes < 60) {
    return `hace ${minutes} min`;
  }

  const hours =
    Math.floor(
      minutes /
        60
    );

  if (hours < 24) {
    return `hace ${hours} ${
      hours === 1
        ? 'hora'
        : 'horas'
    }`;
  }

  const days =
    Math.floor(
      hours /
        24
    );

  if (days < 30) {
    return `hace ${days} ${
      days === 1
        ? 'día'
        : 'días'
    }`;
  }

  return formatDate(value);
}
