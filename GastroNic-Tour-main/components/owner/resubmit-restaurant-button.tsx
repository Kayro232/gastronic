'use client';

import { LoaderCircle, Send } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { getUserFacingErrorMessage } from '@/lib/supabase/errors';

interface ResubmitRestaurantButtonProps {
  restaurantId: string;
}

/*
 * Reenvía a revisión un restaurante rechazado (hallazgo GN-10).
 * Usa la RPC resubmit_restaurant: solo un owner del restaurante
 * puede hacerlo y solo si el estado actual es "rejected".
 */
export function ResubmitRestaurantButton({
  restaurantId,
}: ResubmitRestaurantButtonProps) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleResubmit = async () => {
    if (loading) return;

    setLoading(true);
    setError(null);

    const supabase = createClient();

    const { error: rpcError } = await supabase.rpc('resubmit_restaurant', {
      p_restaurant_id: restaurantId,
    });

    if (rpcError) {
      console.error('Error reenviando el restaurante a revisión:', rpcError);

      setError(
        getUserFacingErrorMessage(
          rpcError,
          'No se pudo reenviar la solicitud. Intenta de nuevo.'
        )
      );

      setLoading(false);
      return;
    }

    setLoading(false);
    router.refresh();
  };

  return (
    <div className="mt-4">
      <p className="text-xs leading-5 text-danger">
        Cuando hayas hecho las correcciones, envía la solicitud de nuevo para
        que el equipo la revise.
      </p>

      <Button
        type="button"
        disabled={loading}
        onClick={handleResubmit}
        className="mt-3 h-9 rounded-xl px-4 text-xs"
      >
        {loading ? (
          <>
            <LoaderCircle className="mr-2 h-3.5 w-3.5 animate-spin" />
            Enviando
          </>
        ) : (
          <>
            <Send className="mr-2 h-3.5 w-3.5" />
            Reenviar a revisión
          </>
        )}
      </Button>

      {error && (
        <div className="mt-3 rounded-xl border border-danger/25 bg-white px-3 py-2.5">
          <p className="text-xs leading-5 text-danger">{error}</p>
        </div>
      )}
    </div>
  );
}
