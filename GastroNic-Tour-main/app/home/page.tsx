'use client';

import {
  Suspense,
  useEffect,
  useState,
} from 'react';

import {
  useSearchParams,
} from 'next/navigation';

import {
  ArrowRight,
  Compass,
  MapPin,
  Route,
  Sparkles,
} from 'lucide-react';

import Link from 'next/link';

import { MainLayout } from '@/components/layout/main-layout';
import { RestaurantFilters } from '@/components/home/restaurant-filters';
import { RestaurantGrid } from '@/components/home/restaurant-grid';
import { InteractiveMap } from '@/components/home/interactive-map';
import { GastroRoutes } from '@/components/home/gastro-routes';
import { GlobalSearch } from '@/components/search/global-search';
import { Button } from '@/components/ui/button';
import { PersonalizedRecommendations } from '@/components/home/personalized-recommendations';
import { UserSavedRoutes } from '@/components/home/user-saved-routes';

function HomeContent() {
  const searchParams =
    useSearchParams();

  const [
    selectedCategoryId,
    setSelectedCategoryId,
  ] =
    useState<
      string | null
    >(null);

  const [
    selectedMunicipalityId,
    setSelectedMunicipalityId,
  ] =
    useState<
      string | null
    >(null);

  const [
    selectedMinPrice,
    setSelectedMinPrice,
  ] =
    useState<
      number | null
    >(null);

  const [
    selectedMaxPrice,
    setSelectedMaxPrice,
  ] =
    useState<
      number | null
    >(null);

  /* ======================================================== */
  /* URL FILTERS                                              */
  /* ======================================================== */

  useEffect(() => {
    const category =
      searchParams.get(
        'category'
      );

    const municipality =
      searchParams.get(
        'municipality'
      );

    /*
     * Importante:
     * asignamos también null cuando el parámetro
     * desaparece para mantener URL y estado sincronizados.
     */
    setSelectedCategoryId(
      category
    );

    setSelectedMunicipalityId(
      municipality
    );

    /*
     * Si entramos desde el buscador global,
     * desplazamos la pantalla hasta los resultados.
     */
    if (
      category ||
      municipality
    ) {
      const timer =
        window.setTimeout(
          () => {
            document
              .getElementById(
                'restaurantes'
              )
              ?.scrollIntoView({
                behavior:
                  'smooth',

                block:
                  'start',
              });
          },
          180
        );

      return () => {
        window.clearTimeout(
          timer
        );
      };
    }
  }, [
    searchParams,
  ]);

  /* ======================================================== */
  /* FILTER HANDLERS                                          */
  /* ======================================================== */

  function handleCategorySelect(
    categoryId:
      | string
      | null
  ) {
    setSelectedCategoryId(
      categoryId
    );
  }

  function handleMunicipalitySelect(
    municipalityId:
      | string
      | null
  ) {
    setSelectedMunicipalityId(
      municipalityId
    );
  }

  function handleBudgetSelect(
    minPrice:
      | number
      | null,

    maxPrice:
      | number
      | null
  ) {
    setSelectedMinPrice(
      minPrice
    );

    setSelectedMaxPrice(
      maxPrice
    );
  }

  function handleClearFilters() {
    setSelectedCategoryId(
      null
    );

    setSelectedMunicipalityId(
      null
    );

    setSelectedMinPrice(
      null
    );

    setSelectedMaxPrice(
      null
    );

    /*
     * Quitamos category / municipality de la URL
     * sin recargar toda la página.
     */
    window.history.replaceState(
      null,
      '',
      '/home'
    );
  }

  /* ======================================================== */
  /* SCROLL                                                   */
  /* ======================================================== */

  function scrollToSection(
    id: string
  ) {
    document
      .getElementById(
        id
      )
      ?.scrollIntoView({
        behavior:
          'smooth',

        block:
          'start',
      });
  }

  /* ======================================================== */
  /* STATE                                                    */
  /* ======================================================== */

  const hasActiveFilters =
    selectedCategoryId !==
    null ||
    selectedMunicipalityId !==
    null ||
    selectedMinPrice !==
    null ||
    selectedMaxPrice !==
    null;

  /* ======================================================== */
  /* RENDER                                                   */
  /* ======================================================== */

  return (
    <MainLayout>
      <div className="bg-canvas">
        {/* ====================================================== */}
        {/* INICIO: búsqueda y accesos directos                    */}
        {/* ====================================================== */}

        <section className="border-b border-line bg-white">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-14">
            <p className="text-overline text-action">
              Turismo gastronómico en Nicaragua
            </p>

            <h1 className="mt-2 max-w-3xl text-balance text-[2rem] font-bold leading-[1.1] text-ink sm:text-5xl">
              ¿Dónde comemos{' '}
              <span className="underline decoration-brand-maiz decoration-[6px] underline-offset-[10px]">
                hoy
              </span>
              ?
            </h1>

            <p className="mt-4 max-w-2xl text-base leading-relaxed text-ink-muted sm:text-lg">
              Busca un restaurante, un plato o una ciudad, o empieza por uno de estos caminos.
            </p>

            {/* En celular la búsqueda de la cabecera queda dentro del menú */}
            <div className="mt-6 max-w-xl md:hidden">
              <GlobalSearch mobile />
            </div>

            <ul className="mt-7 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
              <li>
                <QuickAction
                  href="/explore"
                  icon={Compass}
                  title="Explorar restaurantes"
                  description="Filtra por ciudad, cocina y precio"
                />
              </li>
              <li>
                <QuickAction
                  onClick={() => scrollToSection('mapa')}
                  icon={MapPin}
                  title="Ver el mapa"
                  description="Lugares cerca de ti"
                />
              </li>
              <li>
                <QuickAction
                  onClick={() => scrollToSection('rutas')}
                  icon={Route}
                  title="Rutas gastronómicas"
                  description="Recorridos parada por parada"
                />
              </li>
              <li>
                <QuickAction
                  href="/routes/create"
                  icon={Sparkles}
                  title="Crear mi ruta"
                  description="Según tu presupuesto y horario"
                  highlight
                />
              </li>
            </ul>
          </div>
        </section>

        {/* ====================================================== */}
        {/* RECOMENDACIONES PERSONALIZADAS                         */}
        {/* ====================================================== */}

        <PersonalizedRecommendations />

        {/* ====================================================== */}
        {/* FILTROS                                                */}
        {/* ====================================================== */}

        <section
          id="explorar"
          className="relative z-20 scroll-mt-[calc(var(--header-h)+16px)] pt-10 sm:pt-14"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeader
              eyebrow="Filtrar"
              title="Encuentra tu próximo lugar"
              description="Elige ubicación, tipo de cocina y presupuesto."
              aside={
                hasActiveFilters ? (
                  <span className="inline-flex items-center gap-2 rounded-full bg-action-soft px-3 py-1.5 text-[13px] font-semibold text-action">
                    <span className="size-2 rounded-full bg-action" aria-hidden="true" />
                    Filtros activos
                  </span>
                ) : null
              }
            />

            <div className="mt-5">
              <RestaurantFilters
                selectedCategoryId={selectedCategoryId}
                selectedMunicipalityId={selectedMunicipalityId}
                selectedMinPrice={selectedMinPrice}
                selectedMaxPrice={selectedMaxPrice}
                onSelectCategory={handleCategorySelect}
                onSelectMunicipality={handleMunicipalitySelect}
                onSelectBudget={handleBudgetSelect}
                onClear={handleClearFilters}
              />
            </div>
          </div>
        </section>

        {/* ====================================================== */}
        {/* RESTAURANTES                                           */}
        {/* ====================================================== */}

        <section
          id="restaurantes"
          className="scroll-mt-[calc(var(--header-h)+16px)] py-10 sm:py-14"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeader
              eyebrow={hasActiveFilters ? 'Resultados' : 'Restaurantes'}
              title={hasActiveFilters ? 'Restaurantes para tu búsqueda' : 'Explora restaurantes'}
              description={
                hasActiveFilters
                  ? 'Estos restaurantes coinciden con los filtros que elegiste.'
                  : 'Lugares destacados primero y, después, todos los restaurantes publicados en GastroNic.'
              }
              aside={
                <Link
                  href="/explore"
                  className="inline-flex h-11 items-center gap-1.5 rounded-control px-1 text-sm font-semibold text-action hover:underline"
                >
                  Ver todos en Explorar
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              }
            />

            <div className="mt-6 sm:mt-8">
              <RestaurantGrid
                selectedCategoryId={selectedCategoryId}
                selectedMunicipalityId={selectedMunicipalityId}
                selectedMinPrice={selectedMinPrice}
                selectedMaxPrice={selectedMaxPrice}
              />
            </div>
          </div>
        </section>

        {/* ====================================================== */}
        {/* MAPA                                                   */}
        {/* ====================================================== */}

        <section
          id="mapa"
          className="scroll-mt-[calc(var(--header-h)+16px)] border-y border-line bg-white py-10 sm:py-14"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeader
              eyebrow="Mapa"
              title="Lo que hay cerca de ti"
              description="Mueve el mapa, acércate a una zona y toca un punto para ver el restaurante."
            />

            <div className="mt-6 overflow-hidden rounded-card border border-line sm:mt-8">
              <InteractiveMap />
            </div>
          </div>
        </section>

        {/* ====================================================== */}
        {/* RUTAS                                                  */}
        {/* ====================================================== */}

        <section
          id="rutas"
          className="scroll-mt-[calc(var(--header-h)+16px)] py-10 sm:py-14"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeader
              eyebrow="Rutas gastronómicas"
              title="Descubre Nicaragua parada por parada"
              description="Sigue recorridos temáticos, visita cada parada y registra tu progreso."
            />

            <div className="mt-6 flex flex-col gap-5 rounded-card border border-brand-maiz/40 bg-maiz-soft p-5 sm:mt-8 sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <div className="flex items-start gap-4">
                <span className="flex size-11 flex-shrink-0 items-center justify-center rounded-control bg-brand-maiz text-ink">
                  <Sparkles className="size-5" aria-hidden="true" />
                </span>

                <div>
                  <h3 className="text-lg font-semibold text-ink">
                    ¿Prefieres armar tu propio recorrido?
                  </h3>
                  <p className="mt-1 max-w-xl text-[15px] leading-relaxed text-ink-muted">
                    Elige lugar, presupuesto, personas y horario. GastroNic combina restaurantes publicados y te propone una ruta.
                  </p>
                </div>
              </div>

              <Button asChild size="lg" variant="secondary" className="flex-shrink-0">
                <Link href="/routes/create">
                  Crear mi ruta
                  <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
            </div>

            <h3 className="mt-10 text-xl font-semibold text-ink">
              Recorridos de GastroNic
            </h3>

            <div className="mt-5">
              <GastroRoutes />
            </div>

            <UserSavedRoutes />
          </div>
        </section>
      </div>
    </MainLayout>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-canvas" />}>
      <HomeContent />
    </Suspense>
  );
}

