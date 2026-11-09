import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Eye, Lock, Plus, Sparkles, Unlock, Users } from 'lucide-react'
import { useUser } from '@/api/auth'
import { useOwnJobs } from '@/api/empleo'
import { PageHead } from '@/components/PageHead'
import { EmptyState, ErrorState, ListSkeleton } from '@/components/States'
import { Tag } from '@/components/Tag'
import { Button } from '@/components/ui/button'
import { useLabels } from '@/hooks/useLabels'
import { usePageTitle } from '@/hooks/usePageTitle'
import { formatDate } from '@/lib/utils'

export function EmployerHomePage() {
  const { t, i18n } = useTranslation()
  usePageTitle(t('employer.title'))
  const labels = useLabels()
  const { data: user } = useUser()
  const { data: jobs, isLoading, isError, refetch } = useOwnJobs()
  const pass = user?.pass_until && new Date(user.pass_until) > new Date() ? user.pass_until : null

  return (
    <div className="container py-12 sm:py-16">
      <PageHead eyebrow={user ? t('employer.hello', { name: user.name.split(' ')[0] }) : undefined} title={t('employer.title')} lead={t('employer.lead')}>
        <Button asChild variant="accent" size="lg">
          <Link to="/empresa/ofertas/nueva">
            <Plus className="h-4 w-4" aria-hidden />
            {t('employer.new')}
          </Link>
        </Button>
      </PageHead>

      {(pass || (user?.credits ?? 0) > 0) && (
        <div className="mb-8 flex flex-col gap-2 rounded-2xl border border-success/30 bg-success/[0.06] p-5 text-sm">
          {pass && <p className="font-medium text-success">{t('employer.passActive', { date: formatDate(pass, i18n.language) })}</p>}
          {(user?.credits ?? 0) > 0 && <p className="text-foreground/75">{t('employer.credits', { count: user?.credits })}</p>}
        </div>
      )}

      {isLoading ? (
        <ListSkeleton />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !jobs?.length ? (
        <EmptyState
          title={t('employer.empty')}
          icon={<Plus className="h-6 w-6" />}
          action={
            <Button asChild variant="accent" size="lg">
              <Link to="/empresa/ofertas/nueva">{t('employer.emptyCta')}</Link>
            </Button>
          }
        />
      ) : (
        <ul className="grid gap-4">
          {jobs.map((job) => {
            const expired = new Date(job.expires_at) < new Date()
            return (
              <li key={job.id} className="flex flex-col gap-5 rounded-2xl border border-foreground/[0.08] bg-card p-5 sm:p-6 lg:flex-row lg:items-center">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {job.status === 'closed' ? <Tag tone="red">{t('employer.closed')}</Tag> : expired ? <Tag tone="red">{t('employer.expired')}</Tag> : <Tag tone="green">{t('employer.active')}</Tag>}
                    {job.featured && (
                      <Tag tone="amber">
                        <Sparkles className="h-3.5 w-3.5" aria-hidden />
                        {t('jobs.featured')}
                      </Tag>
                    )}
                    {job.unlocked ? (
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
                  <Link to={`/empresa/ofertas/${job.id}`} className="bidi-auto mt-2 block text-lg font-semibold hover:text-primary">
                    {job.title}
                  </Link>
                  <p className="text-sm text-foreground/70">
                    {labels.trade(job.trade)} · {labels.place(job.city, job.province)} · {labels.salary(job)}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                  <span className="inline-flex items-center gap-1.5 font-semibold">
                    <Users className="h-4 w-4 text-muted-foreground" aria-hidden />
                    {t('employer.applicants', { count: job.applications_count })}
                    {job.new_applications_count > 0 && <span className="rounded-full bg-or px-2 text-xs font-semibold text-plume">{t('employer.newApplicants', { count: job.new_applications_count })}</span>}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                    <Eye className="h-4 w-4" aria-hidden />
                    {t('employer.views', { count: job.views })}
                  </span>
                  <Button asChild variant={job.new_applications_count > 0 ? 'accent' : 'outline'}>
                    <Link to={`/empresa/ofertas/${job.id}`}>{t('employer.seeApplicants')}</Link>
                  </Button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
