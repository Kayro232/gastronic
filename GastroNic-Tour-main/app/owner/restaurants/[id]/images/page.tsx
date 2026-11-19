import Link from 'next/link';

import {
  notFound,
  redirect,
} from 'next/navigation';

import {
  ArrowLeft,
  ImageIcon,
  Info,
  Sparkles,
  Store,
} from 'lucide-react';

import { OwnerLayout } from '@/components/owner/owner-layout';
import { RestaurantImagesManager } from '@/components/owner/restaurant-images-manager';
import { createClient } from '@/lib/supabase/server';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

interface RestaurantImage {
  id: string;
  restaurant_id: string;
  kind:
    | 'cover'
    | 'gallery'
    | 'logo';

  storage_path: string | null;
  external_url: string | null;
  alt_text: string | null;
  sort_order: number;
  created_at: string;
}

export default async function OwnerRestaurantImagesPage({
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
      short_description,
      address,
      price_level,
      estimated_price_min,
      estimated_price_max,
      status,

      municipality:municipalities (
        name,

        department:departments (
          name
        )
      ),

      categories:restaurant_categories (
        category:categories (
          id,
          name
        )
      )
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

  const {
    data: imagesData,
    error: imagesError,
  } = await supabase
    .from(
      'restaurant_images'
    )
    .select(`
      id,
      restaurant_id,
      kind,
      storage_path,
      external_url,
      alt_text,
      sort_order,
      created_at
    `)
    .eq(
      'restaurant_id',
      restaurant.id
    )
    .order(
      'sort_order',
      {
        ascending: true,
      }
    );

  if (imagesError) {
    console.error(
      'Error cargando imágenes:',
      imagesError
    );
  }

  const images =
    (imagesData ??
      []) as RestaurantImage[];

  const municipality =
    Array.isArray(
      restaurant.municipality
    )
      ? restaurant
          .municipality[0]
      : restaurant.municipality;

  const department =
    municipality
      ? Array.isArray(
          municipality.department
        )
        ? municipality
            .department[0]
        : municipality.department
      : null;

  const categoryData =
    restaurant
      .categories?.[0]
      ?.category;

  const category =
    Array.isArray(
      categoryData
    )
      ? categoryData[0]
      : categoryData;

  const location = [
    municipality?.name,
    department?.name,
  ]
    .filter(Boolean)
    .join(', ');

  const priceRange =
    getPriceRange(
      restaurant.estimated_price_min,
      restaurant.estimated_price_max,
      restaurant.price_level
    );

  return (
    <OwnerLayout>
      <div className="min-h-screen bg-canvas">
        <div className="mx-auto max-w-[1350px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
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
                <ImageIcon className="h-3.5 w-3.5" />

                Presencia visual
              </div>

              <h1 className="text-3xl font-bold tracking-[-0.035em] text-ink sm:text-4xl">
                Fotografías
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                Diseña cómo se presenta{' '}
                <span className="font-semibold text-ink">
                  {restaurant.name}
                </span>{' '}
                ante los usuarios de GastroNic.
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

          <section className="mt-7 flex items-start gap-3 rounded-2xl border border-primary/10 bg-primary/[0.045] p-4">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-white">
              <Sparkles className="h-4 w-4 text-action" />
            </div>

            <div>
              <p className="text-sm font-bold text-ink">
                Tu imagen importa
              </p>

              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                La portada es una de las primeras cosas que verá un usuario.
                Utiliza una foto clara, atractiva y representativa de tu
                restaurante.
              </p>
            </div>
          </section>

          <div className="mt-6">
            <RestaurantImagesManager
              restaurantId={
                restaurant.id
              }
              restaurantName={
                restaurant.name
              }
              description={
                restaurant.short_description
              }
              location={
                location ||
                'Nicaragua'
              }
              cuisine={
                category?.name ||
                'Restaurante'
              }
              priceRange={
                priceRange
              }
              initialImages={
                images
              }
            />
          </div>

          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-border/70 bg-white p-4">
            <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-action" />

            <p className="text-xs leading-5 text-muted-foreground">
              Por ahora las imágenes se agregan mediante una URL pública.
              Después podemos activar carga directa desde celular o computadora
              mediante Supabase Storage.
            </p>
          </div>
        </div>
      </div>
    </OwnerLayout>
  );
}

function getPriceRange(
  min: number | null,
  max: number | null,
  priceLevel: number | null
) {
  if (
    min !== null &&
    max !== null
  ) {
    return `C$${Number(
      min
    ).toLocaleString(
      'es-NI'
    )} - C$${Number(
      max
    ).toLocaleString(
      'es-NI'
    )}`;
  }

  if (min !== null) {
    return `Desde C$${Number(
      min
    ).toLocaleString(
      'es-NI'
    )}`;
  }

  if (max !== null) {
    return `Hasta C$${Number(
      max
    ).toLocaleString(
      'es-NI'
    )}`;
  }

  return 'C$'.repeat(
    Math.min(
      Math.max(
        priceLevel ?? 1,
        1
      ),
      4
    )
  );
}

function isValidUuid(
  value: string
) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}