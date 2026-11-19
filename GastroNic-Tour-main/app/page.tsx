import type {
  ComponentType,
  ReactNode,
} from 'react';

import Link from 'next/link';

import {
  ArrowRight,
  BadgeCheck,
  Bot,
  ChefHat,
  Coffee,
  Compass,
  Heart,
  Leaf,
  Map,
  MapPin,
  Search,
  Sparkles,
  Star,
  Store,
  UtensilsCrossed,
} from 'lucide-react';

import {
  Button,
} from '@/components/ui/button';
import { MainLayout } from '@/components/layout/main-layout';

import {
  createClient,
} from '@/lib/supabase/server';

/*
 * Esta página depende de la sesión
 * actual del usuario.
 *
 * Forzamos render dinámico para que
 * nunca quede cacheada una versión
 * de la landing con un estado de
 * autenticación incorrecto.
 */
export const dynamic =
  'force-dynamic';

/* =========================================================
   IMÁGENES LANDING
========================================================= */

const images = {
  hero:
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1500&q=88',

  coffee:
    'https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=1000&q=86',

  food:
    'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1000&q=86',

  restaurant:
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1000&q=86',

  routeCoffee:
    'https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=1400&q=88',

  routeTraditional:
    'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1000&q=88',

  routeNight:
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1000&q=88',
} as const;

/* =========================================================
   PAGE
========================================================= */

