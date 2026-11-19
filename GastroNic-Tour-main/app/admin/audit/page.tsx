import Link from 'next/link';
import { redirect } from 'next/navigation';

import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  FileClock,
  ShieldCheck,
} from 'lucide-react';

import { AdminLayout } from '@/components/admin/admin-layout';
import { AuditLogViewer } from '@/components/admin/audit-log-viewer';
import { createClient } from '@/lib/supabase/server';

import type { AuditLogItem } from '@/types/admin-audit';

interface RawAuditLog {
  id: number;
  actor_id: string | null;
  action: string;
  table_name: string;
  record_id: string | null;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  created_at: string;
}

interface ProfileRow {
  id: string;
  full_name: string;
  username: string | null;
}

type DateFilter = 'today' | '7d' | '30d' | 'all';

interface PageProps {
  searchParams: Promise<{
    page?: string;
    period?: string;
  }>;
}

const PAGE_SIZE = 50;

export default async function AdminAuditPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const resolvedSearchParams = await searchParams;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login');

  const { data: adminRole, error: roleError } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .eq('role', 'admin')
    .maybeSingle();

  if (roleError) {
    console.error('Error verificando rol admin:', roleError);
  }

  if (!adminRole) redirect('/');

  const period = normalizePeriod(resolvedSearchParams.period);
  const requestedPage = Number.parseInt(resolvedSearchParams.page ?? '1', 10);
  const currentPage =
    Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;

  const from = (currentPage - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  const dateFrom = getDateFromPeriod(period);

  let auditQuery = supabase
    .from('audit_logs')
    .select(
      `
        id,
        actor_id,
        action,
        table_name,
        record_id,
        old_data,
        new_data,
        created_at
      `,
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(from, to);

  if (dateFrom) {
    auditQuery = auditQuery.gte('created_at', dateFrom);
  }

  const { data: logsData, error: logsError, count } = await auditQuery;

  if (logsError) {
    console.error('Error cargando auditoría:', logsError);
  }

  const rawLogs = (logsData ?? []) as RawAuditLog[];
  const totalEvents = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalEvents / PAGE_SIZE));

  if (currentPage > totalPages && totalEvents > 0) {
    redirect(buildAuditUrl(totalPages, period));
  }

  const actorIds = [
    ...new Set(
      rawLogs
        .map((log) => log.actor_id)
        .filter((actorId): actorId is string => Boolean(actorId))
    ),
  ];

  let profiles: ProfileRow[] = [];
  let profilesError: unknown = null;

  if (actorIds.length > 0) {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, username')
      .in('id', actorIds);

    if (error) {
      profilesError = error;
      console.error('Error cargando actores de auditoría:', error);
    }

    profiles = (data ?? []) as ProfileRow[];
  }

  const profilesMap = new Map(profiles.map((profile) => [profile.id, profile]));

  const logs: AuditLogItem[] = rawLogs.map((log) => ({
    ...log,
    actor: log.actor_id ? profilesMap.get(log.actor_id) ?? null : null,
  }));

  const hasLoadWarning = Boolean(logsError || profilesError);

  return (
    <AdminLayout>
      <div className="min-h-screen bg-surface-2">
        <div className="mx-auto max-w-[1480px] px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
          <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.08em] text-action">
                <ShieldCheck className="h-3.5 w-3.5" />
                Trazabilidad del sistema
              </div>

              <h1 className="text-3xl font-bold tracking-[-0.045em] text-ink sm:text-[38px]">
                Auditoría
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Revisa quién realizó cada operación, sobre qué registro ocurrió y qué información cambió.
              </p>
            </div>

            <div className="flex w-fit items-center gap-3 rounded-xl border border-border/70 bg-white px-4 py-3 shadow-none">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/[0.08] text-action">
                <FileClock className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">
                  Historial del período
                </p>
                <p className="mt-0.5 text-xs font-bold text-ink">
                  {totalEvents} {totalEvents === 1 ? 'evento' : 'eventos'}
                </p>
              </div>
            </div>
          </header>

          {hasLoadWarning && (
            <div className="mt-6 flex items-start gap-3 rounded-2xl border border-warning/25 bg-warning-soft px-4 py-3.5 text-sm text-warning">
              <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <p>
                Parte del historial de auditoría no pudo cargarse correctamente. Los datos visibles pueden estar incompletos.
              </p>
            </div>
          )}

          <section className="mt-7 flex flex-col gap-4 rounded-2xl border border-border/70 bg-white px-4 py-4 shadow-none sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.08em] text-action">
                Período del historial
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                El filtro se aplica antes de paginar los registros de auditoría.
              </p>
            </div>

            <div className="grid grid-cols-4 gap-1 rounded-xl bg-[#F1F4F3] p-1">
              <PeriodButton period="today" currentPeriod={period} label="Hoy" />
              <PeriodButton period="7d" currentPeriod={period} label="7 días" />
              <PeriodButton period="30d" currentPeriod={period} label="30 días" />
              <PeriodButton period="all" currentPeriod={period} label="Todo" />
            </div>
          </section>

          <div className="mt-5">
            <AuditLogViewer logs={logs} totalEvents={totalEvents} />
          </div>

          <section className="mt-5 flex flex-col gap-4 rounded-2xl border border-border/70 bg-white px-5 py-4 shadow-none sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold text-ink">
                Página {currentPage} de {totalPages}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Hasta {PAGE_SIZE} eventos por página.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {currentPage > 1 ? (
                <Link
                  href={buildAuditUrl(currentPage - 1, period)}
                  className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-white px-4 text-xs font-bold text-muted-foreground transition hover:border-primary/20 hover:text-action"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Anterior
                </Link>
              ) : (
                <span className="inline-flex h-10 cursor-not-allowed items-center gap-2 rounded-xl border border-border bg-slate-50 px-4 text-xs font-bold text-muted-foreground/40">
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Anterior
                </span>
              )}

              <PageNumbers currentPage={currentPage} totalPages={totalPages} period={period} />

              {currentPage < totalPages ? (
                <Link
                  href={buildAuditUrl(currentPage + 1, period)}
                  className="inline-flex h-10 items-center gap-2 rounded-xl bg-ink px-4 text-xs font-bold text-white transition hover:bg-action"
                >
                  Siguiente
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              ) : (
                <span className="inline-flex h-10 cursor-not-allowed items-center gap-2 rounded-xl bg-slate-100 px-4 text-xs font-bold text-muted-foreground/40">
                  Siguiente
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              )}
            </div>
          </section>
        </div>
      </div>
    </AdminLayout>
  );
}

