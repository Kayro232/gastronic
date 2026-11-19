'use client';

import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  Clock3,
  LoaderCircle,
  Mail,
  MessageSquareText,
  Minus,
  Phone,
  Plus,
  UserRound,
  Users,
  X,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { getUserFacingErrorMessage } from '@/lib/supabase/errors';

const supabase =
  createClient();

/* ========================================================== */
/* TYPES                                                      */
/* ========================================================== */

interface ReservationFormProps {
  restaurantId: string;
  restaurantName: string;
}

interface ReservationConfirmation {
  reservedFor: string;
  partySize: number;
  guestName: string;
}

interface ReservationRules {
  accepts_reservations: boolean;
  reservation_min_party_size: number;
  reservation_max_party_size: number;
  reservation_min_notice_minutes: number;
  reservation_max_advance_days: number;
  reservation_duration_minutes: number;
  reservation_instructions: string | null;
}

/* ========================================================== */
/* HELPERS                                                    */
/* ========================================================== */

function getNicaraguaDate(
  value: Date = new Date()
) {
  const formatter =
    new Intl.DateTimeFormat(
      'en-CA',
      {
        timeZone:
          'America/Managua',

        year:
          'numeric',

        month:
          '2-digit',

        day:
          '2-digit',
      }
    );

  return formatter.format(
    value
  );
}

function buildReservationDate(
  date: string,
  time: string
) {
  /*
   * Nicaragua usa UTC-6 todo el año.
   *
   * Al construir el timestamp explícitamente
   * con -06:00 evitamos depender de la zona
   * horaria configurada en el dispositivo.
   */

  return new Date(
    `${date}T${time}:00-06:00`
  );
}

function formatReservationDate(
  isoDate: string
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
      isoDate
    )
  );
}

/* ========================================================== */
/* COMPONENT                                                  */
/* ========================================================== */

