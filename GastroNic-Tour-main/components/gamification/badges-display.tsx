'use client';

import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  Award,
  Check,
  LoaderCircle,
  Lock,
  Sparkles,
  Trophy,
} from 'lucide-react';

import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

interface BadgeData {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string | null;
  points_required: number;

  criteria:
    | Record<string, unknown>
    | null;

  is_active: boolean;
}

interface UserBadge {
  badge_id: string;
  earned_at: string;
}

interface BadgeView
  extends BadgeData {
  unlocked: boolean;

  unlockedDate:
    | string
    | null;
}

function formatDate(
  date: string
) {
  return new Intl.DateTimeFormat(
    'es-NI',
    {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }
  ).format(
    new Date(date)
  );
}

export function BadgesDisplay() {
  const [badges, setBadges] =
    useState<BadgeData[]>([]);

  const [
    userBadges,
    setUserBadges,
  ] = useState<UserBadge[]>([]);

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState('');

  useEffect(() => {
    async function loadBadges() {
      setIsLoading(true);
      setErrorMessage('');

      const {
        data: { user },
        error: userError,
      } =
        await supabase.auth.getUser();

      if (
        userError ||
        !user
      ) {
        if (userError) {
          console.error(
            'Error obteniendo usuario:',
            userError
          );
        }

        setErrorMessage(
          'No se pudo obtener tu sesión.'
        );

        setIsLoading(false);
        return;
      }

      const [
        badgesResult,
        userBadgesResult,
      ] = await Promise.all([
        supabase
          .from('badges')
          .select(`
            id,
            slug,
            name,
            description,
            icon,
            points_required,
            criteria,
            is_active
          `)
          .eq(
            'is_active',
            true
          )
          .order(
            'points_required',
            {
              ascending: true,
            }
          ),

        supabase
          .from(
            'user_badges'
          )
          .select(`
            badge_id,
            earned_at
          `)
          .eq(
            'user_id',
            user.id
          ),
      ]);

      if (
        badgesResult.error
      ) {
        console.error(
          'Error cargando insignias:',
          badgesResult.error
        );

        setErrorMessage(
          'No se pudieron cargar los logros.'
        );

        setBadges([]);
      } else {
        setBadges(
          (badgesResult.data ??
            []) as BadgeData[]
        );
      }

      if (
        userBadgesResult.error
      ) {
        console.error(
          'Error cargando insignias del usuario:',
          userBadgesResult.error
        );

        setUserBadges([]);
      } else {
        setUserBadges(
          (userBadgesResult.data ??
            []) as UserBadge[]
        );
      }

      setIsLoading(false);
    }

    loadBadges();
  }, []);

  const badgeViews =
    useMemo<BadgeView[]>(
      () => {
        const unlockedMap =
          new Map(
            userBadges.map(
              (item) => [
                item.badge_id,
                item.earned_at,
              ]
            )
          );

        return badges.map(
          (badge) => ({
            ...badge,

            unlocked:
              unlockedMap.has(
                badge.id
              ),

            unlockedDate:
              unlockedMap.get(
                badge.id
              ) ?? null,
          })
        );
      },
      [
        badges,
        userBadges,
      ]
    );

  const unlockedCount =
    badgeViews.filter(
      (badge) =>
        badge.unlocked
    ).length;

  const totalCount =
    badgeViews.length;

  const progress =
    totalCount > 0
      ? (unlockedCount /
          totalCount) *
        100
      : 0;

  if (isLoading) {
    return (
      <div className="flex min-h-[260px] sm:min-h-[360px] items-center justify-center rounded-card sm:rounded-sheet border border-border/70 bg-white shadow-none">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <LoaderCircle className="h-7 w-7 animate-spin text-action" />

          <p className="text-sm">
            Cargando logros...
          </p>
        </div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="rounded-card sm:rounded-sheet border border-danger/25 bg-red-50/60 p-8 text-center">
        <p className="text-sm text-danger">
          {errorMessage}
        </p>
      </div>
    );
  }

  return (
    <section className="overflow-hidden rounded-card sm:rounded-sheet border border-border/70 bg-white shadow-none">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-border/60 px-4 py-5 sm:px-7 sm:py-6">

        <div className="relative flex items-start justify-between gap-3 sm:gap-5">
          <div>
            <div className="mb-2 inline-flex sm:mb-3 items-center gap-2 text-xs font-bold uppercase tracking-[0.08em] text-action">
              <Sparkles className="h-3.5 w-3.5" />

              Colección personal
            </div>

            <h2 className="text-xl font-bold sm:text-2xl tracking-[-0.025em] text-ink">
              Logros y distintivos
            </h2>

            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Desbloquea insignias mientras descubres nuevos lugares.
            </p>
          </div>

          <div className="flex h-10 w-10 sm:h-11 sm:w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-secondary/15">
            <Award className="h-5 w-5 text-[#A37712]" />
          </div>
        </div>

        {/* Progress summary */}
        <div className="mt-5 rounded-xl bg-canvas p-3.5 sm:mt-6 sm:rounded-2xl sm:p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">
                Progreso
              </p>

              <p className="mt-1 text-sm font-bold text-ink">
                {unlockedCount}{' '}
                de {totalCount}{' '}
                desbloqueados
              </p>
            </div>

            <p className="text-lg font-bold text-action">
              {totalCount > 0
                ? Math.round(
                    progress
                  )
                : 0}
              %
            </p>
          </div>

          <div className="mt-3 h-2 overflow-hidden rounded-full bg-primary/10">
            <div
              className="h-full rounded-full bg-action transition-all duration-500"
              style={{
                width: `${progress}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Badges */}
      <div className="p-4 sm:p-7">
        {badgeViews.length ===
        0 ? (
          <div className="flex min-h-[180px] sm:min-h-[220px] items-center justify-center text-center">
            <div>
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                <Trophy className="h-5 w-5 text-action" />
              </div>

              <h3 className="mt-4 text-sm font-bold text-ink">
                Aún no hay distintivos
              </h3>

              <p className="mt-2 text-xs text-muted-foreground">
                Próximamente podrás
                desbloquear nuevos
                logros.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            {badgeViews.map(
              (badge) => (
                <BadgeCard
                  key={
                    badge.id
                  }
                  badge={
                    badge
                  }
                />
              )
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-border/60 bg-canvas px-4 py-3.5 sm:px-7 sm:py-4">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-secondary/15">
            <Trophy className="h-4 w-4 text-[#A37712]" />
          </div>

          <div>
            <p className="text-xs font-bold text-ink">
              Sigue explorando
            </p>

            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Visita restaurantes,
              comparte reseñas y
              completa rutas para
              desbloquear más.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function BadgeCard({
  badge,
}: {
  badge: BadgeView;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border p-3 transition sm:p-4 ${
        badge.unlocked
          ? 'border-primary/20 bg-primary/[0.035]'
          : 'border-border/70 bg-[#F8F9F9]'
      }`}
    >
      {badge.unlocked && (
        <div className="absolute right-2.5 top-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-action text-white">
          <Check className="h-3 w-3" />
        </div>
      )}

      <div
        className={`flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-2xl ${
          badge.unlocked
            ? 'bg-primary/10'
            : 'bg-muted'
        }`}
      >
        {badge.unlocked ? (
          badge.icon ? (
            <span className="text-2xl">
              {badge.icon}
            </span>
          ) : (
            <Trophy className="h-5 w-5 text-action" />
          )
        ) : (
          <Lock className="h-4 w-4 text-muted-foreground" />
        )}
      </div>

      <h3
        className={`mt-3 line-clamp-1 text-sm font-bold ${
          badge.unlocked
            ? 'text-ink'
            : 'text-muted-foreground'
        }`}
      >
        {badge.name}
      </h3>

      <p className="mt-1 line-clamp-2 min-h-[36px] text-xs leading-[18px] text-muted-foreground">
        {badge.description}
      </p>

      <div className="mt-3 border-t border-border/60 pt-3">
        {badge.unlocked &&
        badge.unlockedDate ? (
          <p className="text-xs font-semibold text-action">
            Desbloqueado{' '}
            {formatDate(
              badge.unlockedDate
            )}
          </p>
        ) : badge.points_required >
          0 ? (
          <p className="text-xs font-semibold text-muted-foreground">
            Requiere{' '}
            <span className="text-[#A37712]">
              {
                badge.points_required
              }{' '}
              pts
            </span>
          </p>
        ) : (
          <p className="text-xs font-semibold text-muted-foreground">
            Por desbloquear
          </p>
        )}
      </div>
    </div>
  );
}