import Link from 'next/link';

import {
  notFound,
  redirect,
} from 'next/navigation';

import {
  ArrowLeft,
  Sparkles,
  Store,
  Wifi,
} from 'lucide-react';

import { OwnerLayout } from '@/components/owner/owner-layout';
import { RestaurantAmenitiesManager } from '@/components/owner/restaurant-amenities-manager';
import { createClient } from '@/lib/supabase/server';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

interface Amenity {
  id: number;
  name: string;
  slug: string;
  icon: string | null;
  is_active: boolean;
}

export default async function OwnerRestaurantAmenitiesPage({
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
      status
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

  const [
    amenitiesResult,
    selectedResult,
  ] = await Promise.all([
    supabase
      .from('amenities')
      .select(`
        id,
        name,
        slug,
        icon,
        is_active
      `)
      .eq('is_active', true)
      .order('id', {
        ascending: true,
      }),

    supabase
      .from(
        'restaurant_amenities'
      )
      .select(`
        amenity_id
      `)
      .eq(
        'restaurant_id',
        restaurant.id
      ),
  ]);

  if (
    amenitiesResult.error
  ) {
    console.error(
      'Error cargando servicios:',
      amenitiesResult.error
    );
  }

  if (
    selectedResult.error
  ) {
    console.error(
      'Error cargando servicios del restaurante:',
      selectedResult.error
    );
  }

  const amenities =
    (amenitiesResult.data ??
      []) as Amenity[];

  const selectedAmenityIds =
    (
      selectedResult.data ??
      []
    ).map(
      (item) =>
        item.amenity_id
    );

  return (
    <OwnerLayout>
      <div className="min-h-screen bg-canvas">
        <div className="mx-auto max-w-[1250px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
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
                <Wifi className="h-3.5 w-3.5" />

                Experiencia del restaurante
              </div>

              <h1 className="text-3xl font-bold tracking-[-0.035em] text-ink sm:text-4xl">
                Servicios y amenidades
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                Indica qué comodidades ofrece{' '}
                <span className="font-semibold text-ink">
                  {restaurant.name}
                </span>{' '}
                para que tus visitantes sepan qué esperar.
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
                Mejora la información de tu perfil
              </p>

              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Estos servicios pueden mostrarse en la ficha pública del
                restaurante y ayudar a los usuarios a decidir si el lugar se
                adapta a lo que buscan.
              </p>
            </div>
          </section>

          <div className="mt-6">
            <RestaurantAmenitiesManager
              restaurantId={
                restaurant.id
              }
              restaurantName={
                restaurant.name
              }
              amenities={
                amenities
              }
              initialSelectedIds={
                selectedAmenityIds
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