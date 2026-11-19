import Link from 'next/link';

import {
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  Clock3,
  MapPin,
  Search,
  Users,
  XCircle,
  AlertCircle,
  UtensilsCrossed,
} from 'lucide-react';

import {
  redirect,
} from 'next/navigation';

import { MainLayout } from '@/components/layout/main-layout';
import { DataLoadError } from '@/components/common/data-load-error';
import { Button } from '@/components/ui/button';
import { CancelReservationButton } from '@/components/reservations/cancel-reservation-button';

import { createClient } from '@/lib/supabase/server';

/* ========================================================== */
/* TYPES                                                      */
/* ========================================================== */

interface RestaurantImage {
  kind: string;

  external_url:
    | string
    | null;

  storage_path:
    | string
    | null;

  sort_order: number;
}

interface Department {
  name: string;
}

interface Municipality {
  name: string;

  department:
    | Department
    | Department[]
    | null;
}

interface ReservationRestaurant {
  id: string;
  name: string;

  address:
    | string
    | null;

  municipality:
    | Municipality
    | Municipality[]
    | null;

  images:
    RestaurantImage[];
}

interface Reservation {
  id: string;

  guest_name: string;

  guest_email:
    | string
    | null;

  guest_phone: string;

  reserved_for: string;

  party_size: number;

  special_requests:
    | string
    | null;

  status: string;

  restaurant_notes:
    | string
    | null;

  cancellation_reason:
    | string
    | null;

  cancelled_at:
    | string
    | null;

  created_at: string;

  restaurant:
    | ReservationRestaurant
    | ReservationRestaurant[]
    | null;
}

/* ========================================================== */
/* HELPERS                                                    */
/* ========================================================== */

function getRestaurant(
  value:
    | ReservationRestaurant
    | ReservationRestaurant[]
    | null
) {
  if (!value) {
    return null;
  }

  return Array.isArray(
    value
  )
    ? value[0] ??
        null
    : value;
}

function getMunicipality(
  value:
    | Municipality
    | Municipality[]
    | null
) {
  if (!value) {
    return null;
  }

  return Array.isArray(
    value
  )
    ? value[0] ??
        null
    : value;
}

function getDepartment(
  value:
    | Department
    | Department[]
    | null
) {
  if (!value) {
    return null;
  }

  return Array.isArray(
    value
  )
    ? value[0] ??
        null
    : value;
}

function getImageUrl(
  images:
    RestaurantImage[]
) {
  const orderedImages =
    [...images].sort(
      (
        a,
        b
      ) => {
        if (
          a.kind ===
            'cover' &&
          b.kind !==
            'cover'
        ) {
          return -1;
        }

        if (
          b.kind ===
            'cover' &&
          a.kind !==
            'cover'
        ) {
          return 1;
        }

        return (
          a.sort_order -
          b.sort_order
        );
      }
    );

  const image =
    orderedImages[0];

  if (!image) {
    return '/placeholder.svg';
  }

  if (
    image.external_url
  ) {
    return image.external_url;
  }

  if (
    image.storage_path
  ) {
    const supabaseUrl =
      process.env
        .NEXT_PUBLIC_SUPABASE_URL;

    if (
      supabaseUrl
    ) {
      return `${supabaseUrl}/storage/v1/object/public/restaurant-images/${image.storage_path}`;
    }
  }

  return '/placeholder.svg';
}

function formatReservationDate(
  date: string
) {
  return new Intl.DateTimeFormat(
    'es-NI',
    {
      dateStyle:
        'full',

      timeStyle:
        'short',

      timeZone:
        'America/Managua',
    }
  ).format(
    new Date(
      date
    )
  );
}

/* ========================================================== */
/* STATUS                                                     */
/* ========================================================== */

