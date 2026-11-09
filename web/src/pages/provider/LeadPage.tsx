import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Coins, Lock, MessageSquare, Unlock, Users } from 'lucide-react'
import { useUser } from '@/api/auth'
import { errorCode, errorMessage } from '@/api/client'
import { useLead, useUnlockLead } from '@/api/obras'
import { Avatar } from '@/components/Avatar'
import { BuyCreditsDialog } from '@/components/Paywall'
import { EmptyState, ListSkeleton } from '@/components/States'
import { Tag } from '@/components/Tag'
import { ContactLines } from '@/components/WorkerFacts'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useLabels } from '@/hooks/useLabels'
import { usePageTitle } from '@/hooks/usePageTitle'
import { formatRelative } from '@/lib/utils'

export function LeadPage() {
  const { t, i18n } = useTranslation()
  const { id } = useParams()
  const leadId = Number(id)
  const navigate = useNavigate()
  const labels = useLabels()
  const { data: user } = useUser()
  const { data: lead, isLoading, isError } = useLead(leadId)
  usePageTitle(lead?.title)
  const unlock = useUnlockLead()
  const [noCredits, setNoCredits] = useState(false)

  if (isLoading) {
    return (
      <div className="container py-12">
        <ListSkeleton rows={2} className="h-48" />
      </div>
    )
  }
  if (isError || !lead) {
    return (
      <div className="container py-16">
        <EmptyState title={t('provider.detail.notFound')} action={<Button asChild variant="outline"><Link to="/profesional">{t('common.back')}</Link></Button>} />
      </div>
    )
  }

  const facts = [
    [t('provider.category'), labels.category(lead.category)],
    [t('common.city'), labels.place(lead.city, lead.province) + (lead.postal_code ? ` (${lead.postal_code})` : '')],
    [t('client.form.propertyType'), t(`property.${lead.property_type}`)],
    [t('client.form.budget'), t(`budget.${lead.budget}`)],
    [t('client.form.timing'), t(`timing.${lead.timing}`)],
  ]
  const balance = user?.credits ?? 0

  const doUnlock = () =>
    unlock.mutate(lead.id, {
      onError: (error) => {
        if (errorCode(error) === 'insufficient_credits') setNoCredits(true)
      },
    })

  return (
    <div className="container py-10 sm:py-14">
      <Link to="/profesional" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4 rtl:-scale-x-100" aria-hidden />
        {t('provider.title')}
      </Link>
      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_23rem]">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Tag tone="blue">{labels.category(lead.category)}</Tag>
            <span className="text-xs text-muted-foreground">{formatRelative(lead.published_at, i18n.language)}</span>
          </div>
          <h1 className="bidi-auto titre mt-3 text-[clamp(1.75rem,1.3rem+1.8vw,2.75rem)]">{lead.title}</h1>
          <dl className="mt-6 grid gap-3 rounded-2xl border border-foreground/[0.08] bg-card p-6 sm:grid-cols-2">
            {facts.map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs uppercase tracking-wider text-muted-foreground">{label}</dt>
                <dd className="font-medium">{value}</dd>
              </div>
            ))}
          </dl>
          <h2 className="titre mt-8 text-xl">{t('provider.detail.details')}</h2>
          <p className="bidi-auto mt-3 whitespace-pre-line leading-relaxed text-foreground/80">{lead.description}</p>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <Card className="theme-night overflow-hidden border-transparent bg-[radial-gradient(120%_90%_at_80%_0%,#16294A,#0B1A2E_60%)] shadow-float">
            <CardContent className="space-y-5 p-6 sm:p-7">
              <p className="etiquette text-foreground/60">{t('provider.detail.client')}</p>
              <div className="flex items-center gap-4">
                <Avatar initials={lead.client.initials} tone={lead.unlocked ? 'amber' : 'muted'} />
                <p className="text-lg font-semibold">{lead.client.name}</p>
              </div>
              <div className="rounded-xl bg-white/[0.05] p-3">
                <ContactLines phone={lead.client.phone} email={lead.client.email} unlocked={lead.unlocked} />
              </div>
              <p className="inline-flex items-center gap-1.5 text-sm text-foreground/65">
                <Users className="h-4 w-4" aria-hidden />
                {t('provider.slots', { count: lead.unlocks_count, max: lead.max_unlocks })}
              </p>
              {lead.unlocked ? (
                <>
                  <Tag tone="green">
                    <Unlock className="h-3.5 w-3.5" aria-hidden />
                    {t('provider.unlocked')}
                  </Tag>
                  {lead.conversation_id && (
                    <Button variant="accent" size="lg" className="w-full" onClick={() => navigate(`/mensajes/${lead.conversation_id}`)}>
                      <MessageSquare className="h-4 w-4" aria-hidden />
                      {t('provider.detail.openChat')}
                    </Button>
                  )}
                </>
              ) : lead.full ? (
                <p className="text-sm text-foreground/70">{t('provider.detail.fullText', { max: lead.max_unlocks })}</p>
              ) : (
                <>
                  <p className="text-sm leading-relaxed text-foreground/70">{t('provider.detail.lockedText')}</p>
                  <button type="button" onClick={doUnlock} disabled={unlock.isPending} className="btn-or w-full">
                    <span>{t('provider.detail.unlock', { cost: t('provider.cost', { count: lead.cost }) })}</span>
                    <span aria-hidden className="btn-or__fleche">
                      <Lock className="h-4 w-4" strokeWidth={1.75} />
                    </span>
                  </button>
                  <p className="inline-flex items-center gap-1.5 text-xs text-foreground/55">
                    <Coins className="h-3.5 w-3.5" aria-hidden />
                    {t('provider.balance', { count: balance })}
                  </p>
                  {unlock.isError && errorCode(unlock.error) !== 'insufficient_credits' && <p className="text-sm text-[#F2A38E]">{errorMessage(unlock.error, t('common.error'))}</p>}
                </>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
      <BuyCreditsDialog
        open={noCredits}
        onOpenChange={setNoCredits}
        role="provider"
        title={t('provider.detail.noCredits')}
        text={t('provider.detail.noCreditsText', { cost: t('provider.cost', { count: lead.cost }), balance: t('common.credits', { count: balance }) })}
      />
    </div>
  )
}
