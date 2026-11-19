'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import {
  Eye,
  EyeOff,
  LoaderCircle,
  Lock,
  Mail,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

interface LoginFormProps {
  redirectTo?: string;
  submitLabel?: string;
}

export function LoginForm({
  redirectTo = '/home',
  submitLabel = 'Iniciar sesión',
}: LoginFormProps) {
  const router = useRouter();

  const [email, setEmail] =
    useState('');

  const [password, setPassword] =
    useState('');

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState('');

  const [
    isLoading,
    setIsLoading,
  ] = useState(false);

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setErrorMessage('');

    const cleanEmail =
      email.trim().toLowerCase();

    if (!cleanEmail || !password) {
      setErrorMessage(
        'Por favor completa todos los campos.'
      );

      return;
    }

    setIsLoading(true);

    try {
      const { error } =
        await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

      if (error) {
        if (
          error.code ===
          'invalid_credentials'
        ) {
          setErrorMessage(
            'El correo o la contraseña son incorrectos.'
          );
        } else if (
          error.code ===
          'email_not_confirmed'
        ) {
          setErrorMessage(
            'Debes confirmar tu correo antes de iniciar sesión.'
          );
        } else {
          console.error(
            'Error iniciando sesión:',
            error
          );

          setErrorMessage(
            'No se pudo iniciar sesión. Inténtalo nuevamente.'
          );
        }

        return;
      }

      router.replace(
        redirectTo
      );

      router.refresh();
    } catch (error) {
      console.error(
        'Error inesperado durante el inicio de sesión:',
        error
      );

      setErrorMessage(
        'Ocurrió un error inesperado. Inténtalo nuevamente.'
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5"
    >
      <AuthField label="Correo electrónico">
        <div className="relative">
          <Mail className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted-foreground" />

          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) =>
              setEmail(
                event.target.value
              )
            }
            placeholder="tu@ejemplo.com"
            autoComplete="email"
            disabled={isLoading}
            required
            className="h-[52px] w-full rounded-2xl border border-border/80 bg-canvas pl-11 pr-4 text-sm text-ink outline-none transition placeholder:text-muted-foreground/60 hover:border-primary/20 hover:bg-white focus:border-primary/30 focus:bg-white focus:ring-4 focus:ring-primary/[0.06]"
          />
        </div>
      </AuthField>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <label
            htmlFor="password"
            className="text-sm font-semibold text-ink"
          >
            Contraseña
          </label>

          <Link
            href="/auth/forgot-password"
            className="text-xs font-semibold text-action transition hover:text-primary/80"
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </div>

        <div className="relative">
          <Lock className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted-foreground" />

          <input
            id="password"
            type={
              showPassword
                ? 'text'
                : 'password'
            }
            value={password}
            onChange={(event) =>
              setPassword(
                event.target.value
              )
            }
            placeholder="Tu contraseña"
            autoComplete="current-password"
            disabled={isLoading}
            required
            className="h-[52px] w-full rounded-2xl border border-border/80 bg-canvas pl-11 pr-12 text-sm text-ink outline-none transition placeholder:text-muted-foreground/60 hover:border-primary/20 hover:bg-white focus:border-primary/30 focus:bg-white focus:ring-4 focus:ring-primary/[0.06]"
          />

          <button
            type="button"
            onClick={() =>
              setShowPassword(
                (current) =>
                  !current
              )
            }
            disabled={isLoading}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-ink"
            aria-label={
              showPassword
                ? 'Ocultar contraseña'
                : 'Mostrar contraseña'
            }
          >
            {showPassword ? (
              <EyeOff className="h-[18px] w-[18px]" />
            ) : (
              <Eye className="h-[18px] w-[18px]" />
            )}
          </button>
        </div>
      </div>

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
        className="h-12 w-full rounded-2xl bg-ink font-bold text-white shadow-overlay transition hover:-translate-y-0.5 hover:bg-action hover:shadow-overlay"
      >
        {isLoading ? (
          <>
            <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
            Iniciando sesión...
          </>
        ) : (
          submitLabel
        )}
      </Button>
    </form>
  );
}

function AuthField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-ink">
        {label}
      </label>

      {children}
    </div>
  );
}