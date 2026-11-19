'use client';

import { AlertTriangle, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';

/*
 * GastroNic DS · Error de carga (etapa 2)
 * Misma API que antes; solo cambia la presentación.
 */

interface DataLoadErrorProps {
  title: string;
  description: string;
  eyebrow?: string;
}

export function DataLoadError({
  title,
  description,
  eyebrow = 'No se pudieron cargar los datos',
}: DataLoadErrorProps) {
  const router = useRouter();

  return (
    <section
      role="alert"
      className="rounded-card border border-line bg-surface p-6 sm:p-8"
    >
      <div className="flex max-w-2xl flex-col items-start gap-4 sm:flex-row sm:gap-5">
        <div className="flex size-12 flex-shrink-0 items-center justify-center rounded-control bg-warning-soft text-warning">
          <AlertTriangle className="size-6" aria-hidden="true" />
        </div>

        <div className="min-w-0">
          <p className="text-overline text-warning">
            {eyebrow}
          </p>

          <h2 className="mt-1.5 text-xl font-semibold text-ink sm:text-2xl">
            {title}
          </h2>

          <p className="mt-2 text-[15px] leading-relaxed text-ink-muted">
            {description}
          </p>

          <Button
            type="button"
            onClick={() => router.refresh()}
            className="mt-5"
          >
            <RefreshCw aria-hidden="true" />
            Intentar de nuevo
          </Button>
        </div>
      </div>
    </section>
  );
}
