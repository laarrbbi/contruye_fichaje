import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, Loader2 } from 'lucide-react'
import { useUpdateAccount, useUser } from '@/api/auth'
import { fieldErrors } from '@/api/client'
import { Field, NativeSelect } from '@/components/Field'
import { PageHead } from '@/components/PageHead'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LOCALES, LOCALE_NAMES } from '@/i18n'
import { useLabels } from '@/hooks/useLabels'
import { usePageTitle } from '@/hooks/usePageTitle'

export function AccountPage() {
  const { t, i18n } = useTranslation()
  usePageTitle(t('account.title'))
  const labels = useLabels()
  const { data: user } = useUser()
  const update = useUpdateAccount()
  const [form, setForm] = useState({ name: '', phone: '', province: '', city: '', locale: 'es' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  useEffect(() => {
    if (user) setForm({ name: user.name, phone: user.phone ?? '', province: user.province ?? '', city: user.city ?? '', locale: user.locale })
  }, [user])
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm((f) => ({ ...f, [k]: e.target.value }))

  return (
    <div className="container max-w-2xl py-12 sm:py-16">
      <PageHead eyebrow={user ? t('account.type', { role: t(`roles.${user.role}`) }) : undefined} title={t('account.title')} lead={t('account.lead')} />
      <form
        onSubmit={(e) => {
          e.preventDefault()
          setErrors({})
          update.mutate(
            { ...form, city: form.city || null },
            {
              onSuccess: (u) => void i18n.changeLanguage(u.locale),
              onError: (error) => setErrors(fieldErrors(error)),
            },
          )
        }}
        className="grid gap-5 rounded-2xl border border-foreground/[0.08] bg-card p-6 sm:grid-cols-2 sm:p-8"
      >
        <Field label={t('auth.name')} htmlFor="name" error={errors.name} className="sm:col-span-2">
          <Input id="name" value={form.name} onChange={set('name')} />
        </Field>
        <Field label={t('auth.email')} htmlFor="email">
          <Input id="email" value={user?.email ?? ''} disabled dir="ltr" />
        </Field>
        <Field label={t('auth.phone')} htmlFor="phone" error={errors.phone}>
          <Input id="phone" type="tel" dir="ltr" value={form.phone} onChange={set('phone')} />
        </Field>
        <Field label={t('common.province')} htmlFor="province" error={errors.province}>
          <NativeSelect id="province" value={form.province} onChange={set('province')}>
            {(labels.meta?.provinces ?? []).map((p) => (
              <option key={p.code} value={p.code}>
                {p.name}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field label={t('common.city')} htmlFor="city" error={errors.city}>
          <Input id="city" value={form.city} onChange={set('city')} />
        </Field>
        <Field label={t('account.language')} htmlFor="locale">
          <NativeSelect id="locale" value={form.locale} onChange={set('locale')}>
            {LOCALES.map((l) => (
              <option key={l} value={l}>
                {LOCALE_NAMES[l]}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <div className="flex items-center gap-4 sm:col-span-2">
          <Button type="submit" variant="accent" size="lg" disabled={update.isPending}>
            {update.isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
            {t('common.save')}
          </Button>
          {update.isSuccess && (
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
