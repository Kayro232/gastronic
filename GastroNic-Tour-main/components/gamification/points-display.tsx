'use client';

import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  Camera,
  CircleDot,
  LoaderCircle,
  MessageCircle,
  Sparkles,
  Star,
  Trophy,
  Zap,
} from 'lucide-react';

import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

interface PointTransaction {
  id: string;
  amount: number;
  source_type: string;
  description: string | null;
  created_at: string;
}

interface UserStats {
  user_id: string;
  points: number;
  level: number;
  reviews_count: number;
  visits_count: number;
  routes_completed: number;
}

interface PointsGroup {
  sourceType: string;
  label: string;
  points: number;
  count: number;
}

function getSourceInfo(
  sourceType: string
) {
  const normalized =
    sourceType.toLowerCase();

  switch (normalized) {
    case 'review':
    case 'reviews':
      return {
        label: 'Reseñas escritas',
        icon: MessageCircle,
      };

    case 'rating':
    case 'ratings':
      return {
        label: 'Calificaciones',
        icon: Star,
      };

    case 'photo':
    case 'photos':
    case 'image':
      return {
        label: 'Fotos compartidas',
        icon: Camera,
      };

    case 'visit':
    case 'visits':
      return {
        label: 'Visitas registradas',
        icon: Zap,
      };

    case 'route':
    case 'routes':
    case 'challenge':
    case 'badge':
      return {
        label: 'Logros y retos',
        icon: Trophy,
      };

    default:
      return {
        label:
          sourceType ||
          'Otras actividades',
        icon: CircleDot,
      };
  }
}

