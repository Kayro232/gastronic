import Link from 'next/link';
import { redirect } from 'next/navigation';

import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Eye,
  MessageSquareText,
  Plus,
  Star,
  Store,
  UsersRound,
  XCircle,
} from 'lucide-react';

import { DataLoadError } from '@/components/common/data-load-error';
import { OwnerLayout } from '@/components/owner/owner-layout';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/server';

interface RestaurantImageRow {
  kind: string;
  storage_path: string | null;
  external_url: string | null;
  sort_order: number;
}

interface RestaurantItem {
  id: string;
  name: string;
  short_description: string | null;
  status: string;
  is_verified: boolean;
  rejection_reason: string | null;
  average_rating: number;
  reviews_count: number;
  visits_count: number;
  created_at: string;
  restaurant_images?: RestaurantImageRow[] | null;
}

type StatusConfig = {
  label: string;
  description: string;
  icon: typeof Store;
  badgeClassName: string;
  accentClassName: string;
};

const statusConfig: Record<string, StatusConfig> = {
  draft: {
    label: 'Borrador',
    description: 'Todavía no has enviado este restaurante para revisión.',
    icon: Store,
    badgeClassName: 'border-slate-200 bg-slate-50 text-slate-700',
    accentClassName: 'bg-slate-400',
  },
  pending: {
    label: 'En revisión',
    description: 'Nuestro equipo está revisando la solicitud.',
    icon: Clock3,
    badgeClassName: 'border-warning/25 bg-warning-soft text-warning',
    accentClassName: 'bg-amber-400',
  },
  approved: {
    label: 'Publicado',
    description: 'Visible actualmente para los usuarios de GastroNic Tour.',
    icon: CheckCircle2,
    badgeClassName: 'border-success/25 bg-success-soft text-success',
    accentClassName: 'bg-emerald-400',
  },
  rejected: {
    label: 'Requiere cambios',
    description: 'Necesita correcciones antes de volver a enviarse.',
    icon: XCircle,
    badgeClassName: 'border-danger/25 bg-danger-soft text-danger',
    accentClassName: 'bg-rose-400',
  },
  suspended: {
    label: 'Suspendido',
    description: 'La publicación de este restaurante está suspendida.',
    icon: AlertTriangle,
    badgeClassName: 'border-danger/25 bg-danger-soft text-danger',
    accentClassName: 'bg-rose-400',
  },
  archived: {
    label: 'Archivado',
    description: 'Este restaurante se encuentra archivado.',
    icon: Store,
    badgeClassName: 'border-slate-200 bg-slate-50 text-slate-600',
    accentClassName: 'bg-slate-400',
  },
};

