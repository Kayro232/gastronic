import Link from 'next/link';

import {
  notFound,
  redirect,
} from 'next/navigation';

import {
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  ExternalLink,
  Globe2,
  ImageIcon,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Settings2,
  Sparkles,
  Star,
  Store,
  UtensilsCrossed,
  Wifi,
  XCircle,
} from 'lucide-react';

import { OwnerLayout } from '@/components/owner/owner-layout';
import { DeleteRestaurantCard } from '@/components/owner/delete-restaurant-card';
import { ReservationSettingsCard } from '@/components/owner/reservation-settings-card';
import { ResubmitRestaurantButton } from '@/components/owner/resubmit-restaurant-button';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/server';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

/* ========================================================== */
/* STATUS                                                     */
/* ========================================================== */

const statusConfig = {
  draft: {
    label: 'Borrador',
    description:
      'Todavía no has enviado este restaurante para revisión.',
    icon: Store,
    badge:
      'border-slate-200 bg-slate-50 text-slate-700',
    iconClass:
      'bg-slate-100 text-slate-600',
  },

  pending: {
    label: 'En revisión',
    description:
      'Nuestro equipo está revisando la información del establecimiento.',
    icon: Clock3,
    badge:
      'border-warning/25 bg-warning-soft text-warning',
    iconClass:
      'bg-warning-soft text-warning',
  },

  approved: {
    label: 'Aprobado',
    description:
      'El restaurante está publicado y visible en GastroNic Tour.',
    icon: CheckCircle2,
    badge:
      'border-success/25 bg-success-soft text-success',
    iconClass:
      'bg-success-soft text-success',
  },

  rejected: {
    label: 'Requiere cambios',
    description:
      'Debes corregir algunos datos antes de volver a enviar la solicitud.',
    icon: XCircle,
    badge:
      'border-danger/25 bg-danger-soft text-danger',
    iconClass:
      'bg-danger-soft text-danger',
  },

  suspended: {
    label: 'Suspendido',
    description:
      'La publicación se encuentra temporalmente suspendida.',
    icon: AlertTriangle,
    badge:
      'border-warning/25 bg-warning-soft text-warning',
    iconClass:
      'bg-warning-soft text-warning',
  },

  archived: {
    label: 'Archivado',
    description:
      'Este restaurante se encuentra archivado actualmente.',
    icon: Store,
    badge:
      'border-slate-200 bg-slate-50 text-slate-600',
    iconClass:
      'bg-slate-100 text-slate-500',
  },
};

/* ========================================================== */
/* PAGE                                                       */
/* ========================================================== */

