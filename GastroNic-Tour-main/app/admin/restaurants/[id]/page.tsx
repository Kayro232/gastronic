import Link from 'next/link';

import {
  notFound,
  redirect,
} from 'next/navigation';

import {
  ArrowLeft,
  Building2,
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Eye,
  Facebook,
  FileClock,
  Globe2,
  Heart,
  ImageIcon,
  Instagram,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
  Sparkles,
  Star,
  Store,
  Tags,
  User,
  Users,
  XCircle,
} from 'lucide-react';

import { AdminLayout } from '@/components/admin/admin-layout';
import { RestaurantReviewActions } from '@/components/admin/restaurant-review-actions';
import { RestaurantVisibilityControls } from '@/components/admin/restaurant-visibility-controls';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/server';

/* ========================================================== */
/* TYPES                                                      */
/* ========================================================== */

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

interface HourRow {
  id: string;
  restaurant_id: string;
  day_of_week: number;
  opens_at: string | null;
  closes_at: string | null;
  is_closed: boolean;
}

interface ImageRow {
  id: string;
  restaurant_id: string;
  kind: string;
  storage_path: string | null;
  external_url: string | null;
  alt_text: string | null;
  sort_order: number;
}

interface AmenityRelationRow {
  amenity:
    | {
        id: number;
        name: string;
        slug: string;
        icon: string | null;
      }
    | {
        id: number;
        name: string;
        slug: string;
        icon: string | null;
      }[]
    | null;
}

interface ReservationRow {
  id: string;
  guest_name: string;
  reserved_for: string;
  party_size: number;
  status: string;
  created_at: string;
}

interface ReviewProfile {
  id: string;
  full_name: string;
  username: string | null;
}

interface ReviewRow {
  id: string;
  rating: number;
  title: string | null;
  comment: string;
  status: string;
  is_verified_visit: boolean;
  created_at: string;

  profile:
    | ReviewProfile
    | ReviewProfile[]
    | null;
}

interface VisitRow {
  id: string;
  visited_at: string;
  verification_status: string;
  verification_method: string | null;
  created_at: string;
}

interface AuditRow {
  id: number;
  actor_id: string | null;
  action: string;
  table_name: string;
  record_id: string | null;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  created_at: string;
}

/* ========================================================== */
/* PAGE                                                       */
/* ========================================================== */

