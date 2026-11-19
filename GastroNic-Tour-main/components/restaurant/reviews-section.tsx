'use client';

import {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  AlertCircle,
  BadgeCheck,
  Heart,
  LoaderCircle,
  MessageCircle,
  Pencil,
  Send,
  Star,
  Trash2,
  UserRound,
  X,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { useConfirm } from '@/components/common/confirm-dialog';
import { getUserFacingErrorMessage } from '@/lib/supabase/errors';

const supabase =
  createClient();

/* ========================================================== */
/* TYPES                                                      */
/* ========================================================== */

interface ReviewsSectionProps {
  restaurantId: string;
}

interface ReviewProfile {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_path: string | null;
}

interface Review {
  id: string;
  restaurant_id: string;
  user_id: string;

  rating: number;

  title: string | null;
  comment: string;

  status: string;

  is_verified_visit: boolean;

  helpful_count: number;

  owner_reply: string | null;
  owner_replied_at: string | null;

  created_at: string;
  updated_at: string;

  profile:
    | ReviewProfile
    | ReviewProfile[]
    | null;
}

interface RatingSummary {
  average: number;
  total: number;
  distribution: Record<
    number,
    number
  >;
}

/* ========================================================== */
/* HELPERS                                                    */
/* ========================================================== */

function getProfile(
  profile:
    | ReviewProfile
    | ReviewProfile[]
    | null
) {
  if (!profile) {
    return null;
  }

  return Array.isArray(
    profile
  )
    ? profile[0] ??
        null
    : profile;
}

function getAuthorName(
  review: Review
) {
  const profile =
    getProfile(
      review.profile
    );

  return (
    profile?.full_name ||
    profile?.username ||
    'Usuario de GastroNic'
  );
}

function getInitials(
  name: string
) {
  const initials =
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map(
        (part) =>
          part
            .charAt(0)
            .toUpperCase()
      )
      .join('');

  return (
    initials ||
    'GN'
  );
}

function getAvatarUrl(
  avatarPath:
    | string
    | null
) {
  if (!avatarPath) {
    return null;
  }

  if (
    avatarPath.startsWith(
      'http://'
    ) ||
    avatarPath.startsWith(
      'https://'
    )
  ) {
    return avatarPath;
  }

  const supabaseUrl =
    process.env
      .NEXT_PUBLIC_SUPABASE_URL;

  if (!supabaseUrl) {
    return null;
  }

  return `${supabaseUrl}/storage/v1/object/public/avatars/${avatarPath}`;
}

function formatReviewDate(
  date: string
) {
  return new Intl.DateTimeFormat(
    'es-NI',
    {
      dateStyle:
        'medium',

      timeZone:
        'America/Managua',
    }
  ).format(
    new Date(date)
  );
}

function calculateSummary(
  reviews: Review[]
): RatingSummary {
  const distribution:
    Record<
      number,
      number
    > = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };

  let ratingTotal =
    0;

  reviews.forEach(
    (review) => {
      const safeRating =
        Math.min(
          Math.max(
            Number(
              review.rating
            ),
            1
          ),
          5
        );

      distribution[
        safeRating
      ] += 1;

      ratingTotal +=
        safeRating;
    }
  );

  return {
    average:
      reviews.length >
      0
        ? ratingTotal /
          reviews.length
        : 0,

    total:
      reviews.length,

    distribution,
  };
}

/* ========================================================== */
/* COMPONENT                                                  */
/* ========================================================== */

