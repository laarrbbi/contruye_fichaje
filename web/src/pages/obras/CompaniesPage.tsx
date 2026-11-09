import { Link, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useUser } from '@/api/auth'
import { useCompanies } from '@/api/obras'
import { CompanyCard } from '@/components/CompanyCard'
import { NativeSelect } from '@/components/Field'
import { PageHead } from '@/components/PageHead'
import { EmptyState, ErrorState, ListSkeleton, Pagination } from '@/components/States'
import { Button } from '@/components/ui/button'
import { useLabels } from '@/hooks/useLabels'
import { usePageTitle } from '@/hooks/usePageTitle'

export function CompaniesPage() {
  const { t } = useTranslation()
  usePageTitle(t('companies.title'))
  const labels = useLabels()
  const { data: user } = useUser()
  const [params, setParams] = useSearchParams()
  const filters = { category: params.get('tipo') ?? '', province: params.get('provincia') ?? '', page: Number(params.get('pagina') ?? 1) || 1 }
  const { data, isLoading, isError, refetch } = useCompanies(filters)
  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    if (key !== 'pagina') next.delete('pagina')
    setParams(next)
  }

  return (
    <div className="container py-12 sm:py-16">
      <PageHead eyebrow={t('obras.eyebrow')} title={t('companies.title')} lead={t('companies.lead')}>
        <Button asChild variant="accent" size="lg">
          <Link to={user?.role === 'client' ? '/cliente/solicitudes/nueva' : '/registro?tipo=client'}>{t('companies.cta')}</Link>
        </Button>
      </PageHead>
      <div className="grid gap-3 rounded-2xl border border-foreground/[0.08] bg-card p-4 sm:grid-cols-2">
        <NativeSelect aria-label={t('companies.category')} value={filters.category} onChange={(e) => update('tipo', e.target.value)}>
          <option value="">
            {t('companies.category')}: {t('common.all')}
          </option>
          {(labels.meta?.obras.categories ?? []).map((c) => (
            <option key={c} value={c}>
              {labels.category(c)}
            </option>
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
      </div>
      <div className="mt-8">
        {isLoading ? (
          <ListSkeleton rows={3} />
        ) : isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : !data?.data.length ? (
          <EmptyState title={t('companies.empty')} />
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.data.map((c) => (
                <CompanyCard key={c.id} company={c} />
              ))}
            </div>
            <Pagination page={data.meta.current_page} last={data.meta.last_page} onPage={(p) => update('pagina', String(p))} />
          </>
        )}
      </div>
    </div>
  )
}
