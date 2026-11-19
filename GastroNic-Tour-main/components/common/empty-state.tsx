import type { ReactNode } from 'react';

import type { LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

/*
 * GastroNic DS · Contenido vacío (etapa 2)
 *
 * Estructura fija: ícono, título que dice qué falta, una frase
 * que explica qué hacer y, como mucho, una acción principal.
 */

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  /* "card" lleva borde punteado; "plain" se integra en un panel existente */
  variant?: 'card' | 'plain';
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  variant = 'card',
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center px-6 py-10 text-center sm:py-12',
        variant === 'card' &&
          'rounded-card border border-dashed border-[#C9D5D2] bg-surface',
        className
      )}
    >
      <div className="flex size-12 items-center justify-center rounded-control bg-action-soft text-action">
        <Icon className="size-6" aria-hidden="true" />
      </div>

      <h3 className="mt-4 text-lg font-semibold text-ink">
        {title}
      </h3>

      {description && (
        <p className="mt-1.5 max-w-[42ch] text-sm leading-relaxed text-ink-muted">
          {description}
        </p>
      )}

      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
