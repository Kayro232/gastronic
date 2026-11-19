'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, Heart, LoaderCircle, Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { RestaurantExploreCard } from '@/components/explore/restaurant-explore-card';
import { createClient } from '@/lib/supabase/client';
import type { ExploreRestaurant } from '@/app/explore/page';

const supabase = createClient();

interface FavoriteRow {
  created_at: string;
  restaurant: ExploreRestaurant | ExploreRestaurant[] | null;
}

function getRestaurant(
  value: ExploreRestaurant | ExploreRestaurant[] | null
): ExploreRestaurant | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

export function FavoriteRestaurants() {
  const [restaurants, setRestaurants] = useState<ExploreRestaurant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    async function loadFavorites() {
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
        .from('favorites')
        .select(`
          created_at,
          restaurant:restaurants!inner (
            id,
            name,
            slug,
            short_description,
            price_level,
            is_verified,
            is_featured,
            average_rating,
            reviews_count,
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
                slug
              )
            )
          )
        `)
        .eq('user_id', user.id)
        .eq('restaurant.status', 'approved')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error cargando favoritos:', error);
        setErrorMessage('No se pudieron cargar tus favoritos.');
        setRestaurants([]);
        setIsLoading(false);
        return;
      }

      const rows = (data ?? []) as unknown as FavoriteRow[];
      setRestaurants(
        rows
          .map((item) => getRestaurant(item.restaurant))
          .filter((item): item is ExploreRestaurant => item !== null)
      );
      setIsLoading(false);
    }

    loadFavorites();
  }, []);

  if (isLoading) return <ActivityLoading text="Cargando tus favoritos..." />;
  if (errorMessage) return <ActivityError message={errorMessage} />;

  if (restaurants.length === 0) {
    return (
      <EmptyState
        icon={Heart}
        title="Aún no tienes favoritos"
        description="Guarda restaurantes que te interesen para encontrarlos fácilmente más adelante."
        action={
          <Button asChild className="mt-5 h-10 rounded-xl px-5 font-bold">
            <Link href="/explore">
              <Search className="mr-2 h-4 w-4" />
              Explorar restaurantes
            </Link>
          </Button>
        }
      />
    );
  }

  return (
    <div>
      <ActivityHeading
        icon={Heart}
        eyebrow="Tu colección"
        title="Restaurantes favoritos"
        description={`Tienes ${restaurants.length} ${
          restaurants.length === 1 ? 'restaurante guardado' : 'restaurantes guardados'
        }.`}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3 xl:gap-6">
        {restaurants.map((restaurant) => (
          <RestaurantExploreCard key={restaurant.id} restaurant={restaurant} />
        ))}
      </div>
    </div>
  );
}

function ActivityLoading({ text }: { text: string }) {
  return (
    <div className="flex min-h-[240px] items-center justify-center rounded-card border border-border/70 bg-white">
      <LoaderCircle className="mr-3 h-5 w-5 animate-spin text-action" />
      <span className="text-sm text-muted-foreground">{text}</span>
    </div>
  );
}

function ActivityError({ message }: { message: string }) {
  return (
    <div className="flex min-h-[220px] items-center justify-center rounded-card border border-danger/25 bg-red-50/60 p-6 text-center">
      <div>
        <AlertCircle className="mx-auto h-6 w-6 text-danger" />
        <p className="mt-3 text-sm text-danger">{message}</p>
      </div>
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[250px] items-center justify-center rounded-card border border-dashed border-border bg-white px-6 py-10 text-center sm:min-h-[300px] sm:rounded-sheet">
      <div className="max-w-md">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
          <Icon className="h-6 w-6 text-action" />
        </div>
        <h3 className="mt-5 text-lg font-bold text-ink">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
        {action}
      </div>
    </div>
  );
}

function ActivityHeading({
  icon: Icon,
  eyebrow,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-5 sm:mb-7">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.08em] text-action sm:text-xs">
        <Icon className="h-3.5 w-3.5" />
        {eyebrow}
      </div>
      <h3 className="mt-1.5 text-xl font-bold tracking-[-0.025em] text-ink sm:text-2xl">
        {title}
      </h3>
      <p className="mt-1.5 text-xs text-muted-foreground sm:text-sm">{description}</p>
    </div>
  );
}