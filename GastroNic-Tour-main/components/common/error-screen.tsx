'use client';

import { useEffect } from 'react';

import Link from 'next/link';

import { RefreshCw, TriangleAlert } from 'lucide-react';

import { RouteState } from '@/components/common/route-state';
import { Button } from '@/components/ui/button';

/*
 * GastroNic DS · Pantalla de error de ruta (etapa 3)
 *
 * Se usa en los error.tsx de cada área. No muestra el mensaje
 * técnico (puede revelar detalles internos); solo el código de
 * referencia que Next.js asigna, útil para soporte.
 */
interface ErrorScreenProps {
  error: Error & { digest?: string };
  reset: () => void;
  homeHref: string;
  homeLabel: string;
}

export function ErrorScreen({ error, reset, homeHref, homeLabel }: ErrorScreenProps) {
  useEffect(() => {
    console.error('Error de ruta:', error);
  }, [error]);

  return (
    <RouteState
      visual={
        <div aria-hidden="true" className="flex size-20 items-center justify-center rounded-sheet bg-warning-soft text-warning">
          <TriangleAlert className="size-10" strokeWidth={1.75} />
        </div>
      }
      eyebrow="Algo salió mal"
      title="No pudimos cargar esta página"
      description="Fue un problema de nuestro lado o de la conexión. Intenta de nuevo; si sigue pasando, vuelve en unos minutos."
      actions={
        <>
          <Button size="lg" onClick={() => reset()}>
            <RefreshCw aria-hidden="true" />
            Intentar de nuevo
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href={homeHref}>{homeLabel}</Link>
          </Button>
        </>
      }
      footnote={
        error.digest ? (
          <p>
            Código de referencia:{' '}
            <code className="rounded-chip bg-surface-2 px-1.5 py-0.5 font-mono text-ink">{error.digest}</code>
          </p>
        ) : null
      }
    />
  );
}
