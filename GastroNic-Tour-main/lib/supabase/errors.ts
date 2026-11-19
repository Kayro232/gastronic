/*
 * Mensajes de error seguros para mostrar al usuario (hallazgo GN-37).
 *
 * Solo se muestran tal cual los mensajes que la base de datos genera
 * a propósito con RAISE EXCEPTION (código P0001), que ya están
 * redactados para el usuario. Cualquier otro error (RLS, restricciones,
 * errores internos) revela detalles de la base de datos y se reemplaza
 * por el mensaje genérico.
 *
 * Acepta `unknown` para poder usarse directamente con el valor de un
 * `catch`.
 */
export function getUserFacingErrorMessage(
  error: unknown,
  fallback: string
): string {
  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'P0001' &&
    'message' in error &&
    typeof error.message === 'string' &&
    error.message
  ) {
    return error.message;
  }

  return fallback;
}
