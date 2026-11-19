import Link from 'next/link';

import {
  ArrowRight,
  Compass,
  MapPin,
  Route,
  Sparkles,
  Store,
  UtensilsCrossed,
} from 'lucide-react';

import { LoginForm } from '@/components/auth/login-form';

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-canvas">
      <div className="grid min-h-screen lg:grid-cols-[1.02fr_0.98fr]">
        {/* ====================================================== */}
        {/* VISUAL / BRAND                                        */}
        {/* ====================================================== */}

        <section className="relative hidden overflow-hidden bg-ink lg:flex">
          {/* Fondos */}


          <div className="pointer-events-none absolute right-20 top-24 h-60 w-60 rounded-full border border-white/[0.06]" />

          <div className="pointer-events-none absolute right-6 top-10 h-96 w-96 rounded-full border border-white/[0.035]" />

          <div className="relative z-10 flex w-full flex-col justify-between px-10 py-10 xl:px-14 xl:py-12">
            {/* Logo */}
            <Link
              href="/"
              className="inline-flex w-fit items-center gap-3"
            >
              <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-overlay">
                <img
                  src="/logo.jpeg"
                  alt="GastroNic Tour"
                  className="h-full w-full object-contain p-1"
                />
              </div>

              <div>
                <p className="text-base font-bold tracking-tight text-white">
                  GastroNic Tour
                </p>

                <p className="mt-0.5 text-xs font-semibold uppercase tracking-[0.08em] text-white/70">
                  Sabores de Nicaragua
                </p>
              </div>
            </Link>

            {/* Hero */}
            <div className="max-w-xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.07] px-4 py-2 text-xs font-semibold text-white/80 backdrop-blur">
                <Compass className="h-4 w-4 text-secondary" />

                Descubre Nicaragua a tu manera
              </div>

              <h1 className="text-balance text-4xl font-bold leading-[1.08] tracking-[-0.04em] text-white xl:text-[3.5rem]">
                Cada lugar tiene
                <span className="block text-secondary">
                  un sabor por descubrir.
                </span>
              </h1>

              <p className="mt-6 max-w-lg text-base leading-8 text-white/80">
                Encuentra restaurantes, recorre rutas gastronómicas y guarda
                las experiencias que quieras volver a vivir.
              </p>

              <div className="mt-9 grid grid-cols-2 gap-3">
                <FeatureCard
                  icon={UtensilsCrossed}
                  title="Restaurantes"
                  description="Lugares seleccionados para descubrir."
                />

                <FeatureCard
                  icon={Route}
                  title="Rutas"
                  description="Recorridos gastronómicos únicos."
                />

                <FeatureCard
                  icon={MapPin}
                  title="Explora"
                  description="Encuentra experiencias alrededor del país."
                />

                <FeatureCard
                  icon={Sparkles}
                  title="Para ti"
                  description="Descubre lugares según tus gustos."
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-white/70">
              <span>© 2026 GastroNic Tour</span>
              <span>Nicaragua</span>
            </div>
          </div>
        </section>

        {/* ====================================================== */}
        {/* LOGIN                                                  */}
        {/* ====================================================== */}

        <section className="relative flex min-h-screen items-center justify-center px-5 py-24 sm:px-8 lg:py-12 xl:px-14">
          {/* Mobile brand */}
          <div className="absolute left-5 top-5 sm:left-8 lg:hidden">
            <Link
              href="/"
              className="flex items-center gap-2.5"
            >
              <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border border-border bg-white shadow-sm">
                <img
                  src="/logo.jpeg"
                  alt="GastroNic Tour"
                  className="h-full w-full object-contain p-1"
                />
              </div>

              <div>
                <p className="text-sm font-bold text-ink">
                  GastroNic
                </p>

                <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">
                  Tour
                </p>
              </div>
            </Link>
          </div>

          <div className="w-full max-w-[460px]">
            <div className="mb-8">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10">
                <Sparkles className="h-5 w-5 text-action" />
              </div>

              <p className="text-xs font-bold uppercase tracking-[0.08em] text-action">
                Bienvenido de nuevo
              </p>

              <h2 className="mt-2 text-3xl font-bold tracking-[-0.035em] text-ink sm:text-4xl">
                Continúa explorando.
              </h2>

              <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">
                Inicia sesión para acceder a tus visitas, favoritos, rutas y
                recomendaciones.
              </p>
            </div>

            <div className="rounded-sheet border border-border/70 bg-white p-6 shadow-none sm:p-7">
              <LoginForm redirectTo="/home" />
            </div>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              ¿Aún no tienes una cuenta?{' '}
              <Link
                href="/auth/register"
                className="font-bold text-action transition hover:text-primary/80"
              >
                Crear cuenta
              </Link>
            </p>

            {/* Owner */}
            <div className="my-7 flex items-center gap-4">
              <div className="h-px flex-1 bg-border" />

              <span className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">
                GastroNic para negocios
              </span>

              <div className="h-px flex-1 bg-border" />
            </div>

            <Link
              href="/owner/login"
              className="group flex items-center gap-4 rounded-2xl border border-border/70 bg-white p-4 transition hover:border-primary/20 hover:shadow-raised"
            >
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-primary/[0.08] text-action transition group-hover:bg-action group-hover:text-white">
                <Store className="h-5 w-5" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-ink">
                  ¿Tienes un restaurante?
                </p>

                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Accede al portal de negocios de GastroNic.
                </p>
              </div>

              <ArrowRight className="h-4 w-4 flex-shrink-0 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-action" />
            </Link>

            <p className="mt-7 text-center text-xs leading-5 text-muted-foreground">
              Al continuar aceptas nuestros{' '}
              <Link
                href="/terms"
                className="font-semibold text-action hover:underline"
              >
                términos de servicio
              </Link>{' '}
              y la política de privacidad.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{
    className?: string;
  }>;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.055] p-4 backdrop-blur">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.08]">
        <Icon className="h-4 w-4 text-secondary" />
      </div>

      <p className="mt-4 text-sm font-bold text-white">
        {title}
      </p>

      <p className="mt-1.5 text-xs leading-5 text-white/70">
        {description}
      </p>
    </div>
  );
}