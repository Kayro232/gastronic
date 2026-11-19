'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  BadgeCheck,
  LoaderCircle,
  MessageSquareText,
  Star,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { StatusBadge } from '@/components/common/status-badge';

const supabase = createClient();

interface RestaurantMini {
  id: string;
  name: string;
}

interface ReviewRow {
  id: string;
  rating: number;
  title: string | null;
  comment: string;
  status: string;
  is_verified_visit: boolean;
  helpful_count: number;
  owner_reply: string | null;
  created_at: string;
  restaurant: RestaurantMini | RestaurantMini[] | null;
}

function unwrap<T>(value: T | T[] | null): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}


export function UserReviews() {
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    async function loadReviews() {
      setIsLoading(true);
      setErrorMessage('');

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        if (userError) console.error('Error obteniendo usuario:', userError);
        setErrorMessage('No se pudo obtener tu sesión.');
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('reviews')
        .select(`
          id,
          rating,
          title,
          comment,
          status,
          is_verified_visit,
          helpful_count,
          owner_reply,
          created_at,
          restaurant:restaurants!inner (
            id,
            name
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error cargando reseñas del usuario:', error);
        setErrorMessage('No se pudieron cargar tus reseñas.');
        setReviews([]);
      } else {
        setReviews((data ?? []) as unknown as ReviewRow[]);
      }

      setIsLoading(false);
    }

    loadReviews();
  }, []);

  if (isLoading) return <StatusBox loading text="Cargando tus reseñas..." />;
  if (errorMessage) return <StatusBox error text={errorMessage} />;

  if (reviews.length === 0) {
    return (
      <div className="flex min-h-[260px] items-center justify-center rounded-card border border-dashed border-border bg-white px-6 py-10 text-center sm:min-h-[300px] sm:rounded-sheet">
        <div className="max-w-md">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <MessageSquareText className="h-6 w-6 text-action" />
          </div>
          <h3 className="mt-5 text-lg font-bold text-ink">Todavía no has escrito reseñas</h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">Después de visitar un restaurante podrás compartir tu experiencia y verla aquí.</p>
          <Button asChild className="mt-5 h-10 rounded-xl px-5 font-bold"><Link href="/explore">Explorar restaurantes</Link></Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-5 sm:mb-7">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.08em] text-action sm:text-xs">
          <MessageSquareText className="h-3.5 w-3.5" /> Tu voz
        </div>
        <h3 className="mt-1.5 text-xl font-bold tracking-[-0.025em] text-ink sm:text-2xl">Tus reseñas</h3>
        <p className="mt-1.5 text-xs text-muted-foreground sm:text-sm">Has compartido {reviews.length} {reviews.length === 1 ? 'reseña' : 'reseñas'}.</p>
      </div>

      <div className="space-y-3">
        {reviews.map((review) => {
          const restaurant = unwrap(review.restaurant);
          if (!restaurant) return null;

          return (
            <article key={review.id} className="rounded-card border border-border/70 bg-white p-4 shadow-sm sm:p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="font-bold text-ink">{restaurant.name}</h4>
                    <StatusBadge status={review.status} kind="review" size="sm" />
                    {review.is_verified_visit && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-action">
                        <BadgeCheck className="h-3 w-3" /> Visita verificada
                      </span>
                    )}
                  </div>

                  <div className="mt-2 flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className={`h-4 w-4 ${star <= review.rating ? 'fill-secondary text-secondary' : 'text-border'}`} />
                    ))}
                  </div>

                  {review.title && <h5 className="mt-3 text-sm font-bold text-ink">{review.title}</h5>}
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{review.comment}</p>

                  {review.owner_reply && (
                    <div className="mt-4 rounded-xl border border-primary/10 bg-primary/[0.035] px-3.5 py-3">
                      <p className="text-xs font-bold uppercase tracking-[0.08em] text-action">Respuesta del restaurante</p>
                      <p className="mt-1.5 text-xs leading-5 text-muted-foreground">{review.owner_reply}</p>
                    </div>
                  )}

                  <div className="mt-4 flex flex-wrap gap-3 text-xs font-semibold text-muted-foreground">
                    <span>{new Intl.DateTimeFormat('es-NI', { dateStyle: 'medium', timeZone: 'America/Managua' }).format(new Date(review.created_at))}</span>
                    {review.helpful_count > 0 && <span>{review.helpful_count} {review.helpful_count === 1 ? 'persona la encontró útil' : 'personas la encontraron útil'}</span>}
                  </div>
                </div>

                <Button asChild variant="outline" className="h-10 flex-shrink-0 rounded-xl font-bold">
                  <Link href={`/restaurant/${restaurant.id}`}>Ver restaurante</Link>
                </Button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function StatusBox({ loading, error, text }: { loading?: boolean; error?: boolean; text: string }) {
  return (
    <div className={`flex min-h-[240px] items-center justify-center rounded-card border p-6 ${error ? 'border-danger/25 bg-red-50/60 text-danger' : 'border-border/70 bg-white text-muted-foreground'}`}>
      {loading ? <LoaderCircle className="mr-3 h-5 w-5 animate-spin text-action" /> : <AlertCircle className="mr-3 h-5 w-5" />}
      <span className="text-sm">{text}</span>
    </div>
  );
}