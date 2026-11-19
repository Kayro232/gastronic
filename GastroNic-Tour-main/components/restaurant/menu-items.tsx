'use client';

import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  AlertCircle,
  ChefHat,
  ImageOff,
  Leaf,
  Sparkles,
  TriangleAlert,
  UtensilsCrossed,
} from 'lucide-react';

import { createClient } from '@/lib/supabase/client';

const supabase =
  createClient();

/* ========================================================== */
/* TYPES                                                      */
/* ========================================================== */

interface MenuItemsProps {
  restaurantId: string;
}

interface MenuCategory {
  id: string;
  name: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
}

interface MenuItem {
  id: string;
  restaurant_id: string;
  category_id: string | null;

  name: string;
  description: string | null;

  price: number;
  currency: string;

  storage_path: string | null;
  external_url: string | null;

  is_available: boolean;
  is_featured: boolean;

  dietary_labels: string[];
  allergens: string[];

  sort_order: number;
}

interface MenuGroup {
  id: string;
  name: string;
  description: string | null;
  items: MenuItem[];
}

/* ========================================================== */
/* HELPERS                                                    */
/* ========================================================== */

function getImageUrl(
  item: MenuItem
) {
  if (item.external_url) {
    return item.external_url;
  }

  if (item.storage_path) {
    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (supabaseUrl) {
      return `${supabaseUrl}/storage/v1/object/public/menu-images/${item.storage_path}`;
    }
  }

  return null;
}

function formatPrice(
  price: number,
  currency: string
) {
  try {
    return new Intl.NumberFormat(
      'es-NI',
      {
        style:
          'currency',

        currency:
          currency.trim() ||
          'NIO',

        minimumFractionDigits:
          0,

        maximumFractionDigits:
          2,
      }
    ).format(
      Number(price)
    );
  } catch {
    return `C$ ${Number(
      price
    ).toLocaleString(
      'es-NI'
    )}`;
  }
}

/* ========================================================== */
/* COMPONENT                                                  */
/* ========================================================== */