export default async function AdminRestaurantReviewPage({
  params,
}: PageProps) {
  const { id } =
    await params;

  if (!isValidUuid(id)) {
    notFound();
  }

  const supabase =
    await createClient();

  /* ======================================================== */
  /* SESSION                                                  */
  /* ======================================================== */

  const {
    data: { user },
  } =
    await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  /* ======================================================== */
  /* ADMIN                                                    */
  /* ======================================================== */

  const {
    data: adminRole,
    error: adminRoleError,
  } = await supabase
    .from('user_roles')
    .select('role')
    .eq(
      'user_id',
      user.id
    )
    .eq(
      'role',
      'admin'
    )
    .maybeSingle();

  if (adminRoleError) {
    console.error(
      'Error verificando admin:',
      adminRoleError
    );
  }

  if (!adminRole) {
    redirect('/');
  }

  /* ======================================================== */
  /* RESTAURANT                                               */
  /* ======================================================== */

  const {
    data: restaurant,
    error: restaurantError,
  } = await supabase
    .from('restaurants')
    .select(`
      id,
      created_by,
      name,
      slug,
      short_description,
      description,
      address,
      phone,
      whatsapp,
      email,
      website_url,
      facebook_url,
      instagram_url,
      price_level,
      estimated_price_min,
      estimated_price_max,
      accepts_reservations,
      status,
      is_verified,
      is_featured,
      average_rating,
      reviews_count,
      favorites_count,
      visits_count,
      published_at,
      rejection_reason,
      created_at,
      updated_at,

      municipality:municipalities (
        id,
        name,

        department:departments (
          id,
          name
        )
      ),

      categories:restaurant_categories (
        category:categories (
          id,
          name,
          slug
        )
      ),

      owner:profiles!restaurants_created_by_fkey (
        id,
        full_name,
        username
      )
    `)
    .eq(
      'id',
      id
    )
    .maybeSingle();

  if (restaurantError) {
    console.error(
      'Error cargando restaurante:',
      restaurantError
    );
  }

  if (!restaurant) {
    notFound();
  }

  /* ======================================================== */
  /* RELATED DATA                                             */
  /* ======================================================== */

  const [
    hoursResult,
    imagesResult,
    amenitiesResult,
    reservationsResult,
    reviewsResult,
    visitsResult,
    auditResult,
  ] = await Promise.all([
    supabase
      .from('restaurant_hours')
      .select(`
        id,
        restaurant_id,
        day_of_week,
        opens_at,
        closes_at,
        is_closed
      `)
      .eq(
        'restaurant_id',
        id
      )
      .order(
        'day_of_week',
        {
          ascending: true,
        }
      ),

    supabase
      .from('restaurant_images')
      .select(`
        id,
        restaurant_id,
        kind,
        storage_path,
        external_url,
        alt_text,
        sort_order
      `)
      .eq(
        'restaurant_id',
        id
      )
      .order(
        'sort_order',
        {
          ascending: true,
        }
      ),

    supabase
      .from('restaurant_amenities')
      .select(`
        amenity:amenities (
          id,
          name,
          slug,
          icon
        )
      `)
      .eq(
        'restaurant_id',
        id
      ),

    supabase
      .from('reservations')
      .select(`
        id,
        guest_name,
        reserved_for,
        party_size,
        status,
        created_at
      `)
      .eq(
        'restaurant_id',
        id
      )
      .order(
        'reserved_for',
        {
          ascending: false,
        }
      )
      .limit(5),

    supabase
      .from('reviews')
      .select(`
        id,
        rating,
        title,
        comment,
        status,
        is_verified_visit,
        created_at,

        profile:profiles!reviews_user_id_fkey (
          id,
          full_name,
          username
        )
      `)
      .eq(
        'restaurant_id',
        id
      )
      .order(
        'created_at',
        {
          ascending: false,
        }
      )
      .limit(5),

    supabase
      .from('visits')
      .select(`
        id,
        visited_at,
        verification_status,
        verification_method,
        created_at
      `)
      .eq(
        'restaurant_id',
        id
      )
      .order(
        'visited_at',
        {
          ascending: false,
        }
      )
      .limit(5),

    supabase
      .from('audit_logs')
      .select(`
        id,
        actor_id,
        action,
        table_name,
        record_id,
        old_data,
        new_data,
        created_at
      `)
      .eq(
        'table_name',
        'restaurants'
      )
      .eq(
        'record_id',
        id
      )
      .order(
        'created_at',
        {
          ascending: false,
        }
      )
      .limit(6),
  ]);

  if (hoursResult.error) {
    console.error(
      'Error cargando horarios:',
      hoursResult.error
    );
  }

  if (imagesResult.error) {
    console.error(
      'Error cargando imágenes:',
      imagesResult.error
    );
  }

  if (amenitiesResult.error) {
    console.error(
      'Error cargando amenidades:',
      amenitiesResult.error
    );
  }

  if (reservationsResult.error) {
    console.error(
      'Error cargando reservaciones:',
      reservationsResult.error
    );
  }

  if (reviewsResult.error) {
    console.error(
      'Error cargando reseñas:',
      reviewsResult.error
    );
  }

  if (visitsResult.error) {
    console.error(
      'Error cargando visitas:',
      visitsResult.error
    );
  }

  if (auditResult.error) {
    console.error(
      'Error cargando auditoría:',
      auditResult.error
    );
  }

  const hours =
    (hoursResult.data ??
      []) as HourRow[];

  const images =
    (imagesResult.data ??
      []) as ImageRow[];

  const amenityRelations =
    (amenitiesResult.data ??
      []) as unknown as AmenityRelationRow[];

  const reservations =
    (reservationsResult.data ??
      []) as ReservationRow[];

  const reviews =
    (reviewsResult.data ??
      []) as unknown as ReviewRow[];

  const visits =
    (visitsResult.data ??
      []) as VisitRow[];

  const auditLogs =
    (auditResult.data ??
      []) as AuditRow[];

  /* ======================================================== */
  /* NORMALIZE RELATIONS                                      */
  /* ======================================================== */

  const municipality =
    Array.isArray(
      restaurant.municipality
    )
      ? restaurant.municipality[0]
      : restaurant.municipality;

  const department =
    municipality
      ? Array.isArray(
          municipality.department
        )
        ? municipality.department[0]
        : municipality.department
      : null;

  const owner =
    Array.isArray(
      restaurant.owner
    )
      ? restaurant.owner[0]
      : restaurant.owner;

  const categories =
    (
      restaurant.categories ??
      []
    )
      .map(
        (item: any) =>
          Array.isArray(
            item.category
          )
            ? item.category[0]
            : item.category
      )
      .filter(Boolean);

  const amenities =
    amenityRelations
      .map(
        (item) =>
          Array.isArray(
            item.amenity
          )
            ? item.amenity[0]
            : item.amenity
      )
      .filter(
        (
          amenity
        ): amenity is {
          id: number;
          name: string;
          slug: string;
          icon: string | null;
        } =>
          Boolean(
            amenity
          )
      );

  /* ======================================================== */
  /* DERIVED                                                  */
  /* ======================================================== */

  const statusConfig = {
    pending: {
      label:
        'Pendiente de revisión',

      description:
        'Esta solicitud requiere una decisión administrativa.',

      icon:
        Clock3,

      badge:
        'border-warning/25 bg-warning-soft text-warning',
    },

    approved: {
      label:
        'Aprobado',

      description:
        'El restaurante está publicado en GastroNic.',

      icon:
        CheckCircle2,

      badge:
        'border-success/25 bg-success-soft text-success',
    },

    rejected: {
      label:
        'Rechazado',

      description:
        'El propietario debe realizar correcciones.',

      icon:
        XCircle,

      badge:
        'border-danger/25 bg-danger-soft text-danger',
    },

    draft: {
      label:
        'Borrador',

      description:
        'El restaurante aún no ha sido enviado.',

      icon:
        Store,

      badge:
        'border-slate-200 bg-slate-50 text-slate-600',
    },

    suspended: {
      label:
        'Suspendido',

      description:
        'La publicación está temporalmente detenida.',

      icon:
        XCircle,

      badge:
        'border-warning/25 bg-warning-soft text-warning',
    },

    archived: {
      label:
        'Archivado',

      description:
        'El restaurante se encuentra fuera de operación.',

      icon:
        Store,

      badge:
        'border-slate-200 bg-slate-50 text-slate-600',
    },
  };

  const currentStatus =
    statusConfig[
      restaurant.status as keyof typeof statusConfig
    ] ??
    statusConfig.draft;

  const StatusIcon =
    currentStatus.icon;

  const priceLevel =
    Math.min(
      Math.max(
        Number(
          restaurant.price_level ??
            1
        ),
        1
      ),
      4
    );

  const externalImages =
    images.filter(
      (image) =>
        Boolean(
          image.external_url
        )
    );

  const storedImages =
    images.filter(
      (image) =>
        !image.external_url &&
        Boolean(
          image.storage_path
        )
    );

  const coverImage =
    externalImages.find(
      (image) =>
        image.kind ===
        'cover'
    ) ??
    externalImages[0] ??
    null;

  const activeReservations =
    reservations.filter(
      (reservation) =>
        reservation.status ===
          'pending' ||
        reservation.status ===
          'confirmed'
    ).length;

  const averageRating =
    Number(
      restaurant.average_rating ??
        0
    );

  /* ======================================================== */
  /* RENDER                                                   */
  /* ======================================================== */

  return (
    <AdminLayout>
      <div className="min-h-screen bg-[#F5F7F8]">
        <div className="mx-auto max-w-[1520px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
          {/* ================================================== */}
          {/* BACK                                               */}
          {/* ================================================== */}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link
              href="/admin/restaurants"
              className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground transition hover:text-action"
            >
              <ArrowLeft className="h-4 w-4" />

              Volver a solicitudes
            </Link>

            <Link
              href="/admin/restaurants/all"
              className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground transition hover:text-action"
            >
              Inventario completo
            </Link>
          </div>

          {/* ================================================== */}
          {/* HERO                                               */}
          {/* ================================================== */}

          <section className="relative mt-6 overflow-hidden rounded-sheet bg-ink text-white shadow-overlay">

            <div className="grid lg:grid-cols-[minmax(0,1fr)_380px]">
              <div className="relative p-6 sm:p-8 lg:p-10">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold ${currentStatus.badge}`}
                  >
                    <StatusIcon className="h-3.5 w-3.5" />

                    {currentStatus.label}
                  </span>

                  {restaurant.is_verified && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/15 px-3 py-1.5 text-xs font-bold text-white">
                      <ShieldCheck className="h-3.5 w-3.5 text-secondary" />

                      Verificado
                    </span>
                  )}

                  {restaurant.is_featured && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1.5 text-xs font-bold text-amber-200">
                      <Sparkles className="h-3.5 w-3.5" />

                      Destacado
                    </span>
                  )}
                </div>

                <h1 className="mt-6 max-w-4xl text-3xl font-bold tracking-[-0.045em] sm:text-4xl lg:text-5xl">
                  {restaurant.name}
                </h1>

                {restaurant.short_description && (
                  <p className="mt-4 max-w-3xl text-sm leading-7 text-white/55 sm:text-base">
                    {
                      restaurant.short_description
                    }
                  </p>
                )}

                <div className="mt-7 flex flex-wrap gap-x-6 gap-y-3 text-xs text-white/45">
                  <MetaItemDark
                    icon={
                      CalendarDays
                    }
                  >
                    Registrado{' '}
                    {formatDate(
                      restaurant.created_at
                    )}
                  </MetaItemDark>

                  {municipality && (
                    <MetaItemDark
                      icon={MapPin}
                    >
                      {[
                        municipality.name,
                        department?.name,
                      ]
                        .filter(
                          Boolean
                        )
                        .join(
                          ', '
                        )}
                    </MetaItemDark>
                  )}

                  <MetaItemDark
                    icon={
                      ShieldCheck
                    }
                  >
                    {
                      currentStatus.description
                    }
                  </MetaItemDark>
                </div>

                <div className="mt-8 flex flex-wrap gap-3">
                  {restaurant.status ===
                    'approved' && (
                    <Button
                      asChild
                      className="h-10 rounded-xl bg-white px-4 font-bold text-ink hover:bg-white/90"
                    >
                      <Link
                        href={`/restaurant/${restaurant.id}`}
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />

                        Ver página pública
                      </Link>
                    </Button>
                  )}

                  <div className="inline-flex h-10 items-center rounded-xl border border-white/10 bg-white/[0.06] px-4 font-mono text-xs text-white/45">
                    ID{' '}
                    {restaurant.id.slice(
                      0,
                      8
                    )}
                  </div>
                </div>
              </div>

              {/* IMAGE */}

              <div className="relative min-h-[260px] border-t border-white/10 lg:border-l lg:border-t-0">
                {coverImage?.external_url ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={
                        coverImage.external_url
                      }
                      alt={
                        coverImage.alt_text ||
                        restaurant.name
                      }
                      className="absolute inset-0 h-full w-full object-cover"
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-ink/75 via-transparent to-transparent" />

                    <div className="absolute bottom-5 left-5 rounded-xl border border-white/15 bg-ink/70 px-3 py-2 backdrop-blur-md">
                      <p className="text-xs font-bold uppercase tracking-[0.08em] text-white/40">
                        Imagen principal
                      </p>

                      <p className="mt-0.5 text-xs font-bold text-white">
                        Cover del restaurante
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="flex h-full min-h-[260px] items-center justify-center bg-white/[0.035]">
                    <div className="text-center">
                      <ImageIcon className="mx-auto h-7 w-7 text-white/20" />

                      <p className="mt-3 text-xs font-semibold text-white/30">
                        Sin imagen externa disponible
                      </p>

                      {storedImages.length >
                        0 && (
                        <p className="mt-1 text-xs text-white/20">
                          {storedImages.length}{' '}
                          {storedImages.length ===
                          1
                            ? 'imagen almacenada'
                            : 'imágenes almacenadas'}{' '}
                          en Storage
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* ================================================== */}
          {/* REJECTION                                         */}
          {/* ================================================== */}

          {restaurant.status ===
            'rejected' &&
            restaurant.rejection_reason && (
              <section className="mt-6 overflow-hidden rounded-card border border-danger/25 bg-red-50/70 p-5">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-danger-soft">
                    <XCircle className="h-4 w-4 text-danger" />
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.08em] text-danger">
                      Motivo del rechazo
                    </p>

                    <p className="mt-2 whitespace-pre-line text-sm leading-6 text-danger">
                      {
                        restaurant.rejection_reason
                      }
                    </p>
                  </div>
                </div>
              </section>
            )}

          {/* ================================================== */}
          {/* METRICS                                           */}
          {/* ================================================== */}

          <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <MetricCard
              icon={Star}
              label="Rating"
              value={
                averageRating >
                0
                  ? averageRating.toFixed(
                      1
                    )
                  : '—'
              }
              detail={`${restaurant.reviews_count ?? 0} reseñas`}
            />

            <MetricCard
              icon={
                MessageCircle
              }
              label="Reseñas"
              value={
                restaurant.reviews_count ??
                0
              }
              detail="Opiniones registradas"
            />

            <MetricCard
              icon={Eye}
              label="Visitas"
              value={
                restaurant.visits_count ??
                0
              }
              detail="Visitas registradas"
            />

            <MetricCard
              icon={Heart}
              label="Favoritos"
              value={
                restaurant.favorites_count ??
                0
              }
              detail="Usuarios interesados"
            />

            <MetricCard
              icon={
                CalendarCheck
              }
              label="Reservas"
              value={
                activeReservations
              }
              detail="Activas en la muestra"
            />

            <MetricCard
              icon={ImageIcon}
              label="Imágenes"
              value={
                images.length
              }
              detail="Recursos visuales"
            />
          </section>

          {/* ================================================== */}
          {/* MAIN                                              */}
          {/* ================================================== */}

          <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_390px]">
            {/* ================================================= */}
            {/* LEFT                                              */}
            {/* ================================================= */}

            <div className="space-y-6">
              {/* DOSSIER */}

              <section className="overflow-hidden rounded-sheet border border-border/70 bg-white shadow-none">
                <SectionHeader
                  eyebrow="Expediente"
                  title="Información del establecimiento"
                  description="Datos principales registrados por el propietario y utilizados en la experiencia pública."
                />

                <div className="divide-y divide-border/60">
                  <DossierSection
                    icon={
                      Building2
                    }
                    title="Información general"
                    description="Identidad y descripción."
                  >
                    <FieldGrid>
                      <InfoField
                        label="Nombre"
                        value={
                          restaurant.name
                        }
                      />

                      <InfoField
                        label="Slug"
                        value={
                          restaurant.slug ||
                          'No generado'
                        }
                      />

                      <InfoField
                        label="Descripción corta"
                        value={
                          restaurant.short_description ||
                          'No proporcionada'
                        }
                        fullWidth
                      />

                      <InfoField
                        label="Descripción completa"
                        value={
                          restaurant.description ||
                          'No proporcionada'
                        }
                        fullWidth
                      />
                    </FieldGrid>
                  </DossierSection>

                  <DossierSection
                    icon={MapPin}
                    title="Ubicación"
                    description="Localización pública."
                  >
                    <FieldGrid>
                      <InfoField
                        label="Departamento"
                        value={
                          department?.name ||
                          'No especificado'
                        }
                      />

                      <InfoField
                        label="Municipio"
                        value={
                          municipality?.name ||
                          'No especificado'
                        }
                      />

                      <InfoField
                        label="Dirección"
                        value={
                          restaurant.address ||
                          'No proporcionada'
                        }
                        fullWidth
                      />
                    </FieldGrid>
                  </DossierSection>

                  <DossierSection
                    icon={Tags}
                    title="Categorías"
                    description="Clasificación gastronómica."
                  >
                    {categories.length >
                    0 ? (
                      <div className="flex flex-wrap gap-2">
                        {categories.map(
                          (
                            category: any
                          ) => (
                            <span
                              key={
                                category.id
                              }
                              className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/[0.06] px-3 py-2 text-xs font-bold text-action"
                            >
                              <Store className="h-3.5 w-3.5" />

                              {
                                category.name
                              }
                            </span>
                          )
                        )}
                      </div>
                    ) : (
                      <EmptyValue>
                        No se seleccionaron categorías.
                      </EmptyValue>
                    )}
                  </DossierSection>

                  <DossierSection
                    icon={Phone}
                    title="Contacto"
                    description="Canales públicos del negocio."
                  >
                    <div className="grid gap-3 sm:grid-cols-2">
                      <ContactField
                        icon={Phone}
                        label="Teléfono"
                        value={
                          restaurant.phone
                        }
                      />

                      <ContactField
                        icon={
                          MessageCircle
                        }
                        label="WhatsApp"
                        value={
                          restaurant.whatsapp
                        }
                      />

                      <ContactField
                        icon={Mail}
                        label="Correo"
                        value={
                          restaurant.email
                        }
                      />

                      <ContactField
                        icon={
                          Globe2
                        }
                        label="Sitio web"
                        value={
                          restaurant.website_url
                        }
                      />
                    </div>
                  </DossierSection>

                  <DossierSection
                    icon={Globe2}
                    title="Presencia digital"
                    description="Canales sociales asociados."
                  >
                    <div className="grid gap-3 sm:grid-cols-2">
                      <ContactField
                        icon={
                          Facebook
                        }
                        label="Facebook"
                        value={
                          restaurant.facebook_url
                        }
                      />

                      <ContactField
                        icon={
                          Instagram
                        }
                        label="Instagram"
                        value={
                          restaurant.instagram_url
                        }
                      />
                    </div>
                  </DossierSection>

                  <DossierSection
                    icon={Store}
                    title="Precio y servicio"
                    description="Consumo estimado y reservaciones."
                  >
                    <FieldGrid>
                      <InfoField
                        label="Nivel de precio"
                        value={
                          '$'.repeat(
                            priceLevel
                          )
                        }
                      />

                      <InfoField
                        label="Reservaciones"
                        value={
                          restaurant.accepts_reservations
                            ? 'Sí acepta reservaciones'
                            : 'No acepta reservaciones'
                        }
                      />

                      <InfoField
                        label="Consumo mínimo"
                        value={
                          restaurant.estimated_price_min !==
                          null
                            ? `C$ ${Number(
                                restaurant.estimated_price_min
                              ).toLocaleString(
                                'es-NI'
                              )}`
                            : 'No especificado'
                        }
                      />

                      <InfoField
                        label="Consumo máximo"
                        value={
                          restaurant.estimated_price_max !==
                          null
                            ? `C$ ${Number(
                                restaurant.estimated_price_max
                              ).toLocaleString(
                                'es-NI'
                              )}`
                            : 'No especificado'
                        }
                      />
                    </FieldGrid>
                  </DossierSection>
                </div>
              </section>

              {/* HOURS */}

              <section className="overflow-hidden rounded-sheet border border-border/70 bg-white shadow-none">
                <SectionHeader
                  eyebrow="Operación"
                  title="Horarios"
                  description="Horario semanal configurado para el establecimiento."
                />

                {hours.length >
                0 ? (
                  <div className="grid gap-2 p-5 sm:grid-cols-2 sm:p-6 lg:grid-cols-3">
                    {hours.map(
                      (hour) => (
                        <HourCard
                          key={
                            hour.id
                          }
                          hour={
                            hour
                          }
                        />
                      )
                    )}
                  </div>
                ) : (
                  <EmptyPanel>
                    No hay horarios configurados.
                  </EmptyPanel>
                )}
              </section>

              {/* AMENITIES */}

              <section className="overflow-hidden rounded-sheet border border-border/70 bg-white shadow-none">
                <SectionHeader
                  eyebrow="Experiencia"
                  title="Amenidades"
                  description="Servicios y características declaradas por el negocio."
                />

                {amenities.length >
                0 ? (
                  <div className="flex flex-wrap gap-2 p-5 sm:p-6">
                    {amenities.map(
                      (
                        amenity
                      ) => (
                        <span
                          key={
                            amenity.id
                          }
                          className="inline-flex items-center gap-2 rounded-xl border border-border/70 bg-canvas px-3 py-2.5 text-xs font-semibold text-ink"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 text-action" />

                          {
                            amenity.name
                          }
                        </span>
                      )
                    )}
                  </div>
                ) : (
                  <EmptyPanel>
                    No hay amenidades asociadas.
                  </EmptyPanel>
                )}
              </section>

              {/* IMAGES */}

              <section className="overflow-hidden rounded-sheet border border-border/70 bg-white shadow-none">
                <SectionHeader
                  eyebrow="Identidad visual"
                  title="Imágenes"
                  description={`${images.length} recursos visuales registrados para este restaurante.`}
                />

                {images.length >
                0 ? (
                  <div className="p-5 sm:p-6">
                    {externalImages.length >
                      0 && (
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {externalImages.map(
                          (
                            image
                          ) => (
                            <div
                              key={
                                image.id
                              }
                              className="group overflow-hidden rounded-2xl border border-border/70 bg-canvas"
                            >
                              <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={
                                    image.external_url!
                                  }
                                  alt={
                                    image.alt_text ||
                                    restaurant.name
                                  }
                                  className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.025]"
                                />

                                <span className="absolute left-3 top-3 rounded-lg bg-ink/80 px-2 py-1 text-xs font-bold uppercase tracking-[0.08em] text-white backdrop-blur">
                                  {getImageKindLabel(
                                    image.kind
                                  )}
                                </span>
                              </div>

                              <div className="p-3">
                                <p className="truncate text-xs font-semibold text-ink">
                                  {image.alt_text ||
                                    'Sin texto alternativo'}
                                </p>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    )}

                    {storedImages.length >
                      0 && (
                      <div className="mt-4 rounded-xl border border-border/70 bg-canvas p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">
                          Archivos en Storage
                        </p>

                        <div className="mt-3 space-y-2">
                          {storedImages.map(
                            (
                              image
                            ) => (
                              <div
                                key={
                                  image.id
                                }
                                className="flex items-center gap-3"
                              >
                                <ImageIcon className="h-3.5 w-3.5 flex-shrink-0 text-action" />

                                <span className="min-w-0 flex-1 truncate font-mono text-xs text-muted-foreground">
                                  {
                                    image.storage_path
                                  }
                                </span>

                                <span className="text-xs font-bold uppercase text-muted-foreground">
                                  {getImageKindLabel(
                                    image.kind
                                  )}
                                </span>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <EmptyPanel>
                    Este restaurante todavía no tiene imágenes registradas.
                  </EmptyPanel>
                )}
              </section>

              {/* ACTIVITY */}

              <section className="overflow-hidden rounded-sheet border border-border/70 bg-white shadow-none">
                <SectionHeader
                  eyebrow="Actividad"
                  title="Señales recientes"
                  description="Últimos movimientos relacionados con clientes y visitas."
                />

                <div className="grid divide-y divide-border/60 lg:grid-cols-3 lg:divide-x lg:divide-y-0">
                  <ActivityColumn
                    icon={Star}
                    title="Reseñas"
                    empty={
                      reviews.length ===
                      0
                    }
                    emptyText="Sin reseñas recientes."
                  >
                    {reviews.map(
                      (review) => {
                        const profile =
                          Array.isArray(
                            review.profile
                          )
                            ? review.profile[0]
                            : review.profile;

                        return (
                          <ActivityItem
                            key={
                              review.id
                            }
                            title={
                              review.title ||
                              profile?.full_name ||
                              profile?.username ||
                              'Reseña'
                            }
                            subtitle={`${review.rating}/5 · ${getReviewStatusLabel(
                              review.status
                            )}`}
                            date={
                              review.created_at
                            }
                          />
                        );
                      }
                    )}
                  </ActivityColumn>

                  <ActivityColumn
                    icon={
                      CalendarCheck
                    }
                    title="Reservaciones"
                    empty={
                      reservations.length ===
                      0
                    }
                    emptyText="Sin reservaciones recientes."
                  >
                    {reservations.map(
                      (
                        reservation
                      ) => (
                        <ActivityItem
                          key={
                            reservation.id
                          }
                          title={
                            reservation.guest_name
                          }
                          subtitle={`${reservation.party_size} ${
                            reservation.party_size ===
                            1
                              ? 'persona'
                              : 'personas'
                          } · ${getReservationStatusLabel(
                            reservation.status
                          )}`}
                          date={
                            reservation.reserved_for
                          }
                        />
                      )
                    )}
                  </ActivityColumn>

                  <ActivityColumn
                    icon={Eye}
                    title="Visitas"
                    empty={
                      visits.length ===
                      0
                    }
                    emptyText="Sin visitas recientes."
                  >
                    {visits.map(
                      (visit) => (
                        <ActivityItem
                          key={
                            visit.id
                          }
                          title={getVisitStatusLabel(
                            visit.verification_status
                          )}
                          subtitle={
                            visit.verification_method
                              ? `Método: ${getVerificationMethodLabel(
                                  visit.verification_method
                                )}`
                              : 'Sin método de verificación'
                          }
                          date={
                            visit.visited_at
                          }
                        />
                      )
                    )}
                  </ActivityColumn>
                </div>
              </section>

              {/* AUDIT */}

              <section className="overflow-hidden rounded-sheet border border-border/70 bg-white shadow-none">
                <div className="flex flex-col gap-4 border-b border-border/60 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.08em] text-action">
                      Trazabilidad
                    </p>

                    <h2 className="mt-1 text-lg font-bold text-ink">
                      Historial del restaurante
                    </h2>

                    <p className="mt-1 text-xs text-muted-foreground">
                      Últimos cambios registrados sobre el expediente principal.
                    </p>
                  </div>

                  <Link
                    href={`/admin/audit?period=all`}
                    className="inline-flex items-center gap-2 text-xs font-bold text-action"
                  >
                    <FileClock className="h-3.5 w-3.5" />

                    Auditoría completa
                  </Link>
                </div>

                {auditLogs.length >
                0 ? (
                  <div className="divide-y divide-border/60">
                    {auditLogs.map(
                      (log) => (
                        <AuditItem
                          key={
                            log.id
                          }
                          log={log}
                        />
                      )
                    )}
                  </div>
                ) : (
                  <EmptyPanel>
                    No hay eventos de auditoría para este restaurante.
                  </EmptyPanel>
                )}
              </section>
            </div>

            {/* ================================================= */}
            {/* SIDEBAR                                           */}
            {/* ================================================= */}

            <aside className="space-y-5 xl:sticky xl:top-[100px] xl:self-start">
              {/* OWNER */}

              <section className="rounded-card border border-border/70 bg-white p-5 shadow-none">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10">
                    <User className="h-5 w-5 text-action" />
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">
                      Propietario
                    </p>

                    <p className="mt-1 truncate text-sm font-bold text-ink">
                      {owner?.full_name ||
                        owner?.username ||
                        'Usuario'}
                    </p>

                    {owner?.username && (
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        @
                        {
                          owner.username
                        }
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-4 border-t border-border/60 pt-4">
                  <p className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">
                    ID de usuario
                  </p>

                  <p className="mt-1 break-all font-mono text-xs leading-5 text-muted-foreground">
                    {
                      restaurant.created_by
                    }
                  </p>
                </div>
              </section>

              {/* VISIBILITY */}

              <section className="rounded-card border border-border/70 bg-white p-5 shadow-none">
                <div className="mb-4">
                  <p className="text-xs font-bold uppercase tracking-[0.08em] text-action">
                    Visibilidad
                  </p>

                  <h3 className="mt-1 text-sm font-bold text-ink">
                    Presencia en GastroNic
                  </h3>

                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    Controla la confianza y exposición del establecimiento.
                  </p>
                </div>

                <RestaurantVisibilityControls
                  restaurantId={
                    restaurant.id
                  }
                  restaurantName={
                    restaurant.name
                  }
                  status={
                    restaurant.status
                  }
                  initialVerified={
                    restaurant.is_verified
                  }
                  initialFeatured={
                    restaurant.is_featured
                  }
                />
              </section>

              {/* MODERATION CHECKLIST */}

              {(restaurant.status ===
                'pending' ||
                restaurant.status ===
                  'rejected') && (
                <section className="rounded-card border border-border/70 bg-white p-5 shadow-none">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10">
                      <CheckCircle2 className="h-4 w-4 text-action" />
                    </div>

                    <div>
                      <p className="text-sm font-bold text-ink">
                        Revisión recomendada
                      </p>

                      <p className="mt-1 text-xs leading-5 text-muted-foreground">
                        Comprueba estos puntos antes de decidir.
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 space-y-3">
                    <CheckItem>
                      Nombre e información coherentes
                    </CheckItem>

                    <CheckItem>
                      Dirección suficientemente clara
                    </CheckItem>

                    <CheckItem>
                      Categorías adecuadas
                    </CheckItem>

                    <CheckItem>
                      Medios de contacto válidos
                    </CheckItem>

                    <CheckItem>
                      Imágenes y horarios razonables
                    </CheckItem>

                    <CheckItem>
                      Cumple el estándar de GastroNic
                    </CheckItem>
                  </div>
                </section>
              )}

              {/* ACTIONS */}

              <RestaurantReviewActions
                restaurantId={
                  restaurant.id
                }
                restaurantName={
                  restaurant.name
                }
                status={
                  restaurant.status
                }
              />

              {/* STATUS */}

              <section className="rounded-card border border-border/70 bg-white p-5 shadow-none">
                <p className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">
                  Estado administrativo
                </p>

                <div className="mt-4 space-y-3">
                  <SidebarStatus
                    label="Estado"
                    value={
                      currentStatus.label
                    }
                  />

                  <SidebarStatus
                    label="Publicado"
                    value={
                      restaurant.published_at
                        ? formatDateTime(
                            restaurant.published_at
                          )
                        : 'No publicado'
                    }
                  />

                  <SidebarStatus
                    label="Actualizado"
                    value={
                      formatRelativeDate(
                        restaurant.updated_at
                      )
                    }
                  />

                  <SidebarStatus
                    label="Reservaciones"
                    value={
                      restaurant.accepts_reservations
                        ? 'Habilitadas'
                        : 'Deshabilitadas'
                    }
                  />
                </div>
              </section>

              {/* BRAND CARD */}

              <section className="relative overflow-hidden rounded-card bg-ink p-5 text-white shadow-overlay">

                <div className="relative">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                    <ShieldCheck className="h-4 w-4 text-secondary" />
                  </div>

                  <p className="mt-5 text-xs font-bold uppercase tracking-[0.08em] text-white/35">
                    Control administrativo
                  </p>

                  <h3 className="mt-2 text-base font-bold">
                    Un expediente completo facilita decisiones mejores.
                  </h3>

                  <p className="mt-2 text-xs leading-5 text-white/45">
                    La información de esta pantalla combina configuración,
                    actividad y trazabilidad del establecimiento.
                  </p>
                </div>
              </section>
            </aside>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

/* ========================================================== */
/* SECTION HEADER                                             */
/* ========================================================== */

function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="border-b border-border/60 px-5 py-5 sm:px-6">
      <p className="text-xs font-bold uppercase tracking-[0.08em] text-action">
        {eyebrow}
      </p>

      <h2 className="mt-1 text-lg font-bold tracking-[-0.02em] text-ink">
        {title}
      </h2>

      <p className="mt-1 text-xs leading-5 text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

/* ========================================================== */
/* DOSSIER                                                    */
/* ========================================================== */

function DossierSection({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ComponentType<{
    className?: string;
  }>;

  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="px-5 py-6 sm:px-6 sm:py-7">
      <div className="flex flex-col gap-5 lg:flex-row lg:gap-8">
        <div className="flex min-w-0 gap-3 lg:w-[220px] lg:flex-shrink-0">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary/[0.08]">
            <Icon className="h-4 w-4 text-action" />
          </div>

          <div>
            <h3 className="text-sm font-bold text-ink">
              {title}
            </h3>

            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              {description}
            </p>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          {children}
        </div>
      </div>
    </section>
  );
}

function FieldGrid({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
      {children}
    </div>
  );
}

function InfoField({
  label,
  value,
  fullWidth = false,
}: {
  label: string;
  value: string;
  fullWidth?: boolean;
}) {
  return (
    <div
      className={
        fullWidth
          ? 'sm:col-span-2'
          : ''
      }
    >
      <p className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </p>

      <p className="mt-1.5 whitespace-pre-line text-sm leading-6 text-ink">
        {value}
      </p>
    </div>
  );
}

/* ========================================================== */
/* CONTACT                                                    */
/* ========================================================== */

function ContactField({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{
    className?: string;
  }>;

  label: string;
  value: string | null;
}) {
  return (
    <div className="rounded-xl bg-canvas p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-white shadow-sm">
          <Icon className="h-3.5 w-3.5 text-action" />
        </div>

        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">
            {label}
          </p>

          <p className="mt-1 break-all text-xs font-semibold leading-5 text-ink">
            {value ||
              'No proporcionado'}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ========================================================== */
/* METRICS                                                    */
/* ========================================================== */

function MetricCard({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: React.ComponentType<{
    className?: string;
  }>;

  label: string;

  value:
    | string
    | number;

  detail: string;
}) {
  return (
    <div className="rounded-card border border-border/70 bg-white p-4 shadow-none">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">
            {label}
          </p>

          <p className="mt-2 text-2xl font-bold tracking-[-0.04em] text-ink">
            {value}
          </p>
        </div>

        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/[0.07] text-action">
          <Icon className="h-4 w-4" />
        </div>
      </div>

      <p className="mt-2 truncate text-xs text-muted-foreground">
        {detail}
      </p>
    </div>
  );
}

/* ========================================================== */
/* HOURS                                                      */
/* ========================================================== */

function HourCard({
  hour,
}: {
  hour: HourRow;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl bg-canvas px-4 py-3">
      <div>
        <p className="text-xs font-bold text-ink">
          {getDayLabel(
            hour.day_of_week
          )}
        </p>

        <p className="mt-1 text-xs text-muted-foreground">
          {hour.is_closed
            ? 'Sin atención'
            : 'Horario de servicio'}
        </p>
      </div>

      <span
        className={`text-xs font-bold ${
          hour.is_closed
            ? 'text-red-500'
            : 'text-action'
        }`}
      >
        {hour.is_closed
          ? 'Cerrado'
          : `${formatTime(
              hour.opens_at
            )} – ${formatTime(
              hour.closes_at
            )}`}
      </span>
    </div>
  );
}

/* ========================================================== */
/* ACTIVITY                                                   */
/* ========================================================== */

function ActivityColumn({
  icon: Icon,
  title,
  empty,
  emptyText,
  children,
}: {
  icon: React.ComponentType<{
    className?: string;
  }>;

  title: string;
  empty: boolean;
  emptyText: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0 p-5 sm:p-6">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/[0.07] text-action">
          <Icon className="h-3.5 w-3.5" />
        </div>

        <h3 className="text-xs font-bold text-ink">
          {title}
        </h3>
      </div>

      {empty ? (
        <p className="text-xs leading-5 text-muted-foreground">
          {emptyText}
        </p>
      ) : (
        <div className="space-y-3">
          {children}
        </div>
      )}
    </div>
  );
}

function ActivityItem({
  title,
  subtitle,
  date,
}: {
  title: string;
  subtitle: string;
  date: string;
}) {
  return (
    <div className="border-b border-border/50 pb-3 last:border-0 last:pb-0">
      <p className="truncate text-xs font-bold text-ink">
        {title}
      </p>

      <p className="mt-1 truncate text-xs text-muted-foreground">
        {subtitle}
      </p>

      <p className="mt-1 text-xs text-muted-foreground/70">
        {formatRelativeDate(
          date
        )}
      </p>
    </div>
  );
}

/* ========================================================== */
/* AUDIT                                                      */
/* ========================================================== */

function AuditItem({
  log,
}: {
  log: AuditRow;
}) {
  const config =
    getAuditActionConfig(
      log.action
    );

  const Icon =
    config.icon;

  const changedFields =
    getChangedFieldCount(
      log.old_data,
      log.new_data
    );

  return (
    <div className="flex items-center gap-4 px-5 py-4 sm:px-6">
      <div
        className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${config.iconClass}`}
      >
        <Icon className="h-3.5 w-3.5" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-xs font-bold text-ink">
            {config.label}
          </p>

          {changedFields >
            0 && (
            <span className="rounded-md bg-surface-2 px-2 py-1 text-xs font-semibold text-muted-foreground">
              {changedFields}{' '}
              {changedFields ===
              1
                ? 'cambio'
                : 'cambios'}
            </span>
          )}
        </div>

        <p className="mt-1 text-xs text-muted-foreground">
          {formatDateTime(
            log.created_at
          )}
        </p>
      </div>

      {log.actor_id && (
        <span
          title={
            log.actor_id
          }
          className="hidden font-mono text-xs text-muted-foreground lg:block"
        >
          Actor{' '}
          {log.actor_id.slice(
            0,
            8
          )}
        </span>
      )}
    </div>
  );
}

