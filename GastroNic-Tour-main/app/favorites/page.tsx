

import {
  redirect,
} from 'next/navigation';

import {
  Heart,
  Search,
  Sparkles,
} from 'lucide-react';

import { MainLayout } from '@/components/layout/main-layout';
import { DataLoadError } from '@/components/common/data-load-error';

import { RestaurantExploreCard } from '@/components/explore/restaurant-explore-card';

import {
  type ExploreRestaurant,
} from '@/app/explore/page';

import { Button } from '@/components/ui/button';

import { createClient } from '@/lib/supabase/server';

import Link from 'next/link';

/* ========================================================== */
/* TYPES                                                      */
/* ========================================================== */

interface FavoriteRow {
  created_at: string;

  restaurant:
    | ExploreRestaurant
    | ExploreRestaurant[]
    | null;
}

/* ========================================================== */
/* HELPERS                                                    */
/* ========================================================== */

function getRestaurant(
  value:
    | ExploreRestaurant
    | ExploreRestaurant[]
    | null
): ExploreRestaurant | null {
  if (!value) {
    return null;
  }

  if (
    Array.isArray(
      value
    )
  ) {
    return (
      value[0] ??
      null
    );
  }

  return value;
}

/* ========================================================== */
/* PAGE                                                       */
/* ========================================================== */

