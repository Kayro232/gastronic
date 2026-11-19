'use client';

import { useEffect, useState } from 'react';

import {
  AtSign,
  Edit2,
  LoaderCircle,
  Mail,
  MapPin,
  Quote,
  Save,
  Sparkles,
  Trophy,
  User,
  X,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

interface Profile {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_path: string | null;
  bio: string | null;
}

interface UserStats {
  user_id: string;
  points: number;
  level: number;
  reviews_count: number;
  visits_count: number;
  routes_completed: number;
}

function getInitials(name: string) {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) =>
      part.charAt(0).toUpperCase()
    )
    .join('');

  return initials || 'GT';
}

function getAvatarUrl(
  avatarPath: string | null
) {
  if (!avatarPath) {
    return null;
  }

  if (
    avatarPath.startsWith('http://') ||
    avatarPath.startsWith('https://')
  ) {
    return avatarPath;
  }

  return null;
}

export function UserProfile() {
  const [profile, setProfile] =
    useState<Profile | null>(null);

  const [stats, setStats] =
    useState<UserStats | null>(null);

  const [email, setEmail] =
    useState('');

  const [isLoading, setIsLoading] =
    useState(true);

  const [isEditing, setIsEditing] =
    useState(false);

  const [isSaving, setIsSaving] =
    useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState('');

  const [
    successMessage,
    setSuccessMessage,
  ] = useState('');

  const [fullName, setFullName] =
    useState('');

  const [username, setUsername] =
    useState('');

  const [bio, setBio] =
    useState('');

  useEffect(() => {
    async function loadProfile() {
      setIsLoading(true);
      setErrorMessage('');

      const {
        data: { user },
        error: userError,
      } =
        await supabase.auth.getUser();

      if (userError) {
        console.error(
          'Error obteniendo usuario:',
          userError
        );

        setErrorMessage(
          'No se pudo obtener tu sesión.'
        );

        setIsLoading(false);
        return;
      }

      if (!user) {
        setErrorMessage(
          'No hay una sesión activa.'
        );

        setIsLoading(false);
        return;
      }

      setEmail(user.email ?? '');

      const [
        profileResult,
        statsResult,
      ] = await Promise.all([
        supabase
          .from('profiles')
          .select(`
            id,
            full_name,
            username,
            avatar_path,
            bio
          `)
          .eq('id', user.id)
          .maybeSingle(),

        supabase
          .from('user_stats')
          .select(`
            user_id,
            points,
            level,
            reviews_count,
            visits_count,
            routes_completed
          `)
          .eq('user_id', user.id)
          .maybeSingle(),
      ]);

      if (profileResult.error) {
        console.error(
          'Error cargando perfil:',
          profileResult.error
        );

        setErrorMessage(
          'No se pudo cargar tu perfil.'
        );

        setIsLoading(false);
        return;
      }

      const profileData =
        profileResult.data as Profile | null;

      const statsData =
        statsResult.error
          ? null
          : (statsResult.data as UserStats | null);

      if (statsResult.error) {
        console.error(
          'Error cargando estadísticas:',
          statsResult.error
        );
      }

      setProfile(profileData);
      setStats(statsData);

      setFullName(
        profileData?.full_name ?? ''
      );

      setUsername(
        profileData?.username ?? ''
      );

      setBio(
        profileData?.bio ?? ''
      );

      setIsLoading(false);
    }

    loadProfile();
  }, []);

  function handleCancelEdit() {
    setFullName(
      profile?.full_name ?? ''
    );

    setUsername(
      profile?.username ?? ''
    );

    setBio(
      profile?.bio ?? ''
    );

    setSuccessMessage('');
    setErrorMessage('');
    setIsEditing(false);
  }

  async function handleSaveProfile() {
    if (!profile) {
      return;
    }

    const cleanFullName =
      fullName.trim();

    const cleanUsername =
      username
        .trim()
        .toLowerCase();

    const cleanBio =
      bio.trim();

    if (!cleanFullName) {
      setErrorMessage(
        'El nombre no puede estar vacío.'
      );

      return;
    }

    if (
      cleanUsername &&
      cleanUsername.length < 3
    ) {
      setErrorMessage(
        'El nombre de usuario debe tener al menos 3 caracteres.'
      );

      return;
    }

    setIsSaving(true);
    setErrorMessage('');
    setSuccessMessage('');

    const { data, error } =
      await supabase
        .from('profiles')
        .update({
          full_name:
            cleanFullName,
          username:
            cleanUsername ||
            null,
          bio:
            cleanBio ||
            null,
          updated_at:
            new Date().toISOString(),
        })
        .eq('id', profile.id)
        .select(`
          id,
          full_name,
          username,
          avatar_path,
          bio
        `)
        .single();

    if (error) {
      console.error(
        'Error actualizando perfil:',
        error
      );

      if (
        error.code === '23505'
      ) {
        setErrorMessage(
          'Ese nombre de usuario ya está siendo utilizado.'
        );
      } else {
        setErrorMessage(
          'No se pudo actualizar el perfil.'
        );
      }

      setIsSaving(false);
      return;
    }

    setProfile(
      data as Profile
    );

    setSuccessMessage(
      'Perfil actualizado correctamente.'
    );

    setIsEditing(false);
    setIsSaving(false);
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[240px] sm:min-h-[320px] items-center justify-center rounded-card sm:rounded-sheet border border-border/70 bg-white shadow-none">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <LoaderCircle className="h-7 w-7 animate-spin text-action" />

          <p className="text-sm">
            Cargando tu perfil...
          </p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="rounded-card sm:rounded-sheet border border-danger/25 bg-red-50/60 p-8 text-center">
        <p className="text-sm text-danger">
          {errorMessage ||
            'No se encontró tu perfil.'}
        </p>
      </div>
    );
  }

  const displayName =
    profile.full_name ||
    profile.username ||
    'Usuario';

  const avatarUrl =
    getAvatarUrl(
      profile.avatar_path
    );

  const points =
    stats?.points ?? 0;

  const level =
    stats?.level ?? 1;

  const visits =
    stats?.visits_count ?? 0;

  const reviews =
    stats?.reviews_count ?? 0;

  const routesCompleted =
    stats?.routes_completed ?? 0;

  return (
    <section className="relative overflow-hidden rounded-card sm:rounded-sheet border border-border/70 bg-white shadow-raised">
      {/* Fondo decorativo */}


      <div className="relative z-10 p-4 sm:p-8 lg:p-10">
        {!isEditing ? (
          <>
            <div className="grid gap-5 sm:gap-8 lg:grid-cols-[auto_1fr_auto] lg:items-start">
              {/* Avatar */}
              <div className="flex justify-center lg:justify-start">
                <div className="relative">
                  <div className="rounded-card sm:rounded-sheet bg-gradient-to-br from-primary/20 to-secondary/20 p-1.5">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={displayName}
                        className="h-24 w-24 rounded-card object-cover sm:h-32 sm:w-32 sm:rounded-card"
                      />
                    ) : (
                      <div className="flex h-24 w-24 items-center justify-center rounded-card bg-ink sm:h-32 sm:w-32 sm:rounded-card">
                        <span className="text-2xl font-bold text-white sm:text-4xl">
                          {getInitials(
                            displayName
                          )}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="absolute -bottom-2 -right-2 flex h-9 w-9 items-center justify-center rounded-xl border-4 border-white bg-action text-white shadow-sm">
                    <Sparkles className="h-4 w-4" />
                  </div>
                </div>
              </div>

              {/* Info */}
              <div className="min-w-0 text-center lg:text-left">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                  <h1 className="break-words text-2xl font-bold tracking-[-0.03em] text-ink sm:text-4xl lg:truncate">
                    {displayName}
                  </h1>

                  <div className="mx-auto inline-flex w-fit items-center gap-1.5 rounded-full bg-primary/[0.08] px-3 py-1.5 text-xs font-bold text-action lg:mx-0">
                    <Trophy className="h-3.5 w-3.5" />

                    Nivel {level}
                  </div>
                </div>

                <div className="mt-3 flex flex-col items-center gap-2 text-xs text-muted-foreground sm:flex-row sm:flex-wrap sm:justify-center sm:gap-x-5 sm:text-sm lg:justify-start">
                  {profile.username && (
                    <div className="flex items-center gap-1.5">
                      <AtSign className="h-4 w-4 text-action" />

                      {profile.username}
                    </div>
                  )}

                  {email && (
                    <div className="flex items-center gap-1.5">
                      <Mail className="h-4 w-4 text-action" />

                      <span className="break-all">{email}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-action" />

                    Nicaragua
                  </div>
                </div>

                {profile.bio ? (
                  <div className="mx-auto mt-4 max-w-2xl sm:mt-5 lg:mx-0">
                    <div className="flex items-start gap-3">
                      <Quote className="mt-1 h-4 w-4 flex-shrink-0 text-secondary" />

                      <p className="text-[13px] leading-6 text-muted-foreground sm:text-sm sm:leading-7">
                        {profile.bio}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="mt-4 text-[13px] leading-6 text-muted-foreground sm:mt-5 sm:text-sm">
                    Añade una biografía para contar un poco sobre tus gustos gastronómicos.
                  </p>
                )}
              </div>

              {/* Editar */}
              <div className="flex justify-center lg:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setErrorMessage('');
                    setSuccessMessage('');
                    setIsEditing(true);
                  }}
                  className="h-10 w-full rounded-xl bg-white sm:w-auto"
                >
                  <Edit2 className="mr-2 h-4 w-4" />
                  Editar perfil
                </Button>
              </div>
            </div>

            {/* Stats */}
            <div className="mt-6 grid grid-cols-2 gap-2.5 sm:mt-9 sm:grid-cols-3 sm:gap-3 lg:grid-cols-5">
              <ProfileStat
                label="Nivel"
                value={level.toString()}
              />

              <ProfileStat
                label="Puntos"
                value={points.toLocaleString(
                  'es-NI'
                )}
              />

              <ProfileStat
                label="Visitas"
                value={visits.toString()}
              />

              <ProfileStat
                label="Reseñas"
                value={reviews.toString()}
              />

              <ProfileStat
                label="Rutas"
                value={routesCompleted.toString()}
              />
            </div>

            {successMessage && (
              <div className="mt-6 rounded-xl border border-success/25 bg-success-soft px-4 py-3 text-sm text-success">
                {successMessage}
              </div>
            )}
          </>
        ) : (
          /* ==================================================== */
          /* EDIT MODE                                            */
          /* ==================================================== */

          <div className="mx-auto max-w-3xl">
            <div className="mb-6 sm:mb-8">
              <p className="text-xs font-bold uppercase tracking-[0.08em] text-action sm:text-xs sm:tracking-[0.08em]">
                Configuración de perfil
              </p>

              <h2 className="mt-1.5 text-2xl font-bold tracking-[-0.03em] text-ink sm:mt-2 sm:text-3xl">
                Edita tu información
              </h2>

              <p className="mt-2 text-sm text-muted-foreground">
                Actualiza los datos visibles en tu perfil de GastroNic.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
              <Field
                label="Nombre completo"
              >
                <input
                  id="profile-full-name"
                  type="text"
                  value={fullName}
                  onChange={(event) =>
                    setFullName(
                      event.target.value
                    )
                  }
                  disabled={isSaving}
                  className="h-11 w-full rounded-xl border border-border bg-canvas px-3.5 text-sm sm:h-12 sm:px-4 outline-none transition focus:border-primary/30 focus:bg-white focus:ring-4 focus:ring-primary/[0.06]"
                />
              </Field>

              <Field
                label="Nombre de usuario"
              >
                <div className="relative">
                  <AtSign className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                  <input
                    id="profile-username"
                    type="text"
                    value={username}
                    onChange={(event) =>
                      setUsername(
                        event.target.value
                      )
                    }
                    disabled={isSaving}
                    className="h-11 w-full rounded-xl border border-border bg-canvas pl-10 pr-3.5 text-sm sm:h-12 sm:pr-4 outline-none transition focus:border-primary/30 focus:bg-white focus:ring-4 focus:ring-primary/[0.06]"
                  />
                </div>
              </Field>
            </div>

            <div className="mt-5">
              <Field
                label="Correo electrónico"
                helper="El correo pertenece a tu cuenta de autenticación."
              >
                <input
                  type="email"
                  value={email}
                  disabled
                  className="h-11 w-full cursor-not-allowed rounded-xl border border-border bg-muted/60 px-3.5 text-sm sm:h-12 sm:px-4 text-muted-foreground"
                />
              </Field>
            </div>

            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between">
                <label
                  htmlFor="profile-bio"
                  className="text-sm font-semibold text-ink"
                >
                  Biografía
                </label>

                <span className="text-xs text-muted-foreground">
                  {bio.length}/300
                </span>
              </div>

              <textarea
                id="profile-bio"
                value={bio}
                onChange={(event) =>
                  setBio(
                    event.target.value
                  )
                }
                maxLength={300}
                rows={5}
                placeholder="Cuéntanos qué sabores, lugares o experiencias te gustan..."
                disabled={isSaving}
                className="w-full resize-none rounded-xl border border-border bg-canvas px-4 py-3 text-sm leading-6 outline-none transition focus:border-primary/30 focus:bg-white focus:ring-4 focus:ring-primary/[0.06]"
              />
            </div>

            {errorMessage && (
              <div className="mt-5 rounded-xl border border-danger/25 bg-danger-soft px-4 py-3 text-sm text-danger">
                {errorMessage}
              </div>
            )}

            <div className="mt-6 flex flex-col gap-2.5 sm:mt-7 sm:flex-row sm:gap-3">
              <Button
                type="button"
                onClick={
                  handleSaveProfile
                }
                disabled={isSaving}
                className="h-11 w-full rounded-xl px-5 sm:w-auto"
              >
                {isSaving ? (
                  <>
                    <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Guardar cambios
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={
                  handleCancelEdit
                }
                disabled={isSaving}
                className="h-11 w-full rounded-xl px-5 sm:w-auto"
              >
                <X className="mr-2 h-4 w-4" />
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function ProfileStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-border/70 bg-canvas px-3 py-3 sm:rounded-2xl sm:px-4 sm:py-4">
      <p className="text-xs font-bold uppercase tracking-[0.08em] sm:text-xs sm:tracking-[0.08em] text-muted-foreground">
        {label}
      </p>

      <p className="mt-1 text-xl font-bold tracking-tight sm:mt-1.5 sm:text-2xl text-ink">
        {value}
      </p>
    </div>
  );
}

function Field({
  label,
  helper,
  children,
}: {
  label: string;
  helper?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-ink">
        {label}
      </label>

      {children}

      {helper && (
        <p className="mt-1.5 text-xs text-muted-foreground">
          {helper}
        </p>
      )}
    </div>
  );
}