export default async function OwnerRestaurantPage({
  params,
}: PageProps) {
  const { id } = await params;

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
    redirect('/owner/login');
  }

  /* ======================================================== */
  /* RESTAURANT                                               */
  /* ======================================================== */

  const {
    data: restaurant,
    error,
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
      status,
      is_verified,
      is_featured,
      accepts_reservations,
      average_rating,
      reviews_count,
      favorites_count,
      visits_count,
      published_at,
      created_at,
      rejection_reason,

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
          name
        )
      )
    `)
    .eq('id', id)
    .eq(
      'created_by',
      user.id
    )
    .maybeSingle();

  if (error) {
    console.error(
      'Error cargando restaurante:',
      error
    );
  }

  if (!restaurant) {
    notFound();
  }

  /* ======================================================== */
  /* MANAGEMENT COUNTS                                       */
  /* ======================================================== */

  const [
    hoursResult,
    imagesResult,
    menuResult,
    amenitiesResult,
    reservationsResult,
  ] = await Promise.all([
    supabase
      .from('restaurant_hours')
      .select('id', {
        count: 'exact',
        head: true,
      })
      .eq(
        'restaurant_id',
        restaurant.id
      ),

    supabase
      .from('restaurant_images')
      .select('id', {
        count: 'exact',
        head: true,
      })
      .eq(
        'restaurant_id',
        restaurant.id
      ),

    supabase
      .from('menu_items')
      .select('id', {
        count: 'exact',
        head: true,
      })
      .eq(
        'restaurant_id',
        restaurant.id
      ),

    supabase
      .from(
        'restaurant_amenities'
      )
      .select('restaurant_id', {
        count: 'exact',
        head: true,
      })
      .eq(
        'restaurant_id',
        restaurant.id
      ),

    supabase
      .from('reservations')
      .select('id', {
        count: 'exact',
        head: true,
      })
      .eq(
        'restaurant_id',
        restaurant.id
      ),
  ]);

  if (hoursResult.error) {
    console.error(
      'Error contando horarios:',
      hoursResult.error
    );
  }

  if (imagesResult.error) {
    console.error(
      'Error contando imágenes:',
      imagesResult.error
    );
  }

  if (menuResult.error) {
    console.error(
      'Error contando platos:',
      menuResult.error
    );
  }

  if (amenitiesResult.error) {
    console.error(
      'Error contando servicios:',
      amenitiesResult.error
    );
  }

  if (reservationsResult.error) {
    console.error(
      'Error contando reservaciones:',
      reservationsResult.error
    );
  }

  const hoursCount =
    hoursResult.count ?? 0;

  const imagesCount =
    imagesResult.count ?? 0;

  const menuCount =
    menuResult.count ?? 0;

  const amenitiesCount =
    amenitiesResult.count ?? 0;

  const reservationsCount =
    reservationsResult.count ??
    0;

  const hasHours =
    hoursCount > 0;

  const hasImages =
    imagesCount > 0;

  const hasMenu =
    menuCount > 0;

  const hasAmenities =
    amenitiesCount > 0;

  /* ======================================================== */
  /* NORMALIZE                                                */
  /* ======================================================== */

  const config =
    statusConfig[
      restaurant.status as keyof typeof statusConfig
    ] ??
    statusConfig.draft;

  const StatusIcon =
    config.icon;

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

  /* ======================================================== */
  /* COMPLETION                                               */
  /* ======================================================== */

  const completionChecks = [
    Boolean(
      restaurant.description
    ),

    Boolean(
      restaurant.address
    ),

    Boolean(
      restaurant.phone ||
        restaurant.whatsapp
    ),

    Boolean(
      restaurant.email ||
        restaurant.website_url
    ),

    categories.length > 0,

    hasHours,

    hasImages,

    hasMenu,

    hasAmenities,
  ];

  const completedItems =
    completionChecks.filter(
      Boolean
    ).length;

  const completion =
    Math.round(
      (completedItems /
        completionChecks.length) *
        100
    );

  return (
    <OwnerLayout>
      <div className="min-h-screen bg-canvas">
        <div className="mx-auto max-w-[1450px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
          {/* ================================================== */}
          {/* BACK                                               */}
          {/* ================================================== */}

          <Link
            href="/owner/restaurants"
            className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground transition hover:text-action"
          >
            <ArrowLeft className="h-4 w-4" />

            Mis restaurantes
          </Link>

          {/* ================================================== */}
          {/* HERO                                               */}
          {/* ================================================== */}

          <section className="relative mt-6 overflow-hidden rounded-sheet border border-border/70 bg-white p-6 shadow-none sm:p-8">

            <div className="relative flex flex-col gap-7 xl:flex-row xl:items-start xl:justify-between">
              <div className="max-w-4xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold ${config.badge}`}
                  >
                    <StatusIcon className="h-3.5 w-3.5" />

                    {config.label}
                  </span>

                  {restaurant.is_verified && (
                    <span className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/[0.06] px-3 py-1.5 text-xs font-bold text-action">
                      <CheckCircle2 className="h-3.5 w-3.5" />

                      Verificado
                    </span>
                  )}

                  {restaurant.is_featured && (
                    <span className="inline-flex items-center gap-2 rounded-full border border-warning/25 bg-warning-soft px-3 py-1.5 text-xs font-bold text-warning">
                      <Sparkles className="h-3.5 w-3.5" />

                      Destacado
                    </span>
                  )}
                </div>

                <h1 className="mt-5 text-3xl font-bold tracking-[-0.04em] text-ink sm:text-4xl lg:text-5xl">
                  {restaurant.name}
                </h1>

                {restaurant.short_description && (
                  <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">
                    {
                      restaurant.short_description
                    }
                  </p>
                )}

                <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-xs text-muted-foreground">
                  {(municipality ||
                    department) && (
                    <MetaItem
                      icon={MapPin}
                    >
                      {[
                        municipality?.name,
                        department?.name,
                      ]
                        .filter(Boolean)
                        .join(', ')}
                    </MetaItem>
                  )}

                  <MetaItem
                    icon={
                      CalendarDays
                    }
                  >
                    Registrado{' '}
                    {formatDate(
                      restaurant.created_at
                    )}
                  </MetaItem>

                  <MetaItem
                    icon={
                      StatusIcon
                    }
                  >
                    {
                      config.description
                    }
                  </MetaItem>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {restaurant.status ===
                  'approved' && (
                  <Button
                    asChild
                    variant="outline"
                    className="h-10 rounded-xl border-border bg-white px-4"
                  >
                    <Link
                      href={`/restaurant/${restaurant.id}`}
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />

                      Ver público
                    </Link>
                  </Button>
                )}

                {restaurant.status !==
                  'pending' && (
                  <Button
                    asChild
                    className="h-10 rounded-xl px-4"
                  >
                    <Link
                      href={`/owner/restaurants/${restaurant.id}/edit`}
                    >
                      <Pencil className="mr-2 h-4 w-4" />

                      Editar información
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </section>

          {/* ================================================== */}
          {/* WARNINGS                                           */}
          {/* ================================================== */}

          {restaurant.status ===
            'rejected' && (
              <section className="mt-6 rounded-card border border-danger/25 bg-red-50/80 p-5">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-danger-soft">
                    <XCircle className="h-4 w-4 text-danger" />
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.08em] text-danger">
                      Correcciones solicitadas
                    </p>

                    <h2 className="mt-1 text-sm font-bold text-red-900">
                      Esta solicitud requiere cambios
                    </h2>

                    {restaurant.rejection_reason && (
                      <p className="mt-2 whitespace-pre-line text-sm leading-6 text-danger">
                        {
                          restaurant.rejection_reason
                        }
                      </p>
                    )}

                    <ResubmitRestaurantButton
                      restaurantId={
                        restaurant.id
                      }
                    />
                  </div>
                </div>
              </section>
            )}

          {restaurant.status ===
            'pending' && (
              <section className="mt-6 rounded-card border border-warning/25 bg-amber-50/80 p-5">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-warning-soft">
                    <Clock3 className="h-4 w-4 text-warning" />
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.08em] text-warning">
                      Revisión en curso
                    </p>

                    <h2 className="mt-1 text-sm font-bold text-amber-900">
                      Tu solicitud está siendo revisada
                    </h2>

                    <p className="mt-2 text-xs leading-5 text-warning">
                      Algunos datos permanecerán bloqueados mientras revisamos
                      el establecimiento.
                    </p>
                  </div>
                </div>
              </section>
            )}

          {/* ================================================== */}
          {/* STATS                                              */}
          {/* ================================================== */}

          <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Calificación"
              value={
                restaurant.status ===
                  'approved'
                  ? Number(
                      restaurant.average_rating ??
                        0
                    ).toFixed(1)
                  : '—'
              }
              description="Promedio actual"
              icon={Star}
              tone="rating"
            />

            <StatCard
              label="Reseñas"
              value={
                restaurant.reviews_count ??
                0
              }
              description="Opiniones recibidas"
              icon={
                UtensilsCrossed
              }
              tone="reviews"
            />

            <StatCard
              label="Visitas"
              value={
                restaurant.visits_count ??
                0
              }
              description="Visitas registradas"
              icon={MapPin}
              tone="visits"
            />

            <StatCard
              label="Favoritos"
              value={
                restaurant.favorites_count ??
                0
              }
              description="Usuarios interesados"
              icon={
                CheckCircle2
              }
              tone="favorites"
            />
          </section>

          {/* ================================================== */}
          {/* MANAGEMENT CENTER                                  */}
          {/* ================================================== */}

          <section className="mt-8 overflow-hidden rounded-sheet border border-border/70 bg-white shadow-none">
            <div className="relative overflow-hidden border-b border-border/60 px-6 py-7 sm:px-8">

              <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
                <div className="max-w-2xl">
                  <div className="mb-3 flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                      <Settings2 className="h-4 w-4 text-action" />
                    </div>

                    <p className="text-xs font-bold uppercase tracking-[0.08em] text-action">
                      Centro de gestión
                    </p>
                  </div>

                  <h2 className="text-2xl font-bold tracking-[-0.03em] text-ink">
                    Administra tu restaurante
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Gestiona contenido, operación y experiencia de tus clientes
                    desde un solo lugar.
                  </p>
                </div>

                <div className="w-full max-w-sm rounded-2xl border border-border/70 bg-canvas p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">
                        Perfil del negocio
                      </p>

                      <p className="mt-1 text-sm font-bold text-ink">
                        {completion}% completo
                      </p>
                    </div>

                    <span
                      className={`text-xs font-bold ${
                        completion >=
                        80
                          ? 'text-success'
                          : completion >=
                              50
                            ? 'text-warning'
                            : 'text-danger'
                      }`}
                    >
                      {completion >=
                      80
                        ? 'Muy bien'
                        : completion >=
                            50
                          ? 'En progreso'
                          : 'Necesita atención'}
                    </span>
                  </div>

                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-action"
                      style={{
                        width: `${completion}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-5 sm:p-6 lg:p-8">
              {/* PROFILE */}

              <div>
                <p className="text-xs font-bold text-ink">
                  Perfil y presencia
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  Configura lo que tus clientes podrán conocer de tu
                  restaurante.
                </p>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <ManagementCard
                  href={`/owner/restaurants/${restaurant.id}/hours`}
                  icon={Clock3}
                  title="Horarios"
                  description="Define cuándo está abierto tu restaurante."
                  status={
                    hasHours
                      ? 'configured'
                      : 'attention'
                  }
                  statusText={
                    hasHours
                      ? `${hoursCount} días configurados`
                      : 'Falta configurar'
                  }
                />

                <ManagementCard
                  href={`/owner/restaurants/${restaurant.id}/images`}
                  icon={ImageIcon}
                  title="Fotografías"
                  description="Administra portada, logo y galería."
                  status={
                    hasImages
                      ? 'configured'
                      : 'attention'
                  }
                  statusText={
                    hasImages
                      ? `${imagesCount} ${
                          imagesCount ===
                          1
                            ? 'imagen'
                            : 'imágenes'
                        }`
                      : 'Sin fotografías'
                  }
                />

                <ManagementCard
                  href={`/owner/restaurants/${restaurant.id}/menu`}
                  icon={
                    UtensilsCrossed
                  }
                  title="Menú"
                  description="Platos, categorías, precios y disponibilidad."
                  status={
                    hasMenu
                      ? 'configured'
                      : 'attention'
                  }
                  statusText={
                    hasMenu
                      ? `${menuCount} ${
                          menuCount ===
                          1
                            ? 'plato'
                            : 'platos'
                        }`
                      : 'Sin platos'
                  }
                />

                <ManagementCard
                  href={`/owner/restaurants/${restaurant.id}/amenities`}
                  icon={Wifi}
                  title="Servicios"
                  description="Wi-Fi, parqueo, delivery y otras amenidades."
                  status={
                    hasAmenities
                      ? 'configured'
                      : 'attention'
                  }
                  statusText={
                    hasAmenities
                      ? `${amenitiesCount} servicios`
                      : 'Sin configurar'
                  }
                />
              </div>

              {/* OPERATION */}

              <div className="mt-9 border-t border-border/60 pt-7">
                <p className="text-xs font-bold text-ink">
                  Operación y comunidad
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  Administra la actividad generada por tus clientes.
                </p>

                <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <OperationCard
                    href={`/owner/restaurants/${restaurant.id}/reservations`}
                    icon={
                      CalendarDays
                    }
                    title="Reservaciones"
                    description={
                      restaurant.accepts_reservations
                        ? 'Gestiona solicitudes y próximas reservaciones.'
                        : 'Las reservaciones están desactivadas actualmente.'
                    }
                    status={
                      restaurant.accepts_reservations
                        ? `${reservationsCount} registradas`
                        : 'Desactivadas'
                    }
                  />

                  <OperationCard
                    href={`/owner/restaurants/${restaurant.id}/reviews`}
                    icon={Star}
                    title="Reseñas"
                    description="Consulta opiniones y calificaciones de tus clientes."
                    status={`${
                      restaurant.reviews_count ??
                      0
                    } reseñas`}
                  />

                  <OperationCard
                    href={`/owner/restaurants/${restaurant.id}/analytics`}
                    icon={BarChart3}
                    title="Estadísticas"
                    description="Analiza visitas, favoritos, reseñas y rendimiento."
                    status="Ver rendimiento"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* ================================================== */}
          {/* INFORMATION                                        */}
          {/* ================================================== */}

          <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
            <section className="overflow-hidden rounded-sheet border border-border/70 bg-white shadow-none">
              <div className="border-b border-border/60 px-6 py-6 sm:px-8">
                <p className="text-xs font-bold uppercase tracking-[0.08em] text-action">
                  Perfil público
                </p>

                <h2 className="mt-1 text-xl font-bold text-ink">
                  Información del restaurante
                </h2>

                <p className="mt-2 text-sm text-muted-foreground">
                  Datos principales utilizados en tu ficha pública.
                </p>
              </div>

              <div className="divide-y divide-border/60">
                <InfoSection
                  title="Descripción"
                  description="Presentación del establecimiento."
                >
                  <p className="whitespace-pre-line text-sm leading-7 text-ink">
                    {restaurant.description ||
                      'Todavía no has agregado una descripción completa.'}
                  </p>
                </InfoSection>

                <InfoSection
                  title="Ubicación"
                  description="Dónde pueden encontrarte los usuarios."
                >
                  <InfoGrid>
                    <InfoBlock
                      label="Departamento"
                      value={
                        department?.name ||
                        'No especificado'
                      }
                    />

                    <InfoBlock
                      label="Municipio"
                      value={
                        municipality?.name ||
                        'No especificado'
                      }
                    />

                    <InfoBlock
                      label="Dirección"
                      value={
                        restaurant.address ||
                        'No especificada'
                      }
                      fullWidth
                    />
                  </InfoGrid>
                </InfoSection>

                <InfoSection
                  title="Contacto"
                  description="Canales públicos del negocio."
                >
                  <div className="grid gap-3 sm:grid-cols-2">
                    <ContactCard
                      icon={Phone}
                      label="Teléfono"
                      value={
                        restaurant.phone
                      }
                    />

                    <ContactCard
                      icon={Phone}
                      label="WhatsApp"
                      value={
                        restaurant.whatsapp
                      }
                    />

                    <ContactCard
                      icon={Mail}
                      label="Correo"
                      value={
                        restaurant.email
                      }
                    />

                    <ContactCard
                      icon={Globe2}
                      label="Sitio web"
                      value={
                        restaurant.website_url
                      }
                    />
                  </div>
                </InfoSection>

                <InfoSection
                  title="Servicio"
                  description="Clasificación comercial."
                >
                  <InfoGrid>
                    <InfoBlock
                      label="Nivel de precio"
                      value={
                        '$'.repeat(
                          priceLevel
                        )
                      }
                    />

                    <InfoBlock
                      label="Reservaciones"
                      value={
                        restaurant.accepts_reservations
                          ? 'Acepta reservaciones'
                          : 'No acepta reservaciones'
                      }
                    />
                  </InfoGrid>

                  <div className="mt-6">
                    <p className="mb-3 text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">
                      Categorías
                    </p>

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
                              className="rounded-full border border-primary/15 bg-primary/[0.06] px-3 py-1.5 text-xs font-bold text-action"
                            >
                              {
                                category.name
                              }
                            </span>
                          )
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Sin categorías asignadas.
                      </p>
                    )}
                  </div>
                </InfoSection>
              </div>
            </section>

            {/* SIDE */}

            <aside className="space-y-5">
              <section className="rounded-card border border-border/70 bg-white p-5 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">
                  Estado actual
                </p>

                <div className="mt-4 flex items-start gap-3">
                  <div
                    className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl ${config.iconClass}`}
                  >
                    <StatusIcon className="h-5 w-5" />
                  </div>

                  <div>
                    <p className="text-sm font-bold text-ink">
                      {config.label}
                    </p>

                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      {
                        config.description
                      }
                    </p>
                  </div>
                </div>
              </section>

              <ReservationSettingsCard
                restaurantId={restaurant.id}
                initialValue={restaurant.accepts_reservations}
              />

              <section className="rounded-card border border-border/70 bg-white p-5 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">
                  Configuración
                </p>

                <h3 className="mt-2 text-sm font-bold text-ink">
                  Estado del perfil
                </h3>

                <div className="mt-5 space-y-3">
                  <CompletionItem
                    completed={
                      Boolean(
                        restaurant.description
                      )
                    }
                    label="Descripción"
                  />

                  <CompletionItem
                    completed={
                      Boolean(
                        restaurant.address
                      )
                    }
                    label="Dirección"
                  />

                  <CompletionItem
                    completed={
                      categories.length >
                      0
                    }
                    label="Categorías"
                  />

                  <CompletionItem
                    completed={
                      hasHours
                    }
                    label="Horarios"
                  />

                  <CompletionItem
                    completed={
                      hasImages
                    }
                    label="Fotografías"
                  />

                  <CompletionItem
                    completed={
                      hasMenu
                    }
                    label="Menú"
                  />

                  <CompletionItem
                    completed={
                      hasAmenities
                    }
                    label="Servicios"
                  />
                </div>
              </section>

              <DeleteRestaurantCard
                restaurantId={restaurant.id}
                restaurantName={restaurant.name}
              />
            </aside>
          </div>
        </div>
      </div>
    </OwnerLayout>
  );
}

