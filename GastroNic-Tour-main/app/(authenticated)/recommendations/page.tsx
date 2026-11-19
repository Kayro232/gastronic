import {
  ChefHat,
  MapPin,
  Sparkles,
  UtensilsCrossed,
  WalletCards,
} from 'lucide-react';

import { MainLayout } from '@/components/layout/main-layout';
import { RecommendationForm } from '@/components/recommendations/recommendation-form';

export default function RecommendationsPage() {
  return (
    <MainLayout>
      <div className="bg-canvas pb-24 md:pb-0">
        {/* Hero */}
        <section className="relative overflow-hidden bg-ink text-white">
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary/30 blur-3xl" />

          <div className="pointer-events-none absolute -bottom-28 -left-20 h-72 w-72 rounded-full bg-secondary/20 blur-3xl" />

          <div className="pointer-events-none absolute left-1/2 top-0 h-full w-px bg-white/5" />

          <div className="relative mx-auto max-w-5xl px-4 pb-14 pt-8 text-center sm:px-6 sm:pb-28 sm:pt-12 md:pb-36 md:pt-16 lg:px-8">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/10 shadow-lg backdrop-blur-sm sm:h-16 sm:w-16 sm:rounded-2xl">
              <ChefHat className="h-6 w-6 text-secondary sm:h-8 sm:w-8" />
            </div>

            <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.08] px-3 py-1.5 text-xs font-bold uppercase tracking-[0.08em] text-secondary backdrop-blur-sm sm:mt-5 sm:text-xs sm:tracking-[0.08em]">
              <Sparkles className="h-3.5 w-3.5" />
              Recomendaciones inteligentes
            </div>

            <h1 className="mx-auto mt-4 max-w-3xl text-balance text-[2rem] font-bold leading-[1.05] tracking-[-0.04em] sm:mt-5 sm:text-4xl md:text-5xl">
              Tu próxima experiencia gastronómica comienza aquí
            </h1>

            <p className="mx-auto mt-3 max-w-2xl text-pretty text-sm leading-6 text-white/75 sm:mt-4 sm:text-base sm:leading-7 md:text-lg">
              Dinos qué te provoca, cuánto quieres gastar y qué tipo de lugar
              buscas. GastroNic comparará opciones reales para encontrar las que
              mejor encajan contigo.
            </p>

            {/* Beneficios: solo tablet/escritorio */}
            <div className="mx-auto mt-8 hidden max-w-3xl grid-cols-3 gap-3 sm:grid">
              <Feature
                icon={UtensilsCrossed}
                title="Según tus gustos"
                description="Tipo de comida y experiencia"
              />

              <Feature
                icon={WalletCards}
                title="Según tu presupuesto"
                description="Opciones dentro de tu rango"
              />

              <Feature
                icon={MapPin}
                title="Según tu ubicación"
                description="Lugares que te convienen"
              />
            </div>
          </div>
        </section>

        {/* Recomendador */}
        <section className="relative z-10 -mt-4 sm:-mt-20 md:-mt-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="sm:overflow-hidden sm:rounded-sheet sm:border sm:border-border/60 sm:bg-white sm:shadow-raised">
              {/* Encabezado simple en móvil; tarjeta desde sm */}
              <div className="pb-4 pt-5 sm:border-b sm:border-border/60 sm:bg-white sm:px-7 sm:py-6">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 sm:h-11 sm:w-11">
                    <Sparkles className="h-5 w-5 text-action" />
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.08em] text-action sm:text-xs">
                      Encuentra tu opción ideal
                    </p>

                    <h2 className="mt-1 text-xl font-bold tracking-[-0.025em] text-ink sm:text-2xl">
                      Cuéntanos qué buscas
                    </h2>

                    <p className="mt-1.5 max-w-xl text-xs leading-5 text-muted-foreground sm:text-sm sm:leading-6">
                      Ajusta tus preferencias y te mostraremos restaurantes que
                      coincidan mejor contigo.
                    </p>
                  </div>
                </div>
              </div>

              <div className="sm:p-7">
                <RecommendationForm />
              </div>
            </div>
          </div>
        </section>

        <div className="h-8 sm:h-14 md:h-16" />
      </div>
    </MainLayout>
  );
}

function Feature({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-4 text-center backdrop-blur-sm">
      <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-xl bg-white/10">
        <Icon className="h-4 w-4 text-secondary" />
      </div>

      <p className="mt-3 text-xs font-bold text-white">
        {title}
      </p>

      <p className="mt-1 text-xs leading-4 text-white/60">
        {description}
      </p>
    </div>
  );
}
