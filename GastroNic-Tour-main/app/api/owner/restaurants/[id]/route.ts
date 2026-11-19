import {
  NextRequest,
  NextResponse,
} from 'next/server';

import {
  createClient,
} from '@/lib/supabase/server';

import {
  createClient as createAdminClient,
  type SupabaseClient,
} from '@supabase/supabase-js';

const RESTAURANT_IMAGE_BUCKET =
  'restaurant-images';

const MENU_IMAGE_BUCKET =
  'menu-images';

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const {
      id: restaurantId,
    } =
      await context.params;

    /*
     * 1. Validar UUID.
     */
    if (
      !isValidUuid(
        restaurantId
      )
    ) {
      return NextResponse.json(
        {
          error:
            'El restaurante indicado no es válido.',
        },
        {
          status: 400,
        }
      );
    }

    /*
     * 2. Cliente Supabase del usuario.
     * Este cliente respeta Auth + RLS.
     */
    const supabase =
      await createClient();

    const {
      data: {
        user,
      },
      error:
        authError,
    } =
      await supabase.auth.getUser();

    if (
      authError ||
      !user
    ) {
      return NextResponse.json(
        {
          error:
            'Debes iniciar sesión para eliminar un restaurante.',
        },
        {
          status: 401,
        }
      );
    }

    /*
     * 3. Obtener confirmación enviada
     * desde la interfaz.
     */
    const body =
      await request
        .json()
        .catch(
          () => null
        );

    const confirmation =
      typeof body?.confirmation ===
      'string'
        ? body.confirmation
        : '';

    /*
     * 4. Obtener restaurante.
     */
    const {
      data:
        restaurant,
      error:
        restaurantError,
    } =
      await supabase
        .from(
          'restaurants'
        )
        .select(`
          id,
          name,
          created_by
        `)
        .eq(
          'id',
          restaurantId
        )
        .maybeSingle();

    if (
      restaurantError
    ) {
      console.error(
        'Error consultando restaurante:',
        restaurantError
      );

      return NextResponse.json(
        {
          error:
            'No se pudo verificar el restaurante.',
        },
        {
          status: 500,
        }
      );
    }

    if (
      !restaurant
    ) {
      return NextResponse.json(
        {
          error:
            'El restaurante no existe o no tienes permisos para verlo.',
        },
        {
          status: 404,
        }
      );
    }

    /*
     * 5. Confirmar nombre.
     */
    if (
      confirmation !==
      restaurant.name
    ) {
      return NextResponse.json(
        {
          error:
            'El nombre de confirmación no coincide con el restaurante.',
        },
        {
          status: 400,
        }
      );
    }

    /*
     * 6. Verificar que sea owner actual
     * (según restaurant_members) o administrador.
     *
     * Antes se comparaba con created_by, que deja
     * fuera al owner real cuando el restaurante
     * cambió de manos (hallazgo GN-02).
     * is_restaurant_owner ya incluye a los admin.
     */
    const {
      data:
        isOwnerResult,
      error:
        ownerError,
    } =
      await supabase.rpc(
        'is_restaurant_owner',
        {
          target_restaurant_id:
            restaurantId,
        }
      );

    if (
      ownerError
    ) {
      console.error(
        'Error verificando permisos de propietario:',
        ownerError
      );

      return NextResponse.json(
        {
          error:
            'No se pudieron verificar tus permisos.',
        },
        {
          status: 500,
        }
      );
    }

    if (
      isOwnerResult !==
      true
    ) {
      return NextResponse.json(
        {
          error:
            'No tienes permisos para eliminar este restaurante.',
        },
        {
          status: 403,
        }
      );
    }

    /*
     * 7. Comprobar reservaciones activas.
     *
     * La RPC también lo comprueba,
     * pero esto permite mostrar un
     * mensaje más claro al usuario.
     */
    const {
      count:
        activeReservations,
      error:
        reservationsError,
    } =
      await supabase
        .from(
          'reservations'
        )
        .select(
          'id',
          {
            count:
              'exact',
            head: true,
          }
        )
        .eq(
          'restaurant_id',
          restaurantId
        )
        .in(
          'status',
          [
            'pending',
            'confirmed',
          ]
        );

    if (
      reservationsError
    ) {
      console.error(
        'Error verificando reservaciones activas:',
        reservationsError
      );

      return NextResponse.json(
        {
          error:
            'No se pudieron verificar las reservaciones del restaurante.',
        },
        {
          status: 500,
        }
      );
    }

    if (
      (
        activeReservations ??
        0
      ) >
      0
    ) {
      return NextResponse.json(
        {
          error:
            `No puedes eliminar este restaurante porque tiene ${activeReservations} reservación(es) activa(s). Debes completarlas o cancelarlas primero.`,
        },
        {
          status: 409,
        }
      );
    }

    /*
     * 8. Preparar cliente administrativo.
     *
     * Este cliente se utiliza SOLO
     * desde esta API del servidor
     * para limpiar Storage después
     * de eliminar el restaurante.
     */
    const supabaseUrl =
      process.env
        .NEXT_PUBLIC_SUPABASE_URL;

    const supabaseSecretKey =
      process.env
        .SUPABASE_SECRET_KEY;

    if (
      !supabaseUrl ||
      !supabaseSecretKey
    ) {
      console.error(
        'Falta la configuración administrativa de Supabase.'
      );

      return NextResponse.json(
        {
          error:
            'El servidor no está configurado correctamente para eliminar restaurantes.',
        },
        {
          status: 500,
        }
      );
    }

    const supabaseAdmin =
      createAdminClient(
        supabaseUrl,
        supabaseSecretKey,
        {
          auth: {
            persistSession:
              false,
            autoRefreshToken:
              false,
            detectSessionInUrl:
              false,
          },
        }
      );

    /*
     * 9. Eliminar PRIMERO el restaurante
     * mediante la RPC protegida.
     *
     * La RPC vuelve a verificar:
     * - permisos
     * - ownership
     * - reservaciones activas
     * - concurrencia
     */
    const {
      error:
        deleteError,
    } =
      await supabase.rpc(
        'delete_owned_restaurant',
        {
          p_restaurant_id:
            restaurantId,
        }
      );

    if (
      deleteError
    ) {
      console.error(
        'Error eliminando restaurante:',
        deleteError
      );

      /*
       * Solo se reenvían al usuario los mensajes
       * escritos a propósito en la RPC (RAISE EXCEPTION,
       * código P0001). Cualquier otro error interno
       * de la base de datos se oculta (hallazgo GN-37).
       */
      const isBusinessRuleError =
        deleteError.code ===
        'P0001';

      return NextResponse.json(
        {
          error:
            isBusinessRuleError &&
            deleteError.message
              ? deleteError.message
              : 'No se pudo eliminar el restaurante.',
        },
        {
          status:
            isBusinessRuleError
              ? 409
              : 500,
        }
      );
    }

    /*
     * 10. El restaurante ya fue
     * eliminado de PostgreSQL.
     *
     * Ahora limpiamos TODA su carpeta
     * de Storage, incluyendo posibles
     * archivos huérfanos.
     */
    const restaurantImagesCleaned =
      await cleanupStorageFolder(
        supabaseAdmin,
        RESTAURANT_IMAGE_BUCKET,
        restaurantId
      );

    const menuImagesCleaned =
      await cleanupStorageFolder(
        supabaseAdmin,
        MENU_IMAGE_BUCKET,
        restaurantId
      );

    const storageCleanupFailed =
      !restaurantImagesCleaned ||
      !menuImagesCleaned;

    /*
     * Si Storage falla, no devolvemos
     * error de eliminación porque el
     * restaurante YA fue eliminado.
     */
    return NextResponse.json(
      {
        ok: true,
        storageCleanupPending:
          storageCleanupFailed,
      }
    );
  } catch (
    error
  ) {
    console.error(
      'Error inesperado eliminando restaurante:',
      error
    );

    return NextResponse.json(
      {
        error:
          'Ocurrió un error inesperado al eliminar el restaurante.',
      },
      {
        status: 500,
      }
    );
  }
}

