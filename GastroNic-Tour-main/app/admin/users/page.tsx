import { redirect } from 'next/navigation';
import { AlertTriangle, ShieldCheck, Users } from 'lucide-react';

import { AdminLayout } from '@/components/admin/admin-layout';
import {
  UsersManagement,
  type AdminUserItem,
} from '@/components/admin/users-management';
import { createClient } from '@/lib/supabase/server';

interface ProfileRow {
  id: string;
  full_name: string;
  username: string | null;
  avatar_path: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
}

interface RoleRow {
  user_id: string;
  role: string;
  created_at: string;
}

interface RestaurantRow {
  id: string;
  name: string;
  created_by: string;
  status: string;
}

interface ReviewRow {
  id: string;
  user_id: string;
}

interface VisitRow {
  id: string;
  user_id: string;
}

interface FavoriteRow {
  user_id: string;
  restaurant_id: string;
}

export default async function AdminUsersPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login');

  const { data: adminRole, error: roleError } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .eq('role', 'admin')
    .maybeSingle();

  if (roleError) {
    console.error('Error verificando rol administrativo:', roleError);
  }

  if (!adminRole) redirect('/');

  const [
    profilesResult,
    rolesResult,
    restaurantsResult,
    reviewsResult,
    visitsResult,
    favoritesResult,
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, full_name, username, avatar_path, bio, created_at, updated_at')
      .order('created_at', { ascending: false }),
    supabase
      .from('user_roles')
      .select('user_id, role, created_at')
      .order('created_at', { ascending: true }),
    supabase.from('restaurants').select('id, name, created_by, status'),
    supabase.from('reviews').select('id, user_id'),
    supabase.from('visits').select('id, user_id'),
    supabase.from('favorites').select('user_id, restaurant_id'),
  ]);

  const loadErrors = [
    profilesResult.error,
    rolesResult.error,
    restaurantsResult.error,
    reviewsResult.error,
    visitsResult.error,
    favoritesResult.error,
  ].filter(Boolean);

  if (profilesResult.error) console.error('Error cargando perfiles:', profilesResult.error);
  if (rolesResult.error) console.error('Error cargando roles:', rolesResult.error);
  if (restaurantsResult.error) console.error('Error cargando restaurantes:', restaurantsResult.error);
  if (reviewsResult.error) console.error('Error cargando reseñas:', reviewsResult.error);
  if (visitsResult.error) console.error('Error cargando visitas:', visitsResult.error);
  if (favoritesResult.error) console.error('Error cargando favoritos:', favoritesResult.error);

  const profiles = (profilesResult.data ?? []) as ProfileRow[];
  const roles = (rolesResult.data ?? []) as RoleRow[];
  const restaurants = (restaurantsResult.data ?? []) as RestaurantRow[];
  const reviews = (reviewsResult.data ?? []) as ReviewRow[];
  const visits = (visitsResult.data ?? []) as VisitRow[];
  const favorites = (favoritesResult.data ?? []) as FavoriteRow[];

  const rolesByUser = new Map<string, string[]>();
  for (const role of roles) {
    const current = rolesByUser.get(role.user_id) ?? [];
    if (!current.includes(role.role)) current.push(role.role);
    rolesByUser.set(role.user_id, current);
  }

  const restaurantsByUser = new Map<string, RestaurantRow[]>();
  for (const restaurant of restaurants) {
    const current = restaurantsByUser.get(restaurant.created_by) ?? [];
    current.push(restaurant);
    restaurantsByUser.set(restaurant.created_by, current);
  }

  const reviewsCount = countByUser(reviews);
  const visitsCount = countByUser(visits);
  const favoritesCount = countByUser(favorites);

  const users: AdminUserItem[] = profiles.map((profile) => {
    const ownedRestaurants = restaurantsByUser.get(profile.id) ?? [];

    return {
      ...profile,
      roles: rolesByUser.get(profile.id) ?? [],
      restaurants_count: ownedRestaurants.length,
      approved_restaurants_count: ownedRestaurants.filter(
        (restaurant) => restaurant.status === 'approved'
      ).length,
      reviews_count: reviewsCount.get(profile.id) ?? 0,
      visits_count: visitsCount.get(profile.id) ?? 0,
      favorites_count: favoritesCount.get(profile.id) ?? 0,
    };
  });

  const adminCount = users.filter((item) => item.roles.includes('admin')).length;
  const ownerCount = users.filter((item) => item.roles.includes('restaurant_owner')).length;
  const userCount = users.filter((item) => item.roles.includes('user')).length;

  return (
    <AdminLayout>
      <div className="min-h-screen bg-surface-2">
        <div className="mx-auto max-w-[1480px] px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
          <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.08em] text-action">
                <ShieldCheck className="h-3.5 w-3.5" />
                Administración de cuentas
              </div>

              <h1 className="text-3xl font-bold tracking-[-0.045em] text-ink sm:text-[38px]">
                Usuarios
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Consulta perfiles, roles y actividad asociada a las cuentas registradas en GastroNic.
              </p>
            </div>

            <div className="flex w-fit items-center gap-3 rounded-xl border border-border/70 bg-white px-4 py-3 shadow-none">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/[0.08] text-action">
                <Users className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">
                  Directorio
                </p>
                <p className="mt-0.5 text-xs font-bold text-ink">
                  {users.length} {users.length === 1 ? 'perfil' : 'perfiles'}
                </p>
              </div>
            </div>
          </header>

          {loadErrors.length > 0 && (
            <div className="mt-6 flex items-start gap-3 rounded-2xl border border-warning/25 bg-warning-soft px-4 py-3.5 text-sm text-warning">
              <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <p>
                Parte de la información de usuarios no pudo cargarse. Los datos visibles pueden estar incompletos.
              </p>
            </div>
          )}

          <div className="mt-7">
            <UsersManagement
              users={users}
              adminCount={adminCount}
              ownerCount={ownerCount}
              userCount={userCount}
            />
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

function countByUser<T extends { user_id: string }>(rows: T[]) {
  const map = new Map<string, number>();

  for (const row of rows) {
    map.set(row.user_id, (map.get(row.user_id) ?? 0) + 1);
  }

  return map;
}
