import type { Metadata } from 'next';
import Link from 'next/link';

import { Compass, Map, Route, Sparkles, UtensilsCrossed } from 'lucide-react';

import { PlateNumber, RouteState } from '@/components/common/route-state';
import { MainLayout } from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Página no encontrada',
};

/*
 * 404 de GastroNic (etapa 3): en español, con la estructura de
 * navegación completa y caminos de salida concretos.
 */
export default function NotFound() {
  return (
    <MainLayout>
      <RouteState
        visual={<PlateNumber icon={UtensilsCrossed} />}
        eyebrow="Error 404"
        title="Este plato no está en el menú"
        description="La página que buscas no existe o cambió de dirección. Revisa el enlace o sigue descubriendo lugares para comer en Nicaragua."
        actions={
          <>
            <Button asChild size="lg">
              <Link href="/explore">
                <Compass aria-hidden="true" />
                Explorar restaurantes
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/home">Ir al inicio</Link>
            </Button>
          </>
        }
        suggestions={[
          { href: '/home#mapa', label: 'Ver el mapa', icon: Map },
          { href: '/home#rutas', label: 'Rutas gastronómicas', icon: Route },
          { href: '/recommendations', label: 'Recomendaciones', icon: Sparkles },
        ]}
      />
    </MainLayout>
  );
}
