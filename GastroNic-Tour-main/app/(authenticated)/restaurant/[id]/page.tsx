import {
  notFound,
} from 'next/navigation';
import {
  CalendarCheck,
  Clock3,
  CreditCard,
  ExternalLink,
  MapPin,
  PawPrint,
  Phone,
  Wifi,
  Car,
} from 'lucide-react';

import { MainLayout } from '@/components/layout/main-layout';

import {
  RestaurantHeader,
  type RestaurantHeaderData,
} from '@/components/restaurant/restaurant-header';

import {
  RestaurantInfo,
  type RestaurantInfoData,
} from '@/components/restaurant/restaurant-info';

import { PhotoGallery } from '@/components/restaurant/photo-gallery';
import { MenuItems } from '@/components/restaurant/menu-items';
import { ReviewsSection } from '@/components/restaurant/reviews-section';
import { FavoriteButton } from '@/components/favorites/favorite-button';
import { ReservationForm } from '@/components/reservations/reservation-form';
import { RestaurantViewTracker } from '@/components/analytics/restaurant-view-tracker';

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

interface RestaurantHour {
  id: string;
  day_of_week: number;
  opens_at: string | null;
  closes_at: string | null;
  is_closed: boolean;
}

interface Department {
  id: string;
  name: string;
}

interface Municipality {
  id: string;
  name: string;

  department:
  | Department
  | Department[]
  | null;
}

interface Amenity {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
}

interface RestaurantAmenity {
  amenity:
  | Amenity
  | Amenity[]
  | null;
}

interface RestaurantImage {
  id: string;
  kind: string;
  storage_path: string | null;
  external_url: string | null;
  alt_text: string | null;
  sort_order: number;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
}

interface RestaurantCategory {
  category:
  | Category
  | Category[]
  | null;
}

interface Restaurant
  extends RestaurantHeaderData,
  RestaurantInfoData {
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  website_url: string | null;

  accepts_reservations:
  boolean;

  municipality:
  | Municipality
  | Municipality[]
  | null;

  hours:
  RestaurantHour[];

  amenities:
  RestaurantAmenity[];

  images:
  RestaurantImage[];

  categories:
  RestaurantCategory[];
}

/* ========================================================== */
/* DAYS                                                       */
/* ========================================================== */

const dayNames = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
];

/* ========================================================== */
/* HELPERS                                                    */
/* ========================================================== */

function formatTime(
  time:
    | string
    | null
) {
  if (!time) {
    return '';
  }

  const [
    hourString,
    minute = '00',
  ] =
    time.split(':');

  const hour =
    Number(
      hourString
    );

  if (
    Number.isNaN(
      hour
    )
  ) {
    return time;
  }

  const period =
    hour >= 12
      ? 'PM'
      : 'AM';

  const formattedHour =
    hour %
    12 ||
    12;

  return `${formattedHour}:${minute} ${period}`;
}

function getNicaraguaDay() {
  const shortDay =
    new Intl.DateTimeFormat(
      'en-US',
      {
        weekday:
          'short',

        timeZone:
          'America/Managua',
      }
    ).format(
      new Date()
    );

  const dayMap:
    Record<
      string,
      number
    > = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };

  return (
    dayMap[
    shortDay
    ] ??
    0
  );
}

function getAmenityIcon(
  slug: string
) {
  switch (slug) {
    case 'wifi':
    case 'wifi-gratis':
      return Wifi;

    case 'estacionamiento':
    case 'parqueo':
      return Car;

    case 'mascotas':
    case 'mascotas-permitidas':
      return PawPrint;

    case 'pago-con-tarjeta':
    case 'tarjetas':
      return CreditCard;

    default:
      return null;
  }
}

/* ========================================================== */
/* PAGE                                                       */
/* ========================================================== */

