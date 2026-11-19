'use client';

import {
  useState,
} from 'react';

import {
  useRouter,
} from 'next/navigation';

import {
  AlertTriangle,
  LoaderCircle,
  Trash2,
} from 'lucide-react';

import {
  Button,
} from '@/components/ui/button';

/* ========================================================== */
/* TYPES                                                      */
/* ========================================================== */

interface DeleteRestaurantCardProps {
  restaurantId:
    string;

  restaurantName:
    string;
}

/* ========================================================== */
/* COMPONENT                                                  */
/* ========================================================== */

export function DeleteRestaurantCard({
  restaurantId,
  restaurantName,
}: DeleteRestaurantCardProps) {
  const router =
    useRouter();

  const [
    isOpen,
    setIsOpen,
  ] =
    useState(false);

  const [
    confirmation,
    setConfirmation,
  ] =
    useState('');

  const [
    isDeleting,
    setIsDeleting,
  ] =
    useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] =
    useState('');

  /* ======================================================== */
  /* STATE                                                    */
  /* ======================================================== */

  const confirmationMatches =
    confirmation ===
    restaurantName;

  /* ======================================================== */
  /* CLOSE                                                    */
  /* ======================================================== */

  function handleClose() {
    if (
      isDeleting
    ) {
      return;
    }

    setIsOpen(
      false
    );

    setConfirmation(
      ''
    );

    setErrorMessage(
      ''
    );
  }

  /* ======================================================== */
  /* DELETE                                                   */
  /* ======================================================== */

  async function handleDelete() {
    if (
      !confirmationMatches ||
      isDeleting
    ) {
      return;
    }

    setErrorMessage(
      ''
    );

    setIsDeleting(
      true
    );

    try {
      const response =
        await fetch(
          `/api/owner/restaurants/${restaurantId}`,
          {
            method:
              'DELETE',

            headers: {
              'Content-Type':
                'application/json',
            },

            body:
              JSON.stringify({
                confirmation,
              }),
          }
        );

      const result =
        await response
          .json()
          .catch(
            () => null
          );

      if (
        !response.ok
      ) {
        const message =
          typeof result?.error ===
          'string'
            ? result.error
            : 'No se pudo eliminar el restaurante.';

        setErrorMessage(
          message
        );

        return;
      }

      router.replace(
        '/owner/restaurants'
      );

      router.refresh();
    } catch (
      error
    ) {
      console.error(
        'Error inesperado eliminando restaurante:',
        error
      );

      setErrorMessage(
        'Ocurrió un error inesperado al eliminar el restaurante.'
      );
    } finally {
      setIsDeleting(
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
      {/* DANGER CARD                                            */}
      {/* ====================================================== */}

      <section className="overflow-hidden rounded-card border border-danger/25 bg-white shadow-sm">
        <div className="border-b border-danger/25 bg-red-50/60 px-5 py-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-danger" />

            <p className="text-xs font-bold uppercase tracking-[0.08em] text-danger">
              Zona peligrosa
            </p>
          </div>
        </div>

        <div className="p-5">
          <h3 className="text-sm font-bold text-ink">
            Eliminar restaurante
          </h3>

          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            Elimina permanentemente este restaurante, sus fotografías almacenadas
            y la información relacionada con él.
          </p>

          <div className="mt-4 rounded-xl border border-danger/25 bg-red-50/50 px-3.5 py-3">
            <p className="text-xs leading-5 text-danger">
              No podrás eliminarlo mientras tenga reservaciones pendientes o
              confirmadas.
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setIsOpen(
                true
              );

              setErrorMessage(
                ''
              );
            }}
            className="mt-5 h-10 w-full rounded-xl border-danger/25 text-xs font-bold text-danger hover:bg-danger-soft hover:text-danger"
          >
            <Trash2 className="mr-2 h-4 w-4" />

            Eliminar restaurante
          </Button>
        </div>
      </section>

      {/* ====================================================== */}
      {/* MODAL                                                  */}
      {/* ====================================================== */}

      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Cerrar confirmación"
            onClick={
              handleClose
            }
            className="absolute inset-0 bg-[#061513]/60 backdrop-blur-[3px]"
          />

          <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-sheet border border-danger/25 bg-white shadow-overlay">
            <div className="border-b border-danger/25 bg-red-50/50 px-6 py-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-danger-soft text-danger">
                <AlertTriangle className="h-5 w-5" />
              </div>

              <p className="mt-5 text-xs font-bold uppercase tracking-[0.08em] text-danger">
                Acción permanente
              </p>

              <h2 className="mt-1 text-xl font-bold tracking-[-0.025em] text-ink">
                Eliminar {restaurantName}
              </h2>
            </div>

            <div className="p-6">
              <p className="text-sm leading-6 text-muted-foreground">
                Esta acción eliminará permanentemente el restaurante, sus
                fotografías almacenadas y los registros relacionados que
                correspondan.
              </p>

              <div className="mt-5 rounded-xl border border-danger/25 bg-red-50/50 p-4">
                <p className="text-xs font-semibold leading-5 text-danger">
                  Esta acción no se puede deshacer.
                </p>
              </div>

              <div className="mt-6">
                <label
                  htmlFor="restaurant-delete-confirmation"
                  className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground"
                >
                  Para confirmar, escribe
                </label>

                <p className="mt-1 text-sm font-bold text-ink">
                  {restaurantName}
                </p>

                <input
                  id="restaurant-delete-confirmation"
                  type="text"
                  value={
                    confirmation
                  }
                  onChange={(
                    event
                  ) => {
                    setConfirmation(
                      event.target.value
                    );

                    setErrorMessage(
                      ''
                    );
                  }}
                  disabled={
                    isDeleting
                  }
                  autoComplete="off"
                  placeholder={restaurantName}
                  className="mt-3 h-11 w-full rounded-xl border border-border bg-canvas px-4 text-sm text-ink outline-none transition placeholder:text-muted-foreground/40 focus:border-red-300 focus:bg-white focus:ring-4 focus:ring-red-100"
                />
              </div>

              {errorMessage && (
                <div className="mt-4 rounded-xl border border-danger/25 bg-danger-soft px-4 py-3 text-xs leading-5 text-danger">
                  {errorMessage}
                </div>
              )}

              <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  disabled={
                    isDeleting
                  }
                  onClick={
                    handleClose
                  }
                  className="h-11 rounded-xl px-5"
                >
                  Cancelar
                </Button>

                <Button
                  type="button"
                  disabled={
                    !confirmationMatches ||
                    isDeleting
                  }
                  onClick={
                    handleDelete
                  }
                  className="h-11 rounded-xl bg-red-600 px-5 font-bold text-white hover:bg-red-700 disabled:bg-red-300"
                >
                  {isDeleting ? (
                    <>
                      <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />

                      Eliminando...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />

                      Eliminar permanentemente
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
