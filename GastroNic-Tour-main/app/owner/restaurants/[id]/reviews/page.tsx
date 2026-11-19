import Link from 'next/link';

import {
  notFound,
  redirect,
} from 'next/navigation';

import {
  ArrowLeft,
  Star,
  Store,
} from 'lucide-react';

import { OwnerLayout } from '@/components/owner/owner-layout';
import { RestaurantReviewsManager } from '@/components/owner/restaurant-reviews-manager';
import { createClient } from '@/lib/supabase/server';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

interface ReviewProfile {
  id: string;
  full_name: string;
  username: string | null;
  avatar_path: string | null;
}

interface Review {
  id: string;
  restaurant_id: string;
  user_id: string;
  visit_id: string | null;
  rating: number;
  title: string | null;
  comment: string;
  status: string;
  is_verified_visit: boolean;
  helpful_count: number;
  owner_reply: string | null;
  owner_replied_at: string | null;
  created_at: string;
  updated_at: string;

  profile:
    | ReviewProfile
    | ReviewProfile[]
    | null;
}

export default async function OwnerRestaurantReviewsPage({
  params,
}: PageProps) {
  const { id } = await params;

  if (!isValidUuid(id)) {
    notFound();
  }

  const supabase =
    await createClient();

  /* ======================================================== */
  /* SESSION                                                  */
  /* ======================================================== */

  const {
    data: { user },
    error: userError,
  } =
    await supabase.auth.getUser();

  if (userError) {
    console.error(
      'Error obteniendo usuario:',
      userError
    );
  }

  if (!user) {
    redirect('/owner/login');
  }

  /* ======================================================== */
  /* RESTAURANT                                               */
  /* ======================================================== */

  const {
    data: restaurant,
    error: restaurantError,
  } = await supabase
    .from('restaurants')
    .select(`
      id,
      name,
      status,
      average_rating,
      reviews_count
    `)
    .eq('id', id)
    .eq(
      'created_by',
      user.id
    )
    .maybeSingle();

  if (restaurantError) {
    console.error(
      'Error cargando restaurante:',
      restaurantError
    );
  }

  if (!restaurant) {
    notFound();
  }

  /* ======================================================== */
  /* REVIEWS                                                  */
  /* ======================================================== */

  const {
    data: reviewsData,
    error: reviewsError,
  } = await supabase
    .from('reviews')
    .select(`
      id,
      restaurant_id,
      user_id,
      visit_id,
      rating,
      title,
      comment,
      status,
      is_verified_visit,
      helpful_count,
      owner_reply,
      owner_replied_at,
      created_at,
      updated_at,

      profile:profiles!reviews_user_id_fkey (
        id,
        full_name,
        username,
        avatar_path
      )
    `)
    .eq(
      'restaurant_id',
      restaurant.id
    )
    .order(
      'created_at',
      {
        ascending: false,
      }
    );

  if (reviewsError) {
    console.error(
      'Error cargando reseñas:',
      reviewsError
    );
  }

  const reviews =
    (reviewsData ??
      []) as unknown as Review[];

  /* ======================================================== */
  /* RENDER                                                   */
  /* ======================================================== */

  return (
    <OwnerLayout>
      <div className="min-h-screen bg-canvas">
        <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
          {/* BACK */}

          <Link
            href={`/owner/restaurants/${restaurant.id}`}
            className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground transition hover:text-action"
          >
            <ArrowLeft className="h-4 w-4" />

            Volver a {restaurant.name}
          </Link>

          {/* HEADER */}

          <header className="mt-6 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.08em] text-action">
                <Star className="h-3.5 w-3.5" />

                Comunidad
              </div>

              <h1 className="text-3xl font-bold tracking-[-0.035em] text-ink sm:text-4xl">
                Reseñas
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                Consulta opiniones, identifica tendencias y responde a los
                clientes de{' '}
                <span className="font-semibold text-ink">
                  {restaurant.name}
                </span>
                .
              </p>
            </div>

            <div className="inline-flex w-fit items-center gap-3 rounded-2xl border border-border/70 bg-white px-4 py-3 shadow-sm">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                <Store className="h-4 w-4 text-action" />
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">
                  Restaurante
                </p>

                <p className="mt-0.5 max-w-[220px] truncate text-xs font-bold text-ink">
                  {restaurant.name}
                </p>
              </div>
            </div>
          </header>

          {/* REVIEWS MANAGER */}

          <div className="mt-7">
            <RestaurantReviewsManager
              restaurantName={
                restaurant.name
              }
              averageRating={Number(
                restaurant.average_rating ??
                  0
              )}
              reviewsCount={
                restaurant.reviews_count ??
                0
              }
              initialReviews={
                reviews
              }
            />
          </div>
        </div>
      </div>
    </OwnerLayout>
  );
}

/* ========================================================== */
/* HELPERS                                                    */
/* ========================================================== */

function isValidUuid(
  value: string
) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}