import { cn } from '@/lib/utils'

/** Initials on the brand blue; amber on the night. */
export function Avatar({ initials, className, tone = 'blue' }: { initials: string; className?: string; tone?: 'blue' | 'amber' | 'muted' }) {
  return (
    <span
      aria-hidden
      className={cn(
        'grid h-12 w-12 shrink-0 place-items-center rounded-full text-sm font-semibold',
        tone === 'blue' && 'bg-primary text-primary-foreground',
        tone === 'amber' && 'bg-or text-plume',
        tone === 'muted' && 'bg-secondary text-foreground/70',
        className,
      )}
    >
      {initials}
    </span>
  )
}
