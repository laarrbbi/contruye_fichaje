import { useTranslation } from 'react-i18next'
import { BadgeCheck, Car, CalendarClock, GraduationCap, Languages, MapPin, Plane } from 'lucide-react'
import type { WorkerCard } from '@/api/types'
import { useLabels } from '@/hooks/useLabels'
import { Avatar } from '@/components/Avatar'
import { LockedValue } from '@/components/Paywall'
import { Tag } from '@/components/Tag'

/**
 * A worker as a company sees them: always the trade, the experience, the
 * training and the area; the name in full, phone and e-mail only unlocked.
 */
export function WorkerHeader({ worker }: { worker: WorkerCard }) {
  const { t } = useTranslation()
  const labels = useLabels()
  const p = worker.profile
  return (
    <div className="flex items-start gap-4">
      <Avatar initials={worker.initials} tone={worker.unlocked ? 'blue' : 'muted'} />
      <div className="min-w-0 flex-1">
        <p className="bidi-auto text-base font-semibold">{worker.name}</p>
        {p && (
          <p className="text-sm text-foreground/75">
            {labels.trade(p.trade)} · {t('common.years', { count: p.years_experience })}
          </p>
        )}
        <p className="mt-0.5 inline-flex items-center gap-1 text-[0.8125rem] text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" aria-hidden />
          {labels.place(worker.city, worker.province)}
        </p>
      </div>
    </div>
  )
}

export function WorkerDetails({ worker, compact }: { worker: WorkerCard; compact?: boolean }) {
  const { t } = useTranslation()
  const labels = useLabels()
  const p = worker.profile
  if (!p) return null
  return (
    <div className="space-y-3">
      {p.headline && <p className="bidi-auto text-sm font-medium">{p.headline}</p>}
      {!compact && p.bio && <p className="bidi-auto whitespace-pre-line text-sm leading-relaxed text-foreground/75">{p.bio}</p>}
      <div className="flex flex-wrap gap-2">
        <Tag tone={p.availability === 'immediate' ? 'green' : 'plain'}>
          <CalendarClock className="h-3.5 w-3.5" aria-hidden />
          {t(`availability.${p.availability}`)}
        </Tag>
        {p.has_tpc && (
          <Tag tone="blue">
            <BadgeCheck className="h-3.5 w-3.5" aria-hidden />
            {t('jobs.tpc')}
          </Tag>
        )}
        {p.prl_training && p.prl_training !== 'none' && (
          <Tag>
            <GraduationCap className="h-3.5 w-3.5" aria-hidden />
            {t(`prl.${p.prl_training}`)}
          </Tag>
        )}
        {p.driving_license && (
          <Tag>
            <Car className="h-3.5 w-3.5" aria-hidden />
            {t('jobs.license')}
          </Tag>
        )}
        {p.willing_to_travel && (
          <Tag>
            <Plane className="h-3.5 w-3.5" aria-hidden />
            {t('worker.profile.travel')}
          </Tag>
        )}
        {p.languages.length > 1 && (
          <Tag>
            <Languages className="h-3.5 w-3.5" aria-hidden />
            {p.languages.map(labels.language).join(', ')}
          </Tag>
        )}
        {p.other_trades.map((trade) => (
          <Tag key={trade}>{labels.trade(trade)}</Tag>
        ))}
      </div>
    </div>
  )
}

/** Phone and e-mail, or their blurred shape. */
export function ContactLines({ phone, email, unlocked }: { phone: string | null; email: string | null; unlocked: boolean }) {
  const { t } = useTranslation()
  if (!unlocked) {
    return (
      <div className="space-y-1.5 text-sm">
        <div>
          <LockedValue label={t('paywall.locked')}>{t('paywall.hiddenPhone')}</LockedValue>
        </div>
        <div>
          <LockedValue label={t('paywall.locked')}>{t('paywall.hiddenEmail')}</LockedValue>
        </div>
      </div>
    )
  }
  const wa = phone ? `https://wa.me/${phone.replace(/[^\d]/g, '')}` : null
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm">
      {phone && (
        <a href={`tel:${phone}`} dir="ltr" className="font-medium text-primary underline-offset-4 hover:underline">
          {phone}
        </a>
      )}
      {wa && (
        <a href={wa} target="_blank" rel="noreferrer" className="text-success underline-offset-4 hover:underline">
          {t('common.whatsapp')}
        </a>
      )}
      {email && (
        <a href={`mailto:${email}`} className="truncate text-primary underline-offset-4 hover:underline">
          {email}
        </a>
      )}
    </div>
  )
}