function getStatusData(
  status: string
) {
  switch (
    status
  ) {
    case 'pending':
      return {
        label:
          'Pendiente',

        description:
          'El restaurante todavía debe revisar tu solicitud.',

        className:
          'border-warning/25 bg-warning-soft text-warning',

        dotClassName:
          'bg-amber-500',

        icon:
          Clock3,
      };

    case 'confirmed':
      return {
        label:
          'Confirmada',

        description:
          'Tu reservación fue aceptada por el restaurante.',

        className:
          'border-success/25 bg-success-soft text-success',

        dotClassName:
          'bg-green-500',

        icon:
          CheckCircle2,
      };

    case 'completed':
      return {
        label:
          'Completada',

        description:
          'Esta visita fue completada correctamente.',

        className:
          'border-primary/20 bg-primary/[0.07] text-action',

        dotClassName:
          'bg-action',

        icon:
          CalendarCheck,
      };

    case 'cancelled':
      return {
        label:
          'Cancelada',

        description:
          'Esta reservación fue cancelada.',

        className:
          'border-danger/25 bg-danger-soft text-danger',

        dotClassName:
          'bg-red-500',

        icon:
          XCircle,
      };

    case 'no_show':
      return {
        label:
          'No asistió',

        description:
          'La visita fue marcada como no realizada.',

        className:
          'border-slate-200 bg-slate-50 text-slate-600',

        dotClassName:
          'bg-slate-400',

        icon:
          AlertCircle,
      };

    default:
      return {
        label:
          status,

        description:
          'Estado de la reservación.',

        className:
          'border-border bg-canvas text-muted-foreground',

        dotClassName:
          'bg-muted-foreground',

        icon:
          Clock3,
      };
  }
}

/* ========================================================== */
/* PAGE                                                       */
/* ========================================================== */

export default async function ReservationsPage() {
  const supabase =
    await createClient();

  /* ======================================================== */
  /* USER                                                     */
  /* ======================================================== */

  const {
    data: {
      user,
    },
  } =
    await supabase.auth.getUser();

  if (!user) {
    redirect(
      '/auth/login?next=/reservations'
    );
  }

  /* ======================================================== */
  /* RESERVATIONS                                             */
  /* ======================================================== */

  const {
    data,
    error,
  } =
    await supabase
      .from(
        'reservations'
      )
      .select(`
        id,
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

        restaurant:restaurants (
          id,
          name,
          address,

          municipality:municipalities (
            name,

            department:departments (
              name
            )
          ),

          images:restaurant_images (
            kind,
            external_url,
            storage_path,
            sort_order
          )
        )
      `)
      .eq(
        'user_id',
        user.id
      )
      .order(
        'reserved_for',
        {
          ascending:
            false,
        }
      );

  if (
    error
  ) {
    console.error(
      'Error cargando reservaciones:',
      error
    );

    return (
      <MainLayout>
        <div className="min-h-screen bg-canvas pb-24 lg:pb-0">
          <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
            <DataLoadError
              title="No pudimos cargar tus reservaciones"
              description="Ocurrió un problema al consultar tus reservaciones. No mostraremos una lista vacía porque eso podría hacerte pensar que tus reservas desaparecieron."
            />
          </div>
        </div>
      </MainLayout>
    );
  }

  const reservations =
    (
      data ??
      []
    ) as unknown as Reservation[];

  /* ======================================================== */
  /* GROUPS                                                   */
  /* ======================================================== */

  const activeReservations =
    reservations.filter(
      (
        reservation
      ) =>
        reservation.status ===
          'pending' ||
        reservation.status ===
          'confirmed'
    );

  const pastReservations =
    reservations.filter(
      (
        reservation
      ) =>
        reservation.status !==
          'pending' &&
        reservation.status !==
          'confirmed'
    );

  /* ======================================================== */
  /* RENDER                                                   */
  /* ======================================================== */

  return (
    <MainLayout>
      <div className="min-h-screen bg-canvas pb-24 lg:pb-0">
        {/* ==================================================== */}
        {/* HEADER                                               */}
        {/* ==================================================== */}

        <section className="border-b border-border/60 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 md:py-16 lg:px-8">
            <div className="max-w-3xl">
              <div className="mb-3 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.08em] text-action">
                <CalendarCheck className="h-4 w-4" />

                Tus planes
              </div>

              <h1 className="text-[2rem] font-bold tracking-[-0.035em] text-ink sm:text-4xl md:text-5xl">
                Mis reservaciones
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
                Consulta las solicitudes que realizaste y revisa su estado
                antes de tu próxima visita.
              </p>
            </div>
          </div>
        </section>

        {/* ==================================================== */}
        {/* CONTENT                                              */}
        {/* ==================================================== */}

        <section className="mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-10 lg:px-8 lg:py-14">
          {reservations.length ===
          0 ? (
            /* ================================================= */
            /* EMPTY                                             */
            /* ================================================= */

            <div className="flex min-h-[480px] items-center justify-center">
              <div className="max-w-md text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-card bg-primary/[0.08] text-action">
                  <CalendarDays className="h-7 w-7" />
                </div>

                <p className="mt-6 text-xs font-bold uppercase tracking-[0.08em] text-action">
                  Todavía no hay planes
                </p>

                <h2 className="mt-1.5 text-xl font-bold tracking-[-0.03em] text-ink sm:mt-2 sm:text-2xl">
                  No tienes reservaciones
                </h2>

                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  Explora restaurantes que acepten reservaciones y organiza tu
                  próxima salida directamente desde GastroNic.
                </p>

                <Button
                  asChild
                  className="mt-6 h-11 rounded-xl px-6 font-bold"
                >
                  <Link href="/home">
                    <Search className="mr-2 h-4 w-4" />

                    Explorar restaurantes
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-10 sm:space-y-14">
              {/* =============================================== */}
              {/* ACTIVE                                          */}
              {/* =============================================== */}

              {activeReservations.length >
                0 && (
                <ReservationGroup
                  eyebrow="Próximas visitas"
                  title="Reservaciones activas"
                  description="Solicitudes pendientes y visitas que ya fueron confirmadas."
                  reservations={
                    activeReservations
                  }
                />
              )}

              {/* =============================================== */}
              {/* HISTORY                                         */}
              {/* =============================================== */}

              {pastReservations.length >
                0 && (
                <ReservationGroup
                  eyebrow="Historial"
                  title="Reservaciones anteriores"
                  description="Revisa las visitas completadas, canceladas o no realizadas."
                  reservations={
                    pastReservations
                  }
                />
              )}
            </div>
          )}
        </section>
      </div>
    </MainLayout>
  );
}