export default async function LandingPage() {
  const supabase =
    await createClient();

  const {
    data: {
      user,
    },
  } =
    await supabase.auth.getUser();

  const isLoggedIn =
    Boolean(user);

  /*
   * CTA principal:
   * - usuario nuevo -> registro
   * - usuario autenticado -> home
   */
  const primaryHref =
    isLoggedIn
      ? '/home'
      : '/auth/register';

  /*
   * Funcionalidades que requieren
   * entrar a GastroNic:
   * - autenticado -> home
   * - visitante -> login
   */
  const appHref =
    isLoggedIn
      ? '/home'
      : '/auth/login';

  const primaryLabel =
    isLoggedIn
      ? 'Continuar en GastroNic'
      : 'Explorar GastroNic';

  return (
    <MainLayout>
      <div className="overflow-hidden bg-canvas text-ink">
      {/* ====================================================== */}
      {/* NAVBAR                                                 */}
      {/* ====================================================== */}


      {/* ====================================================== */}
      {/* HERO                                                   */}
      {/* ====================================================== */}

      <section className="relative overflow-hidden pt-4 sm:pt-6">


        <div className="mx-auto grid min-h-[760px] max-w-7xl items-center gap-14 px-4 pb-20 pt-10 sm:px-6 lg:grid-cols-[1.02fr_0.98fr] lg:px-8 lg:pb-28">
          {/* COPY */}

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#1CA7A6]/15 bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.08em] text-action shadow-sm sm:text-xs">
              <Sparkles className="h-4 w-4 text-brand-maiz" />

              Gastronomía · Cultura · Nicaragua
            </div>

            <h1 className="mt-7 max-w-3xl text-balance text-[2.5rem] font-bold leading-[1.05] tracking-[-0.02em] text-ink sm:text-5xl lg:text-6xl">
              Nicaragua tiene historias

              <span className="mt-1 block text-action">
                que se sirven en la mesa.
              </span>
            </h1>

            <p className="mt-8 max-w-2xl text-base leading-8 text-ink-muted sm:text-lg lg:text-xl">
              Descubre restaurantes, café, cacao, productores,
              emprendimientos y experiencias locales que conectan
              gastronomía, cultura y territorio en un solo lugar.
            </p>

            {/* CTA */}

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="h-13 rounded-xl bg-action px-7 text-base font-bold text-white shadow-overlay hover:bg-action-hover"
              >
                <Link href={primaryHref}>
                  {primaryLabel}

                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>

              {!isLoggedIn && (
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="h-13 rounded-xl border-line bg-white px-7 text-base font-bold text-ink shadow-sm"
                >
                  <Link href="/auth/login">
                    Iniciar sesión
                  </Link>
                </Button>
              )}

              {isLoggedIn && (
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="h-13 rounded-xl border-line bg-white px-7 text-base font-bold text-ink shadow-sm"
                >
                  <a href="#rutas">
                    Ver qué descubrir
                  </a>
                </Button>
              )}
            </div>

            {/* TRUST */}

            <div className="mt-10 grid max-w-2xl gap-3 border-t border-line pt-7 sm:grid-cols-3">
              <TrustItem
                icon={MapPin}
                title="Lugares locales"
                text="Más cerca de ti"
              />

              <TrustItem
                icon={Coffee}
                title="Café y cacao"
                text="Origen y tradición"
              />

              <TrustItem
                icon={Heart}
                title="Experiencias"
                text="Hechas para recordar"
              />
            </div>
          </div>

          {/* VISUAL */}

          <div className="relative mx-auto w-full max-w-xl lg:max-w-none">
            <div className="absolute left-[8%] top-[4%] h-[86%] w-[86%] rounded-sheet bg-[#E9F5F3]" />

            <div className="relative ml-auto w-[92%] overflow-hidden rounded-sheet border border-white/60 bg-ink shadow-overlay">
              <img
                src={images.hero}
                alt="Experiencia gastronómica"
                loading="eager"
                fetchPriority="high"
                className="h-[540px] w-full object-cover sm:h-[620px]"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-[#081C1B]/80 via-[#081C1B]/10 to-transparent" />

              <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-md">
                  <Compass className="h-3.5 w-3.5 text-brand-maiz" />

                  Descubre con GastroNic
                </div>

                <p className="max-w-md text-2xl font-bold leading-tight text-white sm:text-3xl">
                  Una forma diferente de conocer Nicaragua.
                </p>

                <p className="mt-3 max-w-sm text-sm leading-6 text-white/80">
                  Cada sabor puede convertirse en una nueva parada.
                </p>
              </div>
            </div>




          </div>
        </div>
      </section>

      {/* ====================================================== */}
      {/* CATEGORY STRIP                                         */}
      {/* ====================================================== */}

      <section className="border-y border-line bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-8 gap-y-4 px-4 py-5 text-xs font-bold uppercase tracking-[0.08em] text-ink-muted sm:px-6 sm:text-xs lg:px-8">
          <span>Restaurantes</span>
          <span className="text-brand-maiz">✦</span>

          <span>Café</span>
          <span className="text-brand-maiz">✦</span>

          <span>Cacao</span>
          <span className="text-brand-maiz">✦</span>

          <span>Productores</span>
          <span className="text-brand-maiz">✦</span>

          <span>Rutas</span>
          <span className="text-brand-maiz">✦</span>

          <span>Experiencias</span>
        </div>
      </section>

      {/* ====================================================== */}
      {/* DESCUBRE                                               */}
      {/* ====================================================== */}

      <section
        id="descubre"
        className="scroll-mt-24 py-24 sm:py-28"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-14 lg:grid-cols-[0.72fr_1.28fr]">
            <div className="lg:sticky lg:top-32 lg:self-start">
              <SectionEyebrow>
                La experiencia GastroNic
              </SectionEyebrow>

              <h2 className="mt-4 text-balance text-4xl font-bold leading-[1.05] tracking-[-0.02em] text-ink sm:text-5xl">
                Más que encontrar

                <span className="block text-action">
                  dónde comer.
                </span>
              </h2>

              <p className="mt-6 max-w-md text-base leading-8 text-ink-muted">
                GastroNic convierte la gastronomía en una forma de
                explorar el país, descubrir emprendimientos y conocer
                historias detrás de cada producto y cada cocina.
              </p>

              <Button
                asChild
                variant="outline"
                className="mt-8 rounded-xl border-line bg-white"
              >
                <Link href={appHref}>
                  Entrar a GastroNic

                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FeatureCard
                number="01"
                icon={Search}
                title="Encuentra según tus gustos"
                description="Explora por ubicación, tipo de experiencia, presupuesto y preferencias gastronómicas."
              />

              <FeatureCard
                number="02"
                icon={Map}
                title="Conoce nuevas rutas"
                description="Descubre recorridos gastronómicos y conecta distintos lugares dentro de una misma experiencia."
              />

              <FeatureCard
                number="03"
                icon={Coffee}
                title="Acércate al origen"
                description="Descubre café, cacao, productos locales y a las personas que están detrás de ellos."
              />

              <FeatureCard
                number="04"
                icon={Star}
                title="Comparte lo que viviste"
                description="Guarda lugares, registra experiencias y ayuda a otras personas a descubrir nuevos sabores."
              />
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================== */}
      {/* SABORES / ECOSISTEMA                                   */}
      {/* ====================================================== */}

      <section
        id="sabores"
        className="scroll-mt-24 border-y border-line bg-white py-24 sm:py-28"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <SectionEyebrow>
              Nicaragua en cada sabor
            </SectionEyebrow>

            <h2 className="mt-4 text-balance text-4xl font-bold tracking-[-0.02em] text-ink sm:text-5xl">
              Del producto a la mesa,

              <span className="block text-ink-muted">
                todo forma parte de la experiencia.
              </span>
            </h2>
          </div>

          <div className="mt-12 grid gap-5 lg:grid-cols-[1.12fr_0.88fr]">
            {/* COFFEE */}

            <ExperiencePanel
              image={images.coffee}
              icon={Coffee}
              eyebrow="CAFÉ Y CACAO"
              title="Conoce de dónde viene lo que consumes."
              description="Acércate a productores, procesos, fincas y emprendimientos que forman parte de la identidad gastronómica del país."
              className="min-h-[520px]"
            />

            <div className="grid gap-5">
              {/* PRODUCTS */}

              <ExperiencePanel
                image={images.food}
                icon={Leaf}
                eyebrow="PRODUCTOS LOCALES"
                title="Ingredientes con identidad."
                description="Descubre propuestas que trabajan con ingredientes, productos orgánicos y sabores del territorio."
                className="min-h-[250px]"
                compact
              />

              {/* RESTAURANTS */}

              <ExperiencePanel
                image={images.restaurant}
                icon={ChefHat}
                eyebrow="COCINA Y EXPERIENCIAS"
                title="Lugares que vale la pena vivir."
                description="Encuentra restaurantes y experiencias gastronómicas para compartir, explorar y recordar."
                className="min-h-[250px]"
                compact
              />
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================== */}
      {/* RUTAS                                                  */}
      {/* ====================================================== */}

      <section
        id="rutas"
        className="scroll-mt-24 py-24 sm:py-28"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-sheet bg-[#0B201F] px-5 py-10 text-white sm:rounded-sheet sm:px-10 sm:py-14 lg:px-14 lg:py-16">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-[0.08em] text-brand-maiz">
                  <Compass className="h-4 w-4" />

                  Rutas gastronómicas
                </div>

                <h2 className="mt-6 text-balance text-4xl font-bold leading-[1.05] tracking-[-0.02em] sm:text-5xl">
                  Hay caminos que se recuerdan

                  <span className="block text-brand-maiz">
                    por su sabor.
                  </span>
                </h2>

                <p className="mt-6 max-w-2xl text-base leading-8 text-white/80">
                  Recorre distintas zonas de Nicaragua y descubre
                  restaurantes, productos, café, cultura y experiencias
                  parada por parada.
                </p>
              </div>

              <Button
                asChild
                size="lg"
                className="w-fit rounded-xl bg-brand-maiz px-6 font-bold text-ink hover:bg-maiz-hover"
              >
                <Link href={appHref}>
                  Explorar rutas

                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>

            {/* ROUTE CARDS */}

            <div className="mt-12 grid gap-5 lg:grid-cols-[1.35fr_0.825fr_0.825fr]">
              <RoutePreview
                href={appHref}
                image={images.routeCoffee}
                title="Ruta del Café"
                description="Café, origen y territorio."
                location="Jinotega"
                large
              />

              <RoutePreview
                href={appHref}
                image={images.routeTraditional}
                title="Sabores tradicionales"
                description="Cocina, historia y ciudad."
                location="Granada"
              />

              <RoutePreview
                href={appHref}
                image={images.routeNight}
                title="Ruta urbana"
                description="Nuevos sabores en la capital."
                location="Managua"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================== */}
      {/* IA                                                     */}
      {/* ====================================================== */}

      <section
        id="ia"
        className="scroll-mt-24 border-y border-line bg-white py-24 sm:py-28"
      >
        <div className="mx-auto grid max-w-7xl gap-14 px-4 sm:px-6 lg:grid-cols-[0.88fr_1.12fr] lg:px-8">
          {/* TEXT */}

          <div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF7F6] text-action">
              <Bot className="h-6 w-6" />
            </div>

            <SectionEyebrow className="mt-6">
              Inteligencia que acompaña
            </SectionEyebrow>

            <h2 className="mt-4 text-balance text-4xl font-bold leading-[1.05] tracking-[-0.02em] text-ink sm:text-5xl">
              Tecnología para descubrir,

              <span className="block text-action">
                aprender y crecer.
              </span>
            </h2>

            <p className="mt-6 max-w-xl text-base leading-8 text-ink-muted">
              GastroNic integra asistentes con inteligencia artificial
              pensados para distintos momentos de la experiencia
              gastronómica.
            </p>
          </div>

          {/* AI CARDS */}

          <div className="grid gap-4">
            <AICard
              number="01"
              icon={Compass}
              title="Guía virtual para turistas"
              description="Ayuda a descubrir lugares y construir recorridos según gustos, presupuesto, ubicación y preferencias."
            />

            <AICard
              number="02"
              icon={Store}
              title="Asistente para emprendedores"
              description="Brinda orientación práctica en marketing, comunicación y ventas para fortalecer negocios gastronómicos."
            />

            <AICard
              number="03"
              icon={ChefHat}
              title="Cocina nutritiva con ingredientes locales"
              description="Promueve aprendizaje culinario y hábitos saludables aprovechando ingredientes disponibles en Nicaragua."
            />
          </div>
        </div>
      </section>

      {/* ====================================================== */}
      {/* CÓMO FUNCIONA                                          */}
      {/* ====================================================== */}

      <section className="py-24 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <SectionEyebrow>
              Tu próxima experiencia
            </SectionEyebrow>

            <h2 className="mt-4 text-balance text-4xl font-bold tracking-[-0.02em] text-ink sm:text-5xl">
              Descubrir algo nuevo

              <span className="block text-ink-muted">
                puede ser así de sencillo.
              </span>
            </h2>
          </div>

          <div className="mt-14 grid gap-5 md:grid-cols-3">
            <StepCard
              number="01"
              icon={Search}
              title="Explora"
              description="Busca lugares, experiencias, rutas y sabores según lo que te interesa."
            />

            <StepCard
              number="02"
              icon={MapPin}
              title="Vive la experiencia"
              description="Visita, prueba, aprende y conecta con la gastronomía local."
            />

            <StepCard
              number="03"
              icon={Heart}
              title="Guarda y comparte"
              description="Crea favoritos, registra tus experiencias y ayuda a otros a descubrir."
            />
          </div>
        </div>
      </section>

      {/* ====================================================== */}
      {/* APOYO / ECOSISTEMA                                     */}
      {/* ====================================================== */}

      <section className="px-4 pb-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl rounded-sheet border border-[#DDE8E4] bg-[#EFF7F4] px-6 py-10 sm:px-10 lg:flex lg:items-center lg:justify-between lg:gap-14 lg:px-12">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-action">
              Innovación que conecta talento
            </p>

            <h2 className="mt-3 text-2xl font-bold tracking-[-0.02em] text-ink sm:text-3xl">
              Gastronomía, educación y tecnología trabajando juntas.
            </h2>

            <p className="mt-4 text-sm leading-7 text-ink-muted">
              GastroNic Tour cuenta con el respaldo de INATEC y
              Universidad Americana, integrando talento técnico,
              emprendimiento, marketing, innovación y diseño digital.
            </p>
          </div>

          <div className="mt-8 flex flex-wrap gap-3 lg:mt-0">
            <PartnerBadge>
              INATEC
            </PartnerBadge>

            <PartnerBadge>
              Universidad Americana
            </PartnerBadge>
          </div>
        </div>
      </section>

      {/* ====================================================== */}
      {/* NEGOCIOS                                               */}
      {/* ====================================================== */}

      <section
        id="negocios"
        className="scroll-mt-24 px-4 pb-24 sm:px-6 lg:px-8"
      >
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-sheet bg-gradient-to-br from-[#1CA7A6] to-[#126D6C] p-7 text-white sm:rounded-sheet sm:p-12 lg:p-16">
          <div className="pointer-events-none absolute -right-20 -top-32 h-96 w-96 rounded-full border border-white/10" />

          <div className="pointer-events-none absolute -right-4 top-20 h-56 w-56 rounded-full border border-white/10" />

          <div className="relative grid items-center gap-10 lg:grid-cols-[1fr_auto]">
            <div className="max-w-3xl">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
                <Store className="h-6 w-6 text-brand-maiz" />
              </div>

              <p className="mt-6 text-sm font-bold text-brand-maiz">
                GastroNic para negocios
              </p>

              <h2 className="mt-2 text-balance text-3xl font-bold tracking-[-0.02em] sm:text-4xl lg:text-5xl">
                Tu negocio también puede formar parte de la experiencia.
              </h2>

              <p className="mt-5 max-w-2xl text-base leading-8 text-white/70">
                Presenta tu restaurante o emprendimiento, construye
                presencia digital y conecta con personas interesadas
                en descubrir nuevas propuestas gastronómicas.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-12 rounded-xl border-white/20 bg-white/10 px-6 font-bold text-white hover:bg-white/20 hover:text-white"
              >
                <Link href="/owner/login">
                  Ya tengo acceso
                </Link>
              </Button>

              <Button
                asChild
                size="lg"
                className="h-12 rounded-xl bg-brand-maiz px-6 font-bold text-ink hover:bg-maiz-hover"
              >
                <Link href="/owner/register">
                  Registrar negocio

                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================== */}
      {/* FINAL CTA                                              */}
      {/* ====================================================== */}

      <section className="pb-28 pt-6">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FFF4D3] text-[#B97900]">
            <UtensilsCrossed className="h-6 w-6" />
          </div>

          <h2 className="mt-7 text-balance text-4xl font-bold leading-[1.05] tracking-[-0.02em] text-ink sm:text-5xl">
            Nicaragua todavía tiene

            <span className="block text-action">
              mucho por descubrir.
            </span>
          </h2>

          <p className="mx-auto mt-5 max-w-xl text-base leading-8 text-ink-muted">
            {isLoggedIn
              ? 'Continúa explorando lugares, rutas y experiencias dentro de GastroNic.'
              : 'Crea tu cuenta o inicia sesión y comienza a construir tu propio recorrido gastronómico.'}
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button
              asChild
              size="lg"
              className="h-12 rounded-xl bg-action px-7 font-bold text-white hover:bg-action-hover"
            >
              <Link href={primaryHref}>
                {isLoggedIn
                  ? 'Ir a mi inicio'
                  : 'Crear mi cuenta'}

                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>

            {!isLoggedIn && (
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-12 rounded-xl border-line bg-white px-7 font-bold"
              >
                <Link href="/auth/login">
                  Iniciar sesión
                </Link>
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* ====================================================== */}
      {/* FOOTER                                                 */}
      {/* ====================================================== */}

      </div>
    </MainLayout>
  );
}

