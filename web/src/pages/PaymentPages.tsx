import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Check, CreditCard, Loader2, X } from 'lucide-react'
import { homeFor, useUser } from '@/api/auth'
import { useOrder, useSimulatePayment } from '@/api/billing'
import { useMeta } from '@/api/meta'
import { EmptyState, ListSkeleton } from '@/components/States'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { usePageTitle } from '@/hooks/usePageTitle'
import { formatCents } from '@/lib/utils'

/** Where to go after paying: the offer that was activated, or home. */
function after(order: { job_post: { id: number } | null } | undefined, role: Parameters<typeof homeFor>[0]) {
  if (order?.job_post) return `/empresa/ofertas/${order.job_post.id}`
  return homeFor(role)
}

/**
 * The local demo's payment screen, standing in for Stripe while Stripe is not
 * set up. The server refuses it in production.
 */
export function SimulatedPaymentPage() {
  const { t, i18n } = useTranslation()
  usePageTitle(t('payment.simTitle'))
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: user } = useUser()
  const { data: meta } = useMeta()
  const { data: order, isLoading } = useOrder(Number(id))
  const pay = useSimulatePayment()

  if (isLoading) return <div className="container max-w-lg py-16"><ListSkeleton rows={1} className="h-80" /></div>
  if (!order) return <div className="container py-16"><EmptyState title={t('payment.notFound')} /></div>

  const paid = order.status === 'paid'
  return (
    <div className="container max-w-lg py-12 sm:py-16">
      <Card>
        <CardContent className="p-7 sm:p-9">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">{paid ? <Check className="h-6 w-6" /> : <CreditCard className="h-6 w-6" />}</span>
          <h1 className="titre mt-5 text-2xl">{paid ? t('payment.okTitle') : t('payment.simTitle')}</h1>
          {!paid && <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t('payment.simText')}</p>}
          <div className="mt-6 rounded-2xl bg-secondary/60 p-5">
            <p className="font-semibold">{t(`products.${order.product}.name`)}</p>
            {order.job_post && <p className="text-sm text-muted-foreground">{order.job_post.title}</p>}
            <dl className="mt-4 space-y-1.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">{t('payment.base')}</dt>
                <dd className="tabular-nums">{formatCents(order.base_c, i18n.language)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">{t('payment.vat', { rate: meta?.vat_rate ?? 21 })}</dt>
                <dd className="tabular-nums">{formatCents(order.vat_c, i18n.language)}</dd>
              </div>
              <div className="flex justify-between border-t pt-2 text-base font-semibold">
                <dt>{t('payment.total')}</dt>
                <dd className="tabular-nums">{formatCents(order.amount_c, i18n.language)}</dd>
              </div>
            </dl>
          </div>
          {paid ? (
            <Button variant="accent" size="lg" className="mt-7 w-full" onClick={() => navigate(after(order, user?.role))}>
              {t('payment.continue')}
            </Button>
          ) : (
            <>
              <Button variant="accent" size="lg" className="mt-7 w-full" disabled={pay.isPending} onClick={() => pay.mutate(order.id)}>
                {pay.isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
                {t('payment.simButton')}
              </Button>
              <Button asChild variant="ghost" className="mt-2 w-full">
                <Link to="/pago/cancelado">{t('common.cancel')}</Link>
              </Button>
              {pay.isError && <p className="mt-3 text-sm text-destructive">{t('common.error')}</p>}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

/** Back from Stripe: wait for the webhook to settle the order. */
export function PaymentReturnPage() {
  const { t } = useTranslation()
  usePageTitle(t('payment.okTitle'))
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { data: user } = useUser()
  const { data: order } = useOrder(Number(params.get('order')), true)
  const paid = order?.status === 'paid'
  return (
    <div className="container max-w-lg py-16 text-center">
      <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-success/10 text-success">{paid ? <Check className="h-8 w-8" /> : <Loader2 className="h-8 w-8 animate-spin" />}</span>
      <h1 className="titre mt-6 text-3xl">{paid ? t('payment.okTitle') : t('payment.waiting')}</h1>
      {paid && <p className="mt-3 text-muted-foreground">{t('payment.okText')}</p>}
      <Button variant="accent" size="lg" className="mt-8" disabled={!paid} onClick={() => navigate(after(order, user?.role))}>
        {t('payment.continue')}
      </Button>
    </div>
  )
}

export function PaymentCancelPage() {
  const { t } = useTranslation()
  usePageTitle(t('payment.cancelTitle'))
  const { data: user } = useUser()
  return (
    <div className="container max-w-lg py-16 text-center">
      <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-secondary text-foreground/70">
        <X className="h-8 w-8" />
      </span>
      <h1 className="titre mt-6 text-3xl">{t('payment.cancelTitle')}</h1>
      <p className="mt-3 text-muted-foreground">{t('payment.cancelText')}</p>
      <Button asChild variant="accent" size="lg" className="mt-8">
        <Link to={homeFor(user?.role)}>{t('payment.continue')}</Link>
      </Button>
    </div>
  )
}
