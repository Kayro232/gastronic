'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  CalendarDays,
  Clock3,
  LoaderCircle,
  MapPin,
  Users,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { StatusBadge } from '@/components/common/status-badge';

const supabase = createClient();

type ReservationStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';

interface RestaurantMini {
  id: string;
  name: string;
  municipality: { name: string } | { name: string }[] | null;
}

interface ReservationRow {
  id: string;
  reserved_for: string;
  party_size: number;
  status: ReservationStatus;
  special_requests: string | null;
  restaurant_notes: string | null;
  cancellation_reason: string | null;
  restaurant: RestaurantMini | RestaurantMini[] | null;
}

function unwrap<T>(value: T | T[] | null): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}


export function UserReservations() {
  const [reservations, setReservations] = useState<ReservationRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    async function loadReservations() {
      setIsLoading(true);
      setErrorMessage('');

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        if (userError) console.error('Error obteniendo usuario:', userError);
        setErrorMessage('No se pudo obtener tu sesión.');
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('reservations')
        .select(`
          id,
          reserved_for,
          party_size,
          status,
          special_requests,
          restaurant_notes,
          cancellation_reason,
          restaurant:restaurants!inner (
            id,
            name,
            municipality:municipalities (
              name
            )
          )
        `)
        .eq('user_id', user.id)
        .order('reserved_for', { ascending: false });

      if (error) {
        console.error('Error cargando reservaciones:', error);
        setErrorMessage('No se pudieron cargar tus reservaciones.');
        setReservations([]);
      } else {
        setReservations((data ?? []) as unknown as ReservationRow[]);
      }

      setIsLoading(false);
    }

    loadReservations();
  }, []);

  const sortedReservations = useMemo(() => {
    const now = Date.now();
    return [...reservations].sort((a, b) => {
      const aTime = new Date(a.reserved_for).getTime();
      const bTime = new Date(b.reserved_for).getTime();
      const aUpcoming = aTime >= now && ['pending', 'confirmed'].includes(a.status);
      const bUpcoming = bTime >= now && ['pending', 'confirmed'].includes(b.status);
      if (aUpcoming !== bUpcoming) return aUpcoming ? -1 : 1;
      return bTime - aTime;
    });
  }, [reservations]);

  if (isLoading) return <StatusBox loading text="Cargando tus reservaciones..." />;
  if (errorMessage) return <StatusBox error text={errorMessage} />;

  if (reservations.length === 0) {
    return (
      <div className="flex min-h-[260px] items-center justify-center rounded-card border border-dashed border-border bg-white px-6 py-10 text-center sm:min-h-[300px] sm:rounded-sheet">
        <div className="max-w-md">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <CalendarDays className="h-6 w-6 text-action" />
          </div>
          <h3 className="mt-5 text-lg font-bold text-ink">Aún no tienes reservaciones</h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">Cuando reserves una mesa en GastroNic, podrás consultar su estado desde aquí.</p>
          <Button asChild className="mt-5 h-10 rounded-xl px-5 font-bold">
            <Link href="/explore">Buscar restaurantes</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-5 sm:mb-7">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.08em] text-action sm:text-xs">
          <CalendarDays className="h-3.5 w-3.5" /> Tus planes
        </div>
        <h3 className="mt-1.5 text-xl font-bold tracking-[-0.025em] text-ink sm:text-2xl">Reservaciones</h3>
        <p className="mt-1.5 text-xs text-muted-foreground sm:text-sm">Consulta próximas reservas y tu historial.</p>
      </div>

      <div className="space-y-3">
        {sortedReservations.map((reservation) => {
          const restaurant = unwrap(reservation.restaurant);
          if (!restaurant) return null;
          const municipality = unwrap(restaurant.municipality);
          const date = new Date(reservation.reserved_for);

          return (
            <article key={reservation.id} className="rounded-card border border-border/70 bg-white p-4 shadow-sm sm:p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="truncate text-base font-bold text-ink sm:text-lg">{restaurant.name}</h4>
                    <StatusBadge status={reservation.status} kind="reservation" size="sm" />
                  </div>

                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5 text-action" />{new Intl.DateTimeFormat('es-NI', { dateStyle: 'medium', timeZone: 'America/Managua' }).format(date)}</span>
                    <span className="flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5 text-action" />{new Intl.DateTimeFormat('es-NI', { hour: 'numeric', minute: '2-digit', timeZone: 'America/Managua' }).format(date)}</span>
                    <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5 text-action" />{reservation.party_size} {reservation.party_size === 1 ? 'persona' : 'personas'}</span>
                    {municipality?.name && <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-action" />{municipality.name}</span>}
                  </div>

                  {reservation.restaurant_notes && (
                    <p className="mt-3 rounded-xl bg-canvas px-3 py-2 text-xs leading-5 text-muted-foreground">
                      <span className="font-semibold text-ink">Nota del restaurante:</span> {reservation.restaurant_notes}
                    </p>
                  )}

                  {reservation.status === 'cancelled' && reservation.cancellation_reason && (
                    <p className="mt-3 text-xs text-danger">Motivo de cancelación: {reservation.cancellation_reason}</p>
                  )}
                </div>

                <Button asChild variant="outline" className="h-10 flex-shrink-0 rounded-xl font-bold">
                  <Link href={`/restaurant/${restaurant.id}`}>Ver restaurante</Link>
                </Button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function StatusBox({ loading, error, text }: { loading?: boolean; error?: boolean; text: string }) {
  return (
    <div className={`flex min-h-[240px] items-center justify-center rounded-card border p-6 ${error ? 'border-danger/25 bg-red-50/60 text-danger' : 'border-border/70 bg-white text-muted-foreground'}`}>
      {loading ? <LoaderCircle className="mr-3 h-5 w-5 animate-spin text-action" /> : <AlertCircle className="mr-3 h-5 w-5" />}
      <span className="text-sm">{text}</span>
    </div>
  );
}