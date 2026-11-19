import { toast } from 'sonner';

/*
 * GastroNic DS · Avisos de éxito y error (etapa 3)
 *
 * Un solo punto para los avisos flotantes, con el mismo tono en
 * toda la aplicación:
 * - Éxito: qué pasó, en pasado ("Reserva enviada").
 * - Error: qué falló y qué puede hacer la persona.
 *
 * Los mensajes de error que vienen de Supabase deben pasar antes
 * por getUserFacingErrorMessage (lib/supabase/errors.ts).
 */

interface NotifyOptions {
  description?: string;
  /* Duración en ms; los errores duran más por defecto */
  duration?: number;
}

export const notify = {
  success(title: string, options: NotifyOptions = {}) {
    return toast.success(title, {
      description: options.description,
      duration: options.duration ?? 4000,
    });
  },

  error(title: string, options: NotifyOptions = {}) {
    return toast.error(title, {
      description: options.description,
      duration: options.duration ?? 7000,
    });
  },

  info(title: string, options: NotifyOptions = {}) {
    return toast.info(title, {
      description: options.description,
      duration: options.duration ?? 5000,
    });
  },
};