export function PointsDisplay() {
  const [
    transactions,
    setTransactions,
  ] = useState<PointTransaction[]>(
    []
  );

  const [stats, setStats] =
    useState<UserStats | null>(null);

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState('');

  useEffect(() => {
    async function loadPoints() {
      setIsLoading(true);
      setErrorMessage('');

      const {
        data: { user },
        error: userError,
      } =
        await supabase.auth.getUser();

      if (userError || !user) {
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
        statsResult,
        transactionsResult,
      ] = await Promise.all([
        supabase
          .from('user_stats')
          .select(`
            user_id,
            points,
            level,
            reviews_count,
            visits_count,
            routes_completed
          `)
          .eq(
            'user_id',
            user.id
          )
          .maybeSingle(),

        supabase
          .from(
            'point_transactions'
          )
          .select(`
            id,
            amount,
            source_type,
            description,
            created_at
          `)
          .eq(
            'user_id',
            user.id
          )
          .order(
            'created_at',
            {
              ascending: false,
            }
          ),
      ]);

      if (statsResult.error) {
        console.error(
          'Error cargando estadísticas:',
          statsResult.error
        );
      } else {
        setStats(
          statsResult.data as
            | UserStats
            | null
        );
      }

      if (
        transactionsResult.error
      ) {
        console.error(
          'Error cargando movimientos de puntos:',
          transactionsResult.error
        );

        setErrorMessage(
          'No se pudieron cargar tus puntos.'
        );

        setTransactions([]);
      } else {
        setTransactions(
          (transactionsResult.data ??
            []) as PointTransaction[]
        );
      }

      setIsLoading(false);
    }

    loadPoints();
  }, []);

  const pointsBreakdown =
    useMemo<PointsGroup[]>(
      () => {
        const grouped =
          new Map<
            string,
            PointsGroup
          >();

        transactions.forEach(
          (transaction) => {
            const key =
              transaction.source_type ||
              'other';

            const current =
              grouped.get(key);

            if (current) {
              current.points +=
                transaction.amount;

              current.count += 1;
            } else {
              const { label } =
                getSourceInfo(key);

              grouped.set(
                key,
                {
                  sourceType: key,
                  label,
                  points:
                    transaction.amount,
                  count: 1,
                }
              );
            }
          }
        );

        return Array.from(
          grouped.values()
        ).sort(
          (a, b) =>
            b.points - a.points
        );
      },
      [transactions]
    );

  const totalPoints =
    stats?.points ??
    transactions.reduce(
      (sum, item) =>
        sum + item.amount,
      0
    );

  const maxGroupPoints =
    Math.max(
      ...pointsBreakdown.map(
        (item) =>
          Math.max(
            item.points,
            0
          )
      ),
      1
    );

  if (isLoading) {
    return (
      <div className="flex min-h-[260px] sm:min-h-[360px] items-center justify-center rounded-card sm:rounded-sheet border border-border/70 bg-white shadow-none">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <LoaderCircle className="h-7 w-7 animate-spin text-action" />

          <p className="text-sm">
            Cargando tus puntos...
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

              Tu progreso
            </div>

            <h2 className="text-xl font-bold sm:text-2xl tracking-[-0.025em] text-ink">
              Sistema de puntos
            </h2>

            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Cada experiencia en GastroNic suma a tu recorrido.
            </p>
          </div>

          <div className="flex h-10 w-10 sm:h-11 sm:w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-primary/10">
            <Trophy className="h-5 w-5 text-action" />
          </div>
        </div>

        {/* Summary */}
        <div className="mt-5 grid grid-cols-3 gap-2 sm:mt-6 sm:gap-3">
          <SummaryItem
            label="Puntos"
            value={totalPoints.toLocaleString(
              'es-NI'
            )}
          />

          <SummaryItem
            label="Nivel"
            value={(
              stats?.level ?? 1
            ).toString()}
          />

          <SummaryItem
            label="Visitas"
            value={(
              stats?.visits_count ??
              0
            ).toString()}
          />
        </div>
      </div>

      {/* Breakdown */}
      <div className="p-4 sm:p-7">
        <div className="mb-4 flex sm:mb-5 items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-ink">
              Cómo has ganado tus puntos
            </h3>

            <p className="mt-1 text-xs text-muted-foreground">
              Resumen de tu actividad.
            </p>
          </div>
        </div>

        {pointsBreakdown.length ===
        0 ? (
          <div className="flex min-h-[180px] sm:min-h-[220px] items-center justify-center rounded-2xl bg-canvas px-6 text-center">
            <div>
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                <Trophy className="h-5 w-5 text-action" />
              </div>

              <h3 className="mt-4 text-sm font-bold text-ink">
                Tu aventura apenas comienza
              </h3>

              <p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-muted-foreground">
                Visita restaurantes,
                escribe reseñas y
                completa rutas para
                empezar a ganar puntos.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {pointsBreakdown.map(
              (item) => {
                const {
                  icon:
                    IconComponent,
                } = getSourceInfo(
                  item.sourceType
                );

                const percentage =
                  Math.min(
                    Math.max(
                      item.points,
                      0
                    ) /
                      maxGroupPoints *
                      100,
                    100
                  );

                return (
                  <div
                    key={
                      item.sourceType
                    }
                    className="rounded-xl border border-border/60 bg-canvas p-3 sm:rounded-2xl sm:p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary/[0.08]">
                        <IconComponent className="h-4.5 w-4.5 text-action" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <p className="truncate text-sm font-bold text-ink">
                            {
                              item.label
                            }
                          </p>

                          <span className="flex-shrink-0 text-sm font-bold text-action">
                            {item.points >
                            0
                              ? '+'
                              : ''}
                            {
                              item.points
                            }
                          </span>
                        </div>

                        <div className="mt-1 flex items-center justify-between gap-3">
                          <p className="text-xs text-muted-foreground">
                            {
                              item.count
                            }{' '}
                            {item.count ===
                            1
                              ? 'acción'
                              : 'acciones'}
                          </p>
                        </div>

                        <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-primary/10">
                          <div
                            className="h-full rounded-full bg-action transition-all duration-500"
                            style={{
                              width: `${percentage}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-border/60 bg-canvas px-4 py-3.5 sm:px-7 sm:py-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">
              Balance total
            </p>

            <p className="mt-0.5 text-xs text-muted-foreground">
              Puntos acumulados
            </p>
          </div>

          <p className="text-xl font-bold sm:text-2xl tracking-tight text-action">
            {totalPoints.toLocaleString(
              'es-NI'
            )}
          </p>
        </div>
      </div>
    </section>
  );
}

function SummaryItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-canvas px-2.5 py-3 sm:rounded-2xl sm:px-3 sm:py-3.5">
      <p className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </p>

      <p className="mt-1 text-base font-bold sm:text-lg text-ink">
        {value}
      </p>
    </div>
  );
}