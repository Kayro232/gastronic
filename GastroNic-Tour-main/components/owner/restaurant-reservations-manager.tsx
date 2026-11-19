'use client';

import {
    useMemo,
    useState,
} from 'react';

import {
    CalendarDays,
    CheckCircle2,
    Clock3,
    LoaderCircle,
    Mail,
    MessageSquareText,
    MoreHorizontal,
    Phone,
    Search,
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

type ReservationStatus =
    | 'pending'
    | 'confirmed'
    | 'cancelled'
    | 'completed'
    | 'no_show';

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
    status: ReservationStatus;
    restaurant_notes: string | null;
    cancellation_reason: string | null;
    cancelled_at: string | null;
    created_at: string;
    updated_at: string;
}

interface Props {
    restaurantName: string;
    acceptsReservations: boolean;
    initialReservations: Reservation[];
}


export function RestaurantReservationsManager({
    restaurantName,
    acceptsReservations,
    initialReservations,
}: Props) {
    const [
        reservations,
        setReservations,
    ] = useState(
        initialReservations
    );

    const [
        selectedStatus,
        setSelectedStatus,
    ] = useState<
        ReservationStatus | 'all'
    >('all');

    const [
        search,
        setSearch,
    ] = useState('');

    const [
        actionId,
        setActionId,
    ] = useState<string | null>(
        null
    );

    const [
        openMenuId,
        setOpenMenuId,
    ] = useState<string | null>(
        null
    );

    const [
        notesReservation,
        setNotesReservation,
    ] = useState<Reservation | null>(
        null
    );

    const [
        notes,
        setNotes,
    ] = useState('');

    const [
        cancelReservation,
        setCancelReservation,
    ] = useState<Reservation | null>(
        null
    );

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

    const filtered =
        useMemo(() => {
            const term =
                search
                    .trim()
                    .toLowerCase();

            return reservations.filter(
                (reservation) => {
                    const statusMatch =
                        selectedStatus ===
                        'all' ||
                        reservation.status ===
                        selectedStatus;

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
                            .includes(term);

                    return (
                        statusMatch &&
                        searchMatch
                    );
                }
            );
        }, [
            reservations,
            selectedStatus,
            search,
        ]);

    const pendingCount =
        reservations.filter(
            (item) =>
                item.status ===
                'pending'
        ).length;

    const confirmedCount =
        reservations.filter(
            (item) =>
                item.status ===
                'confirmed'
        ).length;

    const completedCount =
        reservations.filter(
            (item) =>
                item.status ===
                'completed'
        ).length;

    const cancelledCount =
        reservations.filter(
            (item) =>
                item.status ===
                'cancelled' ||
                item.status ===
                'no_show'
        ).length;

    async function changeStatus(
        reservation: Reservation,
        nextStatus: ReservationStatus,
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
                            reason ?? null,
                    }
                );

            if (error) {
                const message =
                    getUserFacingErrorMessage(error, 'No se pudo actualizar la reservación.');

                /*
                 * Las excepciones P0001 vienen de nuestras
                 * validaciones de negocio Sen PostgreSQL.
                 * No son errores inesperados de la aplicación.
                 */
                if (error.code !== 'P0001') {
                    console.error(
                        'Error cambiando reservación:',
                        error
                    );
                }

                setErrorMessage(
                    message
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
    } finally {
        setActionId(null);
    }
}

async function saveNotes() {
    if (!notesReservation) {
        return;
    }

    setActionId(
        notesReservation.id
    );

    setErrorMessage('');

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

        setActionId(null);

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

    setNotesReservation(null);
    setNotes('');

    setSuccessMessage(
        'Las notas internas fueron guardadas.'
    );

    setActionId(null);
}

async function confirmCancellation() {
    if (!cancelReservation) {
        return;
    }

    const reason =
        cancellationReason.trim();

    if (
        reason.length < 3
    ) {
        setErrorMessage(
            'Escribe el motivo de cancelación.'
        );

        return;
    }

    await changeStatus(
        cancelReservation,
        'cancelled',
        reason
    );

    setCancelReservation(null);
    setCancellationReason('');
}

