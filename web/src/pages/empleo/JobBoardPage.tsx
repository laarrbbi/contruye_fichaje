import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Search, X } from 'lucide-react'
import { useJobs } from '@/api/empleo'
import { JobCard } from '@/components/JobCard'
import { NativeSelect } from '@/components/Field'
import { PageHead } from '@/components/PageHead'
import { EmptyState, ErrorState, ListSkeleton, Pagination } from '@/components/States'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useLabels } from '@/hooks/useLabels'
import { usePageTitle } from '@/hooks/usePageTitle'

/** The board. Its filters live in the address, so a search can be shared. */
export function JobBoardPage() {
  const { t } = useTranslation()
  usePageTitle(t('jobs.title'))
  const labels = useLabels()
  const [params, setParams] = useSearchParams()
  const filters = {
    q: params.get('q') ?? '',
    trade: params.get('oficio') ?? '',
    province: params.get('provincia') ?? '',
    contract_type: params.get('contrato') ?? '',
    page: Number(params.get('pagina') ?? 1) || 1,
  }
  const [q, setQ] = useState(filters.q)
  useEffect(() => setQ(filters.q), [filters.q])
  const { data, isLoading, isError, refetch } = useJobs(filters)

  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    if (key !== 'pagina') next.delete('pagina')
    setParams(next)
  }
  const any = filters.q || filters.trade || filters.province || filters.contract_type

  return (
    <div className="container py-12 sm:py-16">
      <PageHead eyebrow={t('empleo.eyebrow')} title={t('jobs.title')} lead={t('jobs.lead')} />

      <form
        onSubmit={(e) => {
          e.preventDefault()
          update('q', q.trim())
        }}
        className="grid gap-3 rounded-2xl border border-foreground/[0.08] bg-card p-4 sm:grid-cols-2 lg:grid-cols-[2fr_1.3fr_1.3fr_1.1fr_auto]"
      >
        <div className="relative sm:col-span-2 lg:col-span-1">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('jobs.searchPlaceholder')} aria-label={t('common.search')} className="ps-9" />
        </div>
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
        <NativeSelect aria-label={t('jobs.contract')} value={filters.contract_type} onChange={(e) => update('contrato', e.target.value)}>
          <option value="">
            {t('jobs.contract')}: {t('common.all')}
          </option>
          {(labels.meta?.contract_types ?? []).map((c) => (
            <option key={c} value={c}>
              {t(`contract.${c}`)}
            </option>
          ))}
        </NativeSelect>
        <Button type="submit">{t('common.search')}</Button>
      </form>

      <div className="mt-6 flex min-h-[2rem] items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {data ? t('common.results', { count: data.meta.total }) : ''}
        </p>
        {any && (
          <Button variant="ghost" size="sm" onClick={() => setParams(new URLSearchParams())}>
            <X className="h-4 w-4" aria-hidden />
            {t('jobs.clear')}
          </Button>
        )}
      </div>

      <div className="mt-4">
        {isLoading ? (
          <ListSkeleton />
        ) : isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : !data?.data.length ? (
          <EmptyState title={t('jobs.empty')} action={any ? <Button variant="outline" onClick={() => setParams(new URLSearchParams())}>{t('jobs.clear')}</Button> : undefined} />
        ) : (
          <>
            <div className="grid gap-4 lg:grid-cols-2">
              {data.data.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
            <Pagination page={data.meta.current_page} last={data.meta.last_page} onPage={(p) => update('pagina', String(p))} />
          </>
        )}
      </div>
    </div>
  )
}
