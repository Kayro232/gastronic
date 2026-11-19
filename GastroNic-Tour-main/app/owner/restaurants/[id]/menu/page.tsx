import Link from 'next/link';

import {
  notFound,
  redirect,
} from 'next/navigation';

import {
  ArrowLeft,
  Store,
  UtensilsCrossed,
} from 'lucide-react';

import { OwnerLayout } from '@/components/owner/owner-layout';
import { RestaurantMenuManager } from '@/components/owner/restaurant-menu-manager';
import { createClient } from '@/lib/supabase/server';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

interface MenuCategory {
  id: string;
  restaurant_id: string;
  name: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
}

interface MenuItem {
  id: string;
  restaurant_id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  storage_path: string | null;
  external_url: string | null;
  is_available: boolean;
  is_featured: boolean;
  dietary_labels: string[];
  allergens: string[];
  sort_order: number;
}

export default async function OwnerRestaurantMenuPage({
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
    categoriesResult,
    itemsResult,
  ] = await Promise.all([
    supabase
      .from('menu_categories')
      .select(`
        id,
        restaurant_id,
        name,
        description,
        sort_order,
        is_active
      `)
      .eq(
        'restaurant_id',
        restaurant.id
      )
      .order('sort_order', {
        ascending: true,
      }),

    supabase
      .from('menu_items')
      .select(`
        id,
        restaurant_id,
        category_id,
        name,
        description,
        price,
        currency,
        storage_path,
        external_url,
        is_available,
        is_featured,
        dietary_labels,
        allergens,
        sort_order
      `)
      .eq(
        'restaurant_id',
        restaurant.id
      )
      .order('sort_order', {
        ascending: true,
      }),
  ]);

  if (
    categoriesResult.error
  ) {
    console.error(
      'Error cargando categorías del menú:',
      categoriesResult.error
    );
  }

  if (
    itemsResult.error
  ) {
    console.error(
      'Error cargando platos:',
      itemsResult.error
    );
  }

  const categories =
    (categoriesResult.data ??
      []) as MenuCategory[];

  const items =
    (itemsResult.data ??
      []) as MenuItem[];

  return (
    <OwnerLayout>
      <div className="min-h-screen bg-canvas">
        <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
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
                <UtensilsCrossed className="h-3.5 w-3.5" />

                Gestión del restaurante
              </div>

              <h1 className="text-3xl font-bold tracking-[-0.035em] text-ink sm:text-4xl">
                Menú
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                Organiza categorías, platos, precios y disponibilidad de{' '}
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
            <RestaurantMenuManager
              restaurantId={
                restaurant.id
              }
              restaurantName={
                restaurant.name
              }
              initialCategories={
                categories
              }
              initialItems={
                items
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