/* ========================================================== */
/* GROUP                                                      */
/* ========================================================== */

function ReservationGroup({
  eyebrow,
  title,
  description,
  reservations,
}: {
  eyebrow:
    string;

  title:
    string;

  description:
    string;

  reservations:
    Reservation[];
}) {
  return (
    <section>
      <div className="mb-5 sm:mb-7">
        <p className="text-xs font-bold uppercase tracking-[0.08em] text-action">
          {eyebrow}
        </p>

        <h2 className="mt-1.5 text-xl font-bold tracking-[-0.03em] text-ink sm:mt-2 sm:text-2xl">
          {title}
        </h2>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      </div>

      <div className="space-y-4 sm:space-y-5">
        {reservations.map(
          (
            reservation
          ) => (
            <ReservationCard
              key={
                reservation.id
              }
              reservation={
                reservation
              }
            />
          )
        )}
      </div>
    </section>
  );
}

/* ========================================================== */
/* CARD                                                       */
/* ========================================================== */

function ReservationCard({
  reservation,
}: {
  reservation:
    Reservation;
}) {
  const restaurant =
    getRestaurant(
      reservation.restaurant
    );

  const municipality =
    getMunicipality(
      restaurant?.municipality ??
        null
    );

  const department =
    getDepartment(
      municipality?.department ??
        null
    );

  const imageUrl =
    restaurant
      ? getImageUrl(
          restaurant.images ??
            []
        )
      : '/placeholder.svg';

  const statusData =
    getStatusData(
      reservation.status
    );

  const StatusIcon =
    statusData.icon;

  const location =
    [
      restaurant?.address,
      municipality?.name,
      department?.name,
    ]
      .filter(
        Boolean
      )
      .join(
        ', '
      );

  return (
    <article className="overflow-hidden rounded-card border border-border/70 bg-white shadow-none">
      <div className="grid md:grid-cols-[230px_minmax(0,1fr)]">
        {/* ==================================================== */}
        {/* IMAGE                                                */}
        {/* ==================================================== */}

        <div className="relative h-[150px] overflow-hidden bg-muted sm:h-[180px] md:h-auto md:min-h-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={
              imageUrl
            }
            alt={
              restaurant?.name ??
              'Restaurante'
            }
            className="absolute inset-0 h-full w-full object-cover"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

          <div className="absolute bottom-3 left-3 right-3 sm:bottom-4 sm:left-4 sm:right-4">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/30 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md">
              <UtensilsCrossed className="h-3.5 w-3.5" />

              GastroNic
            </span>
          </div>
        </div>

        {/* ==================================================== */}
        {/* CONTENT                                              */}
        {/* ==================================================== */}

        <div className="p-4 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.08em] text-action">
                Reservación
              </p>

              <h3 className="mt-1 text-lg font-bold tracking-[-0.025em] text-ink sm:text-xl">
                {restaurant?.name ??
                  'Restaurante'}
              </h3>

              {location && (
                <div className="mt-2 flex items-start gap-1.5">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-action" />

                  <p className="text-xs leading-5 text-muted-foreground">
                    {location}
                  </p>
                </div>
              )}
            </div>

            {/* STATUS */}

            <div
              className={`inline-flex w-fit flex-shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-xs font-bold sm:gap-2 sm:px-3 sm:text-xs ${statusData.className}`}
            >
              <span
                className={`h-2 w-2 rounded-full ${statusData.dotClassName}`}
              />

              {statusData.label}
            </div>
          </div>

          {/* ================================================== */}
          {/* DETAILS                                            */}
          {/* ================================================== */}

          <div className="mt-5 grid grid-cols-2 gap-2.5 sm:mt-6 sm:gap-3 xl:grid-cols-3">
            <div className="col-span-2 xl:col-span-1">
              <ReservationDetail
                icon={CalendarDays}
                label="Fecha y hora"
                value={formatReservationDate(
                  reservation.reserved_for
                )}
              />
            </div>

            <ReservationDetail
              icon={Users}
              label="Personas"
              value={`${reservation.party_size} ${
                reservation.party_size === 1
                  ? 'persona'
                  : 'personas'
              }`}
            />

            <ReservationDetail
              icon={StatusIcon}
              label="Estado"
              value={statusData.description}
            />
          </div>

          {/* ================================================== */}
          {/* REQUESTS                                           */}
          {/* ================================================== */}

          {reservation.special_requests && (
            <div className="mt-5 rounded-xl bg-canvas px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">
                Solicitudes especiales
              </p>

              <p className="mt-1.5 text-xs leading-5 text-ink-muted">
                {
                  reservation.special_requests
                }
              </p>
            </div>
          )}

          {/* ================================================== */}
          {/* RESTAURANT NOTES                                   */}
          {/* ================================================== */}

          {reservation.restaurant_notes && (
            <div className="mt-4 rounded-xl border border-primary/10 bg-primary/[0.04] px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-[0.08em] text-action">
                Nota del restaurante
              </p>

              <p className="mt-1.5 text-xs leading-5 text-ink-muted">
                {
                  reservation.restaurant_notes
                }
              </p>
            </div>
          )}

          {/* ================================================== */}
          {/* CANCELLATION                                       */}
          {/* ================================================== */}

          {reservation.cancellation_reason && (
            <div className="mt-4 rounded-xl border border-danger/25 bg-red-50/60 px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-[0.08em] text-danger">
                Motivo de cancelación
              </p>

              <p className="mt-1.5 text-xs leading-5 text-danger">
                {
                  reservation.cancellation_reason
                }
              </p>
            </div>
          )}

          {/* ================================================== */}
          {/* COMPLETED                                          */}
          {/* ================================================== */}

          {reservation.status ===
            'completed' && (
            <div className="mt-5 flex items-start gap-3 rounded-xl bg-success-soft px-4 py-3">
              <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-success" />

              <p className="text-xs leading-5 text-success">
                Esta visita fue completada. Si compartes una reseña, GastroNic
                podrá identificarla como una{' '}
                <span className="font-bold">
                  visita verificada
                </span>
                .
              </p>
            </div>
          )}

          {/* ================================================== */}
          {/* FOOTER                                             */}
          {/* ================================================== */}

          <div className="mt-5 flex flex-col gap-3 border-t border-border/60 pt-4 sm:mt-6 sm:flex-row sm:items-center sm:justify-between sm:pt-5">
            <p className="text-xs text-muted-foreground">
              Reservación realizada a nombre de{' '}
              <span className="font-semibold text-ink">
                {
                  reservation.guest_name
                }
              </span>
            </p>

            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
              {(reservation.status === 'pending' ||
                reservation.status === 'confirmed') && (
                <CancelReservationButton
                  reservationId={reservation.id}
                  restaurantName={
                    restaurant?.name ??
                    'el restaurante'
                  }
                />
              )}

              {restaurant && (
                <Button
                  asChild
                  variant="outline"
                  className="h-11 w-full rounded-xl px-4 text-xs font-bold sm:h-10 sm:w-auto"
                >
                  <Link
                    href={`/restaurant/${restaurant.id}`}
                  >
                    Ver restaurante
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

/* ========================================================== */
/* DETAIL                                                     */
/* ========================================================== */

function ReservationDetail({
  icon:
    Icon,
  label,
  value,
}: {
  icon:
    React.ComponentType<{
      className?: string;
    }>;

  label:
    string;

  value:
    string;
}) {
  return (
    <div className="flex h-full items-start gap-2.5 rounded-xl bg-canvas p-3 sm:gap-3 sm:p-3.5">
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-white text-action shadow-sm">
        <Icon className="h-3.5 w-3.5" />
      </div>

      <div className="min-w-0">
        <p className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">
          {label}
        </p>

        <p className="mt-1 text-xs font-semibold leading-[17px] text-ink sm:text-xs sm:leading-5">
          {value}
        </p>
      </div>
    </div>
  );
}