import { useTranslation } from 'react-i18next'
import type { ProviderCard } from '@/api/types'
import { useLabels } from '@/hooks/useLabels'
import { Avatar } from '@/components/Avatar'
import { Tag } from '@/components/Tag'

export function CompanyCard({ company }: { company: ProviderCard }) {
  const { t } = useTranslation()
  const labels = useLabels()
  return (
    <article className="flex h-full flex-col rounded-2xl border border-foreground/[0.08] bg-card p-6">
      <div className="flex items-center gap-4">
        <Avatar initials={company.initials} />
        <div className="min-w-0">
          <h3 className="bidi-auto truncate text-base font-semibold">{company.company_name}</h3>
          <p className="truncate text-[0.8125rem] text-muted-foreground">
            {company.provinces.map(labels.province).join(' · ')}
            {company.founded_year ? ` · ${t('companies.since', { year: company.founded_year })}` : ''}
          </p>
        </div>
      </div>
      {company.description && <p className="bidi-auto mt-4 line-clamp-3 flex-1 text-sm leading-relaxed text-foreground/75">{company.description}</p>}
      <div className="mt-4 flex flex-wrap gap-1.5">
        {company.categories.slice(0, 5).map((c) => (
          <Tag key={c}>{labels.category(c)}</Tag>
        ))}
      </div>
    </article>
  )
}
