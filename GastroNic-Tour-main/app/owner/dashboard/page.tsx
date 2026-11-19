import { redirect } from 'next/navigation';

import {
  OwnerDashboardOverview,
  type DashboardRestaurant,
  type DashboardReservation,
  type DashboardReview,
} from '@/components/owner/owner-dashboard-overview';

import { OwnerLayout } from '@/components/owner/owner-layout';
import { createClient } from '@/lib/supabase/server';

interface RestaurantRow {
  id: string;
  name: string;
  slug: string | null;
  short_description: string | null;
  status: string;

  average_rating: number;
  reviews_count: number;
  visits_count: number;
  favorites_count: number;

  is_verified: boolean;
  is_featured: boolean;

  created_at: string;
}

interface RestaurantImageRow {
  restaurant_id: string;
  storage_path: string | null;
  external_url: string | null;
}

interface ReservationRow {
  id: string;
  restaurant_id: string;
  guest_name: string;
  reserved_for: string;
  party_size: number;
  status: string;
  created_at: string;
}

interface ReviewRow {
  id: string;
  restaurant_id: string;
  rating: number;
  owner_reply: string | null;
  status: string;
  created_at: string;
}

interface FavoriteRow {
  restaurant_id: string;
  created_at: string;
}

interface VisitRow {
  restaurant_id: string;
  visited_at: string;
  verification_status: string;
}

