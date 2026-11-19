'use client';

import {
  useMemo,
  useState,
} from 'react';

import {
  LocateFixed,
  MapPin,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react';

import {
  type ExploreRestaurant,
} from '@/app/explore/page';

import {
  ExploreFilters,
  type ExploreFilterOption,
  type ExploreFiltersState,
} from '@/components/explore/explore-filters';

import {
  RestaurantExploreCard,
} from '@/components/explore/restaurant-explore-card';

import { createClient } from '@/lib/supabase/client';

/* ========================================================== */
/* DEFAULT FILTERS                                            */
/* ========================================================== */

const DEFAULT_FILTERS: ExploreFiltersState = {
  department: '',
  municipality: '',
  category: '',
  priceLevel: null,
  minRating: null,
  verifiedOnly: false,
  featuredOnly: false,
  sort: 'recommended',
};

interface NearbyRestaurant {
  restaurant_id: string;
  distance_meters: number;
}

type LocationStatus = 'idle' | 'loading' | 'ready' | 'error';

const supabase = createClient();

/* ========================================================== */
/* COMPONENT                                                  */
/* ========================================================== */

export function ExploreClient({
  restaurants,
}: {
  restaurants:
    ExploreRestaurant[];
}) {
  const [
    search,
    setSearch,
  ] = useState('');

  const [
    filtersOpen,
    setFiltersOpen,
  ] = useState(false);

  const [
    filters,
    setFilters,
  ] =
    useState<ExploreFiltersState>(
      DEFAULT_FILTERS
    );

  const [nearbyMode, setNearbyMode] = useState(false);
  const [locationStatus, setLocationStatus] =
    useState<LocationStatus>('idle');
  const [locationMessage, setLocationMessage] = useState('');
  const [distances, setDistances] =
    useState<Record<string, number>>({});

  /* ======================================================== */
  /* OPTIONS                                                  */
  /* ======================================================== */

  const departments =
    useMemo<
      ExploreFilterOption[]
    >(() => {
      const map =
        new Map<
          string,
          string
        >();

      for (
        const restaurant
        of restaurants
      ) {
        const municipality =
          getMunicipality(
            restaurant
          );

        const department =
          getDepartment(
            municipality
              ?.department
          );

        if (department) {
          map.set(
            String(
              department.id
            ),
            department.name
          );
        }
      }

      return Array.from(
        map.entries()
      )
        .map(
          ([
            value,
            label,
          ]) => ({
            value,
            label,
          })
        )
        .sort(
          (a, b) =>
            a.label.localeCompare(
              b.label,
              'es'
            )
        );
    }, [
      restaurants,
    ]);

  const municipalities =
    useMemo<
      ExploreFilterOption[]
    >(() => {
      const map =
        new Map<
          string,
          string
        >();

      for (
        const restaurant
        of restaurants
      ) {
        const municipality =
          getMunicipality(
            restaurant
          );

        if (!municipality) {
          continue;
        }

        const department =
          getDepartment(
            municipality.department
          );

        if (
          filters.department &&
          String(
            department?.id ??
              ''
          ) !==
            filters.department
        ) {
          continue;
        }

        map.set(
          String(
            municipality.id
          ),
          municipality.name
        );
      }

      return Array.from(
        map.entries()
      )
        .map(
          ([
            value,
            label,
          ]) => ({
            value,
            label,
          })
        )
        .sort(
          (a, b) =>
            a.label.localeCompare(
              b.label,
              'es'
            )
        );
    }, [
      restaurants,
      filters.department,
    ]);

  const categories =
    useMemo<
      ExploreFilterOption[]
    >(() => {
      const map =
        new Map<
          string,
          string
        >();

      for (
        const restaurant
        of restaurants
      ) {
        for (
          const category
          of getCategories(
            restaurant
          )
        ) {
          map.set(
            category.id,
            category.name
          );
        }
      }

      return Array.from(
        map.entries()
      )
        .map(
          ([
            value,
            label,
          ]) => ({
            value,
            label,
          })
        )
        .sort(
          (a, b) =>
            a.label.localeCompare(
              b.label,
              'es'
            )
        );
    }, [
      restaurants,
    ]);

  /* ======================================================== */
  /* ACTIVE FILTER COUNT                                      */
  /* ======================================================== */

  const activeFiltersCount =
    useMemo(() => {
      let count = 0;

      if (
        filters.department
      ) {
        count += 1;
      }

      if (
        filters.municipality
      ) {
        count += 1;
      }

      if (
        filters.category
      ) {
        count += 1;
      }

      if (
        filters.priceLevel !==
        null
      ) {
        count += 1;
      }

      if (
        filters.minRating !==
        null
      ) {
        count += 1;
      }

      if (
        filters.verifiedOnly
      ) {
        count += 1;
      }

      if (
        filters.featuredOnly
      ) {
        count += 1;
      }

      if (
        filters.sort !==
        'recommended'
      ) {
        count += 1;
      }

      return count;
    }, [
      filters,
    ]);

  /* ======================================================== */
  /* NEAR ME                                                  */
  /* ======================================================== */

  function disableNearbyMode() {
    setNearbyMode(false);
    setLocationStatus('idle');
    setLocationMessage('');
    setDistances({});
  }

  function requestNearbyRestaurants() {
    if (!('geolocation' in navigator)) {
      setLocationStatus('error');
      setLocationMessage('Tu navegador no admite geolocalización.');
      return;
    }

    setLocationStatus('loading');
    setLocationMessage('');

    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const { data, error } = await supabase.rpc(
          'get_restaurants_nearby',
          {
            p_latitude: coords.latitude,
            p_longitude: coords.longitude,
          }
        );

        if (error) {
          console.error('Error calculando restaurantes cercanos:', error);
          setNearbyMode(false);
          setLocationStatus('error');
          setLocationMessage(
            'No pudimos calcular las distancias. Intenta nuevamente.'
          );
          return;
        }

        const nextDistances: Record<string, number> = {};
        const rows = (data ?? []) as NearbyRestaurant[];

        for (const row of rows) {
          nextDistances[row.restaurant_id] =
            Number(row.distance_meters);
        }

        setDistances(nextDistances);
        setNearbyMode(true);
        setLocationStatus('ready');
        setLocationMessage(
          rows.length
            ? 'Ordenados desde el más cercano a tu ubicación.'
            : 'Ubicación activa, pero los restaurantes todavía no tienen coordenadas registradas.'
        );
      },
      (error) => {
        setNearbyMode(false);
        setDistances({});
        setLocationStatus('error');

        if (error.code === error.PERMISSION_DENIED) {
          setLocationMessage(
            'No diste permiso de ubicación. Puedes seguir explorando normalmente.'
          );
        } else if (error.code === error.TIMEOUT) {
          setLocationMessage(
            'La ubicación tardó demasiado. Intenta nuevamente.'
          );
        } else {
          setLocationMessage(
            'No pudimos obtener tu ubicación. Intenta nuevamente.'
          );
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000,
      }
    );
  }

  /* ======================================================== */
  /* FILTERING                                                */
  /* ======================================================== */

  const filteredRestaurants =
    useMemo(() => {
      const query =
        normalizeText(
          search
        );

      const result =
        restaurants.filter(
          (
            restaurant
          ) => {
            const municipality =
              getMunicipality(
                restaurant
              );

            const department =
              getDepartment(
                municipality
                  ?.department
              );

            const restaurantCategories =
              getCategories(
                restaurant
              );

            /* SEARCH */

            if (query) {
              const searchable =
                normalizeText(
                  [
                    restaurant.name,
                    restaurant.slug,
                    restaurant
                      .short_description,
                    restaurant.address,
                    municipality
                      ?.name,
                    department
                      ?.name,
                    ...restaurantCategories.map(
                      (
                        category
                      ) =>
                        category.name
                    ),
                  ]
                    .filter(
                      Boolean
                    )
                    .join(
                      ' '
                    )
                );

              if (
                !searchable.includes(
                  query
                )
              ) {
                return false;
              }
            }

            /* DEPARTMENT */

            if (
              filters.department &&
              String(
                department?.id ??
                  ''
              ) !==
                filters.department
            ) {
              return false;
            }

            /* MUNICIPALITY */

            if (
              filters.municipality &&
              String(
                municipality?.id ??
                  ''
              ) !==
                filters.municipality
            ) {
              return false;
            }

            /* CATEGORY */

            if (
              filters.category &&
              !restaurantCategories.some(
                (
                  category
                ) =>
                  category.id ===
                  filters.category
              )
            ) {
              return false;
            }

            /* PRICE */

            if (
              filters.priceLevel !==
                null &&
              Number(
                restaurant.price_level
              ) !==
                filters.priceLevel
            ) {
              return false;
            }

            /* RATING */

            if (
              filters.minRating !==
                null &&
              Number(
                restaurant.average_rating ??
                  0
              ) <
                filters.minRating
            ) {
              return false;
            }

            /* VERIFIED */

            if (
              filters.verifiedOnly &&
              !restaurant.is_verified
            ) {
              return false;
            }

            /* FEATURED */

            if (
              filters.featuredOnly &&
              !restaurant.is_featured
            ) {
              return false;
            }

            return true;
          }
        );

      return [
        ...result,
      ].sort(
        (
          a,
          b
        ) => {
          if (nearbyMode) {
            const distanceA = distances[a.id];
            const distanceB = distances[b.id];
            const hasA = Number.isFinite(distanceA);
            const hasB = Number.isFinite(distanceB);

            if (hasA && hasB) return distanceA - distanceB;
            if (hasA) return -1;
            if (hasB) return 1;
          }

          switch (
            filters.sort
          ) {
            case 'rating':
              return (
                Number(
                  b.average_rating ??
                    0
                ) -
                Number(
                  a.average_rating ??
                    0
                )
              );

            case 'visits':
              return (
                Number(
                  b.visits_count ??
                    0
                ) -
                Number(
                  a.visits_count ??
                    0
                )
              );

            case 'recent':
              return (
                getTime(
                  b.published_at
                ) -
                getTime(
                  a.published_at
                )
              );

            case 'recommended':
            default:
              if (
                a.is_featured !==
                b.is_featured
              ) {
                return a.is_featured
                  ? -1
                  : 1;
              }

              return (
                Number(
                  b.average_rating ??
                    0
                ) -
                Number(
                  a.average_rating ??
                    0
                )
              );
          }
        }
      );
    }, [
      restaurants,
      search,
      filters,
      nearbyMode,
      distances,
    ]);

  /* ======================================================== */
  /* CLEAR                                                    */
  /* ======================================================== */

  function clearFilters() {
    setFilters(
      DEFAULT_FILTERS
    );
  }

  const hasSearch =
    search.trim().length >
    0;

  const hasAnythingActive =
    hasSearch ||
    activeFiltersCount >
      0;

  /* ======================================================== */
  /* RENDER                                                   */
  /* ======================================================== */

  return (
    <section>
      {/* ====================================================== */}
      {/* SEARCH BAR                                             */}
      {/* ====================================================== */}

      <div className="sticky top-0 z-30 border-b border-border/60 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto max-w-[1400px] px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex gap-2.5">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

              <input
                type="search"
                value={
                  search
                }
                onChange={(
                  event
                ) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Restaurante, ciudad o comida..."
                className="h-12 w-full rounded-2xl border border-border/80 bg-canvas pl-11 pr-10 text-sm text-ink outline-none transition placeholder:text-muted-foreground/60 focus:border-primary/35 focus:bg-white focus:ring-4 focus:ring-primary/[0.06]"
              />

              {hasSearch && (
                <button
                  type="button"
                  onClick={() =>
                    setSearch(
                      ''
                    )
                  }
                  aria-label="Limpiar búsqueda"
                  className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-white hover:text-ink"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() =>
                setFiltersOpen(
                  true
                )
              }
              className="relative inline-flex h-12 flex-shrink-0 items-center justify-center gap-2 rounded-2xl border border-border/80 bg-white px-3.5 text-xs font-bold text-ink transition hover:border-primary/20 hover:bg-canvas sm:px-4 lg:hidden"
            >
              <SlidersHorizontal className="h-4 w-4" />

              <span className="hidden xs:inline">
                Filtros
              </span>

              {activeFiltersCount >
                0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-action px-1.5 text-xs font-bold text-white">
                  {
                    activeFiltersCount
                  }
                </span>
              )}
            </button>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={nearbyMode ? disableNearbyMode : requestNearbyRestaurants}
              disabled={locationStatus === 'loading'}
              className={`inline-flex h-9 items-center gap-2 rounded-xl border px-3 text-xs font-bold transition ${
                nearbyMode
                  ? 'border-primary bg-action text-white'
                  : 'border-border/80 bg-white text-ink hover:border-primary/25 hover:bg-canvas'
              } disabled:cursor-wait disabled:opacity-60`}
            >
              <LocateFixed
                className={`h-3.5 w-3.5 ${
                  locationStatus === 'loading' ? 'animate-pulse' : ''
                }`}
              />
              {locationStatus === 'loading'
                ? 'Buscando tu ubicación...'
                : nearbyMode
                  ? 'Cerca de mí activo'
                  : 'Cerca de mí'}
            </button>

            {locationMessage && (
              <p
                className={`text-xs leading-4 ${
                  locationStatus === 'error'
                    ? 'text-warning'
                    : 'text-muted-foreground'
                }`}
              >
                {locationMessage}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ====================================================== */}
      {/* BODY                                                   */}
      {/* ====================================================== */}

      <div className="mx-auto max-w-[1400px] px-4 py-7 sm:px-6 lg:px-8 lg:py-10">
        <div className="grid gap-8 lg:grid-cols-[250px_minmax(0,1fr)] xl:grid-cols-[270px_minmax(0,1fr)]">
          {/* ================================================== */}
          {/* DESKTOP FILTERS                                    */}
          {/* ================================================== */}

          <aside className="hidden lg:block">
            <div className="sticky top-[92px]">
              <ExploreFilters
                open
                filters={
                  filters
                }
                departments={
                  departments
                }
                municipalities={
                  municipalities
                }
                categories={
                  categories
                }
                activeFiltersCount={
                  activeFiltersCount
                }
                onChange={
                  setFilters
                }
                onClose={() => {}}
                onClear={
                  clearFilters
                }
              />
            </div>
          </aside>

          {/* ================================================== */}
          {/* RESULTS                                            */}
          {/* ================================================== */}

          <div className="min-w-0">
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.08em] text-action">
                  Resultados
                </p>

                <h2 className="mt-1 text-xl font-bold tracking-[-0.025em] text-ink">
                  {
                    filteredRestaurants.length
                  }{' '}

                  {filteredRestaurants.length ===
                  1
                    ? 'lugar encontrado'
                    : 'lugares encontrados'}
                </h2>
              </div>

              {hasAnythingActive && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    clearFilters();
                  }}
                  className="hidden text-xs font-bold text-action transition hover:opacity-70 sm:inline-flex"
                >
                  Limpiar todo
                </button>
              )}
            </div>

            {filteredRestaurants.length >
            0 ? (
              <div className="grid gap-5 sm:grid-cols-2 2xl:grid-cols-3">
                {filteredRestaurants.map(
                  (
                    restaurant
                  ) => (
                    <div
                      key={restaurant.id}
                      className="min-w-0"
                    >
                      {nearbyMode &&
                        Number.isFinite(distances[restaurant.id]) && (
                          <div className="mb-2 flex items-center gap-1.5 px-1 text-xs font-bold text-action">
                            <MapPin className="h-3 w-3" />
                            {formatDistance(distances[restaurant.id])}
                          </div>
                        )}

                      <RestaurantExploreCard restaurant={restaurant} />
                    </div>
                  )
                )}
              </div>
            ) : (
              <div className="rounded-card border border-border/70 bg-white px-6 py-16 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/[0.07] text-action">
                  <Search className="h-5 w-5" />
                </div>

                <h3 className="mt-4 text-sm font-bold text-ink">
                  No encontramos resultados
                </h3>

                <p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-muted-foreground">
                  Prueba con otra búsqueda o cambia algunos filtros.
                </p>

                {hasAnythingActive && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch('');
                      clearFilters();
                    }}
                    className="mt-5 text-xs font-bold text-action"
                  >
                    Limpiar búsqueda y filtros
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ====================================================== */}
      {/* MOBILE FILTERS                                         */}
      {/* ====================================================== */}

      <div className="lg:hidden">
        <ExploreFilters
          open={
            filtersOpen
          }
          filters={
            filters
          }
          departments={
            departments
          }
          municipalities={
            municipalities
          }
          categories={
            categories
          }
          activeFiltersCount={
            activeFiltersCount
          }
          onChange={
            setFilters
          }
          onClose={() =>
            setFiltersOpen(
              false
            )
          }
          onClear={
            clearFilters
          }
        />
      </div>
    </section>
  );
}