function PeriodButton({
  period,
  currentPeriod,
  label,
}: {
  period: DateFilter;
  currentPeriod: DateFilter;
  label: string;
}) {
  const active = period === currentPeriod;

  return (
    <Link
      href={buildAuditUrl(1, period)}
      className={`flex h-9 items-center justify-center rounded-lg px-3 text-xs font-bold transition ${
        active
          ? 'bg-white text-ink shadow-sm'
          : 'text-muted-foreground hover:text-ink'
      }`}
    >
      {label}
    </Link>
  );
}

function PageNumbers({
  currentPage,
  totalPages,
  period,
}: {
  currentPage: number;
  totalPages: number;
  period: DateFilter;
}) {
  if (totalPages <= 1) return null;

  const pages = getVisiblePages(currentPage, totalPages);

  return (
    <div className="hidden items-center gap-1 md:flex">
      {pages.map((page) => {
        const active = page === currentPage;

        return (
          <Link
            key={page}
            href={buildAuditUrl(page, period)}
            className={`flex h-10 min-w-10 items-center justify-center rounded-xl px-3 text-xs font-bold transition ${
              active
                ? 'bg-primary/[0.09] text-action'
                : 'text-muted-foreground hover:bg-[#F1F4F3] hover:text-ink'
            }`}
          >
            {page}
          </Link>
        );
      })}
    </div>
  );
}

function normalizePeriod(value: string | undefined): DateFilter {
  if (value === 'today' || value === '7d' || value === '30d' || value === 'all') {
    return value;
  }

  return '30d';
}

function getDateFromPeriod(period: DateFilter) {
  const now = new Date();

  if (period === 'all') return null;

  if (period === 'today') {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    return start.toISOString();
  }

  const start = new Date(now);
  start.setDate(start.getDate() - (period === '7d' ? 7 : 30));
  return start.toISOString();
}

function buildAuditUrl(page: number, period: DateFilter) {
  return `/admin/audit?page=${page}&period=${period}`;
}

function getVisiblePages(currentPage: number, totalPages: number) {
  const start = Math.max(1, currentPage - 2);
  const end = Math.min(totalPages, start + 4);
  const adjustedStart = Math.max(1, end - 4);

  return Array.from(
    { length: end - adjustedStart + 1 },
    (_, index) => adjustedStart + index
  );
}
