import { MainLayout } from '@/components/layout/main-layout';
import { ExploreClient } from '@/components/explore/explore-client';
import { DataLoadError } from '@/components/common/data-load-error';
import { createClient } from '@/lib/supabase/server';

export interface ExploreRestaurant {
  id: string;
  name: string;
  slug: string;
  short_description: string | null;
  address: string | null;
  price_level: number;
  is_verified: boolean;
  is_featured: boolean;
  average_rating: number;
  reviews_count: number;
  favorites_count: number;
  visits_count: number;
  published_at: string | null;

  municipality:
    | {
        id: number;
        name: string;
        department:
          | {
              id: number;
              name: string;
            }
          | {
              id: number;
              name: string;
            }[]
          | null;
      }
    | {
        id: number;
        name: string;
        department:
          | {
              id: number;
              name: string;
            }
          | {
              id: number;
              name: string;
            }[]
          | null;
      }[]
    | null;

  images: {
    id: string;
    kind: string;
    storage_path: string | null;
    external_url: string | null;
    alt_text: string | null;
    sort_order: number;
  }[];

  categories: {
    category:
      | {
          id: string;
          name: string;
          slug: string;
        }
      | {
          id: string;
          name: string;
          slug: string;
        }[]
      | null;
  }[];
}

export default async function ExplorePage() {
  const supabase =
    await createClient();

  const {
    data,
    error,
  } = await supabase
    .from('restaurants')
    .select(`
      id,
      name,
      slug,
      short_description,
      address,
      price_level,
      is_verified,
      is_featured,
      average_rating,
      reviews_count,
      favorites_count,
      visits_count,
      published_at,

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
    `)
    .eq(
      'status',
      'approved'
    )
    .order(
      'is_featured',
      {
        ascending: false,
      }
    )
    .order(
      'average_rating',
      {
        ascending: false,
      }
    )
    .order(
      'published_at',
      {
        ascending: false,
        nullsFirst: false,
      }
    );

  if (error) {
    console.error(
      'Error cargando restaurantes para explorar:',
      error
    );

    return (
      <MainLayout>
        <div className="min-h-screen bg-canvas">
          <div className="mx-auto max-w-[1400px] px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
            <DataLoadError
              title="No pudimos cargar los restaurantes"
              description="Ocurrió un problema al consultar los lugares disponibles. No significa que no existan restaurantes publicados. Intenta cargar la información nuevamente."
            />
          </div>
        </div>
      </MainLayout>
    );
  }

  const restaurants =
    (data ??
      []) as unknown as ExploreRestaurant[];

  return (
    <MainLayout>
      <div className="min-h-screen bg-canvas">
        <section className="border-b border-border/60 bg-surface-2">
          <div className="mx-auto max-w-[1400px] px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-action">
              Descubre Nicaragua
            </p>

            <h1 className="mt-3 max-w-3xl text-4xl font-bold tracking-[-0.055em] text-ink sm:text-5xl lg:text-6xl">
              Encuentra tu próximo lugar favorito
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
              Explora restaurantes, sabores y experiencias gastronómicas en
              distintos rincones del país.
            </p>
          </div>
        </section>

        <ExploreClient
          restaurants={
            restaurants
          }
        />
      </div>
    </MainLayout>
  );
}