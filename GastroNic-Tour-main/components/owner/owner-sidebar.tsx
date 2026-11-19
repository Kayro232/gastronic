'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import {
  BarChart3,
  CalendarDays,
  ClipboardList,
  LayoutDashboard,
  MessageSquareText,
  Settings,
  Store,
} from 'lucide-react';

import {
  DashboardSidebar,
  type DashboardNavSection,
} from '@/components/dashboard/dashboard-sidebar';

interface OwnerSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const sections: DashboardNavSection[] = [
  {
    label: 'Resumen',
    items: [
      { label: 'Dashboard', href: '/owner/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Gestión',
    items: [
      { label: 'Mis restaurantes', href: '/owner/restaurants', icon: Store },
      /*
       * Pendiente de decisión: /owner/applications no existe como
       * ruta (lleva a 404). Se conserva tal como estaba.
       */
      { label: 'Solicitudes', href: '/owner/applications', icon: ClipboardList },
      { label: 'Reservaciones', href: '/owner/reservations', icon: CalendarDays },
      { label: 'Reseñas', href: '/owner/reviews', icon: MessageSquareText },
    ],
  },
  {
    label: 'Análisis',
    items: [
      { label: 'Estadísticas', href: '/owner/analytics', icon: BarChart3 },
    ],
  },
];

/*
 * Portal de restaurantes. La presentación vive en
 * DashboardSidebar (GastroNic DS); aquí solo quedan las
 * secciones y la regla de página activa, sin cambios.
 */
export function OwnerSidebar({
  isOpen = false,
  onClose,
}: OwnerSidebarProps) {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === '/owner/dashboard') {
      return pathname === href;
    }

    return pathname.startsWith(href);
  }

  return (
    <DashboardSidebar
      homeHref="/owner/dashboard"
      areaLabel="Restaurantes"
      areaTone="action"
      sections={sections}
      isActive={isActive}
      isOpen={isOpen}
      onClose={onClose}
      footer={
        <Link
          href="/owner/settings"
          onClick={onClose}
          aria-current={pathname.startsWith('/owner/settings') ? 'page' : undefined}
          className="flex h-11 items-center gap-2 rounded-control px-3 text-sm font-medium text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink"
        >
          <Settings className="size-4" aria-hidden="true" />
          Configuración de la cuenta
        </Link>
      }
    />
  );
}