export function ReservationForm({
  restaurantId,
  restaurantName,
}: ReservationFormProps) {
  const [
    isOpen,
    setIsOpen,
  ] =
    useState(false);

  const [
    userId,
    setUserId,
  ] =
    useState<
      string | null
    >(null);

  const [
    isLoadingUser,
    setIsLoadingUser,
  ] =
    useState(false);

  const [
    isSubmitting,
    setIsSubmitting,
  ] =
    useState(false);

  const [
    guestName,
    setGuestName,
  ] =
    useState('');

  const [
    guestEmail,
    setGuestEmail,
  ] =
    useState('');

  const [
    guestPhone,
    setGuestPhone,
  ] =
    useState('');

  const [
    date,
    setDate,
  ] =
    useState('');

  const [
    time,
    setTime,
  ] =
    useState('');

  const [
    partySize,
    setPartySize,
  ] =
    useState(2);

  const [
    specialRequests,
    setSpecialRequests,
  ] =
    useState('');

  const [
    errorMessage,
    setErrorMessage,
  ] =
    useState('');

  const [
    confirmation,
    setConfirmation,
  ] =
    useState<
      ReservationConfirmation | null
    >(null);

  const [
    rules,
    setRules,
  ] =
    useState<
      ReservationRules | null
    >(null);

  const [
    isLoadingRules,
    setIsLoadingRules,
  ] =
    useState(false);

  /* ======================================================== */
  /* RESERVATION WINDOW                                       */
  /* ======================================================== */

  const minimumDate =
    useMemo(() => {
      const noticeMinutes =
        rules?.reservation_min_notice_minutes ??
        0;

      return getNicaraguaDate(
        new Date(
          Date.now() +
            noticeMinutes *
              60 *
              1000
        )
      );
    }, [rules]);

  const maximumDate =
    useMemo(() => {
      const advanceDays =
        rules?.reservation_max_advance_days ??
        30;

      return getNicaraguaDate(
        new Date(
          Date.now() +
            advanceDays *
              24 *
              60 *
              60 *
              1000
        )
      );
    }, [rules]);

  /* ======================================================== */
  /* USER + RESTAURANT RULES                                  */
  /* ======================================================== */

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    let cancelled =
      false;

    async function loadModalData() {
      setIsLoadingUser(true);
      setIsLoadingRules(true);
      setErrorMessage('');

      const [authResult, rulesResult] =
        await Promise.all([
          supabase.auth.getUser(),
          supabase
            .from('restaurants')
            .select(`
              accepts_reservations,
              reservation_min_party_size,
              reservation_max_party_size,
              reservation_min_notice_minutes,
              reservation_max_advance_days,
              reservation_duration_minutes,
              reservation_instructions
            `)
            .eq('id', restaurantId)
            .maybeSingle(),
        ]);

      if (cancelled) {
        return;
      }

      const {
        data: { user },
        error: authError,
      } = authResult;

      if (
        authError &&
        authError.name !==
          'AuthSessionMissingError'
      ) {
        console.error(
          'Error obteniendo usuario:',
          authError
        );
      }

      if (!user) {
        setUserId(null);
      } else {
        setUserId(user.id);

        setGuestEmail(
          (current) =>
            current ||
            user.email ||
            ''
        );

        const metadata =
          user.user_metadata ??
          {};

        const possibleName =
          metadata.full_name ||
          metadata.name ||
          metadata.display_name ||
          '';

        if (
          typeof possibleName ===
            'string'
        ) {
          setGuestName(
            (current) =>
              current ||
              possibleName
          );
        }
      }

      if (rulesResult.error) {
        console.error(
          'Error cargando reglas de reservación:',
          rulesResult.error
        );

        setRules(null);
        setErrorMessage(
          'No pudimos cargar las reglas de reservación de este restaurante.'
        );
      } else if (!rulesResult.data) {
        setRules(null);
        setErrorMessage(
          'Este restaurante ya no está disponible.'
        );
      } else {
        const loadedRules =
          rulesResult.data as ReservationRules;

        setRules(loadedRules);

        setPartySize((current) => {
          const minimum =
            loadedRules.reservation_min_party_size;
          const maximum =
            loadedRules.reservation_max_party_size;

          if (
            current < minimum ||
            current > maximum
          ) {
            return minimum;
          }

          return current;
        });
      }

      setIsLoadingUser(false);
      setIsLoadingRules(false);
    }

    loadModalData();

    return () => {
      cancelled = true;
    };
  }, [isOpen, restaurantId]);

  /* ======================================================== */
  /* CLOSE                                                    */
  /* ======================================================== */

  function handleClose() {
    if (
      isSubmitting
    ) {
      return;
    }

    setIsOpen(
      false
    );

    setErrorMessage(
      ''
    );
  }

  /* ======================================================== */
  /* RESET                                                    */
  /* ======================================================== */

  function resetForm() {
    setDate('');
    setTime('');
    setPartySize(rules?.reservation_min_party_size ?? 1);
    setSpecialRequests('');
    setErrorMessage('');
    setConfirmation(null);
  }

  /* ======================================================== */
  /* PARTY SIZE                                               */
  /* ======================================================== */

  function decreasePartySize() {
    setPartySize(
      (
        current
      ) =>
        Math.max(
          rules?.reservation_min_party_size ?? 1,
          current - 1
        )
    );
  }

  function increasePartySize() {
    setPartySize(
      (
        current
      ) =>
        Math.min(
          rules?.reservation_max_party_size ?? 50,
          current + 1
        )
    );
  }

  /* ======================================================== */
  /* SUBMIT                                                   */
  /* ======================================================== */

  async function handleSubmit(
    event:
      React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setErrorMessage(
      ''
    );

    /* ====================================================== */
    /* SESSION                                                */
    /* ====================================================== */

    if (!userId) {
      window.location.href =
        `/auth/login?next=${encodeURIComponent(
          window.location.pathname
        )}`;

      return;
    }

    if (!rules) {
      setErrorMessage(
        'No pudimos cargar las reglas de reservación de este restaurante.'
      );
      return;
    }

    if (!rules.accepts_reservations) {
      setErrorMessage(
        'Este restaurante no está aceptando reservaciones actualmente.'
      );
      return;
    }

    /* ====================================================== */
    /* VALIDATION                                             */
    /* ====================================================== */

    const cleanName =
      guestName.trim();

    const cleanEmail =
      guestEmail.trim();

    const cleanPhone =
      guestPhone.trim();

    const cleanRequests =
      specialRequests.trim();

    if (
      cleanName.length <
      2
    ) {
      setErrorMessage(
        'Escribe el nombre de la persona que realizará la reservación.'
      );

      return;
    }

    if (
      cleanPhone.length <
      7
    ) {
      setErrorMessage(
        'Ingresa un número de teléfono válido.'
      );

      return;
    }

    if (
      !date ||
      !time
    ) {
      setErrorMessage(
        'Selecciona la fecha y la hora de tu reservación.'
      );

      return;
    }

    if (
      partySize <
        rules.reservation_min_party_size ||
      partySize >
        rules.reservation_max_party_size
    ) {
      setErrorMessage(
        `La reservación debe ser para entre ${rules.reservation_min_party_size} y ${rules.reservation_max_party_size} personas.`
      );
      return;
    }

    const reservationDate =
      buildReservationDate(
        date,
        time
      );

    if (
      Number.isNaN(
        reservationDate.getTime()
      )
    ) {
      setErrorMessage(
        'La fecha u hora seleccionada no es válida.'
      );

      return;
    }

    const minimumReservationTime =
      Date.now() +
      rules.reservation_min_notice_minutes * 60 * 1000;

    const maximumReservationTime =
      Date.now() +
      rules.reservation_max_advance_days *
        24 * 60 * 60 * 1000;

    if (
      reservationDate.getTime() <
      minimumReservationTime
    ) {
      setErrorMessage(
        `Este restaurante requiere al menos ${formatNoticeTime(
          rules.reservation_min_notice_minutes
        )} de anticipación.`
      );
      return;
    }

    if (
      reservationDate.getTime() >
      maximumReservationTime
    ) {
      setErrorMessage(
        `Este restaurante permite reservar como máximo con ${rules.reservation_max_advance_days} ${
          rules.reservation_max_advance_days === 1
            ? 'día'
            : 'días'
        } de anticipación.`
      );
      return;
    }

    /* ====================================================== */
    /* INSERT                                                 */
    /* ====================================================== */

    setIsSubmitting(
      true
    );

    try {
      const {
        data,
        error,
      } =
        await supabase
          .from(
            'reservations'
          )
          .insert({
            user_id:
              userId,

            restaurant_id:
              restaurantId,

            guest_name:
              cleanName,

            guest_email:
              cleanEmail ||
              null,

            guest_phone:
              cleanPhone,

            reserved_for:
              reservationDate.toISOString(),

            party_size:
              partySize,

            special_requests:
              cleanRequests ||
              null,

            status:
              'pending',
          })
          .select(`
            id,
            reserved_for,
            party_size,
            guest_name,
            status
          `)
          .single();

      if (
        error
      ) {
        console.error(
          'Error creando reservación:',
          error
        );

        setErrorMessage(
          getUserFacingErrorMessage(error, 'No se pudo crear la reservación.')
        );

        return;
      }

      setConfirmation({
        reservedFor:
          data.reserved_for,

        partySize:
          data.party_size,

        guestName:
          data.guest_name,
      });
    } catch (
      unexpectedError
    ) {
      console.error(
        'Error inesperado creando reservación:',
        unexpectedError
      );

      setErrorMessage(
        'Ocurrió un error inesperado al solicitar la reservación.'
      );
    } finally {
      setIsSubmitting(
        false
      );
    }
  }

  /* ======================================================== */
  /* RENDER                                                   */
  /* ======================================================== */

  return (
    <>
      {/* ====================================================== */}
      {/* TRIGGER                                                */}
      {/* ====================================================== */}

      <Button
        type="button"
        onClick={() =>
          setIsOpen(
            true
          )
        }
        className="mt-4 h-10 w-full rounded-xl bg-secondary font-bold text-ink hover:bg-secondary/90"
      >
        <CalendarCheck className="mr-2 h-4 w-4" />

        Reservar ahora
      </Button>

      {/* ====================================================== */}
      {/* MODAL                                                  */}
      {/* ====================================================== */}

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5">
          {/* Overlay */}

          <button
            type="button"
            aria-label="Cerrar reservación"
            onClick={
              handleClose
            }
            className="absolute inset-0 bg-[#061513]/55 backdrop-blur-[3px]"
          />

          {/* ================================================== */}
          {/* CARD                                               */}
          {/* ================================================== */}

          <div className="relative z-10 max-h-[calc(100vh-30px)] w-full max-w-[680px] overflow-y-auto rounded-sheet border border-white/10 bg-white shadow-overlay [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {/* ================================================ */}
            {/* HEADER                                           */}
            {/* ================================================ */}

            <div className="sticky top-0 z-20 flex items-start justify-between gap-5 border-b border-border/60 bg-white/95 px-5 py-5 backdrop-blur-xl sm:px-7">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.08em] text-action">
                  <CalendarCheck className="h-3.5 w-3.5" />

                  Reservaciones GastroNic
                </div>

                <h2 className="mt-2 text-xl font-bold tracking-[-0.03em] text-ink sm:text-2xl">
                  Reserva tu mesa
                </h2>

                <p className="mt-1 max-w-md text-xs leading-5 text-muted-foreground">
                  {restaurantName}
                </p>
              </div>

              <button
                type="button"
                onClick={
                  handleClose
                }
                disabled={
                  isSubmitting
                }
                aria-label="Cerrar"
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-surface-2 text-ink transition hover:bg-[#E9EFED] disabled:opacity-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* ================================================ */}
            {/* CONTENT                                          */}
            {/* ================================================ */}

            <div className="p-5 sm:p-7">
              {confirmation ? (
                /* ============================================= */
                /* SUCCESS                                       */
                /* ============================================= */

                <div className="py-5 text-center sm:py-8">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-card bg-success-soft text-success">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>

                  <p className="mt-6 text-xs font-bold uppercase tracking-[0.08em] text-action">
                    Solicitud enviada
                  </p>

                  <h3 className="mt-2 text-2xl font-bold tracking-[-0.03em] text-ink">
                    Tu reservación está pendiente
                  </h3>

                  <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">
                    El restaurante deberá confirmar tu solicitud antes de que
                    la reservación quede confirmada.
                  </p>

                  <div className="mx-auto mt-7 max-w-md rounded-card bg-canvas p-5 text-left">
                    <ConfirmationRow
                      icon={
                        CalendarDays
                      }
                      label="Fecha y hora"
                      value={formatReservationDate(
                        confirmation.reservedFor
                      )}
                    />

                    <ConfirmationRow
                      icon={
                        Users
                      }
                      label="Personas"
                      value={`${confirmation.partySize} ${
                        confirmation.partySize ===
                        1
                          ? 'persona'
                          : 'personas'
                      }`}
                    />

                    <ConfirmationRow
                      icon={
                        UserRound
                      }
                      label="A nombre de"
                      value={
                        confirmation.guestName
                      }
                      last
                    />
                  </div>

                  <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
                    <Button
                      type="button"
                      onClick={() => {
                        resetForm();

                        setIsOpen(
                          false
                        );
                      }}
                      className="h-11 rounded-xl bg-action px-6 font-bold text-white hover:bg-action-hover"
                    >
                      Entendido
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        resetForm();
                      }}
                      className="h-11 rounded-xl px-6 font-bold"
                    >
                      Hacer otra reservación
                    </Button>
                  </div>
                </div>
              ) : isLoadingUser || isLoadingRules ? (
                /* ============================================= */
                /* LOADING USER                                  */
                /* ============================================= */

                <div className="flex min-h-[300px] items-center justify-center gap-3">
                  <LoaderCircle className="h-5 w-5 animate-spin text-action" />

                  <p className="text-sm text-muted-foreground">
                    Preparando tu reservación...
                  </p>
                </div>
              ) : !rules || !rules.accepts_reservations ? (
                /* ============================================= */
                /* UNAVAILABLE                                   */
                /* ============================================= */

                <div className="py-10 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-warning-soft text-warning">
                    <CalendarDays className="h-6 w-6" />
                  </div>

                  <h3 className="mt-5 text-lg font-bold text-ink">
                    Reservaciones no disponibles
                  </h3>

                  <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
                    Este restaurante no está aceptando solicitudes de reservación en este momento.
                  </p>

                  {errorMessage && (
                    <div className="mx-auto mt-5 max-w-md rounded-xl border border-warning/25 bg-warning-soft px-4 py-3 text-xs leading-5 text-warning">
                      {errorMessage}
                    </div>
                  )}
                </div>
              ) : !userId ? (
                /* ============================================= */
                /* LOGIN                                         */
                /* ============================================= */

                <div className="py-10 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/[0.08] text-action">
                    <UserRound className="h-6 w-6" />
                  </div>

                  <h3 className="mt-5 text-lg font-bold text-ink">
                    Inicia sesión para reservar
                  </h3>

                  <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
                    Las reservaciones se vinculan a tu cuenta para que puedas
                    consultar su estado posteriormente.
                  </p>

                  <Button
                    type="button"
                    onClick={() => {
                      window.location.href =
                        `/auth/login?next=${encodeURIComponent(
                          window.location.pathname
                        )}`;
                    }}
                    className="mt-6 h-11 rounded-xl px-6 font-bold"
                  >
                    Iniciar sesión
                  </Button>
                </div>
              ) : (
                /* ============================================= */
                /* FORM                                          */
                /* ============================================= */

                <form
                  onSubmit={
                    handleSubmit
                  }
                  className="space-y-7"
                >
                  {/* =========================================== */}
                  {/* RESERVATION RULES                           */}
                  {/* =========================================== */}

                  <div className="rounded-card border border-primary/10 bg-primary/[0.035] p-4">
                    <div className="grid gap-3 sm:grid-cols-3">
                      <RuleItem
                        label="Grupo"
                        value={`${rules.reservation_min_party_size}–${rules.reservation_max_party_size} personas`}
                      />

                      <RuleItem
                        label="Anticipación mínima"
                        value={formatNoticeTime(
                          rules.reservation_min_notice_minutes
                        )}
                      />

                      <RuleItem
                        label="Duración estimada"
                        value={formatDuration(
                          rules.reservation_duration_minutes
                        )}
                      />
                    </div>

                    {rules.reservation_instructions && (
                      <div className="mt-4 border-t border-primary/10 pt-4">
                        <p className="text-xs font-bold uppercase tracking-[0.08em] text-action">
                          Indicaciones del restaurante
                        </p>

                        <p className="mt-1.5 whitespace-pre-line text-xs leading-5 text-ink-muted">
                          {rules.reservation_instructions}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* =========================================== */}
                  {/* DATE & TIME                                 */}
                  {/* =========================================== */}

                  <FormSection
                    icon={
                      CalendarDays
                    }
                    title="¿Cuándo quieres ir?"
                    description="Selecciona una fecha y una hora para tu visita."
                  >
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field>
                        <FieldLabel
                          htmlFor="reservation-date"
                        >
                          Fecha
                        </FieldLabel>

                        <input
                          id="reservation-date"
                          type="date"
                          value={
                            date
                          }
                          min={
                            minimumDate
                          }
                          max={
                            maximumDate
                          }
                          onChange={(
                            event
                          ) =>
                            setDate(
                              event.target.value
                            )
                          }
                          disabled={
                            isSubmitting
                          }
                          required
                          className="mt-2 h-11 w-full rounded-xl border border-border/80 bg-canvas px-3 text-sm text-ink outline-none transition focus:border-primary/40 focus:ring-4 focus:ring-primary/[0.06]"
                        />
                      </Field>

                      <Field>
                        <FieldLabel
                          htmlFor="reservation-time"
                        >
                          Hora
                        </FieldLabel>

                        <div className="relative mt-2">
                          <Clock3 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                          <input
                            id="reservation-time"
                            type="time"
                            value={
                              time
                            }
                            onChange={(
                              event
                            ) =>
                              setTime(
                                event.target.value
                              )
                            }
                            disabled={
                              isSubmitting
                            }
                            required
                            className="h-11 w-full rounded-xl border border-border/80 bg-canvas pl-10 pr-3 text-sm text-ink outline-none transition focus:border-primary/40 focus:ring-4 focus:ring-primary/[0.06]"
                          />
                        </div>
                      </Field>
                    </div>
                  </FormSection>

                  {/* =========================================== */}
                  {/* PARTY SIZE                                  */}
                  {/* =========================================== */}

                  <FormSection
                    icon={
                      Users
                    }
                    title="¿Cuántas personas?"
                    description={`Este restaurante acepta grupos de ${rules.reservation_min_party_size} a ${rules.reservation_max_party_size} personas.`}
                  >
                    <div className="flex w-fit items-center overflow-hidden rounded-xl border border-border/80 bg-canvas">
                      <button
                        type="button"
                        onClick={
                          decreasePartySize
                        }
                        disabled={
                          partySize <=
                            rules.reservation_min_party_size ||
                          isSubmitting
                        }
                        className="flex h-11 w-11 items-center justify-center text-ink transition hover:bg-surface-2 disabled:opacity-30"
                        aria-label="Reducir personas"
                      >
                        <Minus className="h-4 w-4" />
                      </button>

                      <div className="flex h-11 min-w-[90px] items-center justify-center border-x border-border/70 px-4">
                        <span className="text-sm font-bold text-ink">
                          {partySize}
                        </span>

                        <span className="ml-1.5 text-xs text-muted-foreground">
                          {partySize ===
                          1
                            ? 'persona'
                            : 'personas'}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={
                          increasePartySize
                        }
                        disabled={
                          partySize >=
                            rules.reservation_max_party_size ||
                          isSubmitting
                        }
                        className="flex h-11 w-11 items-center justify-center text-ink transition hover:bg-surface-2 disabled:opacity-30"
                        aria-label="Aumentar personas"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </FormSection>

                  {/* =========================================== */}
                  {/* CONTACT                                     */}
                  {/* =========================================== */}

                  <FormSection
                    icon={
                      UserRound
                    }
                    title="Datos de contacto"
                    description="El restaurante utilizará estos datos para gestionar tu solicitud."
                  >
                    <div className="space-y-4">
                      <Field>
                        <FieldLabel
                          htmlFor="reservation-name"
                        >
                          Nombre
                        </FieldLabel>

                        <input
                          id="reservation-name"
                          type="text"
                          value={
                            guestName
                          }
                          onChange={(
                            event
                          ) =>
                            setGuestName(
                              event.target.value
                            )
                          }
                          placeholder="Nombre completo"
                          disabled={
                            isSubmitting
                          }
                          required
                          className="mt-2 h-11 w-full rounded-xl border border-border/80 bg-canvas px-4 text-sm text-ink outline-none transition placeholder:text-muted-foreground/60 focus:border-primary/40 focus:ring-4 focus:ring-primary/[0.06]"
                        />
                      </Field>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field>
                          <FieldLabel
                            htmlFor="reservation-phone"
                          >
                            Teléfono
                          </FieldLabel>

                          <div className="relative mt-2">
                            <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                            <input
                              id="reservation-phone"
                              type="tel"
                              value={
                                guestPhone
                              }
                              onChange={(
                                event
                              ) =>
                                setGuestPhone(
                                  event.target.value
                                )
                              }
                              placeholder="8888 8888"
                              disabled={
                                isSubmitting
                              }
                              required
                              className="h-11 w-full rounded-xl border border-border/80 bg-canvas pl-10 pr-3 text-sm text-ink outline-none transition placeholder:text-muted-foreground/60 focus:border-primary/40 focus:ring-4 focus:ring-primary/[0.06]"
                            />
                          </div>
                        </Field>

                        <Field>
                          <FieldLabel
                            htmlFor="reservation-email"
                          >
                            Correo
                            <span className="ml-1 font-normal text-muted-foreground">
                              opcional
                            </span>
                          </FieldLabel>

                          <div className="relative mt-2">
                            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                            <input
                              id="reservation-email"
                              type="email"
                              value={
                                guestEmail
                              }
                              onChange={(
                                event
                              ) =>
                                setGuestEmail(
                                  event.target.value
                                )
                              }
                              placeholder="correo@ejemplo.com"
                              disabled={
                                isSubmitting
                              }
                              className="h-11 w-full rounded-xl border border-border/80 bg-canvas pl-10 pr-3 text-sm text-ink outline-none transition placeholder:text-muted-foreground/60 focus:border-primary/40 focus:ring-4 focus:ring-primary/[0.06]"
                            />
                          </div>
                        </Field>
                      </div>
                    </div>
                  </FormSection>

                  {/* =========================================== */}
                  {/* SPECIAL REQUESTS                            */}
                  {/* =========================================== */}

                  <FormSection
                    icon={
                      MessageSquareText
                    }
                    title="¿Alguna solicitud especial?"
                    description="Opcional. Puedes indicar alguna necesidad o comentario para el restaurante."
                  >
                    <textarea
                      value={
                        specialRequests
                      }
                      onChange={(
                        event
                      ) =>
                        setSpecialRequests(
                          event.target.value
                        )
                      }
                      rows={
                        4
                      }
                      disabled={
                        isSubmitting
                      }
                      placeholder="Ej. celebración de cumpleaños, silla para bebé..."
                      className="w-full resize-none rounded-xl border border-border/80 bg-canvas px-4 py-3 text-sm leading-6 text-ink outline-none transition placeholder:text-muted-foreground/60 focus:border-primary/40 focus:ring-4 focus:ring-primary/[0.06]"
                    />
                  </FormSection>

                  {/* =========================================== */}
                  {/* ERROR                                       */}
                  {/* =========================================== */}

                  {errorMessage && (
                    <div className="rounded-xl border border-danger/25 bg-danger-soft px-4 py-3 text-xs leading-5 text-danger">
                      {errorMessage}
                    </div>
                  )}

                  {/* =========================================== */}
                  {/* NOTICE                                      */}
                  {/* =========================================== */}

                  <div className="rounded-card bg-surface-2 px-4 py-4">
                    <p className="text-xs leading-5 text-muted-foreground">
                      Tu solicitud se enviará como{' '}
                      <span className="font-bold text-ink">
                        pendiente
                      </span>
                      . El restaurante podrá confirmarla o rechazarla desde
                      GastroNic.
                    </p>
                  </div>

                  {/* =========================================== */}
                  {/* ACTION                                      */}
                  {/* =========================================== */}

                  <Button
                    type="submit"
                    disabled={
                      isSubmitting
                    }
                    className="h-12 w-full rounded-xl bg-action font-bold text-white shadow-overlay hover:bg-action-hover"
                  >
                    {isSubmitting ? (
                      <>
                        <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />

                        Enviando solicitud...
                      </>
                    ) : (
                      <>
                        <CalendarCheck className="mr-2 h-4 w-4" />

                        Solicitar reservación
                      </>
                    )}
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ========================================================== */
/* RULE ITEM                                                  */
/* ========================================================== */

function RuleItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-white/80 p-3">
      <p className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </p>

      <p className="mt-1 text-xs font-bold text-ink">
        {value}
      </p>
    </div>
  );
}

