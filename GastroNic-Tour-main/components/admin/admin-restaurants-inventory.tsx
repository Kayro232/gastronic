'use client';

import {
  useMemo,
  useState,
  type ComponentType,
  type ReactNode,
} from 'react';

import Link from 'next/link';

import {
  AlertTriangle,
  Archive,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Heart,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Store,
  UserRound,
  Users,
  XCircle,
} from 'lucide-react';

import { RestaurantVisibilityControls } from '@/components/admin/restaurant-visibility-controls';

export interface InventoryRestaurant {
  id: string;
  name: string;
  short_description: string | null;
  status: string;
  is_verified: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  average_rating: number;
  reviews_count: number;
  visits_count: number;
  favorites_count: number;
  created_by: string;
  owner_name: string;
  owner_username: string | null;
}

interface Props {
  initialRestaurants: InventoryRestaurant[];
  approvedCount: number;
  verifiedCount: number;
  featuredCount: number;
  dataWarning?: string | null;
}

type StatusFilter =
  | 'all'
  | 'approved'
  | 'pending'
  | 'rejected'
  | 'suspended'
  | 'archived'
  | 'draft';

type VisibilityFilter = 'all' | 'verified' | 'featured' | 'unverified';

type OrderFilter = 'newest' | 'oldest' | 'rating' | 'visits' | 'name';

const statusConfig = {
  approved: {
    label: 'Aprobado',
    icon: CheckCircle2,
    badge: 'border-success/25 bg-success-soft text-success',
  },
  pending: {
    label: 'Pendiente',
    icon: Clock3,
    badge: 'border-warning/25 bg-warning-soft text-warning',
  },
  rejected: {
    label: 'Rechazado',
    icon: XCircle,
    badge: 'border-danger/25 bg-danger-soft text-danger',
  },
  suspended: {
    label: 'Suspendido',
    icon: XCircle,
    badge: 'border-warning/25 bg-warning-soft text-warning',
  },
  archived: {
    label: 'Archivado',
    icon: Archive,
    badge: 'border-slate-200 bg-slate-50 text-slate-600',
  },
  draft: {
    label: 'Borrador',
    icon: Store,
    badge: 'border-slate-200 bg-slate-50 text-slate-600',
  },
};

