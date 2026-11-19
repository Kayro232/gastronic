'use client';

import { useEffect } from 'react';

import './globals.css';

/*
 * Último recurso (etapa 3): reemplaza al layout raíz cuando este
 * mismo falla, así que no depende de ningún otro componente.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Error global:', error);
  }, [error]);

  return (
    <html lang="es">
      <body className="bg-canvas font-sans text-ink antialiased">
        <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-6 text-center">
          <p className="text-overline text-action">GastroNic Tour</p>
          <h1 className="mt-2 text-3xl font-bold">No pudimos cargar GastroNic</h1>
          <p className="mt-3 text-base leading-relaxed text-ink-muted">
            Ocurrió un error inesperado. Intenta de nuevo en unos segundos.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            className="mt-8 inline-flex h-12 items-center justify-center rounded-control bg-action px-6 text-base font-semibold text-white hover:bg-action-hover"
          >
            Intentar de nuevo
          </button>
          {error.digest && (
            <p className="mt-6 text-[13px] text-ink-muted">
              Código de referencia: <code className="font-mono">{error.digest}</code>
            </p>
          )}
        </main>
      </body>
    </html>
  );
}
