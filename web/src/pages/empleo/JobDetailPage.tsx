import { useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, BadgeCheck, BedDouble, Briefcase, CalendarClock, Car, Check, Clock, GraduationCap, MapPin, MessageSquare, Sparkles, Users, Wallet } from 'lucide-react'
import { useUser } from '@/api/auth'
import { errorMessage } from '@/api/client'
import { useApply, useJob, useMyApplications } from '@/api/empleo'
import { Tag } from '@/components/Tag'
import { EmptyState, ListSkeleton } from '@/components/States'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { useLabels } from '@/hooks/useLabels'
import { usePageTitle } from '@/hooks/usePageTitle'
import { formatRelative } from '@/lib/utils'

export function JobDetailPage() {
  const { t, i18n } = useTranslation()
  const { id } = useParams()
  const jobId = Number(id)
  const { data: job, isLoading, isError } = useJob(jobId)
  usePageTitle(job?.title)
  const labels = useLabels()

  if (isLoading) {
    return (
      <div className="container py-12">
        <ListSkeleton rows={2} className="h-64" />
      </div>
    )
  }
  if (isError || !job) {
    return (
      <div className="container py-16">
        <EmptyState
          title={t('jobs.notFound')}
          action={
            <Button asChild variant="outline">
              <Link to="/empleo/ofertas">{t('jobs.backToBoard')}</Link>
            </Button>
          }
        />
      </div>
    )
  }

  const facts = [
    { icon: MapPin, label: t('employer.form.where'), value: labels.place(job.city, job.province) },
    { icon: Wallet, label: t('employer.form.salary'), value: labels.salary(job) },
    { icon: Briefcase, label: t('jobs.contract'), value: t(`contract.${job.contract_type}`) },
    { icon: Clock, label: t('jobs.workday'), value: t(`workday.${job.workday}`) },
    { icon: CalendarClock, label: t('jobs.start'), value: t(`start.${job.start}`) },
    { icon: GraduationCap, label: t('jobs.experience'), value: job.experience_min ? t('common.years', { count: job.experience_min }) : t('jobs.noExperience') },
    { icon: Users, label: t('employer.form.vacancies'), value: t('jobs.vacancies', { count: job.vacancies }) },
  ]

  return (
    <div className="container py-10 pb-28 sm:py-14 lg:pb-14">
      <Link to="/empleo/ofertas" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4 rtl:-scale-x-100" aria-hidden />
        {t('jobs.backToBoard')}
      </Link>

      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {job.featured && (
              <Tag tone="amber">
                <Sparkles className="h-3.5 w-3.5" aria-hidden />
                {t('jobs.featured')}
              </Tag>
            )}
            <Tag tone="blue">{labels.trade(job.trade)}</Tag>
            <span className="text-xs text-muted-foreground">{t('jobs.published', { when: formatRelative(job.published_at, i18n.language) })}</span>
          </div>
          <h1 className="bidi-auto titre mt-4 text-[clamp(1.9rem,1.4rem+2vw,3rem)]">{job.title}</h1>
          <p className="mt-2 text-lg font-medium text-foreground/70">{job.company.name}</p>

          <dl className="mt-8 grid gap-4 rounded-2xl border border-foreground/[0.08] bg-card p-6 sm:grid-cols-2">
            {facts.map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex gap-3">
                <Icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
                <div>
                  <dt className="text-xs uppercase tracking-wider text-muted-foreground">{label}</dt>
                  <dd className="font-medium">{value}</dd>
                </div>
              </div>
            ))}
          </dl>

          <div className="mt-4 flex flex-wrap gap-2">
            {job.requires_tpc && (
              <Tag>
                <BadgeCheck className="h-3.5 w-3.5" aria-hidden />
                {t('employer.form.requiresTpc')}
              </Tag>
            )}
            {job.requires_license && (
              <Tag>
                <Car className="h-3.5 w-3.5" aria-hidden />
                {t('employer.form.requiresLicense')}
              </Tag>
            )}
            {job.accommodation && (
              <Tag>
                <BedDouble className="h-3.5 w-3.5" aria-hidden />
                {t('employer.form.accommodation')}
              </Tag>
            )}
          </div>

          <section className="mt-10">
            <h2 className="titre text-xl">{t('jobs.description')}</h2>
            <p className="bidi-auto mt-3 whitespace-pre-line leading-relaxed text-foreground/80">{job.description}</p>
          </section>
          {job.requirements && (
            <section className="mt-8">
              <h2 className="titre text-xl">{t('jobs.requirements')}</h2>
              <ul className="mt-3 space-y-2">
                {job.requirements
                  .split('\n')
                  .map((line) => line.trim())
                  .filter(Boolean)
                  .map((line) => (
                    <li key={line} className="flex gap-2.5 text-foreground/80">
                      <Check className="mt-1 h-4 w-4 shrink-0 text-success" aria-hidden />
                      <span className="bidi-auto">{line}</span>
                    </li>
                  ))}
              </ul>
            </section>
          )}
          {job.company.description && (
            <section className="mt-8">
              <h2 className="titre text-xl">{t('jobs.aboutCompany')}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {[job.company.sector && t(`sector.${job.company.sector}`), job.company.size && t(`size.${job.company.size}`)].filter(Boolean).join(' · ')}
              </p>
              <p className="bidi-auto mt-3 leading-relaxed text-foreground/80">{job.company.description}</p>
            </section>
          )}
        </div>

        <aside id="inscripcion" className="scroll-mt-24 lg:sticky lg:top-24 lg:self-start">
          <ApplyCard jobId={job.id} live={job.status === 'active' && new Date(job.expires_at) > new Date()} applied={!!job.applied} status={job.application_status ?? null} own={!!job.own} />
        </aside>
      </div>
      {!job.applied && !job.own && job.status === 'active' && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-foreground/10 bg-creme-100/90 p-3 backdrop-blur-md lg:hidden">
          <a href="#inscripcion" className="btn-or w-full">
            <span>{t('jobs.apply.button')}</span>
            <span aria-hidden className="btn-or__fleche">
              <Check className="h-4 w-4" strokeWidth={2} />
            </span>
          </a>
        </div>
      )}
    </div>
  )
}