/* =========================================================
   AUXILIARY COMPONENTS
========================================================= */

function SectionEyebrow({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p
      className={`text-xs font-bold uppercase tracking-[0.08em] text-action sm:text-xs ${className}`}
    >
      {children}
    </p>
  );
}

/* =========================================================
   TRUST ITEM
========================================================= */

function TrustItem({
  icon: Icon,
  title,
  text,
}: {
  icon: ComponentType<{
    className?: string;
  }>;

  title: string;
  text: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-white text-action shadow-sm">
        <Icon className="h-4 w-4" />
      </div>

      <div>
        <p className="text-xs font-bold text-ink">
          {title}
        </p>

        <p className="mt-0.5 text-xs font-medium text-ink-muted">
          {text}
        </p>
      </div>
    </div>
  );
}

/* =========================================================
   FEATURE CARD
========================================================= */

function FeatureCard({
  number,
  icon: Icon,
  title,
  description,
}: {
  number: string;

  icon: ComponentType<{
    className?: string;
  }>;

  title: string;
  description: string;
}) {
  return (
    <article className="group min-h-[265px] rounded-card border border-[#E3EAE7] bg-white p-6 transition duration-300 hover:-translate-y-1 hover:border-[#1CA7A6]/20 hover:shadow-raised sm:p-7">
      <div className="flex items-start justify-between">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF7F6] text-action transition group-hover:bg-action group-hover:text-white">
          <Icon className="h-5 w-5" />
        </div>

        <span className="text-xs font-bold tracking-[0.08em] text-ink-muted">
          {number}
        </span>
      </div>

      <h3 className="mt-7 text-xl font-bold tracking-[-0.02em] text-ink">
        {title}
      </h3>

      <p className="mt-3 text-sm leading-7 text-ink-muted">
        {description}
      </p>
    </article>
  );
}

