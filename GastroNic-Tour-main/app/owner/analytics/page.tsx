import { BarChart3, Store } from 'lucide-react';
import { redirect } from 'next/navigation';

import { DataLoadError } from '@/components/common/data-load-error';
import {
  OwnerAnalyticsDashboard,
  type AnalyticsFavorite,
  type AnalyticsReservation,
  type AnalyticsRestaurant,
  type AnalyticsReview,
  type AnalyticsVisit,
} from '@/components/owner/owner-analytics-dashboard';
import { OwnerLayout } from '@/components/owner/owner-layout';
import { createClient } from '@/lib/supabase/server';

export default async function OwnerAnalyticsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/owner/login');
  }

  const snapshotNow = new Date().toISOString();

  const {
    data: restaurantsData,
    error: restaurantsError,
  } = await supabase
    .from('restaurants')
    .select(`
      id,
      name,
      status,
      average_rating,
      reviews_count,
      favorites_count,
      visits_count,
      is_verified,
      is_featured,
      published_at
    `)
    .eq('created_by', user.id)
    .order('name', { ascending: true });

  if (restaurantsError) {
    console.error('Error cargando restaurantes:', restaurantsError);

    return (
      <OwnerLayout>
        <div className="min-h-screen bg-canvas">
          <div className="mx-auto max-w-[1500px] px-4 py-8 sm:px-6 lg:px-8">
            <DataLoadError
              title="No pudimos cargar tus estadísticas"
              description="Ocurrió un problema al consultar tu portafolio. Intenta cargar los datos nuevamente."
            />
          </div>
        </div>
      </OwnerLayout>
    );
  }

  const restaurants = (restaurantsData ?? []) as AnalyticsRestaurant[];
  const restaurantIds = restaurants.map((restaurant) => restaurant.id);

  let visits: AnalyticsVisit[] = [];
  let favorites: AnalyticsFavorite[] = [];
  let reviews: AnalyticsReview[] = [];
  let reservations: AnalyticsReservation[] = [];

  if (restaurantIds.length > 0) {
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
          restaurant_id,
          visited_at,
          verification_status,
          verification_method
        `)
        .in('restaurant_id', restaurantIds)
        .order('visited_at', { ascending: true }),

      supabase
        .from('favorites')
        .select(`
          restaurant_id,
          user_id,
          created_at
        `)
        .in('restaurant_id', restaurantIds)
        .order('created_at', { ascending: true }),

      supabase
        .from('reviews')
        .select(`
          id,
          restaurant_id,
          rating,
          status,
          is_verified_visit,
          owner_reply,
          created_at
        `)
        .in('restaurant_id', restaurantIds)
        .order('created_at', { ascending: true }),

      supabase
        .from('reservations')
        .select(`
          id,
          restaurant_id,
          reserved_for,
          party_size,
          status,
          created_at
        `)
        .in('restaurant_id', restaurantIds)
        .order('created_at', { ascending: true }),
    ]);

    const loadError =
      visitsResult.error ||
      favoritesResult.error ||
      reviewsResult.error ||
      reservationsResult.error;

    if (loadError) {
      console.error('Error cargando analíticas del owner:', {
        visits: visitsResult.error,
        favorites: favoritesResult.error,
        reviews: reviewsResult.error,
        reservations: reservationsResult.error,
      });

      return (
        <OwnerLayout>
          <div className="min-h-screen bg-canvas">
            <div className="mx-auto max-w-[1500px] px-4 py-8 sm:px-6 lg:px-8">
              <DataLoadError
                title="No pudimos completar tus estadísticas"
                description="Una de las fuentes de datos no respondió correctamente. Intenta cargar la información nuevamente."
              />
            </div>
          </div>
        </OwnerLayout>
      );
    }

    visits = (visitsResult.data ?? []) as AnalyticsVisit[];
    favorites = (favoritesResult.data ?? []) as AnalyticsFavorite[];
    reviews = (reviewsResult.data ?? []) as AnalyticsReview[];
    reservations = (reservationsResult.data ?? []) as AnalyticsReservation[];
  }

  const approved = restaurants.filter(
    (restaurant) => restaurant.status === 'approved'
  ).length;

  return (
    <OwnerLayout>
      <div className="min-h-screen bg-canvas">
        <div className="mx-auto max-w-[1500px] px-4 py-7 sm:px-6 lg:px-8 lg:py-8">
          <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.08em] text-action">
                <BarChart3 className="h-3.5 w-3.5" />
                Inteligencia de negocio
              </p>

              <h1 className="mt-2 text-4xl font-extrabold tracking-[-0.05em] text-[#0F2930] sm:text-[42px] sm:leading-none">
                Estadísticas
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
                Entiende cómo se mueve tu portafolio y compara el rendimiento de tus restaurantes con datos reales de GastroNic Tour.
              </p>
            </div>

            <div className="flex items-center gap-3 rounded-2xl border border-[#E5ECE9] bg-white px-4 py-3 shadow-none">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EAF8F6] text-action">
                <Store className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.08em] text-slate-400">
                  Portafolio
                </p>
                <p className="mt-0.5 text-sm font-extrabold text-ink">
                  {restaurants.length} {restaurants.length === 1 ? 'restaurante' : 'restaurantes'}
                </p>
                <p className="text-xs text-slate-500">
                  {approved} {approved === 1 ? 'publicado' : 'publicados'}
                </p>
              </div>
            </div>
          </header>

          <div className="mt-6">
            <OwnerAnalyticsDashboard
              restaurants={restaurants}
              visits={visits}
              favorites={favorites}
              reviews={reviews}
              reservations={reservations}
              snapshotNow={snapshotNow}
            />
          </div>
        </div>
      </div>
    </OwnerLayout>
  );
}
