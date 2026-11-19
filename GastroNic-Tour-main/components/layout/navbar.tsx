'use client';

import {
  useEffect,
  useMemo,
  useState,
} from 'react';


import Image from 'next/image';
import Link from 'next/link';

import {
  usePathname,
  useRouter,
} from 'next/navigation';

import {
  Bell,
  CheckCheck,
  ChevronDown,
  Compass,
  Heart,
  Home,
  LoaderCircle,
  LogOut,
  MapPin,
  Menu,
  CalendarCheck,
  Sparkles,
  User,
  X,
  Route,
} from 'lucide-react';

import { Button } from '@/components/ui/button';

import { GlobalSearch } from '@/components/search/global-search';

import { createClient } from '@/lib/supabase/client';

const supabase =
  createClient();

/* ========================================================== */
/* TYPES                                                      */
/* ========================================================== */

interface NotificationData {
  url?: string;
  restaurant_id?: string;
  scope?: string;

  [key: string]:
  unknown;
}

interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;

  data:
  | NotificationData
  | null;

  is_read: boolean;

  read_at:
  | string
  | null;

  created_at: string;
}

/* ========================================================== */
/* HELPERS                                                    */
/* ========================================================== */

function formatNotificationDate(
  date: string
) {
  const createdAt =
    new Date(
      date
    );

  const now =
    new Date();

  const diffMs =
    now.getTime() -
    createdAt.getTime();

  const diffMinutes =
    Math.floor(
      diffMs /
      60000
    );

  if (
    diffMinutes <
    1
  ) {
    return 'Ahora';
  }

  if (
    diffMinutes <
    60
  ) {
    return `Hace ${diffMinutes} min`;
  }

  const diffHours =
    Math.floor(
      diffMinutes /
      60
    );

  if (
    diffHours <
    24
  ) {
    return `Hace ${diffHours} h`;
  }

  const diffDays =
    Math.floor(
      diffHours /
      24
    );

  if (
    diffDays <
    7
  ) {
    return `Hace ${diffDays} d`;
  }

  return new Intl.DateTimeFormat(
    'es-NI',
    {
      dateStyle:
        'medium',
    }
  ).format(
    createdAt
  );
}

/* ========================================================== */
/* NAVBAR                                                     */
/* ========================================================== */