export function AdminRestaurantsInventory({
  initialRestaurants,
  approvedCount,
  verifiedCount,
  featuredCount,
  dataWarning,
}: Props) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [visibilityFilter, setVisibilityFilter] =
    useState<VisibilityFilter>('all');
  const [order, setOrder] = useState<OrderFilter>('newest');

  const statusCounts = useMemo(
    () => ({
      pending: initialRestaurants.filter((item) => item.status === 'pending')
        .length,
      rejected: initialRestaurants.filter((item) => item.status === 'rejected')
        .length,
      suspended: initialRestaurants.filter((item) => item.status === 'suspended')
        .length,
      draft: initialRestaurants.filter((item) => item.status === 'draft').length,
      archived: initialRestaurants.filter((item) => item.status === 'archived')
        .length,
    }),
    [initialRestaurants]
  );

  const filteredRestaurants = useMemo(() => {
    const term = search.trim().toLowerCase();

    const filtered = initialRestaurants.filter((restaurant) => {
      const statusMatch =
        statusFilter === 'all' || restaurant.status === statusFilter;

      const visibilityMatch =
        visibilityFilter === 'all' ||
        (visibilityFilter === 'verified' && restaurant.is_verified) ||
        (visibilityFilter === 'featured' && restaurant.is_featured) ||
        (visibilityFilter === 'unverified' && !restaurant.is_verified);

      const searchMatch =
        !term ||
        restaurant.name.toLowerCase().includes(term) ||
        restaurant.owner_name.toLowerCase().includes(term) ||
        restaurant.owner_username?.toLowerCase().includes(term) ||
        restaurant.short_description?.toLowerCase().includes(term) ||
        restaurant.id.toLowerCase().includes(term);

      return statusMatch && visibilityMatch && searchMatch;
    });

    return [...filtered].sort((a, b) => {
      if (order === 'oldest') {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }

      if (order === 'rating') {
        return b.average_rating - a.average_rating;
      }

      if (order === 'visits') {
        return b.visits_count - a.visits_count;
      }

      if (order === 'name') {
        return a.name.localeCompare(b.name, 'es');
      }

      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [initialRestaurants, order, search, statusFilter, visibilityFilter]);

  const hasFilters =
    Boolean(search.trim()) ||
    statusFilter !== 'all' ||
    visibilityFilter !== 'all' ||
    order !== 'newest';

  function clearFilters() {
    setSearch('');
    setStatusFilter('all');
    setVisibilityFilter('all');
    setOrder('newest');
  }

  return (
    <div className="space-y-5">
      {dataWarning && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-warning/25 bg-warning-soft px-4 py-3 text-xs leading-5 text-warning"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>{dataWarning}</span>
        </div>
      )}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={Store}
          label="Total"
          value={initialRestaurants.length}
          description="Registrados"
        />
        <MetricCard
          icon={CheckCircle2}
          label="Publicados"
          value={approvedCount}
          description="Aprobados"
        />
        <MetricCard
          icon={ShieldCheck}
          label="Verificados"
          value={verifiedCount}
          description="Validados"
        />
        <MetricCard
          icon={Sparkles}
          label="Destacados"
          value={featuredCount}
          description="Visibilidad preferente"
        />
      </section>

      <section className="rounded-2xl border border-border/70 bg-white px-4 py-3.5 shadow-none sm:px-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">
              Estado del catálogo
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Distribución actual de establecimientos que aún requieren seguimiento.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <StatusCounter label="Pendientes" value={statusCounts.pending} tone="amber" />
            <StatusCounter label="Suspendidos" value={statusCounts.suspended} tone="orange" />
            <StatusCounter label="Rechazados" value={statusCounts.rejected} tone="red" />
            <StatusCounter label="Borradores" value={statusCounts.draft} tone="slate" />
            {statusCounts.archived > 0 && (
              <StatusCounter label="Archivados" value={statusCounts.archived} tone="slate" />
            )}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-border/70 bg-white p-4 shadow-none">
        <div className="grid gap-3 xl:grid-cols-[minmax(280px,1fr)_180px_180px_180px_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar restaurante, propietario o ID..."
              className="h-11 w-full rounded-xl border border-border bg-canvas pl-10 pr-4 text-sm text-ink outline-none transition placeholder:text-muted-foreground/65 focus:border-primary/30 focus:bg-white focus:ring-4 focus:ring-primary/[0.06]"
            />
          </div>

          <SelectField
            value={statusFilter}
            onChange={(value) => setStatusFilter(value as StatusFilter)}
          >
            <option value="all">Todos los estados</option>
            <option value="approved">Aprobados</option>
            <option value="pending">Pendientes</option>
            <option value="rejected">Rechazados</option>
            <option value="suspended">Suspendidos</option>
            <option value="archived">Archivados</option>
            <option value="draft">Borradores</option>
          </SelectField>

          <SelectField
            value={visibilityFilter}
            onChange={(value) =>
              setVisibilityFilter(value as VisibilityFilter)
            }
          >
            <option value="all">Toda visibilidad</option>
            <option value="verified">Verificados</option>
            <option value="featured">Destacados</option>
            <option value="unverified">Sin verificar</option>
          </SelectField>

          <SelectField
            value={order}
            onChange={(value) => setOrder(value as OrderFilter)}
          >
            <option value="newest">Más recientes</option>
            <option value="oldest">Más antiguos</option>
            <option value="rating">Mejor rating</option>
            <option value="visits">Más visitados</option>
            <option value="name">Nombre A–Z</option>
          </SelectField>

          {hasFilters ? (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-white px-4 text-xs font-bold text-muted-foreground transition hover:border-primary/25 hover:text-action"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Limpiar
            </button>
          ) : (
            <div className="hidden xl:block" />
          )}
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-border/70 bg-white shadow-none">
        <div className="flex flex-col gap-2 border-b border-border/60 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-action">
              Inventario
            </p>
            <h2 className="mt-1 text-base font-bold text-ink">
              Restaurantes registrados
            </h2>
          </div>

          <p className="text-xs text-muted-foreground">
            {filteredRestaurants.length}{' '}
            {filteredRestaurants.length === 1 ? 'resultado' : 'resultados'}
          </p>
        </div>

        {filteredRestaurants.length === 0 ? (
          <EmptyState filtering={hasFilters} />
        ) : (
          <>
            <div className="hidden border-b border-border/60 bg-canvas px-6 py-2.5 text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground xl:grid xl:grid-cols-[minmax(0,1.4fr)_260px_310px_90px] xl:gap-5">
              <span>Restaurante</span>
              <span>Rendimiento</span>
              <span>Visibilidad</span>
              <span className="text-right">Detalle</span>
            </div>

            <div className="divide-y divide-border/60">
              {filteredRestaurants.map((restaurant) => (
                <RestaurantRow key={restaurant.id} restaurant={restaurant} />
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}

function RestaurantRow({ restaurant }: { restaurant: InventoryRestaurant }) {
  const config =
    statusConfig[restaurant.status as keyof typeof statusConfig] ??
    statusConfig.draft;
  const StatusIcon = config.icon;
  const approved = restaurant.status === 'approved';

  return (
    <article className="px-5 py-5 transition hover:bg-canvas sm:px-6">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_260px_310px_90px] xl:items-center">
        <div className="flex min-w-0 items-start gap-3.5">
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border border-primary/10 bg-primary/[0.07] text-action">
            <Store className="h-4.5 w-4.5" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-sm font-bold text-ink sm:text-[15px]">
                {restaurant.name}
              </h3>

              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${config.badge}`}
              >
                <StatusIcon className="h-3 w-3" />
                {config.label}
              </span>

              {restaurant.is_verified && (
                <span className="inline-flex items-center gap-1 rounded-full border border-primary/15 bg-primary/[0.05] px-2 py-1 text-xs font-bold text-action">
                  <ShieldCheck className="h-3 w-3" />
                  Verificado
                </span>
              )}

              {restaurant.is_featured && (
                <span className="inline-flex items-center gap-1 rounded-full border border-warning/25 bg-warning-soft px-2 py-1 text-xs font-bold text-warning">
                  <Sparkles className="h-3 w-3" />
                  Destacado
                </span>
              )}
            </div>

            {restaurant.short_description && (
              <p className="mt-1.5 line-clamp-1 max-w-2xl text-xs leading-5 text-muted-foreground">
                {restaurant.short_description}
              </p>
            )}

            <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <UserRound className="h-3.5 w-3.5 text-action" />
                <span className="font-semibold text-[#35504D]">
                  {restaurant.owner_name}
                </span>
                {restaurant.owner_username && (
                  <span className="text-muted-foreground/65">
                    @{restaurant.owner_username}
                  </span>
                )}
              </span>
              <span className="text-muted-foreground/55">
                Actualizado {formatRelativeDate(restaurant.updated_at)}
              </span>
              <span className="font-mono text-muted-foreground/55">
                {restaurant.id.slice(0, 8)}
              </span>
            </div>
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground xl:hidden">
            Rendimiento
          </p>
          <div className="grid grid-cols-2 gap-x-3 gap-y-2 sm:grid-cols-4 xl:grid-cols-2">
            <MetricDetail icon={Star} value={restaurant.average_rating.toFixed(1)} label="rating" />
            <MetricDetail icon={Users} value={restaurant.reviews_count} label="reseñas" />
            <MetricDetail icon={Store} value={restaurant.visits_count} label="visitas" />
            <MetricDetail icon={Heart} value={restaurant.favorites_count} label="favoritos" />
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground xl:hidden">
            Visibilidad
          </p>
          <RestaurantVisibilityControls
            restaurantId={restaurant.id}
            restaurantName={restaurant.name}
            status={restaurant.status}
            initialVerified={restaurant.is_verified}
            initialFeatured={restaurant.is_featured}
          />
          {!approved && (
            <p className="mt-2 text-xs leading-4 text-muted-foreground">
              Disponible cuando el restaurante esté aprobado.
            </p>
          )}
        </div>

        <div className="flex xl:justify-end">
          <Link
            href={`/admin/restaurants/${restaurant.id}`}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border bg-white px-3 text-xs font-bold text-[#35504D] transition hover:border-primary/25 hover:bg-primary/[0.04] hover:text-action xl:w-full"
          >
            Abrir
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </article>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  description,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: number;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-white p-4 shadow-none sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">
            {label}
          </p>
          <p className="mt-2 text-3xl font-bold tracking-[-0.045em] text-ink">
            {value}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {description}
          </p>
        </div>

        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/[0.07] text-action">
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}

function StatusCounter({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: 'amber' | 'orange' | 'red' | 'slate';
}) {
  const tones = {
    amber: 'border-warning/25 bg-warning-soft text-warning',
    orange: 'border-warning/25 bg-warning-soft text-warning',
    red: 'border-danger/25 bg-danger-soft text-danger',
    slate: 'border-slate-200 bg-slate-50 text-slate-600',
  };

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs font-bold ${tones[tone]}`}
    >
      <strong className="text-xs">{value}</strong>
      {label}
    </span>
  );
}

function MetricDetail({
  icon: Icon,
  value,
  label,
}: {
  icon: ComponentType<{ className?: string }>;
  value: string | number;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      <Icon className="h-3.5 w-3.5 text-action" />
      <strong className="font-bold text-ink">{value}</strong>
      {label}
    </span>
  );
}

function SelectField({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full appearance-none rounded-xl border border-border bg-canvas px-4 pr-10 text-xs font-semibold text-ink outline-none transition focus:border-primary/30 focus:bg-white focus:ring-4 focus:ring-primary/[0.06]"
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
}

function EmptyState({ filtering }: { filtering: boolean }) {
  return (
    <div className="flex min-h-[300px] items-center justify-center p-8 text-center">
      <div>
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/[0.07] text-action">
          <Store className="h-5 w-5" />
        </div>
        <h3 className="mt-4 font-bold text-ink">
          {filtering ? 'No encontramos resultados' : 'No hay restaurantes'}
        </h3>
        <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
          {filtering
            ? 'Cambia los filtros o la búsqueda para ampliar los resultados.'
            : 'Todavía no existen establecimientos registrados.'}
        </p>
      </div>
    </div>
  );
}

function formatRelativeDate(value: string) {
  const date = new Date(value);
  const now = new Date();
  const difference = Math.max(0, now.getTime() - date.getTime());
  const minutes = Math.floor(difference / 60_000);

  if (minutes < 1) return 'ahora';
  if (minutes < 60) return `hace ${minutes} min`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours} ${hours === 1 ? 'hora' : 'horas'}`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `hace ${days} ${days === 1 ? 'día' : 'días'}`;

  return new Intl.DateTimeFormat('es-NI', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}
