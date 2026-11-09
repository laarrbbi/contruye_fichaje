import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Interface locale → BCP-47 for numbers and dates (Spain is the market). */
export function intlLocale(locale: string | undefined): string {
  return locale === 'en' ? 'en-GB' : 'es-ES'
}

/** Cents → "39 €" (no decimals when whole), grouping forced as in Spain. */
export function formatCents(cents: number, locale: string) {
  const whole = cents % 100 === 0
  return new Intl.NumberFormat(intlLocale(locale), {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: whole ? 0 : 2,
    useGrouping: 'always',
  }).format(cents / 100)
}

export function formatEuros(amount: number, locale: string) {
  return new Intl.NumberFormat(intlLocale(locale), { style: 'currency', currency: 'EUR', maximumFractionDigits: 0, useGrouping: 'always' }).format(amount)
}

export function formatDate(iso: string | null | undefined, locale: string, options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }) {
  if (!iso) return ''
  return new Intl.DateTimeFormat(intlLocale(locale), options).format(new Date(iso))
}

/** "hace 3 h", "ayer", "12 nov." */
export function formatRelative(iso: string | null | undefined, locale: string) {
  if (!iso) return ''
  const then = new Date(iso).getTime()
  const diff = (Date.now() - then) / 1000
  const rtf = new Intl.RelativeTimeFormat(intlLocale(locale), { numeric: 'auto' })
  if (diff < 60) return rtf.format(0, 'second')
  if (diff < 3600) return rtf.format(-Math.floor(diff / 60), 'minute')
  if (diff < 86400) return rtf.format(-Math.floor(diff / 3600), 'hour')
  if (diff < 86400 * 7) return rtf.format(-Math.floor(diff / 86400), 'day')
  return formatDate(iso, locale, { day: 'numeric', month: 'short' })
}

/** "Javier Morales" → "JM". */
export function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  const letters = words.length > 1 ? [words[0], words[words.length - 1]] : words
  return letters.map((word) => Array.from(word)[0]?.toUpperCase() ?? '').join('')
}
