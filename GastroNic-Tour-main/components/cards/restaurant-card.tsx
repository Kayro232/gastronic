'use client';

import {
  RestaurantCardView,
  type RestaurantCardChip,
} from '@/components/cards/restaurant-card-view';

/* ========================================================== */
/* TYPES                                                      */
/* ========================================================== */

interface RestaurantCardProps {
  id: string;
  name: string;
  image: string;

  rating: number;
  reviews: number;

  priceRange: string;
  cuisine: string;
  location: string;

  verified?: boolean;

  isOpenNow?: boolean | null;

  recommendationReasons?: string[];

  distanceKm?: number | null;
}

/* ========================================================== */
/* HELPERS                                                    */
/* ========================================================== */

function formatDistance(
  distanceKm: number | null
) {
  if (
    distanceKm === null ||
    !Number.isFinite(Number(distanceKm))
  ) {
    return null;
  }

  const safeDistance = Math.max(Number(distanceKm), 0);

  return safeDistance < 1
    ? `${Math.round(safeDistance * 1000)} m`
    : `${safeDistance.toFixed(safeDistance < 10 ? 1 : 0)} km`;
}

/* ========================================================== */
/* COMPONENT                                                  */
/* ========================================================== */

/*
 * Tarjeta usada en inicio y perfil. Mantiene su API y delega
 * la presentación en RestaurantCardView (GastroNic DS).
 */
export function RestaurantCard({
  id,
  name,
  image,
  rating,
  reviews,
  priceRange,
  cuisine,
  location,
  verified = false,
  isOpenNow = null,
  recommendationReasons = [],
  distanceKm = null,
}: RestaurantCardProps) {
  const distanceLabel = formatDistance(distanceKm);

  const chips: RestaurantCardChip[] = [
    ...recommendationReasons
      .filter(Boolean)
      .slice(0, 2)
      .map((reason) => ({ label: reason, kind: 'reason' as const })),
    ...(distanceLabel
      ? [{ label: `A ${distanceLabel}`, kind: 'distance' as const }]
      : []),
  ];

  return (
    <RestaurantCardView
      id={id}
      name={name}
      imageUrl={image}
      rating={rating}
      reviewCount={reviews}
      priceLabel={priceRange || null}
      cuisine={cuisine || 'Restaurante'}
      location={location || 'Nicaragua'}
      verified={verified}
      isOpenNow={isOpenNow}
      chips={chips}
    />
  );
}
