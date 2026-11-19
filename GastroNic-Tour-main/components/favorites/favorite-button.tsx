'use client';

import {
  type MouseEvent,
  useEffect,
  useState,
} from 'react';

import {
  Heart,
  LoaderCircle,
} from 'lucide-react';

import { createClient } from '@/lib/supabase/client';
import { notify } from '@/lib/notify';

const supabase =
  createClient();

/* ========================================================== */
/* TYPES                                                      */
/* ========================================================== */

interface FavoriteButtonProps {
  restaurantId: string;

  className?: string;

  iconClassName?: string;

  showLabel?: boolean;

  labelSaved?: string;

  labelUnsaved?: string;
}

/* ========================================================== */
/* COMPONENT                                                  */
/* ========================================================== */

export function FavoriteButton({
  restaurantId,
  className = '',
  iconClassName = 'h-4 w-4',
  showLabel = false,
  labelSaved = 'Guardado',
  labelUnsaved = 'Guardar',
}: FavoriteButtonProps) {
  const [
    isFavorite,
    setIsFavorite,
  ] =
    useState(false);

  const [
    isLoading,
    setIsLoading,
  ] =
    useState(true);

  const [
    isSaving,
    setIsSaving,
  ] =
    useState(false);

  const [
    userId,
    setUserId,
  ] =
    useState<
      string | null
    >(null);

  /* ======================================================== */
  /* LOAD                                                     */
  /* ======================================================== */

  useEffect(() => {
    let cancelled =
      false;

    async function loadFavorite() {
      setIsLoading(
        true
      );

      const {
        data: {
          session,
        },

        error:
          sessionError,
      } =
        await supabase.auth.getSession();

      if (
        cancelled
      ) {
        return;
      }

      if (
        sessionError
      ) {
        console.error(
          'Error obteniendo sesión:',
          sessionError
        );
      }

      const user =
        session?.user ??
        null;

      if (
        !user
      ) {
        setUserId(
          null
        );

        setIsFavorite(
          false
        );

        setIsLoading(
          false
        );

        return;
      }

      setUserId(
        user.id
      );

      const {
        data,
        error,
      } =
        await supabase
          .from(
            'favorites'
          )
          .select(
            'restaurant_id'
          )
          .eq(
            'user_id',
            user.id
          )
          .eq(
            'restaurant_id',
            restaurantId
          )
          .maybeSingle();

      if (
        cancelled
      ) {
        return;
      }

      if (
        error
      ) {
        console.error(
          'Error consultando favorito:',
          error
        );

        setIsFavorite(
          false
        );
      } else {
        setIsFavorite(
          Boolean(
            data
          )
        );
      }

      setIsLoading(
        false
      );
    }

    loadFavorite();

    return () => {
      cancelled =
        true;
    };
  }, [
    restaurantId,
  ]);

  /* ======================================================== */
  /* ACTIVITY EVENT                                           */
  /* ======================================================== */

  async function registerFavoriteEvent(
    eventType:
      | 'favorite_add'
      | 'favorite_remove'
  ) {
    if (
      !userId
    ) {
      return;
    }

    const {
      error,
    } =
      await supabase
        .from(
          'user_activity_events'
        )
        .insert({
          user_id:
            userId,

          event_type:
            eventType,

          source:
            'favorite_button',

          restaurant_id:
            restaurantId,

          metadata:
            {},
        });

    if (
      error
    ) {
      /*
       * IMPORTANTE:
       *
       * Un fallo del historial de comportamiento
       * NO debe deshacer un favorito real.
       */
      console.error(
        `Error registrando ${eventType}:`,
        error
      );
    }
  }

  /* ======================================================== */
  /* TOGGLE                                                   */
  /* ======================================================== */

  async function handleToggle(
    event:
      MouseEvent<HTMLButtonElement>
  ) {
    event.preventDefault();
    event.stopPropagation();

    if (
      isLoading ||
      isSaving
    ) {
      return;
    }

    /* ====================================================== */
    /* LOGIN                                                  */
    /* ====================================================== */

    if (
      !userId
    ) {
      const currentPath =
        `${window.location.pathname}${window.location.search}`;

      window.location.href =
        `/auth/login?next=${encodeURIComponent(
          currentPath
        )}`;

      return;
    }

    const previousValue =
      isFavorite;

    const nextValue =
      !previousValue;

    setIsSaving(
      true
    );

    /*
     * Optimistic UI.
     */
    setIsFavorite(
      nextValue
    );

    try {
      /* ==================================================== */
      /* ADD FAVORITE                                         */
      /* ==================================================== */

      if (
        nextValue
      ) {
        const {
          error,
        } =
          await supabase
            .from(
              'favorites'
            )
            .upsert(
              {
                user_id:
                  userId,

                restaurant_id:
                  restaurantId,
              },
              {
                onConflict:
                  'user_id,restaurant_id',
              }
            );

        if (
          error
        ) {
          throw error;
        }

        /*
         * Favorites ya fue actualizado.
         * Ahora registramos la señal V2.
         */
        await registerFavoriteEvent(
          'favorite_add'
        );

        return;
      }

      /* ==================================================== */
      /* REMOVE FAVORITE                                      */
      /* ==================================================== */

      const {
        error,
      } =
        await supabase
          .from(
            'favorites'
          )
          .delete()
          .eq(
            'user_id',
            userId
          )
          .eq(
            'restaurant_id',
            restaurantId
          );

      if (
        error
      ) {
        throw error;
      }

      /*
       * Favorites ya fue actualizado.
       * Ahora registramos la señal V2.
       */
      await registerFavoriteEvent(
        'favorite_remove'
      );
    } catch (
      error
    ) {
      console.error(
        'Error actualizando favorito:',
        error
      );

      /*
       * Solo restauramos el estado
       * si falló la operación REAL
       * de favoritos.
       */
      setIsFavorite(
        previousValue
      );

      notify.error(
        'No pudimos actualizar tus favoritos',
        {
          description:
            'Revisa tu conexión e intenta de nuevo.',
        }
      );
    } finally {
      setIsSaving(
        false
      );
    }
  }

  /* ======================================================== */
  /* RENDER                                                   */
  /* ======================================================== */

  const isBusy =
    isLoading ||
    isSaving;

  return (
    <button
      type="button"
      onClick={
        handleToggle
      }
      disabled={
        isBusy
      }
      aria-label={
        isFavorite
          ? 'Quitar de favoritos'
          : 'Guardar en favoritos'
      }
      aria-pressed={
        isFavorite
      }
      title={
        isFavorite
          ? 'Quitar de favoritos'
          : 'Guardar en favoritos'
      }
      className={`inline-flex items-center justify-center gap-2 transition ${
        isBusy
          ? 'cursor-wait'
          : ''
      } ${className}`}
    >
      {isBusy ? (
        <LoaderCircle
          className={`${iconClassName} animate-spin`}
        />
      ) : (
        <Heart
          className={`${iconClassName} transition ${
            isFavorite
              ? 'fill-red-500 text-red-500'
              : ''
          }`}
        />
      )}

      {showLabel && (
        <span>
          {isFavorite
            ? labelSaved
            : labelUnsaved}
        </span>
      )}
    </button>
  );
}