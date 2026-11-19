import {
  BadgeCheck,
  Banknote,
  ChefHat,
  CircleDollarSign,
  Sparkles,
  UtensilsCrossed,
} from 'lucide-react';

/* ========================================================== */
/* TYPES                                                      */
/* ========================================================== */

interface RestaurantCategory {
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
}

export interface RestaurantInfoData {
  id: string;
  name: string;

  description:
    | string
    | null;

  short_description:
    | string
    | null;

  price_level: number;

  is_verified: boolean;

  estimated_price_min?:
    | number
    | null;

  estimated_price_max?:
    | number
    | null;

  categories?:
    RestaurantCategory[];
}

interface RestaurantInfoProps {
  restaurant:
    RestaurantInfoData;
}

/* ========================================================== */
/* PRICE                                                      */
/* ========================================================== */

const priceLabels:
  Record<
    number,
    string
  > = {
    1: 'Económico',
    2: 'Moderado',
    3: 'Costoso',
    4: 'Premium',
  };

function formatEstimatedPrice(
  min:
    | number
    | null
    | undefined,

  max:
    | number
    | null
    | undefined
) {
  if (
    min !==
      null &&
    min !==
      undefined &&
    max !==
      null &&
    max !==
      undefined
  ) {
    return `C$ ${Number(
      min
    ).toLocaleString(
      'es-NI'
    )} – C$ ${Number(
      max
    ).toLocaleString(
      'es-NI'
    )}`;
  }

  if (
    min !==
      null &&
    min !==
      undefined
  ) {
    return `Desde C$ ${Number(
      min
    ).toLocaleString(
      'es-NI'
    )}`;
  }

  if (
    max !==
      null &&
    max !==
      undefined
  ) {
    return `Hasta C$ ${Number(
      max
    ).toLocaleString(
      'es-NI'
    )}`;
  }

  return null;
}

/* ========================================================== */
/* COMPONENT                                                  */
/* ========================================================== */

export function RestaurantInfo({
  restaurant,
}: RestaurantInfoProps) {
  const categories =
    restaurant.categories
      ?.map(
        (item) =>
          Array.isArray(
            item.category
          )
            ? item.category[0]
            : item.category
      )
      .filter(
        (
          category
        ): category is {
          id: string;
          name: string;
          slug: string;
        } =>
          Boolean(
            category
          )
      ) ??
    [];

  const description =
    restaurant.description ??
    restaurant.short_description ??
    'Este restaurante todavía no ha publicado una descripción detallada.';

  const priceLevel =
    Math.min(
      Math.max(
        Number(
          restaurant.price_level ??
            1
        ),
        1
      ),
      4
    );

  const estimatedPrice =
    formatEstimatedPrice(
      restaurant.estimated_price_min,
      restaurant.estimated_price_max
    );

  return (
    <div className="w-full space-y-6 sm:space-y-8">
      {/* ====================================================== */}
      {/* ABOUT                                                  */}
      {/* ====================================================== */}

      <section>
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-action">
              Sobre el lugar
            </p>

            <h2 className="mt-2 text-2xl font-bold tracking-[-0.035em] text-ink sm:text-3xl">
              Conoce{' '}
              {restaurant.name}
            </h2>
          </div>

          {restaurant.is_verified && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/15 bg-primary/[0.06] px-3 py-1.5 text-xs font-bold text-action">
              <BadgeCheck className="h-3.5 w-3.5" />

              Verificado
            </span>
          )}
        </div>

        <p className="max-w-4xl whitespace-pre-line text-[15px] leading-7 text-muted-foreground sm:text-base sm:leading-8">
          {description}
        </p>
      </section>

      {/* ====================================================== */}
      {/* ESSENTIAL DATA                                         */}
      {/* ====================================================== */}

      <section className="grid w-full gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {/* PRICE */}

        <InfoCard
          icon={
            CircleDollarSign
          }
          eyebrow="Nivel de precio"
          title={
            priceLabels[
              priceLevel
            ] ??
            'Moderado'
          }
          description={
            '$'.repeat(
              priceLevel
            )
          }
        />

        {/* ESTIMATED PRICE */}

        <InfoCard
          icon={
            Banknote
          }
          eyebrow="Consumo estimado"
          title={
            estimatedPrice ??
            'No especificado'
          }
          description={
            estimatedPrice
              ? 'Estimado por persona'
              : 'El restaurante aún no ha indicado un rango'
          }
        />

        {/* CATEGORIES */}

        <InfoCard
          icon={
            UtensilsCrossed
          }
          eyebrow="Gastronomía"
          title={
            categories.length >
            0
              ? categories[
                  0
                ].name
              : 'Sin categoría'
          }
          description={
            categories.length >
            1
              ? `+${categories.length - 1} ${
                  categories.length -
                    1 ===
                  1
                    ? 'categoría'
                    : 'categorías'
                }`
              : categories.length ===
                  1
                ? 'Categoría principal'
                : 'No especificada'
          }
        />
      </section>

      {/* ====================================================== */}
      {/* CATEGORIES                                             */}
      {/* ====================================================== */}

      {categories.length >
        0 && (
        <section className="border-t border-border/60 pt-7">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-primary/[0.07] text-action">
              <ChefHat className="h-4 w-4" />
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.08em] text-action">
                Especialidades
              </p>

              <h3 className="mt-1 text-base font-bold text-ink">
                Qué encontrarás en su cocina
              </h3>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {categories.map(
              (
                category
              ) => (
                <span
                  key={
                    category.id
                  }
                  className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-white px-3 py-2 text-xs font-semibold text-ink shadow-none"
                >
                  <Sparkles className="h-3 w-3 text-action" />

                  {
                    category.name
                  }
                </span>
              )
            )}
          </div>
        </section>
      )}

      {/* ====================================================== */}
      {/* EDITORIAL NOTE                                         */}
      {/* ====================================================== */}

      <section className="relative hidden overflow-hidden rounded-card bg-ink px-5 py-6 text-white sm:px-6 md:block">

        <div className="relative max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.08em] text-secondary">
            GastroNic
          </p>

          <h3 className="mt-2 text-lg font-bold tracking-[-0.02em]">
            Información proporcionada por el establecimiento
          </h3>

          <p className="mt-2 text-xs leading-6 text-white/50">
            La descripción, categorías y rango de precios mostrados corresponden
            a la información registrada para este restaurante en GastroNic.
          </p>
        </div>
      </section>
    </div>
  );
}

/* ========================================================== */
/* INFO CARD                                                  */
/* ========================================================== */

function InfoCard({
  icon: Icon,
  eyebrow,
  title,
  description,
}: {
  icon: React.ComponentType<{
    className?: string;
  }>;

  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <article className="group w-full rounded-card border border-border/70 bg-white p-5 shadow-none transition hover:border-primary/15">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/[0.07] text-action transition group-hover:bg-action group-hover:text-white">
        <Icon className="h-4 w-4" />
      </div>

      <p className="mt-5 text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">
        {eyebrow}
      </p>

      <p className="mt-1.5 text-sm font-bold leading-5 text-ink">
        {title}
      </p>

      <p className="mt-1 text-xs leading-4 text-muted-foreground">
        {description}
      </p>
    </article>
  );
}