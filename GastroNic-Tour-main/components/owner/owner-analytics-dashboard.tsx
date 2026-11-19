"use client";

import {
  useMemo,
  useState,
} from 'react';

import Link from 'next/link';

import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Heart,
  MapPin,
  MessageSquareText,
  Star,
  Store,
  TrendingDown,
  TrendingUp,
  Users,
} from 'lucide-react';

/* ========================================================== */
/* TYPES                                                      */
/* ========================================================== */

export interface AnalyticsRestaurant {
  id: string;
  name: string;
  status: string;

  average_rating: number;
  reviews_count: number;
  favorites_count: number;
  visits_count: number;

  is_verified: boolean;
  is_featured: boolean;

  published_at:
    | string
    | null;
}

export interface AnalyticsVisit {
  id: string;
  restaurant_id: string;
  visited_at: string;

  verification_status:
    string;

  verification_method:
    | string
    | null;
}

export interface AnalyticsFavorite {
  restaurant_id: string;
  user_id: string;
  created_at: string;
}

export interface AnalyticsReview {
  id: string;
  restaurant_id: string;
  rating: number;
  status: string;

  is_verified_visit:
    boolean;

  owner_reply:
    | string
    | null;

  created_at: string;
}

export interface AnalyticsReservation {
  id: string;
  restaurant_id: string;
  reserved_for: string;
  party_size: number;
  status: string;
  created_at: string;
}

interface Props {
  restaurants:
    AnalyticsRestaurant[];

  visits:
    AnalyticsVisit[];

  favorites:
    AnalyticsFavorite[];

  reviews:
    AnalyticsReview[];

  reservations:
    AnalyticsReservation[];

  snapshotNow: string;
}

type Period =
  | '30'
  | '90'
  | '365';

/* ========================================================== */
/* COMPONENT                                                  */
/* ========================================================== */