function formatNoticeTime(
  minutes: number
) {
  if (minutes <= 0) {
    return 'Sin mínimo';
  }

  if (minutes < 60) {
    return `${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`;
  }

  if (minutes % 60 === 0) {
    const hours = minutes / 60;
    return `${hours} ${hours === 1 ? 'hora' : 'horas'}`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours} h ${remainingMinutes} min`;
}

function formatDuration(
  minutes: number
) {
  if (minutes < 60) {
    return `${minutes} min`;
  }

  if (minutes % 60 === 0) {
    const hours = minutes / 60;
    return `${hours} ${hours === 1 ? 'hora' : 'horas'}`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours} h ${remainingMinutes} min`;
}

/* ========================================================== */
/* FORM SECTION                                               */
/* ========================================================== */

function FormSection({
  icon:
    Icon,
  title,
  description,
  children,
}: {
  icon:
    React.ComponentType<{
      className?: string;
    }>;

  title:
    string;

  description:
    string;

  children:
    React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-primary/[0.08] text-action">
          <Icon className="h-4 w-4" />
        </div>

        <div>
          <h3 className="text-sm font-bold text-ink">
            {title}
          </h3>

          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            {description}
          </p>
        </div>
      </div>

      {children}
    </section>
  );
}

/* ========================================================== */
/* FIELD                                                      */
/* ========================================================== */

function Field({
  children,
}: {
  children:
    React.ReactNode;
}) {
  return (
    <div>
      {children}
    </div>
  );
}

/* ========================================================== */
/* LABEL                                                      */
/* ========================================================== */

function FieldLabel({
  htmlFor,
  children,
}: {
  htmlFor:
    string;

  children:
    React.ReactNode;
}) {
  return (
    <label
      htmlFor={
        htmlFor
      }
      className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground"
    >
      {children}
    </label>
  );
}

/* ========================================================== */
/* CONFIRMATION ROW                                           */
/* ========================================================== */

function ConfirmationRow({
  icon:
    Icon,
  label,
  value,
  last = false,
}: {
  icon:
    React.ComponentType<{
      className?: string;
    }>;

  label:
    string;

  value:
    string;

  last?:
    boolean;
}) {
  return (
    <div
      className={`flex items-start gap-3 py-3 ${
        last
          ? ''
          : 'border-b border-border/60'
      }`}
    >
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-white text-action shadow-sm">
        <Icon className="h-3.5 w-3.5" />
      </div>

      <div>
        <p className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">
          {label}
        </p>

        <p className="mt-1 text-xs font-semibold leading-5 text-ink">
          {value}
        </p>
      </div>
    </div>
  );
}