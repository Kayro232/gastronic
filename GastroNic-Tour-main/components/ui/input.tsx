import * as React from 'react'

import { cn } from '@/lib/utils'

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        /*
         * GastroNic DS · Input (etapa 1): 44 px de alto, borde con
         * contraste 3.39:1, texto de 16 px en celular (evita el zoom
         * automático de iOS) y foco de 2 px en el color de acción.
         */
        'file:text-foreground placeholder:text-ink-muted selection:bg-action selection:text-white border-line-strong h-11 w-full min-w-0 rounded-control border bg-surface px-3 py-2 text-base text-ink transition-[color,border-color,box-shadow] duration-150 outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        'focus-visible:border-action focus-visible:ring-2 focus-visible:ring-action/30',
        'aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20',
        className,
      )}
      {...props}
    />
  )
}

export { Input }
