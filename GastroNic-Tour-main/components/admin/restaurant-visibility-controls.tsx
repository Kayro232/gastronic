'use client';

import {
  useState,
  type ComponentType,
} from 'react';

import {
  CheckCircle2,
  LoaderCircle,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

import { createClient } from '@/lib/supabase/client';
import { getUserFacingErrorMessage } from '@/lib/supabase/errors';

const supabase = createClient();

interface RestaurantVisibilityControlsProps {
  restaurantId: string;
  restaurantName: string;
  status: string;
  initialVerified: boolean;
  initialFeatured: boolean;
}

export function RestaurantVisibilityControls({
  restaurantId,
  restaurantName,
  status,
  initialVerified,
  initialFeatured,
}: RestaurantVisibilityControlsProps) {
  const [isVerified, setIsVerified] = useState(initialVerified);
  const [isFeatured, setIsFeatured] = useState(initialFeatured);
  const [loadingAction, setLoadingAction] = useState<
    'verified' | 'featured' | null
  >(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const canManage = status === 'approved';

  async function handleVerifiedChange() {
    if (!canManage || loadingAction) return;

    const nextValue = !isVerified;
    setErrorMessage('');
    setSuccessMessage('');
    setLoadingAction('verified');

    try {
      const { error } = await supabase.rpc('set_restaurant_verified', {
        p_restaurant_id: restaurantId,
        p_is_verified: nextValue,
      });

      if (error) {
        console.error('Error cambiando verificación:', error);
        setErrorMessage(
          getUserFacingErrorMessage(error, 'No se pudo actualizar la verificación.')
        );
        return;
      }

      setIsVerified(nextValue);
      setSuccessMessage(
        nextValue
          ? `"${restaurantName}" ahora está verificado.`
          : `Se retiró la verificación de "${restaurantName}".`
      );
    } catch (error) {
      console.error('Error inesperado cambiando verificación:', error);
      setErrorMessage('Ocurrió un error inesperado.');
    } finally {
      setLoadingAction(null);
    }
  }

  async function handleFeaturedChange() {
    if (!canManage || loadingAction) return;

    const nextValue = !isFeatured;
    setErrorMessage('');
    setSuccessMessage('');
    setLoadingAction('featured');

    try {
      const { error } = await supabase.rpc('set_restaurant_featured', {
        p_restaurant_id: restaurantId,
        p_is_featured: nextValue,
      });

      if (error) {
        console.error('Error cambiando destacado:', error);
        setErrorMessage(
          getUserFacingErrorMessage(error, 'No se pudo actualizar el estado destacado.')
        );
        return;
      }

      setIsFeatured(nextValue);
      setSuccessMessage(
        nextValue
          ? `"${restaurantName}" ahora aparecerá como destacado.`
          : `"${restaurantName}" dejó de estar destacado.`
      );
    } catch (error) {
      console.error('Error inesperado cambiando destacado:', error);
      setErrorMessage('Ocurrió un error inesperado.');
    } finally {
      setLoadingAction(null);
    }
  }

  return (
    <div>
      <div className="grid gap-2 sm:grid-cols-2">
        <VisibilityControl
          icon={ShieldCheck}
          label="Verificado"
          active={isVerified}
          disabled={!canManage || loadingAction !== null}
          loading={loadingAction === 'verified'}
          tone="verified"
          onClick={handleVerifiedChange}
        />

        <VisibilityControl
          icon={Sparkles}
          label="Destacado"
          active={isFeatured}
          disabled={!canManage || loadingAction !== null}
          loading={loadingAction === 'featured'}
          tone="featured"
          onClick={handleFeaturedChange}
        />
      </div>

      {errorMessage && (
        <div className="mt-2 rounded-lg border border-danger/25 bg-danger-soft px-2.5 py-2 text-xs leading-4 text-danger">
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div className="mt-2 flex items-start gap-1.5 rounded-lg border border-success/25 bg-success-soft px-2.5 py-2 text-xs leading-4 text-success">
          <CheckCircle2 className="mt-0.5 h-3 w-3 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}
    </div>
  );
}

function VisibilityControl({
  icon: Icon,
  label,
  active,
  disabled,
  loading,
  tone,
  onClick,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  active: boolean;
  disabled: boolean;
  loading: boolean;
  tone: 'verified' | 'featured';
  onClick: () => void;
}) {
  const activeStyles =
    tone === 'verified'
      ? 'border-primary/20 bg-primary/[0.055] text-action'
      : 'border-warning/25 bg-amber-50/80 text-warning';

  const toggleStyles =
    tone === 'verified' ? 'bg-action' : 'bg-amber-500';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={`group flex h-10 w-full items-center gap-2 rounded-xl border px-2.5 text-left transition ${
        active
          ? activeStyles
          : 'border-border/70 bg-white text-muted-foreground hover:border-primary/20 hover:bg-canvas hover:text-action'
      } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
    >
      <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-current/[0.07]">
        {loading ? (
          <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Icon className="h-3.5 w-3.5" />
        )}
      </span>

      <span className="min-w-0 flex-1 truncate text-xs font-bold">
        {label}
      </span>

      <span
        className={`relative h-5 w-9 flex-shrink-0 rounded-full transition ${
          active ? toggleStyles : 'bg-slate-200'
        }`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
            active ? 'translate-x-[18px]' : 'translate-x-0.5'
          }`}
        />
      </span>
    </button>
  );
}
