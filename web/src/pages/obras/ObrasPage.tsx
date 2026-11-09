import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight, ShieldCheck } from 'lucide-react'
import { useUser } from '@/api/auth'
import { NightHero, RisingTitle } from '@/components/NightHero'
import { SectionLabel } from '@/components/PageHead'
import { useLabels } from '@/hooks/useLabels'
import { usePageTitle } from '@/hooks/usePageTitle'

export function ObrasPage() {
  const { t } = useTranslation()
  usePageTitle(t('home.obras.label'))
  const labels = useLabels()
  const { data: user } = useUser()
  const max = labels.meta?.obras.max_unlocks ?? 4
  const ctaTo = user?.role === 'client' ? '/cliente/solicitudes/nueva' : '/registro?tipo=client'

  return (
    <>
      <NightHero photo="/photos/illustration-residence-plein.webp" video={false} className="pb-16 lg:pb-24">
        <div className="max-w-2xl pt-14 sm:pt-20 lg:pt-24">
          <p className="etiquette entree flex items-center gap-3 text-creme-100/65">
            <span aria-hidden className="h-px w-8 bg-or" />
            {t('obras.eyebrow')}
          </p>
          <RisingTitle text={t('obras.title')} className="mt-5 text-[clamp(2.4rem,1.5rem+4vw,4.5rem)] text-creme-100" delay={120} />
          <p className="entree mt-6 text-lg leading-relaxed text-creme-100/70" style={{ ['--d' as string]: '400ms' }}>
            {t('obras.lead', { max })}
          </p>
          <div className="entree mt-9 flex flex-wrap items-center gap-6" style={{ ['--d' as string]: '550ms' }}>
            <Link to={ctaTo} className="btn-or">
              <span>{t('obras.cta')}</span>
              <span aria-hidden className="btn-or__fleche">
                <ArrowRight className="h-4 w-4 rtl:-scale-x-100" strokeWidth={1.75} />
              </span>
            </Link>
            <Link to="/obras/empresas" className="lien-edito text-creme-100/85">
              {t('obras.ctaCompanies')}
            </Link>
          </div>
          <p className="entree mt-8 flex max-w-md items-start gap-2 text-sm text-creme-100/55" style={{ ['--d' as string]: '650ms' }}>
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#F1B860]" aria-hidden />
            {t('obras.privacy', { max })}
          </p>
        </div>
      </NightHero>

      <section className="container py-16 lg:py-24">
        <SectionLabel>{t('obras.howTitle')}</SectionLabel>
        <ol className="mt-8 grid gap-6 md:grid-cols-3">
          {[1, 2, 3].map((n) => (
            <li key={n} className="rounded-2xl border border-foreground/[0.08] bg-card p-7">
              <span className="titre text-4xl text-or">{n}</span>
              <p className="mt-4 text-lg font-semibold">{t(`obras.steps.${n}.title`, { max })}</p>
              <p className="mt-2 text-sm leading-relaxed text-foreground/70">{t(`obras.steps.${n}.text`)}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="border-y border-foreground/[0.06] bg-papier-50 py-16 lg:py-24">
        <div className="container">
          <SectionLabel>{t('obras.categoriesTitle')}</SectionLabel>
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {(labels.meta?.obras.categories ?? []).map((c) => (
              <Link key={c} to={user?.role === 'client' ? `/cliente/solicitudes/nueva?tipo=${c}` : '/registro?tipo=client'} className="rounded-xl border border-foreground/[0.08] bg-card px-4 py-3.5 text-sm font-medium transition-colors hover:border-primary/40 hover:text-primary">
                {labels.category(c)}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="container py-20">
        <div className="theme-night relative overflow-hidden rounded-3xl bg-[radial-gradient(110%_90%_at_80%_10%,#16294A,#0B1A2E_55%,#070F1C)] p-8 sm:p-12">
          <div aria-hidden className="plan-grille absolute inset-0" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-xl">
              <h2 className="titre text-[clamp(1.6rem,1.2rem+1.4vw,2.5rem)]">{t('obras.providerBand.title')}</h2>
              <p className="mt-3 text-foreground/70">{t('obras.providerBand.text')}</p>
            </div>
            <Link to="/obras/profesionales" className="btn-or shrink-0">
              <span>{t('obras.providerBand.cta')}</span>
              <span aria-hidden className="btn-or__fleche">
                <ArrowRight className="h-4 w-4 rtl:-scale-x-100" strokeWidth={1.75} />
              </span>
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
