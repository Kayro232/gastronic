import Link from 'next/link';
import { redirect } from 'next/navigation';

import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  CircleMinus,
  Clock3,
  FileClock,
  MessageSquareText,
  ShieldCheck,
  Store,
  Users,
  XCircle,
} from 'lucide-react';

import { AdminLayout } from '@/components/admin/admin-layout';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/server';

interface RestaurantRow {
  id: string;
  name: string;
  status: string;
  created_at: string;
  created_by: string;
}

interface ProfileRow {
  id: string;
  full_name: string;
  username: string | null;
  created_at: string;
}

interface ReviewRow {
  id: string;
  restaurant_id: string;
  rating: number;
  status: string;
  created_at: string;
}

interface ReservationRow {
  id: string;
  restaurant_id: string;
  status: string;
  party_size: number;
  created_at: string;
}

interface AuditLogRow {
  id: string;
  actor_id: string | null;
  action: string;
  table_name: string;
  record_id: string | null;
  created_at: string;
}

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login');

  const { data: adminRole, error: roleError } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .eq('role', 'admin')
    .maybeSingle();

  if (roleError) {
    console.error('Error comprobando rol de administrador:', roleError);
  }

  if (!adminRole) redirect('/');

  const [
    restaurantsResult,
    profilesResult,
    reviewsResult,
    reservationsResult,
    auditResult,
  ] = await Promise.all([
    supabase
      .from('restaurants')
      .select('id, name, status, created_at, created_by')
      .order('created_at', { ascending: false }),
    supabase
      .from('profiles')
      .select('id, full_name, username, created_at')
      .order('created_at', { ascending: false }),
    supabase
      .from('reviews')
      .select('id, restaurant_id, rating, status, created_at')
      .order('created_at', { ascending: false }),
    supabase
      .from('reservations')
      .select('id, restaurant_id, status, party_size, created_at')
      .order('created_at', { ascending: false }),
    supabase
      .from('audit_logs')
      .select('id, actor_id, action, table_name, record_id, created_at')
      .order('created_at', { ascending: false })
      .limit(8),
  ]);

  const loadErrors = [
    restaurantsResult.error,
    profilesResult.error,
    reviewsResult.error,
    reservationsResult.error,
    auditResult.error,
  ].filter(Boolean);

  if (restaurantsResult.error) {
    console.error('Error cargando restaurantes:', restaurantsResult.error);
  }
  if (profilesResult.error) {
    console.error('Error cargando perfiles:', profilesResult.error);
  }
  if (reviewsResult.error) {
    console.error('Error cargando reseñas:', reviewsResult.error);
  }
  if (reservationsResult.error) {
    console.error('Error cargando reservaciones:', reservationsResult.error);
  }
  if (auditResult.error) {
    console.error('Error cargando auditoría:', auditResult.error);
  }

  const restaurants = (restaurantsResult.data ?? []) as RestaurantRow[];
  const profiles = (profilesResult.data ?? []) as ProfileRow[];
  const reviews = (reviewsResult.data ?? []) as ReviewRow[];
  const reservations = (reservationsResult.data ?? []) as ReservationRow[];
  const auditLogs = (auditResult.data ?? []) as AuditLogRow[];

  const pending = restaurants.filter((item) => item.status === 'pending');
  const approved = restaurants.filter((item) => item.status === 'approved');
  const rejected = restaurants.filter((item) => item.status === 'rejected');
  const suspended = restaurants.filter((item) => item.status === 'suspended');
  const drafts = restaurants.filter((item) => item.status === 'draft');

  const now = new Date();
  const currentStart = new Date(now);
  currentStart.setDate(currentStart.getDate() - 30);
  const previousStart = new Date(now);
  previousStart.setDate(previousStart.getDate() - 60);

  const currentRestaurants = filterBetween(restaurants, currentStart, now);
  const previousRestaurants = filterBetween(
    restaurants,
    previousStart,
    currentStart
  );
  const currentReviews = filterBetween(reviews, currentStart, now);
  const previousReviews = filterBetween(reviews, previousStart, currentStart);
  const currentReservations = filterBetween(reservations, currentStart, now);
  const previousReservations = filterBetween(
    reservations,
    previousStart,
    currentStart
  );

  const publishedReviews = reviews.filter((item) => item.status === 'published');
  const averageRating =
    publishedReviews.length > 0
      ? publishedReviews.reduce((sum, item) => sum + item.rating, 0) /
        publishedReviews.length
      : 0;

  const activeReservations = reservations.filter(
    (item) => item.status === 'pending' || item.status === 'confirmed'
  );

  const processedCount = approved.length + rejected.length + suspended.length;
  const reviewProgress =
    restaurants.length > 0
      ? Math.round((processedCount / restaurants.length) * 100)
      : 100;

  const profileMap = new Map(
    profiles.map((profile) => [profile.id, profile])
  );

  const recentApplications = pending.slice(0, 5);

  return (
    <AdminLayout>
      <div className="min-h-screen bg-surface-2">
        <div className="mx-auto max-w-[1480px] px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
          <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.08em] text-action">
                <ShieldCheck className="h-3.5 w-3.5" />
                Centro de operaciones
              </div>

              <h1 className="text-3xl font-bold tracking-[-0.045em] text-ink sm:text-[38px]">
                Administración
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Prioriza moderación, revisa el estado de la plataforma y accede a las herramientas administrativas.
              </p>
            </div>

            <Button
              asChild
              className="h-11 w-fit rounded-xl bg-[#0E2725] px-5 font-bold text-white shadow-overlay hover:bg-action"
            >
              <Link href="/admin/restaurants">
                Revisar solicitudes
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </header>

          {loadErrors.length > 0 && (
            <div className="mt-6 flex items-start gap-3 rounded-2xl border border-warning/25 bg-warning-soft px-4 py-3.5 text-sm text-warning">
              <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <p>
                Parte de la información administrativa no pudo cargarse. Los datos visibles pueden estar incompletos.
              </p>
            </div>
          )}

          <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              label="Pendientes"
              value={pending.length}
              description="Solicitudes por revisar"
              icon={Clock3}
              tone="amber"
              href="/admin/restaurants"
            />
            <SummaryCard
              label="Publicados"
              value={approved.length}
              description="Restaurantes visibles"
              icon={Store}
              tone="green"
              href="/admin/restaurants/all"
            />
            <SummaryCard
              label="Usuarios"
              value={profiles.length}
              description="Perfiles registrados"
              icon={Users}
              tone="blue"
              href="/admin/users"
            />
            <SummaryCard
              label="Reservas activas"
              value={activeReservations.length}
              description="Pendientes o confirmadas"
              icon={CalendarDays}
              tone="teal"
            />
          </section>

          <section className="mt-7 rounded-card border border-line bg-white p-5 shadow-none sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.08em] text-warning">
                  Prioridades operativas
                </p>
                <h2 className="mt-1 text-xl font-bold tracking-[-0.03em] text-ink">
                  Lo que necesita atención
                </h2>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Estados que requieren una decisión o seguimiento administrativo.
                </p>
              </div>

              {pending.length + rejected.length + suspended.length === 0 && (
                <span className="inline-flex w-fit items-center gap-2 rounded-full bg-success-soft px-3 py-2 text-xs font-bold text-success">
                  <CheckCircle2 className="h-4 w-4" />
                  Sin pendientes críticos
                </span>
              )}
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <PriorityCard
                title="Solicitudes pendientes"
                value={pending.length}
                description="Esperan una decisión de moderación."
                href="/admin/restaurants"
                icon={Clock3}
                tone="amber"
              />
              <PriorityCard
                title="Restaurantes rechazados"
                value={rejected.length}
                description="Pueden requerir seguimiento o nueva revisión."
                href="/admin/restaurants/all"
                icon={XCircle}
                tone="red"
              />
              <PriorityCard
                title="Restaurantes suspendidos"
                value={suspended.length}
                description="Revisa los establecimientos fuera de publicación."
                href="/admin/restaurants/all"
                icon={AlertTriangle}
                tone="orange"
              />
            </div>
          </section>

          <section className="mt-7">
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.08em] text-action">
                  Actividad · 30 días
                </p>
                <h2 className="mt-1 text-lg font-bold text-ink">
                  Movimiento reciente
                </h2>
              </div>
              <p className="hidden text-xs text-muted-foreground sm:block">
                Comparado con los 30 días anteriores
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <ActivityMetric
                label="Nuevos restaurantes"
                value={currentRestaurants.length}
                previous={previousRestaurants.length}
                icon={Store}
              />
              <ActivityMetric
                label="Nuevas reseñas"
                value={currentReviews.length}
                previous={previousReviews.length}
                icon={MessageSquareText}
              />
              <ActivityMetric
                label="Reservaciones creadas"
                value={currentReservations.length}
                previous={previousReservations.length}
                icon={CalendarDays}
              />
            </div>
          </section>

          <div className="mt-7 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
            <section className="overflow-hidden rounded-card border border-line bg-white shadow-none">
              <div className="flex flex-col gap-3 border-b border-border/60 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.08em] text-warning">
                    Moderación
                  </p>
                  <h2 className="mt-1 text-lg font-bold text-ink">
                    Solicitudes por revisar
                  </h2>
                </div>

                <Link
                  href="/admin/restaurants"
                  className="inline-flex w-fit items-center gap-2 text-xs font-bold text-action transition hover:gap-3"
                >
                  Ver cola completa
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              {recentApplications.length === 0 ? (
                <EmptyModeration />
              ) : (
                <div className="divide-y divide-border/60">
                  {recentApplications.map((restaurant) => {
                    const owner = profileMap.get(restaurant.created_by);
                    return (
                      <ApplicationRow
                        key={restaurant.id}
                        restaurant={restaurant}
                        ownerName={
                          owner?.full_name?.trim() ||
                          owner?.username ||
                          'Propietario'
                        }
                      />
                    );
                  })}
                </div>
              )}
            </section>

            <aside className="space-y-5">
              <section className="rounded-card border border-line bg-white p-5 shadow-none">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.08em] text-action">
                      Estado de plataforma
                    </p>
                    <h2 className="mt-1 text-base font-bold text-ink">
                      Salud operativa
                    </h2>
                  </div>
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/[0.07] text-action">
                    <Activity className="h-4 w-4" />
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-2">
                  <CompactStat
                    value={publishedReviews.length}
                    label="Reseñas"
                  />
                  <CompactStat
                    value={
                      averageRating > 0 ? averageRating.toFixed(1) : '—'
                    }
                    label="Rating"
                  />
                  <CompactStat
                    value={`${reviewProgress}%`}
                    label="Procesado"
                  />
                </div>

                <div className="mt-5 space-y-2.5">
                  <StatusRow label="Aprobados" value={approved.length} tone="approved" />
                  <StatusRow label="Pendientes" value={pending.length} tone="pending" />
                  <StatusRow label="Rechazados" value={rejected.length} tone="rejected" />
                  <StatusRow label="Suspendidos" value={suspended.length} tone="suspended" />
                  <StatusRow label="Borradores" value={drafts.length} tone="draft" />
                </div>
              </section>

              <section className="rounded-card border border-line bg-white p-5 shadow-none">
                <p className="text-xs font-bold uppercase tracking-[0.08em] text-action">
                  Accesos rápidos
                </p>
                <h2 className="mt-1 text-base font-bold text-ink">
                  Herramientas
                </h2>

                <div className="mt-4 space-y-2">
                  <QuickLink
                    href="/admin/restaurants"
                    icon={Clock3}
                    title="Solicitudes"
                    description={`${pending.length} pendientes`}
                  />
                  <QuickLink
                    href="/admin/restaurants/all"
                    icon={Store}
                    title="Restaurantes"
                    description={`${restaurants.length} registros`}
                  />
                  <QuickLink
                    href="/admin/users"
                    icon={Users}
                    title="Usuarios"
                    description={`${profiles.length} perfiles`}
                  />
                  <QuickLink
                    href="/admin/audit"
                    icon={FileClock}
                    title="Auditoría"
                    description="Historial del sistema"
                  />
                </div>
              </section>
            </aside>
          </div>

          <section className="mt-6 overflow-hidden rounded-card border border-line bg-white shadow-none">
            <div className="flex items-center justify-between gap-4 border-b border-border/60 px-5 py-5 sm:px-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.08em] text-action">
                  Trazabilidad
                </p>
                <h2 className="mt-1 text-lg font-bold text-ink">
                  Actividad reciente
                </h2>
              </div>

              <Link
                href="/admin/audit"
                className="inline-flex items-center gap-2 text-xs font-bold text-action transition hover:gap-3"
              >
                Ver auditoría
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {auditLogs.length === 0 ? (
              <div className="flex min-h-[180px] items-center justify-center p-8 text-center">
                <div>
                  <FileClock className="mx-auto h-6 w-6 text-muted-foreground/40" />
                  <p className="mt-3 text-sm font-bold text-ink">
                    Sin actividad registrada
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid divide-y divide-border/60 md:grid-cols-2 md:divide-x md:divide-y-0">
                <div className="divide-y divide-border/60">
                  {auditLogs.slice(0, 4).map((log) => (
                    <AuditLogItem key={log.id} log={log} />
                  ))}
                </div>
                <div className="divide-y divide-border/60">
                  {auditLogs.slice(4, 8).map((log) => (
                    <AuditLogItem key={log.id} log={log} />
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </AdminLayout>
  );
}

function SummaryCard({
  label,
  value,
  description,
  icon: Icon,
  tone,
  href,
}: {
  label: string;
  value: number;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: 'amber' | 'green' | 'blue' | 'teal';
  href?: string;
}) {
  const styles = {
    amber: 'bg-warning-soft text-warning',
    green: 'bg-success-soft text-success',
    blue: 'bg-blue-50 text-blue-700',
    teal: 'bg-primary/[0.08] text-action',
  };

  const content = (
    <div className="rounded-card border border-line bg-white p-5 shadow-none transition group-hover:-translate-y-0.5 group-hover:border-primary/15">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">
            {label}
          </p>
          <p className="mt-3 text-3xl font-bold tracking-[-0.045em] text-ink">
            {value}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {description}
          </p>
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${styles[tone]}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>

      {href && (
        <div className="mt-4 flex items-center gap-1.5 border-t border-border/60 pt-3 text-xs font-bold text-action">
          Abrir sección
          <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
        </div>
      )}
    </div>
  );

  return href ? (
    <Link href={href} className="group block">
      {content}
    </Link>
  ) : (
    <div className="group">{content}</div>
  );
}

function PriorityCard({
  title,
  value,
  description,
  href,
  icon: Icon,
  tone,
}: {
  title: string;
  value: number;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: 'amber' | 'red' | 'orange';
}) {
  const styles = {
    amber: {
      wrap: 'border-warning/25 bg-amber-50/70',
      icon: 'bg-white text-warning',
    },
    red: {
      wrap: 'border-danger/25 bg-red-50/60',
      icon: 'bg-white text-danger',
    },
    orange: {
      wrap: 'border-warning/25 bg-orange-50/60',
      icon: 'bg-white text-warning',
    },
  };

  const current = styles[tone];

  return (
    <Link
      href={href}
      className={`group rounded-2xl border p-4 transition hover:-translate-y-0.5 ${current.wrap}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl shadow-sm ${current.icon}`}>
          <Icon className="h-4 w-4" />
        </div>
        <span className="text-2xl font-bold tracking-[-0.04em] text-ink">
          {value}
        </span>
      </div>

      <h3 className="mt-4 text-sm font-bold text-ink">{title}</h3>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">
        {description}
      </p>
      <div className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-action">
        Revisar
        <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
      </div>
    </Link>
  );
}

function ActivityMetric({
  label,
  value,
  previous,
  icon: Icon,
}: {
  label: string;
  value: number;
  previous: number;
  icon: React.ComponentType<{ className?: string }>;
}) {
  const trend = getTrend(value, previous);
  const TrendIcon = trend.icon;

  return (
    <div className="rounded-card border border-line bg-white p-5 shadow-none">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">
            {label}
          </p>
          <p className="mt-3 text-3xl font-bold tracking-[-0.045em] text-ink">
            {value}
          </p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/[0.07] text-action">
          <Icon className="h-4 w-4" />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3">
        <span className={`inline-flex items-center gap-1 text-xs font-bold ${trend.className}`}>
          <TrendIcon className="h-3.5 w-3.5" />
          {trend.label}
        </span>
        <span className="text-xs text-muted-foreground">vs. período anterior</span>
      </div>
    </div>
  );
}

function ApplicationRow({
  restaurant,
  ownerName,
}: {
  restaurant: RestaurantRow;
  ownerName: string;
}) {
  return (
    <Link
      href={`/admin/restaurants/${restaurant.id}`}
      className="group flex items-center gap-4 px-5 py-4 transition hover:bg-canvas sm:px-6"
    >
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-warning-soft text-warning">
        <Store className="h-4 w-4" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="truncate text-sm font-bold text-ink">
            {restaurant.name}
          </h3>
          <span className="rounded-full border border-warning/25 bg-warning-soft px-2 py-1 text-xs font-bold text-warning">
            Pendiente
          </span>
        </div>

        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span>{ownerName}</span>
          <span className="h-1 w-1 rounded-full bg-border" />
          <span>{formatDate(restaurant.created_at)}</span>
        </div>
      </div>

      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-border text-muted-foreground transition group-hover:border-primary/20 group-hover:bg-primary/[0.04] group-hover:text-action">
        <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
      </div>
    </Link>
  );
}

function CompactStat({
  value,
  label,
}: {
  value: number | string;
  label: string;
}) {
  return (
    <div className="rounded-xl bg-canvas px-3 py-3 text-center">
      <p className="text-lg font-bold tracking-[-0.03em] text-ink">{value}</p>
      <p className="mt-1 text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </p>
    </div>
  );
}

function StatusRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: 'approved' | 'pending' | 'rejected' | 'suspended' | 'draft';
}) {
  const styles = {
    approved: { dot: 'bg-emerald-500', badge: 'bg-success-soft text-success' },
    pending: { dot: 'bg-amber-500', badge: 'bg-warning-soft text-warning' },
    rejected: { dot: 'bg-red-500', badge: 'bg-danger-soft text-danger' },
    suspended: { dot: 'bg-orange-500', badge: 'bg-warning-soft text-warning' },
    draft: { dot: 'bg-slate-400', badge: 'bg-slate-100 text-slate-600' },
  };

  const current = styles[tone];

  return (
    <div className="flex items-center justify-between rounded-xl bg-canvas px-3.5 py-2.5">
      <div className="flex items-center gap-3">
        <span className={`h-2 w-2 rounded-full ${current.dot}`} />
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
      </div>
      <span className={`min-w-8 rounded-lg px-2 py-1 text-center text-xs font-bold ${current.badge}`}>
        {value}
      </span>
    </div>
  );
}

function AuditLogItem({ log }: { log: AuditLogRow }) {
  const config = getAuditConfig(log.action);
  const Icon = config.icon;

  return (
    <Link
      href="/admin/audit"
      className="group flex items-center gap-4 px-5 py-4 transition hover:bg-canvas sm:px-6"
    >
      <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${config.className}`}>
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-xs font-bold text-ink">{config.label}</p>
          <span className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
            {log.table_name}
          </span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          {formatRelativeDate(log.created_at)}
        </p>
      </div>
      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-action" />
    </Link>
  );
}

function QuickLink({
  href,
  icon: Icon,
  title,
  description,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-xl border border-transparent bg-canvas px-3 py-3 transition hover:border-primary/10 hover:bg-primary/[0.035]"
    >
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-white text-action shadow-sm">
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold text-ink">{title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      </div>
      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-action" />
    </Link>
  );
}

function EmptyModeration() {
  return (
    <div className="flex min-h-[260px] items-center justify-center p-8 text-center">
      <div className="max-w-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-success-soft text-success">
          <CheckCircle2 className="h-5 w-5" />
        </div>
        <h3 className="mt-4 text-base font-bold text-ink">Moderación al día</h3>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          No hay solicitudes esperando una decisión administrativa.
        </p>
      </div>
    </div>
  );
}

function getTrend(current: number, previous: number) {
  if (previous === 0 && current > 0) {
    return {
      label: 'Nuevo',
      className: 'text-action',
      icon: ArrowUpRight,
    };
  }

  if (previous === 0 && current === 0) {
    return {
      label: 'Sin variación',
      className: 'text-muted-foreground',
      icon: CircleMinus,
    };
  }

  const change = Math.round(((current - previous) / previous) * 100);

  if (change > 0) {
    return {
      label: `+${change}%`,
      className: 'text-success',
      icon: ArrowUpRight,
    };
  }

  if (change < 0) {
    return {
      label: `${change}%`,
      className: 'text-danger',
      icon: ArrowDownRight,
    };
  }

  return {
    label: 'Sin variación',
    className: 'text-muted-foreground',
    icon: CircleMinus,
  };
}

function getAuditConfig(action: string) {
  switch (action.toLowerCase()) {
    case 'insert':
      return {
        label: 'Registro creado',
        icon: CheckCircle2,
        className: 'bg-success-soft text-success',
      };
    case 'update':
      return {
        label: 'Registro actualizado',
        icon: Activity,
        className: 'bg-blue-50 text-blue-600',
      };
    case 'delete':
      return {
        label: 'Registro eliminado',
        icon: XCircle,
        className: 'bg-danger-soft text-danger',
      };
    default:
      return {
        label: action,
        icon: FileClock,
        className: 'bg-slate-100 text-slate-600',
      };
  }
}

function filterBetween<T extends { created_at: string }>(
  items: T[],
  start: Date,
  end: Date
) {
  return items.filter((item) => {
    const date = new Date(item.created_at);
    return date >= start && date < end;
  });
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('es-NI', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

function formatRelativeDate(value: string) {
  const date = new Date(value);
  const now = new Date();
  const diff = Math.max(0, now.getTime() - date.getTime());
  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) return 'Ahora';
  if (minutes < 60) return `Hace ${minutes} min`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Hace ${hours} ${hours === 1 ? 'hora' : 'horas'}`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `Hace ${days} ${days === 1 ? 'día' : 'días'}`;

  return formatDate(value);
}
