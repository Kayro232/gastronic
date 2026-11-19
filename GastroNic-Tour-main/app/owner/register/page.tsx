import Link from 'next/link';

import {
  ArrowLeft,
  ClipboardCheck,
  FileText,
  SearchCheck,
  Store,
  UserPlus,
} from 'lucide-react';

import { RegisterForm } from '@/components/auth/register-form';

export default function OwnerRegisterPage() {
  return (
    <main className="min-h-screen bg-canvas">
      <div className="grid min-h-screen lg:grid-cols-[0.95fr_1.05fr]">
        {/* ==================================================== */}
        {/* PANEL VISUAL                                        */}
        {/* ==================================================== */}

        <section className="relative hidden overflow-hidden bg-ink lg:flex">


          <div className="pointer-events-none absolute right-16 top-16 h-64 w-64 rounded-full border border-white/[0.05]" />

          <div className="relative z-10 flex w-full flex-col justify-between px-10 py-10 xl:px-14 xl:py-12">
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
                  Portal para restaurantes
                </p>
              </div>
            </Link>

            <div className="max-w-xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.07] px-4 py-2 text-xs font-semibold text-white/80 backdrop-blur">
                <Store className="h-4 w-4 text-secondary" />

                GastroNic para negocios
              </div>

              <h1 className="text-balance text-4xl font-bold leading-[1.08] tracking-[-0.04em] text-white xl:text-[3.5rem]">
                Haz que tu restaurante

                <span className="block text-secondary">
                  forme parte del recorrido.
                </span>
              </h1>

              <p className="mt-6 max-w-lg text-base leading-8 text-white/80">
                Crea tu cuenta y empieza el proceso para incorporar tu negocio
                a GastroNic.
              </p>

              <div className="mt-9 space-y-3">
                <OwnerStep
                  number="01"
                  icon={UserPlus}
                  title="Crea tu cuenta"
                  description="Accede al portal empresarial con tu cuenta GastroNic."
                />

                <OwnerStep
                  number="02"
                  icon={FileText}
                  title="Registra tu restaurante"
                  description="Completa la información del establecimiento y envía tu solicitud."
                />

                <OwnerStep
                  number="03"
                  icon={SearchCheck}
                  title="Revisamos tu solicitud"
                  description="Nuestro equipo validará la información antes de publicarla."
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-white/70">
              <span>© 2026 GastroNic Tour</span>

              <span>Selección gastronómica</span>
            </div>
          </div>
        </section>

        {/* ==================================================== */}
        {/* REGISTER                                            */}
        {/* ==================================================== */}

        <section className="relative flex min-h-screen items-center justify-center px-5 py-24 sm:px-8 lg:py-12 xl:px-14">
          <div className="w-full max-w-[580px]">
            <Link
              href="/owner/login"
              className="mb-8 inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground transition hover:text-action"
            >
              <ArrowLeft className="h-4 w-4" />

              Ya tengo una cuenta
            </Link>

            <div className="mb-8 flex items-center gap-3 lg:hidden">
              <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl border border-border bg-white shadow-sm">
                <img
                  src="/logo.jpeg"
                  alt="GastroNic Tour"
                  className="h-full w-full object-contain p-1"
                />
              </div>

              <div>
                <p className="text-sm font-bold text-ink">
                  GastroNic Tour
                </p>

                <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">
                  Para restaurantes
                </p>
              </div>
            </div>

            <div className="mb-8">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10">
                <UserPlus className="h-5 w-5 text-action" />
              </div>

              <p className="text-xs font-bold uppercase tracking-[0.08em] text-action">
                Portal para restaurantes
              </p>

              <h2 className="mt-2 text-3xl font-bold tracking-[-0.035em] text-ink sm:text-4xl">
                Crea tu cuenta de negocio.
              </h2>

              <p className="mt-3 max-w-lg text-sm leading-6 text-muted-foreground">
                Después de crearla podrás iniciar la solicitud para registrar
                tu establecimiento.
              </p>
            </div>

            <div className="rounded-sheet border border-border/70 bg-white p-6 shadow-none sm:p-7">
              <RegisterForm
                redirectTo="/owner/dashboard"
                emailRedirectPath="/owner/login"
                submitLabel="Crear cuenta para mi negocio"
              />
            </div>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              ¿Ya tienes una cuenta?{' '}

              <Link
                href="/owner/login"
                className="font-bold text-action transition hover:text-primary/80"
              >
                Inicia sesión
              </Link>
            </p>

            <div className="mt-7 flex gap-3 rounded-2xl border border-border/70 bg-white p-4 shadow-none">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <ClipboardCheck className="h-4 w-4 text-action" />
              </div>

              <div>
                <p className="text-xs font-bold text-ink">
                  El registro no publica automáticamente tu restaurante
                </p>

                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Cada establecimiento debe completar su solicitud y pasar por
                  revisión antes de aparecer en GastroNic.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function OwnerStep({
  number,
  icon: Icon,
  title,
  description,
}: {
  number: string;
  icon: React.ComponentType<{
    className?: string;
  }>;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-4 rounded-2xl border border-white/[0.08] bg-white/[0.055] p-4 backdrop-blur">
      <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-white/[0.08]">
        <Icon className="h-4 w-4 text-secondary" />
      </div>

      <div className="min-w-0 flex-1">
        <span className="text-xs font-bold uppercase tracking-[0.08em] text-secondary/70">
          Paso {number}
        </span>

        <p className="mt-1 text-sm font-bold text-white">
          {title}
        </p>

        <p className="mt-1 text-xs leading-5 text-white/70">
          {description}
        </p>
      </div>
    </div>
  );
}