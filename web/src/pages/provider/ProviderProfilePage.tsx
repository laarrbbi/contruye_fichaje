import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, Loader2 } from 'lucide-react'
import { useUser } from '@/api/auth'
import { fieldErrors } from '@/api/client'
import { useSaveProviderProfile } from '@/api/obras'
import type { ProviderProfile } from '@/api/types'
import { CheckRow, ChipPicker, Field } from '@/components/Field'
import { PageHead } from '@/components/PageHead'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useLabels } from '@/hooks/useLabels'
import { usePageTitle } from '@/hooks/usePageTitle'

export function ProviderProfilePage() {
  const { t } = useTranslation()
  usePageTitle(t('provider.profile.title'))
  const labels = useLabels()
  const { data: user } = useUser()
  const save = useSaveProviderProfile()
  const [form, setForm] = useState<ProviderProfile>({ company_name: '', cif: '', categories: [], provinces: [], description: '', founded_year: null, website: '', listed: true })
  const [errors, setErrors] = useState<Record<string, string>>({})
  useEffect(() => {
    if (user?.profile) setForm((f) => ({ ...f, ...(user.profile as ProviderProfile) }))
  }, [user])
  const set = <K extends keyof ProviderProfile>(key: K, value: ProviderProfile[K]) => setForm((f) => ({ ...f, [key]: value }))

  return (
    <div className="container max-w-4xl py-12 sm:py-16">
      <PageHead title={t('provider.profile.title')} lead={t('provider.profile.lead')} />
      <form
        onSubmit={(e) => {
          e.preventDefault()
          setErrors({})
          save.mutate({ ...form, cif: form.cif || null, website: form.website || null, description: form.description || null }, { onError: (error) => setErrors(fieldErrors(error)) })
        }}
        className="grid gap-6 rounded-2xl border border-foreground/[0.08] bg-card p-6 sm:grid-cols-2 sm:p-8"
      >
        <Field label={t('employer.profile.name')} htmlFor="company" error={errors.company_name} className="sm:col-span-2">
          <Input id="company" value={form.company_name} onChange={(e) => set('company_name', e.target.value)} />
        </Field>
        <Field label={t('employer.profile.cif')} htmlFor="cif" error={errors.cif} optional>
          <Input id="cif" dir="ltr" value={form.cif ?? ''} onChange={(e) => set('cif', e.target.value.toUpperCase())} />
        </Field>
        <Field label={t('provider.profile.founded')} htmlFor="founded" error={errors.founded_year} optional>
          <Input id="founded" type="number" min={1900} max={new Date().getFullYear()} value={form.founded_year ?? ''} onChange={(e) => set('founded_year', e.target.value ? Number(e.target.value) : null)} />
        </Field>
        <Field label={t('provider.profile.categories')} error={errors.categories} className="sm:col-span-2">
          <ChipPicker options={(labels.meta?.obras.categories ?? []).map((c) => ({ value: c, label: labels.category(c) }))} value={form.categories} onChange={(v) => set('categories', v)} />
        </Field>
        <Field label={t('provider.profile.provinces')} error={errors.provinces} className="sm:col-span-2">
          <ChipPicker options={(labels.meta?.provinces ?? []).map((p) => ({ value: p.code, label: p.name }))} value={form.provinces} onChange={(v) => set('provinces', v)} />
        </Field>
        <Field label={t('employer.profile.description')} htmlFor="about" error={errors.description} className="sm:col-span-2" optional>
          <Textarea id="about" rows={5} maxLength={2000} value={form.description ?? ''} onChange={(e) => set('description', e.target.value)} />
        </Field>
        <Field label={t('employer.profile.website')} htmlFor="web" error={errors.website} optional>
          <Input id="web" type="url" dir="ltr" placeholder="https://" value={form.website ?? ''} onChange={(e) => set('website', e.target.value)} />
        </Field>
        <div className="sm:col-span-2">
          <CheckRow checked={form.listed} onChange={(v) => set('listed', v)} label={t('provider.profile.listed')} />
        </div>
        <div className="flex items-center gap-4 sm:col-span-2">
          <Button type="submit" variant="accent" size="lg" disabled={save.isPending}>
            {save.isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
            {t('common.save')}
          </Button>
          {save.isSuccess && (
            <span role="status" className="inline-flex items-center gap-1.5 text-sm text-success">
              <Check className="h-4 w-4" aria-hidden />
              {t('common.saved')}
            </span>
          )}
        </div>
      </form>
    </div>
  )
}
