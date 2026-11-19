import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

import { OwnerLayout } from '@/components/owner/owner-layout';
import { RestaurantRequestForm } from '@/components/owner/restaurant-request-form';

export default function NewRestaurantPage() {
  return (
    <OwnerLayout>
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <Link
          href="/owner/dashboard"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-action"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al panel
        </Link>

        <div className="mb-8 mt-6">
          <p className="text-sm font-semibold text-action">
            Nueva solicitud
          </p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight text-foreground">
            Registrar restaurante
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Completa la información del establecimiento.
            Los datos serán revisados por nuestro equipo
            antes de que el restaurante pueda aparecer
            públicamente en GastroNic Tour.
          </p>
        </div>

        <RestaurantRequestForm />
      </div>
    </OwnerLayout>
  );
}