/* ========================================================== */
/* SIDEBAR                                                    */
/* ========================================================== */

function SidebarStatus({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border/50 pb-3 last:border-0 last:pb-0">
      <span className="text-xs text-muted-foreground">
        {label}
      </span>

      <span className="max-w-[190px] text-right text-xs font-bold text-ink">
        {value}
      </span>
    </div>
  );
}

function CheckItem({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl bg-canvas px-3 py-2.5">
      <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-action" />

      <p className="text-xs leading-5 text-muted-foreground">
        {children}
      </p>
    </div>
  );
}

/* ========================================================== */
/* META                                                       */
/* ========================================================== */

function MetaItemDark({
  icon: Icon,
  children,
}: {
  icon: React.ComponentType<{
    className?: string;
  }>;

  children: React.ReactNode;
}) {
  return (
    <span className="flex items-center gap-2">
      <Icon className="h-3.5 w-3.5 flex-shrink-0 text-secondary" />

      {children}
    </span>
  );
}

/* ========================================================== */
/* EMPTY                                                      */
/* ========================================================== */

function EmptyValue({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl bg-canvas px-4 py-3 text-sm text-muted-foreground">
      {children}
    </div>
  );
}

function EmptyPanel({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[150px] items-center justify-center p-6 text-center">
      <p className="max-w-sm text-sm leading-6 text-muted-foreground">
        {children}
      </p>
    </div>
  );
}

