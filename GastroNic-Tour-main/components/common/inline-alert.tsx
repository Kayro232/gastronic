import type { ReactNode } from 'react';

import {
  AlertTriangle,
  CheckCircle2,
  Info,
  XCircle,
  type LucideIcon,
} from 'lucide-react';

import { cn } from '@/lib/utils';

/*
 * GastroNic DS · Mensaje en línea (etapa 3)
 *
 * Para mensajes que deben quedar visibles junto al formulario o
 * la sección que los produjo (los avisos flotantes de `notify`
 * desaparecen solos). Los errores se anuncian de inmediato a
 * lectores de pantalla; el resto, de forma cortés.
 */

type Tone = 'success' | 'error' | 'warning' | 'info';

const TONES: Record<Tone, { icon: LucideIcon; className: string }> = {
  success: { icon: CheckCircle2, className: 'border-success/25 bg-success-soft text-success' },
  error: { icon: XCircle, className: 'border-danger/25 bg-danger-soft text-danger' },
  warning: { icon: AlertTriangle, className: 'border-warning/25 bg-warning-soft text-warning' },
  info: { icon: Info, className: 'border-action/20 bg-action-soft text-action' },
};

interface InlineAlertProps {
  tone: Tone;
  title?: string;
  children?: ReactNode;
  className?: string;
}

export function InlineAlert({ tone, title, children, className }: InlineAlertProps) {
  const { icon: Icon, className: toneClass } = TONES[tone];

  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn('flex gap-3 rounded-control border px-4 py-3', toneClass, className)}
    >
      <Icon className="mt-0.5 size-5 flex-shrink-0" aria-hidden="true" />
      <div className="min-w-0 text-sm leading-relaxed">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={cn(title && 'mt-0.5', 'text-ink')}>{children}</div>}
      </div>
    </div>
  );
}
