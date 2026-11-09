import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, Loader2 } from 'lucide-react'
import { useUser } from '@/api/auth'
import { fieldErrors } from '@/api/client'
import { useSaveEmployerProfile } from '@/api/empleo'
import type { EmployerProfile } from '@/api/types'
import { Field, NativeSelect } from '@/components/Field'
import { PageHead } from '@/components/PageHead'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { usePageTitle } from '@/hooks/usePageTitle'

const SECTORS = ['obra_nueva', 'reformas', 'obra_civil', 'instalaciones', 'ett', 'otros']
const SIZES = ['1-9', '10-49', '50-249', '250+']

export function EmployerProfilePage() {
  const { t } = useTranslation()
  usePageTitle(t('employer.profile.title'))
  const { data: user } = useUser()
  const save = useSaveEmployerProfile()
  const [form, setForm] = useState<EmployerProfile>({ company_name: '', cif: '', sector: 'obra_nueva', size: null, description: '', website: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  useEffect(() => {
    if (user?.profile) setForm((f) => ({ ...f, ...(user.profile as EmployerProfile) }))
  }, [user])
  const set = <K extends keyof EmployerProfile>(key: K, value: EmployerProfile[K]) => setForm((f) => ({ ...f, [key]: value }))

  return (
    <div className="container max-w-3xl py-12 sm:py-16">
      <PageHead title={t('employer.profile.title')} lead={t('employer.profile.lead')} />
      <form
        onSubmit={(e) => {
          e.preventDefault()
          setErrors({})
          save.mutate({ ...form, cif: form.cif || null, website: form.website || null, description: form.description || null }, { onError: (error) => setErrors(fieldErrors(error)) })
        }}
        className="grid gap-5 rounded-2xl border border-foreground/[0.08] bg-card p-6 sm:grid-cols-2 sm:p-8"
      >
        <Field label={t('employer.profile.name')} htmlFor="company" error={errors.company_name} className="sm:col-span-2">
          <Input id="company" value={form.company_name} onChange={(e) => set('company_name', e.target.value)} />
        </Field>
        <Field label={t('employer.profile.cif')} htmlFor="cif" error={errors.cif} optional>
          <Input id="cif" dir="ltr" value={form.cif ?? ''} onChange={(e) => set('cif', e.target.value.toUpperCase())} />
        </Field>
        <Field label={t('employer.profile.website')} htmlFor="web" error={errors.website} optional>
          <Input id="web" type="url" dir="ltr" placeholder="https://" value={form.website ?? ''} onChange={(e) => set('website', e.target.value)} />
        </Field>
        <Field label={t('employer.profile.sector')} htmlFor="sector">
          <NativeSelect id="sector" value={form.sector} onChange={(e) => set('sector', e.target.value)}>
            {SECTORS.map((s) => (
              <option key={s} value={s}>
                {t(`sector.${s}`)}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field label={t('employer.profile.size')} htmlFor="size" optional>
          <NativeSelect id="size" value={form.size ?? ''} onChange={(e) => set('size', e.target.value || null)}>
            <option value="" />
            {SIZES.map((s) => (
              <option key={s} value={s}>
                {t(`size.${s}`)}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field label={t('employer.profile.description')} htmlFor="about" error={errors.description} className="sm:col-span-2" optional>
          <Textarea id="about" rows={5} maxLength={2000} value={form.description ?? ''} onChange={(e) => set('description', e.target.value)} />
        </Field>
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
