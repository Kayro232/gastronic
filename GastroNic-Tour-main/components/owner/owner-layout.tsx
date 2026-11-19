'use client';

import { useState } from 'react';

import { OwnerNavbar } from '@/components/owner/owner-navbar';
import { OwnerSidebar } from '@/components/owner/owner-sidebar';

interface OwnerLayoutProps {
  children: React.ReactNode;
}

export function OwnerLayout({
  children,
}: OwnerLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-canvas">
      <div className="flex min-h-screen">
        <OwnerSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <div className="min-w-0 flex-1">
          <OwnerNavbar
            onMenuClick={() => setSidebarOpen(true)}
          />

          <main id="contenido" className="min-h-[calc(100vh-var(--header-h))]">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
