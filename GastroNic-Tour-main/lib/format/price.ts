/*
 * Formato único de precios de GastroNic.
 *
 * - Si hay rango estimado real, se muestra en córdobas:
 *   "C$250 – C$500", "Desde C$250" o "Hasta C$500".
 * - Si no hay rango, se muestra el nivel de precio con la
 *   convención "$" a "$$$$" (la misma de explorar y del
 *   detalle del restaurante).
 * - Si no hay ningún dato, devuelve null para que la interfaz
 *   no muestre nada en lugar de inventar un nivel.
 */

function formatCordobas(value: number) {
  return `C$${Number(value).toLocaleString('es-NI')}`;
}

function isValidAmount(value: number | null | undefined): value is number {
  return value !== null && value !== undefined && Number.isFinite(Number(value));
}

export function formatPriceLevel(
  priceLevel: number | null | undefined
): string | null {
  const level = Number(priceLevel);

  if (!Number.isFinite(level) || level < 1) {
    return null;
  }

  return '$'.repeat(Math.min(Math.round(level), 4));
}

export function formatPriceRange(
  min: number | null | undefined,
  max: number | null | undefined,
  priceLevel?: number | null
): string | null {
  const hasMin = isValidAmount(min);
  const hasMax = isValidAmount(max);

  if (hasMin && hasMax) {
    return Number(min) === Number(max)
      ? formatCordobas(min)
      : `${formatCordobas(min)} – ${formatCordobas(max)}`;
  }

  if (hasMin) {
    return `Desde ${formatCordobas(min)}`;
  }

  if (hasMax) {
    return `Hasta ${formatCordobas(max)}`;
  }

  return formatPriceLevel(priceLevel);
}
