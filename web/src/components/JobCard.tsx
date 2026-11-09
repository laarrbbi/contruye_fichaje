import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { BadgeCheck, BedDouble, Check, MapPin, Sparkles, Wallet } from 'lucide-react'
import type { Job } from '@/api/types'
import { useLabels } from '@/hooks/useLabels'
import { Tag } from '@/components/Tag'
import { cn, formatRelative } from '@/lib/utils'

/** One offer on the board: what, who, where, how much. The whole card is the link. */
export function JobCard({ job }: { job: Job }) {
  const { t, i18n } = useTranslation()
  const labels = useLabels()
  return (
    <article
      className={cn(
        'group relative rounded-2xl border bg-card p-5 transition-[box-shadow,border-color] duration-200 ease-out-strong hover:border-foreground/20 hover:shadow-[0_24px_48px_-30px_rgb(20_26_34/0.45)] sm:p-6',
        job.featured ? 'border-or/60 ring-1 ring-or/30' : 'border-foreground/[0.08]',
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        {job.featured && (
          <Tag tone="amber">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            {t('jobs.featured')}
          </Tag>
        )}
        <Tag tone="blue">{labels.trade(job.trade)}</Tag>
        {job.applied && (
          <Tag tone="green">
            <Check className="h-3.5 w-3.5" aria-hidden />
            {t('jobs.applied')}
          </Tag>
        )}
        <span className="ms-auto text-xs text-muted-foreground">{t('jobs.published', { when: formatRelative(job.published_at, i18n.language) })}</span>
      </div>
      <h3 className="bidi-auto titre mt-3 text-lg leading-snug sm:text-xl">
        <Link to={`/empleo/ofertas/${job.id}`} className="after:absolute after:inset-0 focus-visible:outline-none group-focus-within:underline">
          {job.title}
        </Link>
      </h3>
      <p className="mt-1 text-sm font-medium text-foreground/70">{job.company.name}</p>
      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-foreground/80">
        <span className="inline-flex items-center gap-1.5">
          <MapPin className="h-4 w-4 text-muted-foreground" aria-hidden />
          {labels.place(job.city, job.province)}
        </span>
        <span className="inline-flex items-center gap-1.5 font-semibold text-foreground">
          <Wallet className="h-4 w-4 text-muted-foreground" aria-hidden />
          {labels.salary(job)}
        </span>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Tag>{t(`contract.${job.contract_type}`)}</Tag>
        <Tag>{t(`workday.${job.workday}`)}</Tag>
        {job.vacancies > 1 && <Tag>{t('jobs.vacancies', { count: job.vacancies })}</Tag>}
        {job.requires_tpc && (
          <Tag>
            <BadgeCheck className="h-3.5 w-3.5" aria-hidden />
            {t('jobs.tpc')}
          </Tag>
        )}
        {job.accommodation && (
          <Tag>
            <BedDouble className="h-3.5 w-3.5" aria-hidden />
            {t('jobs.accommodation')}
          </Tag>
        )}
      </div>
    </article>
  )
}
