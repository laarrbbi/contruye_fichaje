import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { MessageSquare, Users } from 'lucide-react'
import { useUnlockedLeads } from '@/api/obras'
import { PageHead } from '@/components/PageHead'
import { EmptyState, ErrorState, ListSkeleton } from '@/components/States'
import { ContactLines } from '@/components/WorkerFacts'
import { Button } from '@/components/ui/button'
import { useLabels } from '@/hooks/useLabels'
import { usePageTitle } from '@/hooks/usePageTitle'
import { formatDate } from '@/lib/utils'

export function UnlockedLeadsPage() {
  const { t, i18n } = useTranslation()
  usePageTitle(t('provider.unlockedTitle'))
  const labels = useLabels()
  const { data, isLoading, isError, refetch } = useUnlockedLeads()

  return (
    <div className="container py-12 sm:py-16">
      <PageHead eyebrow={t('obras.eyebrow')} title={t('provider.unlockedTitle')} lead={t('provider.unlockedLead')} />
      {isLoading ? (
        <ListSkeleton />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !data?.length ? (
        <EmptyState
          title={t('provider.unlockedEmpty')}
          icon={<Users className="h-6 w-6" />}
          action={
            <Button asChild variant="accent">
              <Link to="/profesional">{t('provider.title')}</Link>
            </Button>
          }
        />
      ) : (
        <ul className="grid gap-4">
          {data.map((lead) => (
            <li key={lead.id} className="flex flex-col gap-4 rounded-2xl border border-foreground/[0.08] bg-card p-5 sm:p-6 lg:flex-row lg:items-center">
              <div className="min-w-0 flex-1">
                <Link to={`/profesional/solicitudes/${lead.id}`} className="bidi-auto text-lg font-semibold hover:text-primary">
                  {lead.title}
                </Link>
                <p className="text-sm text-foreground/70">
                  {labels.category(lead.category)} · {labels.place(lead.city, lead.province)} · {t(`budget.${lead.budget}`)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatDate(lead.unlocked_at, i18n.language)} · {t('provider.cost', { count: lead.credits_spent ?? lead.cost })}
                </p>
              </div>
              <div className="min-w-0 lg:w-80">
                <p className="text-sm font-semibold">{lead.client.name}</p>
                <ContactLines phone={lead.client.phone} email={lead.client.email} unlocked />
              </div>
              {lead.conversation_id && (
                <Button asChild variant="accent">
                  <Link to={`/mensajes/${lead.conversation_id}`}>
                    <MessageSquare className="h-4 w-4" aria-hidden />
                    {t('provider.detail.openChat')}
                  </Link>
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
