import { redirect } from 'next/navigation';
import { MessageSquareText } from 'lucide-react';

import { OwnerLayout } from '@/components/owner/owner-layout';
import {
  OwnerReviewsManager,
  type OwnerReview,
  type OwnerReviewRestaurant,
} from '@/components/owner/owner-reviews-manager';
import { createClient } from '@/lib/supabase/server';

interface ReviewProfile {
  id: string;
  full_name: string;
  username: string | null;
  avatar_path: string | null;
}

interface RawReview {
  id: string;
  restaurant_id: string;
  user_id: string;
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
  profile: ReviewProfile | ReviewProfile[] | null;
}

export default async function OwnerReviewsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/owner/login');
  }

  const { data: restaurantsData, error: restaurantsError } = await supabase
    .from('restaurants')
    .select(`
      id,
      name,
      status,
      average_rating,
      reviews_count
    `)
    .eq('created_by', user.id)
    .order('name', { ascending: true });

  if (restaurantsError) {
    console.error('Error cargando restaurantes:', restaurantsError);
  }

  const restaurants = (restaurantsData ?? []) as OwnerReviewRestaurant[];
  const restaurantIds = restaurants.map((restaurant) => restaurant.id);

  let reviews: OwnerReview[] = [];

  if (restaurantIds.length > 0) {
    const { data, error } = await supabase
      .from('reviews')
      .select(`
        id,
        restaurant_id,
        user_id,
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
      .in('restaurant_id', restaurantIds)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error cargando reseñas:', error);
    }

    const rawReviews = (data ?? []) as unknown as RawReview[];

    reviews = rawReviews.map((review) => ({
      ...review,
      profile: Array.isArray(review.profile)
        ? review.profile[0] ?? null
        : review.profile,
    }));
  }

  return (
    <OwnerLayout>
      <div className="min-h-screen bg-canvas">
        <div className="mx-auto max-w-[1480px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
          <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.08em] text-action">
                <MessageSquareText className="h-3.5 w-3.5" />
                Reputación
              </div>

              <h1 className="text-3xl font-bold tracking-[-0.04em] text-ink sm:text-4xl">
                Reseñas
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                Escucha a tus clientes, responde sus comentarios y cuida la
                reputación de cada restaurante desde un solo lugar.
              </p>
            </div>

            <div className="inline-flex w-fit items-center gap-3 rounded-2xl border border-border/70 bg-white px-4 py-3 shadow-none">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/[0.08] text-action">
                <MessageSquareText className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">
                  Portafolio
                </p>
                <p className="mt-0.5 text-sm font-bold text-ink">
                  {restaurants.length} {restaurants.length === 1 ? 'restaurante' : 'restaurantes'}
                </p>
              </div>
            </div>
          </header>

          <div className="mt-7">
            <OwnerReviewsManager
              restaurants={restaurants}
              initialReviews={reviews}
            />
          </div>
        </div>
      </div>
    </OwnerLayout>
  );
}
