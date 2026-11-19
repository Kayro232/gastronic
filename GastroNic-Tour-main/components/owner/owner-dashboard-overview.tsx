import Image from 'next/image';
import Link from 'next/link';

import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  MessageSquareText,
  Plus,
  Sparkles,
  Store,
  TrendingUp,
} from 'lucide-react';

import { Button } from '@/components/ui/button';

/* ========================================================== */
/* TYPES                                                      */
/* ========================================================== */

export interface DashboardRestaurant {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  status: string;
  averageRating: number;
  reviewsCount: number;
  visitsCount: number;
  favoritesCount: number;
  isVerified: boolean;
  isFeatured: boolean;
  coverImage: string | null;
  createdAt: string;
  pendingReservations: number;
  unansweredReviews: number;
}

export interface DashboardReservation {
  id: string;
  restaurantId: string;
  restaurantName: string;
  guestName: string;
  reservedFor: string;
  partySize: number;
  status: string;
  createdAt: string;
}

export interface DashboardReview {
  id: string;
  restaurantId: string;
  restaurantName: string;
  rating: number;
  createdAt: string;
}

interface Props {
  ownerName: string;
  restaurants: DashboardRestaurant[];
  reservations: DashboardReservation[];
  reviews: DashboardReview[];
  totalFavorites: number;
  totalVisits: number;
  recentFavorites: number;
  previousFavorites: number;
  recentVisits: number;
  previousVisits: number;
  recentReviews: number;
  previousReviews: number;
}

type ActivityItem = {
  key: string;
  title: string;
  subtitle: string;
  href: string;
  date: string;
  type: 'restaurant' | 'reservation' | 'review';
};

/* ========================================================== */
/* PAGE                                                       */
/* ========================================================== */

export function OwnerDashboardOverview({
  ownerName,
  restaurants,
  reservations,
  reviews,
}: Props) {
  const approved = restaurants.filter(
    (restaurant) => restaurant.status === 'approved'
  );

  const pending = restaurants.filter(
    (restaurant) => restaurant.status === 'pending'
  );

  const rejected = restaurants.filter(
    (restaurant) => restaurant.status === 'rejected'
  );

  const pendingReservations = reservations.filter(
    (reservation) => reservation.status === 'pending'
  );

  const confirmedReservations = reservations.filter(
    (reservation) => reservation.status === 'confirmed'
  );

  const activeReservations =
    pendingReservations.length + confirmedReservations.length;

  const attentionCount =
    pendingReservations.length + reviews.length + rejected.length;

  const recentActivity = buildRecentActivity(
    restaurants,
    reservations,
    reviews
  );

  const promoImage =
    approved.find((restaurant) => restaurant.coverImage)?.coverImage ??
    restaurants.find((restaurant) => restaurant.coverImage)?.coverImage ??
    null;

  if (restaurants.length === 0) {
    return <EmptyDashboard ownerName={ownerName} />;
  }

  return (
    <main className="min-h-screen bg-canvas">
      <div className="mx-auto max-w-[1500px] px-4 py-7 sm:px-6 lg:px-8 lg:py-8">
        {/* HEADER */}
        <header className="relative overflow-hidden">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.08em] text-action">
                Resumen de negocios
              </p>

              <h1 className="mt-2 text-4xl font-extrabold tracking-[-0.055em] text-[#0F2930] sm:text-[44px] sm:leading-none">
                Hola, {getFirstName(ownerName)} <span aria-hidden>👋</span>
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
                Aquí tienes el estado de tus restaurantes y lo que requiere tu atención.
              </p>
            </div>

            <div className="flex items-center gap-6">
              <div className="hidden xl:block">
                <p className="rotate-[-4deg] text-right text-[17px] font-medium italic leading-5 text-slate-500">
                  Buena comida,
                  <br />
                  mejores experiencias
                </p>
                <div className="ml-auto mt-2 h-0.5 w-20 rotate-[-4deg] rounded-full bg-secondary" />
              </div>

              <Button
                asChild
                className="h-12 rounded-2xl bg-[#103C3A] px-6 font-extrabold text-white shadow-overlay transition hover:-translate-y-0.5 hover:bg-action"
              >
                <Link href="/owner/restaurants/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Registrar restaurante
                </Link>
              </Button>
            </div>
          </div>
        </header>

        {/* TOP STATS */}
        <section className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            icon={Store}
            value={restaurants.length}
            label="Negocios"
            description="Total de restaurantes"
            tone="teal"
            badge="Total"
          />

          <SummaryCard
            icon={ClipboardList}
            value={approved.length}
            label="Publicados"
            description="Visibles en GastroNic"
            tone="blue"
            badge="Visibles"
          />

          <SummaryCard
            icon={CalendarDays}
            value={activeReservations}
            label="Reservas activas"
            description="Pendientes y confirmadas"
            tone="cyan"
            badge="Activas"
          />

          <SummaryCard
            icon={AlertTriangle}
            value={attentionCount}
            label="Pendientes"
            description="Requieren tu atención"
            tone="amber"
            badge={attentionCount > 0 ? 'Revisar' : 'Al día'}
          />
        </section>

        {/* ATTENTION */}
        <section className="mt-5 rounded-card border border-[#E6ECE9] bg-white p-4 shadow-none sm:p-5">
          <div className="flex flex-col gap-3 border-b border-line pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning-soft text-warning">
                <AlertTriangle className="h-4 w-4" />
              </div>

              <div>
                <h2 className="text-lg font-extrabold tracking-[-0.02em] text-ink">
                  Requiere tu atención
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  Acciones que conviene resolver primero.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-3">
            <AttentionCard
              icon={CalendarDays}
              label="Reservaciones"
              value={pendingReservations.length}
              title={
                pendingReservations.length === 1
                  ? '1 reservación pendiente'
                  : `${pendingReservations.length} reservaciones pendientes`
              }
              description={
                pendingReservations.length > 0
                  ? 'Hay clientes esperando confirmación.'
                  : 'No tienes solicitudes pendientes.'
              }
              href="/owner/reservations"
              action={pendingReservations.length > 0 ? 'Gestionar' : 'Ver reservaciones'}
              tone="rose"
            />

            <AttentionCard
              icon={MessageSquareText}
              label="Reputación"
              value={reviews.length}
              title={
                reviews.length === 1
                  ? '1 reseña sin responder'
                  : `${reviews.length} reseñas sin responder`
              }
              description={
                reviews.length > 0
                  ? 'Responder demuestra atención y fortalece la relación con tus clientes.'
                  : 'Todas las reseñas visibles tienen respuesta.'
              }
              href="/owner/reviews"
              action={reviews.length > 0 ? 'Responder ahora' : 'Ver reseñas'}
              tone="amber"
            />

            <AttentionCard
              icon={ClipboardList}
              label="Solicitudes"
              value={rejected.length}
              title={
                rejected.length === 1
                  ? '1 restaurante requiere cambios'
                  : `${rejected.length} restaurantes requieren cambios`
              }
              description={
                rejected.length > 0
                  ? 'Corrige la información solicitada para continuar con la publicación.'
                  : pending.length > 0
                    ? `${pending.length} ${pending.length === 1 ? 'solicitud está' : 'solicitudes están'} en revisión.`
                    : 'No hay solicitudes que necesiten correcciones.'
              }
              href="/owner/restaurants"
              action={rejected.length > 0 ? 'Corregir' : 'Ver solicitudes'}
              tone="blue"
            />
          </div>
        </section>

        {/* BOTTOM */}
        <section className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.15fr)]">
          <ActivityCard items={recentActivity} />

          <BusinessGrowthCard
            imageUrl={promoImage}
            publishedCount={approved.length}
          />
        </section>
      </div>
    </main>
  );
}