export function ReviewsSection({
  restaurantId,
}: ReviewsSectionProps) {
  const [
    reviews,
    setReviews,
  ] =
    useState<
      Review[]
    >([]);

  const [
    likedReviewIds,
    setLikedReviewIds,
  ] =
    useState<
      Set<string>
    >(
      new Set()
    );

  const [
    currentUserId,
    setCurrentUserId,
  ] =
    useState<
      string | null
    >(null);

  const [
    title,
    setTitle,
  ] =
    useState('');

  const [
    newReview,
    setNewReview,
  ] =
    useState('');

  const [
    rating,
    setRating,
  ] =
    useState(5);

  const [
    hoveredStar,
    setHoveredStar,
  ] =
    useState(0);

  const [
    isLoading,
    setIsLoading,
  ] =
    useState(true);

  const [
    isSubmitting,
    setIsSubmitting,
  ] =
    useState(false);

  const [
    isLoadingUser,
    setIsLoadingUser,
  ] =
    useState(true);

  const [
    activeReactionId,
    setActiveReactionId,
  ] =
    useState<
      string | null
    >(null);

  const [
    errorMessage,
    setErrorMessage,
  ] =
    useState('');

  const [
    formMessage,
    setFormMessage,
  ] =
    useState('');

  const [
    editingReviewId,
    setEditingReviewId,
  ] =
    useState<
      string | null
    >(null);

  const [
    deletingReviewId,
    setDeletingReviewId,
  ] =
    useState<
      string | null
    >(null);

  /* ======================================================== */
  /* LOAD REVIEWS                                             */
  /* ======================================================== */

  const loadReviews =
    useCallback(
      async () => {
        setIsLoading(
          true
        );

        setErrorMessage(
          ''
        );

        const {
          data,
          error,
        } =
          await supabase
            .from(
              'reviews'
            )
            .select(`
              id,
              restaurant_id,
              user_id,
              rating,
              title,
              comment,
              status,
              is_verified_visit,
              helpful_count,
              owner_reply,
              owner_replied_at,
              created_at,
              updated_at,

              profile:profiles!reviews_user_id_fkey (
                id,
                full_name,
                username,
                avatar_path
              )
            `)
            .eq(
              'restaurant_id',
              restaurantId
            )
            .eq(
              'status',
              'published'
            )
            .order(
              'created_at',
              {
                ascending:
                  false,
              }
            );

        if (error) {
          console.error(
            'Error cargando reseñas:',
            error
          );

          setReviews(
            []
          );

          setErrorMessage(
            'No se pudieron cargar las reseñas del restaurante.'
          );

          setIsLoading(
            false
          );

          return;
        }

        setReviews(
          (data ??
            []) as unknown as Review[]
        );

        setIsLoading(
          false
        );
      },
      [
        restaurantId,
      ]
    );

  /* ======================================================== */
  /* USER                                                     */
  /* ======================================================== */

  const loadCurrentUser =
    useCallback(
      async () => {
        setIsLoadingUser(
          true
        );

        const {
          data: {
            user,
          },
          error,
        } =
          await supabase.auth.getUser();

        if (
          error &&
          error.name !==
            'AuthSessionMissingError'
        ) {
          console.error(
            'Error obteniendo usuario:',
            error
          );
        }

        const userId =
          user?.id ??
          null;

        setCurrentUserId(
          userId
        );

        if (!userId) {
          setLikedReviewIds(
            new Set()
          );

          setIsLoadingUser(
            false
          );

          return;
        }

        const {
          data:
            reactions,

          error:
            reactionsError,
        } =
          await supabase
            .from(
              'review_reactions'
            )
            .select(
              'review_id'
            )
            .eq(
              'user_id',
              userId
            )
            .eq(
              'reaction',
              'helpful'
            );

        if (
          reactionsError
        ) {
          console.error(
            'Error cargando reacciones:',
            reactionsError
          );
        } else {
          setLikedReviewIds(
            new Set(
              (
                reactions ??
                []
              ).map(
                (
                  reaction
                ) =>
                  reaction.review_id
              )
            )
          );
        }

        setIsLoadingUser(
          false
        );
      },
      []
    );

  useEffect(() => {
    loadReviews();
    loadCurrentUser();
  }, [
    loadReviews,
    loadCurrentUser,
  ]);

  /* ======================================================== */
  /* FORM HELPERS                                             */
  /* ======================================================== */

  function resetReviewForm() {
    setTitle('');
    setNewReview('');
    setRating(5);
    setHoveredStar(
      0
    );
    setEditingReviewId(
      null
    );
  }

  function handleEditReview(
    review: Review
  ) {
    if (
      !currentUserId ||
      review.user_id !==
        currentUserId
    ) {
      return;
    }

    setTitle(
      review.title ??
        ''
    );

    setNewReview(
      review.comment
    );

    setRating(
      review.rating
    );

    setHoveredStar(
      0
    );

    setEditingReviewId(
      review.id
    );

    setFormMessage(
      ''
    );

    window.setTimeout(
      () => {
        document
          .getElementById(
            'review-form'
          )
          ?.scrollIntoView({
            behavior:
              'smooth',

            block:
              'center',
          });
      },
      50
    );
  }

  function handleCancelEdit() {
    resetReviewForm();

    setFormMessage(
      ''
    );
  }

  const confirm = useConfirm();

  async function handleDeleteReview(
    review: Review
  ) {
    if (
      !currentUserId ||
      review.user_id !==
        currentUserId
    ) {
      return;
    }

    const confirmed =
      await confirm({
        title: '¿Seguro que quieres eliminar tu reseña?',
        description: 'Esta acción no se puede deshacer.',
        confirmLabel: 'Eliminar reseña',
        tone: 'danger',
      });

    if (
      !confirmed
    ) {
      return;
    }

    setDeletingReviewId(
      review.id
    );

    setFormMessage(
      ''
    );

    const {
      error,
    } =
      await supabase
        .from(
          'reviews'
        )
        .delete()
        .eq(
          'id',
          review.id
        )
        .eq(
          'user_id',
          currentUserId
        );

    if (
      error
    ) {
      console.error(
        'Error eliminando reseña:',
        error
      );

      setFormMessage(
        'No se pudo eliminar tu reseña.'
      );

      setDeletingReviewId(
        null
      );

      return;
    }

    if (
      editingReviewId ===
      review.id
    ) {
      resetReviewForm();
    }

    await loadReviews();

    setFormMessage(
      'Tu reseña fue eliminada correctamente.'
    );

    setDeletingReviewId(
      null
    );
  }

  /* ======================================================== */
  /* SUBMIT                                                   */
  /* ======================================================== */

  async function handleSubmitReview(
    event:
      React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setFormMessage(
      ''
    );

    if (
      !currentUserId
    ) {
      setFormMessage(
        'Debes iniciar sesión para publicar una reseña.'
      );

      return;
    }

    const cleanComment =
      newReview.trim();

    const cleanTitle =
      title.trim();

    if (
      cleanComment.length <
      3
    ) {
      setFormMessage(
        'La reseña debe contener al menos 3 caracteres.'
      );

      return;
    }

    if (
      cleanComment.length >
      3000
    ) {
      setFormMessage(
        'La reseña no puede superar los 3000 caracteres.'
      );

      return;
    }

    if (
      cleanTitle.length >
      120
    ) {
      setFormMessage(
        'El título no puede superar los 120 caracteres.'
      );

      return;
    }

    setIsSubmitting(
      true
    );

    try {
      const {
        data:
          existingReview,

        error:
          existingReviewError,
      } =
        await supabase
          .from(
            'reviews'
          )
          .select(
            'id'
          )
          .eq(
            'restaurant_id',
            restaurantId
          )
          .eq(
            'user_id',
            currentUserId
          )
          .maybeSingle();

      if (
        existingReviewError
      ) {
        console.error(
          'Error comprobando reseña existente:',
          {
            message:
              existingReviewError.message,

            code:
              existingReviewError.code,

            details:
              existingReviewError.details,

            hint:
              existingReviewError.hint,
          }
        );

        setFormMessage(
          getUserFacingErrorMessage(
            existingReviewError,
            'No se pudo comprobar tu reseña. Inténtalo nuevamente.'
          )
        );

        return;
      }

      if (
        existingReview
      ) {
        const {
          error:
            updateError,
        } =
          await supabase
            .from(
              'reviews'
            )
            .update({
              rating,

              title:
                cleanTitle ||
                null,

              comment:
                cleanComment,
            })
            .eq(
              'id',
              existingReview.id
            )
            .eq(
              'user_id',
              currentUserId
            );

        if (
          updateError
        ) {
          console.error(
            'Error actualizando reseña:',
            updateError
          );

          setFormMessage(
            getUserFacingErrorMessage(
              updateError,
              'No se pudo actualizar tu reseña. Inténtalo nuevamente.'
            )
          );

          return;
        }

        setFormMessage(
          'Tu reseña fue actualizada correctamente.'
        );
      } else {
        const {
          error:
            insertError,
        } =
          await supabase
            .from(
              'reviews'
            )
            .insert({
              restaurant_id:
                restaurantId,

              user_id:
                currentUserId,

              rating,

              title:
                cleanTitle ||
                null,

              comment:
                cleanComment,

              status:
                'published',
            });

        if (
          insertError
        ) {
          console.error(
            'Error publicando reseña:',
            insertError
          );

          setFormMessage(
            getUserFacingErrorMessage(
              insertError,
              'No se pudo publicar tu reseña. Inténtalo nuevamente.'
            )
          );

          return;
        }

        setFormMessage(
          'Tu reseña fue publicada correctamente.'
        );
      }

      resetReviewForm();

      await loadReviews();
    } catch (
      unexpectedError
    ) {
      console.error(
        'Error inesperado publicando reseña:',
        unexpectedError
      );

      setFormMessage(
        'Ocurrió un error inesperado al guardar la reseña.'
      );
    } finally {
      setIsSubmitting(
        false
      );
    }
  }

  /* ======================================================== */
  /* HELPFUL                                                  */
  /* ======================================================== */

  async function handleToggleHelpful(
    review: Review
  ) {
    if (
      !currentUserId
    ) {
      setFormMessage(
        'Debes iniciar sesión para marcar una reseña como útil.'
      );

      return;
    }

    if (
      review.user_id ===
      currentUserId
    ) {
      setFormMessage(
        'No puedes reaccionar a tu propia reseña.'
      );

      return;
    }

    setActiveReactionId(
      review.id
    );

    const isLiked =
      likedReviewIds.has(
        review.id
      );

    if (isLiked) {
      const {
        error,
      } =
        await supabase
          .from(
            'review_reactions'
          )
          .delete()
          .eq(
            'review_id',
            review.id
          )
          .eq(
            'user_id',
            currentUserId
          );

      if (error) {
        console.error(
          'Error eliminando reacción:',
          error
        );

        setFormMessage(
          'No se pudo quitar la reacción.'
        );

        setActiveReactionId(
          null
        );

        return;
      }

      setLikedReviewIds(
        (
          current
        ) => {
          const updated =
            new Set(
              current
            );

          updated.delete(
            review.id
          );

          return updated;
        }
      );

      setReviews(
        (
          current
        ) =>
          current.map(
            (
              item
            ) =>
              item.id ===
              review.id
                ? {
                    ...item,

                    helpful_count:
                      Math.max(
                        item.helpful_count -
                          1,
                        0
                      ),
                  }
                : item
          )
      );
    } else {
      const {
        error,
      } =
        await supabase
          .from(
            'review_reactions'
          )
          .insert({
            review_id:
              review.id,

            user_id:
              currentUserId,

            reaction:
              'helpful',
          });

      if (error) {
        console.error(
          'Error guardando reacción:',
          error
        );

        setFormMessage(
          'No se pudo guardar la reacción.'
        );

        setActiveReactionId(
          null
        );

        return;
      }

      setLikedReviewIds(
        (
          current
        ) => {
          const updated =
            new Set(
              current
            );

          updated.add(
            review.id
          );

          return updated;
        }
      );

      setReviews(
        (
          current
        ) =>
          current.map(
            (
              item
            ) =>
              item.id ===
              review.id
                ? {
                    ...item,

                    helpful_count:
                      item.helpful_count +
                      1,
                  }
                : item
          )
      );
    }

    setActiveReactionId(
      null
    );
  }

  /* ======================================================== */
  /* CURRENT USER REVIEW                                      */
  /* ======================================================== */

  const currentUserReview =
    currentUserId
      ? reviews.find(
          (
            review
          ) =>
            review.user_id ===
            currentUserId
        ) ??
        null
      : null;

  /* ======================================================== */
  /* SUMMARY                                                  */
  /* ======================================================== */

  const summary =
    calculateSummary(
      reviews
    );

  /* ======================================================== */
  /* RENDER                                                   */
  /* ======================================================== */

  return (
    <section className="space-y-8">
      {/* ====================================================== */}
      {/* HEADER                                                 */}
      {/* ====================================================== */}

      <div>
        <p className="text-xs font-bold uppercase tracking-[0.08em] text-action">
          Experiencias
        </p>

        <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-[-0.035em] text-ink sm:text-3xl">
              Reseñas
            </h2>

            <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
              Opiniones compartidas por personas que visitaron o conocieron
              este restaurante.
            </p>
          </div>

          {summary.total >
            0 && (
            <p className="text-xs font-semibold text-muted-foreground">
              {summary.total}{' '}
              {summary.total ===
              1
                ? 'opinión'
                : 'opiniones'}
            </p>
          )}
        </div>
      </div>

      {/* ====================================================== */}
      {/* SUMMARY                                                */}
      {/* ====================================================== */}

      <section className="overflow-hidden rounded-card border border-border/70 bg-surface-2">
        <div className="grid md:grid-cols-[260px_minmax(0,1fr)]">
          {/* SCORE */}

          <div className="flex flex-col justify-center border-b border-border/60 p-6 md:border-b-0 md:border-r md:p-8">
            <div className="flex items-end gap-2">
              <span className="text-5xl font-bold tracking-[-0.06em] text-ink">
                {summary.total >
                0
                  ? summary.average.toFixed(
                      1
                    )
                  : '—'}
              </span>

              <span className="mb-1 text-sm font-semibold text-muted-foreground">
                / 5
              </span>
            </div>

            <div className="mt-3 flex gap-1">
              {[1, 2, 3, 4, 5].map(
                (
                  star
                ) => (
                  <Star
                    key={
                      star
                    }
                    className={`h-4 w-4 ${
                      star <=
                      Math.round(
                        summary.average
                      )
                        ? 'fill-secondary text-secondary'
                        : 'fill-white text-border'
                    }`}
                  />
                )
              )}
            </div>

            <p className="mt-3 text-xs leading-5 text-muted-foreground">
              {summary.total >
              0
                ? `Basado en ${summary.total} ${
                    summary.total ===
                    1
                      ? 'reseña publicada'
                      : 'reseñas publicadas'
                  }.`
                : 'Todavía no existe una puntuación para este restaurante.'}
            </p>
          </div>

          {/* DISTRIBUTION */}

          <div className="p-6 md:p-8">
            <p className="mb-5 text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">
              Distribución
            </p>

            <div className="space-y-3">
              {[5, 4, 3, 2, 1].map(
                (
                  stars
                ) => {
                  const count =
                    summary.distribution[
                      stars
                    ] ??
                    0;

                  const percentage =
                    summary.total >
                    0
                      ? (
                          count /
                          summary.total
                        ) *
                        100
                      : 0;

                  return (
                    <div
                      key={
                        stars
                      }
                      className="flex items-center gap-3"
                    >
                      <div className="flex w-8 flex-shrink-0 items-center gap-1">
                        <span className="text-xs font-bold text-ink">
                          {
                            stars
                          }
                        </span>

                        <Star className="h-2.5 w-2.5 fill-secondary text-secondary" />
                      </div>

                      <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-white">
                        <div
                          className="h-full rounded-full bg-action transition-all duration-500"
                          style={{
                            width:
                              `${percentage}%`,
                          }}
                        />
                      </div>

                      <span className="w-6 flex-shrink-0 text-right text-xs font-medium text-muted-foreground">
                        {
                          count
                        }
                      </span>
                    </div>
                  );
                }
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================== */}
      {/* WRITE / MANAGE REVIEW                                  */}
      {/* ====================================================== */}

      <section
        id="review-form"
        className="scroll-mt-32 rounded-card border border-border/70 bg-white p-5 shadow-none sm:p-6"
      >
        <div className="mb-6 flex items-start gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary/[0.07] text-action">
            {editingReviewId ? (
              <Pencil className="h-4 w-4" />
            ) : (
              <MessageCircle className="h-4 w-4" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="text-base font-bold text-ink">
              {editingReviewId
                ? 'Edita tu reseña'
                : currentUserReview
                  ? 'Tu experiencia'
                  : 'Comparte tu experiencia'}
            </h3>

            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              {editingReviewId
                ? 'Actualiza tu calificación, título o comentario cuando quieras.'
                : currentUserReview
                  ? 'Ya compartiste una reseña de este restaurante. Puedes editarla o eliminarla.'
                  : 'Puedes publicar una reseña por restaurante y modificarla más adelante.'}
            </p>
          </div>
        </div>

        {formMessage && (
          <div className="mb-5 rounded-xl border border-border/60 bg-surface-2 px-4 py-3 text-xs leading-5 text-ink">
            {
              formMessage
            }
          </div>
        )}

        {isLoadingUser ? (
          <div className="flex items-center gap-2 rounded-xl bg-canvas px-4 py-4 text-xs text-muted-foreground">
            <LoaderCircle className="h-4 w-4 animate-spin text-action" />

            Comprobando tu sesión...
          </div>
        ) : !currentUserId ? (
          <div className="rounded-card bg-surface-2 px-5 py-7 text-center">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-white text-action shadow-sm">
              <UserRound className="h-5 w-5" />
            </div>

            <p className="mt-4 text-sm font-bold text-ink">
              Inicia sesión para opinar
            </p>

            <p className="mx-auto mt-1.5 max-w-sm text-xs leading-5 text-muted-foreground">
              Las reseñas se publican desde una cuenta de GastroNic.
            </p>
          </div>
        ) : currentUserReview &&
          editingReviewId !==
            currentUserReview.id ? (
          <div className="rounded-card border border-primary/10 bg-primary/[0.035] p-5">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex rounded-full bg-primary/[0.09] px-2.5 py-1 text-xs font-bold text-action">
                    Tu reseña
                  </span>

                  {currentUserReview.is_verified_visit && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/[0.07] px-2.5 py-1 text-xs font-bold text-action">
                      <BadgeCheck className="h-2.5 w-2.5" />

                      Visita verificada
                    </span>
                  )}
                </div>

                <div className="mt-3 flex gap-0.5">
                  {[1, 2, 3, 4, 5].map(
                    (
                      star
                    ) => (
                      <Star
                        key={
                          star
                        }
                        className={`h-4 w-4 ${
                          star <=
                          currentUserReview.rating
                            ? 'fill-secondary text-secondary'
                            : 'fill-white text-border'
                        }`}
                      />
                    )
                  )}
                </div>

                <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted-foreground">
                  {
                    currentUserReview.comment
                  }
                </p>
              </div>

              <div className="flex flex-shrink-0 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    handleEditReview(
                      currentUserReview
                    )
                  }
                  className="h-10 rounded-xl px-4 text-xs font-bold"
                >
                  <Pencil className="mr-2 h-3.5 w-3.5" />

                  Editar
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  disabled={
                    deletingReviewId ===
                    currentUserReview.id
                  }
                  onClick={() =>
                    handleDeleteReview(
                      currentUserReview
                    )
                  }
                  className="h-10 rounded-xl border-danger/25 px-4 text-xs font-bold text-danger hover:bg-danger-soft hover:text-danger"
                >
                  {deletingReviewId ===
                  currentUserReview.id ? (
                    <LoaderCircle className="mr-2 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="mr-2 h-3.5 w-3.5" />
                  )}

                  Eliminar
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <form
            onSubmit={
              handleSubmitReview
            }
            className="space-y-5"
          >
            {/* STARS */}

            <div>
              <label className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">
                Tu calificación
              </label>

              <div className="mt-3 flex items-center gap-2">
                {[1, 2, 3, 4, 5].map(
                  (
                    star
                  ) => (
                    <button
                      key={
                        star
                      }
                      type="button"
                      onMouseEnter={() =>
                        setHoveredStar(
                          star
                        )
                      }
                      onMouseLeave={() =>
                        setHoveredStar(
                          0
                        )
                      }
                      onFocus={() =>
                        setHoveredStar(
                          star
                        )
                      }
                      onBlur={() =>
                        setHoveredStar(
                          0
                        )
                      }
                      onClick={() =>
                        setRating(
                          star
                        )
                      }
                      className="rounded-lg transition-transform hover:scale-110 focus:outline-none"
                      aria-label={`Calificar con ${star} estrellas`}
                    >
                      <Star
                        className={`h-7 w-7 ${
                          star <=
                          (
                            hoveredStar ||
                            rating
                          )
                            ? 'fill-secondary text-secondary'
                            : 'fill-[#F3F5F4] text-border'
                        }`}
                      />
                    </button>
                  )
                )}

                <span className="ml-2 text-xs font-bold text-ink">
                  {
                    rating
                  }/5
                </span>
              </div>
            </div>

            {/* TITLE */}

            <div>
              <label
                htmlFor="review-title"
                className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground"
              >
                Título

                <span className="ml-1 font-medium normal-case tracking-normal text-muted-foreground/60">
                  opcional
                </span>
              </label>

              <input
                id="review-title"
                type="text"
                value={
                  title
                }
                onChange={(
                  event
                ) =>
                  setTitle(
                    event.target.value
                  )
                }
                maxLength={
                  120
                }
                placeholder="Resume tu experiencia"
                className="mt-2.5 h-11 w-full rounded-xl border border-border/80 bg-canvas px-4 text-sm text-ink outline-none transition placeholder:text-muted-foreground/60 focus:border-primary/40 focus:ring-4 focus:ring-primary/[0.06]"
                disabled={
                  isSubmitting
                }
              />
            </div>

            {/* COMMENT */}

            <div>
              <div className="flex items-center justify-between gap-3">
                <label
                  htmlFor="review-comment"
                  className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground"
                >
                  Tu reseña
                </label>

                <span className="text-xs tabular-nums text-muted-foreground">
                  {
                    newReview.length
                  }
                  /3000
                </span>
              </div>

              <textarea
                id="review-comment"
                value={
                  newReview
                }
                onChange={(
                  event
                ) =>
                  setNewReview(
                    event.target.value
                  )
                }
                placeholder="¿Qué destacarías de tu visita?"
                className="mt-2.5 w-full resize-none rounded-xl border border-border/80 bg-canvas px-4 py-3 text-sm leading-6 text-ink outline-none transition placeholder:text-muted-foreground/60 focus:border-primary/40 focus:ring-4 focus:ring-primary/[0.06]"
                rows={5}
                minLength={
                  3
                }
                maxLength={
                  3000
                }
                disabled={
                  isSubmitting
                }
                required
              />
            </div>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              {editingReviewId && (
                <Button
                  type="button"
                  variant="outline"
                  disabled={
                    isSubmitting
                  }
                  onClick={
                    handleCancelEdit
                  }
                  className="h-10 rounded-xl px-5 font-bold"
                >
                  <X className="mr-2 h-4 w-4" />

                  Cancelar
                </Button>
              )}

              <Button
                type="submit"
                disabled={
                  isSubmitting
                }
                className="h-10 rounded-xl bg-action px-5 font-bold text-white shadow-none hover:bg-action-hover"
              >
                {isSubmitting ? (
                  <>
                    <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />

                    Guardando...
                  </>
                ) : editingReviewId ? (
                  <>
                    <Pencil className="mr-2 h-4 w-4" />

                    Guardar cambios
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />

                    Publicar reseña
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </section>

      {/* ====================================================== */}
      {/* REVIEWS LIST                                           */}
      {/* ====================================================== */}

      <section>
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-action">
              Comunidad
            </p>

            <h3 className="mt-1 text-lg font-bold text-ink">
              Lo que dicen los visitantes
            </h3>
          </div>

          {reviews.length >
            0 && (
            <span className="rounded-full border border-border/70 bg-white px-3 py-1.5 text-xs font-bold text-muted-foreground">
              {reviews.length}{' '}
              {reviews.length ===
              1
                ? 'reseña'
                : 'reseñas'}
            </span>
          )}
        </div>

        {/* LOADING */}

        {isLoading && (
          <div className="flex min-h-[180px] items-center justify-center rounded-card border border-border/70 bg-white">
            <LoaderCircle className="mr-3 h-5 w-5 animate-spin text-action" />

            <p className="text-xs text-muted-foreground">
              Cargando reseñas...
            </p>
          </div>
        )}

        {/* ERROR */}

        {!isLoading &&
          errorMessage && (
            <div className="flex items-start gap-3 rounded-card border border-danger/25 bg-red-50/70 p-5 text-danger">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />

              <p className="text-xs leading-5">
                {
                  errorMessage
                }
              </p>
            </div>
          )}

        {/* EMPTY */}

        {!isLoading &&
          !errorMessage &&
          reviews.length ===
            0 && (
            <div className="rounded-card border border-border/70 bg-white px-6 py-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/[0.07] text-action">
                <MessageCircle className="h-5 w-5" />
              </div>

              <h3 className="mt-4 text-sm font-bold text-ink">
                Todavía no hay reseñas
              </h3>

              <p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-muted-foreground">
                Sé la primera persona en compartir su experiencia.
              </p>
            </div>
          )}

        {/* LIST */}

        {!isLoading &&
          !errorMessage &&
          reviews.length >
            0 && (
            <div className="divide-y divide-border/60 border-y border-border/60">
              {reviews.map(
                (
                  review
                ) => {
                  const authorName =
                    getAuthorName(
                      review
                    );

                  const profile =
                    getProfile(
                      review.profile
                    );

                  const avatarUrl =
                    getAvatarUrl(
                      profile?.avatar_path ??
                        null
                    );

                  const isLiked =
                    likedReviewIds.has(
                      review.id
                    );

                  const isOwnReview =
                    currentUserId ===
                    review.user_id;

                  return (
                    <article
                      key={
                        review.id
                      }
                      className="py-7 first:pt-6 last:pb-6"
                    >
                      <div className="grid gap-5 sm:grid-cols-[auto_minmax(0,1fr)]">
                        {/* AVATAR */}

                        <div>
                          {avatarUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={
                                avatarUrl
                              }
                              alt={
                                authorName
                              }
                              className="h-11 w-11 rounded-full object-cover ring-1 ring-border/60"
                            />
                          ) : (
                            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#E9EFED] text-xs font-bold text-ink">
                              {getInitials(
                                authorName
                              )}
                            </div>
                          )}
                        </div>

                        {/* REVIEW */}

                        <div className="min-w-0">
                          {/* AUTHOR */}

                          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <h4 className="text-sm font-bold text-ink">
                                  {
                                    authorName
                                  }
                                </h4>

                                {isOwnReview && (
                                  <span className="inline-flex rounded-full bg-ink px-2 py-1 text-xs font-bold text-white">
                                    Tu reseña
                                  </span>
                                )}

                                {review.is_verified_visit && (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/[0.07] px-2 py-1 text-xs font-bold text-action">
                                    <BadgeCheck className="h-2.5 w-2.5" />

                                    Visita verificada
                                  </span>
                                )}
                              </div>

                              <p className="mt-1 text-xs text-muted-foreground">
                                {formatReviewDate(
                                  review.created_at
                                )}
                              </p>
                            </div>

                            <div className="flex gap-0.5">
                              {[1, 2, 3, 4, 5].map(
                                (
                                  star
                                ) => (
                                  <Star
                                    key={
                                      star
                                    }
                                    className={`h-3.5 w-3.5 ${
                                      star <=
                                      review.rating
                                        ? 'fill-secondary text-secondary'
                                        : 'fill-[#F3F5F4] text-border'
                                    }`}
                                  />
                                )
                              )}
                            </div>
                          </div>

                          {/* CONTENT */}

                          {review.title && (
                            <h5 className="mt-4 text-[15px] font-bold leading-6 text-ink">
                              {
                                review.title
                              }
                            </h5>
                          )}

                          <p className="mt-2 whitespace-pre-line text-sm leading-7 text-ink-muted">
                            {
                              review.comment
                            }
                          </p>

                          {/* OWNER REPLY */}

                          {review.owner_reply && (
                            <div className="mt-5 rounded-card bg-surface-2 px-4 py-4 sm:px-5">
                              <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-action" />

                                <p className="text-xs font-bold uppercase tracking-[0.08em] text-action">
                                  Respuesta del restaurante
                                </p>
                              </div>

                              <p className="mt-2 text-xs leading-6 text-ink-muted">
                                {
                                  review.owner_reply
                                }
                              </p>

                              {review.owner_replied_at && (
                                <p className="mt-2 text-xs text-muted-foreground">
                                  {formatReviewDate(
                                    review.owner_replied_at
                                  )}
                                </p>
                              )}
                            </div>
                          )}

                          {/* ACTIONS */}

                          <div className="mt-5 flex flex-wrap items-center gap-2">
                            {isOwnReview ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleEditReview(
                                      review
                                    )
                                  }
                                  className="inline-flex h-9 items-center gap-2 rounded-full border border-border/70 bg-white px-3.5 text-xs font-semibold text-muted-foreground transition hover:border-primary/20 hover:text-action"
                                >
                                  <Pencil className="h-3.5 w-3.5" />

                                  Editar
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDeleteReview(
                                      review
                                    )
                                  }
                                  disabled={
                                    deletingReviewId ===
                                    review.id
                                  }
                                  className="inline-flex h-9 items-center gap-2 rounded-full border border-danger/25 bg-white px-3.5 text-xs font-semibold text-danger transition hover:bg-danger-soft disabled:opacity-50"
                                >
                                  {deletingReviewId ===
                                  review.id ? (
                                    <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-3.5 w-3.5" />
                                  )}

                                  Eliminar
                                </button>
                              </>
                            ) : (
                              <button
                                type="button"
                                onClick={() =>
                                  handleToggleHelpful(
                                    review
                                  )
                                }
                                disabled={
                                  activeReactionId ===
                                  review.id
                                }
                                className={`inline-flex h-9 items-center gap-2 rounded-full border px-3.5 text-xs font-semibold transition disabled:opacity-50 ${
                                  isLiked
                                    ? 'border-primary/15 bg-primary/[0.07] text-action'
                                    : 'border-border/70 bg-white text-muted-foreground hover:border-primary/20 hover:text-action'
                                }`}
                              >
                                {activeReactionId ===
                                review.id ? (
                                  <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Heart
                                    className={`h-3.5 w-3.5 ${
                                      isLiked
                                        ? 'fill-primary'
                                        : ''
                                    }`}
                                  />
                                )}

                                Útil

                                {review.helpful_count >
                                  0 && (
                                  <span className="text-xs opacity-70">
                                    {
                                      review.helpful_count
                                    }
                                  </span>
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                }
              )}
            </div>
          )}
      </section>
    </section>
  );
}