'use client';

import {
  useMemo,
} from 'react';

import {
  CalendarDays,
  CheckCircle2,
  Heart,
  MapPin,
  Star,
  TrendingUp,
  Users,
} from 'lucide-react';

interface Visit {
  id: string;
  visited_at: string;
  verification_status: string;
  verification_method: string | null;
}

interface Favorite {
  user_id: string;
  created_at: string;
}

interface Review {
  id: string;
  rating: number;
  status: string;
  is_verified_visit: boolean;
  created_at: string;
}

interface Reservation {
  id: string;
  reserved_for: string;
  party_size: number;
  status: string;
  created_at: string;
}

interface Props {
  restaurantName: string;
  averageRating: number;
  visits: Visit[];
  favorites: Favorite[];
  reviews: Review[];
  reservations: Reservation[];
}

export function RestaurantAnalyticsDashboard({
  restaurantName,
  averageRating,
  visits,
  favorites,
  reviews,
  reservations,
}: Props) {
  const publishedReviews =
    useMemo(
      () =>
        reviews.filter(
          (review) =>
            review.status ===
            'published'
        ),
      [reviews]
    );

  const verifiedVisits =
    visits.filter(
      (visit) =>
        visit.verification_status ===
        'verified'
    );

  const completedReservations =
    reservations.filter(
      (reservation) =>
        reservation.status ===
        'completed'
    );

  const totalGuests =
    reservations.reduce(
      (
        total,
        reservation
      ) =>
        total +
        reservation.party_size,
      0
    );

  const reviewDistribution =
    [5, 4, 3, 2, 1].map(
      (rating) => ({
        rating,
        count:
          publishedReviews.filter(
            (review) =>
              review.rating ===
              rating
          ).length,
      })
    );

  const reservationStatuses =
    [
      {
        label:
          'Pendientes',
        key:
          'pending',
      },
      {
        label:
          'Confirmadas',
        key:
          'confirmed',
      },
      {
        label:
          'Completadas',
        key:
          'completed',
      },
      {
        label:
          'Canceladas',
        key:
          'cancelled',
      },
      {
        label:
          'No show',
        key:
          'no_show',
      },
    ].map(
      (status) => ({
        ...status,
        count:
          reservations.filter(
            (
              reservation
            ) =>
              reservation.status ===
              status.key
          ).length,
      })
    );

  const activity =
    buildMonthlyActivity(
      visits,
      favorites,
      reviews,
      reservations
    );

  return (
    <div className="space-y-6">
      {/* SUMMARY */}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Visitas"
          value={visits.length}
          description={`${verifiedVisits.length} verificadas`}
          icon={MapPin}
        />

        <MetricCard
          label="Favoritos"
          value={favorites.length}
          description="Usuarios interesados"
          icon={Heart}
        />

        <MetricCard
          label="Reseñas"
          value={publishedReviews.length}
          description={`${averageRating.toFixed(
            1
          )} de promedio`}
          icon={Star}
        />

        <MetricCard
          label="Reservaciones"
          value={reservations.length}
          description={`${totalGuests} personas`}
          icon={CalendarDays}
        />
      </section>

      {/* HERO */}

      <section className="relative overflow-hidden rounded-sheet bg-ink p-6 text-white shadow-overlay sm:p-8">

        <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-center">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.08em] text-white/40">
              <TrendingUp className="h-3.5 w-3.5" />
              Resumen de rendimiento
            </div>

            <h2 className="mt-3 max-w-xl text-2xl font-bold sm:text-3xl">
              Actividad reciente de {restaurantName}
            </h2>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/55">
              Esta vista utiliza visitas, favoritos, reseñas y reservaciones
              registradas en GastroNic Tour.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <DarkMetric
              value={
                verifiedVisits.length
              }
              label="Visitas verificadas"
            />

            <DarkMetric
              value={
                completedReservations.length
              }
              label="Reservas completadas"
            />

            <DarkMetric
              value={
                totalGuests
              }
              label="Personas reservadas"
            />

            <DarkMetric
              value={
                publishedReviews.filter(
                  (review) =>
                    review.is_verified_visit
                ).length
              }
              label="Reseñas verificadas"
            />
          </div>
        </div>
      </section>

      {/* ACTIVITY */}

      <section className="overflow-hidden rounded-sheet border border-border/70 bg-white shadow-none">
        <div className="border-b border-border/60 p-5 sm:p-6">
          <p className="text-xs font-bold uppercase tracking-[0.08em] text-action">
            Actividad
          </p>

          <h2 className="mt-1 text-lg font-bold text-ink">
            Últimos 30 días
          </h2>

          <p className="mt-1 text-xs text-muted-foreground">
            Registros generados recientemente en la plataforma.
          </p>
        </div>

        <div className="p-5 sm:p-6">
          <ActivityChart
            data={activity}
          />
        </div>
      </section>

      {/* DETAILS */}

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-sheet border border-border/70 bg-white p-6 shadow-none">
          <p className="text-xs font-bold uppercase tracking-[0.08em] text-action">
            Reputación
          </p>

          <h2 className="mt-1 text-lg font-bold text-ink">
            Distribución de reseñas
          </h2>

          <div className="mt-6 space-y-4">
            {reviewDistribution.map(
              (item) => {
                const total =
                  publishedReviews.length;

                const percentage =
                  total > 0
                    ? (item.count /
                        total) *
                      100
                    : 0;

                return (
                  <div
                    key={
                      item.rating
                    }
                    className="grid grid-cols-[48px_minmax(0,1fr)_28px] items-center gap-3"
                  >
                    <span className="flex items-center gap-1 text-xs font-bold text-ink">
                      {
                        item.rating
                      }

                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    </span>

                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-amber-400"
                        style={{
                          width: `${percentage}%`,
                        }}
                      />
                    </div>

                    <span className="text-right text-xs font-bold text-muted-foreground">
                      {
                        item.count
                      }
                    </span>
                  </div>
                );
              }
            )}
          </div>
        </section>

        <section className="rounded-sheet border border-border/70 bg-white p-6 shadow-none">
          <p className="text-xs font-bold uppercase tracking-[0.08em] text-action">
            Operación
          </p>

          <h2 className="mt-1 text-lg font-bold text-ink">
            Estado de reservaciones
          </h2>

          <div className="mt-6 space-y-3">
            {reservationStatuses.map(
              (status) => (
                <div
                  key={
                    status.key
                  }
                  className="flex items-center justify-between rounded-xl bg-canvas px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="h-2 w-2 rounded-full bg-action" />

                    <span className="text-xs font-semibold text-ink">
                      {
                        status.label
                      }
                    </span>
                  </div>

                  <span className="text-sm font-bold text-ink">
                    {
                      status.count
                    }
                  </span>
                </div>
              )
            )}
          </div>
        </section>
      </div>

      {/* VISITS */}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <SmallInsight
          icon={
            CheckCircle2
          }
          label="Tasa de verificación"
          value={
            visits.length > 0
              ? `${Math.round(
                  (verifiedVisits.length /
                    visits.length) *
                    100
                )}%`
              : '0%'
          }
          description="Porcentaje de visitas verificadas"
        />

        <SmallInsight
          icon={Users}
          label="Promedio por reserva"
          value={
            reservations.length >
            0
              ? (
                  totalGuests /
                  reservations.length
                ).toFixed(1)
              : '0'
          }
          description="Personas por reservación"
        />

        <SmallInsight
          icon={Star}
          label="Calificación"
          value={averageRating.toFixed(
            1
          )}
          description="Promedio actual de reseñas"
        />
      </section>
    </div>
  );
}