/* ========================================================== */
/* SUMMARY                                                    */
/* ========================================================== */

function SummaryCard({
  icon: Icon,
  value,
  label,
  description,
  tone,
  badge,
}: {
  icon: React.ComponentType<{ className?: string }>;
  value: number;
  label: string;
  description: string;
  tone: 'teal' | 'blue' | 'cyan' | 'amber';
  badge: string;
}) {
  const toneClasses = {
    teal: 'bg-[#E6F7F4] text-[#0AA8A3]',
    blue: 'bg-[#EAF5FF] text-[#1688D8]',
    cyan: 'bg-[#E7F8F7] text-[#0DA7A3]',
    amber: 'bg-[#FFF5E2] text-[#E47B08]',
  }[tone];

  return (
    <div className="rounded-2xl border border-[#E5EBE8] bg-white p-4 shadow-none">
      <div className="flex items-start gap-4">
        <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl ${toneClasses}`}>
          <Icon className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <p className="text-3xl font-extrabold leading-none tracking-[-0.05em] text-ink">
              {value}
            </p>
            <span className="rounded-full bg-[#F3F7F5] px-2.5 py-1 text-xs font-bold text-slate-500">
              {badge}
            </span>
          </div>
          <p className="mt-2 text-xs font-extrabold text-ink">{label}</p>
          <p className="mt-1 text-xs text-slate-400">{description}</p>
        </div>
      </div>
    </div>
  );
}

/* ========================================================== */
/* ATTENTION                                                  */
/* ========================================================== */

function AttentionCard({
  icon: Icon,
  label,
  value,
  title,
  description,
  href,
  action,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  title: string;
  description: string;
  href: string;
  action: string;
  tone: 'rose' | 'amber' | 'blue';
}) {
  const styles = {
    rose: {
      card: 'border-danger/25 bg-gradient-to-br from-white to-rose-50/45',
      icon: 'bg-danger-soft text-rose-500',
      value: 'text-ink',
    },
    amber: {
      card: 'border-warning/25 bg-gradient-to-br from-white to-amber-50/55',
      icon: 'bg-warning-soft text-warning',
      value: 'text-warning',
    },
    blue: {
      card: 'border-sky-100 bg-gradient-to-br from-white to-sky-50/55',
      icon: 'bg-sky-50 text-sky-600',
      value: 'text-ink',
    },
  }[tone];

  return (
    <Link
      href={href}
      className={`group flex min-h-[182px] flex-col rounded-card border p-4 transition hover:-translate-y-0.5 hover:shadow-raised ${styles.card}`}
    >
      <div className="flex items-start gap-3">
        <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${styles.icon}`}>
          {value === 0 ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <Icon className="h-4 w-4" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-xs font-extrabold uppercase tracking-[0.08em] text-slate-400">
            {label}
          </p>
          <p className={`mt-1 text-2xl font-extrabold tracking-[-0.04em] ${styles.value}`}>
            {value}
          </p>
        </div>
      </div>

      <h3 className="mt-3 text-sm font-extrabold text-ink">{title}</h3>
      <p className="mt-1.5 flex-1 text-xs leading-5 text-slate-500">{description}</p>

      <span className="mt-3 inline-flex items-center gap-2 text-xs font-extrabold text-action">
        {action}
        <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
      </span>
    </Link>
  );
}