export function Navbar() {
  const router =
    useRouter();

  const pathname =
    usePathname();

  const [
    isMobileMenuOpen,
    setIsMobileMenuOpen,
  ] =
    useState(
      false
    );

  const [
    isUserMenuOpen,
    setIsUserMenuOpen,
  ] =
    useState(
      false
    );

  const [
    isNotificationsOpen,
    setIsNotificationsOpen,
  ] =
    useState(
      false
    );

  const [
    notifications,
    setNotifications,
  ] =
    useState<
      Notification[]
    >([]);

  const [
    isLoadingNotifications,
    setIsLoadingNotifications,
  ] =
    useState(
      true
    );

  const [
    currentUserId,
    setCurrentUserId,
  ] =
    useState<
      string | null
    >(null);

  /* ======================================================== */
  /* LOAD NOTIFICATIONS                                       */
  /* ======================================================== */

  useEffect(() => {
    let mounted =
      true;

    async function loadNotifications() {
      setIsLoadingNotifications(
        true
      );

      const {
        data: {
          user,
        },

        error:
        userError,
      } =
        await supabase.auth.getUser();

      if (
        !mounted
      ) {
        return;
      }

      if (
        userError &&
        userError.name !==
        'AuthSessionMissingError'
      ) {
        console.error(
          'Error obteniendo usuario:',
          userError
        );
      }

      const userId =
        user?.id ??
        null;

      setCurrentUserId(
        userId
      );

      if (
        !userId
      ) {
        setNotifications(
          []
        );

        setIsLoadingNotifications(
          false
        );

        return;
      }

      const {
        data,
        error,
      } =
        await supabase
          .from(
            'notifications'
          )
          .select(`
            id,
            user_id,
            type,
            title,
            message,
            data,
            is_read,
            read_at,
            created_at
          `)
          .eq(
            'user_id',
            userId
          )
          .order(
            'created_at',
            {
              ascending:
                false,
            }
          )
          .limit(
            15
          );

      if (
        !mounted
      ) {
        return;
      }

      if (
        error
      ) {
        console.error(
          'Error cargando notificaciones:',
          error
        );

        setNotifications(
          []
        );
      } else {
        /*
         * Las notificaciones propias del portal Owner
         * no deben aparecer en la experiencia normal.
         */

        const normalNotifications =
          (
            (data ??
              []) as Notification[]
          ).filter(
            (
              notification
            ) =>
              notification
                .data
                ?.scope !==
              'owner'
          );

        setNotifications(
          normalNotifications
        );
      }

      setIsLoadingNotifications(
        false
      );
    }

    loadNotifications();

    return () => {
      mounted =
        false;
    };
  }, []);

  /* ======================================================== */
  /* CLOSE MENUS ON ROUTE CHANGE                              */
  /* ======================================================== */

  useEffect(() => {
    setIsMobileMenuOpen(
      false
    );

    setIsUserMenuOpen(
      false
    );

    setIsNotificationsOpen(
      false
    );
  }, [
    pathname,
  ]);

  /* ======================================================== */
  /* UNREAD                                                   */
  /* ======================================================== */

  const unreadCount =
    useMemo(
      () =>
        notifications.filter(
          (
            notification
          ) =>
            !notification.is_read
        ).length,

      [
        notifications,
      ]
    );

  /* ======================================================== */
  /* NOTIFICATION ACTIONS                                     */
  /* ======================================================== */

  async function markNotificationAsRead(
    notification:
      Notification
  ) {
    if (
      notification.is_read
    ) {
      return true;
    }

    const readAt =
      new Date().toISOString();

    const {
      error,
    } =
      await supabase
        .from(
          'notifications'
        )
        .update({
          is_read:
            true,

          read_at:
            readAt,
        })
        .eq(
          'id',
          notification.id
        );

    if (
      error
    ) {
      console.error(
        'Error marcando notificación como leída:',
        error
      );

      return false;
    }

    setNotifications(
      (
        current
      ) =>
        current.map(
          (
            item
          ) =>
            item.id ===
              notification.id
              ? {
                ...item,

                is_read:
                  true,

                read_at:
                  readAt,
              }
              : item
        )
    );

    return true;
  }

  async function handleNotificationClick(
    notification:
      Notification
  ) {
    await markNotificationAsRead(
      notification
    );

    setIsNotificationsOpen(
      false
    );

    setIsMobileMenuOpen(
      false
    );

    const url =
      typeof notification
        .data?.url ===
        'string'
        ? notification
          .data.url
        : null;

    if (
      url
    ) {
      router.push(
        url
      );
    }
  }

  async function handleMarkAllAsRead() {
    if (
      !currentUserId
    ) {
      return;
    }

    const unreadIds =
      notifications
        .filter(
          (
            notification
          ) =>
            !notification.is_read
        )
        .map(
          (
            notification
          ) =>
            notification.id
        );

    if (
      unreadIds.length ===
      0
    ) {
      return;
    }

    const readAt =
      new Date().toISOString();

    const {
      error,
    } =
      await supabase
        .from(
          'notifications'
        )
        .update({
          is_read:
            true,

          read_at:
            readAt,
        })
        .in(
          'id',
          unreadIds
        );

    if (
      error
    ) {
      console.error(
        'Error marcando todas como leídas:',
        error
      );

      return;
    }

    setNotifications(
      (
        current
      ) =>
        current.map(
          (
            item
          ) => ({
            ...item,

            is_read:
              true,

            read_at:
              item.read_at ??
              readAt,
          })
        )
    );
  }

  /* ======================================================== */
  /* LOGOUT                                                   */
  /* ======================================================== */

  async function handleLogout() {
    const {
      error,
    } =
      await supabase.auth.signOut();

    if (
      error
    ) {
      console.error(
        'Error cerrando sesión:',
        error
      );

      return;
    }

    /*
     * Ahora / es la landing pública.
     */

    router.replace(
      '/'
    );

    router.refresh();
  }

  /* ======================================================== */
  /* UI                                                       */
  /* ======================================================== */

  /*
   * Estado de sesión para la interfaz (sin consultas nuevas):
   * - "checking": todavía no se sabe si hay usuario.
   * - "in": hay usuario (se conoce su id).
   * - "out": se comprobó y no hay sesión.
   */
  const sessionState: 'checking' | 'in' | 'out' =
    currentUserId
      ? 'in'
      : isLoadingNotifications
        ? 'checking'
        : 'out';

  const closeMenus = () => {
    setIsMobileMenuOpen(false);
    setIsNotificationsOpen(false);
    setIsUserMenuOpen(false);
  };

  const primaryLinks: NavItem[] = [
    { href: '/home', label: 'Inicio', icon: Home, active: pathname === '/home' },
    {
      href: '/explore',
      label: 'Explorar',
      icon: Compass,
      active: pathname.startsWith('/explore') || pathname.startsWith('/restaurant/'),
    },
    { href: '/recommendations', label: 'Para ti', icon: Sparkles, active: pathname.startsWith('/recommendations') },
    {
      href: '/routes/my-routes',
      label: 'Mis rutas',
      icon: Route,
      active:
        pathname.startsWith('/routes/my-routes') ||
        pathname.startsWith('/routes/personalized'),
    },
    { href: '/reservations', label: 'Reservas', icon: CalendarCheck, active: pathname.startsWith('/reservations') },
    /* Mapa: sección del inicio; solo en el menú móvil para no comprimir la búsqueda */
    { href: '/home#mapa', label: 'Mapa', icon: MapPin, active: false, mobileOnly: true },
  ];

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur-md supports-[backdrop-filter]:bg-white/85">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-[var(--header-h)] items-center gap-3 lg:gap-4">
            {/* ============================================ */}
            {/* MARCA                                        */}
            {/* ============================================ */}

            <Link
              href="/home"
              className="flex flex-shrink-0 items-center gap-2.5 rounded-control"
              aria-label="GastroNic Tour, ir al inicio"
            >
              <span className="flex size-10 items-center justify-center overflow-hidden rounded-control border border-line bg-white">
                <Image
                  src="/logo.jpeg"
                  alt=""
                  width={40}
                  height={40}
                  priority
                  className="h-full w-full object-contain p-0.5"
                />
              </span>

              <span className="hidden font-display text-[17px] font-semibold leading-none text-ink sm:block">
                GastroNic
                <span className="text-ink-muted"> Tour</span>
              </span>
            </Link>

            {/* ============================================ */}
            {/* BÚSQUEDA (tableta y escritorio)              */}
            {/* ============================================ */}

            <div className="hidden min-w-[200px] flex-1 md:block">
              <div className="max-w-[440px] xl:max-w-[340px]">
                <GlobalSearch />
              </div>
            </div>

            {/* ============================================ */}
            {/* NAVEGACIÓN PRINCIPAL (escritorio)            */}
            {/* ============================================ */}

            <nav aria-label="Navegación principal" className="hidden lg:block">
              <ul className="flex items-center gap-0.5">
                {primaryLinks.filter((item) => !item.mobileOnly).map((item) => (
                  <li key={item.href}>
                    <NavLink item={item} />
                  </li>
                ))}
              </ul>
            </nav>

            {/* ============================================ */}
            {/* ACCIONES                                     */}
            {/* ============================================ */}

            <div className="ml-auto flex flex-shrink-0 items-center gap-1 md:ml-0">
              {sessionState === 'in' && (
                <>
                  <IconLink
                    href="/favorites"
                    label="Favoritos"
                    active={pathname.startsWith('/favorites')}
                    className="hidden md:flex"
                  >
                    <Heart className="size-5" aria-hidden="true" />
                  </IconLink>

                  <div className="relative">
                    <IconButton
                      ariaLabel={
                        unreadCount > 0
                          ? `Notificaciones, ${unreadCount} sin leer`
                          : 'Notificaciones'
                      }
                      active={isNotificationsOpen}
                      expanded={isNotificationsOpen}
                      onClick={() => {
                        setIsNotificationsOpen((current) => !current);
                        setIsUserMenuOpen(false);
                        setIsMobileMenuOpen(false);
                      }}
                    >
                      <Bell className="size-5" aria-hidden="true" />
                      {unreadCount > 0 && <NotificationBadge count={unreadCount} />}
                    </IconButton>

                    {isNotificationsOpen && (
                      <div className="hidden md:block">
                        <NotificationsPanel
                          notifications={notifications}
                          unreadCount={unreadCount}
                          isLoading={isLoadingNotifications}
                          onNotificationClick={handleNotificationClick}
                          onMarkAll={handleMarkAllAsRead}
                        />
                      </div>
                    )}
                  </div>

                  <div className="relative hidden md:block">
                    <button
                      type="button"
                      onClick={() => {
                        setIsUserMenuOpen((current) => !current);
                        setIsNotificationsOpen(false);
                      }}
                      aria-label="Menú de tu cuenta"
                      aria-expanded={isUserMenuOpen}
                      aria-haspopup="menu"
                      className={`ml-1 flex h-11 items-center gap-1.5 rounded-full border pl-1 pr-2.5 transition-colors duration-150 ${
                        isUserMenuOpen
                          ? 'border-action/30 bg-action-soft'
                          : 'border-line bg-white hover:border-line-strong'
                      }`}
                    >
                      <span className="flex size-9 items-center justify-center rounded-full bg-ink text-white">
                        <User className="size-4" aria-hidden="true" />
                      </span>
                      <ChevronDown
                        className={`size-4 text-ink-muted transition-transform duration-150 ${
                          isUserMenuOpen ? 'rotate-180' : ''
                        }`}
                        aria-hidden="true"
                      />
                    </button>

                    {isUserMenuOpen && (
                      <UserMenu
                        onLogout={handleLogout}
                        onClose={() => setIsUserMenuOpen(false)}
                      />
                    )}
                  </div>
                </>
              )}

              {sessionState === 'out' && (
                <div className="hidden items-center gap-1.5 md:flex">
                  <Button asChild variant="ghost" size="sm">
                    <Link href="/auth/login">Iniciar sesión</Link>
                  </Button>
                  <Button asChild size="sm">
                    <Link href="/auth/register">Crear cuenta</Link>
                  </Button>
                </div>
              )}

              {sessionState === 'checking' && (
                <span
                  aria-hidden="true"
                  className="hidden h-11 w-28 animate-pulse rounded-full bg-surface-2 md:block"
                />
              )}

              {/* Menú móvil y tableta */}
              <IconButton
                ariaLabel={isMobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
                active={isMobileMenuOpen}
                expanded={isMobileMenuOpen}
                onClick={() => {
                  setIsMobileMenuOpen((current) => !current);
                  setIsNotificationsOpen(false);
                  setIsUserMenuOpen(false);
                }}
                className="lg:hidden"
              >
                {isMobileMenuOpen ? (
                  <X className="size-5" aria-hidden="true" />
                ) : (
                  <Menu className="size-5" aria-hidden="true" />
                )}
              </IconButton>
            </div>
          </div>
        </div>

        {/* ==================================================== */}
        {/* NOTIFICACIONES EN CELULAR                            */}
        {/* ==================================================== */}

        {isNotificationsOpen && (
          <div className="relative z-10 border-t border-line bg-white md:hidden">
            <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
              <NotificationsMobile
                notifications={notifications}
                unreadCount={unreadCount}
                isLoading={isLoadingNotifications}
                onNotificationClick={handleNotificationClick}
                onMarkAll={handleMarkAllAsRead}
              />
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* MENÚ MÓVIL Y TABLETA                                 */}
        {/* ==================================================== */}

        {isMobileMenuOpen && (
          <div className="relative z-10 max-h-[calc(100dvh-var(--header-h))] overflow-y-auto border-t border-line bg-white lg:hidden">
            <div className="mx-auto max-w-7xl px-4 pb-6 pt-4 sm:px-6">
              <div className="md:hidden">
                <GlobalSearch mobile onNavigate={() => setIsMobileMenuOpen(false)} />
              </div>

              <nav aria-label="Navegación principal" className="mt-4 md:mt-0">
                <ul className="grid gap-1 sm:grid-cols-2">
                  {primaryLinks.map((item) => (
                    <li key={item.href}>
                      <MobileNavLink item={item} onClick={() => setIsMobileMenuOpen(false)} />
                    </li>
                  ))}
                  {sessionState === 'in' && (
                    <>
                      <li>
                        <MobileNavLink
                          item={{ href: '/favorites', label: 'Favoritos', icon: Heart, active: pathname.startsWith('/favorites') }}
                          onClick={() => setIsMobileMenuOpen(false)}
                        />
                      </li>
                      <li>
                        <MobileNavLink
                          item={{ href: '/profile', label: 'Mi perfil', icon: User, active: pathname.startsWith('/profile') }}
                          onClick={() => setIsMobileMenuOpen(false)}
                        />
                      </li>
                    </>
                  )}
                </ul>
              </nav>

              <div className="mt-4 border-t border-line pt-4">
                {sessionState === 'in' ? (
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex h-12 w-full items-center gap-3 rounded-control px-3 text-[15px] font-semibold text-danger transition-colors hover:bg-danger-soft"
                  >
                    <LogOut className="size-5" aria-hidden="true" />
                    Cerrar sesión
                  </button>
                ) : sessionState === 'out' ? (
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Button asChild variant="outline">
                      <Link href="/auth/login" onClick={() => setIsMobileMenuOpen(false)}>
                        Iniciar sesión
                      </Link>
                    </Button>
                    <Button asChild>
                      <Link href="/auth/register" onClick={() => setIsMobileMenuOpen(false)}>
                        Crear cuenta
                      </Link>
                    </Button>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* ==================================================== */}
      {/* BARRA INFERIOR (celular)                             */}
      {/* ==================================================== */}

      <MobileBottomNavigation pathname={pathname} />

      {/* Capa para cerrar menús en celular y tableta */}
      {(isMobileMenuOpen || isNotificationsOpen) && (
        <button
          type="button"
          aria-label="Cerrar menú"
          tabIndex={-1}
          className="fixed inset-0 z-20 cursor-default bg-ink/20 lg:hidden"
          onClick={closeMenus}
        />
      )}
    </>
  );
}

/* ========================================================== */
/* TIPOS                                                      */
/* ========================================================== */

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' }>;
  active: boolean;
  mobileOnly?: boolean;
}

/* ========================================================== */
/* ENLACE DE NAVEGACIÓN (escritorio)                          */
/* ========================================================== */

function NavLink({ item }: { item: NavItem }) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      aria-current={item.active ? 'page' : undefined}
      title={item.label}
      className={`relative flex h-10 items-center gap-2 rounded-control px-2.5 text-sm font-medium transition-colors duration-150 xl:px-3 ${
        item.active
          ? 'text-ink after:absolute after:inset-x-2.5 after:-bottom-3 after:h-0.5 after:rounded-full after:bg-action'
          : 'text-ink-muted hover:bg-surface-2 hover:text-ink'
      }`}
    >
      <Icon className={`size-[18px] ${item.active ? 'text-action' : ''}`} aria-hidden="true" />
      <span className="sr-only xl:not-sr-only">{item.label}</span>
    </Link>
  );
}

/* ========================================================== */
/* BOTONES DE ÍCONO                                           */
/* ========================================================== */

function IconButton({
  ariaLabel,
  active = false,
  expanded,
  onClick,
  children,
  className = '',
}: {
  ariaLabel: string;
  active?: boolean;
  expanded?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      aria-expanded={expanded}
      onClick={onClick}
      className={`relative flex size-11 items-center justify-center rounded-full transition-colors duration-150 ${
        active ? 'bg-action-soft text-action' : 'text-ink hover:bg-surface-2'
      } ${className}`}
    >
      {children}
    </button>
  );
}

function IconLink({
  href,
  label,
  active = false,
  children,
  className = '',
}: {
  href: string;
  label: string;
  active?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      title={label}
      aria-current={active ? 'page' : undefined}
      className={`relative size-11 items-center justify-center rounded-full transition-colors duration-150 ${
        active ? 'bg-action-soft text-action' : 'text-ink hover:bg-surface-2'
      } ${className}`}
    >
      {children}
    </Link>
  );
}

/* ========================================================== */
/* CONTADOR DE NOTIFICACIONES                                 */
/* ========================================================== */

function NotificationBadge({ count }: { count: number }) {
  return (
    <span
      aria-hidden="true"
      className="absolute right-1 top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-white bg-danger px-1 text-[11px] font-semibold leading-none text-white tabular-nums"
    >
      {count > 9 ? '9+' : count}
    </span>
  );
}

/* ========================================================== */
/* NOTIFICACIONES (escritorio)                                */
/* ========================================================== */

function NotificationsPanel({
  notifications,
  unreadCount,
  isLoading,
  onNotificationClick,
  onMarkAll,
}: {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  onNotificationClick: (notification: Notification) => void;
  onMarkAll: () => void;
}) {
  return (
    <div className="absolute right-0 top-[calc(100%+10px)] z-10 w-[380px] overflow-hidden rounded-card border border-line bg-white shadow-overlay">
      <NotificationsHeader unreadCount={unreadCount} onMarkAll={onMarkAll} />
      <NotificationList
        notifications={notifications}
        isLoading={isLoading}
        onNotificationClick={onNotificationClick}
      />
    </div>
  );
}

function NotificationsHeader({
  unreadCount,
  onMarkAll,
}: {
  unreadCount: number;
  onMarkAll: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
      <div>
        <h2 className="text-[15px] font-semibold text-ink">Notificaciones</h2>
        <p className="text-[13px] text-ink-muted">
          {unreadCount > 0
            ? `${unreadCount} sin leer`
            : 'Estás al día'}
        </p>
      </div>

      {unreadCount > 0 && (
        <button
          type="button"
          onClick={onMarkAll}
          className="flex h-9 items-center gap-1.5 rounded-control px-2.5 text-[13px] font-semibold text-action transition-colors hover:bg-action-soft"
        >
          <CheckCheck className="size-4" aria-hidden="true" />
          Marcar todas como leídas
        </button>
      )}
    </div>
  );
}

/* ========================================================== */
/* LISTA DE NOTIFICACIONES                                    */
/* ========================================================== */

function NotificationList({
  notifications,
  isLoading,
  onNotificationClick,
}: {
  notifications: Notification[];
  isLoading: boolean;
  onNotificationClick: (notification: Notification) => void;
}) {
  if (isLoading) {
    return (
      <div
        role="status"
        className="flex h-40 items-center justify-center gap-2 text-sm text-ink-muted"
      >
        <LoaderCircle className="size-4 animate-spin text-action" aria-hidden="true" />
        Cargando notificaciones…
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="flex min-h-[200px] flex-col items-center justify-center px-6 text-center">
        <div className="flex size-11 items-center justify-center rounded-control bg-surface-2 text-ink-muted">
          <Bell className="size-5" aria-hidden="true" />
        </div>
        <p className="mt-3 text-[15px] font-semibold text-ink">No tienes notificaciones</p>
        <p className="mt-1 max-w-[240px] text-[13px] leading-relaxed text-ink-muted">
          Te avisaremos aquí cuando haya novedades de tus reservas, reseñas o rutas.
        </p>
      </div>
    );
  }

  return (
    <ul className="max-h-[420px] overflow-y-auto">
      {notifications.map((notification) => (
        <li key={notification.id} className="border-b border-line last:border-b-0">
          <button
            type="button"
            onClick={() => onNotificationClick(notification)}
            className={`flex w-full gap-3 px-4 py-3.5 text-left transition-colors hover:bg-surface-2 ${
              notification.is_read ? 'bg-white' : 'bg-action-soft/60'
            }`}
          >
            <span
              aria-hidden="true"
              className={`mt-1.5 size-2 flex-shrink-0 rounded-full ${
                notification.is_read ? 'bg-transparent' : 'bg-action'
              }`}
            />

            <span className="min-w-0 flex-1">
              <span className="flex items-start justify-between gap-3">
                <span
                  className={`line-clamp-1 text-sm text-ink ${
                    notification.is_read ? 'font-medium' : 'font-semibold'
                  }`}
                >
                  {!notification.is_read && <span className="sr-only">Sin leer: </span>}
                  {notification.title}
                </span>
                <span className="flex-shrink-0 text-xs text-ink-muted">
                  {formatNotificationDate(notification.created_at)}
                </span>
              </span>

              <span className="mt-0.5 line-clamp-2 block text-[13px] leading-relaxed text-ink-muted">
                {notification.message}
              </span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

/* ========================================================== */
/* NOTIFICACIONES (celular)                                   */
/* ========================================================== */

function NotificationsMobile({
  notifications,
  unreadCount,
  isLoading,
  onNotificationClick,
  onMarkAll,
}: {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  onNotificationClick: (notification: Notification) => void;
  onMarkAll: () => void;
}) {
  return (
    <div className="overflow-hidden rounded-card border border-line bg-white">
      <NotificationsHeader unreadCount={unreadCount} onMarkAll={onMarkAll} />
      <NotificationList
        notifications={notifications.slice(0, 6)}
        isLoading={isLoading}
        onNotificationClick={onNotificationClick}
      />
    </div>
  );
}

/* ========================================================== */
/* MENÚ DE CUENTA                                             */
/* ========================================================== */

function UserMenu({
  onLogout,
  onClose,
}: {
  onLogout: () => void;
  onClose: () => void;
}) {
  const items = [
    { href: '/profile', label: 'Mi perfil', icon: User },
    { href: '/favorites', label: 'Favoritos', icon: Heart },
    { href: '/reservations', label: 'Mis reservas', icon: CalendarCheck },
    { href: '/routes/my-routes', label: 'Mis rutas', icon: Route },
  ];

  return (
    <div
      role="menu"
      aria-label="Tu cuenta"
      className="absolute right-0 top-[calc(100%+10px)] z-10 w-60 overflow-hidden rounded-card border border-line bg-white p-1.5 shadow-overlay"
    >
      {items.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          role="menuitem"
          onClick={onClose}
          className="flex h-11 items-center gap-3 rounded-control px-3 text-sm font-medium text-ink transition-colors hover:bg-surface-2"
        >
          <Icon className="size-[18px] text-ink-muted" aria-hidden="true" />
          {label}
        </Link>
      ))}

      <div className="my-1.5 border-t border-line" role="separator" />

      <button
        type="button"
        role="menuitem"
        onClick={onLogout}
        className="flex h-11 w-full items-center gap-3 rounded-control px-3 text-sm font-medium text-danger transition-colors hover:bg-danger-soft"
      >
        <LogOut className="size-[18px]" aria-hidden="true" />
        Cerrar sesión
      </button>
    </div>
  );
}

/* ========================================================== */
/* ENLACE DEL MENÚ MÓVIL                                      */
/* ========================================================== */

function MobileNavLink({
  item,
  onClick,
}: {
  item: NavItem;
  onClick: () => void;
}) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onClick}
      aria-current={item.active ? 'page' : undefined}
      className={`flex h-12 items-center gap-3 rounded-control px-3 text-[15px] font-medium transition-colors ${
        item.active ? 'bg-action-soft text-action' : 'text-ink hover:bg-surface-2'
      }`}
    >
      <Icon className="size-5" aria-hidden="true" />
      {item.label}
    </Link>
  );
}

/* ========================================================== */
/* BARRA INFERIOR (celular)                                   */
/* ========================================================== */

function MobileBottomNavigation({ pathname }: { pathname: string }) {
  const items = [
    { href: '/home', label: 'Inicio', icon: Home, active: pathname === '/home' },
    {
      href: '/explore',
      label: 'Explorar',
      icon: Compass,
      active: pathname.startsWith('/explore') || pathname.startsWith('/restaurant/'),
    },
    { href: '/favorites', label: 'Favoritos', icon: Heart, active: pathname.startsWith('/favorites') },
    { href: '/reservations', label: 'Reservas', icon: CalendarCheck, active: pathname.startsWith('/reservations') },
    { href: '/profile', label: 'Perfil', icon: User, active: pathname.startsWith('/profile') },
  ];

  return (
    <nav
      aria-label="Accesos rápidos"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 backdrop-blur-md md:hidden"
    >
      <ul className="mx-auto grid h-16 max-w-md grid-cols-5 px-1 pb-[env(safe-area-inset-bottom)] box-content">
        {items.map(({ href, label, icon: Icon, active }) => (
          <li key={href} className="flex">
            <Link
              href={href}
              aria-current={active ? 'page' : undefined}
              className={`flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-control transition-colors ${
                active ? 'text-action' : 'text-ink-muted active:bg-surface-2'
              }`}
            >
              <span
                className={`flex h-7 w-12 items-center justify-center rounded-full transition-colors ${
                  active ? 'bg-action-soft' : ''
                }`}
              >
                <Icon className={`size-5 ${active ? 'stroke-[2.25]' : ''}`} aria-hidden="true" />
              </span>
              <span className={`max-w-full truncate text-xs leading-none ${active ? 'font-semibold' : 'font-medium'}`}>
                {label}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