/* ========================================================== */
/* LABELS                                                     */
/* ========================================================== */

function getDayLabel(
  day: number
) {
  const days = [
    'Domingo',
    'Lunes',
    'Martes',
    'Miércoles',
    'Jueves',
    'Viernes',
    'Sábado',
  ];

  return (
    days[day] ??
    `Día ${day}`
  );
}

function getImageKindLabel(
  kind: string
) {
  if (
    kind ===
    'cover'
  ) {
    return 'Portada';
  }

  if (
    kind ===
    'logo'
  ) {
    return 'Logo';
  }

  return 'Galería';
}

function getReviewStatusLabel(
  status: string
) {
  const labels:
    Record<
      string,
      string
    > = {
      pending:
        'Pendiente',

      published:
        'Publicada',

      rejected:
        'Rechazada',

      hidden:
        'Oculta',
    };

  return (
    labels[status] ??
    status
  );
}

function getReservationStatusLabel(
  status: string
) {
  const labels:
    Record<
      string,
      string
    > = {
      pending:
        'Pendiente',

      confirmed:
        'Confirmada',

      cancelled:
        'Cancelada',

      completed:
        'Completada',

      no_show:
        'No asistió',
    };

  return (
    labels[status] ??
    status
  );
}

function getVisitStatusLabel(
  status: string
) {
  const labels:
    Record<
      string,
      string
    > = {
      pending:
        'Visita pendiente',

      verified:
        'Visita verificada',

      rejected:
        'Visita rechazada',
    };

  return (
    labels[status] ??
    status
  );
}

