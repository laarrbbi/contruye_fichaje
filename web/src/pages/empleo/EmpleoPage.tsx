import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight, Search } from 'lucide-react'
import { useJobs } from '@/api/empleo'
import { useUser } from '@/api/auth'
import { JobCard } from '@/components/JobCard'
import { NightHero, RisingTitle } from '@/components/NightHero'
import { SectionLabel } from '@/components/PageHead'
import { ListSkeleton } from '@/components/States'
import { useProducts } from '@/components/Paywall'
import { useLabels } from '@/hooks/useLabels'
import { usePageTitle } from '@/hooks/usePageTitle'
import { formatCents } from '@/lib/utils'

export function EmpleoPage() {
  const { t, i18n } = useTranslation()
  usePageTitle(t('home.empleo.label'))
  const labels = useLabels()
  const navigate = useNavigate()
  const { data: user } = useUser()
  const [trade, setTrade] = useState('')
  const [province, setProvince] = useState('')
  const { data: latest, isLoading } = useJobs({ page: 1 })
  const cheapest = useProducts('employer').find((p) => p.key === 'offer_active')

  const search = (event: React.FormEvent) => {
    event.preventDefault()
    const params = new URLSearchParams()
    if (trade) params.set('oficio', trade)
    if (province) params.set('provincia', province)
    navigate(`/empleo/ofertas${params.size ? `?${params}` : ''}`)
  }

  const groups = Object.entries(labels.meta?.trade_groups ?? {})
  const selectClass = 'h-14 w-full cursor-pointer appearance-none rounded-xl bg-white/[0.06] px-4 text-[1rem] text-creme-100 ring-1 ring-white/15 outline-none focus:ring-2 focus:ring-[#E8A33D]'

  return (
    <>
      <NightHero className="pb-16 lg:pb-24">
        <div className="max-w-2xl pt-14 sm:pt-20 lg:pt-24">
          <p className="etiquette entree flex items-center gap-3 text-creme-100/65">
            <span aria-hidden className="h-px w-8 bg-or" />
            {t('empleo.eyebrow')}
          </p>
          <RisingTitle text={t('empleo.title')} className="mt-5 text-[clamp(2.4rem,1.5rem+4vw,4.5rem)] text-creme-100" delay={120} />
          <p className="entree mt-6 text-lg leading-relaxed text-creme-100/70" style={{ ['--d' as string]: '400ms' }}>
            {t('empleo.lead')}
          </p>
        </div>
        <form onSubmit={search} className="verre entree mt-10 grid gap-3 p-4 sm:grid-cols-[1fr_1fr_auto] sm:p-5 lg:max-w-4xl" style={{ ['--d' as string]: '550ms' }}>
          <label className="sr-only" htmlFor="empleo-trade">
            {t('empleo.searchTrade')}
          </label>
          <select id="empleo-trade" value={trade} onChange={(e) => setTrade(e.target.value)} className={selectClass}>
            <option value="" className="bg-sombre-900">
              {t('empleo.searchTrade')}: {t('common.all')}
            </option>
            {groups.map(([group, keys]) => (
              <optgroup key={group} label={t(`tradeGroups.${group}`)} className="bg-sombre-900">
                {keys.map((k) => (
                  <option key={k} value={k} className="bg-sombre-900">
                    {labels.trade(k)}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <label className="sr-only" htmlFor="empleo-province">
            {t('empleo.searchProvince')}
          </label>
          <select id="empleo-province" value={province} onChange={(e) => setProvince(e.target.value)} className={selectClass}>
            <option value="" className="bg-sombre-900">
              {t('common.allSpain')}
            </option>
            {(labels.meta?.provinces ?? []).map((p) => (
              <option key={p.code} value={p.code} className="bg-sombre-900">
                {p.name}
              </option>
            ))}
          </select>
          <button type="submit" className="btn-or">
            <span>{t('empleo.searchButton')}</span>
            <span aria-hidden className="btn-or__fleche">
              <Search className="h-4 w-4" strokeWidth={1.75} />
            </span>
          </button>
        </form>
        {user?.role !== 'worker' && (
          <Link to={user?.role === 'employer' ? '/empresa/ofertas/nueva' : '/empleo/empresas'} className="lien-edito entree mt-7 text-creme-100/85" style={{ ['--d' as string]: '650ms' }}>
            {t('empleo.employerCta')}
            <ArrowRight className="h-4 w-4 rtl:-scale-x-100" aria-hidden />
          </Link>
        )}
      </NightHero>

      <section className="container py-16 lg:py-24">
        <SectionLabel>{t('empleo.howTitle')}</SectionLabel>
        <div className="mt-8 grid gap-10 lg:grid-cols-2">
          {(['forWorkers', 'forEmployers'] as const).map((who) => (
            <div key={who}>
              <h2 className="titre text-[clamp(1.5rem,1.2rem+1vw,2.1rem)]">{t(`empleo.${who}`)}</h2>
              <ol className="mt-6 space-y-5">
                {[1, 2, 3].map((n) => (
                  <li key={n} className="flex gap-4">
                    <span className="titre grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary text-sm text-primary-foreground">{n}</span>
                    <div>
                      <p className="font-semibold">{t(`empleo.${who === 'forWorkers' ? 'workerSteps' : 'employerSteps'}.${n}.title`)}</p>
                      <p className="mt-1 text-sm leading-relaxed text-foreground/70">{t(`empleo.${who === 'forWorkers' ? 'workerSteps' : 'employerSteps'}.${n}.text`)}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-foreground/[0.06] bg-papier-50 py-16 lg:py-24">
        <div className="container">
          <div className="flex items-end justify-between gap-4">
            <div>
              <SectionLabel>{t('empleo.latest')}</SectionLabel>
            </div>
            <Link to="/empleo/ofertas" className="lien-edito text-primary">
              {t('common.seeAll')}
              <ArrowRight className="h-4 w-4 rtl:-scale-x-100" aria-hidden />
            </Link>
          </div>
          <div className="mt-8">
            {isLoading ? (
              <ListSkeleton rows={2} />
            ) : latest?.data.length ? (
              <div className="grid gap-4 md:grid-cols-2">
                {latest.data.slice(0, 6).map((job) => (
                  <JobCard key={job.id} job={job} />
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">{t('empleo.noLatest')}</p>
            )}
          </div>
        </div>
      </section>

      <section className="container py-16 lg:py-24">
        <SectionLabel>{t('empleo.trades')}</SectionLabel>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {groups.map(([group, keys]) => (
            <div key={group}>
              <p className="font-semibold">{t(`tradeGroups.${group}`)}</p>
              <ul className="mt-3 space-y-1.5 text-sm">
                {keys.map((k) => (
                  <li key={k}>
                    <Link to={`/empleo/ofertas?oficio=${k}`} className="text-foreground/70 transition-colors hover:text-primary">
                      {labels.trade(k)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="container pb-20">
        <div className="theme-night relative overflow-hidden rounded-3xl bg-[radial-gradient(110%_90%_at_80%_10%,#16294A,#0B1A2E_55%,#070F1C)] p-8 sm:p-12">
          <div aria-hidden className="plan-grille absolute inset-0" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-xl">
              <h2 className="titre text-[clamp(1.6rem,1.2rem+1.4vw,2.5rem)]">{t('empleo.companyBand.title')}</h2>
              <p className="mt-3 text-foreground/70">{t('empleo.companyBand.text', { price: cheapest ? formatCents(cheapest.price_c, i18n.language) : '' })}</p>
            </div>
            <Link to="/empleo/empresas" className="btn-or shrink-0">
              <span>{t('empleo.companyBand.cta')}</span>
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
