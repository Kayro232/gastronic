'use client';

import {
  CalendarDays,
  LoaderCircle,
} from 'lucide-react';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { getUserFacingErrorMessage } from '@/lib/supabase/errors';

interface ReservationSettingsCardProps {
  restaurantId: string;
  initialValue: boolean;
}

export function ReservationSettingsCard({
  restaurantId,
  initialValue,
}: ReservationSettingsCardProps) {
  const router = useRouter();

  const [enabled, setEnabled] =
    useState(initialValue);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const handleToggle = async () => {
    if (loading) return;

    const nextValue = !enabled;

    setLoading(true);
    setError(null);

    const supabase =
      createClient();

    const {
      error: rpcError,
    } = await supabase.rpc(
      'set_owned_restaurant_reservations',
      {
        p_restaurant_id:
          restaurantId,

        p_accepts_reservations:
          nextValue,
      }
    );

    if (rpcError) {
      console.error(
        'Error cambiando reservaciones:',
        rpcError
      );

      setError(
        getUserFacingErrorMessage(rpcError, 'No se pudo actualizar la configuración.')
      );

      setLoading(false);

      return;
    }

    setEnabled(nextValue);
    setLoading(false);

    router.refresh();
  };

  return (
    <section className="rounded-card border border-border/70 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <div
            className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl ${
              enabled
                ? 'bg-success-soft text-success'
                : 'bg-slate-100 text-slate-500'
            }`}
          >
            <CalendarDays className="h-5 w-5" />
          </div>

          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">
              Reservaciones
            </p>

            <h3 className="mt-1 text-sm font-bold text-ink">
              {enabled
                ? 'Aceptando reservaciones'
                : 'Reservaciones desactivadas'}
            </h3>

            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              {enabled
                ? 'Los usuarios pueden solicitar reservaciones desde la ficha pública.'
                : 'Los usuarios no podrán enviar nuevas solicitudes de reservación.'}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between gap-4 border-t border-border/60 pt-4">
        <div>
          <p className="text-xs font-semibold text-ink">
            Estado
          </p>

          <p
            className={`mt-0.5 text-xs font-bold ${
              enabled
                ? 'text-success'
                : 'text-slate-500'
            }`}
          >
            {enabled
              ? 'ACTIVAS'
              : 'DESACTIVADAS'}
          </p>
        </div>

        <Button
          type="button"
          variant={
            enabled
              ? 'outline'
              : 'default'
          }
          disabled={loading}
          onClick={handleToggle}
          className="h-9 rounded-xl px-4 text-xs"
        >
          {loading ? (
            <>
              <LoaderCircle className="mr-2 h-3.5 w-3.5 animate-spin" />

              Guardando
            </>
          ) : enabled ? (
            'Desactivar'
          ) : (
            'Activar'
          )}
        </Button>
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-danger/25 bg-danger-soft px-3 py-2.5">
          <p className="text-xs leading-5 text-danger">
            {error}
          </p>
        </div>
      )}
    </section>
  );
}