/* =========================================================
   EXPERIENCE PANEL
========================================================= */

function ExperiencePanel({
  image,
  icon: Icon,
  eyebrow,
  title,
  description,
  className = '',
  compact = false,
}: {
  image: string;

  icon: ComponentType<{
    className?: string;
  }>;

  eyebrow: string;
  title: string;
  description: string;

  className?: string;
  compact?: boolean;
}) {
  return (
    <article
      className={`group relative overflow-hidden rounded-sheet bg-ink ${className}`}
    >
      <img
        src={image}
        alt={title}
        loading="lazy"
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]"
      />

      <div className="absolute inset-0 bg-gradient-to-t from-[#071B1A]/90 via-[#071B1A]/30 to-[#071B1A]/5" />

      <div
        className={`absolute inset-x-0 bottom-0 ${
          compact
            ? 'p-6'
            : 'p-7 sm:p-9'
        }`}
      >
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-brand-maiz backdrop-blur">
          <Icon className="h-5 w-5" />
        </div>

        <p className="text-xs font-bold uppercase tracking-[0.08em] text-brand-maiz">
          {eyebrow}
        </p>

        <h3
          className={`mt-2 max-w-xl font-bold tracking-[-0.02em] text-white ${
            compact
              ? 'text-xl sm:text-2xl'
              : 'text-3xl sm:text-4xl'
          }`}
        >
          {title}
        </h3>

        <p className="mt-3 max-w-lg text-sm leading-6 text-white/80">
          {description}
        </p>
      </div>
    </article>
  );
}

