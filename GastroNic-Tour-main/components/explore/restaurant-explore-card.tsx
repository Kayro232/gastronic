import {
  type ExploreRestaurant,
} from '@/app/explore/page';

import {
  RestaurantCardView,
} from '@/components/cards/restaurant-card-view';
import { formatPriceLevel } from '@/lib/format/price';

/* ========================================================== */
/* IMAGE                                                      */
/* ========================================================== */

function getImageUrl(
  restaurant:
    ExploreRestaurant
) {
  const sortedImages =
    [
      ...restaurant.images,
    ].sort(
      (
        a,
        b
      ) => {
        if (
          a.kind ===
            'cover' &&
          b.kind !==
            'cover'
        ) {
          return -1;
        }

        if (
          b.kind ===
            'cover' &&
          a.kind !==
            'cover'
        ) {
          return 1;
        }

        return (
          a.sort_order -
          b.sort_order
        );
      }
    );

  const image =
    sortedImages[0];

  if (!image) {
    return '/placeholder.svg';
  }

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

    if (
      supabaseUrl
    ) {
      return `${supabaseUrl}/storage/v1/object/public/restaurant-images/${image.storage_path}`;
    }
  }

  return '/placeholder.svg';
}

/* ========================================================== */
/* CARD                                                       */
/* ========================================================== */

export function RestaurantExploreCard({
  restaurant,
}: {
  restaurant:
    ExploreRestaurant;
}) {
  const municipality =
    Array.isArray(
      restaurant.municipality
    )
      ? restaurant
          .municipality[0]
      : restaurant.municipality;

  const departmentData =
    municipality?.department;

  const department =
    Array.isArray(
      departmentData
    )
      ? departmentData[0]
      : departmentData;

  const categories =
    restaurant.categories
      .map(
        (
          item
        ) =>
          Array.isArray(
            item.category
          )
            ? item
                .category[0]
            : item.category
      )
      .filter(
        (
          category
        ): category is {
          id: string;
          name: string;
          slug: string;
        } =>
          Boolean(
            category
          )
      );

  const imageUrl =
    getImageUrl(
      restaurant
    );

  const rating =
    Number(
      restaurant.average_rating ??
        0
    );


  /*
   * Presentación delegada en RestaurantCardView (GastroNic DS).
   * Los datos se siguen resolviendo aquí igual que antes.
   */
  return (
    <RestaurantCardView
      id={restaurant.id}
      name={restaurant.name}
      imageUrl={imageUrl}
      rating={rating}
      reviewCount={restaurant.reviews_count ?? 0}
      priceLabel={formatPriceLevel(restaurant.price_level)}
      cuisine={categories[0]?.name ?? null}
      location={
        [municipality?.name, department?.name]
          .filter(Boolean)
          .join(', ') || null
      }
      description={restaurant.short_description}
      verified={Boolean(restaurant.is_verified)}
      featured={Boolean(restaurant.is_featured)}
    />
  );
}
