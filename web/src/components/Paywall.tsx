import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Check, Lock, Loader2, Sparkles } from 'lucide-react'
import { errorCode, errorMessage } from '@/api/client'
import { useCheckout } from '@/api/billing'
import { useMeta } from '@/api/meta'
import type { Product } from '@/api/types'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn, formatCents } from '@/lib/utils'

/** A contact not paid for yet: its shape, blurred, and a lock. */
export function LockedValue({ children, label }: { children: ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="velado font-mono" aria-hidden>
        {children}
      </span>
      <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
        <Lock className="h-3.5 w-3.5" aria-hidden />
        {label}
      </span>
    </span>
  )
}

export function useProducts(role: 'employer' | 'provider') {
  const { data } = useMeta()
  return (data?.products ?? []).filter((p) => p.role === role)
}

/**
 * One plan, on paper. The featured one sits on the night, as the contruye
 * sales page's offer did.
 */
export function PlanCard({ product, highlight, onBuy, busy, cta, footnote }: { product: Product | { key: 'free'; price_c: 0; credits: null; days: number | null; needs_offer: false; featured: false; pass: false }; highlight?: boolean; onBuy?: () => void; busy?: boolean; cta?: ReactNode; footnote?: ReactNode }) {
  const { t, i18n } = useTranslation()
  const free = product.key === 'free'
  const name = free ? t('employerPricing.free.name') : t(`products.${product.key}.name`)
  const text = free ? t('employerPricing.free.text') : t(`products.${product.key}.text`)
  const features = (free ? t('employerPricing.free.features', { returnObjects: true }) : t(`products.${product.key}.features`, { returnObjects: true, credits: product.credits })) as string[]
  const unit = free ? t('products.perOffer') : product.needs_offer ? t('products.perOffer') : product.pass ? t('products.per30') : t('products.oneTime')

  return (
    <div
      className={cn(
        'relative flex flex-col rounded-3xl border p-7',
        highlight ? 'theme-night border-transparent bg-[radial-gradient(120%_90%_at_80%_0%,#16294A,#0B1A2E_60%)] shadow-float' : 'border-foreground/[0.08] bg-card shadow-[0_24px_48px_-34px_rgb(20_26_34/0.38)]',
      )}
    >
      {highlight && (
        <span className="absolute -top-3 start-7 inline-flex items-center gap-1 rounded-full bg-or px-3 py-1 text-xs font-semibold text-plume">
          <Sparkles className="h-3.5 w-3.5" aria-hidden />
          {t('products.popular')}
        </span>
      )}
      <p className="etiquette text-foreground/60">{name}</p>
      <p className="mt-4 flex items-baseline gap-2">
        <span className={cn('titre text-[2.75rem] !leading-none tabular-nums', highlight && 'text-or')}>{free ? t('common.free') : formatCents(product.price_c, i18n.language)}</span>
        <span className="text-sm text-muted-foreground">{unit}</span>
      </p>
      {!free && <p className="mt-1 text-xs text-muted-foreground">{t('common.vatIncluded')}</p>}
      <p className="mt-4 text-sm leading-relaxed text-foreground/75">{text}</p>
      <ul className="mt-5 flex-1 space-y-2.5 text-sm">
        {features.map((feature) => (
          <li key={feature} className="flex gap-2.5">
            <Check className={cn('mt-0.5 h-4 w-4 shrink-0', highlight ? 'text-or' : 'text-success')} aria-hidden />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      {cta ??
        (onBuy && (
          <Button variant={highlight ? 'accent' : 'default'} size="lg" className="mt-7 w-full" onClick={onBuy} disabled={busy}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
            {product.needs_offer ? t('products.activate') : t('products.buy')}
          </Button>
        ))}
      {footnote}
    </div>
  )
}

/**
 * Buy something and go to the payment. Errors (Stripe not set up, a 422)
 * show under the cards.
 */
export function useBuy() {
  const { t } = useTranslation()
  const checkout = useCheckout()
  const [pending, setPending] = useState<string | null>(null)
  const buy = (product: string, jobPostId?: number) => {
    setPending(product)
    checkout.mutate({ product, job_post_id: jobPostId }, { onError: () => setPending(null) })
  }
  const error = checkout.isError
    ? errorCode(checkout.error) === 'payments_unavailable'
      ? t('billing.unavailable')
      : errorMessage(checkout.error, t('common.error'))
    : null
  return { buy, pending: checkout.isPending || checkout.isSuccess ? pending : null, error }
}

/** "You have no credits left": the packs, in a dialog. */
export function BuyCreditsDialog({ open, onOpenChange, role, title, text }: { open: boolean; onOpenChange(open: boolean): void; role: 'employer' | 'provider'; title: string; text: string }) {
  const { t } = useTranslation()
  const products = useProducts(role).filter((p) => !p.needs_offer)
  const { buy, pending, error } = useBuy()
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="titre text-2xl">{title}</DialogTitle>
          <DialogDescription>{text}</DialogDescription>
        </DialogHeader>
        <div className={cn('mt-2 grid gap-4', products.length > 2 ? 'sm:grid-cols-3' : 'sm:grid-cols-2')}>
          {products.map((p, i) => (
            <PlanCard key={p.key} product={p} highlight={i === 1} busy={pending === p.key} onBuy={() => buy(p.key)} />
          ))}
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <p className="text-center text-sm">
          <Link to={role === 'employer' ? '/empresa/plan' : '/profesional/creditos'} className="lien-edito text-primary">
            {role === 'employer' ? t('nav.employer.billing') : t('nav.provider.billing')}
          </Link>
        </p>
      </DialogContent>
    </Dialog>
  )
}
