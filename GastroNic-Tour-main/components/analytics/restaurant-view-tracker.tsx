'use client';

import {
  useEffect,
} from 'react';

import { createClient } from '@/lib/supabase/client';

const supabase =
  createClient();

/* ========================================================== */
/* TYPES                                                      */
/* ========================================================== */

interface RestaurantViewTrackerProps {
  restaurantId: string;
}

/* ========================================================== */
/* COMPONENT                                                  */
/* ========================================================== */

export function RestaurantViewTracker({
  restaurantId,
}: RestaurantViewTrackerProps) {
  useEffect(() => {
    let cancelled =
      false;

    async function registerRestaurantView() {
      if (
        !restaurantId
      ) {
        return;
      }

      /* ====================================================== */
      /* SESSION                                                */
      /* ====================================================== */

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
          'Error obteniendo sesión para registrar vista:',
          sessionError
        );

        return;
      }

      const user =
        session?.user;

      /*
       * Si no hay sesión, no registramos comportamiento.
       */
      if (
        !user
      ) {
        return;
      }

      /* ====================================================== */
      /* SESSION DEDUPLICATION                                  */
      /* ====================================================== */

      const storageKey =
        `gastronic:restaurant-view:${user.id}:${restaurantId}`;

      try {
        const alreadyTracked =
          window.sessionStorage.getItem(
            storageKey
          );

        if (
          alreadyTracked
        ) {
          return;
        }

        /*
         * Lo marcamos ANTES del insert.
         *
         * Esto evita que React Strict Mode
         * lance dos inserts simultáneos
         * durante desarrollo.
         */
        window.sessionStorage.setItem(
          storageKey,
          'pending'
        );
      } catch {
        /*
         * Si sessionStorage no está disponible,
         * igualmente intentamos registrar el evento.
         */
      }

      /* ====================================================== */
      /* INSERT EVENT                                           */
      /* ====================================================== */

      const {
        error:
          insertError,
      } =
        await supabase
          .from(
            'user_activity_events'
          )
          .insert({
            user_id:
              user.id,

            event_type:
              'restaurant_view',

            source:
              'restaurant_detail',

            restaurant_id:
              restaurantId,

            metadata:
              {},
          });

      if (
        cancelled
      ) {
        return;
      }

      if (
        insertError
      ) {
        console.error(
          'Error registrando restaurant_view:',
          insertError
        );

        /*
         * Permitimos reintentar si falló.
         */
        try {
          window.sessionStorage.removeItem(
            storageKey
          );
        } catch {
          // Sin acción.
        }

        return;
      }

      try {
        window.sessionStorage.setItem(
          storageKey,
          'tracked'
        );
      } catch {
        // Sin acción.
      }
    }

    registerRestaurantView();

    return () => {
      cancelled =
        true;
    };
  }, [
    restaurantId,
  ]);

  /*
   * Este componente no dibuja nada.
   */
  return null;
}