/* ========================================================== */
/* MANAGEMENT CARD                                            */
/* ========================================================== */

function ManagementCard({
  href,
  icon: Icon,
  title,
  description,
  status,
  statusText,
}: {
  href: string;

  icon: React.ComponentType<{
    className?: string;
  }>;

  title: string;
  description: string;

  status:
    | 'configured'
    | 'attention';

  statusText: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-card border border-border/70 bg-white p-5 transition-all duration-200 hover:-translate-y-1 hover:border-primary/20 hover:shadow-raised"
    >
      <div className="flex items-start justify-between gap-4">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
            status ===
            'configured'
              ? 'bg-action text-white'
              : 'bg-warning-soft text-warning'
          }`}
        >
          <Icon className="h-5 w-5" />
        </div>

        <ChevronRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-action" />
      </div>

      <h3 className="mt-5 text-base font-bold text-ink">
        {title}
      </h3>

      <p className="mt-2 min-h-[40px] text-xs leading-5 text-muted-foreground">
        {description}
      </p>

      <div className="mt-5 border-t border-border/60 pt-4">
        <span
          className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${
            status ===
            'configured'
              ? 'border-success/25 bg-success-soft text-success'
              : 'border-warning/25 bg-warning-soft text-warning'
          }`}
        >
          {statusText}
        </span>
      </div>
    </Link>
  );
}

