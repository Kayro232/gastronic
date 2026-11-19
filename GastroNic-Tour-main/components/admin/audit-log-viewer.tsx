'use client';

import {
  useMemo,
  useState,
  type ComponentType,
} from 'react';

import {
  Activity,
  ChevronDown,
  ChevronUp,
  Clock3,
  Database,
  FileClock,
  Filter,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  User,
  Wrench,
} from 'lucide-react';

import type { AuditLogItem } from '@/types/admin-audit';

type ActionFilter = 'all' | 'insert' | 'update' | 'delete';
type TableFilter = 'all' | string;

export function AuditLogViewer({
  logs,
  totalEvents,
}: {
  logs: AuditLogItem[];
  totalEvents: number;
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<ActionFilter>('all');
  const [tableFilter, setTableFilter] = useState<TableFilter>('all');
  const [expandedLogId, setExpandedLogId] = useState<number | null>(null);

  const inserts = logs.filter((log) => log.action === 'insert').length;
  const updates = logs.filter((log) => log.action === 'update').length;
  const deletes = logs.filter((log) => log.action === 'delete').length;
  const systemEvents = logs.filter((log) => !log.actor_id).length;

  const actorCount = new Set(
    logs.map((log) => log.actor_id).filter((actorId): actorId is string => Boolean(actorId))
  ).size;

  const uniqueTables = Array.from(new Set(logs.map((log) => log.table_name))).sort();

  const filteredLogs = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return logs.filter((log) => {
      const actorName = log.actor?.full_name?.toLowerCase() ?? '';
      const username = log.actor?.username?.toLowerCase() ?? '';
      const recordLabel = getRecordLabel(log).toLowerCase();

      const matchesSearch =
        !search ||
        actorName.includes(search) ||
        username.includes(search) ||
        log.table_name.toLowerCase().includes(search) ||
        getTableLabel(log.table_name).toLowerCase().includes(search) ||
        log.action.toLowerCase().includes(search) ||
        recordLabel.includes(search) ||
        log.record_id?.toLowerCase().includes(search);

      const matchesAction = actionFilter === 'all' || log.action === actionFilter;
      const matchesTable = tableFilter === 'all' || log.table_name === tableFilter;

      return matchesSearch && matchesAction && matchesTable;
    });
  }, [logs, searchTerm, actionFilter, tableFilter]);

  return (
    <div className="space-y-5">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Eventos del período"
          value={totalEvents}
          description="Total antes de paginar"
          icon={Activity}
          tone="slate"
        />
        <MetricCard
          label="Inserciones"
          value={inserts}
          description="En esta página"
          icon={Plus}
          tone="green"
        />
        <MetricCard
          label="Actualizaciones"
          value={updates}
          description="En esta página"
          icon={RefreshCw}
          tone="blue"
        />
        <MetricCard
          label="Eliminaciones"
          value={deletes}
          description="En esta página"
          icon={Trash2}
          tone="red"
        />
      </section>

      <section className="rounded-2xl border border-border/70 bg-white px-5 py-4 shadow-none">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-action">
              Cobertura cargada
            </p>
            <p className="mt-1 text-sm font-bold text-ink">
              Página actual del historial
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <StatusChip label="Eventos" value={logs.length} tone="slate" />
            <StatusChip label="Actores" value={actorCount} tone="teal" />
            <StatusChip label="Sistema" value={systemEvents} tone="amber" />
            <StatusChip label="Entidades" value={uniqueTables.length} tone="blue" />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-border/70 bg-white p-4 shadow-none">
        <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_180px_210px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Buscar actor, entidad, registro o ID..."
              className="h-11 w-full rounded-xl border border-border bg-canvas pl-10 pr-4 text-sm text-ink outline-none transition placeholder:text-muted-foreground/70 focus:border-primary/30 focus:bg-white focus:ring-4 focus:ring-primary/[0.06]"
            />
          </div>

          <div className="relative">
            <Filter className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <select
              value={actionFilter}
              onChange={(event) => setActionFilter(event.target.value as ActionFilter)}
              className="h-11 w-full appearance-none rounded-xl border border-border bg-canvas pl-10 pr-8 text-sm font-semibold text-ink outline-none transition focus:border-primary/30 focus:bg-white focus:ring-4 focus:ring-primary/[0.06]"
            >
              <option value="all">Todas las acciones</option>
              <option value="insert">Inserciones</option>
              <option value="update">Actualizaciones</option>
              <option value="delete">Eliminaciones</option>
            </select>
          </div>

          <select
            value={tableFilter}
            onChange={(event) => setTableFilter(event.target.value)}
            className="h-11 w-full appearance-none rounded-xl border border-border bg-canvas px-4 pr-8 text-sm font-semibold text-ink outline-none transition focus:border-primary/30 focus:bg-white focus:ring-4 focus:ring-primary/[0.06]"
          >
            <option value="all">Todas las entidades</option>
            {uniqueTables.map((table) => (
              <option key={table} value={table}>
                {getTableLabel(table)}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-3 flex flex-col gap-1 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            Los filtros de búsqueda se aplican a los {logs.length} eventos cargados en esta página.
          </p>
          <p className="font-semibold text-ink">
            {filteredLogs.length} {filteredLogs.length === 1 ? 'resultado visible' : 'resultados visibles'}
          </p>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-border/70 bg-white shadow-none">
        <div className="flex flex-col gap-2 border-b border-border/60 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-action">
              Bitácora operativa
            </p>
            <h2 className="mt-1 text-base font-bold text-ink">
              Eventos registrados
            </h2>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-action" />
            Datos de auditoría del sistema
          </div>
        </div>

        {filteredLogs.length > 0 ? (
          <div className="divide-y divide-border/60">
            {filteredLogs.map((log) => {
              const expanded = expandedLogId === log.id;

              return (
                <AuditRow
                  key={log.id}
                  log={log}
                  expanded={expanded}
                  onToggle={() => setExpandedLogId(expanded ? null : log.id)}
                />
              );
            })}
          </div>
        ) : (
          <EmptyAudit />
        )}
      </section>
    </div>
  );
}

function AuditRow({
  log,
  expanded,
  onToggle,
}: {
  log: AuditLogItem;
  expanded: boolean;
  onToggle: () => void;
}) {
  const action = getActionConfig(log.action);
  const ActionIcon = action.icon;
  const actorName = getActorName(log);
  const changes = getChangedFields(log.old_data, log.new_data);
  const recordLabel = getRecordLabel(log);

  return (
    <article>
      <button
        type="button"
        onClick={onToggle}
        className="group w-full px-5 py-4 text-left transition hover:bg-canvas sm:px-6"
      >
        <div className="grid gap-4 lg:grid-cols-[minmax(300px,1.35fr)_minmax(190px,0.8fr)_minmax(190px,0.8fr)_170px_92px] lg:items-center">
          <div className="flex min-w-0 items-start gap-3">
            <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${action.iconClass}`}>
              <ActionIcon className="h-4 w-4" />
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-bold text-ink">{action.label}</p>
                <span className={`rounded-full border px-2 py-0.5 text-xs font-bold uppercase tracking-[0.08em] ${action.badge}`}>
                  {log.action}
                </span>
              </div>
              <p className="mt-1 truncate text-xs text-muted-foreground">
                {recordLabel}
              </p>
            </div>
          </div>

          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">
              Actor
            </p>
            <div className="mt-1.5 flex items-center gap-2">
              <div className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg ${log.actor_id ? 'bg-primary/[0.08] text-action' : 'bg-slate-100 text-slate-500'}`}>
                {log.actor_id ? <User className="h-3.5 w-3.5" /> : <Wrench className="h-3.5 w-3.5" />}
              </div>
              <p className="truncate text-xs font-semibold text-ink">{actorName}</p>
            </div>
          </div>

          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">
              Entidad
            </p>
            <div className="mt-1.5 flex items-center gap-2">
              <Database className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
              <p className="truncate text-xs font-semibold text-ink">
                {getTableLabel(log.table_name)}
              </p>
            </div>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">
              Momento
            </p>
            <div className="mt-1.5 flex items-center gap-2 text-xs font-semibold text-ink">
              <Clock3 className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
              <span>{formatDateTime(log.created_at)}</span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 lg:justify-end">
            {changes.length > 0 && (
              <span className="rounded-full bg-[#F1F4F3] px-2 py-1 text-xs font-bold text-muted-foreground lg:hidden">
                {changes.length} {changes.length === 1 ? 'cambio' : 'cambios'}
              </span>
            )}

            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-white text-muted-foreground transition group-hover:border-primary/20 group-hover:text-action">
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </div>
          </div>
        </div>
      </button>

      {expanded && <AuditDetails log={log} changes={changes} />}
    </article>
  );
}

function AuditDetails({
  log,
  changes,
}: {
  log: AuditLogItem;
  changes: FieldChange[];
}) {
  return (
    <div className="border-t border-border/50 bg-canvas px-5 py-5 sm:px-6">
      <div className="grid gap-5 xl:grid-cols-[280px_minmax(0,1fr)]">
        <div className="rounded-xl border border-border/70 bg-white p-4">
          <p className="text-xs font-bold uppercase tracking-[0.08em] text-action">
            Contexto del evento
          </p>

          <div className="mt-4 space-y-4">
            <DetailBlock label="Actor" value={getActorName(log)} />
            <DetailBlock label="Entidad" value={getTableLabel(log.table_name)} />
            <DetailBlock label="Registro" value={log.record_id ?? 'No disponible'} monospace />
            <DetailBlock label="Fecha" value={formatDateTime(log.created_at)} />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.08em] text-action">
                Información registrada
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {getDetailsDescription(log.action, changes.length)}
              </p>
            </div>

            {changes.length > 0 && (
              <span className="rounded-full border border-border bg-white px-2.5 py-1 text-xs font-bold text-muted-foreground">
                {changes.length} {changes.length === 1 ? 'cambio' : 'cambios'}
              </span>
            )}
          </div>

          {log.action === 'insert' ? (
            <CreatedRecord data={log.new_data} />
          ) : log.action === 'delete' ? (
            <DeletedRecord data={log.old_data} />
          ) : changes.length > 0 ? (
            <div className="mt-3 space-y-2">
              {changes.map((change) => (
                <ChangeRow key={change.field} change={change} />
              ))}
            </div>
          ) : (
            <div className="mt-3 rounded-xl border border-border bg-white p-4 text-sm text-muted-foreground">
              No se detectaron diferencias relevantes entre los datos anteriores y nuevos.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface FieldChange {
  field: string;
  oldValue: unknown;
  newValue: unknown;
}

function ChangeRow({ change }: { change: FieldChange }) {
  return (
    <div className="rounded-xl border border-border/70 bg-white p-4">
      <p className="text-xs font-bold uppercase tracking-[0.08em] text-ink">
        {getFieldLabel(change.field)}
      </p>

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <ValuePanel label="Antes" value={change.oldValue} tone="red" />
        <ValuePanel label="Después" value={change.newValue} tone="green" />
      </div>
    </div>
  );
}

function ValuePanel({
  label,
  value,
  tone,
}: {
  label: string;
  value: unknown;
  tone: 'red' | 'green';
}) {
  const style =
    tone === 'red'
      ? 'border-danger/25 bg-red-50/60 text-danger'
      : 'border-success/25 bg-emerald-50/60 text-success';

  const labelStyle = tone === 'red' ? 'text-red-500' : 'text-success';

  return (
    <div className={`rounded-lg border p-3 ${style}`}>
      <p className={`text-xs font-bold uppercase tracking-[0.08em] ${labelStyle}`}>
        {label}
      </p>
      <p className="mt-1 break-words text-xs leading-5">{formatAuditValue(value)}</p>
    </div>
  );
}

function CreatedRecord({ data }: { data: Record<string, unknown> | null }) {
  return <RecordSnapshot data={data} emptyLabel="No hay datos del registro creado." />;
}

function DeletedRecord({ data }: { data: Record<string, unknown> | null }) {
  return <RecordSnapshot data={data} emptyLabel="No hay una copia anterior disponible para este registro." />;
}

function RecordSnapshot({
  data,
  emptyLabel,
}: {
  data: Record<string, unknown> | null;
  emptyLabel: string;
}) {
  if (!data) {
    return <p className="mt-3 text-sm text-muted-foreground">{emptyLabel}</p>;
  }

  const usefulFields = Object.entries(data)
    .filter(([key]) => !['search_document', 'updated_at', 'created_at'].includes(key))
    .slice(0, 12);

  return (
    <div className="mt-3 grid gap-2 sm:grid-cols-2">
      {usefulFields.map(([key, value]) => (
        <div key={key} className="rounded-xl border border-border/70 bg-white p-3">
          <p className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">
            {getFieldLabel(key)}
          </p>
          <p className="mt-1 break-words text-xs font-medium leading-5 text-ink">
            {formatAuditValue(value)}
          </p>
        </div>
      ))}
    </div>
  );
}

function MetricCard({
  label,
  value,
  description,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  description: string;
  icon: ComponentType<{ className?: string }>;
  tone: 'slate' | 'green' | 'blue' | 'red';
}) {
  const config = {
    slate: {
      dot: 'bg-slate-400',
      icon: 'bg-slate-100 text-slate-600',
    },
    green: {
      dot: 'bg-emerald-500',
      icon: 'bg-success-soft text-success',
    },
    blue: {
      dot: 'bg-blue-500',
      icon: 'bg-blue-50 text-blue-600',
    },
    red: {
      dot: 'bg-red-500',
      icon: 'bg-danger-soft text-danger',
    },
  } as const;

  const current = config[tone];

  return (
    <div className="rounded-2xl border border-border/70 bg-white p-5 shadow-none">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className={`h-1.5 w-1.5 rounded-full ${current.dot}`} />
            <p className="text-xs font-semibold text-muted-foreground">{label}</p>
          </div>
          <p className="mt-3 text-3xl font-bold tracking-[-0.04em] text-ink">{value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        </div>

        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${current.icon}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}

function StatusChip({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: 'slate' | 'teal' | 'amber' | 'blue';
}) {
  const styles = {
    slate: 'border-slate-200 bg-slate-50 text-slate-700',
    teal: 'border-teal-200 bg-teal-50 text-teal-700',
    amber: 'border-warning/25 bg-warning-soft text-warning',
    blue: 'border-blue-200 bg-blue-50 text-blue-700',
  } as const;

  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold ${styles[tone]}`}>
      <span>{label}</span>
      <span className="rounded-full bg-white/80 px-1.5 py-0.5">{value}</span>
    </span>
  );
}

function DetailBlock({
  label,
  value,
  monospace = false,
}: {
  label: string;
  value: string;
  monospace?: boolean;
}) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </p>
      <p className={`mt-1 break-all text-xs font-semibold leading-5 text-ink ${monospace ? 'font-mono' : ''}`}>
        {value}
      </p>
    </div>
  );
}

function EmptyAudit() {
  return (
    <div className="flex min-h-[300px] items-center justify-center p-8 text-center">
      <div className="max-w-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/[0.08]">
          <FileClock className="h-5 w-5 text-action" />
        </div>
        <h3 className="mt-4 text-base font-bold text-ink">No encontramos eventos</h3>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Cambia los filtros o realiza una búsqueda diferente dentro de la página actual.
        </p>
      </div>
    </div>
  );
}

function getActionConfig(action: string) {
  const config = {
    insert: {
      label: 'Registro creado',
      icon: Plus,
      iconClass: 'bg-success-soft text-success',
      badge: 'border-success/25 bg-success-soft text-success',
    },
    update: {
      label: 'Registro actualizado',
      icon: RefreshCw,
      iconClass: 'bg-blue-50 text-blue-600',
      badge: 'border-blue-200 bg-blue-50 text-blue-700',
    },
    delete: {
      label: 'Registro eliminado',
      icon: Trash2,
      iconClass: 'bg-danger-soft text-danger',
      badge: 'border-danger/25 bg-danger-soft text-danger',
    },
  } as const;

  return (
    config[action as keyof typeof config] ?? {
      label: 'Actividad registrada',
      icon: Activity,
      iconClass: 'bg-slate-100 text-slate-600',
      badge: 'border-slate-200 bg-slate-50 text-slate-600',
    }
  );
}

function getActorName(log: AuditLogItem) {
  if (!log.actor_id) return 'Sistema';

  return (
    log.actor?.full_name?.trim() ||
    log.actor?.username ||
    `Usuario ${log.actor_id.slice(0, 8)}`
  );
}

function getRecordLabel(log: AuditLogItem) {
  const source = log.new_data ?? log.old_data;

  if (source) {
    const candidates = ['name', 'title', 'full_name', 'username'];

    for (const field of candidates) {
      const value = source[field];
      if (typeof value === 'string' && value.trim()) return value.trim();
    }
  }

  if (log.record_id) return `Registro ${log.record_id.slice(0, 8)}`;
  return getTableLabel(log.table_name);
}

function getDetailsDescription(action: string, changes: number) {
  if (action === 'insert') return 'Datos principales almacenados al crear el registro.';
  if (action === 'delete') return 'Última información disponible antes de eliminar el registro.';
  if (changes > 0) return 'Comparación entre el valor anterior y el valor posterior.';
  return 'No hay diferencias de campos disponibles para este evento.';
}

function getTableLabel(tableName: string) {
  const labels: Record<string, string> = {
    restaurants: 'Restaurantes',
    restaurant_members: 'Miembros de restaurantes',
    reviews: 'Reseñas',
    user_roles: 'Roles de usuario',
    profiles: 'Perfiles',
    reservations: 'Reservaciones',
    reports: 'Reportes',
    favorites: 'Favoritos',
    visits: 'Visitas',
  };

  return (
    labels[tableName] ??
    tableName.replaceAll('_', ' ').replace(/\b\w/g, (character) => character.toUpperCase())
  );
}

function getChangedFields(
  oldData: Record<string, unknown> | null,
  newData: Record<string, unknown> | null
): FieldChange[] {
  if (!oldData || !newData) return [];

  const ignoredFields = new Set(['search_document']);
  const fields = new Set([...Object.keys(oldData), ...Object.keys(newData)]);

  return Array.from(fields)
    .filter((field) => !ignoredFields.has(field))
    .filter((field) => JSON.stringify(oldData[field]) !== JSON.stringify(newData[field]))
    .map((field) => ({
      field,
      oldValue: oldData[field],
      newValue: newData[field],
    }));
}

function getFieldLabel(field: string) {
  const labels: Record<string, string> = {
    name: 'Nombre',
    status: 'Estado',
    role: 'Rol',
    visits_count: 'Visitas',
    reviews_count: 'Reseñas',
    average_rating: 'Calificación',
    favorites_count: 'Favoritos',
    estimated_price_min: 'Precio mínimo',
    estimated_price_max: 'Precio máximo',
    is_verified: 'Verificado',
    is_featured: 'Destacado',
    accepts_reservations: 'Acepta reservaciones',
    phone: 'Teléfono',
    whatsapp: 'WhatsApp',
    email: 'Correo',
    address: 'Dirección',
    description: 'Descripción',
    short_description: 'Descripción corta',
    restaurant_id: 'Restaurante',
    user_id: 'Usuario',
    rating: 'Calificación',
    title: 'Título',
    comment: 'Comentario',
  };

  return (
    labels[field] ??
    field.replaceAll('_', ' ').replace(/\b\w/g, (character) => character.toUpperCase())
  );
}

function formatAuditValue(value: unknown) {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'boolean') return value ? 'Sí' : 'No';
  if (typeof value === 'object' && value !== null) return JSON.stringify(value);
  return String(value);
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('es-NI', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}
