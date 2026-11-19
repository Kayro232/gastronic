'use client';

import { useState } from 'react';
import Link from 'next/link';

import {
  ArrowLeft,
  CheckCircle2,
  LoaderCircle,
  Mail,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setErrorMessage('');
    setSuccessMessage('');

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setErrorMessage('Ingresa tu correo electrónico.');
      return;
    }

    setIsLoading(true);

    try {
      const redirectTo =
        `${window.location.origin}/auth/callback?next=/auth/update-password`;

      const { error } =
        await supabase.auth.resetPasswordForEmail(
          cleanEmail,
          {
            redirectTo,
          }
        );

      if (error) {
        console.error(
          'Error enviando recuperación de contraseña:',
          error
        );

        setErrorMessage(
          'No se pudo enviar el correo de recuperación. Inténtalo nuevamente en unos minutos.'
        );
        return;
      }

      setSuccessMessage(
        'Si existe una cuenta asociada a ese correo, recibirás un enlace para restablecer tu contraseña.'
      );
    } catch (error) {
      console.error(
        'Error inesperado enviando recuperación de contraseña:',
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
    <div className="space-y-5">
      <form
        onSubmit={handleSubmit}
        className="space-y-5"
      >
        <div>
          <label
            htmlFor="recovery-email"
            className="mb-2 block text-sm font-semibold text-ink"
          >
            Correo electrónico
          </label>

          <div className="relative">
            <Mail className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted-foreground" />

            <input
              id="recovery-email"
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              placeholder="tu@ejemplo.com"
              autoComplete="email"
              disabled={isLoading}
              required
              className="h-[52px] w-full rounded-2xl border border-border/80 bg-canvas pl-11 pr-4 text-sm text-ink outline-none transition placeholder:text-muted-foreground/60 hover:border-primary/20 hover:bg-white focus:border-primary/30 focus:bg-white focus:ring-4 focus:ring-primary/[0.06] disabled:cursor-not-allowed disabled:opacity-60"
            />
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

        {successMessage && (
          <div
            role="status"
            className="flex gap-3 rounded-2xl border border-success/25 bg-success-soft px-4 py-3 text-sm text-success"
          >
            <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0" />
            <span>{successMessage}</span>
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
              Enviando...
            </>
          ) : (
            'Enviar enlace de recuperación'
          )}
        </Button>
      </form>

      <Link
        href="/auth/login"
        className="flex items-center justify-center gap-2 text-sm font-semibold text-action transition hover:text-primary/80"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a iniciar sesión
      </Link>
    </div>
  );
}
