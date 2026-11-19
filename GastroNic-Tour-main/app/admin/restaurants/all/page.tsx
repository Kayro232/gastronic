import { redirect } from 'next/navigation';

import {
  ShieldCheck,
  Store,
} from 'lucide-react';

import { AdminLayout } from '@/components/admin/admin-layout';
import {
  AdminRestaurantsInventory,
  type InventoryRestaurant,
} from '@/components/admin/admin-restaurants-inventory';
import { createClient } from '@/lib/supabase/server';

interface RestaurantRow {
  id: string;
  name: string;
  short_description: string | null;
  status: string;
  is_verified: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  average_rating: number | null;
  reviews_count: number | null;
  visits_count: number | null;
  favorites_count: number | null;
  created_by: string;
}

interface ProfileRow {
  id: string;
  full_name: string;
  username: string | null;
}

export default async function AdminAllRestaurantsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  const { data: adminRole, error: roleError } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .eq('role', 'admin')
    .maybeSingle();

  if (roleError) {
    console.error('Error verificando rol admin:', roleError);
  }

  if (!adminRole) {
    redirect('/');
  }

  const loadIssues: string[] = [];

  const { data: restaurantData, error: restaurantsError } = await supabase
    .from('restaurants')
    .select(`
      id,
      name,
      short_description,
      status,
      is_verified,
      is_featured,
      created_at,
      updated_at,
      average_rating,
      reviews_count,
      visits_count,
      favorites_count,
      created_by
    `)
    .order('created_at', { ascending: false });

  if (restaurantsError) {
    console.error('Error cargando restaurantes:', restaurantsError);
    loadIssues.push('No se pudo cargar el inventario completo de restaurantes.');
  }

  const restaurants = (restaurantData ?? []) as RestaurantRow[];

  const ownerIds = [
    ...new Set(restaurants.map((restaurant) => restaurant.created_by)),
  ];

  let owners: ProfileRow[] = [];

  if (ownerIds.length > 0) {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, username')
      .in('id', ownerIds);

    if (error) {
      console.error('Error cargando propietarios:', error);
      loadIssues.push('Algunos datos de propietarios no pudieron cargarse.');
    }

    owners = (data ?? []) as ProfileRow[];
  }

  const ownerMap = new Map(owners.map((owner) => [owner.id, owner]));

  const inventoryRestaurants: InventoryRestaurant[] = restaurants.map(
    (restaurant) => {
      const owner = ownerMap.get(restaurant.created_by);

      return {
        id: restaurant.id,
        name: restaurant.name,
        short_description: restaurant.short_description,
        status: restaurant.status,
        is_verified: restaurant.is_verified,
        is_featured: restaurant.is_featured,
        created_at: restaurant.created_at,
        updated_at: restaurant.updated_at,
        average_rating: Number(restaurant.average_rating ?? 0),
        reviews_count: restaurant.reviews_count ?? 0,
        visits_count: restaurant.visits_count ?? 0,
        favorites_count: restaurant.favorites_count ?? 0,
        created_by: restaurant.created_by,
        owner_name:
          owner?.full_name?.trim() || owner?.username || 'Propietario',
        owner_username: owner?.username ?? null,
      };
    }
  );

  const approvedCount = inventoryRestaurants.filter(
    (restaurant) => restaurant.status === 'approved'
  ).length;

  const verifiedCount = inventoryRestaurants.filter(
    (restaurant) => restaurant.is_verified
  ).length;

  const featuredCount = inventoryRestaurants.filter(
    (restaurant) => restaurant.is_featured
  ).length;

  return (
    <AdminLayout>
      <div className="min-h-screen bg-surface-2">
        <div className="mx-auto max-w-[1480px] px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
          <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.08em] text-action">
                <ShieldCheck className="h-3.5 w-3.5" />
                Catálogo administrativo
              </div>

              <h1 className="text-3xl font-bold tracking-[-0.045em] text-ink sm:text-[38px]">
                Todos los restaurantes
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Supervisa estado, rendimiento y visibilidad de los establecimientos registrados en GastroNic.
              </p>
            </div>

            <div className="flex w-fit items-center gap-3 rounded-xl border border-border/70 bg-white px-4 py-3 shadow-none">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/[0.08] text-action">
                <Store className="h-4 w-4" />
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">
                  Inventario
                </p>
                <p className="mt-0.5 text-xs font-bold text-ink">
                  {inventoryRestaurants.length}{' '}
                  {inventoryRestaurants.length === 1
                    ? 'establecimiento'
                    : 'establecimientos'}
                </p>
              </div>
            </div>
          </header>

          <div className="mt-7">
            <AdminRestaurantsInventory
              initialRestaurants={inventoryRestaurants}
              approvedCount={approvedCount}
              verifiedCount={verifiedCount}
              featuredCount={featuredCount}
              dataWarning={loadIssues.length > 0 ? loadIssues.join(' ') : null}
            />
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
