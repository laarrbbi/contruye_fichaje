import { forwardRef, useId, type ReactNode, type SelectHTMLAttributes } from 'react'
import { useTranslation } from 'react-i18next'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

/*
 * The forms inside the platform, on the paper: a label, the control, its
 * hint or its error. The controls are the UI kit's (Input, Textarea) or the
 * native list below, which suits 52 provinces and 50 trades on a phone.
 */

export function Field({ label, htmlFor, error, hint, optional, children, className }: { label: ReactNode; htmlFor?: string; error?: string; hint?: ReactNode; optional?: boolean; children: ReactNode; className?: string }) {
  const { t } = useTranslation()
  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={htmlFor} className="flex items-baseline gap-2 text-sm font-medium text-foreground">
        {label}
        {optional && <span className="text-xs font-normal text-muted-foreground">({t('common.optional')})</span>}
      </label>
      {children}
      {error ? (
        <p role="alert" className="text-[0.8125rem] text-destructive">
          {error}
        </p>
      ) : hint ? (
        <p className="text-[0.8125rem] leading-snug text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  )
}

export const NativeSelect = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function NativeSelect({ className, children, ...props }, ref) {
  return (
    <div className="relative">
      <select
        ref={ref}
        className={cn(
          'flex h-10 w-full cursor-pointer appearance-none rounded-md border border-input bg-background px-3 py-2 pe-9 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <svg aria-hidden viewBox="0 0 10 6" className="pointer-events-none absolute end-3 top-1/2 h-1.5 w-2.5 -translate-y-1/2 text-muted-foreground">
        <path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    </div>
  )
})

/** A yes/no as a row: the box, then what it means. */
export function CheckRow({ checked, onChange, label, hint }: { checked: boolean; onChange(value: boolean): void; label: ReactNode; hint?: ReactNode }) {
  const id = useId()
  return (
    <div className="flex items-start gap-3">
      <input id={id} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-0.5 h-[1.125rem] w-[1.125rem] shrink-0 cursor-pointer rounded accent-primary" />
      <label htmlFor={id} className="cursor-pointer text-sm leading-snug">
        {label}
        {hint && <span className="mt-0.5 block text-[0.8125rem] text-muted-foreground">{hint}</span>}
      </label>
    </div>
  )
}

/** Several of a list, as chips that light up. */
export function ChipPicker({ options, value, onChange, max, night }: { options: { value: string; label: string }[]; value: string[]; onChange(next: string[]): void; max?: number; night?: boolean }) {
  const toggle = (v: string) => {
    if (value.includes(v)) onChange(value.filter((x) => x !== v))
    else if (!max || value.length < max) onChange([...value, v])
  }
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const on = value.includes(option.value)
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={on}
            onClick={() => toggle(option.value)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[0.8125rem] font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              night
                ? on
                  ? 'border-[#E8A33D] bg-[#E8A33D]/15 text-[#F1B860]'
                  : 'border-white/15 text-creme-100/75 hover:border-white/30'
                : on
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-input bg-background text-foreground/80 hover:border-foreground/30',
            )}
          >
            {on && <Check className="h-3.5 w-3.5" aria-hidden />}
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
