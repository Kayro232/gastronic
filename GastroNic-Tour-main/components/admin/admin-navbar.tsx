'use client';

import { useEffect, useRef, useState } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import {
  ChevronDown,
  LogOut,
  Menu,
  ShieldCheck,
  User,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

interface AdminNavbarProps {
  onMenuClick?: () => void;
}

interface AdminProfile {
  full_name: string | null;
  username: string | null;
}

export function AdminNavbar({ onMenuClick }: AdminNavbarProps) {
  const router = useRouter();
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data } = await supabase
        .from('profiles')
        .select('full_name, username')
        .eq('id', user.id)
        .maybeSingle();

      setProfile((data ?? null) as AdminProfile | null);
    }

    loadProfile();
  }, []);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  async function handleLogout() {
    setMenuOpen(false);
    await supabase.auth.signOut();
    router.replace('/auth/login');
    router.refresh();
  }

  const displayName =
    profile?.full_name?.trim() || profile?.username || 'Administrador';

  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur-md">
      <div className="flex h-[var(--header-h)] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="flex-shrink-0 rounded-full lg:hidden"
            onClick={onMenuClick}
            aria-label="Abrir menú de administración"
          >
            <Menu className="size-5" aria-hidden="true" />
          </Button>

          <p className="truncate font-display text-[17px] font-semibold text-ink">
            Centro de operaciones
          </p>
        </div>

        <div ref={menuRef} className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((current) => !current)}
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            aria-label={`Cuenta de ${displayName}`}
            className={`flex h-11 items-center gap-2.5 rounded-full border pl-1 pr-2.5 transition-colors duration-150 ${
              menuOpen
                ? 'border-action/30 bg-action-soft'
                : 'border-line bg-white hover:border-line-strong'
            }`}
          >
            <span className="flex size-9 flex-shrink-0 items-center justify-center rounded-full bg-ink text-xs font-semibold text-white">
              {initials || <ShieldCheck className="size-4" aria-hidden="true" />}
            </span>

            <span className="hidden max-w-[180px] text-left md:block">
              <span className="block truncate text-sm font-semibold leading-tight text-ink">{displayName}</span>
              <span className="block truncate text-xs text-ink-muted">Administrador</span>
            </span>

            <ChevronDown
              className={`hidden size-4 text-ink-muted transition-transform duration-150 md:block ${
                menuOpen ? 'rotate-180' : ''
              }`}
              aria-hidden="true"
            />
          </button>

          {menuOpen && (
            <div
              role="menu"
              aria-label="Tu cuenta"
              className="absolute right-0 top-[calc(100%+10px)] z-10 w-64 overflow-hidden rounded-card border border-line bg-white shadow-overlay"
            >
              <div className="border-b border-line px-4 py-3">
                <p className="truncate text-sm font-semibold text-ink">{displayName}</p>
                {profile?.username && (
                  <p className="truncate text-[13px] text-ink-muted">@{profile.username}</p>
                )}
              </div>

              <div className="p-1.5">
                <Link
                  href="/profile"
                  role="menuitem"
                  onClick={() => setMenuOpen(false)}
                  className="flex h-11 items-center gap-3 rounded-control px-3 text-sm font-medium text-ink transition-colors hover:bg-surface-2"
                >
                  <User className="size-[18px] text-ink-muted" aria-hidden="true" />
                  Mi perfil personal
                </Link>

                <button
                  type="button"
                  role="menuitem"
                  onClick={handleLogout}
                  className="flex h-11 w-full items-center gap-3 rounded-control px-3 text-left text-sm font-medium text-danger transition-colors hover:bg-danger-soft"
                >
                  <LogOut className="size-[18px]" aria-hidden="true" />
                  Cerrar sesión
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
