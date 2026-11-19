'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import {
  AlertTriangle,
  CheckCircle2,
  LoaderCircle,
  ShieldCheck,
  X,
  XCircle,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { getUserFacingErrorMessage } from '@/lib/supabase/errors';

const supabase = createClient();

interface RestaurantReviewActionsProps {
  restaurantId: string;
  restaurantName: string;
  status: string;
}

export function RestaurantReviewActions({
  restaurantId,
  restaurantName,
  status,
}: RestaurantReviewActionsProps) {
  const router = useRouter();

  const [
    showRejectModal,
    setShowRejectModal,
  ] = useState(false);

  const [reason, setReason] =
    useState('');

  const [
    errorMessage,
    setErrorMessage,
  ] = useState('');

  const [
    successMessage,
    setSuccessMessage,
  ] = useState('');

  const [
    isApproving,
    setIsApproving,
  ] = useState(false);

  const [
    isRejecting,
    setIsRejecting,
  ] = useState(false);

  async function handleApprove() {
    setErrorMessage('');
    setSuccessMessage('');
    setIsApproving(true);

    try {
      const { error } =
        await supabase.rpc(
          'approve_restaurant',
          {
            p_restaurant_id:
              restaurantId,
          }
        );

      if (error) {
        console.error(
          'Error aprobando restaurante:',
          error
        );

        setErrorMessage(
          getUserFacingErrorMessage(error, 'No se pudo aprobar el restaurante.')
        );

        return;
      }

      setSuccessMessage(
        `"${restaurantName}" fue aprobado correctamente.`
      );

      router.refresh();
    } catch (error) {
      console.error(
        'Error inesperado aprobando restaurante:',
        error
      );

      setErrorMessage(
        'Ocurrió un error inesperado.'
      );
    } finally {
      setIsApproving(false);
    }
  }

  async function handleReject() {
    setErrorMessage('');
    setSuccessMessage('');

    const cleanReason =
      reason.trim();

    if (cleanReason.length < 5) {
      setErrorMessage(
        'Escribe un motivo de rechazo más detallado.'
      );

      return;
    }

    setIsRejecting(true);

    try {
      const { error } =
        await supabase.rpc(
          'reject_restaurant',
          {
            p_restaurant_id:
              restaurantId,

            p_reason:
              cleanReason,
          }
        );

      if (error) {
        console.error(
          'Error rechazando restaurante:',
          error
        );

        setErrorMessage(
          getUserFacingErrorMessage(error, 'No se pudo rechazar la solicitud.')
        );

        return;
      }

      setShowRejectModal(false);
      setReason('');

      setSuccessMessage(
        `La solicitud de "${restaurantName}" fue rechazada correctamente.`
      );

      router.refresh();
    } catch (error) {
      console.error(
        'Error inesperado rechazando restaurante:',
        error
      );

      setErrorMessage(
        'Ocurrió un error inesperado.'
      );
    } finally {
      setIsRejecting(false);
    }
  }

  const isPending =
    status === 'pending';

  return (
    <>
      <section className="overflow-hidden rounded-sheet border border-border/70 bg-white shadow-none">
        {/* Header */}
        <div className="border-b border-border/60 bg-canvas px-5 py-5 sm:px-6">
          <div className="flex items-start gap-3">
            <div
              className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${
                isPending
                  ? 'bg-warning-soft text-warning'
                  : 'bg-primary/10 text-action'
              }`}
            >
              {isPending ? (
                <AlertTriangle className="h-4 w-4" />
              ) : (
                <ShieldCheck className="h-4 w-4" />
              )}
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.08em] text-action">
                Decisión administrativa
              </p>

              <h3 className="mt-1 text-base font-bold text-ink">
                {isPending
                  ? 'Revisa y toma una decisión'
                  : 'Solicitud procesada'}
              </h3>

              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                {isPending
                  ? 'Aprueba el restaurante si cumple los requisitos o recházalo indicando claramente qué debe corregirse.'
                  : 'Esta solicitud ya recibió una decisión administrativa.'}
              </p>
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-6">
          {errorMessage && (
            <div
              role="alert"
              className="mb-4 flex items-start gap-3 rounded-2xl border border-danger/25 bg-danger-soft p-4 text-sm text-danger"
            >
              <XCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />

              <span>
                {errorMessage}
              </span>
            </div>
          )}

          {successMessage && (
            <div
              role="status"
              className="mb-4 flex items-start gap-3 rounded-2xl border border-success/25 bg-success-soft p-4 text-sm text-success"
            >
              <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0" />

              <span>
                {successMessage}
              </span>
            </div>
          )}

          {isPending ? (
            <div className="space-y-3">
              <Button
                type="button"
                onClick={handleApprove}
                disabled={
                  isApproving ||
                  isRejecting
                }
                className="h-12 w-full rounded-xl bg-emerald-600 font-bold text-white shadow-overlay transition hover:-translate-y-0.5 hover:bg-emerald-700"
              >
                {isApproving ? (
                  <>
                    <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                    Aprobando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Aprobar restaurante
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setErrorMessage('');
                  setShowRejectModal(true);
                }}
                disabled={
                  isApproving ||
                  isRejecting
                }
                className="h-12 w-full rounded-xl border-danger/25 bg-white font-bold text-danger transition hover:bg-danger-soft hover:text-danger"
              >
                <XCircle className="mr-2 h-4 w-4" />

                Rechazar solicitud
              </Button>

              <p className="pt-1 text-center text-xs leading-4 text-muted-foreground">
                Ambas acciones quedarán reflejadas en el estado del restaurante.
              </p>
            </div>
          ) : (
            <div className="rounded-2xl bg-canvas p-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-action" />

                <p className="text-xs leading-5 text-muted-foreground">
                  No hay acciones pendientes para esta solicitud.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ====================================================== */}
      {/* REJECT MODAL                                          */}
      {/* ====================================================== */}

      {showRejectModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#071816]/65 p-4 backdrop-blur-[3px]"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget &&
              !isRejecting
            ) {
              setShowRejectModal(false);
            }
          }}
        >
          <div className="w-full max-w-lg overflow-hidden rounded-sheet border border-border/70 bg-white shadow-overlay">
            {/* Modal header */}
            <div className="flex items-start justify-between gap-4 border-b border-border/60 bg-canvas px-6 py-5">
              <div className="flex gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-danger-soft">
                  <XCircle className="h-4 w-4 text-danger" />
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.08em] text-danger">
                    Rechazar solicitud
                  </p>

                  <h2 className="mt-1 text-xl font-bold tracking-[-0.02em] text-ink">
                    Indica qué debe corregirse
                  </h2>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowRejectModal(false)
                }
                disabled={isRejecting}
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-muted-foreground transition hover:bg-white hover:text-ink disabled:opacity-50"
                aria-label="Cerrar modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="rounded-2xl border border-warning/25 bg-amber-50/70 p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-warning" />

                  <p className="text-xs leading-5 text-warning">
                    El propietario verá este mensaje. Explica de forma concreta
                    qué información debe modificar antes de volver a enviar la
                    solicitud.
                  </p>
                </div>
              </div>

              <div className="mt-5">
                <div className="flex items-center justify-between gap-4">
                  <label
                    htmlFor="rejection-reason"
                    className="text-sm font-bold text-ink"
                  >
                    Motivo del rechazo
                  </label>

                  <span className="text-xs font-medium text-muted-foreground">
                    {reason.length}/1500
                  </span>
                </div>

                <textarea
                  id="rejection-reason"
                  value={reason}
                  onChange={(event) =>
                    setReason(
                      event.target.value
                    )
                  }
                  rows={7}
                  maxLength={1500}
                  disabled={isRejecting}
                  autoFocus
                  placeholder="Ej. La dirección indicada no permite ubicar correctamente el establecimiento. Agrega una referencia más específica..."
                  className="mt-2 w-full resize-none rounded-2xl border border-border/80 bg-canvas p-4 text-sm leading-6 text-ink outline-none transition placeholder:text-muted-foreground/55 hover:border-danger/25 hover:bg-white focus:border-red-300 focus:bg-white focus:ring-4 focus:ring-red-100/70 disabled:opacity-60"
                />

                <p className="mt-2 text-xs text-muted-foreground">
                  Mínimo 5 caracteres. Entre más claro sea el mensaje, más fácil
                  será para el propietario corregirlo.
                </p>
              </div>

              {errorMessage && (
                <div className="mt-4 flex items-start gap-3 rounded-xl border border-danger/25 bg-danger-soft p-3 text-sm text-danger">
                  <XCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />

                  {errorMessage}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex flex-col-reverse gap-3 border-t border-border/60 bg-canvas px-6 py-5 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                disabled={isRejecting}
                onClick={() =>
                  setShowRejectModal(false)
                }
                className="h-10 rounded-xl border-border bg-white px-5"
              >
                Cancelar
              </Button>

              <Button
                type="button"
                disabled={isRejecting}
                onClick={handleReject}
                className="h-10 rounded-xl bg-red-600 px-5 font-bold text-white shadow-overlay hover:bg-red-700"
              >
                {isRejecting ? (
                  <>
                    <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />

                    Rechazando...
                  </>
                ) : (
                  <>
                    <XCircle className="mr-2 h-4 w-4" />

                    Confirmar rechazo
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}