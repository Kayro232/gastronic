'use client';

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { AlertTriangle, HelpCircle } from 'lucide-react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/*
 * GastroNic DS · Confirmación (etapa 2)
 *
 * Sustituye a window.confirm() con un diálogo accesible y con
 * la identidad de GastroNic. Se usa igual que antes, pero con
 * await:
 *
 *   const confirm = useConfirm();
 *   if (!(await confirm({ title: '¿Eliminar…?' }))) return;
 *
 * Devuelve true solo si la persona pulsa el botón de confirmar.
 * Cerrar con Escape, clic fuera o "Cancelar" devuelve false.
 */

export interface ConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /* "danger" para acciones destructivas o irreversibles */
  tone?: 'default' | 'danger';
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolverRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback<ConfirmFn>((nextOptions) => {
    /* Si quedara un diálogo pendiente, se resuelve como cancelado */
    resolverRef.current?.(false);

    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
      setOptions(nextOptions);
    });
  }, []);

  const settle = useCallback((value: boolean) => {
    resolverRef.current?.(value);
    resolverRef.current = null;
    setOptions(null);
  }, []);

  const isDanger = options?.tone === 'danger';
  const Icon = isDanger ? AlertTriangle : HelpCircle;

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}

      <AlertDialog
        open={options !== null}
        onOpenChange={(open) => {
          if (!open) settle(false);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader className="items-start gap-3 text-left sm:flex-row sm:gap-4">
            <div
              className={cn(
                'flex size-11 flex-shrink-0 items-center justify-center rounded-control',
                isDanger ? 'bg-danger-soft text-danger' : 'bg-action-soft text-action'
              )}
            >
              <Icon className="size-5" aria-hidden="true" />
            </div>

            <div className="space-y-1.5">
              <AlertDialogTitle>{options?.title}</AlertDialogTitle>

              {options?.description ? (
                <AlertDialogDescription>{options.description}</AlertDialogDescription>
              ) : (
                <AlertDialogDescription className="sr-only">
                  Confirma o cancela la acción.
                </AlertDialogDescription>
              )}
            </div>
          </AlertDialogHeader>

          <AlertDialogFooter className="gap-2 sm:gap-2">
            <AlertDialogCancel onClick={() => settle(false)}>
              {options?.cancelLabel ?? 'Cancelar'}
            </AlertDialogCancel>

            <AlertDialogAction
              onClick={() => settle(true)}
              className={cn(
                isDanger && buttonVariants({ variant: 'destructive' })
              )}
            >
              {options?.confirmLabel ?? 'Confirmar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ConfirmContext.Provider>
  );
}

/*
 * Si el proveedor no estuviera montado (por ejemplo en una
 * prueba aislada), se recurre a window.confirm para no romper
 * el flujo existente.
 */
export function useConfirm(): ConfirmFn {
  const context = useContext(ConfirmContext);

  return useCallback<ConfirmFn>(
    async (options) => {
      if (context) {
        return context(options);
      }

      return window.confirm(
        [options.title, options.description].filter(Boolean).join('\n\n')
      );
    },
    [context]
  );
}