function ActivityChart({
  data,
}: {
  data: {
    label: string;
    total: number;
  }[];
}) {
  const max =
    Math.max(
      1,
      ...data.map(
        (item) =>
          item.total
      )
    );

  return (
    <div>
      <div className="flex h-56 items-end gap-1.5 sm:gap-2">
        {data.map(
          (
            item,
            index
          ) => {
            const height =
              item.total === 0
                ? 3
                : Math.max(
                    10,
                    (item.total /
                      max) *
                      100
                  );

            return (
              <div
                key={`${item.label}-${index}`}
                className="group flex min-w-0 flex-1 flex-col items-center justify-end"
              >
                <div className="relative flex h-48 w-full items-end justify-center">
                  <div
                    title={`${item.label}: ${item.total}`}
                    className="w-full max-w-5 rounded-t-md bg-action transition-all group-hover:opacity-80"
                    style={{
                      height: `${height}%`,
                    }}
                  />
                </div>
              </div>
            );
          }
        )}
      </div>

      <div className="mt-3 flex justify-between text-xs font-semibold text-muted-foreground">
        <span>
          {
            data[0]?.label
          }
        </span>

        <span>
          {
            data[
              data.length - 1
            ]?.label
          }
        </span>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  description,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  description: string;

  icon: React.ComponentType<{
    className?: string;
  }>;
}) {
  return (
    <div className="rounded-card border border-border/70 bg-white p-5 shadow-none">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-muted-foreground">
            {label}
          </p>

          <p className="mt-4 text-3xl font-bold tracking-[-0.04em] text-ink">
            {value}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            {description}
          </p>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-action">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function DarkMetric({
  value,
  label,
}: {
  value: number;
  label: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur">
      <p className="text-2xl font-bold">
        {value}
      </p>

      <p className="mt-1 text-xs font-semibold uppercase tracking-[0.09em] text-white/40">
        {label}
      </p>
    </div>
  );
}

