import Link from 'next/link';

import {
  BadgeCheck,
  Clock3,
  MapPin,
  Sparkles,
  Star,
} from 'lucide-react';

import { FavoriteButton } from '@/components/favorites/favorite-button';
import { cn } from '@/lib/utils';

/*
 * GastroNic DS · Tarjeta de restaurante (etapa 2)
 *
 * Única presentación visual de un restaurante en listados.
 * Es solo de presentación: cada contenedor (inicio, explorar,
 * favoritos, perfil) sigue resolviendo sus datos como antes y
 * le pasa los valores ya calculados.
 *
 * Reglas:
 * - Toda la tarjeta es un solo enlace (patrón "stretched link"),
 *   el botón de favorito queda por encima y es independiente.
 * - Máximo una insignia sobre la foto (Destacado). "Verificado"
 *   va como ícono junto al nombre.
 * - La calificación siempre en el mismo lugar; sin reseñas se
 *   muestra "Nuevo" en vez de "0.0".
 * - El estado de apertura siempre lleva texto, no solo color.
 * - Se usa <img> y no next/image: las fotos pueden venir de una
 *   URL externa cargada por el propietario, que next/image
 *   rechazaría si el dominio no está en la lista permitida.
 */

export interface RestaurantCardChip {
  label: string;
  kind?: 'reason' | 'distance';
}

export interface RestaurantCardViewProps {
  id: string;
  name: string;
  imageUrl?: string | null;

  rating?: number | null;
  reviewCount?: number | null;

  priceLabel?: string | null;
  cuisine?: string | null;
  location?: string | null;
  description?: string | null;

  verified?: boolean;
  featured?: boolean;

  /* undefined: no se muestra el estado de apertura */
  isOpenNow?: boolean | null;

  chips?: RestaurantCardChip[];

  className?: string;
}

function formatReviews(count: number) {
  return `${count} ${count === 1 ? 'reseña' : 'reseñas'}`;
}

