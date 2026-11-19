'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  LoaderCircle,
  TriangleAlert,
  XCircle,
} from 'lucide-react';

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { createClient } from '@/lib/supabase/client';

interface CancelReservationButtonProps {
  reservationId: string;
  restaurantName: string;
}

export function CancelReservationButton({
  reservationId,
  restaurantName,
}: CancelReservationButtonProps) {
  const router = useRouter();

  const [open, setOpen] =
    useState(false);

  const [reason, setReason] =
    useState('');

  const [errorMessage, setErrorMessage] =
    useState('');

  const [isCancelling, setIsCancelling] =
    useState(false);

  function handleOpenChange(
    nextOpen: boolean
  ) {
    if (isCancelling) {
      return;
    }

    setOpen(nextOpen);

    if (!nextOpen) {
      setReason('');
      setErrorMessage('');
    }
  }

  async function handleCancel() {
    if (isCancelling) {
      return;
    }

    setErrorMessage('');
    setIsCancelling(true);

    try {
      const supabase =
        createClient();

      const {
        error,
      } = await supabase.rpc(
        'cancel_reservation',
        {
          reservation_id_input:
            reservationId,
          reason_input:
            reason.trim() ||
            null,
        }
      );

      if (error) {
        const message =
          error.message
            .toLowerCase();

        if (
          message.includes(
            'no tienes permiso'
          )
        ) {
          setErrorMessage(
            'No tienes permiso para cancelar esta reservación.'
          );
        } else if (
          message.includes(
            'ya no se puede cancelar'
          ) ||
          message.includes(
            'solo se pueden cancelar'
          )
        ) {
          setErrorMessage(
            'Esta reservación ya no se puede cancelar porque su estado cambió.'
          );
        } else if (
          message.includes(
            'reserva no encontrada'
          ) ||
          message.includes(
            'reservación no encontrada'
          )
        ) {
          setErrorMessage(
            'La reservación ya no existe o no está disponible.'
          );
        } else {
          setErrorMessage(
            'No se pudo cancelar la reservación. Actualiza la página e inténtalo nuevamente.'
          );
        }

        return;
      }

      setOpen(false);
      setReason('');
      setErrorMessage('');

      router.refresh();
    } catch {
      setErrorMessage(
        'Ocurrió un error inesperado. Inténtalo nuevamente.'
      );
    } finally {
      setIsCancelling(false);
    }
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={
        handleOpenChange
      }
    >
      <AlertDialogTrigger
        asChild
      >
        <Button
          type="button"
          variant="outline"
          className="h-11 w-full rounded-xl border-danger/25 px-4 text-xs font-bold text-danger hover:bg-danger-soft hover:text-danger sm:h-10 sm:w-auto"
        >
          <XCircle className="h-4 w-4" />
          Cancelar reservación
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent className="rounded-2xl sm:max-w-md">
        <AlertDialogHeader>
          <div className="mb-1 flex h-11 w-11 items-center justify-center rounded-xl bg-danger-soft text-danger">
            <TriangleAlert className="h-5 w-5" />
          </div>

          <AlertDialogTitle className="text-ink">
            Cancelar reservación
          </AlertDialogTitle>

          <AlertDialogDescription className="leading-6">
            Vas a cancelar tu reservación en{' '}
            <span className="font-semibold text-ink">
              {restaurantName}
            </span>
            . Esta acción cambiará su estado a cancelada.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-2">
          <label
            htmlFor={`cancel-reason-${reservationId}`}
            className="text-sm font-semibold text-ink"
          >
            Motivo de cancelación{' '}
            <span className="font-normal text-muted-foreground">
              (opcional)
            </span>
          </label>

          <Textarea
            id={`cancel-reason-${reservationId}`}
            value={reason}
            onChange={(event) =>
              setReason(
                event.target.value
              )
            }
            maxLength={500}
            rows={4}
            disabled={isCancelling}
            placeholder="Ej. Surgió un cambio de planes..."
            className="min-h-24 resize-none rounded-xl"
          />

          <p className="text-right text-xs text-muted-foreground">
            {reason.length}/500
          </p>
        </div>

        {errorMessage && (
          <div
            role="alert"
            className="rounded-xl border border-danger/25 bg-danger-soft px-3 py-2.5 text-xs leading-5 text-danger"
          >
            {errorMessage}
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel
            disabled={isCancelling}
            className="rounded-xl"
          >
            Volver
          </AlertDialogCancel>

          <Button
            type="button"
            variant="destructive"
            disabled={isCancelling}
            onClick={handleCancel}
            className="rounded-xl"
          >
            {isCancelling ? (
              <>
                <LoaderCircle className="h-4 w-4 animate-spin" />
                Cancelando...
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4" />
                Sí, cancelar
              </>
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