/* =========================================================
   ROUTE PREVIEW
========================================================= */

function RoutePreview({
  href,
  image,
  title,
  description,
  location,
  large = false,
}: {
  href: string;
  image: string;
  title: string;
  description: string;
  location: string;
  large?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`group relative overflow-hidden rounded-card bg-[#17302F] ${
        large
          ? 'min-h-[470px]'
          : 'min-h-[390px]'
      }`}
    >
      <img
        src={image}
        alt={title}
        loading="lazy"
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"
      />

      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent" />

      <div className="absolute inset-x-0 bottom-0 p-6">
        <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/20 px-3 py-1.5 text-xs font-bold text-white backdrop-blur">
          <MapPin className="h-3.5 w-3.5 text-brand-maiz" />

          {location}
        </div>

        <div className="flex items-end justify-between gap-4">
          <div>
            <h3
              className={`font-bold tracking-[-0.025em] text-white ${
                large
                  ? 'text-3xl'
                  : 'text-xl'
              }`}
            >
              {title}
            </h3>

            <p className="mt-2 text-xs leading-5 text-white/80">
              {description}
            </p>
          </div>

          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-white text-action transition duration-300 group-hover:translate-x-1">
            <ArrowRight className="h-4 w-4" />
          </div>
        </div>
      </div>
    </Link>
  );
}

