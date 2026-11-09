import { useTranslation } from 'react-i18next'
import { useMeta } from '@/api/meta'
import type { Job } from '@/api/types'
import { formatEuros } from '@/lib/utils'

/** Labels for every stored key: trades, provinces, contracts, categories… */
export function useLabels() {
  const { t, i18n } = useTranslation()
  const { data: meta } = useMeta()
  const lang = i18n.language

  const province = (code: string | null | undefined) => meta?.provinces.find((p) => p.code === code)?.name ?? ''
  const place = (city: string | null | undefined, code: string | null | undefined) => [city, province(code)].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).join(', ')

  const salary = (job: Pick<Job, 'salary_min' | 'salary_max' | 'salary_period'>) => {
    const period = t(`period.${job.salary_period}`)
    const fmt = (n: number) => formatEuros(n, lang)
    if (job.salary_min && job.salary_max) return t('jobs.salaryRange', { min: fmt(job.salary_min), max: fmt(job.salary_max), period })
    if (job.salary_min) return t('jobs.salaryFrom', { min: fmt(job.salary_min), period })
    if (job.salary_max) return t('jobs.salaryUpTo', { max: fmt(job.salary_max), period })
    return t('jobs.salaryUndisclosed')
  }

  const language = (code: string) => {
    try {
      return new Intl.DisplayNames([lang], { type: 'language' }).of(code) ?? code
    } catch {
      return code
    }
  }

  return {
    meta,
    trade: (key: string) => t(`trades.${key}`, { defaultValue: key }),
    category: (key: string) => t(`category.${key}`, { defaultValue: key }),
    province,
    place,
    salary,
    language,
  }
}
