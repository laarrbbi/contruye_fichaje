import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Lock, MessageSquare, Users } from 'lucide-react'
import { useUser } from '@/api/auth'
import { errorCode } from '@/api/client'
import { useContactWorker, useWorkers } from '@/api/empleo'
import type { WorkerCard } from '@/api/types'
import { CheckRow, NativeSelect } from '@/components/Field'
import { PageHead } from '@/components/PageHead'
import { BuyCreditsDialog } from '@/components/Paywall'
import { EmptyState, ErrorState, ListSkeleton, Pagination } from '@/components/States'
import { ContactLines, WorkerDetails, WorkerHeader } from '@/components/WorkerFacts'
import { Button } from '@/components/ui/button'
import { useLabels } from '@/hooks/useLabels'
import { usePageTitle } from '@/hooks/usePageTitle'

/** Search for free; writing to someone new spends one contact. */
export function WorkerDirectoryPage() {
  const { t } = useTranslation()
  usePageTitle(t('employer.workers.title'))
  const labels = useLabels()
  const navigate = useNavigate()
  const { data: user } = useUser()
  const [params, setParams] = useSearchParams()
  const filters = {
    trade: params.get('oficio') ?? '',
    province: params.get('provincia') ?? '',
    availability: params.get('disponibilidad') ?? '',
    has_tpc: params.get('tpc') === '1',
    min_years: Number(params.get('anos') ?? 0) || undefined,
    page: Number(params.get('pagina') ?? 1) || 1,
  }
  const { data, isLoading, isError, refetch } = useWorkers(filters)
  const contact = useContactWorker()
  const [noCredits, setNoCredits] = useState(false)

  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    if (key !== 'pagina') next.delete('pagina')
    setParams(next)
  }

  const reach = (worker: WorkerCard) => {
    if (worker.conversation_id) return navigate(`/mensajes/${worker.conversation_id}`)
    contact.mutate(worker.id, {
      onSuccess: ({ conversation_id }) => navigate(`/mensajes/${conversation_id}`),
      onError: (error) => {
        if (errorCode(error) === 'insufficient_credits') setNoCredits(true)
      },
    })
  }

  return (
    <div className="container py-12 sm:py-16">
      <PageHead eyebrow={t('empleo.eyebrow')} title={t('employer.workers.title')} lead={t('employer.workers.lead')}>
        <div className="rounded-2xl border border-foreground/[0.08] bg-card px-5 py-3 text-sm">
          <span className="text-muted-foreground">{t('billing.balance')}: </span>
          <span className="font-semibold">{t('common.contacts', { count: user?.credits ?? 0 })}</span>
        </div>
      </PageHead>

      <div className="grid gap-3 rounded-2xl border border-foreground/[0.08] bg-card p-4 sm:grid-cols-2 lg:grid-cols-[1.4fr_1.2fr_1.1fr_1fr_auto] lg:items-center">
        <NativeSelect aria-label={t('jobs.trade')} value={filters.trade} onChange={(e) => update('oficio', e.target.value)}>
          <option value="">
            {t('jobs.trade')}: {t('common.all')}
          </option>
          {Object.entries(labels.meta?.trade_groups ?? {}).map(([group, keys]) => (
            <optgroup key={group} label={t(`tradeGroups.${group}`)}>
              {keys.map((k) => (
                <option key={k} value={k}>
                  {labels.trade(k)}
                </option>
              ))}
            </optgroup>
          ))}
        </NativeSelect>
        <NativeSelect aria-label={t('common.province')} value={filters.province} onChange={(e) => update('provincia', e.target.value)}>
          <option value="">{t('common.allSpain')}</option>
          {(labels.meta?.provinces ?? []).map((p) => (
            <option key={p.code} value={p.code}>
              {p.name}
            </option>
          ))}
        </NativeSelect>
        <NativeSelect aria-label={t('worker.profile.availability')} value={filters.availability} onChange={(e) => update('disponibilidad', e.target.value)}>
          <option value="">
            {t('worker.profile.availability')}: {t('common.any')}
          </option>
          {(['immediate', 'two_weeks', 'month', 'employed'] as const).map((a) => (
            <option key={a} value={a}>
              {t(`availability.${a}`)}
            </option>
          ))}
        </NativeSelect>
        <NativeSelect aria-label={t('employer.workers.minYears')} value={String(filters.min_years ?? '')} onChange={(e) => update('anos', e.target.value)}>
          <option value="">
            {t('employer.workers.minYears')}: {t('common.any')}
          </option>
          {[1, 3, 5, 10, 15].map((y) => (
            <option key={y} value={y}>
              {t('common.years', { count: y })}+
            </option>
          ))}
        </NativeSelect>
        <CheckRow checked={filters.has_tpc} onChange={(v) => update('tpc', v ? '1' : '')} label={t('employer.workers.onlyTpc')} />
      </div>

      <p className="mt-6 text-sm text-muted-foreground" aria-live="polite">
        {data ? t('common.results', { count: data.meta.total }) : ''}
      </p>

      <div className="mt-4">
        {isLoading ? (
          <ListSkeleton />
        ) : isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : !data?.data.length ? (
          <EmptyState title={t('employer.workers.empty')} icon={<Users className="h-6 w-6" />} />
        ) : (
          <>
            <ul className="grid gap-4 lg:grid-cols-2">
              {data.data.map((w) => (
                <li key={w.id} className="flex flex-col gap-4 rounded-2xl border border-foreground/[0.08] bg-card p-5 sm:p-6">
                  <WorkerHeader worker={w} />
                  <WorkerDetails worker={w} />
                  <div className="rounded-xl bg-secondary/50 p-3">
                    <ContactLines phone={w.phone} email={w.email} unlocked={w.unlocked} />
                  </div>
                  <div className="mt-auto flex items-center justify-between gap-3 border-t pt-4">
                    {!w.unlocked && <span className="text-xs text-muted-foreground">{t('employer.workers.contactCost')}</span>}
                    <Button className="ms-auto" variant={w.unlocked ? 'accent' : 'default'} size="sm" onClick={() => reach(w)} disabled={contact.isPending && contact.variables === w.id}>
                      {w.unlocked ? <MessageSquare className="h-4 w-4" aria-hidden /> : <Lock className="h-4 w-4" aria-hidden />}
                      {w.conversation_id ? t('employer.job.continueChat') : t('employer.workers.contact')}
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
            <Pagination page={data.meta.current_page} last={data.meta.last_page} onPage={(p) => update('pagina', String(p))} />
          </>
        )}
      </div>

      <BuyCreditsDialog open={noCredits} onOpenChange={setNoCredits} role="employer" title={t('employer.workers.noCredits')} text={t('employer.workers.noCreditsText')} />
    </div>
  )
}
