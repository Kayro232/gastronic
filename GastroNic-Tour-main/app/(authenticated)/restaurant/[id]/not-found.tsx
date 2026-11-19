import Link from 'next/link';

import { Compass, Heart, Map, SearchX, Sparkles } from 'lucide-react';

import { RouteState } from '@/components/common/route-state';
import { MainLayout } from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';

/*
 * Restaurante inexistente o no publicado (etapa 3).
 */
export default function RestaurantNotFound() {
  return (
    <MainLayout>
      <RouteState
        visual={
          <div aria-hidden="true" className="flex size-20 items-center justify-center rounded-sheet bg-action-soft text-action">
            <SearchX className="size-10" strokeWidth={1.75} />
          </div>
        }
        eyebrow="Restaurante no disponible"
        title="No encontramos este restaurante"
        description="Puede que ya no esté publicado en GastroNic o que el enlace esté incompleto. Hay otros lugares esperando en el mapa."
        actions={
          <>
            <Button asChild size="lg">
              <Link href="/explore">
                <Compass aria-hidden="true" />
                Explorar restaurantes
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/favorites">
                <Heart aria-hidden="true" />
                Mis favoritos
              </Link>
            </Button>
          </>
        }
        suggestions={[
          { href: '/home', label: 'Inicio', icon: Compass },
          { href: '/home#mapa', label: 'Ver el mapa', icon: Map },
          { href: '/recommendations', label: 'Recomendaciones', icon: Sparkles },
        ]}
      />
    </MainLayout>
  );
}
