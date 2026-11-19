

import {
  notFound,
  redirect,
} from 'next/navigation';

import {
  ArrowLeft,
  Clock3,
  Sparkles,
  Store,
} from 'lucide-react';

import { OwnerLayout } from '@/components/owner/owner-layout';
import { RestaurantHoursForm } from '@/components/owner/restaurant-hours-form';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

interface RestaurantHour {
  id: string;
  restaurant_id: string;
  day_of_week: number;
  opens_at: string | null;
  closes_at: string | null;
  is_closed: boolean;
}

interface RestaurantSpecialHour {
  id: string;
  restaurant_id: string;
  special_date: string;
  opens_at: string | null;
  closes_at: string | null;
  is_closed: boolean;
  note: string | null;
}

export default async function OwnerRestaurantHoursPage({
  params,
}: PageProps) {
  const { id } =
    await params;

  if (
    !isValidUuid(id)
  ) {
    notFound();
  }

  const supabase =
    await createClient();

  const {
    data: {
      user,
    },
  } =
    await supabase.auth.getUser();

  if (!user) {
    redirect(
      '/owner/login'
    );
  }

  const {
    data:
      restaurant,
    error:
      restaurantError,
  } =
    await supabase
      .from(
        'restaurants'
      )
      .select(`
        id,
        name,
        status
      `)
      .eq(
        'id',
        id
      )
      .eq(
        'created_by',
        user.id
      )
      .maybeSingle();

  if (
    restaurantError
  ) {
    console.error(
      'Error cargando restaurante:',
      restaurantError
    );
  }

  if (
    !restaurant
  ) {
    notFound();
  }

  const [
    hoursResult,
    specialHoursResult,
  ] =
    await Promise.all([
      supabase
        .from(
          'restaurant_hours'
        )
        .select(`
          id,
          restaurant_id,
          day_of_week,
          opens_at,
          closes_at,
          is_closed
        `)
        .eq(
          'restaurant_id',
          restaurant.id
        )
        .order(
          'day_of_week',
          {
            ascending:
              true,
          }
        ),

      supabase
        .from(
          'restaurant_special_hours'
        )
        .select(`
          id,
          restaurant_id,
          special_date,
          opens_at,
          closes_at,
          is_closed,
          note
        `)
        .eq(
          'restaurant_id',
          restaurant.id
        )
        .order(
          'special_date',
          {
            ascending:
              true,
          }
        ),
    ]);

  if (
    hoursResult.error
  ) {
    console.error(
      'Error cargando horarios:',
      hoursResult.error
    );
  }

  if (
    specialHoursResult.error
  ) {
    console.error(
      'Error cargando horarios especiales:',
      specialHoursResult.error
    );
  }

  const hours =
    (
      hoursResult.data ??
      []
    ) as RestaurantHour[];

  const specialHours =
    (
      specialHoursResult.data ??
      []
    ) as RestaurantSpecialHour[];

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
                <Clock3 className="h-3.5 w-3.5" />
                Operación del restaurante
              </div>

              <h1 className="text-3xl font-bold tracking-[-0.035em] text-ink sm:text-4xl">
                Horarios
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                Define cuándo atiende{' '}
                <span className="font-semibold text-ink">
                  {restaurant.name}
                </span>{' '}
                y mantén actualizado el estado “Abierto ahora”.
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
                Horario semanal y excepciones
              </p>

              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Configura la semana habitual y agrega fechas especiales para feriados,
                cierres o jornadas con un horario distinto.
              </p>
            </div>
          </section>

          <div className="mt-6">
            <RestaurantHoursForm
              restaurantId={
                restaurant.id
              }
              restaurantName={
                restaurant.name
              }
              initialHours={
                hours
              }
              initialSpecialHours={
                specialHours
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
