'use client';

import { ErrorScreen } from '@/components/common/error-screen';
import { MinimalBrandHeader } from '@/components/common/route-state';

/*
 * Error en el portal de restaurantes: sin la cabecera del viajero
 * y con un camino de vuelta al portal.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-canvas">
      <MinimalBrandHeader href="/owner/dashboard" />
      <main id="contenido">
        <ErrorScreen error={error} reset={reset} homeHref="/owner/dashboard" homeLabel="Volver al portal" />
      </main>
    </div>
  );
}
