'use client';

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import Link from 'next/link';

import {
  useRouter,
} from 'next/navigation';

import {
  Bell,
  CalendarDays,
  Check,
  CheckCheck,
  ChevronDown,
  Clock3,
  LogOut,
  Menu,
  MessageSquareText,
  ShieldCheck,
  Store,
  User,
  X,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';

const supabase =
  createClient();

/* ========================================================== */
/* TYPES                                                      */
/* ========================================================== */

interface OwnerNavbarProps {
  onMenuClick?: () => void;
}

interface OwnerProfile {
  full_name: string | null;
  username: string | null;
}

interface BusinessNotificationData {
  scope?: string;

  url?: string;

  restaurant_id?: string;

  reservation_id?: string;

  review_id?: string;

  status?: string;

  rating?: number;
}

interface BusinessNotification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;

  data:
  BusinessNotificationData | null;

  is_read: boolean;

  read_at:
  | string
  | null;

  created_at: string;
}

/* ========================================================== */
/* COMPONENT                                                  */
/* ========================================================== */

export function OwnerNavbar({
  onMenuClick,
}: OwnerNavbarProps) {
  const router =
    useRouter();

  const [
    profile,
    setProfile,
  ] = useState<
    OwnerProfile | null
  >(null);

  const [
    menuOpen,
    setMenuOpen,
  ] = useState(false);

  const [
    notificationsOpen,
    setNotificationsOpen,
  ] = useState(false);

  const [
    notifications,
    setNotifications,
  ] = useState<
    BusinessNotification[]
  >([]);

  const [
    isLoadingNotifications,
    setIsLoadingNotifications,
  ] = useState(true);

  const [
    markingAll,
    setMarkingAll,
  ] = useState(false);

  const menuRef =
    useRef<HTMLDivElement>(
      null
    );

  const notificationsRef =
    useRef<HTMLDivElement>(
      null
    );

  /* ======================================================== */
  /* PROFILE                                                  */
  /* ======================================================== */

  useEffect(() => {
    async function loadProfile() {
      const {
        data: { user },
      } =
        await supabase.auth.getUser();

      if (!user) {
        return;
      }

      const {
        data,
      } =
        await supabase
          .from('profiles')
          .select(`
            full_name,
            username
          `)
          .eq(
            'id',
            user.id
          )
          .maybeSingle();

      setProfile(
        (data ??
          null) as OwnerProfile | null
      );
    }

    loadProfile();
  }, []);

  /* ======================================================== */
  /* NOTIFICATIONS                                            */
  /* ======================================================== */

  useEffect(() => {
    async function loadNotifications() {
      setIsLoadingNotifications(
        true
      );

      try {
        const {
          data: { user },
        } =
          await supabase.auth.getUser();

        if (!user) {
          setNotifications(
            []
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
              user.id
            )
            .contains(
              'data',
              {
                scope:
                  'business',
              }
            )
            .order(
              'created_at',
              {
                ascending:
                  false,
              }
            )
            .limit(20);

        if (error) {
          console.error(
            'Error cargando notificaciones:',
            error
          );

          return;
        }

        setNotifications(
          (data ??
            []) as BusinessNotification[]
        );
      } finally {
        setIsLoadingNotifications(
          false
        );
      }
    }

    loadNotifications();
  }, []);

  /* ======================================================== */
  /* OUTSIDE CLICK                                            */
  /* ======================================================== */

  useEffect(() => {
    function handleOutsideClick(
      event: MouseEvent
    ) {
      const target =
        event.target as Node;

      if (
        menuRef.current &&
        !menuRef.current.contains(
          target
        )
      ) {
        setMenuOpen(
          false
        );
      }

      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(
          target
        )
      ) {
        setNotificationsOpen(
          false
        );
      }
    }

    document.addEventListener(
      'mousedown',
      handleOutsideClick
    );

    return () => {
      document.removeEventListener(
        'mousedown',
        handleOutsideClick
      );
    };
  }, []);

  /* ======================================================== */
  /* COUNTS                                                   */
  /* ======================================================== */

  const unreadCount =
    useMemo(
      () =>
        notifications.filter(
          (notification) =>
            !notification.is_read
        ).length,
      [notifications]
    );

  /* ======================================================== */
  /* MARK READ                                                */
  /* ======================================================== */

  async function markNotificationRead(
    notification:
      BusinessNotification
  ) {
    if (
      notification.is_read
    ) {
      return;
    }

    const {
      error,
    } =
      await supabase.rpc(
        'mark_notification_read',
        {
          notification_id_input:
            notification.id,
        }
      );

    if (error) {
      console.error(
        'Error marcando notificación:',
        error
      );

      return;
    }

    setNotifications(
      (current) =>
        current.map(
          (item) =>
            item.id ===
              notification.id
              ? {
                ...item,

                is_read:
                  true,

                read_at:
                  new Date().toISOString(),
              }
              : item
        )
    );
  }

  async function markAllRead() {
    if (
      unreadCount === 0
    ) {
      return;
    }

    setMarkingAll(
      true
    );

    try {
      const {
        error,
      } =
        await supabase.rpc(
          'mark_all_business_notifications_read'
        );

      if (error) {
        console.error(
          'Error marcando notificaciones:',
          error
        );

        return;
      }

      const now =
        new Date().toISOString();

      setNotifications(
        (current) =>
          current.map(
            (
              notification
            ) => ({
              ...notification,

              is_read:
                true,

              read_at:
                notification.read_at ??
                now,
            })
          )
      );
    } finally {
      setMarkingAll(
        false
      );
    }
  }

  /* ======================================================== */
  /* OPEN NOTIFICATION                                        */
  /* ======================================================== */

  async function openNotification(
    notification:
      BusinessNotification
  ) {
    await markNotificationRead(
      notification
    );

    setNotificationsOpen(
      false
    );

    const url =
      notification.data?.url;

    if (url) {
      router.push(
        url
      );
    }
  }

  /* ======================================================== */
  /* LOGOUT                                                   */
  /* ======================================================== */

  async function handleLogout() {
    setMenuOpen(false);
    setNotificationsOpen(
      false
    );

    await supabase.auth.signOut();

    router.replace(
      '/owner/login'
    );

    router.refresh();
  }

  /* ======================================================== */
  /* PROFILE DATA                                             */
  /* ======================================================== */

  const displayName =
    profile?.full_name?.trim() ||
    profile?.username ||
    'Propietario';

  const initials =
    displayName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(
        (word) =>
          word[0]
      )
      .join('')
      .toUpperCase();

  /* ======================================================== */
  /* UI                                                       */
  /* ======================================================== */

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur-md">
      <div className="flex h-[var(--header-h)] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* ==================================================== */}
        {/* LEFT                                                 */}
        {/* ==================================================== */}

        <div className="flex min-w-0 items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="flex-shrink-0 rounded-full lg:hidden"
            onClick={
              onMenuClick
            }
            aria-label="Abrir menú del portal"
          >
            <Menu className="size-5" aria-hidden="true" />
          </Button>

          <p className="flex min-w-0 items-center gap-2 font-display text-[17px] font-semibold text-ink">
            <Store className="size-[18px] flex-shrink-0 text-ink-muted" aria-hidden="true" />
            <span className="truncate">Gestión de restaurantes</span>
          </p>
        </div>

        {/* ==================================================== */}
        {/* RIGHT                                                */}
        {/* ==================================================== */}

        <div className="flex items-center gap-2 sm:gap-3">
          {/* ================================================== */}
          {/* NOTIFICATIONS                                      */}
          {/* ================================================== */}

          <div
            ref={
              notificationsRef
            }
            className="relative"
          >
            <button
              type="button"
              onClick={() => {
                setNotificationsOpen(
                  (current) =>
                    !current
                );

                setMenuOpen(
                  false
                );
              }}
              className={`relative flex size-11 items-center justify-center rounded-full transition-colors duration-150 ${notificationsOpen
                  ? 'bg-action-soft text-action'
                  : 'text-ink hover:bg-surface-2'
                }`}
              aria-label="Notificaciones del negocio"
              aria-expanded={
                notificationsOpen
              }
            >
              <Bell className="size-5" aria-hidden="true" />

              {unreadCount >
                0 && (
                  <span className="absolute right-1 top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-white bg-danger px-1 text-xs font-semibold tabular-nums leading-none text-white">
                    {unreadCount >
                      9
                      ? '9+'
                      : unreadCount}
                  </span>
                )}
            </button>

            {notificationsOpen && (
              <div className="absolute right-0 top-[calc(100%+12px)] w-[min(390px,calc(100vw-24px))] overflow-hidden rounded-card border border-border/70 bg-white shadow-overlay">
                {/* HEADER */}

                <div className="flex items-start justify-between gap-4 border-b border-border/60 px-5 py-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.08em] text-action">
                      Actividad
                    </p>

                    <h2 className="mt-1 text-base font-bold text-ink">
                      Notificaciones
                    </h2>

                    <p className="mt-1 text-xs text-muted-foreground">
                      {unreadCount ===
                        0
                        ? 'Estás al día'
                        : `${unreadCount} ${unreadCount ===
                          1
                          ? 'notificación nueva'
                          : 'notificaciones nuevas'
                        }`}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setNotificationsOpen(
                        false
                      )
                    }
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* MARK ALL */}

                {unreadCount >
                  0 && (
                    <div className="border-b border-border/60 px-5 py-3">
                      <button
                        type="button"
                        disabled={
                          markingAll
                        }
                        onClick={
                          markAllRead
                        }
                        className="inline-flex items-center gap-2 text-xs font-bold text-action transition hover:opacity-70 disabled:opacity-50"
                      >
                        {markingAll ? (
                          <Clock3 className="h-3.5 w-3.5 animate-pulse" />
                        ) : (
                          <CheckCheck className="h-3.5 w-3.5" />
                        )}

                        Marcar todo como leído
                      </button>
                    </div>
                  )}

                {/* LIST */}

                <div className="max-h-[430px] overflow-y-auto">
                  {isLoadingNotifications ? (
                    <div className="flex min-h-[220px] items-center justify-center">
                      <div className="text-center">
                        <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-primary/15 border-t-primary" />

                        <p className="mt-3 text-xs text-muted-foreground">
                          Cargando actividad...
                        </p>
                      </div>
                    </div>
                  ) : notifications.length ===
                    0 ? (
                    <div className="flex min-h-[240px] items-center justify-center p-6 text-center">
                      <div>
                        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-primary/[0.07] text-action">
                          <Bell className="h-4 w-4" />
                        </div>

                        <p className="mt-4 text-sm font-bold text-ink">
                          Sin actividad reciente
                        </p>

                        <p className="mt-2 max-w-[250px] text-xs leading-5 text-muted-foreground">
                          Aquí aparecerán nuevas reservaciones, reseñas y
                          cambios importantes de tus restaurantes.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="divide-y divide-border/60">
                      {notifications.map(
                        (
                          notification
                        ) => (
                          <NotificationItem
                            key={
                              notification.id
                            }
                            notification={
                              notification
                            }
                            onClick={() =>
                              openNotification(
                                notification
                              )
                            }
                            onMarkRead={() =>
                              markNotificationRead(
                                notification
                              )
                            }
                          />
                        )
                      )}
                    </div>
                  )}
                </div>

                {/* FOOTER */}

                <div className="border-t border-border/60 bg-canvas px-5 py-3">
                  <p className="text-center text-xs text-muted-foreground">
                    Actividad empresarial de GastroNic Business
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="hidden h-8 w-px bg-border/70 sm:block" />

          {/* ================================================== */}
          {/* ACCOUNT MENU                                       */}
          {/* ================================================== */}

          <div
            ref={
              menuRef
            }
            className="relative"
          >
            <button
              type="button"
              onClick={() => {
                setMenuOpen(
                  (current) =>
                    !current
                );

                setNotificationsOpen(
                  false
                );
              }}
              className={`flex items-center gap-3 rounded-2xl border px-2 py-1.5 transition ${menuOpen
                  ? 'border-primary/20 bg-primary/[0.04]'
                  : 'border-transparent hover:border-border hover:bg-canvas'
                }`}
              aria-expanded={
                menuOpen
              }
            >
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-ink text-xs font-bold text-white">
                {initials || (
                  <User className="h-4 w-4" />
                )}
              </div>

              <div className="hidden max-w-[170px] text-left md:block">
                <p className="truncate text-sm font-bold text-ink">
                  {displayName}
                </p>

                <p className="mt-0.5 truncate text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
                  Propietario
                </p>
              </div>

              <ChevronDown
                className={`hidden h-4 w-4 text-muted-foreground transition-transform md:block ${menuOpen
                    ? 'rotate-180'
                    : ''
                  }`}
              />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-[calc(100%+10px)] w-64 overflow-hidden rounded-2xl border border-border/70 bg-white shadow-overlay">
                <div className="border-b border-border/60 px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-xs font-bold text-action">
                      {initials}
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-ink">
                        {displayName}
                      </p>

                      {profile?.username && (
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          @{profile.username}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-2">
                  <Link
                    href="/owner/settings"
                    onClick={() =>
                      setMenuOpen(
                        false
                      )
                    }
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-canvas hover:text-ink"
                  >
                    <User className="h-4 w-4" />

                    Configuración de cuenta
                  </Link>

                  <button
                    type="button"
                    onClick={
                      handleLogout
                    }
                    className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-danger transition hover:bg-danger-soft"
                  >
                    <LogOut className="h-4 w-4" />

                    Cerrar sesión
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

/* ========================================================== */
/* NOTIFICATION ITEM                                          */
/* ========================================================== */

function NotificationItem({
  notification,
  onClick,
  onMarkRead,
}: {
  notification:
  BusinessNotification;

  onClick:
  () => void;

  onMarkRead:
  () => void;
}) {
  const config =
    getNotificationConfig(
      notification
    );

  const Icon =
    config.icon;

  return (
    <div
      className={`group relative transition ${notification.is_read
          ? 'bg-white'
          : 'bg-primary/[0.025]'
        }`}
    >
      {!notification.is_read && (
        <span className="absolute left-0 top-0 h-full w-[3px] bg-action" />
      )}

      <div
        role="button"
        tabIndex={0}
        onClick={onClick}
        onKeyDown={(event) => {
          if (
            event.key === 'Enter' ||
            event.key === ' '
          ) {
            event.preventDefault();
            onClick();
          }
        }}
        className="flex w-full cursor-pointer gap-3 px-5 py-4 text-left transition hover:bg-canvas"
      >
        <div
          className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${config.className}`}
        >
          <Icon className="h-4 w-4" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <p
              className={`text-xs leading-5 text-ink ${notification.is_read
                  ? 'font-semibold'
                  : 'font-bold'
                }`}
            >
              {notification.title}
            </p>

            {!notification.is_read && (
              <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-action" />
            )}
          </div>

          <p className="mt-1 line-clamp-2 text-xs leading-[18px] text-muted-foreground">
            {notification.message}
          </p>

          <div className="mt-2 flex items-center justify-between gap-3">
            <span className="text-xs font-medium text-muted-foreground/70">
              {formatRelativeTime(
                notification.created_at
              )}
            </span>

            {!notification.is_read && (
              <button
                type="button"
                onClick={(
                  event
                ) => {
                  event.stopPropagation();

                  onMarkRead();
                }}
                className="inline-flex items-center gap-1 text-xs font-bold text-action opacity-0 transition group-hover:opacity-100"
              >
                <Check className="h-3 w-3" />

                Leída
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ========================================================== */
/* CONFIG                                                     */
/* ========================================================== */

function getNotificationConfig(
  notification:
    BusinessNotification
) {
  switch (
  notification.type
  ) {
    case 'business_reservation':
      return {
        icon:
          CalendarDays,

        className:
          'bg-blue-50 text-blue-600',
      };

    case 'business_review':
      return {
        icon:
          MessageSquareText,

        className:
          'bg-warning-soft text-warning',
      };

    case 'business_restaurant_status':
      if (
        notification.data?.status ===
        'approved'
      ) {
        return {
          icon:
            ShieldCheck,

          className:
            'bg-success-soft text-success',
        };
      }

      return {
        icon:
          Store,

        className:
          'bg-danger-soft text-danger',
      };

    default:
      return {
        icon:
          Bell,

        className:
          'bg-primary/[0.07] text-action',
      };
  }
}

/* ========================================================== */
/* DATE                                                       */
/* ========================================================== */

function formatRelativeTime(
  value: string
) {
  const date =
    new Date(value);

  const now =
    new Date();

  const diffMs =
    Math.max(
      0,
      now.getTime() -
      date.getTime()
    );

  const minutes =
    Math.floor(
      diffMs /
      60000
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
    return `Hace ${hours} ${hours ===
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
    7
  ) {
    return `Hace ${days} ${days ===
        1
        ? 'día'
        : 'días'
      }`;
  }

  return new Intl.DateTimeFormat(
    'es-NI',
    {
      day:
        'numeric',

      month:
        'short',
    }
  ).format(
    date
  );
}