function isValidUuid(
  value: string
) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

/*
 * Limpia todos los archivos que estén
 * dentro de:
 *
 * bucket/<restaurantId>/
 *
 * No depende de restaurant_images ni
 * menu_items, por lo que también elimina
 * archivos huérfanos de uploads fallidos.
 */
async function cleanupStorageFolder(
  supabaseAdmin: SupabaseClient,
  bucket: string,
  restaurantId: string
) {
  try {
    /*
     * Siempre listamos desde offset 0.
     *
     * Después de eliminar cada lote,
     * los siguientes archivos pasan al
     * principio de la carpeta.
     */
    while (true) {
      const {
        data:
          files,
        error:
          listError,
      } =
        await supabaseAdmin.storage
          .from(
            bucket
          )
          .list(
            restaurantId,
            {
              limit: 1000,
              offset: 0,
            }
          );

      if (
        listError
      ) {
        console.error(
          `Error listando archivos de ${bucket}:`,
          listError
        );

        return false;
      }

      const paths =
        (
          files ??
          []
        )
          .filter(
            (file) =>
              Boolean(
                file.id
              )
          )
          .map(
            (file) =>
              `${restaurantId}/${file.name}`
          );

      /*
       * Carpeta limpia.
       */
      if (
        paths.length ===
        0
      ) {
        return true;
      }

      const {
        error:
          removeError,
      } =
        await supabaseAdmin.storage
          .from(
            bucket
          )
          .remove(
            paths
          );

      if (
        removeError
      ) {
        console.error(
          `Error limpiando carpeta de ${bucket}:`,
          removeError
        );

        return false;
      }

      /*
       * Si había menos de 1000 archivos,
       * ya sabemos que terminamos.
       */
      if (
        paths.length <
        1000
      ) {
        return true;
      }
    }
  } catch (
    error
  ) {
    console.error(
      `Error inesperado limpiando Storage (${bucket}):`,
      error
    );

    return false;
  }
}