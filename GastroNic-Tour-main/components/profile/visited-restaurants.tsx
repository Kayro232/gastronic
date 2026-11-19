'use client';

import { useEffect, useState } from 'react';

import {
  AlertCircle,
  MapPin,
  SearchX,
} from 'lucide-react';

import { RestaurantCard } from '@/components/cards/restaurant-card';
import { formatPriceRange } from '@/lib/format/price';
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

interface RestaurantImage {
  kind: string;
  external_url: string | null;
  storage_path: string | null;
  sort_order: number;
}

interface Category {
  id: number;
  name: string;
  slug: string;
}

interface RestaurantCategory {
  category:
    | Category
    | Category[]
    | null;
}

interface Department {
  name: string;
}

interface Municipality {
  name: string;
  department:
    | Department
    | Department[]
    | null;
}

interface Restaurant {
  id: string;
  name: string;
  average_rating: number | null;
  reviews_count: number | null;
  price_level: number | null;
  estimated_price_min: number | null;
  estimated_price_max: number | null;
  is_verified: boolean;

  images:
    | RestaurantImage[]
    | null;

  categories:
    | RestaurantCategory[]
    | null;

  municipality:
    | Municipality
    | Municipality[]
    | null;
}

interface Visit {
  id: string;
  visited_at: string;
  verification_status: string;

  restaurant:
    | Restaurant
    | Restaurant[]
    | null;
}

function getRestaurant(
  restaurant:
    | Restaurant
    | Restaurant[]
    | null
) {
  if (!restaurant) {
    return null;
  }

  return Array.isArray(restaurant)
    ? restaurant[0] ?? null
    : restaurant;
}

function getImageUrl(
  images: RestaurantImage[] | null
) {
  const orderedImages = [
    ...(images ?? []),
  ].sort(
    (a, b) =>
      (a.sort_order ?? 0) -
      (b.sort_order ?? 0)
  );

  const cover =
    orderedImages.find(
      (image) =>
        image.kind === 'cover'
    ) ?? orderedImages[0];

  if (!cover) {
    return '/placeholder.svg';
  }

  if (cover.external_url) {
    return cover.external_url;
  }

  if (cover.storage_path) {
    const supabaseUrl =
      process.env
        .NEXT_PUBLIC_SUPABASE_URL;

    if (!supabaseUrl) {
      return '/placeholder.svg';
    }

    return `${supabaseUrl}/storage/v1/object/public/restaurant-images/${cover.storage_path}`;
  }

  return '/placeholder.svg';
}

function getCategory(
  categories:
    | RestaurantCategory[]
    | null
) {
  const categoryData =
    categories?.[0]?.category;

  if (!categoryData) {
    return 'Restaurante';
  }

  return Array.isArray(categoryData)
    ? categoryData[0]?.name ??
        'Restaurante'
    : categoryData.name;
}

function getLocation(
  municipalityData:
    | Municipality
    | Municipality[]
    | null
) {
  const municipality =
    Array.isArray(
      municipalityData
    )
      ? municipalityData[0]
      : municipalityData;

  if (!municipality) {
    return 'Nicaragua';
  }

  const departmentData =
    municipality.department;

  const department =
    Array.isArray(
      departmentData
    )
      ? departmentData[0]
      : departmentData;

  return [
    municipality.name,
    department?.name,
  ]
    .filter(Boolean)
    .join(', ');
}

function getPriceRange(
  min: number | null,
  max: number | null,
  priceLevel: number | null
) {
  /* Formato único de precios (lib/format/price.ts) */
  return formatPriceRange(min, max, priceLevel) ?? '';
}

