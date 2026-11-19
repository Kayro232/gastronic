'use client';

import { useState } from 'react';
import Link from 'next/link';

import {
  CheckCircle2,
  Eye,
  EyeOff,
  LoaderCircle,
  Lock,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

export function UpdatePasswordForm() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setErrorMessage('');
    setSuccessMessage('');

    if (!password || !confirmPassword) {
      setErrorMessage('Completa ambos campos.');
      return;
    }

    if (password.length < 8) {
      setErrorMessage(
        'La contraseña debe tener al menos 8 caracteres.'
      );
      return;
    }

    if (!/[A-Za-z]/.test(password)) {
      setErrorMessage(
        'La contraseña debe contener al menos una letra.'
      );
      return;
    }

    if (!/[0-9]/.test(password)) {
      setErrorMessage(
        'La contraseña debe contener al menos un número.'
      );
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Las contraseñas no coinciden.');
      return;
    }

    setIsLoading(true);

    try {
      const { error } =
        await supabase.auth.updateUser({
          password,
        });

      if (error) {
        console.error(
          'Error actualizando contraseña:',
          error
        );

        setErrorMessage(
          'No se pudo actualizar la contraseña. El enlace puede haber expirado; solicita uno nuevo.'
        );
        return;
      }

      const { error: signOutError } =
        await supabase.auth.signOut();

      if (signOutError) {
        console.error(
          'La contraseña cambió, pero no se pudo cerrar la sesión de recuperación:',
          signOutError
        );
      }

      setPassword('');
      setConfirmPassword('');
      setSuccessMessage(
        'Contraseña actualizada correctamente. Ya puedes iniciar sesión con tu nueva contraseña.'
      );
    } catch (error) {
      console.error(
        'Error inesperado actualizando contraseña:',
        error
      );

      setErrorMessage(
        'Ocurrió un error inesperado. Inténtalo nuevamente.'
      );
    } finally {
      setIsLoading(false);
    }
  }

  if (successMessage) {
    return (
      <div className="space-y-5">
        <div
          role="status"
          className="flex gap-3 rounded-2xl border border-success/25 bg-success-soft p-4 text-sm text-success"
        >
          <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>

        <Button
          asChild
          className="h-12 w-full rounded-2xl bg-ink font-bold text-white hover:bg-action"
        >
          <Link href="/auth/login">
            Ir a iniciar sesión
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5"
    >
      <PasswordField
        id="new-password"
        label="Nueva contraseña"
        value={password}
        onChange={setPassword}
        visible={showPassword}
        onToggle={() =>
          setShowPassword(
            (current) => !current
          )
        }
        autoComplete="new-password"
        disabled={isLoading}
      />

      <PasswordField
        id="confirm-password"
        label="Confirmar contraseña"
        value={confirmPassword}
        onChange={setConfirmPassword}
        visible={showConfirmPassword}
        onToggle={() =>
          setShowConfirmPassword(
            (current) => !current
          )
        }
        autoComplete="new-password"
        disabled={isLoading}
      />

      <p className="text-xs leading-5 text-muted-foreground">
        Usa al menos 8 caracteres, una letra y un número.
      </p>

      {errorMessage && (
        <div
          role="alert"
          className="rounded-2xl border border-danger/25 bg-danger-soft px-4 py-3 text-sm text-danger"
        >
          {errorMessage}
        </div>
      )}

      <Button
        type="submit"
        disabled={isLoading}
        className="h-12 w-full rounded-2xl bg-ink font-bold text-white shadow-overlay transition hover:-translate-y-0.5 hover:bg-action"
      >
        {isLoading ? (
          <>
            <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
            Actualizando...
          </>
        ) : (
          'Guardar nueva contraseña'
        )}
      </Button>
    </form>
  );
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  visible,
  onToggle,
  autoComplete,
  disabled,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  visible: boolean;
  onToggle: () => void;
  autoComplete: string;
  disabled: boolean;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-sm font-semibold text-ink"
      >
        {label}
      </label>

      <div className="relative">
        <Lock className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted-foreground" />

        <input
          id={id}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(event) =>
            onChange(event.target.value)
          }
          autoComplete={autoComplete}
          disabled={disabled}
          required
          className="h-[52px] w-full rounded-2xl border border-border/80 bg-canvas pl-11 pr-12 text-sm text-ink outline-none transition placeholder:text-muted-foreground/60 hover:border-primary/20 hover:bg-white focus:border-primary/30 focus:bg-white focus:ring-4 focus:ring-primary/[0.06] disabled:cursor-not-allowed disabled:opacity-60"
        />

        <button
          type="button"
          onClick={onToggle}
          disabled={disabled}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-ink"
          aria-label={
            visible
              ? 'Ocultar contraseña'
              : 'Mostrar contraseña'
          }
        >
          {visible ? (
            <EyeOff className="h-[18px] w-[18px]" />
          ) : (
            <Eye className="h-[18px] w-[18px]" />
          )}
        </button>
      </div>
    </div>
  );
}
