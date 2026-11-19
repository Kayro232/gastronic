'use client';

import {
  useMemo,
  useState,
} from 'react';

import Link from 'next/link';

import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Edit3,
  LoaderCircle,
  MessageSquareText,
  Search,
  ShieldCheck,
  Star,
  Store,
  ThumbsUp,
  Trash2,
  X,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { getUserFacingErrorMessage } from '@/lib/supabase/errors';

const supabase =
  createClient();

/* ========================================================== */
/* TYPES                                                      */
/* ========================================================== */

export interface OwnerReviewRestaurant {
  id: string;
  name: string;
  status: string;
  average_rating: number;
  reviews_count: number;
}

interface ReviewProfile {
  id: string;
  full_name: string;
  username: string | null;
  avatar_path: string | null;
}

export interface OwnerReview {
  id: string;
  restaurant_id: string;
  user_id: string;

  rating: number;

  title:
    | string
    | null;

  comment: string;

  status: string;

  is_verified_visit:
    boolean;

  helpful_count:
    number;

  owner_reply:
    | string
    | null;

  owner_replied_at:
    | string
    | null;

  created_at: string;
  updated_at: string;

  profile:
    | ReviewProfile
    | null;
}

interface Props {
  restaurants:
    OwnerReviewRestaurant[];

  initialReviews:
    OwnerReview[];
}

type ReplyFilter =
  | 'all'
  | 'unanswered'
  | 'answered'
  | 'verified';

/* ========================================================== */
/* COMPONENT                                                  */
/* ========================================================== */

