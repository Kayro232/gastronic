import Link from 'next/link';

import {
  notFound,
  redirect,
} from 'next/navigation';

import {
  ArrowLeft,
  BarChart3,
  Store,
} from 'lucide-react';

import { OwnerLayout } from '@/components/owner/owner-layout';
import { RestaurantAnalyticsDashboard } from '@/components/owner/restaurant-analytics-dashboard';
import { createClient } from '@/lib/supabase/server';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function OwnerRestaurantAnalyticsPage({
  params,
}: PageProps) {
  const { id } = await params;

  if (!isValidUuid(id)) {
    notFound();
  }

  const supabase =
    await createClient();

  const {
    data: { user },
  } =
    await supabase.auth.getUser();

  if (!user) {
    redirect('/owner/login');
  }

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
      reviews_count,
      favorites_count,
      visits_count
    `)
    .eq('id', id)
    .eq('created_by', user.id)
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

  const [
    visitsResult,
    favoritesResult,
    reviewsResult,
    reservationsResult,
  ] = await Promise.all([
    supabase
      .from('visits')
      .select(`
        id,
        visited_at,
        verification_status,
        verification_method
      `)
      .eq(
        'restaurant_id',
        restaurant.id
      )
      .order('visited_at', {
        ascending: true,
      }),

    supabase
      .from('favorites')
      .select(`
        user_id,
        created_at
      `)
      .eq(
        'restaurant_id',
        restaurant.id
      )
      .order('created_at', {
        ascending: true,
      }),

    supabase
      .from('reviews')
      .select(`
        id,
        rating,
        status,
        is_verified_visit,
        created_at
      `)
      .eq(
        'restaurant_id',
        restaurant.id
      )
      .order('created_at', {
        ascending: true,
      }),

    supabase
      .from('reservations')
      .select(`
        id,
        reserved_for,
        party_size,
        status,
        created_at
      `)
      .eq(
        'restaurant_id',
        restaurant.id
      )
      .order('created_at', {
        ascending: true,
      }),
  ]);

  if (visitsResult.error) {
    console.error(
      'Error cargando visitas:',
      visitsResult.error
    );
  }

  if (favoritesResult.error) {
    console.error(
      'Error cargando favoritos:',
      favoritesResult.error
    );
  }

  if (reviewsResult.error) {
    console.error(
      'Error cargando reseñas:',
      reviewsResult.error
    );
  }

  if (reservationsResult.error) {
    console.error(
      'Error cargando reservaciones:',
      reservationsResult.error
    );
  }

  return (
    <OwnerLayout>
      <div className="min-h-screen bg-canvas">
        <div className="mx-auto max-w-[1450px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
          <Link
            href={`/owner/restaurants/${restaurant.id}`}
            className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground transition hover:text-action"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a {restaurant.name}
          </Link>

          <header className="mt-6 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.08em] text-action">
                <BarChart3 className="h-3.5 w-3.5" />
                Rendimiento
              </div>

              <h1 className="text-3xl font-bold tracking-[-0.035em] text-ink sm:text-4xl">
                Estadísticas
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                Analiza el rendimiento y la actividad de{' '}
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

          <div className="mt-7">
            <RestaurantAnalyticsDashboard
              restaurantName={restaurant.name}
              averageRating={Number(
                restaurant.average_rating ?? 0
              )}
              visits={
                visitsResult.data ?? []
              }
              favorites={
                favoritesResult.data ?? []
              }
              reviews={
                reviewsResult.data ?? []
              }
              reservations={
                reservationsResult.data ?? []
              }
            />
          </div>
        </div>
      </div>
    </OwnerLayout>
  );
}

function isValidUuid(
  value: string
) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}