/* ========================================================== */
/* OPERATION CARD                                             */
/* ========================================================== */

function OperationCard({
  href,
  icon: Icon,
  title,
  description,
  status,
}: {
  href: string;

  icon: React.ComponentType<{
    className?: string;
  }>;

  title: string;
  description: string;
  status: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-card border border-border/70 bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-sm"
    >
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-primary/[0.07] text-action transition group-hover:bg-action group-hover:text-white">
          <Icon className="h-4 w-4" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-bold text-ink">
              {title}
            </h3>

            <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-action" />
          </div>

          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            {description}
          </p>

          <p className="mt-3 text-xs font-bold uppercase tracking-[0.08em] text-action">
            {status}
          </p>
        </div>
      </div>
    </Link>
  );
}

/* ========================================================== */
/* COMPLETION                                                 */
/* ========================================================== */

function CompletionItem({
  completed,
  label,
}: {
  completed: boolean;
  label: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full ${
          completed
            ? 'bg-success-soft text-success'
            : 'bg-warning-soft text-warning'
        }`}
      >
        {completed ? (
          <CheckCircle2 className="h-3.5 w-3.5" />
        ) : (
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
        )}
      </div>

      <p
        className={`text-xs ${
          completed
            ? 'text-ink'
            : 'font-semibold text-warning'
        }`}
      >
        {label}
      </p>
    </div>
  );
}

/* ========================================================== */
/* STAT                                                       */
/* ========================================================== */

function StatCard({
  label,
  value,
  description,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string | number;
  description: string;

  icon: React.ComponentType<{
    className?: string;
  }>;

  tone:
    | 'rating'
    | 'reviews'
    | 'visits'
    | 'favorites';
}) {
  const styles = {
    rating: {
      dot:
        'bg-amber-500',
      icon:
        'bg-warning-soft text-warning',
    },

    reviews: {
      dot:
        'bg-blue-500',
      icon:
        'bg-blue-50 text-blue-600',
    },

    visits: {
      dot:
        'bg-action',
      icon:
        'bg-primary/10 text-action',
    },

    favorites: {
      dot:
        'bg-rose-500',
      icon:
        'bg-danger-soft text-danger',
    },
  };

  const current =
    styles[tone];

  return (
    <div className="rounded-card border border-border/70 bg-white p-5 shadow-none">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span
              className={`h-1.5 w-1.5 rounded-full ${current.dot}`}
            />

            <p className="text-xs font-semibold text-muted-foreground">
              {label}
            </p>
          </div>

          <p className="mt-4 text-2xl font-bold text-ink">
            {value}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            {description}
          </p>
        </div>

        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${current.icon}`}
        >
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}

/* ========================================================== */
/* INFO                                                       */
/* ========================================================== */

function InfoSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="px-6 py-6 sm:px-8 sm:py-7">
      <div className="grid gap-5 lg:grid-cols-[180px_minmax(0,1fr)] lg:gap-8">
        <div>
          <h3 className="text-sm font-bold text-ink">
            {title}
          </h3>

          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            {description}
          </p>
        </div>

        <div>
          {children}
        </div>
      </div>
    </section>
  );
}

function InfoGrid({
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

function InfoBlock({
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

      <p className="mt-1.5 break-words text-sm leading-6 text-ink">
        {value}
      </p>
    </div>
  );
}

function ContactCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{
    className?: string;
  }>;

  label: string;

  value:
    | string
    | null;
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
              'No especificado'}
          </p>
        </div>
      </div>
    </div>
  );
}

function MetaItem({
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
      <Icon className="h-3.5 w-3.5 text-action" />

      {children}
    </span>
  );
}

/* ========================================================== */
/* HELPERS                                                    */
/* ========================================================== */

function formatDate(
  value: string
) {
  return new Intl.DateTimeFormat(
    'es-NI',
    {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }
  ).format(
    new Date(value)
  );
}

function isValidUuid(
  value: string
) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}