export default async function RestaurantDetailPage({
  params,
}: PageProps) {
  const { id } =
    await params;

  const supabase =
    await createClient();

  const {
    data,
    error,
  } = await supabase
    .from('restaurants')
    .select(`
      id,
      name,
      slug,
      short_description,
      description,
      address,
      phone,
      whatsapp,
      email,
      website_url,
      price_level,
      estimated_price_min,
      estimated_price_max,
      status,
      is_verified,
      accepts_reservations,
      average_rating,
      reviews_count,
      favorites_count,
      visits_count,

      municipality:municipalities (
        id,
        name,

        department:departments (
          id,
          name
        )
      ),

      images:restaurant_images (
        id,
        kind,
        storage_path,
        external_url,
        alt_text,
        sort_order
      ),

      categories:restaurant_categories (
        category:categories (
          id,
          name,
          slug,
          icon
        )
      ),

      hours:restaurant_hours (
        id,
        day_of_week,
        opens_at,
        closes_at,
        is_closed
      ),

      amenities:restaurant_amenities (
        amenity:amenities (
          id,
          name,
          slug,
          icon
        )
      )
    `)
    .eq(
      'id',
      id
    )
    .eq(
      'status',
      'approved'
    )
    .single();

  if (error) {
    console.error(
      'Error cargando el restaurante:',
      error
    );
  }

  if (!data) {
    notFound();
  }

  const restaurant =
    data as unknown as Restaurant;

  /* ======================================================== */
  /* NORMALIZE                                                */
  /* ======================================================== */

  const municipality =
    Array.isArray(
      restaurant.municipality
    )
      ? restaurant.municipality[0]
      : restaurant.municipality;

  const departmentData =
    municipality?.department;

  const department =
    Array.isArray(
      departmentData
    )
      ? departmentData[0]
      : departmentData;

  const today =
    getNicaraguaDay();

  const todayHours =
    restaurant.hours?.find(
      (hour) =>
        hour.day_of_week ===
        today
    );

  const amenities =
    restaurant.amenities
      ?.map((item) =>
        Array.isArray(
          item.amenity
        )
          ? item.amenity[0]
          : item.amenity
      )
      .filter(
        (
          amenity
        ): amenity is Amenity =>
          Boolean(amenity)
      ) ?? [];

  const todayStatus =
    !todayHours
      ? 'Horario no disponible'
      : todayHours.is_closed
        ? 'Cerrado hoy'
        : `${formatTime(
          todayHours.opens_at
        )} – ${formatTime(
          todayHours.closes_at
        )}`;

  const locationText = [
    restaurant.address,
    municipality?.name,
    department?.name,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <MainLayout>
      <RestaurantViewTracker
        restaurantId={
          restaurant.id
        }
      />
      {/* ====================================================== */}
      {/* HERO                                                   */}
      {/* ====================================================== */}

      <RestaurantHeader
        restaurant={
          restaurant
        }
        todayStatus={
          todayStatus
        }
      />

      {/* ====================================================== */}
      {/* NAV                                                    */}
      {/* ====================================================== */}

      <div className="sticky top-[var(--header-h)] z-20 border-b border-line bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1400px] items-center gap-6 overflow-x-auto px-4 py-3 [scrollbar-width:none] sm:px-6 lg:px-8 [&::-webkit-scrollbar]:hidden">
          <AnchorLink href="#about">
            Información
          </AnchorLink>

          {restaurant.accepts_reservations && (
            <AnchorLink href="#reservation">
              Reservar
            </AnchorLink>
          )}

          <AnchorLink href="#menu">
            Menú
          </AnchorLink>

          <AnchorLink href="#photos">
            Fotos
          </AnchorLink>

          <AnchorLink href="#reviews">
            Reseñas
          </AnchorLink>
        </div>
      </div>

      {/* ====================================================== */}
      {/* BODY                                                   */}
      {/* ====================================================== */}

      <div className="bg-canvas pb-20 xl:pb-0">
        <div className="mx-auto w-full max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
          <div className="grid w-full items-start gap-8 xl:grid-cols-[minmax(0,1fr)_365px]">
            {/* ================================================= */}
            {/* CONTENT                                           */}
            {/* ================================================= */}

            <div className="w-full min-w-0 space-y-12">
              <section
                id="about"
                className="scroll-mt-32"
              >
                <RestaurantInfo
                  restaurant={
                    restaurant
                  }
                />
              </section>

              {/* ================================================= */}
              {/* MOBILE RESERVATION                                */}
              {/* ================================================= */}

              {restaurant.accepts_reservations && (
                <section
                  id="reservation"
                  className="scroll-mt-32 xl:hidden"
                >
                  <div className="w-full">
                    <SectionHeading
                      eyebrow="Reservaciones"
                      title="Reserva tu mesa"
                      description="Solicita una mesa directamente desde GastroNic y el restaurante podrá gestionar tu reservación."
                    />

                    <div className="mt-5 w-full">
                      <ReservationForm
                        restaurantId={
                          restaurant.id
                        }
                        restaurantName={
                          restaurant.name
                        }
                      />
                    </div>
                  </div>
                </section>
              )}

              <section
                id="menu"
                className="scroll-mt-32"
              >
                <SectionHeading
                  eyebrow="La cocina"
                  title="Menú"
                  description="Explora los platillos disponibles y descubre las especialidades de la casa."
                />

                <div className="mt-6">
                  <MenuItems
                    restaurantId={
                      restaurant.id
                    }
                  />
                </div>
              </section>

              <section
                id="photos"
                className="scroll-mt-32"
              >
                <SectionHeading
                  eyebrow="El lugar"
                  title="Fotos"
                  description="Conoce el ambiente, los espacios y la identidad del restaurante."
                />

                <div className="mt-6">
                  <PhotoGallery
                    images={
                      restaurant.images
                    }
                    restaurantName={
                      restaurant.name
                    }
                  />
                </div>
              </section>

              <section
                id="reviews"
                className="scroll-mt-32"
              >
                <ReviewsSection
                  restaurantId={
                    restaurant.id
                  }
                />
              </section>
            </div>

            {/* ================================================= */}
            {/* SIDEBAR                                           */}
            {/* ================================================= */}

            <aside className="w-full min-w-0 border-t border-border/60 pt-8 xl:sticky xl:top-[calc(var(--header-h)+4.5rem)] xl:border-t-0 xl:pt-0">
              <div
                className="
                  space-y-4

                  xl:max-h-[calc(100vh-156px)]
                  xl:overflow-y-auto
                  xl:overscroll-contain
                  xl:pr-1

                  [scrollbar-width:none]
                  [-ms-overflow-style:none]
                  [&::-webkit-scrollbar]:hidden
                "
              >  {/* ============================================= */}
                {/* FAVORITE                                      */}
                {/* ============================================= */}

                <div className="hidden xl:block">
                  <FavoriteButton
                    restaurantId={
                      restaurant.id
                    }
                    showLabel
                    labelUnsaved="Guardar restaurante"
                    labelSaved="Guardado"
                    className="
                      h-12
                      w-full
                      rounded-card
                      border
                      border-border/70
                      bg-white
                      px-4
                      text-sm
                      font-bold
                      text-ink
                      shadow-none
                      hover:border-danger/25
                      hover:bg-red-50/40
                    "
                    iconClassName="h-4 w-4"
                  />
                </div>
                {/* ============================================= */}
                {/* HOURS                                         */}
                {/* ============================================= */}

                <section className="overflow-hidden rounded-card border border-border/70 bg-white shadow-none">
                  <div className="border-b border-border/60 p-5">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary/[0.08] text-action">
                        <Clock3 className="h-4 w-4" />
                      </div>

                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.08em] text-action">
                          Horario
                        </p>

                        <h2 className="mt-1 text-base font-bold text-ink">
                          Horario de hoy
                        </h2>
                      </div>
                    </div>
                  </div>

                  <div className="p-5">
                    {todayHours ? (
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-sm font-bold text-ink">
                            {
                              dayNames[
                              todayHours.day_of_week
                              ]
                            }
                          </p>

                          <p className="mt-1 text-xs text-muted-foreground">
                            Atención del establecimiento
                          </p>
                        </div>

                        <div className="text-right">
                          {todayHours.is_closed ? (
                            <span className="inline-flex rounded-full bg-danger-soft px-3 py-1.5 text-xs font-bold text-danger">
                              Cerrado
                            </span>
                          ) : (
                            <>
                              <p className="text-sm font-bold text-action">
                                {formatTime(
                                  todayHours.opens_at
                                )}
                              </p>

                              <p className="mt-0.5 text-xs text-muted-foreground">
                                hasta{' '}
                                {formatTime(
                                  todayHours.closes_at
                                )}
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm leading-6 text-muted-foreground">
                        Este restaurante todavía no ha publicado su horario de hoy.
                      </p>
                    )}
                  </div>

                  {restaurant.hours.length >
                    0 && (
                      <div className="border-t border-border/60 px-5 py-4">
                        <details className="group">
                          <summary className="flex cursor-pointer list-none items-center justify-between text-xs font-bold text-muted-foreground transition hover:text-action">
                            Ver horario semanal

                            <span className="text-lg font-normal transition-transform group-open:rotate-45">
                              +
                            </span>
                          </summary>

                          <div className="mt-4 space-y-2.5">
                            {[...restaurant.hours]
                              .sort(
                                (
                                  a,
                                  b
                                ) => {
                                  const order =
                                    [
                                      1,
                                      2,
                                      3,
                                      4,
                                      5,
                                      6,
                                      0,
                                    ];

                                  return (
                                    order.indexOf(
                                      a.day_of_week
                                    ) -
                                    order.indexOf(
                                      b.day_of_week
                                    )
                                  );
                                }
                              )
                              .map(
                                (hour) => (
                                  <div
                                    key={
                                      hour.id
                                    }
                                    className="flex items-center justify-between gap-3 text-xs"
                                  >
                                    <span
                                      className={`font-semibold ${hour.day_of_week ===
                                        today
                                        ? 'text-action'
                                        : 'text-ink'
                                        }`}
                                    >
                                      {
                                        dayNames[
                                        hour.day_of_week
                                        ]
                                      }
                                    </span>

                                    <span
                                      className={
                                        hour.is_closed
                                          ? 'text-red-500'
                                          : 'text-muted-foreground'
                                      }
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
                                )
                              )}
                          </div>
                        </details>
                      </div>
                    )}
                </section>

                {/* ============================================= */}
                {/* LOCATION                                      */}
                {/* ============================================= */}

                <section className="overflow-hidden rounded-card border border-border/70 bg-white shadow-none">
                  <SidebarHeader
                    icon={
                      MapPin
                    }
                    eyebrow="Ubicación"
                    title="Dónde encontrarlo"
                  />

                  <div className="p-5">
                    <p className="text-sm font-semibold leading-6 text-ink">
                      {restaurant.address ??
                        'Dirección no disponible'}
                    </p>

                    {(municipality ||
                      department) && (
                        <p className="mt-2 text-xs leading-5 text-muted-foreground">
                          {[
                            municipality?.name,
                            department?.name,
                            'Nicaragua',
                          ]
                            .filter(Boolean)
                            .join(', ')}
                        </p>
                      )}

                    {locationText && (
                      <Button
                        asChild
                        variant="outline"
                        className="mt-4 h-10 w-full rounded-xl"
                      >
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                            locationText
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="mr-2 h-4 w-4" />

                          Abrir en Maps
                        </a>
                      </Button>
                    )}
                  </div>
                </section>

                {/* ============================================= */}
                {/* CONTACT                                       */}
                {/* ============================================= */}

                <section className="overflow-hidden rounded-card border border-border/70 bg-white shadow-none">
                  <SidebarHeader
                    icon={Phone}
                    eyebrow="Contacto"
                    title="Habla con el restaurante"
                  />

                  <div className="divide-y divide-border/60">
                    <ContactRow
                      label="Teléfono"
                      value={
                        restaurant.phone
                      }
                      href={
                        restaurant.phone
                          ? `tel:${restaurant.phone}`
                          : undefined
                      }
                    />

                    <ContactRow
                      label="WhatsApp"
                      value={
                        restaurant.whatsapp
                      }
                      href={
                        restaurant.whatsapp
                          ? `https://wa.me/${restaurant.whatsapp.replace(
                            /\D/g,
                            ''
                          )}`
                          : undefined
                      }
                      external
                    />

                    <ContactRow
                      label="Correo"
                      value={
                        restaurant.email
                      }
                      href={
                        restaurant.email
                          ? `mailto:${restaurant.email}`
                          : undefined
                      }
                    />

                    <ContactRow
                      label="Sitio web"
                      value={
                        restaurant.website_url
                      }
                      href={
                        restaurant.website_url ??
                        undefined
                      }
                      external
                    />
                  </div>
                </section>

                {/* ============================================= */}
                {/* SERVICES                                      */}
                {/* ============================================= */}

                <section className="rounded-card border border-border/70 bg-white p-5 shadow-none">
                  <p className="text-xs font-bold uppercase tracking-[0.08em] text-action">
                    Servicios
                  </p>

                  <h3 className="mt-1 text-sm font-bold text-ink">
                    Lo que encontrarás
                  </h3>

                  {amenities.length >
                    0 ? (
                    <div className="mt-4 grid gap-2">
                      {amenities.map(
                        (
                          amenity
                        ) => {
                          const Icon =
                            getAmenityIcon(
                              amenity.slug
                            );

                          return (
                            <div
                              key={
                                amenity.id
                              }
                              className="flex items-center gap-3 rounded-xl bg-canvas px-3 py-2.5"
                            >
                              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-white text-action shadow-sm">
                                {Icon ? (
                                  <Icon className="h-3.5 w-3.5" />
                                ) : (
                                  <span className="h-1.5 w-1.5 rounded-full bg-action" />
                                )}
                              </div>

                              <span className="text-xs font-semibold text-ink">
                                {
                                  amenity.name
                                }
                              </span>
                            </div>
                          );
                        }
                      )}
                    </div>
                  ) : (
                    <p className="mt-4 text-xs leading-5 text-muted-foreground">
                      Este restaurante todavía no ha detallado sus servicios.
                    </p>
                  )}
                </section>

                {/* ============================================= */}
                {/* RESERVATION                                   */}
                {/* ============================================= */}

                {restaurant.accepts_reservations && (
                  <section
                    id="reservation-desktop"
                    className="relative hidden overflow-hidden rounded-card border-2 border-brand-maiz bg-white p-5 xl:block"
                  >

                    <div className="relative">
                      <div className="flex items-center gap-3">
                        <span className="flex size-10 items-center justify-center rounded-control bg-maiz-soft text-maiz-ink">
                          <CalendarCheck className="size-5" aria-hidden="true" />
                        </span>

                        <div>
                          <p className="text-overline text-ink-muted">
                            Reservaciones
                          </p>

                          <h3 className="text-lg font-semibold text-ink">
                            Reserva tu mesa
                          </h3>
                        </div>
                      </div>

                      <p className="mt-3 text-sm leading-relaxed text-ink-muted">
                        Este restaurante acepta solicitudes de reservación desde GastroNic.
                      </p>

                      <ReservationForm
                        restaurantId={
                          restaurant.id
                        }
                        restaurantName={
                          restaurant.name
                        }
                      />
                    </div>
                  </section>
                )}

                {/* Bottom breathing room */}

                <div className="h-1" />
              </div>
            </aside>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MOBILE ACTION BAR                                        */}
      {/* ======================================================== */}

      <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-30 border-t border-line bg-white/95 px-4 pb-3 pt-3 md:bottom-0 md:pb-[calc(env(safe-area-inset-bottom)+12px)] shadow-raised backdrop-blur-xl xl:hidden">
        <div className="mx-auto flex max-w-lg gap-3">
          <FavoriteButton
            restaurantId={
              restaurant.id
            }
            className="h-12 w-12 flex-shrink-0 rounded-2xl border border-border/80 bg-white text-ink"
            iconClassName="h-5 w-5"
          />

          {restaurant.accepts_reservations ? (
            <a
              href="#reservation"
              className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-action px-5 text-sm font-bold text-white shadow-overlay transition active:scale-[0.98]"
            >
              <CalendarCheck className="h-4 w-4" />

              Reservar mesa
            </a>
          ) : restaurant.phone ? (
            <a
              href={`tel:${restaurant.phone}`}
              className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-action px-5 text-sm font-bold text-white"
            >
              <Phone className="h-4 w-4" />

              Llamar
            </a>
          ) : (
            <a
              href="#about"
              className="flex h-12 flex-1 items-center justify-center rounded-2xl bg-action px-5 text-sm font-bold text-white"
            >
              Ver información
            </a>
          )}
        </div>
      </div>
    </MainLayout>
  );
}

