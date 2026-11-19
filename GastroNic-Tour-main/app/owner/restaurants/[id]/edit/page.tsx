import Link from 'next/link';

import {
  notFound,
  redirect,
} from 'next/navigation';

import {
  ArrowLeft,
  PencilLine,
} from 'lucide-react';

import {
  EditRestaurantForm,
  type EditableRestaurant,
  type MunicipalityOption,
} from '@/components/owner/edit-restaurant-form';

import { OwnerLayout } from '@/components/owner/owner-layout';
import { createClient } from '@/lib/supabase/server';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function OwnerRestaurantEditPage({
  params,
}: PageProps) {
  const { id } = await params;

  if (!isValidUuid(id)) {
    notFound();
  }

  const supabase = await createClient();

  /* ======================================================== */
  /* USER                                                     */
  /* ======================================================== */

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/owner/login');
  }

  /* ======================================================== */
  /* RESTAURANT                                               */
  /* ======================================================== */

  const {
    data: restaurantData,
    error: restaurantError,
  } = await supabase
    .from('restaurants')
    .select(`
      id,
      name,
      short_description,
      description,
      municipality_id,
      address,
      phone,
      whatsapp,
      email,
      website_url,
      facebook_url,
      instagram_url,
      price_level,
      status,
      accepts_reservations,
      reservation_min_party_size,
      reservation_max_party_size,
      reservation_min_notice_minutes,
      reservation_max_advance_days,
      reservation_duration_minutes,
      reservation_instructions
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

  if (!restaurantData) {
    notFound();
  }

  const restaurant =
    restaurantData as EditableRestaurant;

  /* ======================================================== */
  /* MUNICIPALITIES                                           */
  /* ======================================================== */

  const {
    data: municipalitiesData,
    error: municipalitiesError,
  } = await supabase
    .from('municipalities')
    .select(`
      id,
      name,
      department:departments (
        id,
        name
      )
    `)
    .order('name', {
      ascending: true,
    });

  if (municipalitiesError) {
    console.error(
      'Error cargando municipios:',
      municipalitiesError
    );
  }

  const municipalities =
    (municipalitiesData ?? []) as MunicipalityOption[];

  /* ======================================================== */
  /* RENDER                                                   */
  /* ======================================================== */

  return (
    <OwnerLayout>
      <div className="min-h-screen bg-canvas">
        <div className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
          <Link
            href={`/owner/restaurants/${restaurant.id}`}
            className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground transition hover:text-action"
          >
            <ArrowLeft className="h-4 w-4" />

            Volver a {restaurant.name}
          </Link>

          <header className="mt-6">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.08em] text-action">
              <PencilLine className="h-3.5 w-3.5" />

              Configuración
            </div>

            <h1 className="mt-3 text-3xl font-bold tracking-[-0.04em] text-ink sm:text-4xl">
              Editar restaurante
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              Actualiza la información pública y configura cómo funcionarán
              las reservaciones de tu establecimiento.
            </p>
          </header>

          <div className="mt-8">
            <EditRestaurantForm
              restaurant={restaurant}
              municipalities={municipalities}
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