function getVerificationMethodLabel(
  method: string
) {
  const labels:
    Record<
      string,
      string
    > = {
      manual:
        'Manual',

      qr:
        'QR',

      location:
        'Ubicación',

      reservation:
        'Reservación',
    };

  return (
    labels[method] ??
    method
  );
}

/* ========================================================== */
/* AUDIT HELPERS                                              */
/* ========================================================== */

function getAuditActionConfig(
  action: string
) {
  if (
    action ===
    'insert'
  ) {
    return {
      label:
        'Restaurante creado',

      icon:
        CheckCircle2,

      iconClass:
        'bg-success-soft text-success',
    };
  }

  if (
    action ===
    'update'
  ) {
    return {
      label:
        'Restaurante actualizado',

      icon:
        FileClock,

      iconClass:
        'bg-blue-50 text-blue-600',
    };
  }

  if (
    action ===
    'delete'
  ) {
    return {
      label:
        'Restaurante eliminado',

      icon:
        XCircle,

      iconClass:
        'bg-danger-soft text-danger',
    };
  }

  return {
    label:
      'Actividad registrada',

    icon:
      FileClock,

    iconClass:
      'bg-slate-100 text-slate-600',
  };
}

function getChangedFieldCount(
  oldData:
    | Record<
        string,
        unknown
      >
    | null,

  newData:
    | Record<
        string,
        unknown
      >
    | null
) {
  if (
    !oldData ||
    !newData
  ) {
    return 0;
  }

  const ignored =
    new Set([
      'search_document',
      'updated_at',
    ]);

  const fields =
    new Set([
      ...Object.keys(
        oldData
      ),

      ...Object.keys(
        newData
      ),
    ]);

  return Array.from(
    fields
  ).filter(
    (field) =>
      !ignored.has(
        field
      ) &&
      JSON.stringify(
        oldData[field]
      ) !==
        JSON.stringify(
          newData[field]
        )
  ).length;
}

