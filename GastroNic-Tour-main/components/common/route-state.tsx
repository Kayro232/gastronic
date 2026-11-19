import type { ReactNode } from 'react';

import Image from 'next/image';
import Link from 'next/link';

import type { LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

/*
 * GastroNic DS · Pantallas de estado de ruta (etapa 3)
 *
 * Estructura común para 404 y errores: una pieza visual, título,
 * explicación, acciones y, opcionalmente, accesos sugeridos.
 */

interface RouteStateProps {
  /* Pieza visual principal (número 404, ícono, etc.) */
  visual: ReactNode;
  eyebrow: string;
  title: string;
  description: string;
  actions: ReactNode;
  suggestions?: { href: string; label: string; icon: LucideIcon }[];
  footnote?: ReactNode;
  className?: string;
}

export function RouteState({
  visual,
  eyebrow,
  title,
  description,
  actions,
  suggestions,
  footnote,
  className,
}: RouteStateProps) {
  return (
    <section
      className={cn(
        'mx-auto flex w-full max-w-2xl flex-col items-center px-4 py-16 text-center sm:px-6 sm:py-24',
        className
      )}
    >
      {visual}

      <p className="mt-8 text-overline text-action">{eyebrow}</p>

      <h1 className="mt-2 text-balance text-3xl font-bold leading-tight text-ink sm:text-4xl">
        {title}
      </h1>

      <p className="mt-3 max-w-[48ch] text-pretty text-base leading-relaxed text-ink-muted">
        {description}
      </p>

      <div className="mt-8 flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row">
        {actions}
      </div>

      {suggestions && suggestions.length > 0 && (
        <nav aria-label="Sugerencias" className="mt-10 w-full border-t border-line pt-8">
          <h2 className="text-sm font-semibold text-ink">También puedes ir a</h2>
          <ul className="mt-4 grid gap-2 sm:grid-cols-3">
            {suggestions.map(({ href, label, icon: Icon }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="flex h-12 items-center justify-center gap-2 rounded-control border border-line bg-white px-4 text-sm font-medium text-ink transition-colors hover:border-line-strong hover:bg-surface-2"
                >
                  <Icon className="size-4 text-action" aria-hidden="true" />
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}

      {footnote && <div className="mt-8 text-[13px] text-ink-muted">{footnote}</div>}
    </section>
  );
}

/*
 * "404" con el plato en el centro: los dos cuatro con la
 * tipografía de títulos y un plato con cubiertos en lugar del 0.
 * Usa solo los colores de marca; no reproduce ni altera el logo.
 */
export function PlateNumber({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <div aria-hidden="true" className="flex items-center gap-3 sm:gap-4">
      <span className="font-display text-[88px] font-bold leading-none text-ink sm:text-[112px]">4</span>
      <span className="relative flex size-[92px] items-center justify-center rounded-full border-[10px] border-brand-teal bg-white sm:size-[116px] sm:border-[12px]">
        <span className="absolute inset-2 rounded-full border-2 border-dashed border-brand-maiz sm:inset-2.5" />
        <Icon className="size-9 text-ink sm:size-11" strokeWidth={1.75} />
      </span>
      <span className="font-display text-[88px] font-bold leading-none text-ink sm:text-[112px]">4</span>
    </div>
  );
}

/* Cabecera mínima para pantallas fuera de los paneles con sesión */
export function MinimalBrandHeader({ href = '/' }: { href?: string }) {
  return (
    <header className="border-b border-line bg-white">
      <div className="mx-auto flex h-[var(--header-h)] max-w-7xl items-center px-4 sm:px-6 lg:px-8">
        <Link href={href} className="flex items-center gap-2.5 rounded-control" aria-label="GastroNic Tour, ir al inicio">
          <span className="flex size-10 items-center justify-center overflow-hidden rounded-control border border-line bg-white">
            <Image src="/logo.jpeg" alt="" width={40} height={40} className="h-full w-full object-contain p-0.5" />
          </span>
          <span className="font-display text-[17px] font-semibold text-ink">
            GastroNic<span className="text-ink-muted"> Tour</span>
          </span>
        </Link>
      </div>
    </header>
  );
}
