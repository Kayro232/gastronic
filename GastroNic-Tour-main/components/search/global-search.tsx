'use client';

import {
  useEffect,
  useRef,
  useState,
} from 'react';

import { useRouter } from 'next/navigation';

import {
  Building2,
  LoaderCircle,
  MapPin,
  Search,
  SearchX,
  Trash2,
  Utensils,
} from 'lucide-react';

import { createClient } from '@/lib/supabase/client';

const supabase =
  createClient();

/* ========================================================== */
/* TYPES                                                      */
/* ========================================================== */

interface Department {
  name: string;
}

interface MunicipalityRelation {
  id: number;
  name: string;

  department:
  | Department
  | Department[]
  | null;
}

interface RestaurantResult {
  id: string;
  name: string;

  short_description:
  | string
  | null;

  average_rating:
  | number
  | string
  | null;

  municipality_id:
  | number
  | null;

  municipality_name:
  | string
  | null;

  department_name:
  | string
  | null;

  score?: number;
}

interface CategoryResult {
  id: number;
  name: string;
  slug: string;
}

interface MunicipalityResult {
  id: number;
  name: string;
  slug: string;

  department:
  | Department
  | Department[]
  | null;
}

interface RecentSearchItem {
  label: string;
  url: string;
}

interface GlobalSearchProps {
  mobile?: boolean;

  onNavigate?: () => void;
}

type SearchResultType =
  | 'restaurant'
  | 'category'
  | 'municipality';

interface SearchActivity {
  resultType: SearchResultType;

  restaurantId?: string;

  categoryId?: number;

  municipalityId?: number;
}

/* ========================================================== */
/* CONSTANTS                                                  */
/* ========================================================== */

const RECENT_SEARCHES_KEY =
  'gastronic_recent_searches';

const MAX_RECENT_SEARCHES =
  6;

/* ========================================================== */
/* NORMALIZATION                                              */
/* ========================================================== */

function normalizeText(
  value:
    | string
    | null
    | undefined
) {
  return (
    value ?? ''
  )
    .toLowerCase()
    .normalize('NFD')
    .replace(
      /[\u0300-\u036f]/g,
      ''
    )
    .replace(
      /[^a-z0-9\s]/g,
      ' '
    )
    .replace(
      /\s+/g,
      ' '
    )
    .trim();
}

/* ========================================================== */
/* LEVENSHTEIN                                                */
/* ========================================================== */

function levenshteinDistance(
  first: string,
  second: string
) {
  if (
    first === second
  ) {
    return 0;
  }

  if (
    first.length === 0
  ) {
    return second.length;
  }

  if (
    second.length === 0
  ) {
    return first.length;
  }

  const previous =
    Array.from(
      {
        length:
          second.length +
          1,
      },
      (
        _,
        index
      ) => index
    );

  const current =
    new Array<number>(
      second.length +
      1
    );

  for (
    let i = 1;
    i <= first.length;
    i++
  ) {
    current[0] =
      i;

    for (
      let j = 1;
      j <= second.length;
      j++
    ) {
      const cost =
        first[
          i - 1
        ] ===
          second[
          j - 1
          ]
          ? 0
          : 1;

      current[j] =
        Math.min(
          current[
          j - 1
          ] + 1,

          previous[j] +
          1,

          previous[
          j - 1
          ] + cost
        );
    }

    for (
      let j = 0;
      j <= second.length;
      j++
    ) {
      previous[j] =
        current[j];
    }
  }

  return previous[
    second.length
  ];
}

/* ========================================================== */
/* FUZZY MATCH                                                */
/* ========================================================== */

