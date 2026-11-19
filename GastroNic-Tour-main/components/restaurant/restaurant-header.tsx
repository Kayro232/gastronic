'use client';

import {
  BadgeCheck,
  ChevronRight,
  Clock3,
  MapPin,
  Navigation,
  Share2,
  Star,
} from 'lucide-react';

import { Button } from '@/components/ui/button';

interface Department {
  id: string;
  name: string;
}

interface Municipality {
  id: string;
  name: string;

  department:
    | Department
    | Department[]
    | null;
}

export interface RestaurantImage {
  id: string;
  kind: string;
  storage_path: string | null;
  external_url: string | null;
  alt_text: string | null;
  sort_order: number;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
}

interface RestaurantCategory {
  category:
    | Category
    | Category[]
    | null;
}

export interface RestaurantHeaderData {
  id: string;
  name: string;
  slug: string;

  short_description:
    | string
    | null;

  description:
    | string
    | null;

  address:
    | string
    | null;

  price_level: number;
  status: string;
  is_verified: boolean;

  average_rating: number;
  reviews_count: number;
  favorites_count: number;
  visits_count: number;

  municipality:
    | Municipality
    | Municipality[]
    | null;

  images:
    RestaurantImage[];

  categories:
    RestaurantCategory[];
}

interface RestaurantHeaderProps {
  restaurant:
    RestaurantHeaderData;

  todayStatus?: string;
}

function getImageUrl(
  image?: RestaurantImage
) {
  if (!image) {
    return '/placeholder.svg';
  }

  if (image.external_url) {
    return image.external_url;
  }

  if (image.storage_path) {
    const supabaseUrl =
      process.env
        .NEXT_PUBLIC_SUPABASE_URL;

    if (supabaseUrl) {
      return `${supabaseUrl}/storage/v1/object/public/restaurant-images/${image.storage_path}`;
    }
  }

  return '/placeholder.svg';
}

