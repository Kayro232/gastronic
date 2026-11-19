import Link from 'next/link';

import {
  ArrowRight,
  Award,
  Heart,
  Route,
  ShieldCheck,
  Store,
  UserPlus,
} from 'lucide-react';

import { RegisterForm } from '@/components/auth/register-form';

export default function RegisterPage() {
  return (
    <main className="min-h-screen bg-canvas">
      <div className="grid min-h-screen lg:grid-cols-[0.95fr_1.05fr]">
        {/* ====================================================== */}
        {/* PANEL VISUAL                                          */}
        {/* ====================================================== */}

        <section className="relative hidden overflow-hidden bg-ink lg:flex">
          {/* Luces ambientales */}


          {/* Círculos decorativos */}
          <div className="pointer-events-none absolute right-12 top-20 h-64 w-64 rounded-full border border-white/[0.05]" />

          <div className="pointer-events-none absolute right-[-70px] top-[-30px] h-[430px] w-[430px] rounded-full border border-white/[0.035]" />

          <div className="relative z-10 flex w-full flex-col justify-between px-10 py-10 xl:px-14 xl:py-12">
            {/* Marca */}
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

            {/* Contenido principal */}
            <div className="max-w-xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.07] px-4 py-2 text-xs font-semibold text-white/80 backdrop-blur">
                <UserPlus className="h-4 w-4 text-secondary" />

                Únete a GastroNic
              </div>

              <h1 className="text-balance text-4xl font-bold leading-[1.08] tracking-[-0.04em] text-white xl:text-[3.5rem]">
                Tu historia gastronómica
                <span className="block text-secondary">
                  empieza aquí.
                </span>
              </h1>

              <p className="mt-6 max-w-lg text-base leading-8 text-white/80">
                Crea tu cuenta y empieza a guardar lugares, registrar visitas,
                completar rutas y descubrir nuevas experiencias alrededor de
                Nicaragua.
              </p>

              {/* Beneficios */}
              <div className="mt-9 space-y-3">
                <RegisterBenefit
                  icon={Heart}
                  title="Guarda tus lugares favoritos"
                  description="Ten siempre a mano los restaurantes que quieres conocer."
                />

                <RegisterBenefit
                  icon={Route}
                  title="Completa rutas gastronómicas"
                  description="Recorre experiencias únicas y descubre nuevas paradas."
                />

                <RegisterBenefit
                  icon={Award}
                  title="Gana puntos y distintivos"
                  description="Construye tu recorrido y desbloquea logros mientras exploras."
                />

                <RegisterBenefit
                  icon={ShieldCheck}
                  title="Comparte experiencias reales"
                  description="Forma parte de una comunidad gastronómica confiable."
                />
              </div>
            </div>

            {/* Footer lateral */}
            <div className="flex items-center justify-between text-xs text-white/70">
              <span>© 2026 GastroNic Tour</span>
              <span>Nicaragua</span>
            </div>
          </div>
        </section>

        {/* ====================================================== */}
        {/* FORMULARIO                                            */}
        {/* ====================================================== */}

        <section className="relative flex min-h-screen items-center justify-center px-5 py-24 sm:px-8 lg:py-12 xl:px-14">
          {/* Branding móvil */}
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

          <div className="w-full max-w-[570px]">
            {/* Header */}
            <div className="mb-8">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10">
                <UserPlus className="h-5 w-5 text-action" />
              </div>

              <p className="text-xs font-bold uppercase tracking-[0.08em] text-action">
                Crea tu cuenta
              </p>

              <h2 className="mt-2 text-3xl font-bold tracking-[-0.035em] text-ink sm:text-4xl">
                Empieza a descubrir.
              </h2>

              <p className="mt-3 max-w-lg text-sm leading-6 text-muted-foreground">
                Crea tu perfil para guardar restaurantes, registrar visitas y
                disfrutar de todo GastroNic.
              </p>
            </div>

            {/* Card del formulario */}
            <div className="rounded-sheet border border-border/70 bg-white p-6 shadow-none sm:p-7">
              <RegisterForm
                redirectTo="/home"
                emailRedirectPath="/auth/login"
              />
            </div>

            {/* Login */}
            <p className="mt-6 text-center text-sm text-muted-foreground">
              ¿Ya tienes una cuenta?{' '}
              <Link
                href="/auth/login"
                className="font-bold text-action transition hover:text-primary/80"
              >
                Inicia sesión
              </Link>
            </p>

            {/* Negocios */}
            <div className="my-7 flex items-center gap-4">
              <div className="h-px flex-1 bg-border" />

              <span className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">
                GastroNic para negocios
              </span>

              <div className="h-px flex-1 bg-border" />
            </div>

            <Link
              href="/owner/register"
              className="group flex items-center gap-4 rounded-2xl border border-border/70 bg-white p-4 transition hover:border-primary/20 hover:shadow-raised"
            >
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-primary/[0.08] text-action transition group-hover:bg-action group-hover:text-white">
                <Store className="h-5 w-5" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-ink">
                  Quiero registrar un restaurante
                </p>

                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Crea una cuenta para iniciar el proceso de registro de tu
                  negocio.
                </p>
              </div>

              <ArrowRight className="h-4 w-4 flex-shrink-0 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-action" />
            </Link>

            {/* Terms */}
            <p className="mt-7 text-center text-xs leading-5 text-muted-foreground">
              Al crear tu cuenta aceptas nuestros{' '}
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

function RegisterBenefit({
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
    <div className="flex items-start gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.055] p-4 backdrop-blur">
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-white/[0.08]">
        <Icon className="h-4 w-4 text-secondary" />
      </div>

      <div>
        <p className="text-sm font-bold text-white">
          {title}
        </p>

        <p className="mt-1 text-xs leading-5 text-white/70">
          {description}
        </p>
      </div>
    </div>
  );
}