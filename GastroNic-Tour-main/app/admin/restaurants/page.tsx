import { redirect } from 'next/navigation';

import {
  ShieldCheck,
} from 'lucide-react';

import { AdminLayout } from '@/components/admin/admin-layout';

import {
  AdminRestaurantModerationQueue,
  type ModerationRestaurant,
} from '@/components/admin/admin-restaurant-moderation-queue';

import { createClient } from '@/lib/supabase/server';

/* ========================================================== */
/* TYPES                                                      */
/* ========================================================== */

interface RestaurantRow {
  id: string;
  name: string;
  short_description: string | null;
  status: string;
  rejection_reason: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface ProfileRow {
  id: string;
  full_name: string;
  username: string | null;
}

/* ========================================================== */
/* PAGE                                                       */
/* ========================================================== */

export default async function AdminRestaurantsPage() {
  const supabase = await createClient();

  /* ======================================================== */
  /* SESSION                                                  */
  /* ======================================================== */

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  /* ======================================================== */
  /* ADMIN                                                    */
  /* ======================================================== */

  const {
    data: adminRole,
    error: adminRoleError,
  } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .eq('role', 'admin')
    .maybeSingle();

  if (adminRoleError) {
    console.error(
      'Error comprobando rol admin:',
      adminRoleError
    );
  }

  if (!adminRole) {
    redirect('/');
  }

  /* ======================================================== */
  /* MODERATION DATA                                         */
  /* ======================================================== */

  const {
    data: restaurantData,
    error: restaurantsError,
  } = await supabase
    .from('restaurants')
    .select(`
      id,
      name,
      short_description,
      status,
      rejection_reason,
      created_by,
      created_at,
      updated_at
    `)
    .in('status', [
      'pending',
      'rejected',
    ])
    .order('created_at', {
      ascending: false,
    });

  if (restaurantsError) {
    console.error(
      'Error cargando solicitudes:',
      restaurantsError
    );
  }

  const restaurants =
    (restaurantData ?? []) as RestaurantRow[];

  /* ======================================================== */
  /* OWNERS                                                   */
  /* ======================================================== */

  const ownerIds = [
    ...new Set(
      restaurants.map(
        (restaurant) => restaurant.created_by
      )
    ),
  ];

  let owners: ProfileRow[] = [];
  let ownersErrorMessage: string | null = null;

  if (ownerIds.length > 0) {
    const {
      data,
      error,
    } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        username
      `)
      .in('id', ownerIds);

    if (error) {
      console.error(
        'Error cargando propietarios:',
        error
      );

      ownersErrorMessage =
        'Las solicitudes se cargaron, pero algunos datos de propietarios no pudieron recuperarse.';
    }

    owners =
      (data ?? []) as ProfileRow[];
  }

  const ownerMap = new Map(
    owners.map(
      (owner) => [
        owner.id,
        owner,
      ]
    )
  );

  /* ======================================================== */
  /* NORMALIZE                                                */
  /* ======================================================== */

  const moderationRestaurants:
    ModerationRestaurant[] =
      restaurants.map(
        (restaurant) => {
          const owner =
            ownerMap.get(
              restaurant.created_by
            );

          return {
            id: restaurant.id,
            name: restaurant.name,
            short_description:
              restaurant.short_description,
            status: restaurant.status,
            rejection_reason:
              restaurant.rejection_reason,
            created_by:
              restaurant.created_by,
            created_at:
              restaurant.created_at,
            updated_at:
              restaurant.updated_at,
            owner_name:
              owner?.full_name?.trim() ||
              owner?.username ||
              'Propietario',
            owner_username:
              owner?.username ?? null,
          };
        }
      );

  const pendingCount =
    moderationRestaurants.filter(
      (restaurant) =>
        restaurant.status === 'pending'
    ).length;

  const rejectedCount =
    moderationRestaurants.filter(
      (restaurant) =>
        restaurant.status === 'rejected'
    ).length;

  const loadErrorMessage =
    restaurantsError
      ? 'No pudimos cargar la cola de moderación. Recarga la página para intentarlo nuevamente.'
      : ownersErrorMessage;

  /* ======================================================== */
  /* RENDER                                                   */
  /* ======================================================== */

  return (
    <AdminLayout>
      <div className="min-h-screen bg-surface-2">
        <div className="mx-auto max-w-[1480px] px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
          <header>
            <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.08em] text-action">
              <ShieldCheck className="h-3.5 w-3.5" />
              Moderación
            </div>

            <h1 className="text-3xl font-bold tracking-[-0.045em] text-ink sm:text-[38px]">
              Solicitudes
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Revisa establecimientos enviados por propietarios, prioriza los más antiguos y da seguimiento a las correcciones.
            </p>
          </header>

          <div className="mt-7">
            <AdminRestaurantModerationQueue
              initialRestaurants={
                moderationRestaurants
              }
              initialPendingCount={
                pendingCount
              }
              initialRejectedCount={
                rejectedCount
              }
              initialErrorMessage={
                loadErrorMessage
              }
            />
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