export function VisitedRestaurants() {
  const [
    visits,
    setVisits,
  ] = useState<Visit[]>([]);

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState('');

  useEffect(() => {
    async function loadVisits() {
      setIsLoading(true);
      setErrorMessage('');

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

        setErrorMessage(
          'No se pudo obtener la sesión actual.'
        );

        setIsLoading(false);
        return;
      }

      if (!user) {
        setVisits([]);
        setIsLoading(false);
        return;
      }

      const {
        data,
        error,
      } = await supabase
        .from('visits')
        .select(`
          id,
          visited_at,
          verification_status,

          restaurant:restaurants (
            id,
            name,
            average_rating,
            reviews_count,
            price_level,
            estimated_price_min,
            estimated_price_max,
            is_verified,

            images:restaurant_images (
              kind,
              external_url,
              storage_path,
              sort_order
            ),

            categories:restaurant_categories (
              category:categories (
                id,
                name,
                slug
              )
            ),

            municipality:municipalities (
              name,

              department:departments (
                name
              )
            )
          )
        `)
        .eq(
          'user_id',
          user.id
        )
        .order(
          'visited_at',
          {
            ascending: false,
          }
        );

      if (error) {
        console.error(
          'Error cargando visitas:',
          error
        );

        setVisits([]);

        setErrorMessage(
          'No se pudieron cargar tus visitas.'
        );

        setIsLoading(false);
        return;
      }

      setVisits(
        (data ??
          []) as unknown as Visit[]
      );

      setIsLoading(false);
    }

    loadVisits();
  }, []);

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:gap-6 md:grid-cols-2 xl:grid-cols-3">
        {[1, 2, 3].map(
          (item) => (
            <VisitSkeleton
              key={item}
            />
          )
        )}
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="flex min-h-[210px] sm:min-h-[280px] items-center justify-center rounded-card sm:rounded-sheet border border-danger/25 bg-red-50/60 px-5 py-8 text-center sm:px-6">
        <div className="max-w-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-danger-soft">
            <AlertCircle className="h-5 w-5 text-danger" />
          </div>

          <h3 className="mt-4 font-bold text-red-900">
            No pudimos cargar tus visitas
          </h3>

          <p className="mt-2 text-sm leading-6 text-danger">
            {errorMessage}
          </p>
        </div>
      </div>
    );
  }

  if (visits.length === 0) {
    return (
      <div className="flex min-h-[220px] sm:min-h-[320px] items-center justify-center rounded-card sm:rounded-sheet border border-dashed border-border bg-white px-5 py-8 text-center sm:px-6">
        <div className="max-w-md">
          <div className="mx-auto flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-primary/10">
            <SearchX className="h-5 w-5 text-action sm:h-6 sm:w-6" />
          </div>

          <h3 className="mt-4 text-base font-bold sm:mt-5 sm:text-lg text-ink">
            Tu recorrido comienza aquí
          </h3>

          <p className="mt-2 text-xs leading-5 text-muted-foreground sm:text-sm sm:leading-6">
            Cuando registres tu primera visita a un restaurante, aparecerá en este espacio.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 sm:mb-7 sm:gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-1.5 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.08em] text-action sm:mb-2 sm:text-xs sm:tracking-[0.08em]">
            <MapPin className="h-3.5 w-3.5" />
            Tus experiencias
          </div>

          <h3 className="text-xl font-bold tracking-[-0.025em] text-ink sm:text-2xl">
            Restaurantes visitados
          </h3>

          <p className="mt-1.5 text-xs text-muted-foreground sm:mt-2 sm:text-sm">
            Has registrado{' '}
            <span className="font-semibold text-ink">
              {visits.length}
            </span>{' '}
            {visits.length === 1
              ? 'visita'
              : 'visitas'}.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:gap-6 md:grid-cols-2 xl:grid-cols-3">
        {visits.map(
          (visit) => {
            const restaurant =
              getRestaurant(
                visit.restaurant
              );

            if (!restaurant) {
              return null;
            }

            return (
              <RestaurantCard
                key={visit.id}
                id={restaurant.id}
                name={restaurant.name}
                image={getImageUrl(
                  restaurant.images
                )}
                rating={Number(
                  restaurant.average_rating ??
                    0
                )}
                reviews={
                  restaurant.reviews_count ??
                  0
                }
                priceRange={getPriceRange(
                  restaurant.estimated_price_min,
                  restaurant.estimated_price_max,
                  restaurant.price_level
                )}
                cuisine={getCategory(
                  restaurant.categories
                )}
                location={getLocation(
                  restaurant.municipality
                )}
                verified={
                  restaurant.is_verified
                }
              />
            );
          }
        )}
      </div>
    </div>
  );
}

function VisitSkeleton() {
  return (
    <div className="overflow-hidden rounded-card border sm:rounded-card border-border/60 bg-white">
      <div className="aspect-[4/3] animate-pulse bg-muted" />

      <div className="p-4 sm:p-5">
        <div className="h-5 w-3/4 animate-pulse rounded-lg bg-muted" />

        <div className="mt-3 h-3 w-1/2 animate-pulse rounded-lg bg-muted" />

        <div className="mt-5 flex justify-between border-t border-border/60 pt-4">
          <div className="h-3 w-24 animate-pulse rounded-lg bg-muted" />

          <div className="h-3 w-16 animate-pulse rounded-lg bg-muted" />
        </div>
      </div>
    </div>
  );
}