export default async function OwnerRestaurantsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/owner/login');
  }

  const { data, error } = await supabase
    .from('restaurants')
    .select(`
      id,
      name,
      short_description,
      status,
      is_verified,
      rejection_reason,
      average_rating,
      reviews_count,
      visits_count,
      created_at,
      restaurant_images (
        kind,
        storage_path,
        external_url,
        sort_order
      )
    `)
    .eq('created_by', user.id)
    .order('created_at', {
      ascending: false,
    });

  if (error) {
    console.error('Error cargando restaurantes:', error);

    return (
      <OwnerLayout>
        <div className="min-h-screen bg-canvas">
          <div className="mx-auto max-w-[1500px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
            <DataLoadError
              title="No pudimos cargar tus restaurantes"
              description="Ocurrió un problema al consultar tu portafolio. Tus restaurantes no desaparecieron; intenta cargar los datos nuevamente."
            />
          </div>
        </div>
      </OwnerLayout>
    );
  }

  const restaurants = (data ?? []) as RestaurantItem[];

  const approved = restaurants.filter(
    (restaurant) => restaurant.status === 'approved'
  ).length;

  const pending = restaurants.filter(
    (restaurant) => restaurant.status === 'pending'
  ).length;

  const requiresChanges = restaurants.filter(
    (restaurant) => restaurant.status === 'rejected'
  ).length;

  const totalReviews = restaurants.reduce(
    (total, restaurant) => total + Number(restaurant.reviews_count || 0),
    0
  );

  return (
    <OwnerLayout>
      <div className="min-h-screen bg-canvas">
        <div className="mx-auto max-w-[1500px] px-4 py-7 sm:px-6 lg:px-8 lg:py-8">
          {/* HEADER */}
          <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.08em] text-action">
                Gestión de negocios
              </p>

              <h1 className="mt-2 text-4xl font-extrabold tracking-[-0.05em] text-[#0F2930] sm:text-[42px] sm:leading-none">
                Mis restaurantes
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
                Consulta el estado de tus establecimientos y entra directamente a administrar cada negocio.
              </p>
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
          </header>

          {/* SUMMARY */}
          {restaurants.length > 0 && (
            <section className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <SummaryCard
                icon={Store}
                label="Restaurantes"
                value={restaurants.length}
                description="Asociados a tu cuenta"
                tone="teal"
              />

              <SummaryCard
                icon={CheckCircle2}
                label="Publicados"
                value={approved}
                description="Visibles en GastroNic"
                tone="emerald"
              />

              <SummaryCard
                icon={Clock3}
                label="En revisión"
                value={pending}
                description="Esperando moderación"
                tone="amber"
              />

              <SummaryCard
                icon={MessageSquareText}
                label="Reseñas"
                value={totalReviews}
                description={
                  requiresChanges > 0
                    ? `${requiresChanges} negocio${requiresChanges === 1 ? '' : 's'} requiere${requiresChanges === 1 ? '' : 'n'} cambios`
                    : 'Sin cambios pendientes'
                }
                tone={requiresChanges > 0 ? 'rose' : 'blue'}
              />
            </section>
          )}

          {restaurants.length === 0 ? (
            <EmptyState />
          ) : (
            <section className="mt-6">
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-[0.08em] text-action">
                    Tu portafolio
                  </p>
                  <h2 className="mt-1 text-xl font-extrabold tracking-[-0.03em] text-ink">
                    Establecimientos
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    {restaurants.length}{' '}
                    {restaurants.length === 1 ? 'restaurante asociado' : 'restaurantes asociados'} a tu cuenta.
                  </p>
                </div>

                <p className="text-xs font-semibold text-slate-400">
                  Selecciona un restaurante para administrarlo
                </p>
              </div>

              <div className="grid gap-4 xl:grid-cols-2">
                {restaurants.map((restaurant) => (
                  <RestaurantCard
                    key={restaurant.id}
                    restaurant={restaurant}
                    imageUrl={getRestaurantImageUrl(restaurant, supabase)}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </OwnerLayout>
  );
}

function RestaurantCard({
  restaurant,
  imageUrl,
}: {
  restaurant: RestaurantItem;
  imageUrl: string | null;
}) {
  const config = statusConfig[restaurant.status] ?? statusConfig.draft;
  const StatusIcon = config.icon;

  return (
    <article className="group relative overflow-hidden rounded-card border border-line bg-white shadow-none transition duration-200 hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-raised">
      <div className={`absolute inset-x-0 top-0 h-1 ${config.accentClassName}`} />

      <div className="p-4 sm:p-5">
        <div className="flex gap-4">
          <div className="relative h-[92px] w-[92px] flex-shrink-0 overflow-hidden rounded-2xl border border-[#E8EEEB] bg-[#EFF7F5] sm:h-[104px] sm:w-[104px]">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={`Portada de ${restaurant.name}`}
                className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#E6F6F2] to-[#F4FAF8] text-action">
                <Store className="h-8 w-8" />
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="truncate text-[17px] font-extrabold tracking-[-0.025em] text-ink">
                  {restaurant.name}
                </h3>

                <span
                  className={`mt-2 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-extrabold ${config.badgeClassName}`}
                >
                  <StatusIcon className="h-3 w-3" />
                  {config.label}
                </span>
              </div>

              {restaurant.is_verified && (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/[0.08] px-2 py-1 text-xs font-extrabold uppercase tracking-[0.08em] text-action">
                  <CheckCircle2 className="h-3 w-3" />
                  Verificado
                </span>
              )}
            </div>

            <p className="mt-3 line-clamp-2 min-h-[40px] text-xs leading-5 text-slate-500">
              {restaurant.short_description || config.description}
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 divide-x divide-[#E9EFEC] rounded-2xl border border-line bg-[#FAFCFB] py-3">
          <MiniMetric
            icon={Star}
            value={
              restaurant.status === 'approved'
                ? Number(restaurant.average_rating || 0).toFixed(1)
                : '—'
            }
            label="Rating"
          />

          <MiniMetric
            icon={MessageSquareText}
            value={Number(restaurant.reviews_count || 0)}
            label="Reseñas"
          />

          <MiniMetric
            icon={UsersRound}
            value={Number(restaurant.visits_count || 0)}
            label="Visitas"
          />
        </div>

        {restaurant.status === 'rejected' && restaurant.rejection_reason && (
          <div className="mt-4 rounded-2xl border border-danger/25 bg-rose-50/70 px-4 py-3">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-rose-500" />
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.08em] text-danger">
                  Cambios solicitados
                </p>
                <p className="mt-1 line-clamp-2 text-xs leading-5 text-danger">
                  {restaurant.rejection_reason}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-4 flex flex-col gap-3 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            {restaurant.status === 'approved' ? (
              <>
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-success-soft text-success">
                  <Eye className="h-3.5 w-3.5" />
                </span>
                <span>Publicado en GastroNic Tour</span>
              </>
            ) : (
              <>
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#F2F6F4] text-slate-500">
                  <StatusIcon className="h-3.5 w-3.5" />
                </span>
                <span>{config.description}</span>
              </>
            )}
          </div>

          <Link
            href={`/owner/restaurants/${restaurant.id}`}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#103C3A] px-4 text-xs font-extrabold text-white transition hover:bg-action"
          >
            Administrar
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </article>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  description,
  tone,
}: {
  icon: typeof Store;
  label: string;
  value: number;
  description: string;
  tone: 'teal' | 'emerald' | 'amber' | 'rose' | 'blue';
}) {
  const tones = {
    teal: 'bg-[#E7F7F4] text-action',
    emerald: 'bg-success-soft text-success',
    amber: 'bg-warning-soft text-warning',
    rose: 'bg-danger-soft text-danger',
    blue: 'bg-sky-50 text-sky-600',
  } as const;

  return (
    <div className="flex min-h-[112px] items-center gap-4 rounded-card border border-[#E5ECE9] bg-white p-4 shadow-none">
      <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl ${tones[tone]}`}>
        <Icon className="h-5 w-5" />
      </div>

      <div className="min-w-0">
        <p className="text-2xl font-extrabold tracking-[-0.04em] text-ink">
          {value}
        </p>
        <p className="mt-0.5 text-xs font-extrabold text-[#17302F]">
          {label}
        </p>
        <p className="mt-1 truncate text-xs text-slate-400">
          {description}
        </p>
      </div>
    </div>
  );
}

function MiniMetric({
  icon: Icon,
  value,
  label,
}: {
  icon: typeof Store;
  value: string | number;
  label: string;
}) {
  return (
    <div className="flex min-w-0 items-center justify-center gap-2 px-2">
      <Icon className="h-3.5 w-3.5 flex-shrink-0 text-action" />
      <div className="min-w-0">
        <p className="text-xs font-extrabold text-ink">{value}</p>
        <p className="text-xs text-slate-400">{label}</p>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <section className="mt-8 overflow-hidden rounded-card border border-[#E1EAE6] bg-white shadow-none">
      <div className="grid lg:grid-cols-[1fr_0.7fr]">
        <div className="px-6 py-12 text-center lg:px-12 lg:py-16 lg:text-left">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E8F7F3] text-action lg:mx-0">
            <Store className="h-6 w-6" />
          </div>

          <p className="mt-5 text-xs font-extrabold uppercase tracking-[0.08em] text-action">
            Empieza tu portafolio
          </p>

          <h2 className="mt-2 text-2xl font-extrabold tracking-[-0.035em] text-ink">
            Registra tu primer restaurante
          </h2>

          <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-slate-500 lg:mx-0">
            Añade la información de tu establecimiento y envíalo a revisión. Cuando sea aprobado podrás gestionar imágenes, menú, horarios, reservaciones y reseñas desde aquí.
          </p>

          <Button
            asChild
            className="mt-6 h-11 rounded-xl bg-[#103C3A] px-5 font-extrabold text-white hover:bg-action"
          >
            <Link href="/owner/restaurants/new">
              <Plus className="mr-2 h-4 w-4" />
              Registrar restaurante
            </Link>
          </Button>
        </div>

        <div className="relative hidden min-h-[320px] overflow-hidden bg-gradient-to-br from-[#E6F6F2] via-[#F5FBF9] to-[#FFF8E7] lg:flex lg:items-center lg:justify-center">
          <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-primary/10" />
          <div className="absolute -bottom-20 -left-16 h-48 w-48 rounded-full bg-secondary/15" />
          <div className="relative flex h-28 w-28 items-center justify-center rounded-card border border-white/70 bg-white/80 text-action shadow-raised backdrop-blur">
            <Store className="h-12 w-12" />
          </div>
        </div>
      </div>
    </section>
  );
}

function getRestaurantImageUrl(
  restaurant: RestaurantItem,
  supabase: Awaited<ReturnType<typeof createClient>>
) {
  const images = [...(restaurant.restaurant_images ?? [])].sort((a, b) => {
    if (a.kind === 'cover' && b.kind !== 'cover') return -1;
    if (b.kind === 'cover' && a.kind !== 'cover') return 1;
    return a.sort_order - b.sort_order;
  });

  const image = images[0];

  if (!image) {
    return null;
  }

  if (image.external_url) {
    return image.external_url;
  }

  if (!image.storage_path) {
    return null;
  }

  return supabase.storage
    .from('restaurant-images')
    .getPublicUrl(image.storage_path).data.publicUrl;
}