/* ========================================================== */
/* ACTIVITY                                                   */
/* ========================================================== */

function ActivityCard({ items }: { items: ActivityItem[] }) {
  return (
    <section className="overflow-hidden rounded-card border border-[#E5EBE8] bg-white shadow-none">
      <div className="flex items-center justify-between border-b border-line px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E7F7F4] text-action">
            <TrendingUp className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-ink">Actividad reciente</h2>
            <p className="mt-0.5 text-xs text-slate-400">Últimos movimientos de tus restaurantes.</p>
          </div>
        </div>

        <Link
          href="/owner/restaurants"
          className="inline-flex items-center gap-1.5 text-xs font-extrabold text-action"
        >
          Ver todos
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="px-5 py-8 text-center">
          <p className="text-sm font-bold text-ink">Sin actividad reciente</p>
          <p className="mt-1 text-xs text-slate-400">Los próximos movimientos aparecerán aquí.</p>
        </div>
      ) : (
        <div className="divide-y divide-[#EDF1EF] px-5">
          {items.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className="group flex items-center gap-3 py-3 transition hover:opacity-80"
            >
              <ActivityDot type={item.type} />

              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-extrabold text-ink">{item.title}</p>
                <p className="mt-0.5 truncate text-xs text-slate-400">{item.subtitle}</p>
              </div>

              <span className="flex-shrink-0 text-xs text-slate-400">
                {formatRelativeTime(item.date)}
              </span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

function ActivityDot({ type }: { type: ActivityItem['type'] }) {
  const style = {
    restaurant: 'bg-success-soft text-success',
    reservation: 'bg-sky-50 text-sky-600',
    review: 'bg-warning-soft text-warning',
  }[type];

  const Icon =
    type === 'restaurant'
      ? Store
      : type === 'reservation'
        ? CalendarDays
        : MessageSquareText;

  return (
    <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${style}`}>
      <Icon className="h-4 w-4" />
    </div>
  );
}

/* ========================================================== */
/* GROWTH                                                     */
/* ========================================================== */

function BusinessGrowthCard({
  imageUrl,
  publishedCount,
}: {
  imageUrl: string | null;
  publishedCount: number;
}) {
  return (
    <section className="relative overflow-hidden rounded-card border border-[#D9ECE7] bg-gradient-to-br from-[#F4FCFA] via-[#EEF9F6] to-[#E7F5F1] p-5 shadow-none">
      <div className="pointer-events-none absolute -left-20 -top-24 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />

      <div className="relative grid min-h-[205px] gap-5 md:grid-cols-[minmax(0,1fr)_230px] md:items-center">
        <div>
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.08em] text-action">
            <Sparkles className="h-3.5 w-3.5" />
            Haz crecer tu negocio
          </div>

          <h2 className="mt-3 max-w-md text-2xl font-extrabold leading-tight tracking-[-0.04em] text-ink">
            Llega a más comensales con GastroNic Tour
          </h2>

          <p className="mt-3 max-w-md text-xs leading-5 text-slate-500">
            Mantén tu información actualizada, responde a tus clientes y ofrece experiencias únicas desde un solo lugar.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button
              asChild
              className="h-10 rounded-xl bg-[#103C3A] px-4 text-xs font-extrabold text-white hover:bg-action"
            >
              <Link href="/owner/restaurants">
                Gestionar mis restaurantes
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>

            <span className="text-xs font-semibold text-slate-400">
              {publishedCount} {publishedCount === 1 ? 'publicado' : 'publicados'}
            </span>
          </div>
        </div>

        <div className="relative h-40 overflow-hidden rounded-card border-4 border-white bg-white shadow-raised md:h-[168px]">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt="Restaurante en GastroNic Tour"
              fill
              sizes="230px"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-[#CFEAE4] to-[#EAF6F2] text-action">
              <Store className="h-8 w-8" />
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-ink/20 via-transparent to-transparent" />
        </div>
      </div>
    </section>
  );
}

/* ========================================================== */
/* EMPTY                                                      */
/* ========================================================== */

function EmptyDashboard({ ownerName }: { ownerName: string }) {
  return (
    <main className="min-h-screen bg-canvas">
      <div className="mx-auto max-w-[1280px] px-4 py-10 sm:px-6 lg:px-8">
        <p className="text-xs font-extrabold uppercase tracking-[0.08em] text-action">
          GastroNic Business
        </p>

        <h1 className="mt-2 text-4xl font-extrabold tracking-[-0.05em] text-ink">
          Hola, {getFirstName(ownerName)} <span aria-hidden>👋</span>
        </h1>

        <p className="mt-3 text-sm text-slate-500">Tu espacio empresarial está listo.</p>

        <section className="mt-7 overflow-hidden rounded-card border border-[#DDEBE7] bg-white shadow-none">
          <div className="grid lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="p-7 sm:p-10">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E8F6F3] text-action">
                <Store className="h-5 w-5" />
              </div>

              <p className="mt-6 text-xs font-extrabold uppercase tracking-[0.08em] text-action">
                Primer paso
              </p>

              <h2 className="mt-2 text-3xl font-extrabold tracking-[-0.045em] text-ink">
                Lleva tu restaurante a GastroNic.
              </h2>

              <p className="mt-4 max-w-xl text-sm leading-6 text-slate-500">
                Crea el perfil de tu establecimiento, completa su información y envíalo a revisión. Una vez aprobado podrás administrar toda su presencia desde este portal.
              </p>

              <Button asChild className="mt-6 h-11 rounded-xl bg-[#103C3A] px-5 font-extrabold text-white hover:bg-action">
                <Link href="/owner/restaurants/new">
                  Registrar restaurante
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="relative min-h-[260px] bg-gradient-to-br from-[#DDF3EE] to-[#BFE8DF]">
              <div className="absolute inset-0 flex items-center justify-center">
                <Store className="h-20 w-20 text-primary/25" />
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

/* ========================================================== */
/* HELPERS                                                    */
/* ========================================================== */

function buildRecentActivity(
  restaurants: DashboardRestaurant[],
  reservations: DashboardReservation[],
  reviews: DashboardReview[]
): ActivityItem[] {
  const restaurantItems: ActivityItem[] = restaurants.map((restaurant) => ({
    key: `restaurant-${restaurant.id}`,
    title: 'Restaurante registrado',
    subtitle: restaurant.name,
    href: `/owner/restaurants/${restaurant.id}`,
    date: restaurant.createdAt,
    type: 'restaurant',
  }));

  const reservationItems: ActivityItem[] = reservations.map((reservation) => ({
    key: `reservation-${reservation.id}`,
    title: 'Nueva reservación',
    subtitle: `${reservation.restaurantName} · ${reservation.guestName}`,
    href: `/owner/restaurants/${reservation.restaurantId}/reservations`,
    date: reservation.createdAt,
    type: 'reservation',
  }));

  const reviewItems: ActivityItem[] = reviews.map((review) => ({
    key: `review-${review.id}`,
    title: 'Nueva reseña por responder',
    subtitle: `${review.restaurantName} · ${review.rating}/5`,
    href: `/owner/restaurants/${review.restaurantId}/reviews`,
    date: review.createdAt,
    type: 'review',
  }));

  return [...restaurantItems, ...reservationItems, ...reviewItems]
    .filter((item) => !Number.isNaN(new Date(item.date).getTime()))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 4);
}

function getFirstName(name: string) {
  const clean = name.trim();
  if (!clean) return 'Propietario';
  return clean.split(/\s+/)[0];
}

function formatRelativeTime(value: string) {
  const date = new Date(value);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  if (Number.isNaN(date.getTime())) return '';
  if (diff < 0) return 'Próximamente';

  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Ahora';
  if (minutes < 60) return `Hace ${minutes} min`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Hace ${hours} h`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `Hace ${days} d`;

  return new Intl.DateTimeFormat('es-NI', {
    day: 'numeric',
    month: 'short',
  }).format(date);
}