function getTextScore(
  value:
    | string
    | null
    | undefined,

  query: string
) {
  const text =
    normalizeText(
      value
    );

  const normalizedQuery =
    normalizeText(
      query
    );

  if (
    !text ||
    !normalizedQuery
  ) {
    return 0;
  }

  /* Exacta */

  if (
    text ===
    normalizedQuery
  ) {
    return 100;
  }

  /* Empieza por */

  if (
    text.startsWith(
      normalizedQuery
    )
  ) {
    return 90;
  }

  /* Contiene */

  if (
    text.includes(
      normalizedQuery
    )
  ) {
    return 80;
  }

  const words =
    text.split(' ');

  if (
    words.some(
      (
        word
      ) =>
        word.startsWith(
          normalizedQuery
        )
    )
  ) {
    return 75;
  }

  if (
    words.some(
      (
        word
      ) =>
        word.includes(
          normalizedQuery
        )
    )
  ) {
    return 70;
  }

  /*
   * Evitamos fuzzy demasiado agresivo
   * en palabras muy cortas.
   */

  if (
    normalizedQuery.length <
    4
  ) {
    return 0;
  }

  let smallestDistance =
    Infinity;

  for (
    const word
    of words
  ) {
    const distance =
      levenshteinDistance(
        word,
        normalizedQuery
      );

    if (
      distance <
      smallestDistance
    ) {
      smallestDistance =
        distance;
    }
  }

  const allowedDistance =
    normalizedQuery.length >=
      6
      ? 2
      : 1;

  if (
    smallestDistance <=
    allowedDistance
  ) {
    return (
      60 -
      smallestDistance *
      5
    );
  }

  return 0;
}

/* ========================================================== */
/* RELATION HELPERS                                           */
/* ========================================================== */

