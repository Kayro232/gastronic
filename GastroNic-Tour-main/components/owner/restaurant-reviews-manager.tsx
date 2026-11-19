'use client';

import {
  useMemo,
  useState,
} from 'react';

import {
  CheckCircle2,
  Edit3,
  LoaderCircle,
  MessageSquareText,
  Search,
  ShieldCheck,
  Star,
  ThumbsUp,
  Trash2,
  X,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { getUserFacingErrorMessage } from '@/lib/supabase/errors';

const supabase =
  createClient();

interface ReviewProfile {
  id: string;
  full_name: string;
  username: string | null;
  avatar_path: string | null;
}

interface Review {
  id: string;
  restaurant_id: string;
  user_id: string;
  visit_id: string | null;
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

interface Props {
  restaurantName: string;
  averageRating: number;
  reviewsCount: number;
  initialReviews: Review[];
}

type FilterType =
  | 'all'
  | 'answered'
  | 'unanswered'
  | 'verified';

export function RestaurantReviewsManager({
  restaurantName,
  averageRating,
  reviewsCount,
  initialReviews,
}: Props) {
  const [
    reviews,
    setReviews,
  ] = useState(
    initialReviews
  );

  const [
    filter,
    setFilter,
  ] =
    useState<FilterType>(
      'all'
    );

  const [
    ratingFilter,
    setRatingFilter,
  ] = useState<
    number | null
  >(null);

  const [
    search,
    setSearch,
  ] = useState('');

  const [
    selectedReview,
    setSelectedReview,
  ] = useState<Review | null>(
    null
  );

  const [
    reply,
    setReply,
  ] = useState('');

  const [
    isSaving,
    setIsSaving,
  ] = useState(false);

  const [
    deletingReplyId,
    setDeletingReplyId,
  ] = useState<
    string | null
  >(null);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState('');

  const [
    successMessage,
    setSuccessMessage,
  ] = useState('');

  const publishedReviews =
    useMemo(
      () =>
        reviews.filter(
          (review) =>
            review.status ===
            'published'
        ),
      [reviews]
    );

  const distribution =
    useMemo(() => {
      return [5, 4, 3, 2, 1].map(
        (rating) => ({
          rating,

          count:
            publishedReviews.filter(
              (review) =>
                review.rating ===
                rating
            ).length,
        })
      );
    }, [
      publishedReviews,
    ]);

  const answeredCount =
    publishedReviews.filter(
      (review) =>
        Boolean(
          review.owner_reply
        )
    ).length;

  const unansweredCount =
    publishedReviews.filter(
      (review) =>
        !review.owner_reply
    ).length;

  const verifiedCount =
    publishedReviews.filter(
      (review) =>
        review.is_verified_visit
    ).length;

  const filteredReviews =
    useMemo(() => {
      const term =
        search
          .trim()
          .toLowerCase();

      return reviews.filter(
        (review) => {
          const profile =
            getProfile(
              review.profile
            );

          const filterMatch =
            filter ===
              'all' ||
            (filter ===
              'answered' &&
              Boolean(
                review.owner_reply
              )) ||
            (filter ===
              'unanswered' &&
              !review.owner_reply) ||
            (filter ===
              'verified' &&
              review.is_verified_visit);

          const ratingMatch =
            ratingFilter ===
              null ||
            review.rating ===
              ratingFilter;

          const searchMatch =
            !term ||
            review.title
              ?.toLowerCase()
              .includes(term) ||
            review.comment
              .toLowerCase()
              .includes(term) ||
            profile?.full_name
              ?.toLowerCase()
              .includes(term) ||
            profile?.username
              ?.toLowerCase()
              .includes(term);

          return (
            filterMatch &&
            ratingMatch &&
            searchMatch
          );
        }
      );
    }, [
      reviews,
      filter,
      ratingFilter,
      search,
    ]);

  function openReply(
    review: Review
  ) {
    setErrorMessage('');
    setSuccessMessage('');

    setSelectedReview(
      review
    );

    setReply(
      review.owner_reply ??
        ''
    );
  }

  async function handleSaveReply() {
    if (
      !selectedReview
    ) {
      return;
    }

    const cleanReply =
      reply.trim();

    if (
      cleanReply.length < 2
    ) {
      setErrorMessage(
        'La respuesta es demasiado corta.'
      );

      return;
    }

    setIsSaving(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const { error } =
        await supabase.rpc(
          'reply_to_review',
          {
            p_review_id:
              selectedReview.id,

            p_reply:
              cleanReply,
          }
        );

      if (error) {
        console.error(
          'Error respondiendo reseña:',
          error
        );

        setErrorMessage(
          getUserFacingErrorMessage(error, 'No se pudo guardar la respuesta.')
        );

        return;
      }

      const now =
        new Date().toISOString();

      setReviews(
        (current) =>
          current.map(
            (review) =>
              review.id ===
              selectedReview.id
                ? {
                    ...review,

                    owner_reply:
                      cleanReply,

                    owner_replied_at:
                      now,
                  }
                : review
          )
      );

      setSelectedReview(
        null
      );

      setReply('');

      setSuccessMessage(
        'La respuesta fue publicada correctamente.'
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteReply(
    review: Review
  ) {
    setDeletingReplyId(
      review.id
    );

    setErrorMessage('');
    setSuccessMessage('');

    try {
      const { error } =
        await supabase.rpc(
          'delete_review_reply',
          {
            p_review_id:
              review.id,
          }
        );

      if (error) {
        console.error(
          'Error eliminando respuesta:',
          error
        );

        setErrorMessage(
          getUserFacingErrorMessage(error, 'No se pudo eliminar la respuesta.')
        );

        return;
      }

      setReviews(
        (current) =>
          current.map(
            (item) =>
              item.id ===
              review.id
                ? {
                    ...item,

                    owner_reply:
                      null,

                    owner_replied_at:
                      null,
                  }
                : item
          )
      );

      setSuccessMessage(
        'La respuesta del restaurante fue eliminada.'
      );
    } finally {
      setDeletingReplyId(
        null
      );
    }
  }

  return (
    <div className="space-y-6">
      {/* ====================================================== */}
      {/* SUMMARY                                                */}
      {/* ====================================================== */}

      <section className="grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
        <div className="relative overflow-hidden rounded-sheet bg-ink p-7 text-white shadow-overlay">

          <div className="relative">
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-white/40">
              Reputación
            </p>

            <div className="mt-4 flex items-end gap-3">
              <p className="text-5xl font-bold tracking-[-0.05em]">
                {averageRating.toFixed(
                  1
                )}
              </p>

              <div className="pb-1">
                <Stars
                  rating={
                    averageRating
                  }
                />

                <p className="mt-1 text-xs text-white/45">
                  {reviewsCount}{' '}
                  {reviewsCount ===
                  1
                    ? 'reseña'
                    : 'reseñas'}
                </p>
              </div>
            </div>

            <div className="mt-7 grid grid-cols-3 gap-2">
              <MiniMetric
                value={
                  answeredCount
                }
                label="Respondidas"
              />

              <MiniMetric
                value={
                  unansweredCount
                }
                label="Pendientes"
              />

              <MiniMetric
                value={
                  verifiedCount
                }
                label="Verificadas"
              />
            </div>
          </div>
        </div>

        <div className="rounded-sheet border border-border/70 bg-white p-6 shadow-none">
          <p className="text-xs font-bold uppercase tracking-[0.08em] text-action">
            Distribución
          </p>

          <h2 className="mt-1 text-lg font-bold text-ink">
            Calificaciones
          </h2>

          <div className="mt-6 space-y-3">
            {distribution.map(
              (item) => {
                const total =
                  publishedReviews.length;

                const percentage =
                  total > 0
                    ? (item.count /
                        total) *
                      100
                    : 0;

                return (
                  <button
                    type="button"
                    key={
                      item.rating
                    }
                    onClick={() =>
                      setRatingFilter(
                        ratingFilter ===
                          item.rating
                          ? null
                          : item.rating
                      )
                    }
                    className="grid w-full grid-cols-[46px_minmax(0,1fr)_32px] items-center gap-3 text-left"
                  >
                    <span className="flex items-center gap-1 text-xs font-bold text-ink">
                      {
                        item.rating
                      }

                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    </span>

                    <span className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <span
                        className="block h-full rounded-full bg-amber-400 transition-all"
                        style={{
                          width: `${percentage}%`,
                        }}
                      />
                    </span>

                    <span className="text-right text-xs font-semibold text-muted-foreground">
                      {
                        item.count
                      }
                    </span>
                  </button>
                );
              }
            )}
          </div>
        </div>
      </section>

      {/* ====================================================== */}
      {/* FEEDBACK                                               */}
      {/* ====================================================== */}

      {errorMessage && (
        <div className="rounded-2xl border border-danger/25 bg-danger-soft p-4 text-sm text-danger">
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div className="flex items-start gap-3 rounded-2xl border border-success/25 bg-success-soft p-4 text-sm text-success">
          <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0" />

          {successMessage}
        </div>
      )}

      {/* ====================================================== */}
      {/* LIST                                                   */}
      {/* ====================================================== */}

      <section className="overflow-hidden rounded-sheet border border-border/70 bg-white shadow-none">
        <div className="border-b border-border/60 p-5 sm:p-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap gap-2">
              <FilterButton
                label="Todas"
                active={
                  filter ===
                  'all'
                }
                onClick={() =>
                  setFilter(
                    'all'
                  )
                }
              />

              <FilterButton
                label="Sin responder"
                active={
                  filter ===
                  'unanswered'
                }
                onClick={() =>
                  setFilter(
                    'unanswered'
                  )
                }
              />

              <FilterButton
                label="Respondidas"
                active={
                  filter ===
                  'answered'
                }
                onClick={() =>
                  setFilter(
                    'answered'
                  )
                }
              />

              <FilterButton
                label="Visita verificada"
                active={
                  filter ===
                  'verified'
                }
                onClick={() =>
                  setFilter(
                    'verified'
                  )
                }
              />

              {ratingFilter !==
                null && (
                <button
                  type="button"
                  onClick={() =>
                    setRatingFilter(
                      null
                    )
                  }
                  className="rounded-full border border-warning/25 bg-warning-soft px-4 py-2 text-xs font-bold text-warning"
                >
                  {
                    ratingFilter
                  }★ ×
                </button>
              )}
            </div>

            <div className="relative w-full xl:w-72">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

              <input
                value={search}
                onChange={(
                  event
                ) =>
                  setSearch(
                    event.target
                      .value
                  )
                }
                placeholder="Buscar reseña..."
                className="h-11 w-full rounded-xl border border-border bg-canvas pl-10 pr-4 text-sm outline-none transition focus:border-primary/30 focus:bg-white focus:ring-4 focus:ring-primary/[0.06]"
              />
            </div>
          </div>
        </div>

        <div className="divide-y divide-border/60">
          {filteredReviews.length ===
          0 ? (
            <div className="flex min-h-[320px] items-center justify-center p-8 text-center">
              <div>
                <MessageSquareText className="mx-auto h-8 w-8 text-muted-foreground/40" />

                <h3 className="mt-4 text-sm font-bold text-ink">
                  No encontramos reseñas
                </h3>

                <p className="mt-2 text-xs text-muted-foreground">
                  Prueba con otro filtro o término de búsqueda.
                </p>
              </div>
            </div>
          ) : (
            filteredReviews.map(
              (review) => (
                <ReviewCard
                  key={
                    review.id
                  }
                  review={
                    review
                  }
                  deletingReply={
                    deletingReplyId ===
                    review.id
                  }
                  onReply={() =>
                    openReply(
                      review
                    )
                  }
                  onDeleteReply={() =>
                    handleDeleteReply(
                      review
                    )
                  }
                />
              )
            )
          )}
        </div>
      </section>

      {/* ====================================================== */}
      {/* REPLY MODAL                                            */}
      {/* ====================================================== */}

      {selectedReview && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl overflow-hidden rounded-sheet border border-border bg-white shadow-modal">
            <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.08em] text-action">
                  {selectedReview.owner_reply
                    ? 'Editar respuesta'
                    : 'Responder reseña'}
                </p>

                <h2 className="mt-1 text-xl font-bold text-ink">
                  {getDisplayName(
                    selectedReview
                  )}
                </h2>
              </div>

              <button
                type="button"
                disabled={
                  isSaving
                }
                onClick={() =>
                  setSelectedReview(
                    null
                  )
                }
                className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="rounded-2xl bg-canvas p-4">
                <Stars
                  rating={
                    selectedReview.rating
                  }
                />

                {selectedReview.title && (
                  <p className="mt-3 text-sm font-bold text-ink">
                    {
                      selectedReview.title
                    }
                  </p>
                )}

                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                  {
                    selectedReview.comment
                  }
                </p>
              </div>

              <label className="mt-5 block text-xs font-bold text-ink">
                Respuesta de {restaurantName}
              </label>

              <textarea
                value={reply}
                onChange={(
                  event
                ) =>
                  setReply(
                    event.target
                      .value
                  )
                }
                rows={7}
                maxLength={2000}
                placeholder="Agradece la visita, responde a sus comentarios o aclara cualquier situación..."
                className="mt-2 w-full resize-none rounded-2xl border border-border bg-canvas p-4 text-sm outline-none transition focus:border-primary/30 focus:bg-white focus:ring-4 focus:ring-primary/[0.06]"
              />

              <div className="mt-2 flex justify-end text-xs text-muted-foreground">
                {reply.length}
                /2000
              </div>

              {errorMessage && (
                <div className="mt-4 rounded-xl border border-danger/25 bg-danger-soft p-3 text-sm text-danger">
                  {
                    errorMessage
                  }
                </div>
              )}
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-border bg-canvas px-6 py-5 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                disabled={
                  isSaving
                }
                onClick={() =>
                  setSelectedReview(
                    null
                  )
                }
                className="rounded-xl"
              >
                Cancelar
              </Button>

              <Button
                type="button"
                disabled={
                  isSaving
                }
                onClick={
                  handleSaveReply
                }
                className="rounded-xl"
              >
                {isSaving ? (
                  <>
                    <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />

                    Guardando...
                  </>
                ) : (
                  <>
                    <MessageSquareText className="mr-2 h-4 w-4" />

                    {selectedReview.owner_reply
                      ? 'Guardar cambios'
                      : 'Publicar respuesta'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ========================================================== */
/* REVIEW                                                     */
/* ========================================================== */

function ReviewCard({
  review,
  deletingReply,
  onReply,
  onDeleteReply,
}: {
  review: Review;
  deletingReply: boolean;
  onReply: () => void;
  onDeleteReply: () => void;
}) {
  const profile =
    getProfile(
      review.profile
    );

  const displayName =
    profile?.full_name?.trim() ||
    profile?.username ||
    'Usuario de GastroNic';

  const initials =
    displayName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(
        (part) =>
          part[0]
      )
      .join('')
      .toUpperCase();

  return (
    <article className="p-5 transition hover:bg-canvas sm:p-6">
      <div className="flex gap-4">
        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 text-xs font-bold text-action">
          {initials ||
            'GT'}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-bold text-ink">
                  {displayName}
                </h3>

                {review.is_verified_visit && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-primary/15 bg-primary/[0.06] px-2 py-1 text-xs font-bold text-action">
                    <ShieldCheck className="h-3 w-3" />

                    Visita verificada
                  </span>
                )}

                {review.status !==
                  'published' && (
                  <span className="rounded-full border border-border bg-slate-50 px-2 py-1 text-xs font-bold text-muted-foreground">
                    {
                      review.status
                    }
                  </span>
                )}
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-3">
                <Stars
                  rating={
                    review.rating
                  }
                />

                <span className="text-xs text-muted-foreground">
                  {formatDate(
                    review.created_at
                  )}
                </span>

                {review.helpful_count >
                  0 && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <ThumbsUp className="h-3 w-3" />

                    {
                      review.helpful_count
                    }{' '}
                    útil
                  </span>
                )}
              </div>
            </div>

            <Button
              type="button"
              size="sm"
              variant={
                review.owner_reply
                  ? 'outline'
                  : 'default'
              }
              onClick={
                onReply
              }
              className="h-9 rounded-xl"
            >
              {review.owner_reply ? (
                <>
                  <Edit3 className="mr-2 h-3.5 w-3.5" />

                  Editar respuesta
                </>
              ) : (
                <>
                  <MessageSquareText className="mr-2 h-3.5 w-3.5" />

                  Responder
                </>
              )}
            </Button>
          </div>

          {review.title && (
            <h4 className="mt-4 font-bold text-ink">
              {review.title}
            </h4>
          )}

          <p className="mt-2 whitespace-pre-line text-sm leading-6 text-muted-foreground">
            {review.comment}
          </p>

          {review.owner_reply && (
            <div className="mt-5 rounded-card border border-primary/10 bg-primary/[0.035] p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-action text-white">
                  <MessageSquareText className="h-3.5 w-3.5" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs font-bold text-ink">
                      Respuesta del restaurante
                    </p>

                    {review.owner_replied_at && (
                      <span className="text-xs text-muted-foreground">
                        {formatDate(
                          review.owner_replied_at
                        )}
                      </span>
                    )}
                  </div>

                  <p className="mt-2 whitespace-pre-line text-xs leading-5 text-muted-foreground">
                    {
                      review.owner_reply
                    }
                  </p>

                  <button
                    type="button"
                    disabled={
                      deletingReply
                    }
                    onClick={
                      onDeleteReply
                    }
                    className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-danger hover:underline disabled:opacity-50"
                  >
                    {deletingReply ? (
                      <LoaderCircle className="h-3 w-3 animate-spin" />
                    ) : (
                      <Trash2 className="h-3 w-3" />
                    )}

                    Eliminar respuesta
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

/* ========================================================== */
/* SMALL COMPONENTS                                           */
/* ========================================================== */

function Stars({
  rating,
}: {
  rating: number;
}) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(
        (star) => (
          <Star
            key={star}
            className={`h-3.5 w-3.5 ${
              star <=
              Math.round(
                rating
              )
                ? 'fill-amber-400 text-amber-400'
                : 'fill-slate-200 text-slate-200'
            }`}
          />
        )
      )}
    </div>
  );
}

function MiniMetric({
  value,
  label,
}: {
  value: number;
  label: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.07] px-3 py-3 text-center">
      <p className="text-lg font-bold">
        {value}
      </p>

      <p className="mt-1 text-xs font-semibold uppercase tracking-[0.08em] text-white/35">
        {label}
      </p>
    </div>
  );
}

function FilterButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={
        onClick
      }
      className={`rounded-full px-4 py-2 text-xs font-bold transition ${
        active
          ? 'bg-action text-white'
          : 'border border-border bg-canvas text-muted-foreground hover:border-primary/20 hover:text-action'
      }`}
    >
      {label}
    </button>
  );
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

function getDisplayName(
  review: Review
) {
  const profile =
    getProfile(
      review.profile
    );

  return (
    profile?.full_name?.trim() ||
    profile?.username ||
    'Usuario de GastroNic'
  );
}

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