export function MenuItems({
  restaurantId,
}: MenuItemsProps) {
  const [
    categories,
    setCategories,
  ] =
    useState<
      MenuCategory[]
    >([]);

  const [
    items,
    setItems,
  ] =
    useState<
      MenuItem[]
    >([]);

  const [
    activeCategory,
    setActiveCategory,
  ] =
    useState<
      string | null
    >(null);

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
  /* LOAD                                                     */
  /* ======================================================== */

  useEffect(() => {
    let cancelled =
      false;

    async function loadMenu() {
      setIsLoading(true);
      setErrorMessage('');

      const [
        categoriesResult,
        itemsResult,
      ] =
        await Promise.all([
          supabase
            .from(
              'menu_categories'
            )
            .select(`
              id,
              name,
              description,
              sort_order,
              is_active
            `)
            .eq(
              'restaurant_id',
              restaurantId
            )
            .eq(
              'is_active',
              true
            )
            .order(
              'sort_order',
              {
                ascending:
                  true,
              }
            )
            .order(
              'name',
              {
                ascending:
                  true,
              }
            ),

          supabase
            .from(
              'menu_items'
            )
            .select(`
              id,
              restaurant_id,
              category_id,
              name,
              description,
              price,
              currency,
              storage_path,
              external_url,
              is_available,
              is_featured,
              dietary_labels,
              allergens,
              sort_order
            `)
            .eq(
              'restaurant_id',
              restaurantId
            )
            .eq(
              'is_available',
              true
            )
            .order(
              'sort_order',
              {
                ascending:
                  true,
              }
            )
            .order(
              'name',
              {
                ascending:
                  true,
              }
            ),
        ]);

      if (cancelled) {
        return;
      }

      if (
        categoriesResult.error ||
        itemsResult.error
      ) {
        console.error(
          'Error cargando menú:',
          categoriesResult.error ??
            itemsResult.error
        );

        setErrorMessage(
          'No se pudo cargar el menú del restaurante.'
        );

        setCategories([]);
        setItems([]);
        setIsLoading(false);

        return;
      }

      setCategories(
        (categoriesResult.data ??
          []) as MenuCategory[]
      );

      setItems(
        (itemsResult.data ??
          []) as unknown as MenuItem[]
      );

      setIsLoading(false);
    }

    if (restaurantId) {
      loadMenu();
    }

    return () => {
      cancelled =
        true;
    };
  }, [restaurantId]);

  /* ======================================================== */
  /* GROUP                                                    */
  /* ======================================================== */

  const groups =
    useMemo<
      MenuGroup[]
    >(() => {
      const result:
        MenuGroup[] = [];

      for (
        const category
        of categories
      ) {
        const categoryItems =
          items.filter(
            (item) =>
              item.category_id ===
              category.id
          );

        if (
          categoryItems.length ===
          0
        ) {
          continue;
        }

        result.push({
          id:
            category.id,

          name:
            category.name,

          description:
            category.description,

          items:
            categoryItems,
        });
      }

      const uncategorized =
        items.filter(
          (item) =>
            !item.category_id ||
            !categories.some(
              (category) =>
                category.id ===
                item.category_id
            )
        );

      if (
        uncategorized.length >
        0
      ) {
        result.push({
          id:
            'other',

          name:
            'Otros',

          description:
            null,

          items:
            uncategorized,
        });
      }

      return result;
    }, [
      categories,
      items,
    ]);

  /* ======================================================== */
  /* CATEGORY NAV                                             */
  /* ======================================================== */

  function goToCategory(
    categoryId: string
  ) {
    setActiveCategory(
      categoryId
    );

    const element =
      document.getElementById(
        `menu-category-${categoryId}`
      );

    if (!element) {
      return;
    }

    const top =
      element.getBoundingClientRect()
        .top +
      window.scrollY -
      120;

    window.scrollTo({
      top,
      behavior:
        'smooth',
    });
  }

  /* ======================================================== */
  /* LOADING                                                  */
  /* ======================================================== */

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex gap-2 overflow-hidden">
          {[1, 2, 3, 4].map(
            (item) => (
              <div
                key={
                  item
                }
                className="h-10 w-28 flex-shrink-0 animate-pulse rounded-full bg-muted"
              />
            )
          )}
        </div>

        {[1, 2].map(
          (section) => (
            <div
              key={
                section
              }
              className="space-y-4"
            >
              <div className="h-7 w-40 animate-pulse rounded-lg bg-muted" />

              <div className="grid gap-4 md:grid-cols-2">
                {[1, 2, 3, 4].map(
                  (item) => (
                    <div
                      key={
                        item
                      }
                      className="h-[190px] animate-pulse rounded-2xl bg-muted"
                    />
                  )
                )}
              </div>
            </div>
          )
        )}
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-danger/25 bg-red-50/70 p-5">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-danger-soft text-danger">
          <AlertCircle className="h-4 w-4" />
        </div>

        <div>
          <p className="text-sm font-bold text-danger">
            No pudimos cargar la carta
          </p>

          <p className="mt-1 text-xs leading-5 text-danger">
            {errorMessage}
          </p>
        </div>
      </div>
    );
  }

  if (
    items.length ===
    0
  ) {
    return (
      <div className="rounded-card border border-border/70 bg-white px-6 py-12 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/[0.07] text-action">
          <ChefHat className="h-5 w-5" />
        </div>

        <h3 className="mt-4 text-base font-bold text-ink">
          Carta aún no disponible
        </h3>

        <p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-muted-foreground">
          Este restaurante todavía no ha publicado sus platillos en GastroNic.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* ====================================================== */}
      {/* INTRO                                                  */}
      {/* ====================================================== */}

      <div className="mb-6 flex items-start gap-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary/[0.07] text-action">
          <UtensilsCrossed className="h-4 w-4" />
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-[0.08em] text-action">
            La carta
          </p>

          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Explora los platillos disponibles del restaurante.
          </p>
        </div>
      </div>

      {/* ====================================================== */}
      {/* CATEGORY NAV                                           */}
      {/* ====================================================== */}

      {groups.length >
        1 && (
        <div className="mb-10 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex min-w-max gap-2">
            {groups.map(
              (group) => {
                const active =
                  activeCategory ===
                  group.id;

                return (
                  <button
                    key={
                      group.id
                    }
                    type="button"
                    onClick={() =>
                      goToCategory(
                        group.id
                      )
                    }
                    className={`rounded-full border px-4 py-2.5 text-xs font-semibold transition ${
                      active
                        ? 'border-ink bg-ink text-white'
                        : 'border-border/70 bg-white text-muted-foreground hover:border-primary/25 hover:text-ink'
                    }`}
                  >
                    {
                      group.name
                    }

                    <span
                      className={`ml-2 text-xs ${
                        active
                          ? 'text-white/50'
                          : 'text-muted-foreground/60'
                      }`}
                    >
                      {
                        group.items.length
                      }
                    </span>
                  </button>
                );
              }
            )}
          </div>
        </div>
      )}

      {/* ====================================================== */}
      {/* GROUPS                                                 */}
      {/* ====================================================== */}

      <div className="space-y-12">
        {groups.map(
          (group) => (
            <section
              key={
                group.id
              }
              id={`menu-category-${group.id}`}
              className="scroll-mt-32"
            >
              <div className="mb-5 flex items-end justify-between gap-4 border-b border-border/60 pb-4">
                <div>
                  <h3 className="text-xl font-bold tracking-[-0.025em] text-ink">
                    {
                      group.name
                    }
                  </h3>

                  {group.description && (
                    <p className="mt-1.5 max-w-xl text-xs leading-5 text-muted-foreground">
                      {
                        group.description
                      }
                    </p>
                  )}
                </div>

                <p className="hidden text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground sm:block">
                  {
                    group.items.length
                  }{' '}
                  {group.items.length ===
                  1
                    ? 'opción'
                    : 'opciones'}
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {group.items.map(
                  (item) => (
                    <MenuItemCard
                      key={
                        item.id
                      }
                      item={
                        item
                      }
                    />
                  )
                )}
              </div>
            </section>
          )
        )}
      </div>

      <div className="mt-10 border-t border-border/60 pt-5">
        <p className="text-xs leading-5 text-muted-foreground">
          Los precios, disponibilidad, ingredientes y alérgenos son
          proporcionados por el establecimiento y pueden estar sujetos a
          cambios.
        </p>
      </div>
    </div>
  );
}