/* ========================================================== */
/* SECTION HEADING                                            */
/* ========================================================== */

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.08em] text-action">
        {eyebrow}
      </p>

      <h2 className="mt-2 text-2xl font-bold tracking-[-0.035em] text-ink sm:text-3xl">
        {title}
      </h2>

      <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

/* ========================================================== */
/* ANCHOR                                                     */
/* ========================================================== */

function AnchorLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      className="flex-shrink-0 text-xs font-bold text-muted-foreground transition hover:text-action"
    >
      {children}
    </a>
  );
}

/* ========================================================== */
/* SIDEBAR HEADER                                             */
/* ========================================================== */

function SidebarHeader({
  icon: Icon,
  eyebrow,
  title,
}: {
  icon: React.ComponentType<{
    className?: string;
  }>;

  eyebrow: string;
  title: string;
}) {
  return (
    <div className="border-b border-border/60 p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary/[0.08] text-action">
          <Icon className="h-4 w-4" />
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-[0.08em] text-action">
            {eyebrow}
          </p>

          <h3 className="mt-1 text-sm font-bold text-ink">
            {title}
          </h3>
        </div>
      </div>
    </div>
  );
}

/* ========================================================== */
/* CONTACT                                                    */
/* ========================================================== */

function ContactRow({
  label,
  value,
  href,
  external = false,
}: {
  label: string;
  value: string | null;
  href?: string;
  external?: boolean;
}) {
  return (
    <div className="px-5 py-4">
      <p className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </p>

      {value ? (
        href ? (
          <a
            href={href}
            target={
              external
                ? '_blank'
                : undefined
            }
            rel={
              external
                ? 'noopener noreferrer'
                : undefined
            }
            className="mt-1 block break-all text-xs font-semibold leading-5 text-ink transition hover:text-action"
          >
            {value}
          </a>
        ) : (
          <p className="mt-1 break-all text-xs font-semibold leading-5 text-ink">
            {value}
          </p>
        )
      ) : (
        <p className="mt-1 text-xs text-muted-foreground">
          No disponible
        </p>
      )}
    </div>
  );
}