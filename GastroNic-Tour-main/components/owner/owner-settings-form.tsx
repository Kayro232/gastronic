'use client';

import {
  useMemo,
  useState,
} from 'react';

import {
  Bell,
  CheckCircle2,
  Globe2,
  LoaderCircle,
  Mail,
  Moon,
  Phone,
  Save,
  ShieldCheck,
  Smartphone,
  Sun,
  User,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { getUserFacingErrorMessage } from '@/lib/supabase/errors';

const supabase =
  createClient();

interface Props {
  email: string;
  createdAt: string;

  initialProfile: {
    fullName: string;
    username: string;
    bio: string;
    avatarPath: string | null;
    phone: string;
  };

  initialSettings: {
    language: string;
    theme: string;
    emailNotifications: boolean;
    pushNotifications: boolean;
    routeNotifications: boolean;
    reviewNotifications: boolean;
  };
}

export function OwnerSettingsForm({
  email,
  createdAt,
  initialProfile,
  initialSettings,
}: Props) {
  const [
    fullName,
    setFullName,
  ] = useState(
    initialProfile.fullName
  );

  const [
    username,
    setUsername,
  ] = useState(
    initialProfile.username
  );

  const [
    bio,
    setBio,
  ] = useState(
    initialProfile.bio
  );

  const [
    phone,
    setPhone,
  ] = useState(
    initialProfile.phone
  );

  const [
    language,
    setLanguage,
  ] = useState(
    initialSettings.language
  );

  const [
    theme,
    setTheme,
  ] = useState(
    initialSettings.theme
  );

  const [
    emailNotifications,
    setEmailNotifications,
  ] = useState(
    initialSettings.emailNotifications
  );

  const [
    pushNotifications,
    setPushNotifications,
  ] = useState(
    initialSettings.pushNotifications
  );

  const [
    routeNotifications,
    setRouteNotifications,
  ] = useState(
    initialSettings.routeNotifications
  );

  const [
    reviewNotifications,
    setReviewNotifications,
  ] = useState(
    initialSettings.reviewNotifications
  );

  const [
    isSaving,
    setIsSaving,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState('');

  const [
    successMessage,
    setSuccessMessage,
  ] = useState('');

  const initials =
    useMemo(() => {
      const value =
        fullName.trim() ||
        username.trim() ||
        'Propietario';

      return value
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map(
          (part) =>
            part[0]
        )
        .join('')
        .toUpperCase();
    }, [
      fullName,
      username,
    ]);

  async function handleSave() {
    setErrorMessage('');
    setSuccessMessage('');
    setIsSaving(true);

    try {
      const {
        error,
      } =
        await supabase.rpc(
          'update_owner_settings',
          {
            p_full_name:
              fullName.trim(),

            p_username:
              username.trim(),

            p_bio:
              bio.trim(),

            p_phone:
              phone.trim(),

            p_language:
              language,

            p_theme:
              theme,

            p_email_notifications:
              emailNotifications,

            p_push_notifications:
              pushNotifications,

            p_route_notifications:
              routeNotifications,

            p_review_notifications:
              reviewNotifications,
          }
        );

      if (error) {
        console.error(
          'Error guardando configuración:',
          error
        );

        setErrorMessage(
          getUserFacingErrorMessage(error, 'No se pudieron guardar los cambios.')
        );

        return;
      }

      setSuccessMessage(
        'Los cambios fueron guardados correctamente.'
      );
    } catch (error) {
      console.error(
        'Error inesperado:',
        error
      );

      setErrorMessage(
        'Ocurrió un error inesperado.'
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* ====================================================== */}
      {/* PROFILE HERO                                           */}
      {/* ====================================================== */}

      <section className="relative overflow-hidden rounded-sheet bg-ink p-6 text-white shadow-overlay sm:p-8">

        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center">
          <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-card border border-white/10 bg-white/[0.08] text-2xl font-bold shadow-inner">
            {initials}
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-secondary">
              Perfil empresarial
            </p>

            <h2 className="mt-2 text-2xl font-bold tracking-[-0.03em]">
              {fullName.trim() ||
                'Tu cuenta'}
            </h2>

            <p className="mt-2 text-sm text-white/45">
              {email}
            </p>

            <p className="mt-3 text-xs text-white/30">
              Miembro desde{' '}
              {formatDate(
                createdAt
              )}
            </p>
          </div>
        </div>
      </section>

      {errorMessage && (
        <div className="rounded-2xl border border-danger/25 bg-danger-soft p-4 text-sm text-danger">
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div className="flex items-center gap-3 rounded-2xl border border-success/25 bg-success-soft p-4 text-sm text-success">
          <CheckCircle2 className="h-4 w-4" />

          {successMessage}
        </div>
      )}

      {/* ====================================================== */}
      {/* IDENTITY                                               */}
      {/* ====================================================== */}

      <section className="overflow-hidden rounded-sheet border border-border/70 bg-white shadow-none">
        <SectionHeader
          icon={User}
          eyebrow="Identidad"
          title="Perfil"
          description="Información visible asociada a tu cuenta de GastroNic."
        />

        <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-2">
          <Field
            label="Nombre completo"
            value={fullName}
            onChange={setFullName}
            placeholder="Nombre completo"
            maxLength={120}
          />

          <Field
            label="Nombre de usuario"
            value={username}
            onChange={setUsername}
            placeholder="usuario"
            prefix="@"
            maxLength={30}
            helper="3 a 30 caracteres. Letras, números, punto o guion bajo."
          />

          <div className="lg:col-span-2">
            <label className="text-xs font-bold text-ink">
              Biografía
            </label>

            <textarea
              value={bio}
              onChange={(
                event
              ) =>
                setBio(
                  event.target.value
                )
              }
              maxLength={500}
              rows={5}
              placeholder="Cuéntanos un poco sobre ti..."
              className="mt-2 w-full resize-none rounded-2xl border border-border bg-canvas p-4 text-sm outline-none transition focus:border-primary/30 focus:bg-white focus:ring-4 focus:ring-primary/[0.06]"
            />

            <div className="mt-2 flex justify-end text-xs text-muted-foreground">
              {bio.length}/500
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================== */}
      {/* CONTACT                                                */}
      {/* ====================================================== */}

      <section className="overflow-hidden rounded-sheet border border-border/70 bg-white shadow-none">
        <SectionHeader
          icon={Phone}
          eyebrow="Contacto"
          title="Información privada"
          description="Datos que utilizamos para comunicaciones relacionadas con tu cuenta."
        />

        <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-2">
          <Field
            label="Teléfono"
            value={phone}
            onChange={setPhone}
            placeholder="+505 8888 8888"
            maxLength={30}
            icon={Phone}
          />

          <ReadOnlyField
            label="Correo electrónico"
            value={email}
            icon={Mail}
            helper="El correo está vinculado a tu cuenta de autenticación."
          />
        </div>
      </section>

      {/* ====================================================== */}
      {/* PREFERENCES                                            */}
      {/* ====================================================== */}

      <section className="overflow-hidden rounded-sheet border border-border/70 bg-white shadow-none">
        <SectionHeader
          icon={Globe2}
          eyebrow="Experiencia"
          title="Preferencias"
          description="Personaliza el idioma y la apariencia de tu cuenta."
        />

        <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-2">
          <SelectField
            label="Idioma"
            value={language}
            onChange={setLanguage}
          >
            <option value="es">
              Español
            </option>

            <option value="en">
              English
            </option>
          </SelectField>

          <div>
            <label className="text-xs font-bold text-ink">
              Apariencia
            </label>

            <div className="mt-2 grid grid-cols-3 gap-2">
              <ThemeButton
                active={
                  theme ===
                  'system'
                }
                label="Sistema"
                icon={Smartphone}
                onClick={() =>
                  setTheme(
                    'system'
                  )
                }
              />

              <ThemeButton
                active={
                  theme ===
                  'light'
                }
                label="Claro"
                icon={Sun}
                onClick={() =>
                  setTheme(
                    'light'
                  )
                }
              />

              <ThemeButton
                active={
                  theme ===
                  'dark'
                }
                label="Oscuro"
                icon={Moon}
                onClick={() =>
                  setTheme(
                    'dark'
                  )
                }
              />
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================== */}
      {/* NOTIFICATIONS                                          */}
      {/* ====================================================== */}

      <section className="overflow-hidden rounded-sheet border border-border/70 bg-white shadow-none">
        <SectionHeader
          icon={Bell}
          eyebrow="Comunicaciones"
          title="Notificaciones"
          description="Decide qué tipo de actividad quieres recibir."
        />

        <div className="divide-y divide-border/60">
          <PreferenceRow
            icon={Mail}
            title="Correo electrónico"
            description="Recibir novedades importantes por correo."
            checked={
              emailNotifications
            }
            onChange={
              setEmailNotifications
            }
          />

          <PreferenceRow
            icon={Smartphone}
            title="Notificaciones push"
            description="Alertas en dispositivos compatibles."
            checked={
              pushNotifications
            }
            onChange={
              setPushNotifications
            }
          />

          <PreferenceRow
            icon={Globe2}
            title="Rutas gastronómicas"
            description="Actualizaciones relacionadas con rutas y experiencias."
            checked={
              routeNotifications
            }
            onChange={
              setRouteNotifications
            }
          />

          <PreferenceRow
            icon={MessageSquareIcon}
            title="Reseñas"
            description="Avisos cuando haya nueva actividad relacionada con reseñas."
            checked={
              reviewNotifications
            }
            onChange={
              setReviewNotifications
            }
          />
        </div>
      </section>

      {/* ====================================================== */}
      {/* SECURITY                                               */}
      {/* ====================================================== */}

      <section className="rounded-sheet border border-border/70 bg-white p-5 shadow-none sm:p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-primary/[0.07] text-action">
            <ShieldCheck className="h-4.5 w-4.5" />
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-action">
              Seguridad
            </p>

            <h2 className="mt-1 text-lg font-bold text-ink">
              Cuenta protegida por Supabase Auth
            </h2>

            <p className="mt-2 max-w-2xl text-xs leading-5 text-muted-foreground">
              Los cambios de contraseña, correo y acceso se administran de forma
              separada a los datos del perfil.
            </p>
          </div>
        </div>
      </section>

      {/* ====================================================== */}
      {/* SAVE                                                   */}
      {/* ====================================================== */}

      <div className="sticky bottom-4 z-20 flex justify-end">
        <div className="rounded-2xl border border-border/70 bg-white/95 p-2 shadow-raised backdrop-blur-xl">
          <Button
            type="button"
            disabled={
              isSaving
            }
            onClick={
              handleSave
            }
            className="h-11 rounded-xl bg-ink px-6 font-bold text-white hover:bg-action"
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
        </div>
      </div>
    </div>
  );
}

/* ========================================================== */
/* SMALL COMPONENTS                                           */
/* ========================================================== */

function SectionHeader({
  icon: Icon,
  eyebrow,
  title,
  description,
}: {
  icon: React.ComponentType<{
    className?: string;
  }>;

  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-4 border-b border-border/60 px-5 py-5 sm:px-6">
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary/[0.07] text-action">
        <Icon className="h-4 w-4" />
      </div>

      <div>
        <p className="text-xs font-bold uppercase tracking-[0.08em] text-action">
          {eyebrow}
        </p>

        <h2 className="mt-1 text-lg font-bold text-ink">
          {title}
        </h2>

        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  maxLength,
  helper,
  prefix,
  icon: Icon,
}: {
  label: string;
  value: string;
  onChange: (
    value: string
  ) => void;
  placeholder?: string;
  maxLength?: number;
  helper?: string;
  prefix?: string;

  icon?: React.ComponentType<{
    className?: string;
  }>;
}) {
  return (
    <div>
      <label className="text-xs font-bold text-ink">
        {label}
      </label>

      <div className="relative mt-2">
        {prefix && (
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            {prefix}
          </span>
        )}

        {Icon && (
          <Icon className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        )}

        <input
          value={value}
          onChange={(
            event
          ) =>
            onChange(
              event.target.value
            )
          }
          maxLength={maxLength}
          placeholder={placeholder}
          className={`h-12 w-full rounded-xl border border-border bg-canvas pr-4 text-sm outline-none transition focus:border-primary/30 focus:bg-white focus:ring-4 focus:ring-primary/[0.06] ${
            prefix || Icon
              ? 'pl-10'
              : 'pl-4'
          }`}
        />
      </div>

      {helper && (
        <p className="mt-2 text-xs leading-4 text-muted-foreground">
          {helper}
        </p>
      )}
    </div>
  );
}

function ReadOnlyField({
  label,
  value,
  icon: Icon,
  helper,
}: {
  label: string;
  value: string;

  icon: React.ComponentType<{
    className?: string;
  }>;

  helper?: string;
}) {
  return (
    <div>
      <label className="text-xs font-bold text-ink">
        {label}
      </label>

      <div className="mt-2 flex h-12 items-center gap-3 rounded-xl border border-border bg-slate-50 px-4 text-sm text-muted-foreground">
        <Icon className="h-4 w-4" />

        <span className="truncate">
          {value}
        </span>
      </div>

      {helper && (
        <p className="mt-2 text-xs leading-4 text-muted-foreground">
          {helper}
        </p>
      )}
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (
    value: string
  ) => void;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-xs font-bold text-ink">
        {label}
      </label>

      <select
        value={value}
        onChange={(
          event
        ) =>
          onChange(
            event.target.value
          )
        }
        className="mt-2 h-12 w-full rounded-xl border border-border bg-canvas px-4 text-sm outline-none transition focus:border-primary/30 focus:bg-white focus:ring-4 focus:ring-primary/[0.06]"
      >
        {children}
      </select>
    </div>
  );
}

function ThemeButton({
  active,
  label,
  icon: Icon,
  onClick,
}: {
  active: boolean;
  label: string;

  icon: React.ComponentType<{
    className?: string;
  }>;

  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-12 items-center justify-center gap-2 rounded-xl border text-xs font-bold transition ${
        active
          ? 'border-primary bg-primary/[0.06] text-action'
          : 'border-border bg-canvas text-muted-foreground hover:bg-white hover:text-ink'
      }`}
    >
      <Icon className="h-4 w-4" />

      {label}
    </button>
  );
}

function PreferenceRow({
  icon: Icon,
  title,
  description,
  checked,
  onChange,
}: {
  icon: React.ComponentType<{
    className?: string;
  }>;

  title: string;
  description: string;
  checked: boolean;
  onChange: (
    value: boolean
  ) => void;
}) {
  return (
    <div className="flex items-center gap-4 px-5 py-5 sm:px-6">
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-surface-2 text-action">
        <Icon className="h-4 w-4" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-ink">
          {title}
        </p>

        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          {description}
        </p>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={
          checked
        }
        onClick={() =>
          onChange(
            !checked
          )
        }
        className={`relative h-7 w-12 flex-shrink-0 rounded-full transition ${
          checked
            ? 'bg-action'
            : 'bg-slate-200'
        }`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition ${
            checked
              ? 'left-6'
              : 'left-1'
          }`}
        />
      </button>
    </div>
  );
}

function MessageSquareIcon({
  className,
}: {
  className?: string;
}) {
  return (
    <Bell className={className} />
  );
}

function formatDate(
  value: string
) {
  return new Intl.DateTimeFormat(
    'es-NI',
    {
      month: 'long',
      year: 'numeric',
    }
  ).format(
    new Date(value)
  );
}