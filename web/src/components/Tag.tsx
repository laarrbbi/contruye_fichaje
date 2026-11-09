import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/** A small fact on a card: the contract, the TPC, the budget. */
export function Tag({ children, tone = 'plain', className }: { children: ReactNode; tone?: 'plain' | 'amber' | 'blue' | 'green' | 'red'; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium',
        tone === 'plain' && 'bg-secondary text-foreground/75',
        tone === 'amber' && 'bg-or/20 text-or-fonce',
        tone === 'blue' && 'bg-primary/[0.08] text-primary',
        tone === 'green' && 'bg-success/10 text-success',
        tone === 'red' && 'bg-destructive/10 text-destructive',
        className,
      )}
    >
      {children}
    </span>
  )
}