export function RestaurantHeader({
  restaurant,
  todayStatus,
}: RestaurantHeaderProps) {
  const municipality =
    Array.isArray(
      restaurant.municipality
    )
      ? restaurant.municipality[0]
      : restaurant.municipality;

  const departmentData =
    municipality?.department;

  const department =
    Array.isArray(
      departmentData
    )
      ? departmentData[0]
      : departmentData;

  const coverImage =
    restaurant.images?.find(
      (image) =>
        image.kind ===
        'cover'
    ) ??
    restaurant.images?.[0];

  const imageUrl =
    getImageUrl(
      coverImage
    );

  const categories =
    restaurant.categories
      ?.map(
        (item) =>
          Array.isArray(
            item.category
          )
            ? item.category[0]
            : item.category
      )
      .filter(
        (
          category
        ): category is Category =>
          Boolean(
            category
          )
      ) ??
    [];

  const description =
    restaurant.short_description ??
    restaurant.description ??
    'Descubre una experiencia gastronómica en Nicaragua.';

  const locationText = [
    municipality?.name,
    department?.name,
  ]
    .filter(Boolean)
    .join(', ');

  const rating =
    Number(
      restaurant.average_rating ??
        0
    );

  const priceLevel =
    Math.min(
      Math.max(
        Number(
          restaurant.price_level ??
            1
        ),
        1
      ),
      4
    );

  async function handleShare() {
    const url =
      window.location.href;

    try {
      if (navigator.share) {
        await navigator.share({
          title:
            restaurant.name,

          text:
            description,

          url,
        });

        return;
      }

      await navigator.clipboard.writeText(
        url
      );
    } catch {
      // Puede cancelarse manualmente.
    }
  }

  function handleDirections() {
    const destination = [
      restaurant.address,
      municipality?.name,
      department?.name,
      'Nicaragua',
    ]
      .filter(Boolean)
      .join(', ');

    if (!destination) {
      return;
    }

    const mapsUrl =
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        destination
      )}`;

    window.open(
      mapsUrl,
      '_blank',
      'noopener,noreferrer'
    );
  }

  return (
    <section className="bg-canvas px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
      <div className="mx-auto max-w-[1460px] overflow-hidden rounded-sheet border border-border/70 bg-surface-2 shadow-none">
        <div className="grid lg:min-h-[490px] lg:grid-cols-[minmax(0,1fr)_47%]">
          {/* ================================================== */}
          {/* CONTENT                                            */}
          {/* ================================================== */}

          <div className="order-2 flex items-center px-5 py-8 sm:px-7 sm:py-10 lg:order-1 lg:px-10 lg:py-12 xl:px-14">
            <div className="w-full max-w-[720px]">
              {/* BREADCRUMB */}

              <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-muted-foreground">
                <span>
                  GastroNic
                </span>

                <ChevronRight className="h-3.5 w-3.5" />

                <span>
                  {municipality?.name ??
                    'Nicaragua'}
                </span>

                <ChevronRight className="h-3.5 w-3.5" />

                <span className="max-w-[220px] truncate font-semibold text-ink">
                  {restaurant.name}
                </span>
              </div>

              {/* BADGES */}

              <div className="mt-6 flex flex-wrap gap-2">
                {restaurant.is_verified && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/15 bg-primary/[0.07] px-3 py-1.5 text-xs font-bold text-action">
                    <BadgeCheck className="h-3.5 w-3.5" />

                    Verificado
                  </span>
                )}

                {categories
                  .slice(0, 2)
                  .map(
                    (
                      category
                    ) => (
                      <span
                        key={
                          category.id
                        }
                        className="rounded-full border border-border/70 bg-white px-3 py-1.5 text-xs font-semibold text-[#4A5D5A]"
                      >
                        {
                          category.name
                        }
                      </span>
                    )
                  )}

                <span className="rounded-full border border-border/70 bg-white px-3 py-1.5 text-xs font-bold text-ink">
                  {'$'.repeat(
                    priceLevel
                  )}
                </span>
              </div>

              {/* TITLE */}

              <h1 className="mt-6 max-w-3xl text-4xl font-bold tracking-[-0.055em] text-ink sm:text-5xl lg:text-[3.5rem] lg:leading-[1.03]">
                {restaurant.name}
              </h1>

              {/* DESCRIPTION */}

              <p className="mt-5 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
                {description}
              </p>

              {/* META */}

              <div className="mt-7 flex flex-wrap gap-x-6 gap-y-3">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 fill-secondary text-secondary" />

                  <span className="text-sm font-bold text-ink">
                    {rating >
                    0
                      ? rating.toFixed(
                          1
                        )
                      : 'Nuevo'}
                  </span>

                  <span className="text-xs text-muted-foreground">
                    {restaurant.reviews_count >
                    0
                      ? `${restaurant.reviews_count} ${
                          restaurant.reviews_count ===
                          1
                            ? 'reseña'
                            : 'reseñas'
                        }`
                      : 'Sin reseñas'}
                  </span>
                </div>

                {locationText && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 text-action" />

                    {locationText}
                  </div>
                )}

                {todayStatus && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock3 className="h-3.5 w-3.5 text-action" />

                    {todayStatus}
                  </div>
                )}
              </div>

              {/* ACTIONS */}

              <div className="mt-8 flex flex-wrap gap-3">
                <Button
                  type="button"
                  onClick={
                    handleDirections
                  }
                  className="h-11 rounded-xl bg-action px-5 font-bold text-white shadow-none hover:bg-action-hover"
                >
                  <Navigation className="mr-2 h-4 w-4" />

                  Cómo llegar
                </Button>

                <Button
                  type="button"
                  onClick={
                    handleShare
                  }
                  variant="outline"
                  className="h-11 rounded-xl border-border/80 bg-white px-5 font-semibold text-ink hover:bg-[#EEF2F1]"
                >
                  <Share2 className="mr-2 h-4 w-4" />

                  Compartir
                </Button>
              </div>
            </div>
          </div>

          {/* ================================================== */}
          {/* IMAGE                                              */}
          {/* ================================================== */}

          <div className="relative order-1 min-h-[300px] overflow-hidden bg-[#E8ECEA] lg:order-2 lg:min-h-[490px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={
                imageUrl
              }
              alt={
                coverImage?.alt_text ||
                restaurant.name
              }
              className="absolute inset-0 h-full w-full object-cover"
            />

            <div className="absolute inset-0 ring-1 ring-inset ring-black/[0.04]" />

            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/20 to-transparent" />
          </div>
        </div>
      </div>
    </section>
  );
}