/* ========================================================== */
/* ITEM                                                       */
/* ========================================================== */

function MenuItemCard({
  item,
}: {
  item: MenuItem;
}) {
  const imageUrl =
    getImageUrl(
      item
    );

  return (
    <article className="group relative flex min-h-[180px] gap-5 rounded-card border border-transparent p-3.5 transition duration-200 hover:border-border/70 hover:bg-white hover:shadow-raised">
      {/* CONTENT */}

      <div className="min-w-0 flex-1 py-1">
        {item.is_featured && (
          <div className="mb-2 flex items-center gap-1.5">
            <Sparkles className="h-3 w-3 text-action" />

            <span className="text-xs font-bold uppercase tracking-[0.08em] text-action">
              Especialidad
            </span>
          </div>
        )}

        <div className="flex items-start justify-between gap-3">
          <h4 className="text-[15px] font-bold leading-5 text-ink">
            {item.name}
          </h4>

          <p className="flex-shrink-0 text-sm font-bold tabular-nums text-ink">
            {formatPrice(
              Number(
                item.price
              ),
              item.currency
            )}
          </p>
        </div>

        {item.description && (
          <p className="mt-2 line-clamp-4 text-xs leading-[18px] text-muted-foreground">
            {
              item.description
            }
          </p>
        )}

        {(item.dietary_labels?.length >
          0 ||
          item.allergens?.length >
            0) && (
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5">
            {item.dietary_labels?.map(
              (label) => (
                <span
                  key={
                    label
                  }
                  className="inline-flex items-center gap-1 text-xs font-semibold text-action"
                >
                  <Leaf className="h-2.5 w-2.5" />

                  {label}
                </span>
              )
            )}

            {item.allergens?.length >
              0 && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-warning">
                <TriangleAlert className="h-2.5 w-2.5" />

                {item.allergens.join(
                  ', '
                )}
              </span>
            )}
          </div>
        )}
      </div>

      {/* IMAGE */}

      <div className="relative h-[138px] w-[138px] flex-shrink-0 overflow-hidden rounded-card bg-[#F2F5F4] sm:h-[150px] sm:w-[150px] xl:h-[158px] xl:w-[158px]">
        {imageUrl ? (
          <>
            <div
              className="h-full w-full bg-cover bg-center transition-transform duration-500 group-hover:scale-[1.045]"
              style={{
                backgroundImage:
                  `url("${imageUrl}")`,
              }}
            />

            <div className="absolute inset-0 ring-1 ring-inset ring-black/[0.04]" />
          </>
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground/35">
            <ImageOff className="h-5 w-5" />
          </div>
        )}
      </div>
    </article>
  );
}