export function RestaurantCardView({
  id,
  name,
  imageUrl,
  rating,
  reviewCount,
  priceLabel,
  cuisine,
  location,
  description,
  verified = false,
  featured = false,
  isOpenNow,
  chips = [],
  className,
}: RestaurantCardViewProps) {
  const href = `/restaurant/${id}`;

  const safeRating = Math.min(Math.max(Number(rating) || 0, 0), 5);
  const safeReviews = Math.max(Number(reviewCount) || 0, 0);
  const hasRating = safeRating > 0;

  const meta = [cuisine, location].filter(Boolean).join(' · ');

  return (
    <article
      className={cn(
        'group relative flex h-full flex-col overflow-hidden rounded-card border border-line bg-surface',
        'transition-[border-color,box-shadow] duration-200 ease-(--ease-standard)',
        'hover:border-[#C9D5D2] hover:shadow-raised',
        /* Foco del enlace principal: anillo en toda la tarjeta */
        'has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-action has-[a:focus-visible]:ring-offset-2 has-[a:focus-visible]:ring-offset-background',
        className
      )}
    >
      {/* ================================================== */}
      {/* FOTO                                               */}
      {/* ================================================== */}

      <div className="relative aspect-[4/3] w-full overflow-hidden bg-surface-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl || '/placeholder.svg'}
          alt={`Fotografía de ${name}`}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover transition-transform duration-300 ease-(--ease-standard) motion-safe:group-hover:scale-[1.03]"
        />

        {featured && (
          <span className="pointer-events-none absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-brand-maiz px-2.5 py-1 text-xs font-semibold text-ink shadow-sm">
            <Sparkles className="size-3.5" aria-hidden="true" />
            Destacado
          </span>
        )}

        <FavoriteButton
          restaurantId={id}
          className="absolute right-2 top-2 z-10 size-11 rounded-full bg-white/95 text-ink shadow-sm hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action"
          iconClassName="size-5"
        />
      </div>

      {/* ================================================== */}
      {/* CONTENIDO                                          */}
      {/* ================================================== */}

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="flex min-w-0 items-center gap-1.5 text-[17px] font-semibold leading-snug text-ink">
            {/*
             * Enlace principal. Su ::after cubre toda la tarjeta
             * ("stretched link"), así que no hay elementos
             * interactivos anidados: el botón de favorito es un
             * hermano posicionado por encima (z-10).
             */}
            <Link
              href={href}
              className="truncate after:absolute after:inset-0 after:z-0 after:content-[''] focus-visible:outline-none"
            >
              {name}
            </Link>

            {verified && (
              <>
                <BadgeCheck
                  className="size-[18px] flex-shrink-0 text-action"
                  aria-hidden="true"
                />
                <span className="sr-only">(verificado)</span>
              </>
            )}
          </h3>

          {hasRating ? (
            <p className="inline-flex flex-shrink-0 items-center gap-1 pt-0.5 text-sm font-semibold tabular-nums text-ink">
              <Star className="size-4 fill-brand-maiz text-brand-maiz" aria-hidden="true" />
              <span className="sr-only">Calificación</span>
              {safeRating.toFixed(1)}
              <span className="sr-only"> de 5,</span>
              <span className="font-normal text-ink-muted">
                <span aria-hidden="true">({safeReviews})</span>
                <span className="sr-only">{formatReviews(safeReviews)}</span>
              </span>
            </p>
          ) : (
            <span className="flex-shrink-0 rounded-full bg-action-soft px-2 py-0.5 text-xs font-semibold text-action">
              Nuevo
            </span>
          )}
        </div>

        {meta && (
          <p className="mt-1 flex min-w-0 items-center gap-1.5 text-sm text-ink-muted">
            <MapPin className="size-3.5 flex-shrink-0 text-brand-teal" aria-hidden="true" />
            <span className="truncate">{meta}</span>
          </p>
        )}

        {description && (
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-ink-muted">
            {description}
          </p>
        )}

        {chips.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Por qué te lo recomendamos">
            {chips.map((chip) => (
              <li
                key={`${chip.kind ?? 'reason'}-${chip.label}`}
                className={cn(
                  'inline-flex max-w-full items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium',
                  chip.kind === 'distance'
                    ? 'bg-surface-2 text-ink-muted'
                    : 'bg-action-soft text-action'
                )}
              >
                {chip.kind === 'distance' ? (
                  <MapPin className="size-3 flex-shrink-0" aria-hidden="true" />
                ) : (
                  <Sparkles className="size-3 flex-shrink-0" aria-hidden="true" />
                )}
                <span className="truncate">{chip.label}</span>
              </li>
            ))}
          </ul>
        )}

        {/* Pie: estado de apertura y precio */}
        <div className="mt-auto pt-4">
          <div className="flex items-center justify-between gap-3 border-t border-line pt-3 text-[13px] font-medium">
              {isOpenNow === undefined ? (
                <span className="text-ink-muted">
                  {hasRating || safeReviews > 0 ? formatReviews(safeReviews) : 'Sin reseñas todavía'}
                </span>
              ) : isOpenNow === null ? (
                <span className="inline-flex items-center gap-1.5 text-ink-muted">
                  <Clock3 className="size-3.5" aria-hidden="true" />
                  Horario no disponible
                </span>
              ) : isOpenNow ? (
                <span className="inline-flex items-center gap-1.5 text-success">
                  <span className="size-2 rounded-full bg-success" aria-hidden="true" />
                  Abierto ahora
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-ink-muted">
                  <span className="size-2 rounded-full bg-line-strong" aria-hidden="true" />
                  Cerrado
                </span>
              )}

              {priceLabel && (
                <span className="flex-shrink-0 font-semibold tabular-nums text-ink">
                  <span className="sr-only">Precio: </span>
                  {priceLabel}
                </span>
              )}
          </div>
        </div>
      </div>
    </article>
  );
}
