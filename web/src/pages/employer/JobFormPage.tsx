import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Loader2 } from 'lucide-react'
import { useUser } from '@/api/auth'
import { fieldErrors } from '@/api/client'
import { useOwnJob, useSaveJob, type JobPayload } from '@/api/empleo'
import { CheckRow, Field, NativeSelect } from '@/components/Field'
import { PageHead } from '@/components/PageHead'
import { ListSkeleton } from '@/components/States'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useLabels } from '@/hooks/useLabels'
import { usePageTitle } from '@/hooks/usePageTitle'

const EMPTY: JobPayload = {
  title: '',
  trade: '',
  province: '',
  city: '',
  contract_type: 'fijo_obra',
  workday: 'completa',
  salary_min: null,
  salary_max: null,
  salary_period: 'mes',
  start: 'inmediata',
  vacancies: 1,
  experience_min: 0,
  description: '',
  requirements: '',
  requires_tpc: false,
  requires_license: false,
  accommodation: false,
}

export function JobFormPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const jobId = id ? Number(id) : undefined
  usePageTitle(jobId ? t('employer.form.editTitle') : t('employer.form.newTitle'))
  const navigate = useNavigate()
  const labels = useLabels()
  const { data: user } = useUser()
  const { data: existing, isLoading } = useOwnJob(jobId)
  const save = useSaveJob(jobId)
  const [form, setForm] = useState<JobPayload>(EMPTY)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (existing) {
      const { title, trade, province, city, contract_type, workday, salary_min, salary_max, salary_period, start, vacancies, experience_min, description, requirements, requires_tpc, requires_license, accommodation } = existing
      setForm({ title, trade, province, city: city ?? '', contract_type, workday, salary_min, salary_max, salary_period, start, vacancies, experience_min, description, requirements: requirements ?? '', requires_tpc, requires_license, accommodation })
    } else if (!jobId && user) {
      setForm((f) => ({ ...f, province: f.province || user.province || '', city: f.city || user.city || '' }))
    }
  }, [existing, jobId, user])

  const set = <K extends keyof JobPayload>(key: K, value: JobPayload[K]) => setForm((f) => ({ ...f, [key]: value }))
  const num = (v: string) => (v === '' ? null : Number(v))

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    save.mutate(
      { ...form, city: form.city || null, requirements: form.requirements || null },
      {
        onSuccess: (job) => navigate(`/empresa/ofertas/${job.id}`),
        onError: (error) => setErrors(fieldErrors(error)),
      },
    )
  }

  if (jobId && isLoading) {
    return (
      <div className="container max-w-4xl py-12">
        <ListSkeleton rows={2} className="h-64" />
      </div>
    )
  }

  return (
    <div className="container max-w-4xl py-12 sm:py-16">
      <PageHead title={jobId ? t('employer.form.editTitle') : t('employer.form.newTitle')} lead={jobId ? undefined : t('employer.form.lead')} />
      <form onSubmit={submit} className="space-y-8" noValidate>
        <section className="grid gap-5 rounded-2xl border border-foreground/[0.08] bg-card p-6 sm:grid-cols-2 sm:p-8">
          <Field label={t('employer.form.title')} htmlFor="title" error={errors.title} className="sm:col-span-2">
            <Input id="title" maxLength={140} value={form.title} placeholder={t('employer.form.titlePlaceholder')} onChange={(e) => set('title', e.target.value)} />
          </Field>
          <Field label={t('employer.form.trade')} htmlFor="trade" error={errors.trade}>
            <NativeSelect id="trade" value={form.trade} onChange={(e) => set('trade', e.target.value)}>
              <option value="" />
              {Object.entries(labels.meta?.trade_groups ?? {}).map(([group, keys]) => (
                <optgroup key={group} label={t(`tradeGroups.${group}`)}>
                  {keys.map((k) => (
                    <option key={k} value={k}>
                      {labels.trade(k)}
                    </option>
                  ))}
                </optgroup>
              ))}
            </NativeSelect>
          </Field>
          <Field label={t('employer.form.vacancies')} htmlFor="vacancies" error={errors.vacancies}>
            <Input id="vacancies" type="number" min={1} max={500} value={form.vacancies} onChange={(e) => set('vacancies', Number(e.target.value))} />
          </Field>
          <Field label={t('common.province')} htmlFor="province" error={errors.province}>
            <NativeSelect id="province" value={form.province} onChange={(e) => set('province', e.target.value)}>
              <option value="" />
              {(labels.meta?.provinces ?? []).map((p) => (
                <option key={p.code} value={p.code}>
                  {p.name}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field label={t('common.city')} htmlFor="city" error={errors.city} optional>
            <Input id="city" maxLength={120} value={form.city ?? ''} onChange={(e) => set('city', e.target.value)} />
          </Field>
        </section>

        <section className="grid gap-5 rounded-2xl border border-foreground/[0.08] bg-card p-6 sm:grid-cols-2 sm:p-8">
          <Field label={t('employer.form.contract')} htmlFor="contract" error={errors.contract_type}>
            <NativeSelect id="contract" value={form.contract_type} onChange={(e) => set('contract_type', e.target.value)}>
              {(labels.meta?.contract_types ?? []).map((c) => (
                <option key={c} value={c}>
                  {t(`contract.${c}`)}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field label={t('employer.form.workday')} htmlFor="workday">
            <NativeSelect id="workday" value={form.workday} onChange={(e) => set('workday', e.target.value)}>
              {(labels.meta?.workdays ?? []).map((w) => (
                <option key={w} value={w}>
                  {t(`workday.${w}`)}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field label={t('employer.form.salary')} hint={t('employer.form.salaryHint')} error={errors.salary_max ?? errors.salary_min} className="sm:col-span-2">
            <div className="grid grid-cols-3 gap-3">
              <Input type="number" min={0} aria-label={t('employer.form.salaryMin')} placeholder={t('employer.form.salaryMin')} value={form.salary_min ?? ''} onChange={(e) => set('salary_min', num(e.target.value))} />
              <Input type="number" min={0} aria-label={t('employer.form.salaryMax')} placeholder={t('employer.form.salaryMax')} value={form.salary_max ?? ''} onChange={(e) => set('salary_max', num(e.target.value))} />
              <NativeSelect aria-label={t('employer.form.salaryPeriod')} value={form.salary_period} onChange={(e) => set('salary_period', e.target.value)}>
                {(labels.meta?.salary_periods ?? []).map((p) => (
                  <option key={p} value={p}>
                    {t(`periodName.${p}`)}
                  </option>
                ))}
              </NativeSelect>
            </div>
          </Field>
          <Field label={t('employer.form.start')} htmlFor="start">
            <NativeSelect id="start" value={form.start} onChange={(e) => set('start', e.target.value)}>
              {(labels.meta?.starts ?? []).map((s) => (
                <option key={s} value={s}>
                  {t(`start.${s}`)}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field label={t('employer.form.experience')} htmlFor="experience" error={errors.experience_min}>
            <Input id="experience" type="number" min={0} max={40} value={form.experience_min} onChange={(e) => set('experience_min', Number(e.target.value))} />
          </Field>
        </section>

        <section className="grid gap-5 rounded-2xl border border-foreground/[0.08] bg-card p-6 sm:p-8">
          <Field label={t('employer.form.description')} htmlFor="description" error={errors.description}>
            <Textarea id="description" rows={7} maxLength={5000} value={form.description} placeholder={t('employer.form.descriptionPlaceholder')} onChange={(e) => set('description', e.target.value)} />
          </Field>
          <Field label={t('employer.form.requirements')} htmlFor="requirements" error={errors.requirements} optional>
            <Textarea id="requirements" rows={4} maxLength={3000} value={form.requirements ?? ''} placeholder={t('employer.form.requirementsPlaceholder')} onChange={(e) => set('requirements', e.target.value)} />
          </Field>
          <div className="space-y-3">
            <CheckRow checked={form.requires_tpc} onChange={(v) => set('requires_tpc', v)} label={t('employer.form.requiresTpc')} />
            <CheckRow checked={form.requires_license} onChange={(v) => set('requires_license', v)} label={t('employer.form.requiresLicense')} />
            <CheckRow checked={form.accommodation} onChange={(v) => set('accommodation', v)} label={t('employer.form.accommodation')} />
          </div>
        </section>

        <div className="flex items-center gap-4">
          <Button type="submit" variant="accent" size="lg" disabled={save.isPending}>
            {save.isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
            {jobId ? t('employer.form.save') : t('employer.form.publish')}
          </Button>
          <Button type="button" variant="ghost" onClick={() => navigate(-1)}>
            {t('common.cancel')}
          </Button>
          {save.isError && !Object.keys(errors).length && <span className="text-sm text-destructive">{t('common.error')}</span>}
        </div>
      </form>
    </div>
  )
}
