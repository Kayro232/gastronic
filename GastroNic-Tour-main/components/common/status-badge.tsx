import {
  Archive,
  Ban,
  CheckCircle2,
  CircleDashed,
  CircleSlash,
  Clock3,
  EyeOff,
  FileEdit,
  PlayCircle,
  XCircle,
  type LucideIcon,
} from 'lucide-react';

import { cn } from '@/lib/utils';

/*
 * GastroNic DS · Insignia de estado (etapa 2)
 *
 * Un solo componente para los estados de reservas, reseñas,
 * restaurantes y rutas. El estado se comunica con color, ícono
 * y texto a la vez (nunca solo con color).
 */

export type StatusTone =
  | 'warning'
  | 'success'
  | 'info'
  | 'danger'
  | 'neutral';

export type StatusKind =
  | 'reservation'
  | 'review'
  | 'restaurant'
  | 'route';

interface StatusDefinition {
  tone: StatusTone;
  icon: LucideIcon;
  /* Etiqueta por tipo de entidad (género gramatical correcto) */
  labels: Partial<Record<StatusKind, string>> & { default: string };
}

const STATUS: Record<string, StatusDefinition> = {
  pending: {
    tone: 'warning',
    icon: Clock3,
    labels: { default: 'Pendiente' },
  },
  draft: {
    tone: 'warning',
    icon: FileEdit,
    labels: { default: 'Borrador' },
  },
  confirmed: {
    tone: 'success',
    icon: CheckCircle2,
    labels: { default: 'Confirmada', restaurant: 'Confirmado' },
  },
  approved: {
    tone: 'success',
    icon: CheckCircle2,
    labels: { default: 'Aprobado', review: 'Aprobada', reservation: 'Aprobada' },
  },
  published: {
    tone: 'success',
    icon: CheckCircle2,
    labels: { default: 'Publicada', restaurant: 'Publicado' },
  },
  completed: {
    tone: 'info',
    icon: CheckCircle2,
    labels: { default: 'Completada', restaurant: 'Completado' },
  },
  in_progress: {
    tone: 'info',
    icon: PlayCircle,
    labels: { default: 'En curso' },
  },
  cancelled: {
    tone: 'danger',
    icon: XCircle,
    labels: { default: 'Cancelada', restaurant: 'Cancelado' },
  },
  rejected: {
    tone: 'danger',
    icon: Ban,
    labels: { default: 'Rechazado', review: 'Rechazada', reservation: 'Rechazada' },
  },
  suspended: {
    tone: 'danger',
    icon: CircleSlash,
    labels: { default: 'Suspendido', review: 'Suspendida' },
  },
  no_show: {
    tone: 'neutral',
    icon: CircleDashed,
    labels: { default: 'No asistió' },
  },
  hidden: {
    tone: 'neutral',
    icon: EyeOff,
    labels: { default: 'Oculta', restaurant: 'Oculto' },
  },
  archived: {
    tone: 'neutral',
    icon: Archive,
    labels: { default: 'Archivado', review: 'Archivada', reservation: 'Archivada' },
  },
  abandoned: {
    tone: 'neutral',
    icon: CircleSlash,
    labels: { default: 'Abandonada' },
  },
};

const TONE_CLASSES: Record<StatusTone, string> = {
  warning: 'bg-warning-soft text-warning',
  success: 'bg-success-soft text-success',
  info: 'bg-action-soft text-action',
  danger: 'bg-danger-soft text-danger',
  neutral: 'bg-surface-2 text-ink-muted',
};

interface StatusBadgeProps {
  status: string;
  kind?: StatusKind;
  /* Sustituye la etiqueta por defecto si el contexto lo requiere */
  label?: string;
  size?: 'sm' | 'md';
  className?: string;
}

export function getStatusLabel(
  status: string,
  kind: StatusKind = 'reservation'
) {
  const definition = STATUS[status];

  if (!definition) {
    return status;
  }

  return definition.labels[kind] ?? definition.labels.default;
}

export function StatusBadge({
  status,
  kind = 'reservation',
  label,
  size = 'md',
  className,
}: StatusBadgeProps) {
  const definition = STATUS[status];
  const tone: StatusTone = definition?.tone ?? 'neutral';
  const Icon = definition?.icon ?? CircleDashed;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full font-semibold',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-[13px]',
        TONE_CLASSES[tone],
        className
      )}
    >
      <Icon className="size-3.5 flex-shrink-0" aria-hidden="true" />
      {label ?? getStatusLabel(status, kind)}
    </span>
  );
}
