import { useRef } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Check, ExternalLink, Lock, MessageSquare, Pencil, Star, Unlock, UserCheck, X } from 'lucide-react'
import { errorCode } from '@/api/client'
import { useApplicantStatus, useApplicants, useJobStatus, useOpenApplicantChat, useOwnJob } from '@/api/empleo'
import type { Applicant } from '@/api/types'
import { PlanCard, useBuy, useProducts } from '@/components/Paywall'
import { EmptyState, ErrorState, ListSkeleton } from '@/components/States'
import { Tag } from '@/components/Tag'
import { ContactLines, WorkerDetails, WorkerHeader } from '@/components/WorkerFacts'
import { Button } from '@/components/ui/button'
import { useLabels } from '@/hooks/useLabels'
import { usePageTitle } from '@/hooks/usePageTitle'
import { cn, formatDate, formatRelative } from '@/lib/utils'

const STATUS_TONE = { new: 'amber', seen: 'plain', shortlisted: 'blue', rejected: 'red', hired: 'green' } as const

/**
 * Who applied to one offer. The free tier shows every applicant's profile;
 * the paywall sits between the profile and the person: name, phone, e-mail
 * and the chat open once the offer is activated.
 */
export function ApplicantsPage() {
  const { t, i18n } = useTranslation()
  const { id } = useParams()
  const jobId = Number(id)
  const navigate = useNavigate()
  const labels = useLabels()
  const { data: job, isLoading: jobLoading } = useOwnJob(jobId)
  const { data, isLoading, isError, refetch } = useApplicants(jobId)
  usePageTitle(job?.title)
  const status = useJobStatus(jobId)
  const products = useProducts('employer').filter((p) => p.needs_offer)
  const { buy, pending, error: buyError } = useBuy()
  const paywall = useRef<HTMLDivElement>(null)

  const applicants = data?.data ?? []
  const unlocked = data?.meta.unlocked ?? job?.unlocked ?? false
  // Someone already reached through another offer, or a chat, is not behind this paywall.
  const lockedCount = applicants.filter((a) => !a.worker.unlocked).length

  if (jobLoading) {
    return (
      <div className="container py-12">
        <ListSkeleton rows={3} />
      </div>
    )
  }
  if (!job) {
    return (
      <div className="container py-16">
        <EmptyState title={t('notFound.title')} action={<Button asChild variant="outline"><Link to="/empresa">{t('common.back')}</Link></Button>} />
      </div>
    )
  }

  return (
    <div className="container py-10 sm:py-14">
      <Link to="/empresa" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4 rtl:-scale-x-100" aria-hidden />
        {t('nav.employer.home')}
      </Link>

      <header className="mt-6 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap gap-2">
            {job.status === 'closed' ? <Tag tone="red">{t('employer.closed')}</Tag> : <Tag tone="green">{t('employer.active')}</Tag>}
            {unlocked ? (
              <Tag tone="blue">
                <Unlock className="h-3.5 w-3.5" aria-hidden />
                {job.unlocked_until ? t('employer.unlockedUntil', { date: formatDate(job.unlocked_until, i18n.language) }) : t('employer.passUnlocked')}
              </Tag>
            ) : (
              <Tag>
                <Lock className="h-3.5 w-3.5" aria-hidden />
                {t('employer.locked')}
              </Tag>
            )}
          </div>
          <h1 className="bidi-auto titre mt-3 text-[clamp(1.75rem,1.3rem+1.8vw,2.75rem)]">{job.title}</h1>
          <p className="mt-1 text-foreground/70">
            {labels.trade(job.trade)} · {labels.place(job.city, job.province)} · {labels.salary(job)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link to={`/empresa/ofertas/${job.id}/editar`}>
              <Pencil className="h-4 w-4" aria-hidden />
              {t('employer.job.edit')}
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to={`/empleo/ofertas/${job.id}`}>
              <ExternalLink className="h-4 w-4" aria-hidden />
              {t('employer.job.public')}
            </Link>
          </Button>
          {job.status === 'active' ? (
            <Button variant="ghost" onClick={() => status.mutate('close')} disabled={status.isPending}>
              {t('employer.job.close')}
            </Button>
          ) : (
            <Button variant="ghost" onClick={() => status.mutate('reopen')} disabled={status.isPending}>
              {t('employer.job.reopen')}
            </Button>
          )}
        </div>
      </header>

      {unlocked ? (
        job.unlocked_until && (
          <p className="mt-8 rounded-2xl border border-success/30 bg-success/[0.06] p-4 text-sm font-medium text-success">{t('employer.job.unlockedBanner', { date: formatDate(job.unlocked_until, i18n.language) })}</p>
        )
      ) : (
        <div ref={paywall} className="theme-night relative mt-8 scroll-mt-24 overflow-hidden rounded-3xl bg-[radial-gradient(110%_90%_at_80%_10%,#16294A,#0B1A2E_55%,#070F1C)] p-6 sm:p-10">
          <div aria-hidden className="plan-grille absolute inset-0" />
          <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] lg:items-center">
            <div>
              <span className="grid h-12 w-12 place-items-center rounded-full bg-or/20 text-or">
                <Lock className="h-6 w-6" aria-hidden />
              </span>
              <h2 className="titre mt-5 text-[clamp(1.5rem,1.2rem+1vw,2.1rem)]">{lockedCount > 0 ? t('employer.job.lockedTitle', { count: lockedCount }) : t('employer.job.lockedTitleNone')}</h2>
              <p className="mt-3 leading-relaxed text-foreground/70">{t('employer.job.lockedText')}</p>
              <p className="mt-4 text-sm text-foreground/60">
                {t('employer.job.orPass')}{' '}
                <Link to="/empresa/plan" className="font-semibold text-or underline-offset-4 hover:underline">
                  {t('products.employer_pass.name')}
                </Link>
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {products.map((p) => (
                <PlanCard key={p.key} product={p} highlight={p.featured} busy={pending === p.key} onBuy={() => buy(p.key, job.id)} />
              ))}
            </div>
          </div>
          {buyError && <p className="relative mt-4 text-sm text-[#F2A38E]">{buyError}</p>}
        </div>
      )}

      <section className="mt-10">
        <h2 className="titre text-2xl">
          {t('employer.job.applicants')} <span className="text-foreground/50">({applicants.length})</span>
        </h2>
        <div className="mt-6">
          {isLoading ? (
            <ListSkeleton />
          ) : isError ? (
            <ErrorState onRetry={() => refetch()} />
          ) : !applicants.length ? (
            <EmptyState title={t('employer.job.noApplicants')} />
          ) : (
            <ul className="grid gap-4 lg:grid-cols-2">
              {applicants.map((a) => (
                <ApplicantCard key={a.id} jobId={job.id} applicant={a} onLocked={() => paywall.current?.scrollIntoView({ behavior: 'smooth' })} onChat={(c) => navigate(`/mensajes/${c}`)} lang={i18n.language} />
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  )
}

function ApplicantCard({ jobId, applicant, onLocked, onChat, lang }: { jobId: number; applicant: Applicant; onLocked(): void; onChat(id: number): void; lang: string }) {
  const { t } = useTranslation()
  const setStatus = useApplicantStatus(jobId)
  const openChat = useOpenApplicantChat()
  const w = applicant.worker

  const chat = () => {
    if (w.conversation_id) return onChat(w.conversation_id)
    if (!w.unlocked) return onLocked()
    openChat.mutate(applicant.id, {
      onSuccess: ({ conversation_id }) => onChat(conversation_id),
      onError: (error) => {
        if (errorCode(error) === 'offer_locked') onLocked()
      },
    })
  }

  return (
    <li className={cn('flex flex-col gap-4 rounded-2xl border bg-card p-5 sm:p-6', applicant.status === 'rejected' ? 'border-foreground/[0.06] opacity-70' : 'border-foreground/[0.08]')}>
      <div className="flex items-start justify-between gap-3">
        <WorkerHeader worker={w} />
        <Tag tone={STATUS_TONE[applicant.status]} className="shrink-0">
          {t(`appStatus.${applicant.status}`)}
        </Tag>
      </div>
      <WorkerDetails worker={w} compact={false} />
      {applicant.message && <blockquote className="bidi-auto rounded-xl border-s-4 border-or/60 bg-secondary/60 px-4 py-3 text-sm text-foreground/80">{applicant.message}</blockquote>}
      <div className="rounded-xl bg-secondary/50 p-3">
        <ContactLines phone={w.phone} email={w.email} unlocked={w.unlocked} />
      </div>
      <p className="text-xs text-muted-foreground">{t('employer.job.applied', { when: formatRelative(applicant.applied_at, lang) })}</p>
      <div className="mt-auto flex flex-wrap gap-2 border-t pt-4">
        <Button variant={w.unlocked ? 'accent' : 'default'} size="sm" onClick={chat} disabled={openChat.isPending}>
          {w.unlocked ? <MessageSquare className="h-4 w-4" aria-hidden /> : <Lock className="h-4 w-4" aria-hidden />}
          {w.conversation_id ? t('employer.job.continueChat') : w.unlocked ? t('employer.job.openChat') : t('paywall.unlock')}
        </Button>
        <Button variant="outline" size="sm" onClick={() => setStatus.mutate({ id: applicant.id, status: 'shortlisted' })} disabled={applicant.status === 'shortlisted'}>
          <Star className="h-4 w-4" aria-hidden />
          {t('employer.job.shortlist')}
        </Button>
        <Button variant="outline" size="sm" onClick={() => setStatus.mutate({ id: applicant.id, status: 'hired' })} disabled={applicant.status === 'hired'}>
          {applicant.status === 'hired' ? <Check className="h-4 w-4" aria-hidden /> : <UserCheck className="h-4 w-4" aria-hidden />}
          {t('employer.job.hire')}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setStatus.mutate({ id: applicant.id, status: 'rejected' })} disabled={applicant.status === 'rejected'}>
          <X className="h-4 w-4" aria-hidden />
          {t('employer.job.reject')}
        </Button>
      </div>
    </li>
  )
}
