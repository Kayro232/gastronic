'use client';

import { useEffect, type ReactNode } from 'react';

import Image from 'next/image';
import Link from 'next/link';

import { ChevronLeft, X, type LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

/*
 * GastroNic DS · Barra lateral de paneles (etapa 3)
 *
 * Estructura común para el portal de restaurantes y la consola
 * de administración. Cada panel aporta sus secciones, su regla
 * de "activo" y su pie; la presentación es la misma, y el área
 * se distingue con una etiqueta de color.
 */

export interface DashboardNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export interface DashboardNavSection {
  label: string;
  items: readonly DashboardNavItem[];
}

interface DashboardSidebarProps {
  homeHref: string;
  areaLabel: string;
  areaTone: 'action' | 'maiz';
  sections: readonly DashboardNavSection[];
  isActive: (href: string) => boolean;
  isOpen: boolean;
  onClose?: () => void;
  footer?: ReactNode;
}

export function DashboardSidebar({
  homeHref,
  areaLabel,
  areaTone,
  sections,
  isActive,
  isOpen,
  onClose,
  footer,
}: DashboardSidebarProps) {
  /* Escape cierra el menú en celular y tableta */
  useEffect(() => {
    if (!isOpen || !onClose) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose?.();
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  return (
    <>
      {isOpen && (
        <button
          type="button"
          onClick={onClose}
          tabIndex={-1}
          aria-label="Cerrar menú"
          className="fixed inset-0 z-40 cursor-default bg-ink/40 lg:hidden"
        />
      )}

      <aside
        aria-label={`Navegación de ${areaLabel}`}
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-[264px] flex-col border-r border-line bg-white',
          'transition-transform duration-200 ease-(--ease-standard)',
          'lg:sticky lg:top-0 lg:h-screen lg:flex-shrink-0 lg:translate-x-0',
          isOpen ? 'translate-x-0 shadow-modal' : '-translate-x-full'
        )}
      >
        {/* Marca y área */}
        <div className="flex h-[var(--header-h)] flex-shrink-0 items-center justify-between gap-2 border-b border-line px-4">
          <Link href={homeHref} onClick={onClose} className="flex min-w-0 items-center gap-2.5 rounded-control">
            <span className="flex size-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-control border border-line bg-white">
              <Image src="/logo.jpeg" alt="" width={36} height={36} className="h-full w-full object-contain p-0.5" />
            </span>

            <span className="min-w-0">
              <span className="block font-display text-[15px] font-semibold leading-tight text-ink">
                GastroNic Tour
              </span>
              <span
                className={cn(
                  'mt-0.5 inline-flex rounded-full px-2 py-px text-xs font-semibold',
                  areaTone === 'maiz'
                    ? 'bg-maiz-soft text-maiz-ink'
                    : 'bg-action-soft text-action'
                )}
              >
                {areaLabel}
              </span>
            </span>
          </Link>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar menú"
              className="flex size-11 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink lg:hidden"
            >
              <X className="size-5" aria-hidden="true" />
            </button>
          )}
        </div>

        {/* Secciones */}
        <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-5 [scrollbar-width:thin]">
          <div className="space-y-6">
            {sections.map((section) => (
              <div key={section.label}>
                <h2 className="mb-1.5 px-3 text-overline text-ink-muted">{section.label}</h2>

                <ul className="space-y-0.5">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.href);

                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={onClose}
                          aria-current={active ? 'page' : undefined}
                          className={cn(
                            'relative flex h-11 items-center gap-3 rounded-control px-3 text-sm transition-colors duration-150',
                            active
                              ? 'bg-action-soft font-semibold text-action before:absolute before:inset-y-2.5 before:left-0 before:w-[3px] before:rounded-full before:bg-action'
                              : 'font-medium text-ink-muted hover:bg-surface-2 hover:text-ink'
                          )}
                        >
                          <Icon className="size-[18px] flex-shrink-0" aria-hidden="true" />
                          <span className="min-w-0 flex-1 truncate">{item.label}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </nav>

        {/* Pie */}
        <div className="flex-shrink-0 space-y-2 border-t border-line p-3">
          {footer}

          <Link
            href="/"
            className="flex h-11 items-center gap-2 rounded-control px-3 text-sm font-medium text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink"
          >
            <ChevronLeft className="size-4" aria-hidden="true" />
            Volver a GastroNic
          </Link>
        </div>
      </aside>
    </>
  );
}