export default async function OwnerDashboardPage() {
  const supabase =
    await createClient();

  const {
    data: { user },
  } =
    await supabase.auth.getUser();

  if (!user) {
    redirect('/owner/login');
  }

  /* ======================================================== */
  /* PERFIL                                                   */
  /* ======================================================== */

  const {
    data: profile,
  } = await supabase
    .from('profiles')
    .select(`
      full_name,
      username
    `)
    .eq('id', user.id)
    .maybeSingle();

  /* ======================================================== */
  /* RESTAURANTES                                             */
  /* ======================================================== */

  const {
    data: restaurantsData,
    error: restaurantsError,
  } = await supabase
    .from('restaurants')
    .select(`
      id,
      name,
      slug,
      short_description,
      status,
      average_rating,
      reviews_count,
      visits_count,
      favorites_count,
      is_verified,
      is_featured,
      created_at
    `)
    .eq('created_by', user.id)
    .order('created_at', {
      ascending: false,
    });

  if (restaurantsError) {
    console.error(
      'Error cargando restaurantes:',
      restaurantsError
    );
  }

  const restaurants =
    (restaurantsData ??
      []) as RestaurantRow[];

  if (restaurants.length === 0) {
    return (
      <OwnerLayout>
        <OwnerDashboardOverview
          ownerName={
            profile?.full_name?.trim() ||
            profile?.username ||
            'Propietario'
          }
          restaurants={[]}
          reservations={[]}
          reviews={[]}
          totalFavorites={0}
          totalVisits={0}
          recentFavorites={0}
          previousFavorites={0}
          recentVisits={0}
          previousVisits={0}
          recentReviews={0}
          previousReviews={0}
        />
      </OwnerLayout>
    );
  }

  const restaurantIds =
    restaurants.map(
      (restaurant) =>
        restaurant.id
    );

  /* ======================================================== */
  /* DATOS DEL DASHBOARD                                      */
  /* ======================================================== */

  const [
    imagesResult,
    reservationsResult,
    reviewsResult,
    favoritesResult,
    visitsResult,
  ] = await Promise.all([
    supabase
      .from('restaurant_images')
      .select(`
        restaurant_id,
        storage_path,
        external_url
      `)
      .in(
        'restaurant_id',
        restaurantIds
      )
      .eq('kind', 'cover')
      .order('sort_order', {
        ascending: true,
      }),

    supabase
      .from('reservations')
      .select(`
        id,
        restaurant_id,
        guest_name,
        reserved_for,
        party_size,
        status,
        created_at
      `)
      .in(
        'restaurant_id',
        restaurantIds
      )
      .order('reserved_for', {
        ascending: true,
      }),

    supabase
      .from('reviews')
      .select(`
        id,
        restaurant_id,
        rating,
        owner_reply,
        status,
        created_at
      `)
      .in(
        'restaurant_id',
        restaurantIds
      )
      .order('created_at', {
        ascending: false,
      }),

    supabase
      .from('favorites')
      .select(`
        restaurant_id,
        created_at
      `)
      .in(
        'restaurant_id',
        restaurantIds
      )
      .order('created_at', {
        ascending: false,
      }),

    supabase
      .from('visits')
      .select(`
        restaurant_id,
        visited_at,
        verification_status
      `)
      .in(
        'restaurant_id',
        restaurantIds
      )
      .order('visited_at', {
        ascending: false,
      }),
  ]);

  if (imagesResult.error) {
    console.error(
      'Error cargando portadas:',
      imagesResult.error
    );
  }

  if (
    reservationsResult.error
  ) {
    console.error(
      'Error cargando reservaciones:',
      reservationsResult.error
    );
  }

  if (reviewsResult.error) {
    console.error(
      'Error cargando reseñas:',
      reviewsResult.error
    );
  }

  if (favoritesResult.error) {
    console.error(
      'Error cargando favoritos:',
      favoritesResult.error
    );
  }

  if (visitsResult.error) {
    console.error(
      'Error cargando visitas:',
      visitsResult.error
    );
  }

  const images =
    (imagesResult.data ??
      []) as RestaurantImageRow[];

  const reservations =
    (reservationsResult.data ??
      []) as ReservationRow[];

  const reviews =
    (reviewsResult.data ??
      []) as ReviewRow[];

  const favorites =
    (favoritesResult.data ??
      []) as FavoriteRow[];

  const visits =
    (visitsResult.data ??
      []) as VisitRow[];

  /* ======================================================== */
  /* PORTADAS                                                 */
  /* ======================================================== */

  const coverMap =
    new Map<
      string,
      string | null
    >();

  for (const image of images) {
    if (
      coverMap.has(
        image.restaurant_id
      )
    ) {
      continue;
    }

    coverMap.set(
      image.restaurant_id,
      resolveImageUrl(
        image
      )
    );
  }

  /* ======================================================== */
  /* COUNTS POR RESTAURANTE                                   */
  /* ======================================================== */

  const dashboardRestaurants: DashboardRestaurant[] =
    restaurants.map(
      (restaurant) => {
        const restaurantReservations =
          reservations.filter(
            (reservation) =>
              reservation.restaurant_id ===
              restaurant.id
          );

        const restaurantReviews =
          reviews.filter(
            (review) =>
              review.restaurant_id ===
              restaurant.id &&
              review.status ===
                'published'
          );

        const pendingReservations =
          restaurantReservations.filter(
            (reservation) =>
              reservation.status ===
              'pending'
          ).length;

        const unansweredReviews =
          restaurantReviews.filter(
            (review) =>
              !review.owner_reply
          ).length;

        return {
          id:
            restaurant.id,

          name:
            restaurant.name,

          slug:
            restaurant.slug,

          description:
            restaurant.short_description,

          status:
            restaurant.status,

          averageRating:
            Number(
              restaurant.average_rating ??
                0
            ),

          reviewsCount:
            restaurant.reviews_count ??
            0,

          visitsCount:
            restaurant.visits_count ??
            0,

          favoritesCount:
            restaurant.favorites_count ??
            0,

          isVerified:
            restaurant.is_verified,

          isFeatured:
            restaurant.is_featured,

          coverImage:
            coverMap.get(
              restaurant.id
            ) ?? null,

          createdAt:
            restaurant.created_at,

          pendingReservations,

          unansweredReviews,
        };
      }
    );

  /* ======================================================== */
  /* RESERVACIONES DESTACADAS                                 */
  /* ======================================================== */

  const dashboardReservations: DashboardReservation[] =
    reservations
      .filter(
        (reservation) =>
          reservation.status ===
            'pending' ||
          reservation.status ===
            'confirmed'
      )
      .slice(0, 5)
      .map(
        (reservation) => ({
          id:
            reservation.id,

          restaurantId:
            reservation.restaurant_id,

          restaurantName:
            restaurants.find(
              (restaurant) =>
                restaurant.id ===
                reservation.restaurant_id
            )?.name ??
            'Restaurante',

          guestName:
            reservation.guest_name,

          reservedFor:
            reservation.reserved_for,

          partySize:
            reservation.party_size,

          status:
            reservation.status,

          createdAt:
            reservation.created_at,
        })
      );

  /* ======================================================== */
  /* RESEÑAS PENDIENTES                                       */
  /* ======================================================== */

  const dashboardReviews: DashboardReview[] =
    reviews
      .filter(
        (review) =>
          review.status ===
            'published' &&
          !review.owner_reply
      )
      .slice(0, 5)
      .map(
        (review) => ({
          id:
            review.id,

          restaurantId:
            review.restaurant_id,

          restaurantName:
            restaurants.find(
              (restaurant) =>
                restaurant.id ===
                review.restaurant_id
            )?.name ??
            'Restaurante',

          rating:
            review.rating,

          createdAt:
            review.created_at,
        })
      );

  /* ======================================================== */
  /* RANGOS                                                   */
  /* ======================================================== */

  const now =
    new Date();

  const currentStart =
    new Date(now);

  currentStart.setDate(
    currentStart.getDate() -
      30
  );

  const previousStart =
    new Date(now);

  previousStart.setDate(
    previousStart.getDate() -
      60
  );

  const recentVisits =
    visits.filter(
      (visit) =>
        new Date(
          visit.visited_at
        ) >= currentStart
    ).length;

  const previousVisits =
    visits.filter(
      (visit) => {
        const date =
          new Date(
            visit.visited_at
          );

        return (
          date >=
            previousStart &&
          date <
            currentStart
        );
      }
    ).length;

  const recentFavorites =
    favorites.filter(
      (favorite) =>
        new Date(
          favorite.created_at
        ) >= currentStart
    ).length;

  const previousFavorites =
    favorites.filter(
      (favorite) => {
        const date =
          new Date(
            favorite.created_at
          );

        return (
          date >=
            previousStart &&
          date <
            currentStart
        );
      }
    ).length;

  const recentReviews =
    reviews.filter(
      (review) =>
        review.status ===
          'published' &&
        new Date(
          review.created_at
        ) >= currentStart
    ).length;

  const previousReviews =
    reviews.filter(
      (review) => {
        const date =
          new Date(
            review.created_at
          );

        return (
          review.status ===
            'published' &&
          date >=
            previousStart &&
          date <
            currentStart
        );
      }
    ).length;

  return (
    <OwnerLayout>
      <OwnerDashboardOverview
        ownerName={
          profile?.full_name?.trim() ||
          profile?.username ||
          'Propietario'
        }
        restaurants={
          dashboardRestaurants
        }
        reservations={
          dashboardReservations
        }
        reviews={
          dashboardReviews
        }
        totalFavorites={
          favorites.length
        }
        totalVisits={
          visits.length
        }
        recentFavorites={
          recentFavorites
        }
        previousFavorites={
          previousFavorites
        }
        recentVisits={
          recentVisits
        }
        previousVisits={
          previousVisits
        }
        recentReviews={
          recentReviews
        }
        previousReviews={
          previousReviews
        }
      />
    </OwnerLayout>
  );
}

/* ========================================================== */
/* HELPERS                                                    */
/* ========================================================== */

function resolveImageUrl(
  image: RestaurantImageRow
) {
  if (
    image.external_url
  ) {
    return image.external_url;
  }

  if (
    image.storage_path
  ) {
    const supabaseUrl =
      process.env
        .NEXT_PUBLIC_SUPABASE_URL;

    if (!supabaseUrl) {
      return null;
    }

    return `${supabaseUrl}/storage/v1/object/public/restaurant-images/${image.storage_path}`;
  }

  return null;
}