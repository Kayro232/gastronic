'use client';

import {
  useEffect,
  useState,
} from 'react';

import {
  AlertCircle,
  LoaderCircle,
  SearchX,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  UtensilsCrossed,
} from 'lucide-react';

import { RestaurantCard } from '@/components/cards/restaurant-card';
import { RestaurantCardSkeleton } from '@/components/common/skeletons';
import { formatPriceRange } from '@/lib/format/price';
import { createClient } from '@/lib/supabase/client';

const supabase =
  createClient();

/* ========================================================== */
/* TYPES                                                      */
/* ========================================================== */

interface RestaurantImage {
  kind: string;

  external_url:
    | string
    | null;

  storage_path:
    | string
    | null;

  sort_order: number;
}

interface Category {
  id: number;
  name: string;
  slug: string;
}

interface RestaurantCategory {
  category_id: number;

  category:
    | Category
    | Category[]
    | null;
}

interface Department {
  name: string;
}

interface Municipality {
  id: number;
  name: string;

  department:
    | Department
    | Department[]
    | null;
}

export interface Restaurant {
  id: string;
  name: string;

  municipality_id:
    | number
    | null;

  average_rating:
    | number
    | null;

  reviews_count:
    | number
    | null;

  price_level:
    | number
    | null;

  estimated_price_min:
    | number
    | null;

  estimated_price_max:
    | number
    | null;

  is_verified: boolean;
  is_featured: boolean;

  images:
    | RestaurantImage[]
    | null;

  categories:
    | RestaurantCategory[]
    | null;

  municipality:
    | Municipality
    | Municipality[]
    | null;

  recommendation_reasons?: string[];

  recommendation_distance_km?:
    | number
    | null;
}

export type RecommendationFeedbackValue =
  | 'interested'
  | 'not_interested'
  | 'hide';

interface OpenStatusRow {
  restaurant_id: string;
  is_open: boolean;
}

interface RestaurantGridProps {
  selectedCategoryId:
    | string
    | null;

  selectedMunicipalityId:
    | string
    | null;

  selectedMinPrice:
    | number
    | null;

  selectedMaxPrice:
    | number
    | null;
}

/* ========================================================== */
/* HELPERS                                                    */
/* ========================================================== */

function getImageUrl(
  images:
    | RestaurantImage[]
    | null
) {
  const orderedImages = [
    ...(images ?? []),
  ].sort(
    (
      a,
      b
    ) =>
      (a.sort_order ??
        0) -
      (b.sort_order ??
        0)
  );

  const cover =
    orderedImages.find(
      (image) =>
        image.kind ===
        'cover'
    ) ??
    orderedImages[0];

  if (!cover) {
    return '/placeholder.svg';
  }

  if (
    cover.external_url
  ) {
    return cover.external_url;
  }

  if (
    cover.storage_path
  ) {
    const supabaseUrl =
      process.env
        .NEXT_PUBLIC_SUPABASE_URL;

    if (!supabaseUrl) {
      return '/placeholder.svg';
    }

    return `${supabaseUrl}/storage/v1/object/public/restaurant-images/${cover.storage_path}`;
  }

  return '/placeholder.svg';
}


function getEstimatedPriceRange(
  min:
    | number
    | null,

  max:
    | number
    | null,

  priceLevel:
    | number
    | null
) {
  /* Formato único de precios (lib/format/price.ts) */
  return formatPriceRange(min, max, priceLevel) ?? '';
}

function getCategory(
  categories:
    | RestaurantCategory[]
    | null
) {
  const categoryData =
    categories?.[0]
      ?.category;

  if (
    !categoryData
  ) {
    return 'Restaurante';
  }

  return Array.isArray(
    categoryData
  )
    ? categoryData[0]
        ?.name ??
        'Restaurante'
    : categoryData.name;
}

function getLocation(
  municipalityData:
    | Municipality
    | Municipality[]
    | null
) {
  const municipality =
    Array.isArray(
      municipalityData
    )
      ? municipalityData[0]
      : municipalityData;

  if (
    !municipality
  ) {
    return 'Nicaragua';
  }

  const departmentData =
    municipality.department;

  const department =
    Array.isArray(
      departmentData
    )
      ? departmentData[0]
      : departmentData;

  return [
    municipality.name,
    department?.name,
  ]
    .filter(
      Boolean
    )
    .join(
      ', '
    );
}

/* ========================================================== */
/* COMPONENT                                                  */
/* ========================================================== */

