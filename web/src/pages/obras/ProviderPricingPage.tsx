import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight, Coins } from 'lucide-react'
import { useUser } from '@/api/auth'
import { PageHead, SectionLabel } from '@/components/PageHead'
import { PlanCard, useProducts } from '@/components/Paywall'
import { useLabels } from '@/hooks/useLabels'
import { usePageTitle } from '@/hooks/usePageTitle'

export function ProviderPricingPage() {
  const { t } = useTranslation()
  usePageTitle(t('providerPricing.title'))
  const labels = useLabels()
  const { data: user } = useUser()
  const products = useProducts('provider')
  const budgets = Object.entries(labels.meta?.obras.budgets ?? {})
  const max = labels.meta?.obras.max_unlocks ?? 4
  const ctaTo = user?.role === 'provider' ? '/profesional' : '/registro?tipo=provider'
  const cta = (
    <Link to={ctaTo} className="mt-7 inline-flex h-12 w-full items-center justify-center rounded-md bg-primary px-6 text-base font-medium text-primary-foreground transition-colors hover:bg-primary/90">
      {user?.role === 'provider' ? t('providerPricing.ctaLogged') : t('providerPricing.cta')}
    </Link>
  )

  return (
    <div className="container py-12 sm:py-16 lg:py-20">
      <PageHead eyebrow={t('providerPricing.eyebrow')} title={t('providerPricing.title')} lead={t('providerPricing.lead')}>
        <Link to={ctaTo} className="btn-or">
          <span>{user?.role === 'provider' ? t('providerPricing.ctaLogged') : t('providerPricing.cta')}</span>
          <span aria-hidden className="btn-or__fleche">
            <ArrowRight className="h-4 w-4 rtl:-scale-x-100" strokeWidth={1.75} />
          </span>
        </Link>
      </PageHead>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <div className="rounded-3xl border border-foreground/[0.08] bg-card p-7">
          <SectionLabel>{t('providerPricing.costTitle')}</SectionLabel>
          <p className="mt-4 text-sm leading-relaxed text-foreground/70">{t('providerPricing.costText', { max })}</p>
          <table className="mt-6 w-full text-sm">
            <tbody>
              {budgets.map(([key, cost]) => (
                <tr key={key} className="border-b last:border-0">
                  <td className="py-3">{t(`budget.${key}`)}</td>
                  <td className="py-3 text-end font-semibold text-or-fonce">
                    <span className="inline-flex items-center gap-1.5">
                      <Coins className="h-4 w-4" aria-hidden />
                      {t('provider.cost', { count: cost })}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div>
          <SectionLabel>{t('providerPricing.packsTitle')}</SectionLabel>
          <div className="mt-6 grid gap-5 sm:grid-cols-3">
            {products.map((p, i) => (
              <PlanCard key={p.key} product={p} highlight={i === 1} cta={cta} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
