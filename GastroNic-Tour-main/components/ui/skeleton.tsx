import { cn } from '@/lib/utils'

function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="skeleton"
      className={cn('bg-[#E6ECEA] animate-pulse rounded-chip', className)}
      {...props}
    />
  )
}

export { Skeleton }