/* ========================================================== */
/* COMPONENTES AUXILIARES                                     */
/* ========================================================== */

function SectionHeader({
  eyebrow,
  title,
  description,
  aside,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  aside?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        <p className="text-overline text-action">{eyebrow}</p>
        <h2 className="mt-1.5 text-balance text-2xl font-bold leading-tight text-ink sm:text-3xl">
          {title}
        </h2>
        {description && (
          <p className="mt-2 text-[15px] leading-relaxed text-ink-muted sm:text-base">
            {description}
          </p>
        )}
      </div>

      {aside && <div className="flex-shrink-0">{aside}</div>}
    </div>
  );
}

function QuickAction({
  href,
  onClick,
  icon: Icon,
  title,
  description,
  highlight = false,
}: {
  href?: string;
  onClick?: () => void;
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' }>;
  title: string;
  description: string;
  highlight?: boolean;
}) {
  const className =
    'group flex h-full w-full flex-col items-start gap-3 rounded-card border border-line bg-white p-4 text-left transition-[border-color,box-shadow] duration-150 hover:border-line-strong hover:shadow-raised sm:flex-row sm:items-center sm:p-5';

  const content = (
    <>
      <span
        className={`flex size-11 flex-shrink-0 items-center justify-center rounded-control ${
          highlight ? 'bg-brand-maiz text-ink' : 'bg-action-soft text-action'
        }`}
      >
        <Icon className="size-5" aria-hidden="true" />
      </span>

      <span className="min-w-0">
        <span className="block text-[15px] font-semibold leading-snug text-ink">{title}</span>
        <span className="mt-0.5 block text-[13px] leading-snug text-ink-muted">{description}</span>
      </span>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      {content}
    </button>
  );
}