export function RestaurantGrid({
  selectedCategoryId,
  selectedMunicipalityId,
  selectedMinPrice,
  selectedMaxPrice,
}: RestaurantGridProps) {
  const [
    restaurants,
    setRestaurants,
  ] =
    useState<
      Restaurant[]
    >([]);

  const [
    openStatuses,
    setOpenStatuses,
  ] =
    useState<
      Map<
        string,
        boolean
      >
    >(
      new Map()
    );

  const [
    isLoading,
    setIsLoading,
  ] =
    useState(true);

  const [
    errorMessage,
    setErrorMessage,
  ] =
    useState('');

  /* ======================================================== */
  /* ACTIVE FILTERS                                           */
  /* ======================================================== */

  const hasActiveFilters =
    selectedCategoryId !==
      null ||
    selectedMunicipalityId !==
      null ||
    selectedMinPrice !==
      null ||
    selectedMaxPrice !==
      null;

  /* ======================================================== */
  /* LOAD RESTAURANTS                                         */
  /* ======================================================== */

  useEffect(() => {
    let cancelled =
      false;

    async function fetchRestaurants() {
      setIsLoading(
        true
      );

      setErrorMessage(
        ''
      );

      /*
       * Si hay categoría seleccionada usamos !inner,
       * porque queremos eliminar los restaurantes que
       * no pertenezcan a esa categoría.
       *
       * Sin filtro dejamos la relación normal para no
       * excluir restaurantes sin categorías.
       */

      const categoriesRelation =
        selectedCategoryId
          ? `
            categories:restaurant_categories!inner (
              category_id,

              category:categories (
                id,
                name,
                slug
              )
            )
          `
          : `
            categories:restaurant_categories (
              category_id,

              category:categories (
                id,
                name,
                slug
              )
            )
          `;

      let query =
        supabase
          .from(
            'restaurants'
          )
          .select(`
            id,
            name,
            municipality_id,

            average_rating,
            reviews_count,

            price_level,
            estimated_price_min,
            estimated_price_max,

            is_verified,
            is_featured,

            images:restaurant_images (
              kind,
              external_url,
              storage_path,
              sort_order
            ),

            ${categoriesRelation},

            municipality:municipalities (
              id,
              name,

              department:departments (
                name
              )
            )
          `)
          .eq(
            'status',
            'approved'
          )
          .order(
            'is_featured',
            {
              ascending:
                false,
            }
          )
          .order(
            'average_rating',
            {
              ascending:
                false,
            }
          )
          .order(
            'name',
            {
              ascending:
                true,
            }
          );

      /* ====================================================== */
      /* CATEGORY                                               */
      /* ====================================================== */

      if (
        selectedCategoryId
      ) {
        query =
          query.eq(
            'restaurant_categories.category_id',
            selectedCategoryId
          );
      }

      /* ====================================================== */
      /* MUNICIPALITY                                           */
      /* ====================================================== */

      if (
        selectedMunicipalityId
      ) {
        query =
          query.eq(
            'municipality_id',
            selectedMunicipalityId
          );
      }

      /* ====================================================== */
      /* MIN PRICE                                              */
      /* ====================================================== */

      if (
        selectedMinPrice !==
        null
      ) {
        query =
          query.gte(
            'estimated_price_max',
            selectedMinPrice
          );
      }

      /* ====================================================== */
      /* MAX PRICE                                              */
      /* ====================================================== */

      if (
        selectedMaxPrice !==
        null
      ) {
        query =
          query.lte(
            'estimated_price_min',
            selectedMaxPrice
          );
      }

      const {
        data,
        error,
      } =
        await query;

      if (
        cancelled
      ) {
        return;
      }

      if (
        error
      ) {
        console.error(
          'Error cargando restaurantes:',
          error
        );

        setErrorMessage(
          'No se pudieron cargar los restaurantes.'
        );

        setRestaurants(
          []
        );

        setOpenStatuses(
          new Map()
        );

        setIsLoading(
          false
        );

        return;
      }

      const loadedRestaurants =
        (data ??
          []) as unknown as Restaurant[];

      /* ====================================================== */
      /* OPEN STATUS - ONE RPC                                  */
      /* ====================================================== */

      const restaurantIds =
        loadedRestaurants.map(
          (
            restaurant
          ) =>
            restaurant.id
        );

      let nextOpenStatuses =
        new Map<
          string,
          boolean
        >();

      if (
        restaurantIds.length >
        0
      ) {
        const {
          data:
            openStatusData,

          error:
            openStatusError,
        } =
          await supabase.rpc(
            'get_restaurants_open_status',
            {
              p_restaurant_ids:
                restaurantIds,
            }
          );

        if (
          cancelled
        ) {
          return;
        }

        if (
          openStatusError
        ) {
          console.error(
            'Error consultando horarios:',
            openStatusError
          );
        } else {
          const rows =
            (openStatusData ??
              []) as OpenStatusRow[];

          nextOpenStatuses =
            new Map<
              string,
              boolean
            >(
              rows.map(
                (
                  item
                ) => [
                  item.restaurant_id,
                  Boolean(
                    item.is_open
                  ),
                ]
              )
            );
        }
      }

      if (
        cancelled
      ) {
        return;
      }

      setRestaurants(
        loadedRestaurants
      );

      setOpenStatuses(
        nextOpenStatuses
      );

      setIsLoading(
        false
      );
    }

    fetchRestaurants();

    return () => {
      cancelled =
        true;
    };
  }, [
    selectedCategoryId,
    selectedMunicipalityId,
    selectedMinPrice,
    selectedMaxPrice,
  ]);

  /* ======================================================== */
  /* LOADING                                                  */
  /* ======================================================== */

  if (
    isLoading
  ) {
    return (
      <div className="grid grid-cols-1 gap-x-6 gap-y-9 sm:grid-cols-2 xl:grid-cols-3">
        {[
          1,
          2,
          3,
          4,
          5,
          6,
        ].map(
          (
            item
          ) => (
            <RestaurantSkeleton
              key={
                item
              }
            />
          )
        )}
      </div>
    );
  }

  /* ======================================================== */
  /* ERROR                                                    */
  /* ======================================================== */

  if (
    errorMessage
  ) {
    return (
      <div className="flex min-h-[280px] items-center justify-center rounded-sheet border border-danger/25 bg-red-50/50 px-6 text-center">
        <div className="max-w-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-danger-soft">
            <AlertCircle className="h-5 w-5 text-danger" />
          </div>

          <h3 className="mt-4 font-bold text-foreground">
            Algo salió mal
          </h3>

          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {
              errorMessage
            }
          </p>
        </div>
      </div>
    );
  }

  /* ======================================================== */
  /* EMPTY                                                    */
  /* ======================================================== */

  if (
    restaurants.length ===
    0
  ) {
    return (
      <div className="flex min-h-[320px] items-center justify-center rounded-sheet border border-dashed border-border bg-canvas px-6 text-center">
        <div className="max-w-md">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <SearchX className="h-6 w-6 text-action" />
          </div>

          <h3 className="mt-5 text-lg font-bold text-ink">
            No encontramos coincidencias
          </h3>

          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Prueba cambiando la ubicación, categoría o presupuesto para
            descubrir más restaurantes.
          </p>
        </div>
      </div>
    );
  }

  /* ======================================================== */
  /* FILTERED RESULTS                                         */
  /* ======================================================== */

  if (
    hasActiveFilters
  ) {
    return (
      <RestaurantCards
        restaurants={
          restaurants
        }
        openStatuses={
          openStatuses
        }
      />
    );
  }

  /* ======================================================== */
  /* HOME GROUPS                                              */
  /* ======================================================== */

  const featuredRestaurants =
    restaurants.filter(
      (
        restaurant
      ) =>
        restaurant.is_featured
    );

  const regularRestaurants =
    restaurants.filter(
      (
        restaurant
      ) =>
        !restaurant.is_featured
    );

  return (
    <div className="space-y-16">
      {/* ====================================================== */}
      {/* FEATURED                                               */}
      {/* ====================================================== */}

      {featuredRestaurants.length >
        0 && (
        <section>
          <div className="mb-7">
            <div className="mb-2 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-action" />

              <p className="text-xs font-bold uppercase tracking-[0.08em] text-action">
                Destacados
              </p>
            </div>

            <h3 className="text-2xl font-bold tracking-[-0.025em] text-ink">
              Lugares para descubrir primero
            </h3>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Una selección de restaurantes destacados dentro de GastroNic.
            </p>
          </div>

          <RestaurantCards
            restaurants={
              featuredRestaurants
            }
            openStatuses={
              openStatuses
            }
          />
        </section>
      )}

      {/* ====================================================== */}
      {/* ALL RESTAURANTS                                        */}
      {/* ====================================================== */}

      {regularRestaurants.length >
        0 && (
        <section>
          <div className="mb-7 border-t border-border/60 pt-10">
            <div className="mb-2 flex items-center gap-2">
              <UtensilsCrossed className="h-4 w-4 text-action" />

              <p className="text-xs font-bold uppercase tracking-[0.08em] text-action">
                Explora todos
              </p>
            </div>

            <h3 className="text-2xl font-bold tracking-[-0.025em] text-ink">
              Más restaurantes para ti
            </h3>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Sigue explorando y encuentra otros lugares disponibles en
              GastroNic.
            </p>
          </div>

          <RestaurantCards
            restaurants={
              regularRestaurants
            }
            openStatuses={
              openStatuses
            }
          />
        </section>
      )}

      {/* ====================================================== */}
      {/* ONLY FEATURED                                         */}
      {/* ====================================================== */}

      {featuredRestaurants.length >
        0 &&
        regularRestaurants.length ===
          0 && (
          <div className="border-t border-border/60 pt-6">
            <p className="text-xs text-muted-foreground">
              Actualmente todos los restaurantes disponibles están marcados
              como destacados.
            </p>
          </div>
        )}
    </div>
  );
}

