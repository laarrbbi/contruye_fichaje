import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CalendarClock, Coins, Home, MapPin, Unlock, Users } from 'lucide-react'
import type { Lead } from '@/api/types'
import { useLabels } from '@/hooks/useLabels'
import { Tag } from '@/components/Tag'
import { cn, formatRelative } from '@/lib/utils'

/** One request, as a company browsing them sees it. */
export function LeadCard({ lead }: { lead: Lead }) {
  const { t, i18n } = useTranslation()
  const labels = useLabels()
  return (
    <article className={cn('group relative rounded-2xl border bg-card p-5 transition-[box-shadow,border-color] duration-200 hover:border-foreground/20 hover:shadow-[0_24px_48px_-30px_rgb(20_26_34/0.45)] sm:p-6', lead.unlocked ? 'border-success/40' : 'border-foreground/[0.08]')}>
      <div className="flex flex-wrap items-center gap-2">
        <Tag tone="blue">{labels.category(lead.category)}</Tag>
        {lead.unlocked && (
          <Tag tone="green">
            <Unlock className="h-3.5 w-3.5" aria-hidden />
            {t('provider.unlocked')}
          </Tag>
        )}
        {lead.full && !lead.unlocked && <Tag tone="red">{t('provider.full')}</Tag>}
        <span className="ms-auto text-xs text-muted-foreground">{formatRelative(lead.published_at, i18n.language)}</span>
      </div>
      <h3 className="bidi-auto titre mt-3 text-lg leading-snug sm:text-xl">
        <Link to={`/profesional/solicitudes/${lead.id}`} className="after:absolute after:inset-0 focus-visible:outline-none">
          {lead.title}
        </Link>
      </h3>
      <p className="bidi-auto mt-2 line-clamp-2 text-sm leading-relaxed text-foreground/70">{lead.description}</p>
      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-foreground/80">
        <span className="inline-flex items-center gap-1.5">
          <MapPin className="h-4 w-4 text-muted-foreground" aria-hidden />
          {labels.place(lead.city, lead.province)}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Home className="h-4 w-4 text-muted-foreground" aria-hidden />
          {t(`property.${lead.property_type}`)}
        </span>
        <span className="inline-flex items-center gap-1.5 font-semibold text-foreground">{t(`budget.${lead.budget}`)}</span>
        <span className="inline-flex items-center gap-1.5">
          <CalendarClock className="h-4 w-4 text-muted-foreground" aria-hidden />
          {t(`timing.${lead.timing}`)}
        </span>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3 border-t pt-4 text-[0.8125rem]">
        <span className="inline-flex items-center gap-1.5 font-semibold text-or-fonce">
          <Coins className="h-4 w-4" aria-hidden />
          {t('provider.cost', { count: lead.cost })}
        </span>
        <span className="inline-flex items-center gap-1.5 text-muted-foreground">
          <Users className="h-4 w-4" aria-hidden />
          {t('provider.slots', { count: lead.unlocks_count, max: lead.max_unlocks })}
        </span>
      </div>
    </article>
  )
}
