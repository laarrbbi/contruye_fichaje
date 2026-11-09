import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight } from 'lucide-react'
import { useUser } from '@/api/auth'
import { PageHead, SectionLabel } from '@/components/PageHead'
import { PlanCard, useProducts } from '@/components/Paywall'
import { usePageTitle } from '@/hooks/usePageTitle'

export function EmployerPricingPage() {
  const { t } = useTranslation()
  usePageTitle(t('employerPricing.title'))
  const { data: user } = useUser()
  const products = useProducts('employer')
  const byKey = (k: string) => products.find((p) => p.key === k)
  const ctaTo = user?.role === 'employer' ? '/empresa' : '/registro?tipo=employer'
  const cta = (
    <Link to={ctaTo} className="btn-or mt-7 w-full">
      <span>{user?.role === 'employer' ? t('employerPricing.ctaLogged') : t('employerPricing.cta')}</span>
      <span aria-hidden className="btn-or__fleche">
        <ArrowRight className="h-4 w-4 rtl:-scale-x-100" strokeWidth={1.75} />
      </span>
    </Link>
  )
  const linkCta = (
    <Link to={ctaTo} className="mt-7 inline-flex h-12 w-full items-center justify-center rounded-md bg-primary px-6 text-base font-medium text-primary-foreground transition-colors hover:bg-primary/90">
      {user?.role === 'employer' ? t('employerPricing.ctaLogged') : t('nav.register')}
    </Link>
  )

  return (
    <div className="container py-12 sm:py-16 lg:py-20">
      <PageHead eyebrow={t('employerPricing.eyebrow')} title={t('employerPricing.title')} lead={t('employerPricing.lead')} />

      <ol className="grid gap-6 sm:grid-cols-3">
        {[1, 2, 3].map((n) => (
          <li key={n} className="rounded-2xl border border-foreground/[0.08] bg-card p-6">
            <span className="titre text-3xl text-or">{n}</span>
            <p className="mt-3 font-semibold">{t(`employerPricing.steps.${n}.title`)}</p>
            <p className="mt-1.5 text-sm leading-relaxed text-foreground/70">{t(`employerPricing.steps.${n}.text`)}</p>
          </li>
        ))}
      </ol>

      <SectionLabel className="mt-16">{t('employerPricing.plansTitle')}</SectionLabel>
      <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <PlanCard product={{ key: 'free', price_c: 0, credits: null, days: 30, needs_offer: false, featured: false, pass: false }} cta={cta} />
        {byKey('offer_active') && <PlanCard product={byKey('offer_active')!} cta={linkCta} />}
        {byKey('offer_premium') && <PlanCard product={byKey('offer_premium')!} highlight cta={linkCta} />}
        {byKey('employer_pass') && <PlanCard product={byKey('employer_pass')!} cta={linkCta} />}
      </div>
      {byKey('contacts_10') && (
        <div className="mt-6 max-w-md">
          <PlanCard product={byKey('contacts_10')!} cta={linkCta} />
        </div>
      )}

      <SectionLabel className="mt-16">{t('employerPricing.faqTitle')}</SectionLabel>
      <dl className="mt-6 grid gap-6 lg:grid-cols-2">
        {[1, 2, 3, 4].map((n) => (
          <div key={n} className="rounded-2xl border border-foreground/[0.08] bg-card p-6">
            <dt className="font-semibold">{t(`employerPricing.faq.${n}.q`)}</dt>
            <dd className="mt-2 text-sm leading-relaxed text-foreground/75">{t(`employerPricing.faq.${n}.a`)}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