return (
    <div className="space-y-6">
        {!acceptsReservations && (
            <div className="rounded-2xl border border-warning/25 bg-warning-soft p-4 text-sm text-warning">
                Este restaurante actualmente tiene desactivadas las reservaciones.
                Las reservaciones existentes siguen disponibles para gestión.
            </div>
        )}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Metric
                label="Pendientes"
                value={pendingCount}
                icon={Clock3}
            />

            <Metric
                label="Confirmadas"
                value={confirmedCount}
                icon={CalendarDays}
            />

            <Metric
                label="Completadas"
                value={completedCount}
                icon={CheckCircle2}
            />

            <Metric
                label="Cerradas"
                value={cancelledCount}
                icon={XCircle}
            />
        </section>

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

        <section className="overflow-hidden rounded-sheet border border-border/70 bg-white shadow-none">
            <div className="border-b border-border/60 p-5 sm:p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex flex-wrap gap-2">
                        <FilterButton
                            label="Todas"
                            active={
                                selectedStatus ===
                                'all'
                            }
                            onClick={() =>
                                setSelectedStatus(
                                    'all'
                                )
                            }
                        />

                        <FilterButton
                            label="Pendientes"
                            active={
                                selectedStatus ===
                                'pending'
                            }
                            onClick={() =>
                                setSelectedStatus(
                                    'pending'
                                )
                            }
                        />

                        <FilterButton
                            label="Confirmadas"
                            active={
                                selectedStatus ===
                                'confirmed'
                            }
                            onClick={() =>
                                setSelectedStatus(
                                    'confirmed'
                                )
                            }
                        />

                        <FilterButton
                            label="Completadas"
                            active={
                                selectedStatus ===
                                'completed'
                            }
                            onClick={() =>
                                setSelectedStatus(
                                    'completed'
                                )
                            }
                        />

                        <FilterButton
                            label="Canceladas"
                            active={
                                selectedStatus ===
                                'cancelled'
                            }
                            onClick={() =>
                                setSelectedStatus(
                                    'cancelled'
                                )
                            }
                        />
                    </div>

                    <div className="relative w-full lg:w-72">
                        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                        <input
                            value={search}
                            onChange={(
                                event
                            ) =>
                                setSearch(
                                    event.target
                                        .value
                                )
                            }
                            placeholder="Buscar cliente..."
                            className="h-11 w-full rounded-xl border border-border bg-canvas pl-10 pr-4 text-sm outline-none focus:border-primary/30 focus:bg-white focus:ring-4 focus:ring-primary/[0.06]"
                        />
                    </div>
                </div>
            </div>

            <div className="divide-y divide-border/60">
                {filtered.length ===
                    0 ? (
                    <div className="flex min-h-[320px] items-center justify-center p-8 text-center">
                        <div>
                            <CalendarDays className="mx-auto h-8 w-8 text-muted-foreground/40" />

                            <h3 className="mt-4 text-sm font-bold text-ink">
                                No hay reservaciones
                            </h3>

                            <p className="mt-2 text-xs text-muted-foreground">
                                No encontramos reservaciones con estos filtros.
                            </p>
                        </div>
                    </div>
                ) : (
                    filtered.map(
                        (reservation) => (
                            <ReservationRow
                                key={
                                    reservation.id
                                }
                                reservation={
                                    reservation
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

        {notesReservation && (
            <Modal
                title="Notas internas"
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
                    Estas notas son internas y no se muestran al cliente.
                </p>

                <textarea
                    value={notes}
                    onChange={(event) =>
                        setNotes(
                            event.target.value
                        )
                    }
                    rows={6}
                    placeholder="Ej. Cliente solicita mesa cerca de la ventana..."
                    className="mt-4 w-full resize-none rounded-2xl border border-border bg-canvas p-4 text-sm outline-none focus:border-primary/30 focus:bg-white focus:ring-4 focus:ring-primary/[0.06]"
                />

                <div className="mt-5 flex justify-end gap-2">
                    <Button
                        variant="outline"
                        onClick={() =>
                            setNotesReservation(
                                null
                            )
                        }
                    >
                        Cancelar
                    </Button>

                    <Button
                        onClick={saveNotes}
                        disabled={
                            actionId ===
                            notesReservation.id
                        }
                    >
                        Guardar notas
                    </Button>
                </div>
            </Modal>
        )}

        {cancelReservation && (
            <Modal
                title="Cancelar reservación"
                subtitle={
                    cancelReservation.guest_name
                }
                onClose={() =>
                    setCancelReservation(
                        null
                    )
                }
            >
                <p className="text-sm leading-6 text-muted-foreground">
                    Escribe el motivo de cancelación para mantener un registro claro.
                </p>

                <textarea
                    value={
                        cancellationReason
                    }
                    onChange={(event) =>
                        setCancellationReason(
                            event.target.value
                        )
                    }
                    rows={5}
                    placeholder="Motivo de cancelación..."
                    className="mt-4 w-full resize-none rounded-2xl border border-border bg-canvas p-4 text-sm outline-none focus:border-red-300 focus:bg-white focus:ring-4 focus:ring-red-100"
                />

                <div className="mt-5 flex justify-end gap-2">
                    <Button
                        variant="outline"
                        onClick={() =>
                            setCancelReservation(
                                null
                            )
                        }
                    >
                        Volver
                    </Button>

                    <Button
                        onClick={
                            confirmCancellation
                        }
                        className="bg-red-600 text-white hover:bg-red-700"
                    >
                        Cancelar reservación
                    </Button>
                </div>
            </Modal>
        )}
    </div>
);
}

function ReservationRow({
    reservation,
    busy,
    menuOpen,
    onToggleMenu,
    onConfirm,
    onComplete,
    onNoShow,
    onCancel,
    onNotes,
}: {
    reservation: Reservation;
    busy: boolean;
    menuOpen: boolean;
    onToggleMenu: () => void;
    onConfirm: () => void;
    onComplete: () => void;
    onNoShow: () => void;
    onCancel: () => void;
    onNotes: () => void;
}) {
    return (
        <article className="p-5 transition hover:bg-canvas sm:p-6">
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_260px_48px] xl:items-center">
                <div>
                    <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-bold text-ink">
                            {
                                reservation.guest_name
                            }
                        </h3>

                        <SharedStatusBadge
                            status={reservation.status}
                            kind="reservation"
                        />
                    </div>

                    <div className="mt-4 grid gap-3 text-xs text-muted-foreground sm:grid-cols-2 lg:grid-cols-4">
                        <Detail
                            icon={CalendarDays}
                            text={formatDateTime(
                                reservation.reserved_for
                            )}
                        />

                        <Detail
                            icon={Users}
                            text={`${reservation.party_size} ${reservation.party_size ===
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
                                icon={Mail}
                                text={
                                    reservation.guest_email
                                }
                            />
                        )}
                    </div>

                    {reservation.special_requests && (
                        <div className="mt-4 rounded-xl bg-canvas p-3">
                            <div className="flex items-start gap-2">
                                <MessageSquareText className="mt-0.5 h-4 w-4 text-action" />

                                <p className="text-xs leading-5 text-muted-foreground">
                                    {
                                        reservation.special_requests
                                    }
                                </p>
                            </div>
                        </div>
                    )}

                    {reservation.restaurant_notes && (
                        <p className="mt-3 text-xs font-medium text-action">
                            Nota interna: {
                                reservation.restaurant_notes
                            }
                        </p>
                    )}
                </div>

                <div className="flex flex-wrap gap-2 xl:justify-end">
                    {reservation.status ===
                        'pending' && (
                            <>
                                <Button
                                    size="sm"
                                    onClick={
                                        onConfirm
                                    }
                                    disabled={busy}
                                    className="rounded-xl"
                                >
                                    Confirmar
                                </Button>

                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={
                                        onCancel
                                    }
                                    disabled={busy}
                                    className="rounded-xl border-danger/25 text-danger hover:bg-danger-soft"
                                >
                                    Cancelar
                                </Button>
                            </>
                        )}

                    {reservation.status ===
                        'confirmed' && (
                            <Button
                                size="sm"
                                onClick={
                                    onComplete
                                }
                                disabled={busy}
                                className="rounded-xl"
                            >
                                Completar
                            </Button>
                        )}
                </div>

                <div className="relative flex justify-end">
                    <button
                        type="button"
                        onClick={
                            onToggleMenu
                        }
                        disabled={busy}
                        className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-white text-muted-foreground hover:text-action"
                    >
                        {busy ? (
                            <LoaderCircle className="h-4 w-4 animate-spin" />
                        ) : (
                            <MoreHorizontal className="h-4 w-4" />
                        )}
                    </button>

                    {menuOpen && (
                        <div className="absolute right-0 top-12 z-20 w-52 overflow-hidden rounded-xl border border-border bg-white shadow-xl">
                            <MenuAction
                                icon={
                                    MessageSquareText
                                }
                                label="Notas internas"
                                onClick={
                                    onNotes
                                }
                            />

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
                                            icon={XCircle}
                                            label="Cancelar"
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

function Metric({
    label,
    value,
    icon: Icon,
}: {
    label: string;
    value: number;
    icon: React.ComponentType<{
        className?: string;
    }>;
}) {
    return (
        <div className="rounded-card border border-border/70 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-xs font-semibold text-muted-foreground">
                        {label}
                    </p>

                    <p className="mt-3 text-3xl font-bold text-ink">
                        {value}
                    </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-action">
                    <Icon className="h-5 w-5" />
                </div>
            </div>
        </div>
    );
}

function FilterButton({
    label,
    active,
    onClick,
}: {
    label: string;
    active: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`rounded-full px-4 py-2 text-xs font-bold transition ${active
                    ? 'bg-action text-white'
                    : 'border border-border bg-canvas text-muted-foreground hover:text-action'
                }`}
        >
            {label}
        </button>
    );
}

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
        <div className="flex items-center gap-2 min-w-0">
            <Icon className="h-3.5 w-3.5 flex-shrink-0 text-action" />

            <span className="truncate">
                {text}
            </span>
        </div>
    );
}

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
    onClick: () => void;
    destructive?: boolean;
}) {
    return (
        <button
            type="button"
            onClick={
                onClick
            }
            className={`flex w-full items-center gap-3 px-4 py-3 text-left text-xs font-semibold ${destructive
                    ? 'text-danger hover:bg-danger-soft'
                    : 'text-ink hover:bg-canvas'
                }`}
        >
            <Icon className="h-3.5 w-3.5" />

            {label}
        </button>
    );
}

function Modal({
    title,
    subtitle,
    onClose,
    children,
}: {
    title: string;
    subtitle: string;
    onClose: () => void;
    children: React.ReactNode;
}) {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
            <div className="w-full max-w-lg overflow-hidden rounded-sheet border border-border bg-white shadow-modal">
                <div className="flex items-start justify-between border-b border-border px-6 py-5">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.08em] text-action">
                            {subtitle}
                        </p>

                        <h2 className="mt-1 text-xl font-bold text-ink">
                            {title}
                        </h2>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted"
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