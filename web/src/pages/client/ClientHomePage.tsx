import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ClipboardList, Plus, Users } from 'lucide-react'
import { useOwnProjects } from '@/api/obras'
import { PageHead } from '@/components/PageHead'
import { EmptyState, ErrorState, ListSkeleton } from '@/components/States'
import { Tag } from '@/components/Tag'
import { Button } from '@/components/ui/button'
import { useLabels } from '@/hooks/useLabels'
import { usePageTitle } from '@/hooks/usePageTitle'
import { formatRelative } from '@/lib/utils'

export function ClientHomePage() {
  const { t, i18n } = useTranslation()
  usePageTitle(t('client.title'))
  const labels = useLabels()
  const { data: projects, isLoading, isError, refetch } = useOwnProjects()
  const max = labels.meta?.obras.max_unlocks ?? 4

  return (
    <div className="container py-12 sm:py-16">
      <PageHead eyebrow={t('obras.eyebrow')} title={t('client.title')} lead={t('client.lead', { max })}>
        <Button asChild variant="accent" size="lg">
          <Link to="/cliente/solicitudes/nueva">
            <Plus className="h-4 w-4" aria-hidden />
            {t('client.new')}
          </Link>
        </Button>
      </PageHead>
      {isLoading ? (
        <ListSkeleton />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !projects?.length ? (
        <EmptyState
          title={t('client.empty')}
          icon={<ClipboardList className="h-6 w-6" />}
          action={
            <Button asChild variant="accent" size="lg">
              <Link to="/cliente/solicitudes/nueva">{t('client.emptyCta')}</Link>
            </Button>
          }
        />
      ) : (
        <ul className="grid gap-4">
          {projects.map((p) => (
            <li key={p.id} className="flex flex-col gap-4 rounded-2xl border border-foreground/[0.08] bg-card p-5 sm:flex-row sm:items-center sm:p-6">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Tag tone={p.status === 'open' ? 'green' : 'red'}>{p.status === 'open' ? t('client.open') : t('client.closed')}</Tag>
                  <Tag tone="blue">{labels.category(p.category)}</Tag>
                  <span className="text-xs text-muted-foreground">{formatRelative(p.published_at, i18n.language)}</span>
                </div>
                <Link to={`/cliente/solicitudes/${p.id}`} className="bidi-auto mt-2 block text-lg font-semibold hover:text-primary">
                  {p.title}
                </Link>
                <p className="text-sm text-foreground/70">
                  {labels.place(p.city, p.province)} · {t(`budget.${p.budget}`)} · {t(`timing.${p.timing}`)}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold">
                  <Users className="h-4 w-4 text-muted-foreground" aria-hidden />
                  {t('client.interested', { count: p.unlocks_count, max: p.max_unlocks })}
                </span>
                <Button asChild variant={p.unlocks_count ? 'accent' : 'outline'}>
                  <Link to={`/cliente/solicitudes/${p.id}`}>{t('provider.see')}</Link>
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