export function OwnerAnalyticsDashboard({
  restaurants,
  visits,
  favorites,
  reviews,
  reservations,
  snapshotNow,
}: Props) {
  const [
    period,
    setPeriod,
  ] = useState<Period>(
    '30'
  );

  const [
    selectedRestaurant,
    setSelectedRestaurant,
  ] = useState('all');

  const periodDays =
    Number(period);

  /* ======================================================== */
  /* FILTER BY RESTAURANT                                     */
  /* ======================================================== */

  const filteredVisits =
    useMemo(
      () =>
        selectedRestaurant ===
        'all'
          ? visits
          : visits.filter(
              (visit) =>
                visit.restaurant_id ===
                selectedRestaurant
            ),
      [
        visits,
        selectedRestaurant,
      ]
    );

  const filteredFavorites =
    useMemo(
      () =>
        selectedRestaurant ===
        'all'
          ? favorites
          : favorites.filter(
              (favorite) =>
                favorite.restaurant_id ===
                selectedRestaurant
            ),
      [
        favorites,
        selectedRestaurant,
      ]
    );

  const filteredReviews =
    useMemo(
      () =>
        selectedRestaurant ===
        'all'
          ? reviews
          : reviews.filter(
              (review) =>
                review.restaurant_id ===
                selectedRestaurant
            ),
      [
        reviews,
        selectedRestaurant,
      ]
    );

  const filteredReservations =
    useMemo(
      () =>
        selectedRestaurant ===
        'all'
          ? reservations
          : reservations.filter(
              (reservation) =>
                reservation.restaurant_id ===
                selectedRestaurant
            ),
      [
        reservations,
        selectedRestaurant,
      ]
    );

  /* ======================================================== */
  /* DATE RANGE                                               */
  /* ======================================================== */

  const range =
    useMemo(
      () =>
        buildRange(
          periodDays,
          snapshotNow
        ),
      [
        periodDays,
        snapshotNow,
      ]
    );

  const currentVisits =
    filterByDate(
      filteredVisits,
      'visited_at',
      range.currentStart,
      range.now
    );

  const previousVisits =
    filterByDate(
      filteredVisits,
      'visited_at',
      range.previousStart,
      range.currentStart
    );

  const currentFavorites =
    filterByDate(
      filteredFavorites,
      'created_at',
      range.currentStart,
      range.now
    );

  const previousFavorites =
    filterByDate(
      filteredFavorites,
      'created_at',
      range.previousStart,
      range.currentStart
    );

  const currentReviews =
    filterByDate(
      filteredReviews.filter(
        (review) =>
          review.status ===
          'published'
      ),
      'created_at',
      range.currentStart,
      range.now
    );

  const previousReviews =
    filterByDate(
      filteredReviews.filter(
        (review) =>
          review.status ===
          'published'
      ),
      'created_at',
      range.previousStart,
      range.currentStart
    );

  const currentReservations =
    filterByDate(
      filteredReservations,
      'created_at',
      range.currentStart,
      range.now
    );

  const previousReservations =
    filterByDate(
      filteredReservations,
      'created_at',
      range.previousStart,
      range.currentStart
    );

  /* ======================================================== */
  /* SUMMARY                                                  */
  /* ======================================================== */

  const publishedReviews =
    filteredReviews.filter(
      (review) =>
        review.status ===
        'published'
    );

  /*
   * A partir de aquí las métricas principales respetan
   * el período seleccionado. Las colecciones "filtered..."
   * siguen disponibles para lecturas históricas si luego
   * queremos añadir una vista de "todo el tiempo".
   */

  const periodReviews =
    currentReviews;

  const averageRating =
    periodReviews.length >
    0
      ? periodReviews.reduce(
          (
            total,
            review
          ) =>
            total +
            review.rating,
          0
        ) /
        periodReviews.length
      : 0;

  const verifiedVisits =
    currentVisits.filter(
      (visit) =>
        visit.verification_status ===
        'verified'
    );

  const completedReservations =
    currentReservations.filter(
      (reservation) =>
        reservation.status ===
        'completed'
    );

  const totalGuests =
    currentReservations.reduce(
      (
        total,
        reservation
      ) =>
        total +
        reservation.party_size,
      0
    );

  const answeredReviews =
    periodReviews.filter(
      (review) =>
        Boolean(
          review.owner_reply
        )
    );

  const reviewResponseRate =
    periodReviews.length >
    0
      ? Math.round(
          (
            answeredReviews.length /
            periodReviews.length
          ) *
            100
        )
      : 0;

  /* ======================================================== */
  /* ACTIVITY CHART                                           */
  /* ======================================================== */

  const activity =
    useMemo(
      () =>
        buildActivity(
          currentVisits,
          currentFavorites,
          currentReviews,
          currentReservations,
          periodDays,
          snapshotNow
        ),
      [
        currentVisits,
        currentFavorites,
        currentReviews,
        currentReservations,
        periodDays,
        snapshotNow,
      ]
    );

  /* ======================================================== */
  /* RESTAURANT RANKING                                       */
  /* ======================================================== */

  const ranking =
    useMemo(() => {
      return restaurants
        .filter(
          (restaurant) =>
            restaurant.status ===
            'approved'
        )
        .map(
          (restaurant) => {
            const restaurantVisits =
              currentVisits.filter(
                (visit) =>
                  visit.restaurant_id ===
                  restaurant.id
              );

            const restaurantFavorites =
              currentFavorites.filter(
                (favorite) =>
                  favorite.restaurant_id ===
                  restaurant.id
              );

            const restaurantReviews =
              currentReviews.filter(
                (review) =>
                  review.restaurant_id ===
                  restaurant.id
              );

            const restaurantReservations =
              currentReservations.filter(
                (reservation) =>
                  reservation.restaurant_id ===
                  restaurant.id
              );

            const rating =
              restaurantReviews.length >
              0
                ? restaurantReviews.reduce(
                    (
                      total,
                      review
                    ) =>
                      total +
                      review.rating,
                    0
                  ) /
                  restaurantReviews.length
                : 0;

            /*
             * Score interno de comparación del período.
             * No pretende ser una métrica pública; solo
             * ayuda a ordenar el portafolio en Analytics.
             */
            const score =
              restaurantVisits.length *
                1 +
              restaurantFavorites.length *
                3 +
              restaurantReviews.length *
                5 +
              restaurantReservations.length *
                4;

            return {
              id:
                restaurant.id,

              name:
                restaurant.name,

              visits:
                restaurantVisits.length,

              favorites:
                restaurantFavorites.length,

              reviews:
                restaurantReviews.length,

              reservations:
                restaurantReservations.length,

              rating,

              score,
            };
          }
        )
        .sort(
          (a, b) =>
            b.score -
            a.score
        );
    }, [
      restaurants,
      currentVisits,
      currentFavorites,
      currentReviews,
      currentReservations,
    ]);

  /* ======================================================== */
  /* REVIEW DISTRIBUTION                                      */
  /* ======================================================== */

  const ratingDistribution =
    [5, 4, 3, 2, 1].map(
      (rating) => ({
        rating,

        count:
          periodReviews.filter(
            (review) =>
              review.rating ===
              rating
          ).length,
      })
    );

  /* ======================================================== */
  /* RESERVATION STATUS                                       */
  /* ======================================================== */

  const reservationStatus =
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
      (item) => ({
        ...item,

        count:
          currentReservations.filter(
            (reservation) =>
              reservation.status ===
              item.key
          ).length,
      })
    );

  return (
    <div className="space-y-6">
      {/* ====================================================== */}
      {/* FILTER BAR                                             */}
      {/* ====================================================== */}

      <section className="flex flex-col gap-3 rounded-card border border-border/70 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">
            Vista actual
          </p>

          <p className="mt-1 text-sm font-bold text-ink">
            {selectedRestaurant ===
            'all'
              ? 'Todo el portafolio'
              : restaurants.find(
                  (restaurant) =>
                    restaurant.id ===
                    selectedRestaurant
                )?.name}
          </p>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <SelectField
            value={
              selectedRestaurant
            }
            onChange={
              setSelectedRestaurant
            }
          >
            <option value="all">
              Todos los restaurantes
            </option>

            {restaurants.map(
              (restaurant) => (
                <option
                  key={
                    restaurant.id
                  }
                  value={
                    restaurant.id
                  }
                >
                  {restaurant.name}
                </option>
              )
            )}
          </SelectField>

          <SelectField
            value={
              period
            }
            onChange={(
              value
            ) =>
              setPeriod(
                value as Period
              )
            }
          >
            <option value="30">
              Últimos 30 días
            </option>

            <option value="90">
              Últimos 90 días
            </option>

            <option value="365">
              Último año
            </option>
          </SelectField>
        </div>
      </section>

      {/* ====================================================== */}
      {/* HERO                                                   */}
      {/* ====================================================== */}

      <section className="relative overflow-hidden rounded-sheet bg-ink p-6 text-white shadow-overlay sm:p-8">


        <div className="relative grid gap-8 xl:grid-cols-[minmax(0,1fr)_440px] xl:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-white/35">
              Rendimiento consolidado
            </p>

            <h2 className="mt-3 max-w-2xl text-2xl font-bold tracking-[-0.035em] sm:text-3xl">
              Entiende cómo se mueve tu portafolio.
            </h2>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/50">
              Visitas, intención, reputación y reservaciones reunidas en una
              sola lectura ejecutiva.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <DarkMetric
              value={
                currentVisits.length
              }
              label="Visitas"
            />

            <DarkMetric
              value={
                currentFavorites.length
              }
              label="Favoritos"
            />

            <DarkMetric
              value={
                periodReviews.length
              }
              label="Reseñas"
            />

            <DarkMetric
              value={
                currentReservations.length
              }
              label="Reservaciones"
            />
          </div>
        </div>
      </section>

      {/* ====================================================== */}
      {/* KPI                                                   */}
      {/* ====================================================== */}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Visitas"
          value={
            currentVisits.length
          }
          current={
            currentVisits.length
          }
          previous={
            previousVisits.length
          }
          icon={MapPin}
        />

        <KpiCard
          label="Favoritos"
          value={
            currentFavorites.length
          }
          current={
            currentFavorites.length
          }
          previous={
            previousFavorites.length
          }
          icon={Heart}
        />

        <KpiCard
          label="Reseñas"
          value={
            periodReviews.length
          }
          current={
            currentReviews.length
          }
          previous={
            previousReviews.length
          }
          icon={
            MessageSquareText
          }
        />

        <KpiCard
          label="Reservaciones"
          value={
            currentReservations.length
          }
          current={
            currentReservations.length
          }
          previous={
            previousReservations.length
          }
          icon={
            CalendarDays
          }
        />
      </section>

      {/* ====================================================== */}
      {/* ACTIVITY                                               */}
      {/* ====================================================== */}

      <section className="overflow-hidden rounded-sheet border border-border/70 bg-white shadow-none">
        <div className="border-b border-border/60 px-5 py-5 sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.08em] text-action">
                Evolución
              </p>

              <h2 className="mt-1 text-lg font-bold text-ink">
                Actividad del período
              </h2>

              <p className="mt-1 text-xs text-muted-foreground">
                Interacciones registradas dentro del rango seleccionado.
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/[0.07] text-action">
              <BarChart3 className="h-4 w-4" />
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-6">
          <ActivityChart
            data={
              activity
            }
          />
        </div>
      </section>

      {/* ====================================================== */}
      {/* RANKING                                               */}
      {/* ====================================================== */}

      <section className="overflow-hidden rounded-sheet border border-border/70 bg-white shadow-none">
        <div className="border-b border-border/60 px-5 py-5 sm:px-6">
          <p className="text-xs font-bold uppercase tracking-[0.08em] text-action">
            Comparativa
          </p>

          <h2 className="mt-1 text-lg font-bold text-ink">
            Rendimiento por restaurante
          </h2>

          <p className="mt-1 text-xs text-muted-foreground">
            Compara el movimiento de cada establecimiento dentro del período seleccionado.
          </p>
        </div>

        {ranking.length ===
        0 ? (
          <div className="flex min-h-[240px] items-center justify-center p-8 text-center">
            <div>
              <Store className="mx-auto h-7 w-7 text-muted-foreground/40" />

              <p className="mt-4 text-sm font-bold text-ink">
                No hay restaurantes publicados
              </p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {ranking.map(
              (
                restaurant,
                index
              ) => (
                <RankingRow
                  key={
                    restaurant.id
                  }
                  restaurant={
                    restaurant
                  }
                  position={
                    index + 1
                  }
                />
              )
            )}
          </div>
        )}
      </section>

      {/* ====================================================== */}
      {/* DETAILS                                                */}
      {/* ====================================================== */}

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-card border border-border/70 bg-white p-6 shadow-none">
          <p className="text-xs font-bold uppercase tracking-[0.08em] text-action">
            Reputación
          </p>

          <div className="mt-2 flex items-end gap-3">
            <p className="text-4xl font-bold tracking-[-0.05em] text-ink">
              {averageRating > 0
                ? averageRating.toFixed(
                    1
                  )
                : '—'}
            </p>

            <div className="pb-1">
              <Stars
                rating={
                  averageRating
                }
              />

              <p className="mt-1 text-xs text-muted-foreground">
                {
                  periodReviews.length
                }{' '}
                reseñas
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {ratingDistribution.map(
              (item) => {
                const percentage =
                  periodReviews.length >
                  0
                    ? (
                        item.count /
                        periodReviews.length
                      ) *
                      100
                    : 0;

                return (
                  <div
                    key={
                      item.rating
                    }
                    className="grid grid-cols-[44px_minmax(0,1fr)_28px] items-center gap-3"
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

        <section className="rounded-card border border-border/70 bg-white p-6 shadow-none">
          <p className="text-xs font-bold uppercase tracking-[0.08em] text-action">
            Operación
          </p>

          <h2 className="mt-1 text-lg font-bold text-ink">
            Reservaciones
          </h2>

          <div className="mt-6 space-y-3">
            {reservationStatus.map(
              (item) => (
                <div
                  key={
                    item.key
                  }
                  className="flex items-center justify-between rounded-xl bg-canvas px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="h-2 w-2 rounded-full bg-action" />

                    <span className="text-xs font-semibold text-ink">
                      {
                        item.label
                      }
                    </span>
                  </div>

                  <span className="text-sm font-bold text-ink">
                    {
                      item.count
                    }
                  </span>
                </div>
              )
            )}
          </div>
        </section>
      </div>

      {/* ====================================================== */}
      {/* INSIGHTS                                               */}
      {/* ====================================================== */}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <InsightCard
          icon={
            CheckCircle2
          }
          label="Visitas verificadas"
          value={
            currentVisits.length >
            0
              ? `${Math.round(
                  (
                    verifiedVisits.length /
                    currentVisits.length
                  ) *
                    100
                )}%`
              : '0%'
          }
          description={`${verifiedVisits.length} de ${currentVisits.length} visitas`}
        />

        <InsightCard
          icon={
            Users
          }
          label="Personas reservadas"
          value={
            String(
              totalGuests
            )
          }
          description="Dentro del período seleccionado"
        />

        <InsightCard
          icon={
            CalendarDays
          }
          label="Reservas completadas"
          value={
            String(
              completedReservations.length
            )
          }
          description="Dentro del período seleccionado"
        />

        <InsightCard
          icon={
            MessageSquareText
          }
          label="Reseñas respondidas"
          value={`${reviewResponseRate}%`}
          description={`${answeredReviews.length} de ${periodReviews.length} reseñas`}
        />
      </section>
    </div>
  );
}

/* ========================================================== */
/* KPI                                                        */
/* ========================================================== */

function KpiCard({
  label,
  value,
  current,
  previous,
  icon: Icon,
}: {
  label: string;

  value: number;
  current: number;
  previous: number;

  icon: React.ComponentType<{
    className?: string;
  }>;
}) {
  const change =
    percentageChange(
      current,
      previous
    );

  return (
    <div className="rounded-card border border-border/70 bg-white p-5 shadow-none">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">
            {label}
          </p>

          <p className="mt-3 text-3xl font-bold tracking-[-0.045em] text-ink">
            {formatNumber(
              value
            )}
          </p>
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/[0.07] text-action">
          <Icon className="h-4 w-4" />
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-border/60 pt-4">
        <div
          className={`flex items-center gap-1 text-xs font-bold ${
            change > 0
              ? 'text-success'
              : change < 0
                ? 'text-danger'
                : 'text-muted-foreground'
          }`}
        >
          {change > 0 ? (
            <TrendingUp className="h-3.5 w-3.5" />
          ) : change < 0 ? (
            <TrendingDown className="h-3.5 w-3.5" />
          ) : null}

          {change === 0
            ? 'Sin variación'
            : `${change > 0 ? '+' : ''}${change}%`}
        </div>

        <span className="text-xs text-muted-foreground">
          vs. período anterior
        </span>
      </div>
    </div>
  );
}

/* ========================================================== */
/* RANKING                                                    */
/* ========================================================== */

function RankingRow({
  restaurant,
  position,
}: {
  restaurant: {
    id: string;
    name: string;
    visits: number;
    favorites: number;
    reviews: number;
    reservations: number;
    rating: number;
    score: number;
  };

  position: number;
}) {
  return (
    <div className="grid gap-4 px-5 py-5 transition hover:bg-canvas sm:px-6 lg:grid-cols-[48px_minmax(0,1fr)_repeat(4,90px)_auto] lg:items-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F2F5F4] text-sm font-bold text-ink">
        {String(
          position
        ).padStart(
          2,
          '0'
        )}
      </div>

      <div className="min-w-0">
        <p className="truncate text-sm font-bold text-ink">
          {
            restaurant.name
          }
        </p>

        <div className="mt-1 flex items-center gap-2">
          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />

          <span className="text-xs font-bold text-ink">
            {restaurant.rating >
            0
              ? restaurant.rating.toFixed(
                  1
                )
              : '—'}
          </span>
        </div>
      </div>

      <RankingMetric
        label="Visitas"
        value={
          restaurant.visits
        }
      />

      <RankingMetric
        label="Favoritos"
        value={
          restaurant.favorites
        }
      />

      <RankingMetric
        label="Reseñas"
        value={
          restaurant.reviews
        }
      />

      <RankingMetric
        label="Reservas"
        value={
          restaurant.reservations
        }
      />

      <Link
        href={`/owner/restaurants/${restaurant.id}/analytics`}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-action transition hover:gap-2.5"
      >
        Analizar

        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}

function RankingMetric({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </p>

      <p className="mt-1 text-sm font-bold text-ink">
        {value}
      </p>
    </div>
  );
}

/* ========================================================== */
/* ACTIVITY CHART                                             */
/* ========================================================== */

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
      <div className="flex h-[260px] items-end gap-1 sm:gap-1.5">
        {data.map(
          (
            item,
            index
          ) => {
            const height =
              item.total === 0
                ? 2
                : Math.max(
                    7,
                    (
                      item.total /
                      max
                    ) *
                      100
                  );

            return (
              <div
                key={`${item.label}-${index}`}
                className="group flex min-w-0 flex-1 flex-col justify-end"
              >
                <div className="relative flex h-[220px] items-end justify-center">
                  <div
                    title={`${item.label}: ${item.total}`}
                    style={{
                      height: `${height}%`,
                    }}
                    className="w-full max-w-6 rounded-t-md bg-action transition-all duration-300 group-hover:opacity-70"
                  />
                </div>
              </div>
            );
          }
        )}
      </div>

      <div className="mt-3 flex justify-between text-xs font-medium text-muted-foreground">
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

/* ========================================================== */
/* SMALL COMPONENTS                                           */
/* ========================================================== */

function DarkMetric({
  value,
  label,
}: {
  value: number;
  label: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
      <p className="text-2xl font-bold">
        {formatNumber(
          value
        )}
      </p>

      <p className="mt-1 text-xs font-bold uppercase tracking-[0.09em] text-white/35">
        {label}
      </p>
    </div>
  );
}

function InsightCard({
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
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/[0.07] text-action">
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

function Stars({
  rating,
}: {
  rating: number;
}) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(
        (star) => (
          <Star
            key={
              star
            }
            className={`h-3.5 w-3.5 ${
              star <=
              Math.round(
                rating
              )
                ? 'fill-amber-400 text-amber-400'
                : 'fill-slate-200 text-slate-200'
            }`}
          />
        )
      )}
    </div>
  );
}

function SelectField({
  value,
  onChange,
  children,
}: {
  value: string;

  onChange:
    (
      value: string
    ) => void;

  children:
    React.ReactNode;
}) {
  return (
    <div className="relative min-w-[190px]">
      <select
        value={
          value
        }
        onChange={(
          event
        ) =>
          onChange(
            event.target
              .value
          )
        }
        className="h-10 w-full appearance-none rounded-xl border border-border bg-canvas px-3 pr-9 text-xs font-semibold text-ink outline-none transition focus:border-primary/30 focus:bg-white focus:ring-4 focus:ring-primary/[0.06]"
      >
        {children}
      </select>

      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
}

/* ========================================================== */
/* HELPERS                                                    */
/* ========================================================== */

function buildRange(
  days: number,
  snapshotNow: string
) {
  const now =
    new Date(
      snapshotNow
    );

  const currentStart =
    new Date(now);

  currentStart.setDate(
    currentStart.getDate() -
      days
  );

  const previousStart =
    new Date(
      currentStart
    );

  previousStart.setDate(
    previousStart.getDate() -
      days
  );

  return {
    now,
    currentStart,
    previousStart,
  };
}

function filterByDate<
  T extends Record<
    string,
    any
  >
>(
  items: T[],
  key: keyof T,
  start: Date,
  end: Date
) {
  return items.filter(
    (item) => {
      const date =
        new Date(
          item[key]
        );

      return (
        date >= start &&
        date < end
      );
    }
  );
}

function percentageChange(
  current: number,
  previous: number
) {
  if (
    previous === 0
  ) {
    return current > 0
      ? 100
      : 0;
  }

  return Math.round(
    (
      (
        current -
        previous
      ) /
      previous
    ) *
      100
  );
}

function buildActivity(
  visits:
    AnalyticsVisit[],

  favorites:
    AnalyticsFavorite[],

  reviews:
    AnalyticsReview[],

  reservations:
    AnalyticsReservation[],

  days:
    number,

  snapshotNow:
    string
) {
  const now =
    new Date(
      snapshotNow
    );

  const points =
    Math.min(
      days,
      60
    );

  const bucketSize =
    days > 90
      ? 7
      : days > 30
        ? 3
        : 1;

  const buckets: {
    start: Date;
    end: Date;
    label: string;
    total: number;
  }[] = [];

  for (
    let offset =
      days;
    offset > 0;
    offset -=
      bucketSize
  ) {
    const start =
      new Date(now);

    start.setDate(
      now.getDate() -
        offset
    );

    const end =
      new Date(start);

    end.setDate(
      start.getDate() +
        bucketSize
    );

    buckets.push({
      start,
      end,

      label:
        new Intl.DateTimeFormat(
          'es-NI',
          {
            day:
              'numeric',

            month:
              'short',

            timeZone:
              'America/Managua',
          }
        )
          .format(
            start
          )
          .replace(
            /[\u00A0\u202F]/g,
            ' '
          )
          .trim(),

      total: 0,
    });
  }

  function add(
    value: string
  ) {
    const date =
      new Date(value);

    const bucket =
      buckets.find(
        (item) =>
          date >=
            item.start &&
          date <
            item.end
      );

    if (bucket) {
      bucket.total += 1;
    }
  }

  visits.forEach(
    (item) =>
      add(
        item.visited_at
      )
  );

  favorites.forEach(
    (item) =>
      add(
        item.created_at
      )
  );

  reviews.forEach(
    (item) =>
      add(
        item.created_at
      )
  );

  reservations.forEach(
    (item) =>
      add(
        item.created_at
      )
  );

  return buckets
    .slice(
      -points
    )
    .map(
      (bucket) => ({
        label:
          bucket.label,

        total:
          bucket.total,
      })
    );
}

function formatNumber(
  value: number
) {
  return new Intl.NumberFormat(
    'es-NI',
    {
      notation:
        value >=
        10000
          ? 'compact'
          : 'standard',

      maximumFractionDigits:
        1,
    }
  )
    .format(
      value
    )
    .replace(
      /[\u00A0\u202F]/g,
      ' '
    )
    .trim();
}