function SmallInsight({
  icon: Icon,
  label,
  value,
  description,
}: {
  icon: React.ComponentType<{
    className?: string;
  }>;
  label: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-card border border-border/70 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-action">
          <Icon className="h-4 w-4" />
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">
            {label}
          </p>

          <p className="mt-1 text-xl font-bold text-ink">
            {value}
          </p>
        </div>
      </div>

      <p className="mt-4 text-xs text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

function buildMonthlyActivity(
  visits: Visit[],
  favorites: Favorite[],
  reviews: Review[],
  reservations: Reservation[]
) {
  const today =
    startOfDay(
      new Date()
    );

  const days = Array.from(
    {
      length: 30,
    },
    (_, index) => {
      const date =
        new Date(today);

      date.setDate(
        today.getDate() -
          (29 - index)
      );

      return {
        date,
        key:
          getDateKey(date),
        label:
          new Intl.DateTimeFormat(
            'es-NI',
            {
              day: 'numeric',
              month: 'short',
            }
          ).format(
            date
          ),
        total: 0,
      };
    }
  );

  const map =
    new Map(
      days.map(
        (day) => [
          day.key,
          day,
        ]
      )
    );

  function addDate(
    value: string
  ) {
    const key =
      getDateKey(
        new Date(value)
      );

    const day =
      map.get(key);

    if (day) {
      day.total += 1;
    }
  }

  visits.forEach(
    (visit) =>
      addDate(
        visit.visited_at
      )
  );

  favorites.forEach(
    (favorite) =>
      addDate(
        favorite.created_at
      )
  );

  reviews.forEach(
    (review) =>
      addDate(
        review.created_at
      )
  );

  reservations.forEach(
    (
      reservation
    ) =>
      addDate(
        reservation.created_at
      )
  );

  return days.map(
    (day) => ({
      label:
        day.label,
      total:
        day.total,
    })
  );
}

function startOfDay(
  value: Date
) {
  const copy =
    new Date(value);

  copy.setHours(
    0,
    0,
    0,
    0
  );

  return copy;
}

function getDateKey(
  value: Date
) {
  const year =
    value.getFullYear();

  const month =
    String(
      value.getMonth() +
        1
    ).padStart(
      2,
      '0'
    );

  const day =
    String(
      value.getDate()
    ).padStart(
      2,
      '0'
    );

  return `${year}-${month}-${day}`;
}