export function OwnerReviewsManager({
  restaurants,
  initialReviews,
}: Props) {
  const [
    reviews,
    setReviews,
  ] = useState(
    initialReviews
  );

  const [
    selectedRestaurant,
    setSelectedRestaurant,
  ] = useState('all');

  const [
    selectedReplyFilter,
    setSelectedReplyFilter,
  ] =
    useState<ReplyFilter>(
      'all'
    );

  const [
    selectedRating,
    setSelectedRating,
  ] = useState('all');

  const [
    search,
    setSearch,
  ] = useState('');

  const [
    selectedReview,
    setSelectedReview,
  ] = useState<
    OwnerReview | null
  >(null);

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

  /* ======================================================== */
  /* PUBLISHED                                                */
  /* ======================================================== */

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

  const unansweredCount =
    publishedReviews.filter(
      (review) =>
        !review.owner_reply
    ).length;

  const answeredCount =
    publishedReviews.filter(
      (review) =>
        Boolean(
          review.owner_reply
        )
    ).length;

  const verifiedCount =
    publishedReviews.filter(
      (review) =>
        review.is_verified_visit
    ).length;

  const averageRating =
    publishedReviews.length >
    0
      ? publishedReviews.reduce(
          (
            total,
            review
          ) =>
            total +
            review.rating,
          0
        ) /
        publishedReviews.length
      : 0;

  /* ======================================================== */
  /* DISTRIBUTION                                             */
  /* ======================================================== */

  const distribution =
    [5, 4, 3, 2, 1].map(
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

  /* ======================================================== */
  /* RESTAURANT PERFORMANCE                                   */
  /* ======================================================== */

  const restaurantRanking =
    useMemo(() => {
      return restaurants
        .map(
          (restaurant) => {
            const restaurantReviews =
              publishedReviews.filter(
                (review) =>
                  review.restaurant_id ===
                  restaurant.id
              );

            const rating =
              restaurantReviews.length >
              0
                ? restaurantReviews.reduce(
                    (
                      total,
                      review
                    ) =>
                      total +
                      review.rating,
                    0
                  ) /
                  restaurantReviews.length
                : 0;

            return {
              ...restaurant,

              rating,

              total:
                restaurantReviews.length,

              unanswered:
                restaurantReviews.filter(
                  (review) =>
                    !review.owner_reply
                ).length,
            };
          }
        )
        .sort(
          (a, b) =>
            b.rating -
            a.rating
        );
    }, [
      restaurants,
      publishedReviews,
    ]);

  /* ======================================================== */
  /* FILTER                                                   */
  /* ======================================================== */

  const filteredReviews =
    useMemo(() => {
      const term =
        search
          .trim()
          .toLowerCase();

      return reviews.filter(
        (review) => {
          const restaurant =
            restaurants.find(
              (item) =>
                item.id ===
                review.restaurant_id
            );

          const restaurantMatch =
            selectedRestaurant ===
              'all' ||
            review.restaurant_id ===
              selectedRestaurant;

          const ratingMatch =
            selectedRating ===
              'all' ||
            review.rating ===
              Number(
                selectedRating
              );

          const replyMatch =
            selectedReplyFilter ===
              'all' ||
            (
              selectedReplyFilter ===
                'unanswered' &&
              !review.owner_reply
            ) ||
            (
              selectedReplyFilter ===
                'answered' &&
              Boolean(
                review.owner_reply
              )
            ) ||
            (
              selectedReplyFilter ===
                'verified' &&
              review.is_verified_visit
            );

          const searchMatch =
            !term ||
            review.comment
              .toLowerCase()
              .includes(term) ||
            review.title
              ?.toLowerCase()
              .includes(term) ||
            review.profile?.full_name
              ?.toLowerCase()
              .includes(term) ||
            review.profile?.username
              ?.toLowerCase()
              .includes(term) ||
            restaurant?.name
              .toLowerCase()
              .includes(term);

          return (
            restaurantMatch &&
            ratingMatch &&
            replyMatch &&
            searchMatch
          );
        }
      );
    }, [
      reviews,
      restaurants,
      selectedRestaurant,
      selectedRating,
      selectedReplyFilter,
      search,
    ]);

  /* ======================================================== */
  /* REPLY                                                    */
  /* ======================================================== */

  function openReply(
    review:
      OwnerReview
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

  async function saveReply() {
    if (
      !selectedReview
    ) {
      return;
    }

    const cleanReply =
      reply.trim();

    if (
      cleanReply.length <
      2
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
          getUserFacingErrorMessage(error, 'No se pudo publicar la respuesta.')
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

  async function deleteReply(
    review:
      OwnerReview
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
        'La respuesta fue eliminada.'
      );
    } finally {
      setDeletingReplyId(
        null
      );
    }
  }

  /* ======================================================== */
  /* UI                                                       */
  /* ======================================================== */

  return (
    <div className="space-y-6">
      {/* ====================================================== */}
      {/* HERO                                                   */}
      {/* ====================================================== */}

      <section className="relative overflow-hidden rounded-sheet bg-ink p-6 text-white shadow-overlay sm:p-8">

        <div className="relative grid gap-8 xl:grid-cols-[minmax(0,1fr)_420px] xl:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-white/35">
              Reputación general
            </p>

            <div className="mt-3 flex items-end gap-4">
              <p className="text-5xl font-bold tracking-[-0.06em]">
                {averageRating > 0
                  ? averageRating.toFixed(
                      1
                    )
                  : '—'}
              </p>

              <div className="pb-1">
                <Stars
                  rating={
                    averageRating
                  }
                  dark
                />

                <p className="mt-1 text-xs text-white/40">
                  {
                    publishedReviews.length
                  }{' '}
                  reseñas publicadas
                </p>
              </div>
            </div>

            <p className="mt-5 max-w-2xl text-sm leading-6 text-white/50">
              Una visión consolidada de cómo perciben los clientes todos tus
              restaurantes.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <HeroMetric
              value={
                unansweredCount
              }
              label="Sin responder"
              attention={
                unansweredCount >
                0
              }
            />

            <HeroMetric
              value={
                answeredCount
              }
              label="Respondidas"
            />

            <HeroMetric
              value={
                verifiedCount
              }
              label="Verificadas"
            />
          </div>
        </div>
      </section>

      {/* ====================================================== */}
      {/* OVERVIEW                                               */}
      {/* ====================================================== */}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_390px]">
        {/* DISTRIBUTION */}

        <section className="rounded-card border border-border/70 bg-white p-6 shadow-none">
          <p className="text-xs font-bold uppercase tracking-[0.08em] text-action">
            Distribución
          </p>

          <h2 className="mt-1 text-lg font-bold text-ink">
            Calificaciones
          </h2>

          <div className="mt-6 space-y-4">
            {distribution.map(
              (item) => {
                const percentage =
                  publishedReviews.length >
                  0
                    ? (
                        item.count /
                        publishedReviews.length
                      ) *
                      100
                    : 0;

                return (
                  <button
                    key={
                      item.rating
                    }
                    type="button"
                    onClick={() =>
                      setSelectedRating(
                        selectedRating ===
                          String(
                            item.rating
                          )
                          ? 'all'
                          : String(
                              item.rating
                            )
                      )
                    }
                    className="grid w-full grid-cols-[45px_minmax(0,1fr)_38px] items-center gap-3 text-left"
                  >
                    <span className="flex items-center gap-1 text-xs font-bold text-ink">
                      {
                        item.rating
                      }

                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    </span>

                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-amber-400 transition-all"
                        style={{
                          width: `${percentage}%`,
                        }}
                      />
                    </div>

                    <span className="text-right text-xs font-bold text-muted-foreground">
                      {
                        item.count
                      }
                    </span>
                  </button>
                );
              }
            )}
          </div>
        </section>

        {/* RESTAURANTS */}

        <section className="overflow-hidden rounded-card border border-border/70 bg-white shadow-none">
          <div className="border-b border-border/60 px-5 py-5">
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-action">
              Portafolio
            </p>

            <h2 className="mt-1 text-lg font-bold text-ink">
              Reputación por restaurante
            </h2>
          </div>

          {restaurantRanking.length ===
          0 ? (
            <div className="p-6 text-sm text-muted-foreground">
              No hay restaurantes registrados.
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {restaurantRanking
                .slice(0, 5)
                .map(
                  (
                    restaurant
                  ) => (
                    <Link
                      key={
                        restaurant.id
                      }
                      href={`/owner/restaurants/${restaurant.id}/reviews`}
                      className="group flex items-center gap-3 px-5 py-4 transition hover:bg-canvas"
                    >
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary/[0.07] text-action">
                        <Store className="h-4 w-4" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-bold text-ink">
                          {
                            restaurant.name
                          }
                        </p>

                        <div className="mt-1 flex items-center gap-2">
                          <span className="flex items-center gap-1 text-xs font-bold text-warning">
                            <Star className="h-3 w-3 fill-current" />

                            {restaurant.rating >
                            0
                              ? restaurant.rating.toFixed(
                                  1
                                )
                              : '—'}
                          </span>

                          <span className="text-xs text-muted-foreground">
                            {
                              restaurant.total
                            }{' '}
                            reseñas
                          </span>
                        </div>
                      </div>

                      {restaurant.unanswered >
                        0 && (
                        <span className="rounded-full bg-warning-soft px-2 py-1 text-xs font-bold text-warning">
                          {
                            restaurant.unanswered
                          }{' '}
                          pendientes
                        </span>
                      )}

                      <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-action" />
                    </Link>
                  )
                )}
            </div>
          )}
        </section>
      </div>

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
      {/* REVIEW PANEL                                           */}
      {/* ====================================================== */}

      <section className="overflow-hidden rounded-sheet border border-border/70 bg-white shadow-none">
        <div className="border-b border-border/60 p-5 sm:p-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.08em] text-action">
                  Conversaciones
                </p>

                <h2 className="mt-1 text-lg font-bold text-ink">
                  Todas las reseñas
                </h2>

                <p className="mt-1 text-xs text-muted-foreground">
                  {
                    filteredReviews.length
                  }{' '}
                  {filteredReviews.length ===
                  1
                    ? 'resultado'
                    : 'resultados'}
                </p>
              </div>

              <div className="relative w-full xl:w-80">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                <input
                  value={
                    search
                  }
                  onChange={(
                    event
                  ) =>
                    setSearch(
                      event.target
                        .value
                    )
                  }
                  placeholder="Usuario, comentario o restaurante..."
                  className="h-11 w-full rounded-xl border border-border bg-canvas pl-10 pr-4 text-sm outline-none transition focus:border-primary/30 focus:bg-white focus:ring-4 focus:ring-primary/[0.06]"
                />
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <SelectField
                value={
                  selectedRestaurant
                }
                onChange={
                  setSelectedRestaurant
                }
              >
                <option value="all">
                  Todos los restaurantes
                </option>

                {restaurants.map(
                  (
                    restaurant
                  ) => (
                    <option
                      key={
                        restaurant.id
                      }
                      value={
                        restaurant.id
                      }
                    >
                      {
                        restaurant.name
                      }
                    </option>
                  )
                )}
              </SelectField>

              <SelectField
                value={
                  selectedReplyFilter
                }
                onChange={(
                  value
                ) =>
                  setSelectedReplyFilter(
                    value as ReplyFilter
                  )
                }
              >
                <option value="all">
                  Todas las reseñas
                </option>

                <option value="unanswered">
                  Sin responder
                </option>

                <option value="answered">
                  Respondidas
                </option>

                <option value="verified">
                  Visita verificada
                </option>
              </SelectField>

              <SelectField
                value={
                  selectedRating
                }
                onChange={
                  setSelectedRating
                }
              >
                <option value="all">
                  Todas las estrellas
                </option>

                <option value="5">
                  5 estrellas
                </option>

                <option value="4">
                  4 estrellas
                </option>

                <option value="3">
                  3 estrellas
                </option>

                <option value="2">
                  2 estrellas
                </option>

                <option value="1">
                  1 estrella
                </option>
              </SelectField>
            </div>
          </div>
        </div>

        <div className="divide-y divide-border/60">
          {filteredReviews.length ===
          0 ? (
            <div className="flex min-h-[340px] items-center justify-center p-8 text-center">
              <div>
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/[0.07] text-action">
                  <MessageSquareText className="h-5 w-5" />
                </div>

                <h3 className="mt-4 text-sm font-bold text-ink">
                  No encontramos reseñas
                </h3>

                <p className="mt-2 max-w-sm text-xs leading-5 text-muted-foreground">
                  Ajusta los filtros o espera nuevas opiniones de tus clientes.
                </p>
              </div>
            </div>
          ) : (
            filteredReviews.map(
              (review) => (
                <ReviewRow
                  key={
                    review.id
                  }
                  review={
                    review
                  }
                  restaurant={
                    restaurants.find(
                      (
                        restaurant
                      ) =>
                        restaurant.id ===
                        review.restaurant_id
                    ) ??
                    null
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
                    deleteReply(
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
          <div className="w-full max-w-xl overflow-hidden rounded-sheet border border-border bg-white shadow-overlay">
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

                <p className="mt-1 text-xs text-muted-foreground">
                  {
                    restaurants.find(
                      (
                        restaurant
                      ) =>
                        restaurant.id ===
                        selectedReview.restaurant_id
                    )?.name
                  }
                </p>
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
                Respuesta del restaurante
              </label>

              <textarea
                value={
                  reply
                }
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
                  saveReply
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
/* REVIEW ROW                                                 */
/* ========================================================== */

function ReviewRow({
  review,
  restaurant,
  deletingReply,
  onReply,
  onDeleteReply,
}: {
  review:
    OwnerReview;

  restaurant:
    | OwnerReviewRestaurant
    | null;

  deletingReply:
    boolean;

  onReply:
    () => void;

  onDeleteReply:
    () => void;
}) {
  const displayName =
    getDisplayName(
      review
    );

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
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-bold text-ink">
                  {displayName}
                </h3>

                {review.is_verified_visit && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-primary/15 bg-primary/[0.05] px-2 py-1 text-xs font-bold text-action">
                    <ShieldCheck className="h-3 w-3" />

                    Visita verificada
                  </span>
                )}

                {restaurant && (
                  <Link
                    href={`/owner/restaurants/${restaurant.id}`}
                    className="inline-flex items-center gap-1 rounded-full border border-border bg-white px-2 py-1 text-xs font-bold text-muted-foreground transition hover:border-primary/20 hover:text-action"
                  >
                    <Store className="h-3 w-3" />

                    {
                      restaurant.name
                    }
                  </Link>
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
  dark = false,
}: {
  rating: number;
  dark?: boolean;
}) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(
        (star) => (
          <Star
            key={
              star
            }
            className={`h-3.5 w-3.5 ${
              star <=
              Math.round(
                rating
              )
                ? 'fill-amber-400 text-amber-400'
                : dark
                  ? 'fill-white/10 text-white/10'
                  : 'fill-slate-200 text-slate-200'
            }`}
          />
        )
      )}
    </div>
  );
}

function HeroMetric({
  value,
  label,
  attention = false,
}: {
  value: number;
  label: string;
  attention?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border px-4 py-4 text-center ${
        attention
          ? 'border-amber-400/20 bg-amber-400/[0.08]'
          : 'border-white/10 bg-white/[0.06]'
      }`}
    >
      <p
        className={`text-2xl font-bold ${
          attention
            ? 'text-secondary'
            : 'text-white'
        }`}
      >
        {value}
      </p>

      <p className="mt-1 text-xs font-bold uppercase tracking-[0.09em] text-white/35">
        {label}
      </p>
    </div>
  );
}

function SelectField({
  value,
  onChange,
  children,
}: {
  value: string;

  onChange:
    (
      value: string
    ) => void;

  children:
    React.ReactNode;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(
          event
        ) =>
          onChange(
            event.target
              .value
          )
        }
        className="h-11 w-full appearance-none rounded-xl border border-border bg-canvas px-4 pr-10 text-xs font-semibold text-ink outline-none transition focus:border-primary/30 focus:bg-white focus:ring-4 focus:ring-primary/[0.06]"
      >
        {children}
      </select>

      <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
}

/* ========================================================== */
/* HELPERS                                                    */
/* ========================================================== */

function getDisplayName(
  review:
    OwnerReview
) {
  return (
    review.profile?.full_name?.trim() ||
    review.profile?.username ||
    'Usuario de GastroNic'
  );
}

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