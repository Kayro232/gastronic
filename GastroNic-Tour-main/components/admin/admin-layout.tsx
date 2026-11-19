'use client';

import { useState } from 'react';

import { AdminNavbar } from '@/components/admin/admin-navbar';
import { AdminSidebar } from '@/components/admin/admin-sidebar';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-canvas">
      <div className="flex min-h-screen">
        <AdminSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <div className="min-w-0 flex-1">
          <AdminNavbar onMenuClick={() => setSidebarOpen(true)} />

          <main id="contenido" className="min-h-[calc(100vh-var(--header-h))]">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
