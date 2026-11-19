'use client';

import {
  useMemo,
  useState,
} from 'react';

import Link from 'next/link';

import {
  ArrowRight,
  CalendarCheck2,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock3,
  LoaderCircle,
  Mail,
  MessageSquareText,
  MoreHorizontal,
  Phone,
  Search,
  Store,
  UserRound,
  Users,
  X,
  XCircle,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { StatusBadge as SharedStatusBadge } from '@/components/common/status-badge';
import { getUserFacingErrorMessage } from '@/lib/supabase/errors';

const supabase =
  createClient();

/* ========================================================== */
/* TYPES                                                      */
/* ========================================================== */

export type ReservationStatus =
  | 'pending'
  | 'confirmed'
  | 'cancelled'
  | 'completed'
  | 'no_show';

export interface OwnerReservation {
  id: string;
  user_id: string;
  restaurant_id: string;

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

  status:
    ReservationStatus;

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
  updated_at: string;
}

export interface OwnerReservationRestaurant {
  id: string;
  name: string;
  status: string;
  accepts_reservations: boolean;
}

interface Props {
  restaurants:
    OwnerReservationRestaurant[];

  initialReservations:
    OwnerReservation[];
}

type DateFilter =
  | 'all'
  | 'today'
  | 'upcoming'
  | 'past';

/* ========================================================== */
/* STATUS CONFIG                                              */
/* ========================================================== */


/* ========================================================== */
/* COMPONENT                                                  */
/* ========================================================== */

export function OwnerReservationsManager({
  restaurants,
  initialReservations,
}: Props) {
  const [
    reservations,
    setReservations,
  ] = useState(
    initialReservations
  );

  const [
    selectedRestaurant,
    setSelectedRestaurant,
  ] = useState('all');

  const [
    selectedStatus,
    setSelectedStatus,
  ] = useState<
    ReservationStatus | 'all'
  >('all');

  const [
    selectedDate,
    setSelectedDate,
  ] =
    useState<DateFilter>(
      'all'
    );

  const [
    search,
    setSearch,
  ] = useState('');

  const [
    actionId,
    setActionId,
  ] = useState<
    string | null
  >(null);

  const [
    openMenuId,
    setOpenMenuId,
  ] = useState<
    string | null
  >(null);

  const [
    notesReservation,
    setNotesReservation,
  ] = useState<
    OwnerReservation | null
  >(null);

  const [
    notes,
    setNotes,
  ] = useState('');

  const [
    cancelReservation,
    setCancelReservation,
  ] = useState<
    OwnerReservation | null
  >(null);

  const [
    cancellationReason,
    setCancellationReason,
  ] = useState('');

  const [
    errorMessage,
    setErrorMessage,
  ] = useState('');

  const [
    successMessage,
    setSuccessMessage,
  ] = useState('');

  /* ======================================================== */
  /* COUNTS                                                   */
  /* ======================================================== */

  const pendingCount =
    reservations.filter(
      (reservation) =>
        reservation.status ===
        'pending'
    ).length;

  const confirmedCount =
    reservations.filter(
      (reservation) =>
        reservation.status ===
        'confirmed'
    ).length;

  const completedCount =
    reservations.filter(
      (reservation) =>
        reservation.status ===
        'completed'
    ).length;

  const closedCount =
    reservations.filter(
      (reservation) =>
        reservation.status ===
          'cancelled' ||
        reservation.status ===
          'no_show'
    ).length;

  const activeGuests =
    reservations
      .filter(
        (reservation) =>
          reservation.status ===
            'pending' ||
          reservation.status ===
            'confirmed'
      )
      .reduce(
        (
          total,
          reservation
        ) =>
          total +
          reservation.party_size,
        0
      );

  /* ======================================================== */
  /* UPCOMING                                                 */
  /* ======================================================== */

  const nextReservation =
    useMemo(() => {
      const now =
        new Date();

      return (
        reservations
          .filter(
            (reservation) =>
              (
                reservation.status ===
                  'pending' ||
                reservation.status ===
                  'confirmed'
              ) &&
              new Date(
                reservation.reserved_for
              ) >= now
          )
          .sort(
            (a, b) =>
              new Date(
                a.reserved_for
              ).getTime() -
              new Date(
                b.reserved_for
              ).getTime()
          )[0] ??
        null
      );
    }, [
      reservations,
    ]);

  /* ======================================================== */
  /* FILTER                                                   */
  /* ======================================================== */

  const filteredReservations =
    useMemo(() => {
      const term =
        search
          .trim()
          .toLowerCase();

      const today =
        new Date();

      today.setHours(
        0,
        0,
        0,
        0
      );

      const tomorrow =
        new Date(today);

      tomorrow.setDate(
        tomorrow.getDate() +
          1
      );

      return reservations.filter(
        (reservation) => {
          const restaurant =
            restaurants.find(
              (item) =>
                item.id ===
                reservation.restaurant_id
            );

          const restaurantMatch =
            selectedRestaurant ===
              'all' ||
            reservation.restaurant_id ===
              selectedRestaurant;

          const statusMatch =
            selectedStatus ===
              'all' ||
            reservation.status ===
              selectedStatus;

          const reservationDate =
            new Date(
              reservation.reserved_for
            );

          let dateMatch =
            true;

          if (
            selectedDate ===
            'today'
          ) {
            dateMatch =
              reservationDate >=
                today &&
              reservationDate <
                tomorrow;
          }

          if (
            selectedDate ===
            'upcoming'
          ) {
            dateMatch =
              reservationDate >=
              new Date();
          }

          if (
            selectedDate ===
            'past'
          ) {
            dateMatch =
              reservationDate <
              new Date();
          }

          const searchMatch =
            !term ||
            reservation.guest_name
              .toLowerCase()
              .includes(term) ||
            reservation.guest_phone
              .toLowerCase()
              .includes(term) ||
            reservation.guest_email
              ?.toLowerCase()
              .includes(term) ||
            restaurant?.name
              .toLowerCase()
              .includes(term);

          return (
            restaurantMatch &&
            statusMatch &&
            dateMatch &&
            searchMatch
          );
        }
      );
    }, [
      reservations,
      restaurants,
      selectedRestaurant,
      selectedStatus,
      selectedDate,
      search,
    ]);

  /* ======================================================== */
  /* RPC STATUS                                               */
  /* ======================================================== */

  async function changeStatus(
    reservation:
      OwnerReservation,

    nextStatus:
      ReservationStatus,

    reason?: string
  ) {
    setActionId(
      reservation.id
    );

    setOpenMenuId(null);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const { error } =
        await supabase.rpc(
          'manage_reservation_status',
          {
            p_reservation_id:
              reservation.id,

            p_status:
              nextStatus,

            p_cancellation_reason:
              reason ??
              null,
          }
        );

      if (error) {
        console.error(
          'Error actualizando reservación:',
          error
        );

        setErrorMessage(
          getUserFacingErrorMessage(error, 'No se pudo actualizar la reservación.')
        );

        return;
      }

      setReservations(
        (current) =>
          current.map(
            (item) =>
              item.id ===
              reservation.id
                ? {
                    ...item,

                    status:
                      nextStatus,

                    cancellation_reason:
                      nextStatus ===
                      'cancelled'
                        ? reason ??
                          null
                        : null,

                    cancelled_at:
                      nextStatus ===
                      'cancelled'
                        ? new Date().toISOString()
                        : null,
                  }
                : item
          )
      );

      setSuccessMessage(
        `La reservación de "${reservation.guest_name}" fue actualizada.`
      );
    } catch (error) {
      console.error(
        'Error inesperado:',
        error
      );

      setErrorMessage(
        'Ocurrió un error inesperado.'
      );
    } finally {
      setActionId(null);
    }
  }

  /* ======================================================== */
  /* NOTES                                                    */
  /* ======================================================== */

  async function saveNotes() {
    if (!notesReservation) {
      return;
    }

    setActionId(
      notesReservation.id
    );

    setErrorMessage('');

    try {
      const { error } =
        await supabase.rpc(
          'update_reservation_notes',
          {
            p_reservation_id:
              notesReservation.id,

            p_restaurant_notes:
              notes.trim() ||
              null,
          }
        );

      if (error) {
        setErrorMessage(
          getUserFacingErrorMessage(
            error,
            'No se pudieron guardar las notas.'
          )
        );

        return;
      }

      setReservations(
        (current) =>
          current.map(
            (reservation) =>
              reservation.id ===
              notesReservation.id
                ? {
                    ...reservation,

                    restaurant_notes:
                      notes.trim() ||
                      null,
                  }
                : reservation
          )
      );

      setNotesReservation(
        null
      );

      setNotes('');

      setSuccessMessage(
        'Las notas internas fueron guardadas.'
      );
    } finally {
      setActionId(null);
    }
  }

  /* ======================================================== */
  /* CANCEL                                                   */
  /* ======================================================== */

  async function confirmCancellation() {
    if (
      !cancelReservation
    ) {
      return;
    }

    const reason =
      cancellationReason.trim();

    if (
      reason.length <
      3
    ) {
      setErrorMessage(
        'Escribe un motivo de cancelación.'
      );

      return;
    }

    await changeStatus(
      cancelReservation,
      'cancelled',
      reason
    );

    setCancelReservation(
      null
    );

    setCancellationReason(
      ''
    );
  }

  /* ======================================================== */
  /* UI                                                       */
  /* ======================================================== */

  return (
    <div className="space-y-6">
      {/* ====================================================== */}
      {/* HERO                                                   */}
      {/* ====================================================== */}

      <section className="relative overflow-hidden rounded-sheet bg-ink p-6 text-white shadow-overlay sm:p-8">

        <div className="relative grid gap-7 xl:grid-cols-[minmax(0,1fr)_420px] xl:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-white/35">
              Resumen operativo
            </p>

            <h2 className="mt-3 text-2xl font-bold tracking-[-0.03em] sm:text-3xl">
              {pendingCount > 0
                ? `${pendingCount} ${
                    pendingCount ===
                    1
                      ? 'solicitud espera'
                      : 'solicitudes esperan'
                  } confirmación`
                : 'Tus reservaciones están al día'}
            </h2>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/50">
              Controla las próximas visitas, confirma solicitudes y mantén
              organizadas las notas internas de cada cliente.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <HeroMetric
              value={
                pendingCount
              }
              label="Pendientes"
              attention
            />

            <HeroMetric
              value={
                confirmedCount
              }
              label="Confirmadas"
            />

            <HeroMetric
              value={
                activeGuests
              }
              label="Personas"
            />
          </div>
        </div>
      </section>

      {/* ====================================================== */}
      {/* NEXT RESERVATION                                       */}
      {/* ====================================================== */}

      {nextReservation && (
        <NextReservationCard
          reservation={
            nextReservation
          }
          restaurant={
            restaurants.find(
              (restaurant) =>
                restaurant.id ===
                nextReservation.restaurant_id
            ) ??
            null
          }
        />
      )}

      {/* ====================================================== */}
      {/* METRICS                                                */}
      {/* ====================================================== */}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          label="Pendientes"
          value={
            pendingCount
          }
          description="Esperan confirmación"
          icon={Clock3}
          tone="warning"
        />

        <Metric
          label="Confirmadas"
          value={
            confirmedCount
          }
          description="Próximas visitas"
          icon={
            CalendarCheck2
          }
          tone="primary"
        />

        <Metric
          label="Completadas"
          value={
            completedCount
          }
          description="Atendidas"
          icon={
            CheckCircle2
          }
          tone="success"
        />

        <Metric
          label="Cerradas"
          value={
            closedCount
          }
          description="Canceladas o no show"
          icon={XCircle}
          tone="neutral"
        />
      </section>

      {/* ====================================================== */}
      {/* FEEDBACK                                               */}
      {/* ====================================================== */}

      {errorMessage && (
        <div className="rounded-2xl border border-danger/25 bg-danger-soft p-4 text-sm text-danger">
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div className="rounded-2xl border border-success/25 bg-success-soft p-4 text-sm text-success">
          {successMessage}
        </div>
      )}

      {/* ====================================================== */}
      {/* MAIN PANEL                                             */}
      {/* ====================================================== */}

      <section className="overflow-hidden rounded-sheet border border-border/70 bg-white shadow-none">
        {/* FILTER BAR */}

        <div className="border-b border-border/60 p-5 sm:p-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.08em] text-action">
                  Agenda
                </p>

                <h2 className="mt-1 text-lg font-bold text-ink">
                  Todas las reservaciones
                </h2>

                <p className="mt-1 text-xs text-muted-foreground">
                  {filteredReservations.length}{' '}
                  {filteredReservations.length ===
                  1
                    ? 'resultado'
                    : 'resultados'}
                </p>
              </div>

              <div className="relative w-full xl:w-80">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                <input
                  value={
                    search
                  }
                  onChange={(
                    event
                  ) =>
                    setSearch(
                      event.target
                        .value
                    )
                  }
                  placeholder="Cliente, teléfono o restaurante..."
                  className="h-11 w-full rounded-xl border border-border bg-canvas pl-10 pr-4 text-sm outline-none transition focus:border-primary/30 focus:bg-white focus:ring-4 focus:ring-primary/[0.06]"
                />
              </div>
            </div>

            {/* SELECT FILTERS */}

            <div className="grid gap-3 md:grid-cols-3">
              <SelectField
                value={
                  selectedRestaurant
                }
                onChange={
                  setSelectedRestaurant
                }
              >
                <option value="all">
                  Todos los restaurantes
                </option>

                {restaurants.map(
                  (
                    restaurant
                  ) => (
                    <option
                      key={
                        restaurant.id
                      }
                      value={
                        restaurant.id
                      }
                    >
                      {
                        restaurant.name
                      }
                    </option>
                  )
                )}
              </SelectField>

              <SelectField
                value={
                  selectedStatus
                }
                onChange={(
                  value
                ) =>
                  setSelectedStatus(
                    value as
                      | ReservationStatus
                      | 'all'
                  )
                }
              >
                <option value="all">
                  Todos los estados
                </option>

                <option value="pending">
                  Pendientes
                </option>

                <option value="confirmed">
                  Confirmadas
                </option>

                <option value="completed">
                  Completadas
                </option>

                <option value="cancelled">
                  Canceladas
                </option>

                <option value="no_show">
                  No se presentó
                </option>
              </SelectField>

              <SelectField
                value={
                  selectedDate
                }
                onChange={(
                  value
                ) =>
                  setSelectedDate(
                    value as DateFilter
                  )
                }
              >
                <option value="all">
                  Cualquier fecha
                </option>

                <option value="today">
                  Hoy
                </option>

                <option value="upcoming">
                  Próximas
                </option>

                <option value="past">
                  Pasadas
                </option>
              </SelectField>
            </div>
          </div>
        </div>

        {/* LIST */}

        <div className="divide-y divide-border/60">
          {filteredReservations.length ===
          0 ? (
            <div className="flex min-h-[340px] items-center justify-center p-8 text-center">
              <div>
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/[0.07] text-action">
                  <CalendarDays className="h-5 w-5" />
                </div>

                <h3 className="mt-4 text-sm font-bold text-ink">
                  No encontramos reservaciones
                </h3>

                <p className="mt-2 max-w-sm text-xs leading-5 text-muted-foreground">
                  Cambia los filtros o espera nuevas solicitudes de tus
                  clientes.
                </p>
              </div>
            </div>
          ) : (
            filteredReservations.map(
              (
                reservation
              ) => (
                <ReservationRow
                  key={
                    reservation.id
                  }
                  reservation={
                    reservation
                  }
                  restaurant={
                    restaurants.find(
                      (
                        restaurant
                      ) =>
                        restaurant.id ===
                        reservation.restaurant_id
                    ) ??
                    null
                  }
                  busy={
                    actionId ===
                    reservation.id
                  }
                  menuOpen={
                    openMenuId ===
                    reservation.id
                  }
                  onToggleMenu={() =>
                    setOpenMenuId(
                      openMenuId ===
                        reservation.id
                        ? null
                        : reservation.id
                    )
                  }
                  onConfirm={() =>
                    changeStatus(
                      reservation,
                      'confirmed'
                    )
                  }
                  onComplete={() =>
                    changeStatus(
                      reservation,
                      'completed'
                    )
                  }
                  onNoShow={() =>
                    changeStatus(
                      reservation,
                      'no_show'
                    )
                  }
                  onCancel={() => {
                    setOpenMenuId(
                      null
                    );

                    setErrorMessage(
                      ''
                    );

                    setCancelReservation(
                      reservation
                    );
                  }}
                  onNotes={() => {
                    setOpenMenuId(
                      null
                    );

                    setNotes(
                      reservation.restaurant_notes ??
                        ''
                    );

                    setNotesReservation(
                      reservation
                    );
                  }}
                />
              )
            )
          )}
        </div>
      </section>

      {/* ====================================================== */}
      {/* NOTES MODAL                                            */}
      {/* ====================================================== */}

      {notesReservation && (
        <Modal
          eyebrow="Información interna"
          title="Notas de la reservación"
          subtitle={
            notesReservation.guest_name
          }
          onClose={() =>
            setNotesReservation(
              null
            )
          }
        >
          <p className="text-sm leading-6 text-muted-foreground">
            Estas notas son privadas para el equipo del restaurante y no son
            visibles para el cliente.
          </p>

          <textarea
            value={
              notes
            }
            onChange={(
              event
            ) =>
              setNotes(
                event.target
                  .value
              )
            }
            rows={6}
            placeholder="Ej. Solicita mesa cerca de la ventana..."
            className="mt-4 w-full resize-none rounded-2xl border border-border bg-canvas p-4 text-sm outline-none transition focus:border-primary/30 focus:bg-white focus:ring-4 focus:ring-primary/[0.06]"
          />

          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              disabled={
                actionId ===
                notesReservation.id
              }
              onClick={() =>
                setNotesReservation(
                  null
                )
              }
              className="rounded-xl"
            >
              Cancelar
            </Button>

            <Button
              disabled={
                actionId ===
                notesReservation.id
              }
              onClick={
                saveNotes
              }
              className="rounded-xl"
            >
              {actionId ===
              notesReservation.id ? (
                <>
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                'Guardar notas'
              )}
            </Button>
          </div>
        </Modal>
      )}

      {/* ====================================================== */}
      {/* CANCEL MODAL                                           */}
      {/* ====================================================== */}

      {cancelReservation && (
        <Modal
          eyebrow="Acción importante"
          title="Cancelar reservación"
          subtitle={
            cancelReservation.guest_name
          }
          onClose={() =>
            setCancelReservation(
              null
            )
          }
          danger
        >
          <p className="text-sm leading-6 text-muted-foreground">
            Indica el motivo para mantener un historial claro de la
            reservación.
          </p>

          <textarea
            value={
              cancellationReason
            }
            onChange={(
              event
            ) =>
              setCancellationReason(
                event.target
                  .value
              )
            }
            rows={5}
            placeholder="Motivo de cancelación..."
            className="mt-4 w-full resize-none rounded-2xl border border-border bg-canvas p-4 text-sm outline-none transition focus:border-red-300 focus:bg-white focus:ring-4 focus:ring-red-100"
          />

          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              disabled={
                actionId ===
                cancelReservation.id
              }
              onClick={() =>
                setCancelReservation(
                  null
                )
              }
              className="rounded-xl"
            >
              Volver
            </Button>

            <Button
              disabled={
                actionId ===
                cancelReservation.id
              }
              onClick={
                confirmCancellation
              }
              className="rounded-xl bg-red-600 text-white hover:bg-red-700"
            >
              {actionId ===
              cancelReservation.id ? (
                <>
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                  Cancelando...
                </>
              ) : (
                'Confirmar cancelación'
              )}
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ========================================================== */
/* NEXT RESERVATION                                           */
/* ========================================================== */

function NextReservationCard({
  reservation,
  restaurant,
}: {
  reservation:
    OwnerReservation;

  restaurant:
    | OwnerReservationRestaurant
    | null;
}) {
  return (
    <section className="overflow-hidden rounded-card border border-primary/10 bg-white shadow-none">
      <div className="grid gap-0 lg:grid-cols-[5px_minmax(0,1fr)_auto]">
        <div className="hidden bg-action lg:block" />

        <div className="p-5 sm:p-6">
          <p className="text-xs font-bold uppercase tracking-[0.08em] text-action">
            Próxima reservación
          </p>

          <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-bold text-ink">
                  {
                    reservation.guest_name
                  }
                </h3>

                <StatusBadge
                  status={
                    reservation.status
                  }
                />
              </div>

              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
                <Detail
                  icon={
                    CalendarDays
                  }
                  text={
                    formatDateTime(
                      reservation.reserved_for
                    )
                  }
                />

                <Detail
                  icon={
                    Users
                  }
                  text={`${reservation.party_size} ${
                    reservation.party_size ===
                    1
                      ? 'persona'
                      : 'personas'
                  }`}
                />

                {restaurant && (
                  <Detail
                    icon={
                      Store
                    }
                    text={
                      restaurant.name
                    }
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {restaurant && (
          <div className="flex items-center border-t border-border/60 px-5 py-4 lg:border-l lg:border-t-0">
            <Button
              asChild
              variant="outline"
              className="w-full rounded-xl lg:w-auto"
            >
              <Link
                href={`/owner/restaurants/${restaurant.id}/reservations`}
              >
                Ver agenda

                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}

/* ========================================================== */
/* ROW                                                        */
/* ========================================================== */

function ReservationRow({
  reservation,
  restaurant,
  busy,
  menuOpen,
  onToggleMenu,
  onConfirm,
  onComplete,
  onNoShow,
  onCancel,
  onNotes,
}: {
  reservation:
    OwnerReservation;

  restaurant:
    | OwnerReservationRestaurant
    | null;

  busy: boolean;
  menuOpen: boolean;

  onToggleMenu:
    () => void;

  onConfirm:
    () => void;

  onComplete:
    () => void;

  onNoShow:
    () => void;

  onCancel:
    () => void;

  onNotes:
    () => void;
}) {
  return (
    <article className="p-5 transition hover:bg-canvas sm:p-6">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_250px_48px] xl:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-bold text-ink sm:text-base">
              {
                reservation.guest_name
              }
            </h3>

            <StatusBadge
              status={
                reservation.status
              }
            />

            {restaurant && (
              <Link
                href={`/owner/restaurants/${restaurant.id}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-2.5 py-1 text-xs font-bold text-muted-foreground transition hover:border-primary/20 hover:text-action"
              >
                <Store className="h-3 w-3" />

                {
                  restaurant.name
                }
              </Link>
            )}
          </div>

          <div className="mt-4 grid gap-3 text-xs text-muted-foreground sm:grid-cols-2 lg:grid-cols-4">
            <Detail
              icon={
                CalendarDays
              }
              text={
                formatDateTime(
                  reservation.reserved_for
                )
              }
            />

            <Detail
              icon={
                Users
              }
              text={`${reservation.party_size} ${
                reservation.party_size ===
                1
                  ? 'persona'
                  : 'personas'
              }`}
            />

            <Detail
              icon={Phone}
              text={
                reservation.guest_phone
              }
            />

            {reservation.guest_email && (
              <Detail
                icon={
                  Mail
                }
                text={
                  reservation.guest_email
                }
              />
            )}
          </div>

          {reservation.special_requests && (
            <div className="mt-4 rounded-xl border border-border/50 bg-canvas p-3">
              <div className="flex items-start gap-2">
                <MessageSquareText className="mt-0.5 h-4 w-4 flex-shrink-0 text-action" />

                <p className="text-xs leading-5 text-muted-foreground">
                  {
                    reservation.special_requests
                  }
                </p>
              </div>
            </div>
          )}

          {reservation.restaurant_notes && (
            <div className="mt-3 flex items-start gap-2 text-xs text-action">
              <MessageSquareText className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />

              <span>
                <strong>
                  Nota interna:
                </strong>{' '}

                {
                  reservation.restaurant_notes
                }
              </span>
            </div>
          )}

          {reservation.status ===
            'cancelled' &&
            reservation.cancellation_reason && (
              <div className="mt-3 rounded-xl border border-danger/25 bg-danger-soft px-3 py-2.5 text-xs leading-5 text-danger">
                <strong>
                  Motivo:
                </strong>{' '}

                {
                  reservation.cancellation_reason
                }
              </div>
            )}
        </div>

        {/* ACTIONS */}

        <div className="flex flex-wrap gap-2 xl:justify-end">
          {reservation.status ===
            'pending' && (
            <>
              <Button
                size="sm"
                disabled={
                  busy
                }
                onClick={
                  onConfirm
                }
                className="rounded-xl"
              >
                Confirmar
              </Button>

              <Button
                size="sm"
                variant="outline"
                disabled={
                  busy
                }
                onClick={
                  onCancel
                }
                className="rounded-xl border-danger/25 text-danger hover:bg-danger-soft hover:text-danger"
              >
                Cancelar
              </Button>
            </>
          )}

          {reservation.status ===
            'confirmed' && (
            <Button
              size="sm"
              disabled={
                busy
              }
              onClick={
                onComplete
              }
              className="rounded-xl"
            >
              Completar
            </Button>
          )}
        </div>

        {/* MORE */}

        <div className="relative flex justify-end">
          <button
            type="button"
            disabled={
              busy
            }
            onClick={
              onToggleMenu
            }
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-white text-muted-foreground transition hover:border-primary/20 hover:text-action"
          >
            {busy ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <MoreHorizontal className="h-4 w-4" />
            )}
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-12 z-30 w-56 overflow-hidden rounded-xl border border-border bg-white shadow-overlay">
              <MenuAction
                icon={
                  MessageSquareText
                }
                label="Notas internas"
                onClick={
                  onNotes
                }
              />

              {restaurant && (
                <Link
                  href={`/owner/restaurants/${restaurant.id}/reservations`}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left text-xs font-semibold text-ink transition hover:bg-canvas"
                >
                  <Store className="h-3.5 w-3.5" />

                  Abrir restaurante
                </Link>
              )}

              {reservation.status ===
                'confirmed' && (
                <>
                  <MenuAction
                    icon={
                      UserRound
                    }
                    label="No se presentó"
                    onClick={
                      onNoShow
                    }
                  />

                  <MenuAction
                    icon={
                      XCircle
                    }
                    label="Cancelar reservación"
                    onClick={
                      onCancel
                    }
                    destructive
                  />
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

/* ========================================================== */
/* METRICS                                                    */
/* ========================================================== */

function Metric({
  label,
  value,
  description,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  description: string;

  icon: React.ComponentType<{
    className?: string;
  }>;

  tone:
    | 'warning'
    | 'primary'
    | 'success'
    | 'neutral';
}) {
  const styles = {
    warning: {
      icon:
        'bg-warning-soft text-warning',

      dot:
        'bg-amber-500',
    },

    primary: {
      icon:
        'bg-primary/[0.08] text-action',

      dot:
        'bg-action',
    },

    success: {
      icon:
        'bg-success-soft text-success',

      dot:
        'bg-emerald-500',
    },

    neutral: {
      icon:
        'bg-slate-100 text-slate-600',

      dot:
        'bg-slate-400',
    },
  };

  const current =
    styles[tone];

  return (
    <div className="rounded-card border border-border/70 bg-white p-5 shadow-none">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span
              className={`h-1.5 w-1.5 rounded-full ${current.dot}`}
            />

            <p className="text-xs font-semibold text-muted-foreground">
              {label}
            </p>
          </div>

          <p className="mt-4 text-3xl font-bold tracking-[-0.04em] text-ink">
            {value}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            {description}
          </p>
        </div>

        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${current.icon}`}
        >
          <Icon className="h-4.5 w-4.5" />
        </div>
      </div>
    </div>
  );
}

function HeroMetric({
  value,
  label,
  attention = false,
}: {
  value: number;
  label: string;
  attention?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border px-4 py-4 text-center ${
        attention
          ? 'border-amber-400/20 bg-amber-400/[0.08]'
          : 'border-white/10 bg-white/[0.06]'
      }`}
    >
      <p
        className={`text-2xl font-bold ${
          attention
            ? 'text-secondary'
            : 'text-white'
        }`}
      >
        {value}
      </p>

      <p className="mt-1 text-xs font-bold uppercase tracking-[0.09em] text-white/35">
        {label}
      </p>
    </div>
  );
}

/* ========================================================== */
/* SELECT                                                     */
/* ========================================================== */

function SelectField({
  value,
  onChange,
  children,
}: {
  value: string;

  onChange: (
    value: string
  ) => void;

  children:
    React.ReactNode;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(
          event
        ) =>
          onChange(
            event.target
              .value
          )
        }
        className="h-11 w-full appearance-none rounded-xl border border-border bg-canvas px-4 pr-10 text-xs font-semibold text-ink outline-none transition focus:border-primary/30 focus:bg-white focus:ring-4 focus:ring-primary/[0.06]"
      >
        {children}
      </select>

      <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
}

/* ========================================================== */
/* STATUS                                                     */
/* ========================================================== */

function StatusBadge({
  status,
}: {
  status:
    ReservationStatus;
}) {
  /* GastroNic DS: insignia compartida (color, ícono y texto) */
  return (
    <SharedStatusBadge
      status={status}
      kind="reservation"
    />
  );
}

/* ========================================================== */
/* DETAIL                                                     */
/* ========================================================== */

function Detail({
  icon: Icon,
  text,
}: {
  icon: React.ComponentType<{
    className?: string;
  }>;

  text: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <Icon className="h-3.5 w-3.5 flex-shrink-0 text-action" />

      <span className="truncate">
        {text}
      </span>
    </div>
  );
}

/* ========================================================== */
/* MENU                                                       */
/* ========================================================== */

function MenuAction({
  icon: Icon,
  label,
  onClick,
  destructive = false,
}: {
  icon: React.ComponentType<{
    className?: string;
  }>;

  label: string;

  onClick:
    () => void;

  destructive?:
    boolean;
}) {
  return (
    <button
      type="button"
      onClick={
        onClick
      }
      className={`flex w-full items-center gap-3 px-4 py-3 text-left text-xs font-semibold transition ${
        destructive
          ? 'text-danger hover:bg-danger-soft'
          : 'text-ink hover:bg-canvas'
      }`}
    >
      <Icon className="h-3.5 w-3.5" />

      {label}
    </button>
  );
}

/* ========================================================== */
/* MODAL                                                      */
/* ========================================================== */

function Modal({
  eyebrow,
  title,
  subtitle,
  onClose,
  children,
  danger = false,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;

  onClose:
    () => void;

  children:
    React.ReactNode;

  danger?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-sheet border border-border bg-white shadow-overlay">
        <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-5">
          <div>
            <p
              className={`text-xs font-bold uppercase tracking-[0.08em] ${
                danger
                  ? 'text-danger'
                  : 'text-action'
              }`}
            >
              {eyebrow}
            </p>

            <h2 className="mt-1 text-xl font-bold text-ink">
              {title}
            </h2>

            <p className="mt-1 text-xs text-muted-foreground">
              {subtitle}
            </p>
          </div>

          <button
            type="button"
            onClick={
              onClose
            }
            className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition hover:bg-muted"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
}

/* ========================================================== */
/* HELPERS                                                    */
/* ========================================================== */

function formatDateTime(
  value: string
) {
  const formatted =
    new Intl.DateTimeFormat(
      'es-NI',
      {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: 'America/Managua',
      }
    ).format(
      new Date(value)
    );

  return formatted
    .replace(
      /[\u00A0\u202F]/g,
      ' '
    )
    .trim();
}