/* ========================================================== */
/* DATE                                                       */
/* ========================================================== */

function formatDate(
  value: string
) {
  return new Intl.DateTimeFormat(
    'es-NI',
    {
      day:
        'numeric',

      month:
        'short',

      year:
        'numeric',
    }
  ).format(
    new Date(value)
  );
}

function formatDateTime(
  value: string
) {
  return new Intl.DateTimeFormat(
    'es-NI',
    {
      day:
        'numeric',

      month:
        'short',

      year:
        'numeric',

      hour:
        'numeric',

      minute:
        '2-digit',
    }
  ).format(
    new Date(value)
  );
}

function formatRelativeDate(
  value: string
) {
  const date =
    new Date(value);

  const now =
    new Date();

  const difference =
    Math.max(
      0,
      now.getTime() -
        date.getTime()
    );

  const minutes =
    Math.floor(
      difference /
        60_000
    );

  if (
    minutes <
    1
  ) {
    return 'Ahora';
  }

  if (
    minutes <
    60
  ) {
    return `Hace ${minutes} min`;
  }

  const hours =
    Math.floor(
      minutes /
        60
    );

  if (
    hours <
    24
  ) {
    return `Hace ${hours} ${
      hours ===
      1
        ? 'hora'
        : 'horas'
    }`;
  }

  const days =
    Math.floor(
      hours /
        24
    );

  if (
    days <
    30
  ) {
    return `Hace ${days} ${
      days ===
      1
        ? 'día'
        : 'días'
    }`;
  }

  return formatDate(
    value
  );
}

function formatTime(
  value:
    | string
    | null
) {
  if (!value) {
    return '—';
  }

  const [
    hourText,
    minuteText,
  ] =
    value.split(':');

  const hour =
    Number(
      hourText
    );

  const minute =
    Number(
      minuteText
    );

  if (
    Number.isNaN(
      hour
    ) ||
    Number.isNaN(
      minute
    )
  ) {
    return value;
  }

  const suffix =
    hour >=
    12
      ? 'PM'
      : 'AM';

  const normalizedHour =
    hour %
      12 ||
    12;

  return `${normalizedHour}:${String(
    minute
  ).padStart(
    2,
    '0'
  )} ${suffix}`;
}

/* ========================================================== */
/* UUID                                                       */
/* ========================================================== */

function isValidUuid(
  value: string
) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}