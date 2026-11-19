'use client';

import { useMemo, useState, type ComponentType, type ReactNode } from 'react';
import {
  Activity,
  CheckCircle2,
  ChevronDown,
  Heart,
  Search,
  ShieldCheck,
  Store,
  User,
  UserRoundCheck,
  Users,
} from 'lucide-react';

export interface AdminUserItem {
  id: string;
  full_name: string;
  username: string | null;
  avatar_path: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
  roles: string[];
  restaurants_count: number;
  approved_restaurants_count: number;
  reviews_count: number;
  visits_count: number;
  favorites_count: number;
}

interface Props {
  users: AdminUserItem[];
  adminCount: number;
  ownerCount: number;
  userCount: number;
}

type RoleFilter = 'all' | 'admin' | 'restaurant_owner' | 'user' | 'unassigned';
type ActivityFilter = 'all' | 'active' | 'owners' | 'inactive';
type OrderFilter = 'newest' | 'oldest' | 'activity' | 'restaurants' | 'name';

export function UsersManagement({
  users,
  adminCount,
  ownerCount,
  userCount,
}: Props) {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>('all');
  const [order, setOrder] = useState<OrderFilter>('newest');

  const usersWithoutRole = users.filter((user) => user.roles.length === 0).length;

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();

    const result = users.filter((user) => {
      const roleMatch =
        roleFilter === 'all' ||
        (roleFilter === 'unassigned' && user.roles.length === 0) ||
        user.roles.includes(roleFilter);

      const activity = getActivityScore(user);

      const activityMatch =
        activityFilter === 'all' ||
        (activityFilter === 'active' && activity > 0) ||
        (activityFilter === 'inactive' && activity === 0) ||
        (activityFilter === 'owners' && user.restaurants_count > 0);

      const searchMatch =
        !term ||
        user.full_name.toLowerCase().includes(term) ||
        user.username?.toLowerCase().includes(term) ||
        user.id.toLowerCase().includes(term);

      return roleMatch && activityMatch && searchMatch;
    });

    return [...result].sort((a, b) => {
      if (order === 'oldest') {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }

      if (order === 'activity') {
        return getActivityScore(b) - getActivityScore(a);
      }

      if (order === 'restaurants') {
        return b.restaurants_count - a.restaurants_count;
      }

      if (order === 'name') {
        return getDisplayName(a).localeCompare(getDisplayName(b), 'es');
      }

      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [users, search, roleFilter, activityFilter, order]);

  const assignedUsers = users.length - usersWithoutRole;

  return (
    <div className="space-y-5">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={Users}
          label="Perfiles"
          value={users.length}
          description="Cuentas registradas"
          tone="slate"
        />
        <MetricCard
          icon={User}
          label="Usuarios"
          value={userCount}
          description="Con rol estándar"
          tone="blue"
        />
        <MetricCard
          icon={Store}
          label="Propietarios"
          value={ownerCount}
          description="Con acceso Business"
          tone="teal"
        />
        <MetricCard
          icon={ShieldCheck}
          label="Administradores"
          value={adminCount}
          description="Con acceso Admin"
          tone="purple"
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="rounded-2xl border border-border/70 bg-white px-5 py-4 shadow-none">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.08em] text-action">
                Estado del directorio
              </p>
              <p className="mt-1 text-sm font-bold text-ink">
                Asignación de roles
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <StatusChip label="Con rol" value={assignedUsers} tone="green" />
              <StatusChip label="Sin rol" value={usersWithoutRole} tone="amber" />
            </div>
          </div>

          <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#EEF2F1]">
            <div
              className="h-full rounded-full bg-action transition-all"
              style={{
                width: `${users.length > 0 ? (assignedUsers / users.length) * 100 : 0}%`,
              }}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-border/70 bg-white px-5 py-4 shadow-none">
          <p className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">
            Directorio actual
          </p>
          <div className="mt-2 flex items-end justify-between gap-4">
            <div>
              <p className="text-2xl font-bold tracking-[-0.04em] text-ink">
                {filteredUsers.length}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {filteredUsers.length === 1 ? 'perfil visible' : 'perfiles visibles'}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/[0.08] text-action">
              <Users className="h-4 w-4" />
            </div>
          </div>
        </div>
      </section>

      {usersWithoutRole > 0 && (
        <section className="flex items-start gap-3 rounded-2xl border border-warning/25 bg-amber-50/80 px-4 py-3.5">
          <div className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-warning-soft text-warning">
            <UserRoundCheck className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-bold text-amber-900">
              {usersWithoutRole === 1
                ? 'Hay 1 perfil sin rol asignado'
                : `Hay ${usersWithoutRole} perfiles sin rol asignado`}
            </p>
            <p className="mt-1 text-xs leading-5 text-amber-800/80">
              Estos perfiles existen, pero no tienen ninguna asignación registrada en user_roles.
            </p>
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-border/70 bg-white p-4 shadow-none">
        <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_180px_180px_180px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por nombre, usuario o ID..."
              className="h-11 w-full rounded-xl border border-border bg-canvas pl-10 pr-4 text-sm text-ink outline-none transition placeholder:text-muted-foreground/70 focus:border-primary/30 focus:bg-white focus:ring-4 focus:ring-primary/[0.06]"
            />
          </div>

          <SelectField value={roleFilter} onChange={(value) => setRoleFilter(value as RoleFilter)}>
            <option value="all">Todos los roles</option>
            <option value="user">Usuarios</option>
            <option value="restaurant_owner">Propietarios</option>
            <option value="admin">Administradores</option>
            <option value="unassigned">Sin rol</option>
          </SelectField>

          <SelectField
            value={activityFilter}
            onChange={(value) => setActivityFilter(value as ActivityFilter)}
          >
            <option value="all">Toda actividad</option>
            <option value="active">Con actividad</option>
            <option value="owners">Con restaurantes</option>
            <option value="inactive">Sin actividad</option>
          </SelectField>

          <SelectField value={order} onChange={(value) => setOrder(value as OrderFilter)}>
            <option value="newest">Más recientes</option>
            <option value="oldest">Más antiguos</option>
            <option value="activity">Más activos</option>
            <option value="restaurants">Más restaurantes</option>
            <option value="name">Nombre A–Z</option>
          </SelectField>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-border/70 bg-white shadow-none">
        <div className="flex flex-col gap-2 border-b border-border/60 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-action">
              Directorio
            </p>
            <h2 className="mt-1 text-base font-bold text-ink">Usuarios registrados</h2>
          </div>
          <p className="text-xs text-muted-foreground">
            {filteredUsers.length} {filteredUsers.length === 1 ? 'resultado' : 'resultados'}
          </p>
        </div>

        {filteredUsers.length === 0 ? (
          <EmptyUsers />
        ) : (
          <>
            <div className="hidden xl:block">
              <div className="grid grid-cols-[minmax(250px,1.4fr)_minmax(170px,0.8fr)_190px_155px_145px_94px] items-center gap-4 border-b border-border/60 bg-canvas px-6 py-3">
                <TableHeading>Usuario</TableHeading>
                <TableHeading>Roles</TableHeading>
                <TableHeading>Actividad</TableHeading>
                <TableHeading>Restaurantes</TableHeading>
                <TableHeading>Registro</TableHeading>
                <TableHeading align="right">ID</TableHeading>
              </div>

              <div className="divide-y divide-border/60">
                {filteredUsers.map((user) => (
                  <DesktopUserRow key={user.id} user={user} />
                ))}
              </div>
            </div>

            <div className="divide-y divide-border/60 xl:hidden">
              {filteredUsers.map((user) => (
                <CompactUserCard key={user.id} user={user} />
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}

function DesktopUserRow({ user }: { user: AdminUserItem }) {
  return (
    <article className="grid grid-cols-[minmax(250px,1.4fr)_minmax(170px,0.8fr)_190px_155px_145px_94px] items-center gap-4 px-6 py-4 transition hover:bg-canvas">
      <div className="flex min-w-0 items-center gap-3">
        <UserAvatar user={user} />
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-ink">{getDisplayName(user)}</p>
          <p className="mt-1 truncate text-xs text-muted-foreground">
            {user.username ? `@${user.username}` : 'Sin nombre de usuario'}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <UserRoles roles={user.roles} />
      </div>

      <div className="flex items-center gap-2">
        <ActivityMini icon={Activity} label="Visitas" value={user.visits_count} />
        <ActivityMini icon={User} label="Reseñas" value={user.reviews_count} />
        <ActivityMini icon={Heart} label="Favoritos" value={user.favorites_count} />
      </div>

      <div>
        <p className="text-sm font-bold text-ink">{user.restaurants_count}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {user.approved_restaurants_count} publicados
        </p>
      </div>

      <div>
        <p className="text-xs font-semibold text-ink">{formatDate(user.created_at)}</p>
        <p className="mt-1 text-xs text-muted-foreground">{getAccountAge(user.created_at)}</p>
      </div>

      <div className="flex justify-end">
        <span
          title={`ID completo: ${user.id}`}
          className="rounded-lg bg-surface-2 px-2.5 py-2 font-mono text-xs font-bold text-[#48605D]"
        >
          {user.id.slice(0, 8)}
        </span>
      </div>
    </article>
  );
}

function CompactUserCard({ user }: { user: AdminUserItem }) {
  return (
    <article className="p-5">
      <div className="flex items-start gap-3">
        <UserAvatar user={user} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-ink">{getDisplayName(user)}</p>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {user.username ? `@${user.username}` : 'Sin nombre de usuario'}
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <UserRoles roles={user.roles} />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <MobileMetric label="Restaurantes" value={user.restaurants_count} />
        <MobileMetric label="Visitas" value={user.visits_count} />
        <MobileMetric label="Reseñas" value={user.reviews_count} />
        <MobileMetric label="Favoritos" value={user.favorites_count} />
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">Registro</p>
          <p className="mt-1 text-xs font-semibold text-ink">{formatDate(user.created_at)}</p>
        </div>
        <span className="rounded-lg bg-surface-2 px-2.5 py-2 font-mono text-xs font-bold text-[#48605D]">
          {user.id.slice(0, 8)}
        </span>
      </div>
    </article>
  );
}

function UserAvatar({ user }: { user: AdminUserItem }) {
  const name = getDisplayName(user);
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();

  return (
    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-ink text-xs font-bold text-white">
      {initials || <User className="h-4 w-4" />}
    </div>
  );
}

function UserRoles({ roles }: { roles: string[] }) {
  if (roles.length === 0) return <RoleBadge role="unassigned" />;

  return (
    <>
      {roles.map((role) => (
        <RoleBadge key={role} role={role} />
      ))}
    </>
  );
}

function RoleBadge({ role }: { role: string }) {
  const config: Record<string, { label: string; className: string }> = {
    admin: {
      label: 'Administrador',
      className: 'border-violet-200 bg-violet-50 text-violet-700',
    },
    restaurant_owner: {
      label: 'Propietario',
      className: 'border-teal-200 bg-teal-50 text-teal-700',
    },
    user: {
      label: 'Usuario',
      className: 'border-slate-200 bg-slate-50 text-slate-600',
    },
    unassigned: {
      label: 'Sin rol',
      className: 'border-warning/25 bg-warning-soft text-warning',
    },
  };

  const current = config[role] ?? {
    label: role,
    className: 'border-slate-200 bg-slate-50 text-slate-600',
  };

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-bold ${current.className}`}>
      {current.label}
    </span>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  description,
  tone,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: number;
  description: string;
  tone: 'slate' | 'blue' | 'teal' | 'purple';
}) {
  const toneClass = {
    slate: 'bg-slate-100 text-slate-600',
    blue: 'bg-sky-50 text-sky-700',
    teal: 'bg-primary/[0.08] text-action',
    purple: 'bg-violet-50 text-violet-700',
  }[tone];

  return (
    <div className="rounded-2xl border border-border/70 bg-white p-4 shadow-none sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">{label}</p>
          <p className="mt-2 text-2xl font-bold tracking-[-0.045em] text-ink">{value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        </div>
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${toneClass}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}

function StatusChip({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: 'green' | 'amber';
}) {
  const className =
    tone === 'green'
      ? 'border-success/25 bg-success-soft text-success'
      : 'border-warning/25 bg-warning-soft text-warning';

  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold ${className}`}>
      <span>{value}</span>
      <span className="font-semibold opacity-80">{label}</span>
    </span>
  );
}

function ActivityMini({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: number;
}) {
  return (
    <div title={label} className="flex min-w-[48px] items-center gap-1.5 rounded-lg bg-surface-2 px-2 py-2">
      <Icon className="h-3.5 w-3.5 text-action" />
      <span className="text-xs font-bold text-ink">{value}</span>
    </div>
  );
}

function MobileMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-surface-2 px-3 py-3">
      <p className="text-base font-bold text-ink">{value}</p>
      <p className="mt-1 text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">{label}</p>
    </div>
  );
}

function SelectField({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full appearance-none rounded-xl border border-border bg-canvas px-4 pr-10 text-xs font-semibold text-ink outline-none transition focus:border-primary/30 focus:bg-white focus:ring-4 focus:ring-primary/[0.06]"
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
}

function TableHeading({
  children,
  align = 'left',
}: {
  children: ReactNode;
  align?: 'left' | 'right';
}) {
  return (
    <p className={`text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground ${align === 'right' ? 'text-right' : ''}`}>
      {children}
    </p>
  );
}

function EmptyUsers() {
  return (
    <div className="flex min-h-[320px] items-center justify-center p-8 text-center">
      <div className="max-w-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
          <Search className="h-5 w-5 text-action" />
        </div>
        <h3 className="mt-4 text-base font-bold text-ink">No encontramos usuarios</h3>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Prueba con otro nombre, identificador o combinación de filtros.
        </p>
      </div>
    </div>
  );
}

function getDisplayName(user: AdminUserItem) {
  const cleanName = user.full_name.trim();
  if (cleanName) return cleanName;
  if (user.username) return user.username;
  return 'Usuario sin nombre';
}

function getActivityScore(user: AdminUserItem) {
  return user.restaurants_count + user.reviews_count + user.visits_count + user.favorites_count;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('es-NI', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

function getAccountAge(value: string) {
  const created = new Date(value);
  const now = new Date();
  const days = Math.floor(Math.max(0, now.getTime() - created.getTime()) / 86_400_000);

  if (days < 1) return 'Hoy';
  if (days < 30) return `${days} ${days === 1 ? 'día' : 'días'}`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months} ${months === 1 ? 'mes' : 'meses'}`;

  const years = Math.floor(months / 12);
  return `${years} ${years === 1 ? 'año' : 'años'}`;
}
