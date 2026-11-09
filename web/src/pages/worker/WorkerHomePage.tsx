import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight, MessageSquare, Search, UserRound } from 'lucide-react'
import { useUser } from '@/api/auth'
import { useMyApplications, useWithdraw } from '@/api/empleo'
import type { WorkerProfile } from '@/api/types'
import { PageHead } from '@/components/PageHead'
import { EmptyState, ErrorState, ListSkeleton } from '@/components/States'
import { Tag } from '@/components/Tag'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useLabels } from '@/hooks/useLabels'
import { usePageTitle } from '@/hooks/usePageTitle'
import { formatRelative } from '@/lib/utils'

const STATUS_TONE = { new: 'plain', seen: 'blue', shortlisted: 'amber', rejected: 'red', hired: 'green' } as const

export function WorkerHomePage() {
  const { t, i18n } = useTranslation()
  usePageTitle(t('worker.title'))
  const labels = useLabels()
  const { data: user } = useUser()
  const { data: applications, isLoading, isError, refetch } = useMyApplications()
  const withdraw = useWithdraw()
  const profile = user?.profile as WorkerProfile | null
  const incomplete = !profile?.bio || !profile?.headline
  const firstName = user?.name.split(' ')[0]

  const stats = [
    { label: t('worker.statsApplied'), value: applications?.length ?? 0 },
    { label: t('worker.statsShortlisted'), value: applications?.filter((a) => a.status === 'shortlisted' || a.status === 'hired').length ?? 0 },
    { label: t('worker.statsChats'), value: applications?.filter((a) => a.conversation_id).length ?? 0 },
  ]

  return (
    <div className="container py-12 sm:py-16">
      <PageHead eyebrow={firstName ? t('worker.hello', { name: firstName }) : undefined} title={t('worker.title')} lead={t('worker.lead')}>
        <Button asChild variant="accent" size="lg">
          <Link to="/empleo/ofertas">
            <Search className="h-4 w-4" aria-hidden />
            {t('worker.browse')}
          </Link>
        </Button>
      </PageHead>

      {incomplete && (
        <Card className="theme-night mb-8 border-transparent bg-[radial-gradient(120%_90%_at_80%_0%,#16294A,#0B1A2E_60%)]">
          <CardContent className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
            <div className="flex gap-4">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-or/20 text-or">
                <UserRound className="h-6 w-6" aria-hidden />
              </span>
              <div>
                <p className="titre text-xl">{t('worker.completeTitle')}</p>
                <p className="mt-1 max-w-lg text-sm text-foreground/70">{t('worker.completeText')}</p>
              </div>
            </div>
            <Button asChild variant="accent">
              <Link to="/trabajador/perfil">{t('worker.completeCta')}</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <dl className="mb-8 grid grid-cols-3 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-foreground/[0.08] bg-card p-5">
            <dt className="text-xs uppercase tracking-wider text-muted-foreground">{s.label}</dt>
            <dd className="titre mt-2 text-3xl tabular-nums">{s.value}</dd>
          </div>
        ))}
      </dl>

      {isLoading ? (
        <ListSkeleton />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !applications?.length ? (
        <EmptyState
          title={t('worker.empty')}
          icon={<Search className="h-6 w-6" />}
          action={
            <Button asChild variant="accent" size="lg">
              <Link to="/empleo/ofertas">{t('worker.browse')}</Link>
            </Button>
          }
        />
      ) : (
        <ul className="grid gap-4">
          {applications.map((a) => (
            <li key={a.id} className="flex flex-col gap-4 rounded-2xl border border-foreground/[0.08] bg-card p-5 sm:flex-row sm:items-center sm:p-6">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Tag tone={STATUS_TONE[a.status]}>{t(`appStatus.${a.status}`)}</Tag>
                  <span className="text-xs text-muted-foreground">{formatRelative(a.applied_at, i18n.language)}</span>
                </div>
                <Link to={`/empleo/ofertas/${a.job.id}`} className="bidi-auto mt-2 block text-lg font-semibold hover:text-primary">
                  {a.job.title}
                </Link>
                <p className="text-sm text-foreground/70">
                  {a.job.company.name} · {labels.place(a.job.city, a.job.province)} · {labels.salary(a.job)}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                {a.conversation_id ? (
                  <Button asChild variant="accent">
                    <Link to={`/mensajes/${a.conversation_id}`}>
                      <MessageSquare className="h-4 w-4" aria-hidden />
                      {t('jobs.apply.openChat')}
                    </Link>
                  </Button>
                ) : (
                  <Button asChild variant="outline">
                    <Link to={`/empleo/ofertas/${a.job.id}`}>
                      <ArrowRight className="h-4 w-4 rtl:-scale-x-100" aria-hidden />
                    </Link>
                  </Button>
                )}
                {a.status !== 'hired' && (
                  <Button
                    variant="ghost"
                    onClick={() => {
                      if (window.confirm(t('worker.withdrawConfirm'))) withdraw.mutate(a.id)
                    }}
                  >
                    {t('worker.withdraw')}
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
