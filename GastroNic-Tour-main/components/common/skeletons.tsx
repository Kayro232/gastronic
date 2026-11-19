import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

/*
 * GastroNic DS · Esqueletos de carga (etapa 2)
 *
 * Respetan la forma final del contenido para que nada salte
 * de lugar al llegar los datos. Se anuncian una sola vez a
 * lectores de pantalla con role="status".
 */

export function RestaurantCardSkeleton({
  className,
}: {
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'overflow-hidden rounded-card border border-line bg-surface',
        className
      )}
    >
      <Skeleton className="aspect-[4/3] w-full rounded-none" />
      <div className="space-y-2.5 p-4">
        <div className="flex items-center justify-between gap-3">
          <Skeleton className="h-5 w-3/5" />
          <Skeleton className="h-4 w-12" />
        </div>
        <Skeleton className="h-4 w-2/5" />
        <div className="border-t border-line pt-3">
          <div className="flex justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-10" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function RestaurantGridSkeleton({
  count = 6,
  label = 'Cargando restaurantes',
  className,
}: {
  count?: number;
  label?: string;
  className?: string;
}) {
  return (
    <div role="status" aria-live="polite" className={className}>
      <span className="sr-only">{label}</span>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: count }, (_, index) => (
          <RestaurantCardSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}

export function ListSkeleton({
  rows = 4,
  label = 'Cargando',
  className,
}: {
  rows?: number;
  label?: string;
  className?: string;
}) {
  return (
    <div role="status" aria-live="polite" className={cn('space-y-3', className)}>
      <span className="sr-only">{label}</span>
      {Array.from({ length: rows }, (_, index) => (
        <div
          key={index}
          aria-hidden="true"
          className="flex items-center gap-4 rounded-card border border-line bg-surface p-4"
        >
          <Skeleton className="size-12 flex-shrink-0 rounded-control" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-3.5 w-1/3" />
          </div>
          <Skeleton className="h-7 w-24 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function PageSkeleton({
  label = 'Cargando página',
}: {
  label?: string;
}) {
  return (
    <div role="status" aria-live="polite" className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <span className="sr-only">{label}</span>
      <div aria-hidden="true" className="space-y-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-9 w-2/3 max-w-xl" />
        <Skeleton className="h-4 w-1/2 max-w-md" />
      </div>
      <RestaurantGridSkeleton className="mt-10" count={6} label={label} />
    </div>
  );
}

/* ========================================================== */
/* ESTRUCTURAS DE PÁGINA (etapa 3)                            */
/* Reproducen la forma de cada cabecera para que la carga no  */
/* produzca saltos al aparecer la página real.                */
/* ========================================================== */

export function TravelerShellSkeleton({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <div aria-hidden="true" className="border-b border-line bg-white">
        <div className="mx-auto flex h-[var(--header-h)] max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
          <Skeleton className="size-10 rounded-control" />
          <Skeleton className="hidden h-4 w-28 sm:block" />
          <Skeleton className="ml-auto hidden h-10 w-[360px] rounded-full md:block" />
          <Skeleton className="size-11 rounded-full" />
        </div>
      </div>
      {children}
    </div>
  );
}

export function PanelShellSkeleton({
  label = 'Cargando panel',
}: {
  label?: string;
}) {
  return (
    <div className="flex min-h-screen bg-canvas">
      <div aria-hidden="true" className="hidden w-[264px] flex-shrink-0 border-r border-line bg-white lg:block">
        <div className="flex h-[var(--header-h)] items-center gap-2.5 border-b border-line px-4">
          <Skeleton className="size-9 rounded-control" />
          <div className="space-y-1.5">
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="h-3 w-20 rounded-full" />
          </div>
        </div>
        <div className="space-y-2 p-4">
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} className="h-9 w-full rounded-control" />
          ))}
        </div>
      </div>

      <div className="min-w-0 flex-1">
        <div aria-hidden="true" className="flex h-[var(--header-h)] items-center justify-between border-b border-line bg-white px-4 sm:px-6 lg:px-8">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-11 w-36 rounded-full" />
        </div>

        <div role="status" aria-live="polite" className="space-y-6 px-4 py-8 sm:px-6 lg:px-8">
          <span className="sr-only">{label}</span>
          <div aria-hidden="true" className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-80 max-w-full" />
          </div>
          <div aria-hidden="true" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="space-y-3 rounded-card border border-line bg-white p-5">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-7 w-16" />
              </div>
            ))}
          </div>
          <div aria-hidden="true">
            <ListSkeleton rows={4} label={label} />
          </div>
        </div>
      </div>
    </div>
  );
}

export function RestaurantDetailSkeleton() {
  return (
    <div role="status" aria-live="polite" className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <span className="sr-only">Cargando restaurante</span>
      <div aria-hidden="true">
        <Skeleton className="aspect-[16/9] w-full rounded-sheet sm:aspect-[21/9]" />
        <div className="mt-6 grid gap-8 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-4">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-10 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
            <div className="flex gap-2 pt-2">
              <Skeleton className="h-11 w-36 rounded-control" />
              <Skeleton className="h-11 w-32 rounded-control" />
            </div>
            <Skeleton className="mt-6 h-40 w-full rounded-card" />
          </div>
          <Skeleton className="hidden h-72 w-full rounded-card xl:block" />
        </div>
      </div>
    </div>
  );
}
