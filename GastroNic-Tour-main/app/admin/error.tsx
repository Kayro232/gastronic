'use client';

import { ErrorScreen } from '@/components/common/error-screen';
import { MinimalBrandHeader } from '@/components/common/route-state';

/*
 * Error en la consola de administración: sin la cabecera del
 * viajero y con un camino de vuelta a la consola.
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
      <MinimalBrandHeader href="/admin/dashboard" />
      <main id="contenido">
        <ErrorScreen error={error} reset={reset} homeHref="/admin/dashboard" homeLabel="Volver a la consola" />
      </main>
    </div>
  );
}
