import Link from 'next/link';
import {
  ArrowLeft,
  KeyRound,
} from 'lucide-react';

import { ForgotPasswordForm } from '@/components/auth/forgot-password-form';

export default function ForgotPasswordPage() {
  return (
    <main className="min-h-screen bg-canvas px-5 py-10 sm:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-lg items-center">
        <div className="w-full">
          <Link
            href="/auth/login"
            className="mb-7 inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground transition hover:text-action"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Link>

          <div className="mb-7">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10">
              <KeyRound className="h-5 w-5 text-action" />
            </div>

            <p className="text-xs font-bold uppercase tracking-[0.08em] text-action">
              Recuperar acceso
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-[-0.035em] text-ink">
              Restablece tu contraseña.
            </h1>

            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Ingresa el correo asociado a tu cuenta. Te enviaremos un enlace para crear una nueva contraseña.
            </p>
          </div>

          <div className="rounded-sheet border border-border/70 bg-white p-6 shadow-none sm:p-7">
            <ForgotPasswordForm />
          </div>
        </div>
      </div>
    </main>
  );
}