/* ========================================================== */
/* HELPERS                                                    */
/* ========================================================== */

function normalizeText(
  value: string
) {
  return value
    .normalize('NFD')
    .replace(
      /[\u0300-\u036f]/g,
      ''
    )
    .toLowerCase()
    .trim();
}

function getTime(
  value:
    | string
    | null
) {
  if (!value) {
    return 0;
  }

  const time =
    new Date(
      value
    ).getTime();

  return Number.isFinite(
    time
  )
    ? time
    : 0;
}

function getMunicipality(
  restaurant:
    ExploreRestaurant
) {
  return Array.isArray(
    restaurant.municipality
  )
    ? restaurant
        .municipality[0] ??
        null
    : restaurant.municipality;
}

function getDepartment(
  department:
    | {
        id: number;
        name: string;
      }
    | {
        id: number;
        name: string;
      }[]
    | null
    | undefined
) {
  if (
    Array.isArray(
      department
    )
  ) {
    return (
      department[0] ??
      null
    );
  }

  return department ??
    null;
}

function getCategories(
  restaurant:
    ExploreRestaurant
) {
  return restaurant.categories
    .map(
      (
        item
      ) =>
        Array.isArray(
          item.category
        )
          ? item
              .category[0]
          : item.category
    )
    .filter(
      (
        category
      ): category is {
        id: string;
        name: string;
        slug: string;
      } =>
        Boolean(
          category
        )
    );
}


function formatDistance(meters: number) {
  if (meters < 1000) {
    return `${Math.max(1, Math.round(meters))} m de ti`;
  }

  const kilometers = meters / 1000;
  return `${kilometers.toFixed(kilometers < 10 ? 1 : 0)} km de ti`;
}