/** The one action of the page, for whoever is looking. */
function ApplyCard({ jobId, live, applied, status, own }: { jobId: number; live: boolean; applied: boolean; status: string | null; own: boolean }) {
  const { t } = useTranslation()
  const location = useLocation()
  const { data: user } = useUser()
  const apply = useApply(jobId)
  const { data: mine } = useMyApplications(user?.role === 'worker' && applied)
  const [message, setMessage] = useState('')
  const conversationId = mine?.find((a) => a.job.id === jobId)?.conversation_id ?? null

  return (
    <Card className="theme-night overflow-hidden border-transparent bg-[radial-gradient(120%_90%_at_80%_0%,#16294A,#0B1A2E_60%)] shadow-float">
      <CardContent className="p-6 sm:p-7">
        {own ? (
          <>
            <p className="titre text-xl">{t('jobs.apply.own')}</p>
            <Button asChild variant="accent" size="lg" className="mt-5 w-full">
              <Link to={`/empresa/ofertas/${jobId}`}>{t('jobs.apply.manage')}</Link>
            </Button>
          </>
        ) : applied ? (
          <>
            <span className="grid h-12 w-12 place-items-center rounded-full bg-success/20 text-[#5DD39A]">
              <Check className="h-6 w-6" aria-hidden />
            </span>
            <p className="titre mt-4 text-xl">{t('jobs.apply.done')}</p>
            <p className="mt-2 text-sm leading-relaxed text-foreground/70">{t('jobs.apply.doneText')}</p>
            {status && <p className="mt-3 text-sm font-medium text-or">{t('jobs.apply.status', { status: t(`appStatus.${status}`) })}</p>}
            {conversationId && (
              <Button asChild variant="accent" className="mt-5 w-full">
                <Link to={`/mensajes/${conversationId}`}>
                  <MessageSquare className="h-4 w-4" aria-hidden />
                  {t('jobs.apply.openChat')}
                </Link>
              </Button>
            )}
          </>
        ) : !live ? (
          <p className="text-foreground/75">{t('jobs.apply.closed')}</p>
        ) : !user ? (
          <>
            <p className="titre text-xl">{t('jobs.apply.guest')}</p>
            <p className="mt-2 text-sm leading-relaxed text-foreground/70">{t('jobs.apply.guestText')}</p>
            <Link to="/registro?tipo=worker" state={{ from: location.pathname }} className="btn-or mt-6 w-full">
              <span>{t('nav.register')}</span>
              <span aria-hidden className="btn-or__fleche">
                <ArrowLeft className="h-4 w-4 rotate-180 rtl:rotate-0" strokeWidth={1.75} />
              </span>
            </Link>
            <Button asChild variant="ghost" className="mt-3 w-full text-foreground">
              <Link to="/login" state={{ from: location.pathname }}>
                {t('jobs.apply.login')}
              </Link>
            </Button>
          </>
        ) : user.role !== 'worker' ? (
          <p className="text-foreground/75">{t('jobs.apply.notWorker')}</p>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              apply.mutate(message.trim() || undefined)
            }}
          >
            <p className="titre text-xl">{t('jobs.apply.title')}</p>
            <label htmlFor="apply-message" className="mt-5 block text-sm font-medium">
              {t('jobs.apply.messageLabel')}
            </label>
            <Textarea id="apply-message" value={message} onChange={(e) => setMessage(e.target.value)} maxLength={600} rows={3} className="mt-2 border-white/15 bg-white/[0.05]" />
            <p className="mt-1.5 text-xs text-foreground/55">{t('jobs.apply.messageHint')}</p>
            {apply.isError && <p className="mt-3 text-sm text-[#F2A38E]">{errorMessage(apply.error, t('common.error'))}</p>}
            <button type="submit" className="btn-or mt-5 w-full" disabled={apply.isPending}>
              <span>{t('jobs.apply.button')}</span>
              <span aria-hidden className="btn-or__fleche">
                <Check className="h-4 w-4" strokeWidth={2} />
              </span>
            </button>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