export default async function FavoritesPage() {
  const supabase =
    await createClient();

  /* ======================================================== */
  /* SESSION                                                  */
  /* ======================================================== */

  const {
    data: {
      user,
    },
  } =
    await supabase.auth.getUser();

  if (!user) {
    redirect(
      '/auth/login?next=/favorites'
    );
  }

  /* ======================================================== */
  /* FAVORITES                                                */
  /* ======================================================== */

  const {
    data,
    error,
  } =
    await supabase
      .from(
        'favorites'
      )
      .select(`
        created_at,

        restaurant:restaurants!inner (
          id,
          name,
          slug,
          short_description,
          price_level,
          is_verified,
          is_featured,
          average_rating,
          reviews_count,

          municipality:municipalities (
            id,
            name,

            department:departments (
              id,
              name
            )
          ),

          images:restaurant_images (
            id,
            kind,
            storage_path,
            external_url,
            alt_text,
            sort_order
          ),

          categories:restaurant_categories (
            category:categories (
              id,
              name,
              slug
            )
          )
        )
      `)
      .eq(
        'user_id',
        user.id
      )
      .eq(
        'restaurant.status',
        'approved'
      )
      .order(
        'created_at',
        {
          ascending:
            false,
        }
      );

  if (
    error
  ) {
    console.error(
      'Error cargando favoritos:',
      error
    );

    return (
      <MainLayout>
        <div className="min-h-screen bg-canvas pb-24 lg:pb-0">
          <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
            <DataLoadError
              title="No pudimos cargar tus favoritos"
              description="Tus restaurantes guardados no se borraron. Ocurrió un problema al consultarlos y preferimos mostrarte el error en lugar de una colección vacía."
            />
          </div>
        </div>
      </MainLayout>
    );
  }

  /* ======================================================== */
  /* NORMALIZE                                                */
  /* ======================================================== */

  const favorites =
    (data ??
      []) as unknown as FavoriteRow[];

  const restaurants =
    favorites
      .map(
        (
          favorite
        ) =>
          getRestaurant(
            favorite.restaurant
          )
      )
      .filter(
        (
          restaurant
        ): restaurant is ExploreRestaurant =>
          restaurant !==
          null
      );

  /* ======================================================== */
  /* RENDER                                                   */
  /* ======================================================== */

  return (
    <MainLayout>
      <div className="min-h-screen bg-canvas pb-24 lg:pb-0">
        {/* ==================================================== */}
        {/* HEADER                                               */}
        {/* ==================================================== */}

        <section className="border-b border-border/60 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 md:py-16 lg:px-8">
            <div className="flex flex-col gap-5 sm:gap-7 lg:flex-row lg:items-end lg:justify-between">
              <div className="min-w-0">
                <div className="mb-2.5 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.08em] text-action sm:mb-3">
                  <Heart className="h-3.5 w-3.5 fill-red-500 text-red-500" />

                  Tu colección
                </div>

                <h1 className="max-w-3xl text-[2rem] font-bold leading-[1.08] tracking-[-0.035em] text-ink sm:text-4xl md:text-5xl">
                  Tus restaurantes guardados
                </h1>

                <p className="mt-3 max-w-2xl text-[13px] leading-6 text-muted-foreground sm:mt-4 sm:text-base sm:leading-7">
                  Guarda los lugares que te interesan y vuelve a encontrarlos
                  fácilmente cuando quieras planear tu próxima salida.
                </p>
              </div>

              {restaurants.length >
                0 && (
                <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border/70 bg-canvas px-3.5 py-2 text-xs font-semibold text-muted-foreground sm:px-4 sm:text-xs">
                  <Heart className="h-3.5 w-3.5 fill-red-500 text-red-500" />

                  {
                    restaurants.length
                  }{' '}

                  {restaurants.length ===
                  1
                    ? 'restaurante guardado'
                    : 'restaurantes guardados'}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ==================================================== */}
        {/* CONTENT                                              */}
        {/* ==================================================== */}

        <section className="mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-10 lg:px-8 lg:py-14">
          {restaurants.length >
          0 ? (
            <>
              {/* =============================================== */}
              {/* FAVORITES HEADER                                */}
              {/* =============================================== */}

              <div className="mb-5 sm:mb-8">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-action" />

                  <p className="text-xs font-bold uppercase tracking-[0.08em] text-action">
                    Favoritos
                  </p>
                </div>

                <h2 className="mt-1.5 text-xl font-bold tracking-[-0.03em] text-ink sm:mt-2 sm:text-2xl">
                  Lugares que quieres recordar
                </h2>

                <p className="mt-1.5 max-w-2xl text-[13px] leading-6 text-muted-foreground sm:mt-2 sm:text-sm">
                  Todos los restaurantes que guardaste están reunidos aquí
                  para que puedas encontrarlos fácilmente.
                </p>
              </div>

              {/* =============================================== */}
              {/* GRID                                            */}
              {/* =============================================== */}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3 xl:gap-6">
                {restaurants.map(
                  (
                    restaurant
                  ) => (
                    <RestaurantExploreCard
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
            </>
          ) : (
            /* ================================================= */
            /* EMPTY                                             */
            /* ================================================= */

            <div className="flex min-h-[60vh] items-center justify-center py-8 sm:min-h-[440px] sm:py-0">
              <div className="w-full max-w-md text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-card border border-danger/25 bg-danger-soft sm:h-16 sm:w-16 sm:rounded-card">
                  <Heart className="h-6 w-6 text-red-400 sm:h-7 sm:w-7" />
                </div>

                <p className="mt-5 text-xs font-bold uppercase tracking-[0.08em] text-action sm:mt-6">
                  Tu colección está vacía
                </p>

                <h2 className="mx-auto mt-2 max-w-sm text-xl font-bold leading-tight tracking-[-0.03em] text-ink sm:text-2xl">
                  Todavía no guardaste ningún restaurante
                </h2>

                <p className="mx-auto mt-3 max-w-sm text-[13px] leading-6 text-muted-foreground sm:text-sm">
                  Cuando encuentres un lugar que te interese, toca el corazón
                  para añadirlo aquí.
                </p>

                <Button
                  asChild
                  className="mt-6 h-11 w-full rounded-xl bg-action px-6 font-bold text-white hover:bg-action-hover sm:w-auto"
                >
                  <Link href="/explore">
                    <Search className="mr-2 h-4 w-4" />

                    Explorar restaurantes
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </section>
      </div>
    </MainLayout>
  );
}
