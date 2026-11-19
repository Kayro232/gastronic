'use client';

import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import Link from 'next/link';

import {
  AlertCircle,
  BadgeCheck,
  CheckCircle2,
  ChefHat,
  LoaderCircle,
  MapPin,
  Search,
  Sparkles,
  Star,
  Users,
  Wallet,
  WheatOff,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';

const supabase =
  createClient();

/* ========================================================== */
/* TYPES                                                      */
/* ========================================================== */

interface Category {
  id: string;
  name: string;
  slug: string;
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

interface RestaurantCategory {
  category_id: string;

  category:
    | Category
    | Category[]
    | null;
}

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

interface MenuItem {
  id: string;
  name: string;
  price: number;
  is_available: boolean;

  dietary_labels:
    | string[]
    | null;

  allergens:
    | string[]
    | null;
}

interface Restaurant {
  id: string;
  name: string;
  slug: string;

  municipality_id:
    | number
    | null;

  estimated_price_min:
    | number
    | null;

  estimated_price_max:
    | number
    | null;

  average_rating:
    | number
    | null;

  reviews_count:
    | number
    | null;

  is_verified: boolean;

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

  menu_items:
    | MenuItem[]
    | null;
}

interface RestaurantRecommendation {
  restaurant: Restaurant;

  score: number;
  percentage: number;

  reasons: string[];

  isOpen: boolean;

  safeMenuItems: number;
  preferredMenuItems: number;
}

interface BudgetOption {
  label: string;

  min:
    | number
    | null;

  max:
    | number
    | null;
}

interface OpenStatusRow {
  restaurant_id: string;
  is_open: boolean;
}

interface FavoriteSignal {
  restaurant_id: string;
}

interface VisitSignal {
  restaurant_id: string;
  verification_status: string;
}

interface ReviewSignal {
  restaurant_id: string;
  rating: number;
  status: string;
}

interface UserTasteProfile {
  hasHistory: boolean;
  visitedRestaurantIds: Set<string>;
  favoriteRestaurantIds: Set<string>;
  categoryWeights: Map<string, number>;
  strongestCategoryIds: Set<string>;
}

/* ========================================================== */
/* BUDGET OPTIONS                                             */
/* ========================================================== */

const budgetOptions:
  BudgetOption[] = [
    {
      label: 'Sin límite',
      min: null,
      max: null,
    },
    {
      label: 'Hasta C$200',
      min: 0,
      max: 200,
    },
    {
      label: 'C$200 - C$400',
      min: 200,
      max: 400,
    },
    {
      label: 'C$400 - C$700',
      min: 400,
      max: 700,
    },
    {
      label:
        'C$700 - C$1,000',
      min: 700,
      max: 1000,
    },
    {
      label:
        'Más de C$1,000',
      min: 1000,
      max: null,
    },
  ];

/* ========================================================== */
/* HELPERS                                                    */
/* ========================================================== */

function normalizeArray(
  values:
    | string[]
    | null
) {
  return (
    values ?? []
  ).map(
    (value) =>
      value
        .trim()
        .toLowerCase()
  );
}

function getMunicipality(
  value:
    | Municipality
    | Municipality[]
    | null
) {
  if (!value) {
    return null;
  }

  return Array.isArray(
    value
  )
    ? value[0] ??
        null
    : value;
}

function getDepartment(
  value:
    | Department
    | Department[]
    | null
) {
  if (!value) {
    return null;
  }

  return Array.isArray(
    value
  )
    ? value[0] ??
        null
    : value;
}

function money(
  value: number
) {
  return `C$${Number(
    value
  ).toLocaleString(
    'es-NI'
  )}`;
}

function getPriceText(
  restaurant:
    Restaurant
) {
  const min =
    restaurant
      .estimated_price_min;

  const max =
    restaurant
      .estimated_price_max;

  if (
    min !== null &&
    max !== null
  ) {
    return `${money(
      min
    )} - ${money(
      max
    )} por persona`;
  }

  if (
    min !== null
  ) {
    return `Desde ${money(
      min
    )} por persona`;
  }

  if (
    max !== null
  ) {
    return `Hasta ${money(
      max
    )} por persona`;
  }

  return 'Precio no registrado';
}

function priceMatches(
  restaurant:
    Restaurant,

  selectedMin:
    | number
    | null,

  selectedMax:
    | number
    | null
) {
  if (
    selectedMin ===
      null &&
    selectedMax ===
      null
  ) {
    return true;
  }

  const restaurantMin =
    restaurant
      .estimated_price_min;

  const restaurantMax =
    restaurant
      .estimated_price_max;

  if (
    restaurantMin ===
      null &&
    restaurantMax ===
      null
  ) {
    return false;
  }

  if (
    selectedMin !==
      null &&
    restaurantMax !==
      null &&
    restaurantMax <
      selectedMin
  ) {
    return false;
  }

  if (
    selectedMax !==
      null &&
    restaurantMin !==
      null &&
    restaurantMin >
      selectedMax
  ) {
    return false;
  }

  return true;
}

function getRestaurantImage(
  images:
    | RestaurantImage[]
    | null
) {
  const ordered = [
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
    ordered.find(
      (image) =>
        image.kind ===
        'cover'
    ) ??
    ordered[0];

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

    if (
      supabaseUrl
    ) {
      return `${supabaseUrl}/storage/v1/object/public/restaurant-images/${cover.storage_path}`;
    }
  }

  return '/placeholder.svg';
}

function buildUserTasteProfile(
  restaurants: Restaurant[],
  favorites: FavoriteSignal[],
  visits: VisitSignal[],
  reviews: ReviewSignal[]
): UserTasteProfile {
  const favoriteRestaurantIds = new Set(
    favorites.map((item) => item.restaurant_id)
  );

  const visitedRestaurantIds = new Set(
    visits.map((item) => item.restaurant_id)
  );

  const restaurantWeights = new Map<string, number>();

  favorites.forEach((item) => {
    restaurantWeights.set(
      item.restaurant_id,
      (restaurantWeights.get(item.restaurant_id) ?? 0) + 3
    );
  });

  visits.forEach((item) => {
    const verified =
      item.verification_status === 'verified' ||
      item.verification_status === 'approved';

    restaurantWeights.set(
      item.restaurant_id,
      (restaurantWeights.get(item.restaurant_id) ?? 0) +
        (verified ? 2 : 1)
    );
  });

  reviews.forEach((item) => {
    if (item.status !== 'published') {
      return;
    }

    const rating = Number(item.rating ?? 0);

    if (rating >= 4) {
      restaurantWeights.set(
        item.restaurant_id,
        (restaurantWeights.get(item.restaurant_id) ?? 0) +
          (rating >= 5 ? 3 : 2)
      );
    }
  });

  const categoryWeights = new Map<string, number>();

  restaurants.forEach((restaurant) => {
    const restaurantWeight =
      restaurantWeights.get(restaurant.id) ?? 0;

    if (restaurantWeight <= 0) {
      return;
    }

    (restaurant.categories ?? []).forEach((item) => {
      categoryWeights.set(
        item.category_id,
        (categoryWeights.get(item.category_id) ?? 0) +
          restaurantWeight
      );
    });
  });

  const orderedCategories = Array.from(
    categoryWeights.entries()
  ).sort((a, b) => b[1] - a[1]);

  const strongestCategoryIds = new Set(
    orderedCategories.slice(0, 3).map(([categoryId]) => categoryId)
  );

  return {
    hasHistory:
      favoriteRestaurantIds.size > 0 ||
      visitedRestaurantIds.size > 0 ||
      reviews.length > 0,
    visitedRestaurantIds,
    favoriteRestaurantIds,
    categoryWeights,
    strongestCategoryIds,
  };
}

function getPersonalTasteScore(
  restaurant: Restaurant,
  tasteProfile: UserTasteProfile
) {
  if (!tasteProfile.hasHistory) {
    return 0;
  }

  const categoryIds = (restaurant.categories ?? []).map(
    (item) => item.category_id
  );

  const matchingWeights = categoryIds.map(
    (categoryId) =>
      tasteProfile.categoryWeights.get(categoryId) ?? 0
  );

  const strongestMatch = Math.max(...matchingWeights, 0);

  if (strongestMatch <= 0) {
    return 0;
  }

  const globalMax = Math.max(
    ...Array.from(tasteProfile.categoryWeights.values()),
    1
  );

  return Math.max(
    3,
    Math.round((strongestMatch / globalMax) * 15)
  );
}

/* ========================================================== */
/* COMPONENT                                                  */
/* ========================================================== */

export function RecommendationForm() {
  const [
    categories,
    setCategories,
  ] =
    useState<
      Category[]
    >([]);

  const [
    municipalities,
    setMunicipalities,
  ] =
    useState<
      Municipality[]
    >([]);

  const [
    dietaryOptions,
    setDietaryOptions,
  ] =
    useState<
      string[]
    >([]);

  const [
    allergenOptions,
    setAllergenOptions,
  ] =
    useState<
      string[]
    >([]);

  const [
    selectedMunicipality,
    setSelectedMunicipality,
  ] =
    useState<
      number | null
    >(null);

  const [
    selectedCategory,
    setSelectedCategory,
  ] =
    useState<
      string | null
    >(null);

  const [
    selectedBudgetIndex,
    setSelectedBudgetIndex,
  ] =
    useState(0);

  const [
    selectedDietaryLabel,
    setSelectedDietaryLabel,
  ] =
    useState('');

  const [
    selectedAllergens,
    setSelectedAllergens,
  ] =
    useState<
      string[]
    >([]);

  const [
    people,
    setPeople,
  ] =
    useState(2);

  const [
    recommendations,
    setRecommendations,
  ] =
    useState<
      RestaurantRecommendation[]
    >([]);

  const [
    hasSearched,
    setHasSearched,
  ] =
    useState(false);

  const [
    isLoadingOptions,
    setIsLoadingOptions,
  ] =
    useState(true);

  const [
    isSearching,
    setIsSearching,
  ] =
    useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] =
    useState('');

  /* ======================================================== */
  /* LOAD OPTIONS                                             */
  /* ======================================================== */

  useEffect(() => {
    let cancelled =
      false;

    async function loadOptions() {
      setIsLoadingOptions(
        true
      );

      const [
        categoriesResult,
        municipalitiesResult,
        menuResult,
      ] =
        await Promise.all([
          supabase
            .from(
              'categories'
            )
            .select(
              'id, name, slug'
            )
            .eq(
              'is_active',
              true
            )
            .order(
              'name'
            ),

          supabase
            .from(
              'municipalities'
            )
            .select(`
              id,
              name,

              department:departments (
                name
              )
            `)
            .order(
              'name'
            ),

          supabase
            .from(
              'menu_items'
            )
            .select(
              'dietary_labels, allergens'
            ),
        ]);

      if (
        cancelled
      ) {
        return;
      }

      if (
        categoriesResult.error
      ) {
        console.error(
          'Error cargando categorías:',
          categoriesResult.error
        );
      } else {
        setCategories(
          (categoriesResult.data ??
            []) as Category[]
        );
      }

      if (
        municipalitiesResult.error
      ) {
        console.error(
          'Error cargando municipios:',
          municipalitiesResult.error
        );
      } else {
        setMunicipalities(
          (municipalitiesResult.data ??
            []) as unknown as Municipality[]
        );
      }

      if (
        menuResult.error
      ) {
        console.error(
          'Error cargando preferencias:',
          menuResult.error
        );
      } else {
        const dietarySet =
          new Set<string>();

        const allergenSet =
          new Set<string>();

        (
          menuResult.data ??
          []
        ).forEach(
          (item) => {
            (
              item.dietary_labels ??
              []
            ).forEach(
              (
                label: string
              ) => {
                dietarySet.add(
                  label
                );
              }
            );

            (
              item.allergens ??
              []
            ).forEach(
              (
                allergen: string
              ) => {
                if (
                  allergen
                    .toLowerCase()
                    .trim() ===
                  'leche'
                ) {
                  allergenSet.add(
                    'Lácteos'
                  );
                } else {
                  allergenSet.add(
                    allergen
                  );
                }
              }
            );
          }
        );

        const preferredOrder =
          [
            'Vegetariano',
            'Vegano',
            'Alto en proteína',
            'Natural',
          ];

        const availableDietary =
          preferredOrder.filter(
            (option) =>
              dietarySet.has(
                option
              )
          );

        setDietaryOptions(
          availableDietary
        );

        setAllergenOptions(
          Array.from(
            allergenSet
          ).sort(
            (
              a,
              b
            ) =>
              a.localeCompare(
                b,
                'es'
              )
          )
        );
      }

      setIsLoadingOptions(
        false
      );
    }

    loadOptions();

    return () => {
      cancelled =
        true;
    };
  }, []);

  /* ======================================================== */
  /* BUDGET                                                   */
  /* ======================================================== */

  const selectedBudget =
    budgetOptions[
      selectedBudgetIndex
    ];

  const totalBudgetText =
    useMemo(() => {
      const min =
        selectedBudget.min;

      const max =
        selectedBudget.max;

      if (
        min === null &&
        max === null
      ) {
        return null;
      }

      if (
        min !== null &&
        max !== null
      ) {
        return `${money(
          min *
            people
        )} - ${money(
          max *
            people
        )}`;
      }

      if (
        min !== null
      ) {
        return `Desde ${money(
          min *
            people
        )}`;
      }

      if (
        max !== null
      ) {
        return `Hasta ${money(
          max *
            people
        )}`;
      }

      return null;
    }, [
      selectedBudget,
      people,
    ]);

  /* ======================================================== */
  /* ALLERGENS                                                */
  /* ======================================================== */

  function toggleAllergen(
    allergen: string
  ) {
    setSelectedAllergens(
      (current) =>
        current.includes(
          allergen
        )
          ? current.filter(
              (item) =>
                item !==
                allergen
            )
          : [
              ...current,
              allergen,
            ]
    );
  }

  /* ======================================================== */
  /* RECOMMEND                                                */
  /* ======================================================== */

  async function handleRecommend() {
    setIsSearching(
      true
    );

    setErrorMessage(
      ''
    );

    setHasSearched(
      true
    );

    /* ====================================================== */
    /* LOAD RESTAURANTS                                       */
    /* ====================================================== */

    const {
      data,
      error,
    } =
      await supabase
        .from(
          'restaurants'
        )
        .select(`
          id,
          name,
          slug,
          municipality_id,
          estimated_price_min,
          estimated_price_max,
          average_rating,
          reviews_count,
          is_verified,

          images:restaurant_images (
            kind,
            external_url,
            storage_path,
            sort_order
          ),

          categories:restaurant_categories (
            category_id,

            category:categories (
              id,
              name,
              slug
            )
          ),

          municipality:municipalities (
            id,
            name,

            department:departments (
              name
            )
          ),

          menu_items (
            id,
            name,
            price,
            is_available,
            dietary_labels,
            allergens
          )
        `)
        .eq(
          'status',
          'approved'
        );

    if (
      error
    ) {
      console.error(
        'Error buscando restaurantes:',
        error
      );

      setRecommendations(
        []
      );

      setErrorMessage(
        'No se pudieron generar recomendaciones.'
      );

      setIsSearching(
        false
      );

      return;
    }

    const restaurants =
      (data ??
        []) as unknown as Restaurant[];

    /* ====================================================== */
    /* USER TASTE PROFILE                                     */
    /* ====================================================== */

    let tasteProfile: UserTasteProfile = {
      hasHistory: false,
      visitedRestaurantIds: new Set<string>(),
      favoriteRestaurantIds: new Set<string>(),
      categoryWeights: new Map<string, number>(),
      strongestCategoryIds: new Set<string>(),
    };

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (
      userError &&
      userError.name !== 'AuthSessionMissingError'
    ) {
      console.error(
        'Error obteniendo usuario para personalización:',
        userError
      );
    }

    if (user) {
      const [
        favoritesResult,
        visitsResult,
        reviewsResult,
      ] = await Promise.all([
        supabase
          .from('favorites')
          .select('restaurant_id')
          .eq('user_id', user.id),

        supabase
          .from('visits')
          .select('restaurant_id, verification_status')
          .eq('user_id', user.id),

        supabase
          .from('reviews')
          .select('restaurant_id, rating, status')
          .eq('user_id', user.id),
      ]);

      if (favoritesResult.error) {
        console.error(
          'Error cargando favoritos para el recomendador:',
          favoritesResult.error
        );
      }

      if (visitsResult.error) {
        console.error(
          'Error cargando visitas para el recomendador:',
          visitsResult.error
        );
      }

      if (reviewsResult.error) {
        console.error(
          'Error cargando reseñas para el recomendador:',
          reviewsResult.error
        );
      }

      tasteProfile = buildUserTasteProfile(
        restaurants,
        (favoritesResult.data ?? []) as FavoriteSignal[],
        (visitsResult.data ?? []) as VisitSignal[],
        (reviewsResult.data ?? []) as ReviewSignal[]
      );
    }

    /* ====================================================== */
    /* HARD FILTERS                                           */
    /* ====================================================== */

    const eligibleRestaurants = restaurants.filter(
      (restaurant) => {
        if (
          selectedMunicipality !== null &&
          restaurant.municipality_id !== selectedMunicipality
        ) {
          return false;
        }

        if (selectedCategory !== null) {
          const categoryMatch =
            restaurant.categories?.some(
              (item) => item.category_id === selectedCategory
            ) ?? false;

          if (!categoryMatch) {
            return false;
          }
        }

        if (
          (selectedBudget.min !== null ||
            selectedBudget.max !== null) &&
          !priceMatches(
            restaurant,
            selectedBudget.min,
            selectedBudget.max
          )
        ) {
          return false;
        }

        return true;
      }
    );

    /* ====================================================== */
    /* OPEN STATUS - BATCH                                    */
    /* ====================================================== */

    const restaurantIds =
      eligibleRestaurants.map(
        (
          restaurant
        ) =>
          restaurant.id
      );

    let openStatusRows:
      OpenStatusRow[] = [];

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
        openStatusError
      ) {
        console.error(
          'Error consultando horarios:',
          openStatusError
        );
      } else {
        openStatusRows =
          (openStatusData ??
            []) as OpenStatusRow[];
      }
    }

    const openStatusMap =
      new Map<
        string,
        boolean
      >(
        openStatusRows.map(
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

    /* ====================================================== */
    /* SCORE RESTAURANTS                                      */
    /* ====================================================== */

    const results =
      eligibleRestaurants.map(
        (
          restaurant
        ): RestaurantRecommendation => {
          let score =
            0;

          let maxScore =
            0;

          const reasons:
            string[] = [];

          /* ================================================ */
          /* EXPLICIT PREFERENCES                              */
          /* ================================================ */

          if (selectedMunicipality !== null) {
            maxScore += 20;
            score += 20;

            reasons.push(
              'Está exactamente en la ubicación que seleccionaste.'
            );
          }

          if (selectedCategory !== null) {
            maxScore += 30;
            score += 30;

            reasons.push(
              'Coincide con el tipo de comida que buscas.'
            );
          }

          if (
            selectedBudget.min !== null ||
            selectedBudget.max !== null
          ) {
            maxScore += 25;
            score += 25;

            reasons.push(
              'Está dentro de tu presupuesto aproximado.'
            );
          }

          /* ================================================ */
          /* AVAILABLE MENU                                   */
          /* ================================================ */

          const availableMenu =
            (
              restaurant.menu_items ??
              []
            ).filter(
              (
                item
              ) =>
                item.is_available
            );

          /* ================================================ */
          /* ALLERGENS                                        */
          /* ================================================ */

          const normalizedSelectedAllergens =
            selectedAllergens.map(
              (
                value
              ) =>
                value
                  .toLowerCase()
                  .trim()
            );

          const safeMenuItems =
            availableMenu.filter(
              (
                item
              ) => {
                const allergens =
                  normalizeArray(
                    item.allergens
                  ).map(
                    (
                      allergen
                    ) =>
                      allergen ===
                      'leche'
                        ? 'lácteos'
                        : allergen
                  );

                return !normalizedSelectedAllergens.some(
                  (
                    selectedAllergen
                  ) =>
                    allergens.includes(
                      selectedAllergen
                    )
                );
              }
            );

          if (
            selectedAllergens.length >
            0
          ) {
            maxScore +=
              5;

            if (
              safeMenuItems.length >
              0
            ) {
              score +=
                5;

              reasons.push(
                `Tiene ${safeMenuItems.length} opción${
                  safeMenuItems.length ===
                  1
                    ? ''
                    : 'es'
                } disponible${
                  safeMenuItems.length ===
                  1
                    ? ''
                    : 's'
                } sin los alérgenos que quieres evitar.`
              );
            }
          }

          /* ================================================ */
          /* DIETARY PREFERENCE                               */
          /* ================================================ */

          let preferredMenuItems =
            0;

          if (
            selectedDietaryLabel
          ) {
            maxScore +=
              10;

            const normalizedPreference =
              selectedDietaryLabel
                .toLowerCase()
                .trim();

            preferredMenuItems =
              safeMenuItems.filter(
                (
                  item
                ) =>
                  normalizeArray(
                    item.dietary_labels
                  ).includes(
                    normalizedPreference
                  )
              ).length;

            if (
              preferredMenuItems >
              0
            ) {
              score +=
                10;

              reasons.push(
                `Tiene ${preferredMenuItems} opción${
                  preferredMenuItems ===
                  1
                    ? ''
                    : 'es'
                } que coincide${
                  preferredMenuItems ===
                  1
                    ? ''
                    : 'n'
                } con tu preferencia alimenticia.`
              );
            }
          }

          /* ================================================ */
          /* PERSONAL TASTE                                    */
          /* ================================================ */

          if (
            tasteProfile.hasHistory &&
            selectedCategory === null
          ) {
            maxScore += 15;

            const personalTasteScore =
              getPersonalTasteScore(
                restaurant,
                tasteProfile
              );

            score += personalTasteScore;

            if (personalTasteScore >= 8) {
              reasons.push(
                'Se parece a tipos de lugares que ya te han gustado.'
              );
            }
          }

          /* ================================================ */
          /* DISCOVERY BONUS                                   */
          /* ================================================ */

          if (tasteProfile.hasHistory) {
            maxScore += 5;

            const alreadyVisited =
              tasteProfile.visitedRestaurantIds.has(
                restaurant.id
              );

            if (!alreadyVisited) {
              score += 5;

              reasons.push(
                'Es una opción nueva dentro de tu recorrido gastronómico.'
              );
            }
          }

          /* ================================================ */
          /* OPEN NOW                                         */
          /* ================================================ */

          maxScore +=
            5;

          const isOpen =
            openStatusMap.get(
              restaurant.id
            ) ??
            false;

          if (
            isOpen
          ) {
            score +=
              5;

            reasons.push(
              'Está abierto ahora.'
            );
          }

          /* ================================================ */
          /* QUALITY                                          */
          /* ================================================ */

          maxScore += 7;

          const rating =
            Number(
              restaurant.average_rating ??
                0
            );

          const reviewsCount =
            Number(
              restaurant.reviews_count ??
                0
            );

          let qualityScore = 0;

          if (rating >= 4.7) {
            qualityScore += 4;
          } else if (rating >= 4.3) {
            qualityScore += 3;
          } else if (rating >= 3.8) {
            qualityScore += 2;
          } else if (rating >= 3) {
            qualityScore += 1;
          }

          if (reviewsCount >= 20) {
            qualityScore += 2;
          } else if (reviewsCount >= 5) {
            qualityScore += 1;
          }

          if (restaurant.is_verified) {
            qualityScore += 1;
          }

          qualityScore =
            Math.min(
              qualityScore,
              7
            );

          score +=
            qualityScore;

          if (rating >= 4) {
            reasons.push(
              reviewsCount >= 5
                ? 'Tiene buenas valoraciones respaldadas por varias reseñas.'
                : 'Tiene buenas valoraciones de la comunidad.'
            );
          }

          if (
            restaurant.is_verified
          ) {
            reasons.push(
              'El establecimiento está verificado.'
            );
          }

          /* ================================================ */
          /* PERCENTAGE                                       */
          /* ================================================ */

          const percentage =
            maxScore >
            0
              ? Math.round(
                  (
                    score /
                    maxScore
                  ) *
                    100
                )
              : 0;

          return {
            restaurant,
            score,
            percentage,
            reasons,
            isOpen,

            safeMenuItems:
              safeMenuItems.length,

            preferredMenuItems,
          };
        }
      );

    /* ====================================================== */
    /* SAFE RESULTS                                           */
    /* ====================================================== */

    const safeResults =
      selectedAllergens.length >
      0
        ? results.filter(
            (
              item
            ) =>
              item.safeMenuItems >
              0
          )
        : results;

    /* ====================================================== */
    /* SORT                                                   */
    /* ====================================================== */

    const sorted =
      safeResults.sort(
        (
          a,
          b
        ) => {
          if (
            b.percentage !==
            a.percentage
          ) {
            return (
              b.percentage -
              a.percentage
            );
          }

          return (
            Number(
              b.restaurant
                .average_rating ??
                0
            ) -
            Number(
              a.restaurant
                .average_rating ??
                0
            )
          );
        }
      );

    setRecommendations(
      sorted.slice(
        0,
        3
      )
    );

    setIsSearching(
      false
    );
  }

  /* ======================================================== */
  /* LOADING                                                  */
  /* ======================================================== */

  if (
    isLoadingOptions
  ) {
    return (
      <div className="flex min-h-[220px] sm:min-h-[300px] items-center justify-center">
        <LoaderCircle className="mr-3 h-6 w-6 animate-spin text-action" />

        <span className="text-muted-foreground">
          Preparando recomendador...
        </span>
      </div>
    );
  }

  /* ======================================================== */
  /* RENDER                                                   */
  /* ======================================================== */

  return (
    <div className="space-y-7 sm:space-y-10">
      {/* ====================================================== */}
      {/* FORM                                                   */}
      {/* ====================================================== */}

      <div className="w-full sm:rounded-3xl sm:border sm:border-border/70 sm:bg-white sm:p-6 sm:shadow-sm md:p-8">
        <div className="mb-5 px-0 sm:mb-8">
          <div className="mb-2 flex items-start gap-3 sm:mb-3 sm:items-center">
            <div className="hidden h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 sm:flex sm:h-12 sm:w-12 sm:rounded-2xl">
              <ChefHat className="h-5 w-5 text-action sm:h-6 sm:w-6" />
            </div>

            <div>
              <h2 className="text-xl font-bold tracking-[-0.02em] text-foreground sm:text-2xl">
                Tus preferencias
              </h2>

              <p className="mt-1 text-xs leading-5 text-muted-foreground sm:text-sm">
                Personaliza la búsqueda para encontrar las mejores
                coincidencias.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:gap-6 md:grid-cols-2 md:gap-8">
          {/* ================================================== */}
          {/* LOCATION                                           */}
          {/* ================================================== */}

          <div>
            <label
              htmlFor="recommendation-location"
              className="mb-2 flex items-center gap-2 text-sm font-semibold"
            >
              <MapPin className="h-4 w-4 text-action" />

              ¿Dónde quieres comer?
            </label>

            <select
              id="recommendation-location"
              value={
                selectedMunicipality ??
                ''
              }
              onChange={(event) =>
                setSelectedMunicipality(
                  event.target.value
                    ? Number(
                        event.target.value
                      )
                    : null
                )
              }
              className="h-12 w-full rounded-xl border border-border bg-white px-4 text-sm outline-none transition focus:border-primary/30 focus:bg-white focus:ring-4 focus:ring-primary/[0.06] sm:h-12"
            >
              <option value="">
                Cualquier ubicación
              </option>

              {municipalities.map(
                (
                  municipality
                ) => {
                  const department =
                    getDepartment(
                      municipality.department
                    );

                  return (
                    <option
                      key={
                        municipality.id
                      }
                      value={
                        municipality.id
                      }
                    >
                      {
                        municipality.name
                      }

                      {department
                        ? `, ${department.name}`
                        : ''}
                    </option>
                  );
                }
              )}
            </select>
          </div>

          {/* ================================================== */}
          {/* CATEGORY                                           */}
          {/* ================================================== */}

          <div>
            <label
              htmlFor="recommendation-category"
              className="mb-2 flex items-center gap-2 text-sm font-semibold"
            >
              <ChefHat className="h-4 w-4 text-action" />

              ¿Qué te provoca?
            </label>

            <select
              id="recommendation-category"
              value={
                selectedCategory ??
                ''
              }
              onChange={(event) =>
                setSelectedCategory(
                  event.target.value ||
                    null
                )
              }
              className="h-12 w-full rounded-xl border border-border bg-white px-4 text-sm outline-none transition focus:border-primary/30 focus:bg-white focus:ring-4 focus:ring-primary/[0.06] sm:h-12"
            >
              <option value="">
                Sorpréndeme
              </option>

              {categories.map(
                (
                  category
                ) => (
                  <option
                    key={
                      category.id
                    }
                    value={
                      category.id
                    }
                  >
                    {
                      category.name
                    }
                  </option>
                )
              )}
            </select>
          </div>

          {/* ================================================== */}
          {/* BUDGET                                             */}
          {/* ================================================== */}

          <div>
            <label
              htmlFor="recommendation-budget"
              className="mb-2 flex items-center gap-2 text-sm font-semibold"
            >
              <Wallet className="h-4 w-4 text-action" />

              Presupuesto por persona
            </label>

            <select
              id="recommendation-budget"
              value={
                selectedBudgetIndex
              }
              onChange={(event) =>
                setSelectedBudgetIndex(
                  Number(
                    event.target.value
                  )
                )
              }
              className="h-12 w-full rounded-xl border border-border bg-white px-4 text-sm outline-none transition focus:border-primary/30 focus:bg-white focus:ring-4 focus:ring-primary/[0.06] sm:h-12"
            >
              {budgetOptions.map(
                (
                  option,
                  index
                ) => (
                  <option
                    key={
                      option.label
                    }
                    value={
                      index
                    }
                  >
                    {
                      option.label
                    }
                  </option>
                )
              )}
            </select>
          </div>

          {/* ================================================== */}
          {/* PEOPLE                                             */}
          {/* ================================================== */}

          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-semibold">
              <Users className="h-4 w-4 text-action" />

              ¿Cuántas personas?
            </label>

            <div className="flex h-12 items-center overflow-hidden rounded-xl border border-border bg-white">
              <button
                type="button"
                onClick={() =>
                  setPeople(
                    (
                      current
                    ) =>
                      Math.max(
                        1,
                        current -
                          1
                      )
                  )
                }
                className="h-full w-11 text-lg font-bold transition hover:bg-muted sm:w-12 sm:text-xl"
              >
                −
              </button>

              <div className="flex-1 text-center font-semibold">
                {
                  people
                }
              </div>

              <button
                type="button"
                onClick={() =>
                  setPeople(
                    (
                      current
                    ) =>
                      Math.min(
                        20,
                        current +
                          1
                      )
                  )
                }
                className="h-full w-11 text-lg font-bold transition hover:bg-muted sm:w-12 sm:text-xl"
              >
                +
              </button>
            </div>

            {totalBudgetText && (
              <p className="mt-2 text-xs text-muted-foreground">
                Presupuesto total estimado para{' '}
                {people}{' '}
                {people ===
                1
                  ? 'persona'
                  : 'personas'}
                :{' '}

                <strong>
                  {
                    totalBudgetText
                  }
                </strong>
              </p>
            )}
          </div>

          {/* ================================================== */}
          {/* DIET                                               */}
          {/* ================================================== */}

          <div>
            <label
              htmlFor="dietary-preference"
              className="mb-2 flex items-center gap-2 text-sm font-semibold"
            >
              <CheckCircle2 className="h-4 w-4 text-action" />

              Preferencia alimenticia
            </label>

            <select
              id="dietary-preference"
              value={
                selectedDietaryLabel
              }
              onChange={(event) =>
                setSelectedDietaryLabel(
                  event.target.value
                )
              }
              className="h-12 w-full rounded-xl border border-border bg-white px-4 text-sm outline-none transition focus:border-primary/30 focus:bg-white focus:ring-4 focus:ring-primary/[0.06] sm:h-12"
            >
              <option value="">
                Ninguna preferencia
              </option>

              {dietaryOptions.map(
                (
                  option
                ) => (
                  <option
                    key={
                      option
                    }
                    value={
                      option
                    }
                  >
                    {
                      option
                    }
                  </option>
                )
              )}
            </select>
          </div>

          {/* ================================================== */}
          {/* ALLERGENS                                          */}
          {/* ================================================== */}

          <div>
            <label className="mb-2.5 flex items-center gap-2 text-sm font-semibold sm:mb-3">
              <WheatOff className="h-4 w-4 text-action" />

              ¿Qué debes evitar?
            </label>

            {allergenOptions.length ===
            0 ? (
              <p className="mt-1 text-xs leading-5 text-muted-foreground sm:text-sm">
                No hay alérgenos registrados.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {allergenOptions.map(
                  (
                    allergen
                  ) => {
                    const selected =
                      selectedAllergens.includes(
                        allergen
                      );

                    return (
                      <button
                        key={
                          allergen
                        }
                        type="button"
                        onClick={() =>
                          toggleAllergen(
                            allergen
                          )
                        }
                        className={`rounded-full border px-3 py-2 text-xs font-semibold transition sm:text-sm ${
                          selected
                            ? 'border-primary bg-action text-white'
                            : 'border-border bg-white hover:border-primary/40'
                        }`}
                      >
                        {
                          allergen
                        }
                      </button>
                    );
                  }
                )}
              </div>
            )}
          </div>
        </div>

        {/* ==================================================== */}
        {/* SUBMIT                                               */}
        {/* ==================================================== */}

        <div className="mt-6 sm:mt-8">
          <Button
            type="button"
            onClick={
              handleRecommend
            }
            disabled={
              isSearching
            }
            className="h-12 w-full rounded-xl bg-action text-sm font-semibold text-white hover:bg-action-hover sm:h-auto sm:w-auto sm:px-10 sm:py-6 sm:text-base"
          >
            {isSearching ? (
              <>
                <LoaderCircle className="mr-2 h-5 w-5 animate-spin" />

                Analizando opciones...
              </>
            ) : (
              <>
                <Search className="mr-2 h-5 w-5" />

                Encontrar mi restaurante
              </>
            )}
          </Button>
        </div>
      </div>

      {/* ====================================================== */}
      {/* ERROR                                                  */}
      {/* ====================================================== */}

      {errorMessage && (
        <div className="flex items-start gap-3 rounded-2xl border border-danger/25 bg-danger-soft p-4 sm:items-center sm:p-5 text-danger">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />

          <p className="text-sm">
            {
              errorMessage
            }
          </p>
        </div>
      )}

      {/* ====================================================== */}
      {/* RESULTS                                                */}
      {/* ====================================================== */}

      {hasSearched &&
        !isSearching &&
        !errorMessage && (
          <section className="space-y-5 sm:space-y-6">
            {/* ================================================= */}
            {/* HEADER                                            */}
            {/* ================================================= */}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="mb-1.5 text-xs font-bold uppercase tracking-[0.08em] text-action sm:mb-2 sm:text-xs sm:tracking-[0.08em]">
                  Recomendaciones para ti
                </p>

                <h2 className="text-lg font-bold tracking-[-0.025em] sm:text-xl text-ink sm:text-2xl md:text-3xl">
                  Tus mejores opciones
                </h2>

                <p className="mt-2 max-w-2xl text-xs leading-5 text-muted-foreground sm:text-sm sm:leading-6">
                  Comparamos opciones reales según lo que elegiste y, cuando
                  tienes historial en GastroNic, también usamos tus favoritos,
                  visitas y reseñas para afinar el resultado.
                </p>
              </div>

              {recommendations.length >
                0 && (
                <div className="w-fit rounded-full border border-border bg-white px-4 py-2 text-xs font-semibold text-muted-foreground shadow-sm">
                  {
                    recommendations.length
                  }{' '}
                  {recommendations.length ===
                  1
                    ? 'resultado'
                    : 'resultados'}
                </div>
              )}
            </div>

            {/* ================================================= */}
            {/* EMPTY                                             */}
            {/* ================================================= */}

            {recommendations.length ===
            0 ? (
              <div className="rounded-card border border-border bg-white px-5 py-10 sm:rounded-sheet sm:px-6 sm:py-14 text-center shadow-sm">
                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                  <ChefHat className="h-7 w-7 text-action" />
                </div>

                <h3 className="text-lg font-bold text-ink">
                  No encontramos una coincidencia adecuada
                </h3>

                <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted-foreground">
                  Prueba ampliando tu presupuesto, cambiando de ubicación o
                  eliminando alguna restricción para mostrarte más opciones.
                </p>
              </div>
            ) : (
              /* =============================================== */
              /* CARDS                                           */
              /* =============================================== */

              <div className="grid w-full grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-3">
                {recommendations.map(
                  (
                    recommendation,
                    index
                  ) => {
                    const {
                      restaurant,
                    } =
                      recommendation;

                    const municipality =
                      getMunicipality(
                        restaurant.municipality
                      );

                    const department =
                      getDepartment(
                        municipality?.department ??
                          null
                      );

                    const imageUrl =
                      getRestaurantImage(
                        restaurant.images
                      );

                    const positionLabel =
                      index ===
                      0
                        ? 'Mejor opción'
                        : index ===
                            1
                          ? 'Segunda opción'
                          : 'Tercera opción';

                    return (
                      <article
                        key={
                          restaurant.id
                        }
                        className={`group relative flex h-full flex-col overflow-hidden rounded-card border bg-white sm:rounded-card transition-all duration-300 hover:-translate-y-1 hover:shadow-raised ${
                          index ===
                          0
                            ? 'border-primary/25 shadow-none'
                            : 'border-border/80 shadow-sm'
                        }`}
                      >
                        {/* ===================================== */}
                        {/* IMAGE                                 */}
                        {/* ===================================== */}

                        <Link
                          href={`/restaurant/${restaurant.id}`}
                          className="relative block aspect-[16/9] overflow-hidden bg-[#E8ECEA] sm:aspect-[16/10]"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={
                              imageUrl
                            }
                            alt={
                              restaurant.name
                            }
                            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                          />

                          <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/[0.03] to-transparent" />

                          <div className="absolute left-3 top-3 sm:left-4 sm:top-4">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full border border-white/20 px-3 py-1.5 text-xs font-bold shadow-sm backdrop-blur ${
                                index ===
                                0
                                  ? 'bg-action text-white'
                                  : 'bg-white/90 text-ink'
                              }`}
                            >
                              {index ===
                                0 && (
                                <Sparkles className="h-3 w-3" />
                              )}

                              {
                                positionLabel
                              }
                            </span>
                          </div>

                          {restaurant.is_verified && (
                            <div className="absolute right-3 top-3 sm:right-4 sm:top-4 flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-white/90 text-action shadow-sm backdrop-blur">
                              <BadgeCheck className="h-4 w-4" />
                            </div>
                          )}

                          <div
                            className={`absolute bottom-3 right-3 sm:bottom-4 sm:right-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold backdrop-blur ${
                              recommendation.isOpen
                                ? 'bg-emerald-500/90 text-white'
                                : 'bg-black/55 text-white'
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                recommendation.isOpen
                                  ? 'bg-white'
                                  : 'bg-red-400'
                              }`}
                            />

                            {recommendation.isOpen
                              ? 'Abierto ahora'
                              : 'Cerrado'}
                          </div>
                        </Link>

                        {/* ===================================== */}
                        {/* COMPATIBILITY                        */}
                        {/* ===================================== */}

                        <div className="border-b border-border/60 bg-surface-2 px-4 py-3.5 sm:px-5 sm:py-4">
                          <div className="flex items-center justify-between gap-4">
                            <div>
                              <p className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">
                                Compatibilidad
                              </p>

                              <div className="mt-1 flex items-end gap-1">
                                <span className="text-2xl font-bold tracking-[-0.02em] sm:text-3xl text-ink">
                                  {
                                    recommendation.percentage
                                  }
                                </span>

                                <span className="mb-1 text-xs font-bold text-action">
                                  %
                                </span>
                              </div>
                            </div>

                            <div className="min-w-[110px] flex-1">
                              <div className="h-1.5 overflow-hidden rounded-full bg-[#E3E9E7]">
                                <div
                                  className="h-full rounded-full bg-action transition-all duration-700"
                                  style={{
                                    width: `${Math.min(
                                      recommendation.percentage,
                                      100
                                    )}%`,
                                  }}
                                />
                              </div>

                              <p className="mt-2 text-right text-xs font-medium text-muted-foreground">
                                Según tus preferencias
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* ===================================== */}
                        {/* BODY                                 */}
                        {/* ===================================== */}

                        <div className="flex flex-1 flex-col p-4 sm:p-5">
                          <div>
                            <Link
                              href={`/restaurant/${restaurant.id}`}
                              className="block"
                            >
                              <h3 className="text-lg font-bold tracking-[-0.025em] sm:text-xl text-ink transition group-hover:text-action">
                                {
                                  restaurant.name
                                }
                              </h3>
                            </Link>

                            <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                              <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-action" />

                              <span className="truncate">
                                {municipality
                                  ? `${municipality.name}${
                                      department
                                        ? `, ${department.name}`
                                        : ''
                                    }`
                                  : 'Nicaragua'}
                              </span>
                            </div>
                          </div>

                          {/* =================================== */}
                          {/* META                               */}
                          {/* =================================== */}

                          <div className="mt-4 grid grid-cols-2 gap-2.5 sm:mt-5 sm:gap-3">
                            <div className="rounded-xl bg-surface-2 p-2.5 sm:rounded-2xl sm:p-3">
                              <div className="flex items-center gap-1.5">
                                <Star className="h-3.5 w-3.5 fill-secondary text-secondary" />

                                <span className="text-xs font-bold text-ink">
                                  {Number(
                                    restaurant.average_rating ??
                                      0
                                  ).toFixed(
                                    1
                                  )}
                                </span>
                              </div>

                              <p className="mt-1 text-xs text-muted-foreground">
                                {restaurant.reviews_count ??
                                  0}{' '}
                                {restaurant.reviews_count ===
                                1
                                  ? 'reseña'
                                  : 'reseñas'}
                              </p>
                            </div>

                            <div className="rounded-xl bg-surface-2 p-2.5 sm:rounded-2xl sm:p-3">
                              <div className="flex items-center gap-1.5">
                                <Wallet className="h-3.5 w-3.5 text-action" />

                                <span className="text-xs font-bold text-ink">
                                  Presupuesto
                                </span>
                              </div>

                              <p className="mt-1 line-clamp-2 text-xs leading-4 text-muted-foreground">
                                {getPriceText(
                                  restaurant
                                )}
                              </p>
                            </div>
                          </div>

                          {/* =================================== */}
                          {/* REASONS                            */}
                          {/* =================================== */}

                          <div className="mt-4 flex-1 sm:mt-5">
                            <p className="mb-2.5 text-xs font-bold text-ink sm:mb-3">
                              ¿Por qué te lo recomendamos?
                            </p>

                            <ul className="space-y-2 sm:space-y-2.5">
                              {recommendation.reasons
                                .slice(
                                  0,
                                  4
                                )
                                .map(
                                  (
                                    reason
                                  ) => (
                                    <li
                                      key={
                                        reason
                                      }
                                      className="flex items-start gap-2 text-xs leading-5 text-muted-foreground"
                                    >
                                      <div className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
                                        <CheckCircle2 className="h-2.5 w-2.5 text-action" />
                                      </div>

                                      <span>
                                        {
                                          reason
                                        }
                                      </span>
                                    </li>
                                  )
                                )}
                            </ul>
                          </div>

                          {/* =================================== */}
                          {/* VERIFIED                           */}
                          {/* =================================== */}

                          {restaurant.is_verified && (
                            <div className="mt-4 flex items-center gap-2 rounded-xl sm:mt-5 bg-primary/[0.055] px-3 py-2 text-xs font-semibold text-action">
                              <BadgeCheck className="h-3.5 w-3.5" />

                              Establecimiento verificado
                            </div>
                          )}

                          {/* =================================== */}
                          {/* ACTION                             */}
                          {/* =================================== */}

                          <Button
                            asChild
                            className={`mt-4 h-11 w-full font-semibold sm:mt-5 ${
                              index ===
                              0
                                ? 'bg-action text-white hover:bg-action-hover'
                                : 'border border-primary/15 bg-primary/[0.055] text-action hover:bg-action hover:text-white'
                            }`}
                          >
                            <Link
                              href={`/restaurant/${restaurant.id}`}
                            >
                              Ver restaurante
                            </Link>
                          </Button>
                        </div>
                      </article>
                    );
                  }
                )}
              </div>
            )}
          </section>
        )}
    </div>
  );
}