import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Loader2, ShieldCheck } from 'lucide-react'
import { useUser } from '@/api/auth'
import { fieldErrors } from '@/api/client'
import { useOwnProject, useSaveProject, type ProjectPayload } from '@/api/obras'
import { Field, NativeSelect } from '@/components/Field'
import { PageHead } from '@/components/PageHead'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useLabels } from '@/hooks/useLabels'
import { usePageTitle } from '@/hooks/usePageTitle'

export function ProjectFormPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const projectId = id ? Number(id) : undefined
  const [params] = useSearchParams()
  usePageTitle(t('client.form.title'))
  const navigate = useNavigate()
  const labels = useLabels()
  const { data: user } = useUser()
  const { data: existing } = useOwnProject(projectId)
  const save = useSaveProject(projectId)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [form, setForm] = useState<ProjectPayload>({
    title: '',
    category: params.get('tipo') ?? '',
    description: '',
    province: '',
    city: '',
    postal_code: '',
    property_type: 'piso',
    budget: 'sin_definir',
    timing: '1_3_meses',
  })

  useEffect(() => {
    if (existing) {
      const { title, category, description, province, city, postal_code, property_type, budget, timing } = existing
      setForm({ title, category, description, province, city, postal_code: postal_code ?? '', property_type, budget, timing })
    } else if (!projectId && user) {
      setForm((f) => ({ ...f, province: f.province || user.province || '', city: f.city || user.city || '' }))
    }
  }, [existing, projectId, user])

  const set = <K extends keyof ProjectPayload>(key: K, value: ProjectPayload[K]) => setForm((f) => ({ ...f, [key]: value }))
  const o = labels.meta?.obras

  return (
    <div className="container max-w-3xl py-12 sm:py-16">
      <PageHead eyebrow={t('obras.eyebrow')} title={t('client.form.title')} lead={t('client.form.lead')} />
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault()
          setErrors({})
          save.mutate({ ...form, postal_code: form.postal_code || null }, { onSuccess: (p) => navigate(`/cliente/solicitudes/${p.id}`), onError: (error) => setErrors(fieldErrors(error)) })
        }}
        className="grid gap-5 rounded-2xl border border-foreground/[0.08] bg-card p-6 sm:grid-cols-2 sm:p-8"
      >
        <Field label={t('client.form.category')} htmlFor="category" error={errors.category} className="sm:col-span-2">
          <NativeSelect id="category" value={form.category} onChange={(e) => set('category', e.target.value)}>
            <option value="" />
            {(o?.categories ?? []).map((c) => (
              <option key={c} value={c}>
                {labels.category(c)}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field label={t('client.form.what')} htmlFor="title" error={errors.title} className="sm:col-span-2">
          <Input id="title" maxLength={140} placeholder={t('client.form.whatPlaceholder')} value={form.title} onChange={(e) => set('title', e.target.value)} />
        </Field>
        <Field label={t('client.form.description')} htmlFor="description" error={errors.description} className="sm:col-span-2">
          <Textarea id="description" rows={6} maxLength={5000} placeholder={t('client.form.descriptionPlaceholder')} value={form.description} onChange={(e) => set('description', e.target.value)} />
        </Field>
        <Field label={t('client.form.propertyType')} htmlFor="property">
          <NativeSelect id="property" value={form.property_type} onChange={(e) => set('property_type', e.target.value)}>
            {(o?.property_types ?? []).map((p) => (
              <option key={p} value={p}>
                {t(`property.${p}`)}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field label={t('client.form.budget')} htmlFor="budget">
          <NativeSelect id="budget" value={form.budget} onChange={(e) => set('budget', e.target.value)}>
            {Object.keys(o?.budgets ?? {}).map((b) => (
              <option key={b} value={b}>
                {t(`budget.${b}`)}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field label={t('client.form.timing')} htmlFor="timing">
          <NativeSelect id="timing" value={form.timing} onChange={(e) => set('timing', e.target.value)}>
            {(o?.timings ?? []).map((x) => (
              <option key={x} value={x}>
                {t(`timing.${x}`)}
              </option>
            ))}
          </NativeSelect>
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
        <Field label={t('common.city')} htmlFor="city" error={errors.city}>
          <Input id="city" maxLength={120} value={form.city} onChange={(e) => set('city', e.target.value)} />
        </Field>
        <Field label={t('client.form.postalCode')} htmlFor="cp" error={errors.postal_code} optional>
          <Input id="cp" inputMode="numeric" maxLength={5} dir="ltr" value={form.postal_code ?? ''} onChange={(e) => set('postal_code', e.target.value.replace(/\D/g, ''))} />
        </Field>
        <p className="flex items-start gap-2 text-sm text-muted-foreground sm:col-span-2">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden />
          {t('obras.privacy', { max: o?.max_unlocks ?? 4 })}
        </p>
        <div className="flex items-center gap-4 sm:col-span-2">
          <Button type="submit" variant="accent" size="lg" disabled={save.isPending}>
            {save.isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
            {projectId ? t('client.form.save') : t('client.form.submit')}
          </Button>
          {save.isError && !Object.keys(errors).length && <span className="text-sm text-destructive">{t('common.error')}</span>}
        </div>
      </form>
    </div>
  )
}
