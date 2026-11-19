'use client'

import { Toaster as Sonner, ToasterProps } from 'sonner'

/*
 * GastroNic DS · Avisos (etapa 3)
 *
 * - Tema claro fijo: el modo oscuro está pospuesto y no hay
 *   ThemeProvider montado (antes seguía al sistema operativo y
 *   podía mostrar avisos oscuros sobre la interfaz clara).
 * - Arriba al centro, debajo de la cabecera, para no chocar con
 *   la barra inferior del celular.
 * - Para mostrar avisos usar `notify` de '@/lib/notify'.
 */
const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      position="top-center"
      offset={76}
      gap={10}
      visibleToasts={3}
      closeButton
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            'group rounded-card border border-line bg-white text-ink shadow-overlay font-sans gap-3 px-4 py-3.5',
          title: 'text-[15px] font-semibold text-ink',
          description: 'text-[13px] leading-relaxed text-ink-muted',
          actionButton: 'rounded-control bg-action text-white font-semibold',
          cancelButton: 'rounded-control bg-surface-2 text-ink',
          closeButton: 'border-line bg-white text-ink-muted hover:text-ink',
          success: '[&_[data-icon]]:text-success',
          error: '[&_[data-icon]]:text-danger',
          warning: '[&_[data-icon]]:text-warning',
          info: '[&_[data-icon]]:text-action',
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