function normalizeMunicipality(
  value:
    | MunicipalityRelation
    | MunicipalityRelation[]
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

function normalizeDepartment(
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

/* ========================================================== */
/* COMPONENT                                                  */
/* ========================================================== */

export function GlobalSearch({
  mobile = false,
  onNavigate,
}: GlobalSearchProps) {
  const router =
    useRouter();

  const containerRef =
    useRef<HTMLDivElement>(
      null
    );

  const [
    query,
    setQuery,
  ] =
    useState('');

  const [
    restaurants,
    setRestaurants,
  ] =
    useState<
      RestaurantResult[]
    >([]);

  const [
    categories,
    setCategories,
  ] =
    useState<
      CategoryResult[]
    >([]);

  const [
    municipalities,
    setMunicipalities,
  ] =
    useState<
      MunicipalityResult[]
    >([]);

  const [
    recentSearches,
    setRecentSearches,
  ] =
    useState<
      RecentSearchItem[]
    >([]);

  const [
    isLoading,
    setIsLoading,
  ] =
    useState(false);

  const [
    isOpen,
    setIsOpen,
  ] =
    useState(false);

  /* ======================================================== */
  /* LOAD RECENT SEARCHES                                     */
  /* ======================================================== */

  useEffect(() => {
    try {
      const stored =
        window.localStorage.getItem(
          RECENT_SEARCHES_KEY
        );

      if (!stored) {
        return;
      }

      const parsed =
        JSON.parse(
          stored
        ) as RecentSearchItem[];

      if (
        Array.isArray(
          parsed
        )
      ) {
        setRecentSearches(
          parsed.slice(
            0,
            MAX_RECENT_SEARCHES
          )
        );
      }
    } catch (
    error
    ) {
      console.error(
        'Error cargando búsquedas recientes:',
        error
      );
    }
  }, []);

  /* ======================================================== */
  /* SAVE RECENT SEARCH                                      */
  /* ======================================================== */

  function saveRecentSearch(
    item:
      RecentSearchItem
  ) {
    setRecentSearches(
      (
        current
      ) => {
        const withoutDuplicate =
          current.filter(
            (
              existing
            ) =>
              existing.url !==
              item.url &&
              normalizeText(
                existing.label
              ) !==
              normalizeText(
                item.label
              )
          );

        const next = [
          item,
          ...withoutDuplicate,
        ].slice(
          0,
          MAX_RECENT_SEARCHES
        );

        try {
          window.localStorage.setItem(
            RECENT_SEARCHES_KEY,
            JSON.stringify(
              next
            )
          );
        } catch (
        error
        ) {
          console.error(
            'Error guardando búsqueda reciente:',
            error
          );
        }

        return next;
      }
    );
  }

  /* ======================================================== */
  /* CLEAR RECENT SEARCHES                                   */
  /* ======================================================== */

  function clearRecentSearches() {
    setRecentSearches(
      []
    );

    try {
      window.localStorage.removeItem(
        RECENT_SEARCHES_KEY
      );
    } catch (
    error
    ) {
      console.error(
        'Error limpiando búsquedas recientes:',
        error
      );
    }
  }

  /* ======================================================== */
  /* REGISTER SEARCH ACTIVITY                                 */
  /* ======================================================== */

  async function registerSearchActivity({
    queryValue,
    activity,
  }: {
    queryValue: string;
    activity: SearchActivity;
  }) {
    const cleanSearch =
      queryValue
        .trim()
        .slice(
          0,
          120
        );

    if (
      cleanSearch.length <
      2
    ) {
      return;
    }

    const {
      data: {
        session,
      },

      error:
      sessionError,
    } =
      await supabase.auth.getSession();

    if (
      sessionError
    ) {
      console.error(
        'Error obteniendo sesión para registrar búsqueda:',
        sessionError
      );

      return;
    }

    const user =
      session?.user;

    /*
     * Usuarios sin sesión pueden buscar,
     * pero no guardamos comportamiento.
     */
    if (
      !user
    ) {
      return;
    }

    const metadata: {
      query: string;

      result_type:
      SearchResultType;

      category_id?:
      number;

      municipality_id?:
      number;
    } = {
      query:
        cleanSearch,

      result_type:
        activity.resultType,
    };

    if (
      activity.categoryId !==
      undefined
    ) {
      metadata.category_id =
        activity.categoryId;
    }

    if (
      activity.municipalityId !==
      undefined
    ) {
      metadata.municipality_id =
        activity.municipalityId;
    }

    const {
      error,
    } =
      await supabase
        .from(
          'user_activity_events'
        )
        .insert({
          user_id:
            user.id,

          event_type:
            'search',

          source:
            'global_search',

          restaurant_id:
            activity.restaurantId ??
            null,

          metadata,
        });

    if (
      error
    ) {
      /*
       * Un fallo de analytics no debe
       * impedir que el usuario navegue.
       */
      console.error(
        'Error registrando búsqueda:',
        error
      );
    }
  }

  /* ======================================================== */
  /* SEARCH                                                   */
  /* ======================================================== */

  useEffect(() => {
    const cleanQuery =
      query.trim();

    if (
      cleanQuery.length <
      2
    ) {
      setRestaurants(
        []
      );

      setCategories(
        []
      );

      setMunicipalities(
        []
      );

      setIsLoading(
        false
      );

      return;
    }

    let cancelled =
      false;

    const timer =
      window.setTimeout(
        async () => {
          setIsLoading(
            true
          );

          const [
            restaurantsResult,
            categoriesResult,
            municipalitiesResult,
          ] =
            await Promise.all([
              supabase.rpc(
                'search_restaurants_global',
                {
                  p_query:
                    cleanQuery,
                  p_limit: 5,
                }
              ),

              supabase
                .from(
                  'categories'
                )
                .select(`
                  id,
                  name,
                  slug
                `)
                .eq(
                  'is_active',
                  true
                )
                .order(
                  'name'
                )
                .limit(
                  100
                ),

              supabase
                .from(
                  'municipalities'
                )
                .select(`
                  id,
                  name,
                  slug,

                  department:departments (
                    name
                  )
                `)
                .order(
                  'name'
                )
                .limit(
                  200
                ),
            ]);

          if (
            cancelled
          ) {
            return;
          }

          if (
            restaurantsResult.error
          ) {
            console.error(
              'Error buscando restaurantes:',
              restaurantsResult.error
            );
          }

          if (
            categoriesResult.error
          ) {
            console.error(
              'Error buscando categorías:',
              categoriesResult.error
            );
          }

          if (
            municipalitiesResult.error
          ) {
            console.error(
              'Error buscando municipios:',
              municipalitiesResult.error
            );
          }

          /* ================================================== */
          /* RESTAURANTS                                        */
          /* ================================================== */

          const filteredRestaurants =
            (
              restaurantsResult.data ??
              []
            ) as RestaurantResult[];

          /* ================================================== */
          /* CATEGORIES                                         */
          /* ================================================== */

          const allCategories =
            (
              categoriesResult.data ??
              []
            ) as CategoryResult[];

          const filteredCategories =
            allCategories
              .map(
                (
                  category
                ) => ({
                  category,

                  score:
                    getTextScore(
                      category.name,
                      cleanQuery
                    ),
                })
              )
              .filter(
                (
                  item
                ) =>
                  item.score >
                  0
              )
              .sort(
                (
                  a,
                  b
                ) =>
                  b.score -
                  a.score
              )
              .slice(
                0,
                4
              )
              .map(
                (
                  item
                ) =>
                  item.category
              );

          /* ================================================== */
          /* MUNICIPALITIES                                     */
          /* ================================================== */

          const allMunicipalities =
            (
              municipalitiesResult.data ??
              []
            ) as unknown as MunicipalityResult[];

          const filteredMunicipalities =
            allMunicipalities
              .map(
                (
                  municipality
                ) => {
                  const department =
                    normalizeDepartment(
                      municipality.department
                    );

                  const municipalityScore =
                    getTextScore(
                      municipality.name,
                      cleanQuery
                    );

                  const departmentScore =
                    getTextScore(
                      department?.name,
                      cleanQuery
                    );

                  return {
                    municipality,

                    score:
                      Math.max(
                        municipalityScore,
                        departmentScore *
                        0.75
                      ),
                  };
                }
              )
              .filter(
                (
                  item
                ) =>
                  item.score >
                  0
              )
              .sort(
                (
                  a,
                  b
                ) =>
                  b.score -
                  a.score
              )
              .slice(
                0,
                4
              )
              .map(
                (
                  item
                ) =>
                  item.municipality
              );

          setRestaurants(
            filteredRestaurants
          );

          setCategories(
            filteredCategories
          );

          setMunicipalities(
            filteredMunicipalities
          );

          setIsLoading(
            false
          );

          setIsOpen(
            true
          );
        },
        250
      );

    return () => {
      cancelled =
        true;

      window.clearTimeout(
        timer
      );
    };
  }, [
    query,
  ]);

  /* ======================================================== */
  /* CLICK OUTSIDE                                            */
  /* ======================================================== */

  useEffect(() => {
    function handleOutside(
      event:
        MouseEvent
    ) {
      if (
        containerRef.current &&
        !containerRef.current.contains(
          event.target as Node
        )
      ) {
        setIsOpen(
          false
        );
      }
    }

    document.addEventListener(
      'mousedown',
      handleOutside
    );

    return () => {
      document.removeEventListener(
        'mousedown',
        handleOutside
      );
    };
  }, []);

  /* ======================================================== */
  /* NAVIGATE                                                 */
  /* ======================================================== */

  async function navigate(
    url: string,
    label?: string,
    activity?: SearchActivity
  ) {
    const searchValue =
      query.trim();

    if (label) {
      saveRecentSearch({
        label,
        url,
      });
    }

    setIsOpen(false);
    setQuery('');

    onNavigate?.();

    if (
      activity &&
      searchValue.length >= 2
    ) {
      try {
        await registerSearchActivity({
          queryValue:
            searchValue,
          activity,
        });
      } catch (error) {
        console.error(
          'Error registrando actividad de búsqueda:',
          error
        );
      }
    }

    router.push(url);
  }

  /* ======================================================== */
  /* STATE                                                    */
  /* ======================================================== */

  const hasResults =
    restaurants.length >
    0 ||
    categories.length >
    0 ||
    municipalities.length >
    0;

  const cleanQuery =
    query.trim();

  const showRecentSearches =
    isOpen &&
    cleanQuery.length ===
    0 &&
    recentSearches.length >
    0;

  const showSearchResults =
    isOpen &&
    cleanQuery.length >=
    2;

  const shouldShow =
    showRecentSearches ||
    showSearchResults;

  /* ======================================================== */
  /* RENDER                                                   */
  /* ======================================================== */

  return (
    <div
      ref={
        containerRef
      }
      className="relative w-full"
    >
      {/* ====================================================== */}
      {/* INPUT                                                  */}
      {/* ====================================================== */}

      <div className="relative">
        {isLoading ? (
          <LoaderCircle className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 animate-spin text-action" />
        ) : (
          <Search className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted-foreground" />
        )}

        <input
          type="search"
          value={
            query
          }
          onChange={(
            event
          ) => {
            setQuery(
              event.target.value
            );

            setIsOpen(
              true
            );
          }}
          onFocus={() => {
            if (
              query.trim()
                .length >=
              2 ||
              recentSearches.length >
              0
            ) {
              setIsOpen(
                true
              );
            }
          }}
          placeholder={
            mobile
              ? 'Buscar restaurantes...'
              : 'Buscar restaurantes, lugares...'
          }
          aria-label="Buscar en GastroNic"
          autoComplete="off"
          className={`w-full border border-border/70 bg-canvas pl-11 pr-4 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/70 hover:bg-surface-2 focus:border-primary/30 focus:bg-white focus:ring-4 focus:ring-primary/[0.07] ${mobile
            ? 'h-12 rounded-2xl'
            : 'h-11 rounded-2xl'
            }`}
        />
      </div>

      {/* ====================================================== */}
      {/* PANEL                                                  */}
      {/* ====================================================== */}

      {shouldShow && (
        <div
          className={`z-[90] overflow-hidden rounded-card border border-border/80 bg-white shadow-overlay ${mobile
            ? 'mt-3 w-full'
            : 'absolute left-0 top-[calc(100%+10px)] w-full min-w-[420px]'
            }`}
        >
          {/* ================================================== */}
          {/* RECENT SEARCHES                                    */}
          {/* ================================================== */}

          {showRecentSearches && (
            <>
              <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.08em] text-action">
                    Búsquedas recientes
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Vuelve rápidamente a tus últimas búsquedas.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={
                    clearRecentSearches
                  }
                  className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-bold text-muted-foreground transition hover:bg-danger-soft hover:text-red-500"
                >
                  <Trash2 className="h-3 w-3" />

                  Limpiar
                </button>
              </div>

              <div className="py-2">
                {recentSearches.map(
                  (
                    item
                  ) => (
                    <button
                      key={`${item.url}-${item.label}`}
                      type="button"
                      onClick={() =>
                        navigate(
                          item.url
                        )
                      }
                      className="group flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-canvas"
                    >
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-surface-2 transition group-hover:bg-primary/[0.08]">
                        <Search className="h-3.5 w-3.5 text-action" />
                      </div>

                      <span className="truncate text-sm font-semibold text-ink transition group-hover:text-action">
                        {
                          item.label
                        }
                      </span>
                    </button>
                  )
                )}
              </div>
            </>
          )}

          {/* ================================================== */}
          {/* SEARCH RESULTS                                     */}
          {/* ================================================== */}

          {showSearchResults && (
            <>
              {/* ================================================ */}
              {/* HEADER                                           */}
              {/* ================================================ */}

              <div className="border-b border-border/60 px-4 py-3">
                <p className="text-xs font-bold uppercase tracking-[0.08em] text-action">
                  Buscar en GastroNic
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  Resultados para &quot;
                  {query.trim()}
                  &quot;
                </p>
              </div>

              {/* ================================================ */}
              {/* LOADING                                          */}
              {/* ================================================ */}

              {isLoading ? (
                <div className="flex h-40 items-center justify-center gap-2 text-sm text-muted-foreground">
                  <LoaderCircle className="h-4 w-4 animate-spin text-action" />

                  Buscando...
                </div>
              ) : !hasResults ? (
                /* =============================================== */
                /* EMPTY                                           */
                /* =============================================== */

                <div className="flex min-h-[190px] flex-col items-center justify-center px-6 text-center">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface-2">
                    <SearchX className="h-5 w-5 text-muted-foreground" />
                  </div>

                  <p className="mt-4 text-sm font-bold text-ink">
                    No encontramos resultados
                  </p>

                  <p className="mt-1 max-w-[250px] text-xs leading-5 text-muted-foreground">
                    Prueba escribiendo otro restaurante, categoría o lugar.
                  </p>
                </div>
              ) : (
                <div className="max-h-[430px] overflow-y-auto py-2">
                  {/* =========================================== */}
                  {/* RESTAURANTS                                 */}
                  {/* =========================================== */}

                  {restaurants.length >
                    0 && (
                      <SearchSection
                        title="Restaurantes"
                        icon={
                          Utensils
                        }
                      >
                        {restaurants.map(
                          (
                            restaurant
                          ) => {
                            const location =
                              [
                                restaurant.municipality_name,
                                restaurant.department_name,
                              ]
                                .filter(
                                  Boolean
                                )
                                .join(
                                  ', '
                                );

                            return (
                              <button
                                key={
                                  restaurant.id
                                }
                                type="button"
                                onClick={() =>
                                  navigate(
                                    `/restaurant/${restaurant.id}`,
                                    restaurant.name,
                                    {
                                      resultType: 'restaurant',
                                      restaurantId: restaurant.id,
                                    }
                                  )
                                }
                                className="group flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-canvas"
                              >
                                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-primary/[0.08]">
                                  <Utensils className="h-4 w-4 text-action" />
                                </div>

                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-bold text-ink transition group-hover:text-action">
                                    {
                                      restaurant.name
                                    }
                                  </p>

                                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                                    {location ||
                                      restaurant.short_description ||
                                      'Restaurante en Nicaragua'}
                                  </p>
                                </div>
                              </button>
                            );
                          }
                        )}
                      </SearchSection>
                    )}

                  {/* =========================================== */}
                  {/* CATEGORIES                                  */}
                  {/* =========================================== */}

                  {categories.length >
                    0 && (
                      <SearchSection
                        title="Categorías"
                        icon={
                          Building2
                        }
                      >
                        {categories.map(
                          (
                            category
                          ) => (
                            <button
                              key={
                                category.id
                              }
                              type="button"
                              onClick={() =>
                                navigate(
                                  `/home?category=${category.id}`,
                                  category.name,
                                  {
                                    resultType: 'category',
                                    categoryId: category.id,
                                  }
                                )
                              }
                              className="group flex w-full items-center gap-3 px-4 py-2.5 text-left transition hover:bg-canvas"
                            >
                              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-surface-2">
                                <Utensils className="h-3.5 w-3.5 text-action" />
                              </div>

                              <span className="truncate text-sm font-semibold text-ink group-hover:text-action">
                                {
                                  category.name
                                }
                              </span>
                            </button>
                          )
                        )}
                      </SearchSection>
                    )}

                  {/* =========================================== */}
                  {/* LOCATIONS                                   */}
                  {/* =========================================== */}

                  {municipalities.length >
                    0 && (
                      <SearchSection
                        title="Ubicaciones"
                        icon={
                          MapPin
                        }
                      >
                        {municipalities.map(
                          (
                            municipality
                          ) => {
                            const department =
                              normalizeDepartment(
                                municipality.department
                              );

                            return (
                              <button
                                key={
                                  municipality.id
                                }
                                type="button"
                                onClick={() =>
                                  navigate(
                                    `/home?municipality=${municipality.id}`,
                                    municipality.name,
                                    {
                                      resultType: 'municipality',
                                      municipalityId: municipality.id,
                                    }
                                  )
                                }
                                className="group flex w-full items-center gap-3 px-4 py-2.5 text-left transition hover:bg-canvas"
                              >
                                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-surface-2">
                                  <MapPin className="h-3.5 w-3.5 text-action" />
                                </div>

                                <div className="min-w-0">
                                  <p className="truncate text-sm font-semibold text-ink group-hover:text-action">
                                    {
                                      municipality.name
                                    }
                                  </p>

                                  {department && (
                                    <p className="text-xs text-muted-foreground">
                                      {
                                        department.name
                                      }
                                    </p>
                                  )}
                                </div>
                              </button>
                            );
                          }
                        )}
                      </SearchSection>
                    )}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ========================================================== */
/* SECTION                                                    */
/* ========================================================== */

function SearchSection({
  title,
  icon:
  Icon,
  children,
}: {
  title:
  string;

  icon:
  React.ComponentType<{
    className?: string;
  }>;

  children:
  React.ReactNode;
}) {
  return (
    <section className="py-1">
      <div className="flex items-center gap-2 px-4 py-2">
        <Icon className="h-3.5 w-3.5 text-action" />

        <p className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">
          {
            title
          }
        </p>
      </div>

      {
        children
      }
    </section>
  );
}