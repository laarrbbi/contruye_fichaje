import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, MessageSquare, Pencil } from 'lucide-react'
import { useCloseProject, useOwnProject } from '@/api/obras'
import { CompanyCard } from '@/components/CompanyCard'
import { SectionLabel } from '@/components/PageHead'
import { EmptyState, ListSkeleton } from '@/components/States'
import { Tag } from '@/components/Tag'
import { Button } from '@/components/ui/button'
import { useLabels } from '@/hooks/useLabels'
import { usePageTitle } from '@/hooks/usePageTitle'
import { formatDate } from '@/lib/utils'

export function ProjectPage() {
  const { t, i18n } = useTranslation()
  const { id } = useParams()
  const projectId = Number(id)
  const labels = useLabels()
  const { data: project, isLoading } = useOwnProject(projectId)
  usePageTitle(project?.title)
  const close = useCloseProject(projectId)

  if (isLoading) {
    return (
      <div className="container py-12">
        <ListSkeleton rows={2} className="h-48" />
      </div>
    )
  }
  if (!project) {
    return (
      <div className="container py-16">
        <EmptyState title={t('notFound.title')} />
      </div>
    )
  }

  const facts = [
    [t('client.form.category'), labels.category(project.category)],
    [t('common.city'), labels.place(project.city, project.province)],
    [t('client.form.propertyType'), t(`property.${project.property_type}`)],
    [t('client.form.budget'), t(`budget.${project.budget}`)],
    [t('client.form.timing'), t(`timing.${project.timing}`)],
  ]

  return (
    <div className="container py-10 sm:py-14">
      <Link to="/cliente" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4 rtl:-scale-x-100" aria-hidden />
        {t('client.title')}
      </Link>
      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div>
          <Tag tone={project.status === 'open' ? 'green' : 'red'}>{project.status === 'open' ? t('client.open') : t('client.closed')}</Tag>
          <h1 className="bidi-auto titre mt-3 text-[clamp(1.75rem,1.3rem+1.8vw,2.75rem)]">{project.title}</h1>
          <dl className="mt-6 grid gap-3 rounded-2xl border border-foreground/[0.08] bg-card p-6 sm:grid-cols-2">
            {facts.map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs uppercase tracking-wider text-muted-foreground">{label}</dt>
                <dd className="font-medium">{value}</dd>
              </div>
            ))}
          </dl>
          <p className="bidi-auto mt-6 whitespace-pre-line leading-relaxed text-foreground/80">{project.description}</p>
          {project.status === 'open' && (
            <div className="mt-6 flex flex-wrap gap-2">
              <Button asChild variant="outline">
                <Link to={`/cliente/solicitudes/${project.id}/editar`}>
                  <Pencil className="h-4 w-4" aria-hidden />
                  {t('common.edit')}
                </Link>
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  if (window.confirm(t('client.closeConfirm'))) close.mutate()
                }}
              >
                {t('client.close')}
              </Button>
            </div>
          )}
        </div>
        <div>
          <SectionLabel>{t('client.companiesTitle')}</SectionLabel>
          <p className="mt-3 text-sm text-muted-foreground">{t('client.interested', { count: project.unlocks_count, max: project.max_unlocks })}</p>
          <div className="mt-5 grid gap-4">
            {!project.companies?.length ? (
              <EmptyState title={t('client.noCompanies')} />
            ) : (
              project.companies.map((c) => (
                <div key={c.company.id} className="space-y-3">
                  <CompanyCard company={c.company} />
                  <div className="flex items-center justify-between gap-3 px-1">
                    <span className="text-xs text-muted-foreground">{formatDate(c.unlocked_at, i18n.language)}</span>
                    {c.conversation_id && (
                      <Button asChild variant="accent" size="sm">
                        <Link to={`/mensajes/${c.conversation_id}`}>
                          <MessageSquare className="h-4 w-4" aria-hidden />
                          {t('client.openChat')}
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
