'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import {
  AtSign,
  Check,
  CheckCircle,
  Eye,
  EyeOff,
  LoaderCircle,
  Lock,
  Mail,
  User,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

interface RegisterFormProps {
  redirectTo?: string;
  emailRedirectPath?: string;
  submitLabel?: string;
}

function normalizeUsername(
  value: string
) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(
      /[^a-z0-9_]/g,
      ''
    );
}

export function RegisterForm({
  redirectTo = '/home',
  emailRedirectPath = '/auth/login',
  submitLabel = 'Crear cuenta',
}: RegisterFormProps) {
  const router = useRouter();

  const [fullName, setFullName] =
    useState('');

  const [username, setUsername] =
    useState('');

  const [email, setEmail] =
    useState('');

  const [password, setPassword] =
    useState('');

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState('');

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [
    showConfirmPassword,
    setShowConfirmPassword,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState('');

  const [
    successMessage,
    setSuccessMessage,
  ] = useState('');

  const [
    isLoading,
    setIsLoading,
  ] = useState(false);

  const passwordHasLength =
    password.length >= 8;

  const passwordHasLetter =
    /[A-Za-z]/.test(password);

  const passwordHasNumber =
    /[0-9]/.test(password);

  const passwordsMatch =
    password.length > 0 &&
    confirmPassword.length >
      0 &&
    password ===
      confirmPassword;

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setErrorMessage('');
    setSuccessMessage('');

    const cleanFullName =
      fullName.trim();

    const cleanUsername =
      normalizeUsername(
        username
      );

    const cleanEmail =
      email
        .trim()
        .toLowerCase();

    if (
      !cleanFullName ||
      !cleanUsername ||
      !cleanEmail ||
      !password ||
      !confirmPassword
    ) {
      setErrorMessage(
        'Por favor completa todos los campos.'
      );

      return;
    }

    if (
      cleanFullName.length < 3
    ) {
      setErrorMessage(
        'El nombre completo debe tener al menos 3 caracteres.'
      );

      return;
    }

    if (
      cleanUsername.length < 3
    ) {
      setErrorMessage(
        'El nombre de usuario debe tener al menos 3 caracteres.'
      );

      return;
    }

    if (
      cleanUsername.length > 30
    ) {
      setErrorMessage(
        'El nombre de usuario no puede superar los 30 caracteres.'
      );

      return;
    }

    if (
      !/^[a-z0-9_]+$/.test(
        cleanUsername
      )
    ) {
      setErrorMessage(
        'El usuario solo puede contener letras, números y guiones bajos.'
      );

      return;
    }

    if (
      password.length < 8
    ) {
      setErrorMessage(
        'La contraseña debe tener al menos 8 caracteres.'
      );

      return;
    }

    if (
      !/[A-Za-z]/.test(
        password
      )
    ) {
      setErrorMessage(
        'La contraseña debe contener al menos una letra.'
      );

      return;
    }

    if (
      !/[0-9]/.test(
        password
      )
    ) {
      setErrorMessage(
        'La contraseña debe contener al menos un número.'
      );

      return;
    }

    if (
      password !==
      confirmPassword
    ) {
      setErrorMessage(
        'Las contraseñas no coinciden.'
      );

      return;
    }

    setIsLoading(true);

    try {
      /*
       * La tabla profiles ya no es legible sin sesión
       * (hallazgo GN-12). La disponibilidad se consulta
       * con una función que solo responde sí o no.
       */
      const {
        data:
          isUsernameAvailable,
        error:
          usernameError,
      } = await supabase.rpc(
        'is_username_available',
        {
          p_username:
            cleanUsername,
        }
      );

      if (usernameError) {
        console.error(
          'Error comprobando username:',
          usernameError
        );

        setErrorMessage(
          'No se pudo comprobar el nombre de usuario.'
        );

        return;
      }

      if (
        isUsernameAvailable !==
        true
      ) {
        setErrorMessage(
          'Ese nombre de usuario ya está ocupado.'
        );

        return;
      }

      const redirectUrl =
        typeof window !==
        'undefined'
          ? `${window.location.origin}${emailRedirectPath}`
          : undefined;

      const {
        data,
        error,
      } =
        await supabase.auth.signUp({
          email:
            cleanEmail,

          password,

          options: {
            emailRedirectTo:
              redirectUrl,

            data: {
              full_name:
                cleanFullName,

              username:
                cleanUsername,
            },
          },
        });

      if (error) {
        const lowerError =
          error.message.toLowerCase();

        if (
          error.code ===
            'user_already_exists' ||
          lowerError.includes(
            'already registered'
          )
        ) {
          setErrorMessage(
            'Ya existe una cuenta con ese correo electrónico.'
          );
        } else if (
          lowerError.includes(
            'password'
          )
        ) {
          setErrorMessage(
            'La contraseña no cumple con los requisitos de seguridad.'
          );
        } else {
          console.error(
            'Error registrando usuario:',
            {
              code:
                error.code,

              message:
                error.message,
            }
          );

          setErrorMessage(
            'No se pudo crear la cuenta. Inténtalo nuevamente.'
          );
        }

        return;
      }

      if (!data.user) {
        setErrorMessage(
          'No se pudo completar la creación de la cuenta.'
        );

        return;
      }

      if (data.session) {
        router.replace(
          redirectTo
        );

        router.refresh();

        return;
      }

      setSuccessMessage(
        emailRedirectPath.startsWith(
          '/owner'
        )
          ? 'Cuenta creada correctamente. Revisa tu correo para confirmar tu cuenta. Después podrás iniciar sesión y registrar tu restaurante.'
          : 'Cuenta creada correctamente. Revisa tu correo para confirmar el registro antes de iniciar sesión.'
      );

      setFullName('');
      setUsername('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error(
        'Error inesperado durante el registro:',
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
      {/* Nombre + username */}
      <div className="grid gap-5 sm:grid-cols-2">
        <AuthField label="Nombre completo">
          <div className="relative">
            <User className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted-foreground" />

            <input
              id="full-name"
              type="text"
              value={fullName}
              onChange={(event) =>
                setFullName(
                  event.target.value
                )
              }
              placeholder="Tu nombre"
              autoComplete="name"
              disabled={isLoading}
              required
              maxLength={100}
              className="h-[52px] w-full rounded-2xl border border-border/80 bg-canvas pl-11 pr-4 text-sm outline-none transition placeholder:text-muted-foreground/60 hover:border-primary/20 hover:bg-white focus:border-primary/30 focus:bg-white focus:ring-4 focus:ring-primary/[0.06]"
            />
          </div>
        </AuthField>

        <AuthField label="Usuario">
          <div className="relative">
            <AtSign className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted-foreground" />

            <input
              id="username"
              type="text"
              value={username}
              onChange={(event) =>
                setUsername(
                  normalizeUsername(
                    event.target.value
                  )
                )
              }
              placeholder="usuario_nica"
              autoComplete="username"
              disabled={isLoading}
              required
              minLength={3}
              maxLength={30}
              className="h-[52px] w-full rounded-2xl border border-border/80 bg-canvas pl-11 pr-4 text-sm outline-none transition placeholder:text-muted-foreground/60 hover:border-primary/20 hover:bg-white focus:border-primary/30 focus:bg-white focus:ring-4 focus:ring-primary/[0.06]"
            />
          </div>
        </AuthField>
      </div>

      <AuthField label="Correo electrónico">
        <div className="relative">
          <Mail className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted-foreground" />

          <input
            id="register-email"
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
            className="h-[52px] w-full rounded-2xl border border-border/80 bg-canvas pl-11 pr-4 text-sm outline-none transition placeholder:text-muted-foreground/60 hover:border-primary/20 hover:bg-white focus:border-primary/30 focus:bg-white focus:ring-4 focus:ring-primary/[0.06]"
          />
        </div>
      </AuthField>

      <AuthField label="Contraseña">
        <PasswordInput
          id="register-password"
          value={password}
          onChange={setPassword}
          show={showPassword}
          onToggle={() =>
            setShowPassword(
              (current) =>
                !current
            )
          }
          placeholder="Mínimo 8 caracteres"
          disabled={isLoading}
        />

        {password && (
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <PasswordRule
              valid={
                passwordHasLength
              }
            >
              8 caracteres
            </PasswordRule>

            <PasswordRule
              valid={
                passwordHasLetter
              }
            >
              Una letra
            </PasswordRule>

            <PasswordRule
              valid={
                passwordHasNumber
              }
            >
              Un número
            </PasswordRule>
          </div>
        )}
      </AuthField>

      <AuthField label="Confirmar contraseña">
        <PasswordInput
          id="confirm-password"
          value={confirmPassword}
          onChange={
            setConfirmPassword
          }
          show={
            showConfirmPassword
          }
          onToggle={() =>
            setShowConfirmPassword(
              (current) =>
                !current
            )
          }
          placeholder="Repite tu contraseña"
          disabled={isLoading}
        />

        {confirmPassword && (
          <div
            className={`mt-2 flex items-center gap-1.5 text-xs font-semibold ${
              passwordsMatch
                ? 'text-success'
                : 'text-red-500'
            }`}
          >
            <Check className="h-3.5 w-3.5" />

            {passwordsMatch
              ? 'Las contraseñas coinciden'
              : 'Las contraseñas todavía no coinciden'}
          </div>
        )}
      </AuthField>

      {errorMessage && (
        <div
          role="alert"
          className="rounded-2xl border border-danger/25 bg-danger-soft px-4 py-3 text-sm leading-6 text-danger"
        >
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div
          role="status"
          className="flex items-start gap-3 rounded-2xl border border-success/25 bg-success-soft p-4 text-sm leading-6 text-success"
        >
          <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />

          <span>
            {successMessage}
          </span>
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

            Creando cuenta...
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

function PasswordInput({
  id,
  value,
  onChange,
  show,
  onToggle,
  placeholder,
  disabled,
}: {
  id: string;
  value: string;
  onChange: (
    value: string
  ) => void;
  show: boolean;
  onToggle: () => void;
  placeholder: string;
  disabled: boolean;
}) {
  return (
    <div className="relative">
      <Lock className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted-foreground" />

      <input
        id={id}
        type={
          show
            ? 'text'
            : 'password'
        }
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        placeholder={
          placeholder
        }
        autoComplete="new-password"
        disabled={disabled}
        required
        minLength={8}
        className="h-[52px] w-full rounded-2xl border border-border/80 bg-canvas pl-11 pr-12 text-sm outline-none transition placeholder:text-muted-foreground/60 hover:border-primary/20 hover:bg-white focus:border-primary/30 focus:bg-white focus:ring-4 focus:ring-primary/[0.06]"
      />

      <button
        type="button"
        onClick={onToggle}
        disabled={disabled}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-ink"
        aria-label={
          show
            ? 'Ocultar contraseña'
            : 'Mostrar contraseña'
        }
      >
        {show ? (
          <EyeOff className="h-[18px] w-[18px]" />
        ) : (
          <Eye className="h-[18px] w-[18px]" />
        )}
      </button>
    </div>
  );
}

function PasswordRule({
  valid,
  children,
}: {
  valid: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-semibold ${
        valid
          ? 'bg-success-soft text-success'
          : 'bg-canvas text-muted-foreground'
      }`}
    >
      <Check className="h-3 w-3" />

      {children}
    </div>
  );
}