/* =========================================================
   AI CARD
========================================================= */

function AICard({
  number,
  icon: Icon,
  title,
  description,
}: {
  number: string;

  icon: ComponentType<{
    className?: string;
  }>;

  title: string;
  description: string;
}) {
  return (
    <article className="grid gap-5 rounded-card border border-[#E3EAE7] bg-canvas p-5 sm:grid-cols-[auto_1fr_auto] sm:items-center sm:p-6">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF7F6] text-action">
        <Icon className="h-5 w-5" />
      </div>

      <div>
        <h3 className="text-base font-bold text-ink sm:text-lg">
          {title}
        </h3>

        <p className="mt-2 text-sm leading-6 text-ink-muted">
          {description}
        </p>
      </div>

      <span className="text-xs font-bold tracking-[0.08em] text-ink-muted">
        {number}
      </span>
    </article>
  );
}

/* =========================================================
   STEP CARD
========================================================= */

function StepCard({
  number,
  icon: Icon,
  title,
  description,
}: {
  number: string;

  icon: ComponentType<{
    className?: string;
  }>;

  title: string;
  description: string;
}) {
  return (
    <article className="relative rounded-card border border-[#E3EAE7] bg-white p-7">
      <div className="flex items-center justify-between">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ink text-white">
          <Icon className="h-5 w-5" />
        </div>

        <span className="text-3xl font-bold text-[#E7EDEA]">
          {number}
        </span>
      </div>

      <h3 className="mt-7 text-xl font-bold text-ink">
        {title}
      </h3>

      <p className="mt-3 text-sm leading-7 text-ink-muted">
        {description}
      </p>
    </article>
  );
}

/* =========================================================
   PARTNER BADGE
========================================================= */

function PartnerBadge({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="inline-flex min-h-12 items-center rounded-xl border border-[#D7E6E1] bg-white px-5 text-sm font-bold text-ink shadow-sm">
      <BadgeCheck className="mr-2 h-4 w-4 text-action" />

      {children}
    </div>
  );
}

/* =========================================================
   FOOTER COLUMN
========================================================= */

function FooterColumn({
  title,
  links,
}: {
  title: string;

  links: [
    string,
    string,
  ][];
}) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.08em] text-white/70">
        {title}
      </p>

      <div className="mt-5 space-y-3">
        {links.map(
          ([
            label,
            href,
          ]) => (
            <Link
              key={`${label}-${href}`}
              href={href}
              className="block text-sm font-medium text-white/80 transition hover:text-white"
            >
              {label}
            </Link>
          )
        )}
      </div>
    </div>
  );
}