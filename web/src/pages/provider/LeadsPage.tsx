import { Link, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Coins, Hammer } from 'lucide-react'
import { useUser } from '@/api/auth'
import { useLeads } from '@/api/obras'
import { NativeSelect } from '@/components/Field'
import { LeadCard } from '@/components/LeadCard'
import { PageHead } from '@/components/PageHead'
import { EmptyState, ErrorState, ListSkeleton, Pagination } from '@/components/States'
import { Button } from '@/components/ui/button'
import { useLabels } from '@/hooks/useLabels'
import { usePageTitle } from '@/hooks/usePageTitle'
import { cn } from '@/lib/utils'

export function LeadsPage() {
  const { t } = useTranslation()
  usePageTitle(t('provider.title'))
  const labels = useLabels()
  const { data: user } = useUser()
  const [params, setParams] = useSearchParams()
  const matching = params.get('todas') !== '1'
  const filters = { matching, category: params.get('tipo') ?? '', province: params.get('provincia') ?? '', page: Number(params.get('pagina') ?? 1) || 1 }
  const { data, isLoading, isError, refetch } = useLeads(filters)
  const credits = data?.meta.credits ?? user?.credits ?? 0

  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    if (key !== 'pagina') next.delete('pagina')
    setParams(next)
  }

  return (
    <div className="container py-12 sm:py-16">
      <PageHead eyebrow={t('obras.eyebrow')} title={t('provider.title')} lead={t('provider.lead')}>
        <div className="flex items-center gap-3 rounded-2xl border border-foreground/[0.08] bg-card px-5 py-3">
          <Coins className="h-5 w-5 text-or-fonce" aria-hidden />
          <span className="text-sm font-semibold">{t('provider.balance', { count: credits })}</span>
          <Button asChild size="sm" variant="accent">
            <Link to="/profesional/creditos">{t('provider.buy')}</Link>
          </Button>
        </div>
      </PageHead>

      <div className="flex flex-col gap-3 rounded-2xl border border-foreground/[0.08] bg-card p-4 lg:flex-row lg:items-center">
        <div role="tablist" className="inline-flex shrink-0 rounded-lg bg-secondary p-1">
          {[
            { on: true, label: t('provider.matching') },
            { on: false, label: t('provider.everything') },
          ].map(({ on, label }) => (
            <button
              key={label}
              role="tab"
              aria-selected={matching === on}
              onClick={() => update('todas', on ? '' : '1')}
              className={cn('rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors', matching === on ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="grid flex-1 gap-3 sm:grid-cols-2">
          <NativeSelect aria-label={t('provider.category')} value={filters.category} onChange={(e) => update('tipo', e.target.value)}>
            <option value="">
              {t('provider.category')}: {matching ? t('provider.matching') : t('common.all')}
            </option>
            {(labels.meta?.obras.categories ?? []).map((c) => (
              <option key={c} value={c}>
                {labels.category(c)}
              </option>
            ))}
          </NativeSelect>
          <NativeSelect aria-label={t('common.province')} value={filters.province} onChange={(e) => update('provincia', e.target.value)}>
            <option value="">{matching ? t('provider.matching') : t('common.allSpain')}</option>
            {(labels.meta?.provinces ?? []).map((p) => (
              <option key={p.code} value={p.code}>
                {p.name}
              </option>
            ))}
          </NativeSelect>
        </div>
      </div>

      <div className="mt-8">
        {isLoading ? (
          <ListSkeleton />
        ) : isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : !data?.data.length ? (
          <EmptyState
            title={matching ? t('provider.emptyMatching') : t('provider.empty')}
            icon={<Hammer className="h-6 w-6" />}
            action={
              matching ? (
                <Button variant="outline" onClick={() => update('todas', '1')}>
                  {t('provider.everything')}
                </Button>
              ) : undefined
            }
          />
        ) : (
          <>
            <div className="grid gap-4 lg:grid-cols-2">
              {data.data.map((lead) => (
                <LeadCard key={lead.id} lead={lead} />
              ))}
            </div>
            <Pagination page={data.meta.current_page} last={data.meta.last_page} onPage={(p) => update('pagina', String(p))} />
          </>
        )}
      </div>
    </div>
  )
}
