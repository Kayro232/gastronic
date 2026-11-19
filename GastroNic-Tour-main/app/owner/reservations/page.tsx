import { redirect } from 'next/navigation';
import { CalendarDays } from 'lucide-react';

import { OwnerLayout } from '@/components/owner/owner-layout';
import { DataLoadError } from '@/components/common/data-load-error';
import {
  OwnerReservationsManager,
  type OwnerReservation,
  type OwnerReservationRestaurant,
} from '@/components/owner/owner-reservations-manager';
import { createClient } from '@/lib/supabase/server';

export default async function OwnerReservationsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/owner/login');
  }

  const { data: restaurantsData, error: restaurantsError } = await supabase
    .from('restaurants')
    .select(`
      id,
      name,
      status,
      accepts_reservations
    `)
    .eq('created_by', user.id)
    .order('name', { ascending: true });

  if (restaurantsError) {
    console.error('Error cargando restaurantes:', restaurantsError);

    return (
      <OwnerLayout>
        <div className="min-h-screen bg-canvas">
          <div className="mx-auto max-w-[1500px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
            <DataLoadError
              title="No pudimos preparar tus reservaciones"
              description="Ocurrió un problema al consultar los restaurantes que administras. Intenta cargar la información nuevamente."
            />
          </div>
        </div>
      </OwnerLayout>
    );
  }

  const restaurants = (restaurantsData ?? []) as OwnerReservationRestaurant[];
  const restaurantIds = restaurants.map((restaurant) => restaurant.id);

  let reservations: OwnerReservation[] = [];

  if (restaurantIds.length > 0) {
    const { data, error } = await supabase
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
      .in('restaurant_id', restaurantIds)
      .order('reserved_for', { ascending: true });

    if (error) {
      console.error('Error cargando reservaciones:', error);

      return (
        <OwnerLayout>
          <div className="min-h-screen bg-canvas">
            <div className="mx-auto max-w-[1500px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
              <DataLoadError
                title="No pudimos cargar las reservaciones"
                description="Los restaurantes se cargaron correctamente, pero ocurrió un problema al consultar sus reservaciones. Intenta nuevamente."
              />
            </div>
          </div>
        </OwnerLayout>
      );
    }

    reservations = (data ?? []) as OwnerReservation[];
  }

  return (
    <OwnerLayout>
      <div className="min-h-screen bg-canvas">
        <div className="mx-auto max-w-[1500px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
          <header className="mb-7 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.08em] text-action">
                <CalendarDays className="h-3.5 w-3.5" />
                Operación
              </div>
              <h1 className="text-3xl font-bold tracking-[-0.04em] text-ink sm:text-4xl">
                Reservaciones
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Organiza próximas visitas, confirma solicitudes y mantén la atención de tus clientes en orden.
              </p>
            </div>

            <div className="rounded-2xl border border-[#E5ECE9] bg-white px-4 py-3 shadow-none">
              <p className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">
                Restaurantes con agenda
              </p>
              <p className="mt-1 text-sm font-bold text-ink">
                {restaurants.filter((restaurant) => restaurant.accepts_reservations).length} de {restaurants.length}
              </p>
            </div>
          </header>

          <OwnerReservationsManager
            restaurants={restaurants}
            initialReservations={reservations}
          />
        </div>
      </div>
    </OwnerLayout>
  );
}
