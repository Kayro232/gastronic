'use client';

import { usePathname } from 'next/navigation';

import {
  ClipboardCheck,
  FileText,
  LayoutDashboard,
  Store,
  Users,
} from 'lucide-react';

import {
  DashboardSidebar,
  type DashboardNavSection,
} from '@/components/dashboard/dashboard-sidebar';

interface AdminSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const sections: DashboardNavSection[] = [
  {
    label: 'Resumen',
    items: [
      { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Moderación',
    items: [
      { label: 'Solicitudes', href: '/admin/restaurants', icon: ClipboardCheck },
      { label: 'Restaurantes', href: '/admin/restaurants/all', icon: Store },
    ],
  },
  {
    label: 'Administración',
    items: [
      { label: 'Usuarios', href: '/admin/users', icon: Users },
      { label: 'Auditoría', href: '/admin/audit', icon: FileText },
    ],
  },
];

/*
 * Consola de administración. La presentación vive en
 * DashboardSidebar (GastroNic DS); aquí solo quedan las
 * secciones y la regla de página activa, sin cambios.
 */
export function AdminSidebar({
  isOpen = false,
  onClose,
}: AdminSidebarProps) {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === '/admin/dashboard') {
      return pathname === href;
    }

    if (href === '/admin/restaurants') {
      return pathname === '/admin/restaurants';
    }

    return pathname.startsWith(href);
  }

  return (
    <DashboardSidebar
      homeHref="/admin/dashboard"
      areaLabel="Administración"
      areaTone="maiz"
      sections={sections}
      isActive={isActive}
      isOpen={isOpen}
      onClose={onClose}
    />
  );
}
