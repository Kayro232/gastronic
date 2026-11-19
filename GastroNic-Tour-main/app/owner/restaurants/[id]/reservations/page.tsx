import Link from 'next/link';

import {
  notFound,
  redirect,
} from 'next/navigation';

import {
  ArrowLeft,
  CalendarDays,
  Store,
} from 'lucide-react';

import { OwnerLayout } from '@/components/owner/owner-layout';
import { RestaurantReservationsManager } from '@/components/owner/restaurant-reservations-manager';
import { createClient } from '@/lib/supabase/server';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

interface Reservation {
  id: string;
  user_id: string;
  restaurant_id: string;
  guest_name: string;
  guest_email: string | null;
  guest_phone: string;
  reserved_for: string;
  party_size: number;
  special_requests: string | null;
  status:
    | 'pending'
    | 'confirmed'
    | 'cancelled'
    | 'completed'
    | 'no_show';
  restaurant_notes: string | null;
  cancellation_reason: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
}

export default async function OwnerRestaurantReservationsPage({
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
      status,
      accepts_reservations
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

  const {
    data: reservationsData,
    error: reservationsError,
  } = await supabase
    .from('reservations')
    .select(`
      id,
      user_id,
      restaurant_id,
      guest_name,
      guest_email,
      guest_phone,
      reserved_for,
      party_size,
      special_requests,
      status,
      restaurant_notes,
      cancellation_reason,
      cancelled_at,
      created_at,
      updated_at
    `)
    .eq(
      'restaurant_id',
      restaurant.id
    )
    .order(
      'reserved_for',
      {
        ascending: true,
      }
    );

  if (reservationsError) {
    console.error(
      'Error cargando reservaciones:',
      reservationsError
    );
  }

  const reservations =
    (reservationsData ??
      []) as Reservation[];

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
                <CalendarDays className="h-3.5 w-3.5" />

                Operación del restaurante
              </div>

              <h1 className="text-3xl font-bold tracking-[-0.035em] text-ink sm:text-4xl">
                Reservaciones
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                Gestiona las solicitudes y próximas visitas de{' '}
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
            <RestaurantReservationsManager
              restaurantName={
                restaurant.name
              }
              acceptsReservations={
                restaurant.accepts_reservations
              }
              initialReservations={
                reservations
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