/* ========================================================== */
/* CARDS                                                      */
/* ========================================================== */

export function RestaurantCards({
  restaurants,
  openStatuses,
  recommendationFeedback,
  savingFeedbackRestaurantId = null,
  onRecommendationFeedback,
}: {
  restaurants:
    Restaurant[];

  openStatuses:
    Map<
      string,
      boolean
    >;

  recommendationFeedback?:
    Map<
      string,
      RecommendationFeedbackValue
    >;

  savingFeedbackRestaurantId?:
    | string
    | null;

  onRecommendationFeedback?: (
    restaurantId: string,
    feedback:
      | 'interested'
      | 'not_interested'
  ) => void | Promise<void>;
}) {
  return (
    <div className="grid grid-cols-1 gap-x-6 gap-y-9 sm:grid-cols-2 xl:grid-cols-3">
      {restaurants.map(
        (
          restaurant
        ) => {
          const currentFeedback =
            recommendationFeedback?.get(
              restaurant.id
            ) ?? null;

          const isSavingFeedback =
            savingFeedbackRestaurantId ===
            restaurant.id;

          return (
            <div
              key={
                restaurant.id
              }
              className="min-w-0"
            >
              <RestaurantCard
                id={
                  restaurant.id
                }
                name={
                  restaurant.name
                }
                image={getImageUrl(
                  restaurant.images
                )}
                rating={Number(
                  restaurant.average_rating ??
                    0
                )}
                reviews={
                  restaurant.reviews_count ??
                  0
                }
                priceRange={getEstimatedPriceRange(
                  restaurant.estimated_price_min,
                  restaurant.estimated_price_max,
                  restaurant.price_level
                )}
                cuisine={getCategory(
                  restaurant.categories
                )}
                location={getLocation(
                  restaurant.municipality
                )}
                verified={
                  restaurant.is_verified
                }
                isOpenNow={
                  openStatuses.has(
                    restaurant.id
                  )
                    ? openStatuses.get(
                        restaurant.id
                      )!
                    : null
                }
                recommendationReasons={
                  restaurant.recommendation_reasons ??
                  []
                }
                distanceKm={
                  restaurant.recommendation_distance_km ??
                  null
                }
              />

              {onRecommendationFeedback && (
                <div className="mt-3 flex items-center gap-2 rounded-2xl border border-border/70 bg-white p-2 shadow-none">
                  <button
                    type="button"
                    disabled={
                      isSavingFeedback ||
                      currentFeedback ===
                        'interested'
                    }
                    onClick={() =>
                      onRecommendationFeedback(
                        restaurant.id,
                        'interested'
                      )
                    }
                    aria-pressed={
                      currentFeedback ===
                      'interested'
                    }
                    className={`inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-xl px-3 text-xs font-bold transition ${
                      currentFeedback ===
                      'interested'
                        ? 'bg-primary/10 text-action'
                        : 'text-muted-foreground hover:bg-primary/[0.06] hover:text-action'
                    } ${
                      isSavingFeedback
                        ? 'cursor-wait opacity-70'
                        : ''
                    }`}
                  >
                    {isSavingFeedback ? (
                      <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <ThumbsUp className="h-3.5 w-3.5" />
                    )}

                    {currentFeedback ===
                    'interested'
                      ? 'Te interesa'
                      : 'Me interesa'}
                  </button>

                  <div className="h-5 w-px bg-border/70" />

                  <button
                    type="button"
                    disabled={
                      isSavingFeedback
                    }
                    onClick={() =>
                      onRecommendationFeedback(
                        restaurant.id,
                        'not_interested'
                      )
                    }
                    className={`inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-xl px-3 text-xs font-bold text-muted-foreground transition hover:bg-danger-soft hover:text-danger ${
                      isSavingFeedback
                        ? 'cursor-wait opacity-70'
                        : ''
                    }`}
                  >
                    <ThumbsDown className="h-3.5 w-3.5" />
                    No es para mí
                  </button>
                </div>
              )}
            </div>
          );
        }
      )}
    </div>
  );
}

/* ========================================================== */
/* SKELETON                                                   */
/* ========================================================== */

function RestaurantSkeleton() {
  return <RestaurantCardSkeleton />;
}