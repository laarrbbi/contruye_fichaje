import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, Loader2 } from 'lucide-react'
import { useUser } from '@/api/auth'
import { fieldErrors } from '@/api/client'
import { useSaveWorkerProfile } from '@/api/empleo'
import type { WorkerProfile } from '@/api/types'
import { CheckRow, ChipPicker, Field, NativeSelect } from '@/components/Field'
import { PageHead, SectionLabel } from '@/components/PageHead'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useLabels } from '@/hooks/useLabels'
import { usePageTitle } from '@/hooks/usePageTitle'

const LANGUAGES = ['es', 'en', 'fr', 'pt', 'ro', 'ar', 'uk', 'ru', 'bg', 'pl', 'ca', 'eu', 'gl']

const EMPTY: WorkerProfile = {
  trade: '',
  other_trades: [],
  years_experience: 0,
  headline: '',
  bio: '',
  availability: 'immediate',
  has_tpc: false,
  prl_training: 'none',
  driving_license: false,
  own_vehicle: false,
  work_permit: true,
  willing_to_travel: false,
  languages: ['es'],
  visible: true,
}

export function WorkerProfilePage() {
  const { t } = useTranslation()
  usePageTitle(t('worker.profile.title'))
  const labels = useLabels()
  const { data: user } = useUser()
  const save = useSaveWorkerProfile()
  const [form, setForm] = useState<WorkerProfile>(EMPTY)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (user?.profile) setForm({ ...EMPTY, ...(user.profile as WorkerProfile) })
  }, [user])

  const set = <K extends keyof WorkerProfile>(key: K, value: WorkerProfile[K]) => setForm((f) => ({ ...f, [key]: value }))
  const allTrades = Object.values(labels.meta?.trade_groups ?? {}).flat()

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    save.mutate(
      { ...form, headline: form.headline || null, bio: form.bio || null, visible: form.visible ?? true },
      { onError: (error) => setErrors(fieldErrors(error)) },
    )
  }

  return (
    <div className="container max-w-4xl py-12 sm:py-16">
      <PageHead title={t('worker.profile.title')} lead={t('worker.profile.lead')} />
      <form onSubmit={submit} className="space-y-10">
        <section className="grid gap-5 rounded-2xl border border-foreground/[0.08] bg-card p-6 sm:grid-cols-2 sm:p-8">
          <Field label={t('worker.profile.trade')} htmlFor="trade" error={errors.trade}>
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
          <Field label={t('worker.profile.years')} htmlFor="years" error={errors.years_experience}>
            <Input id="years" type="number" min={0} max={60} value={form.years_experience} onChange={(e) => set('years_experience', Number(e.target.value))} />
          </Field>
          <Field label={t('worker.profile.headline')} htmlFor="headline" error={errors.headline} className="sm:col-span-2">
            <Input id="headline" maxLength={120} value={form.headline ?? ''} placeholder={t('worker.profile.headlinePlaceholder')} onChange={(e) => set('headline', e.target.value)} />
          </Field>
          <Field label={t('worker.profile.bio')} htmlFor="bio" error={errors.bio} hint={t('worker.profile.bioHint')} className="sm:col-span-2">
            <Textarea id="bio" rows={5} maxLength={1500} value={form.bio ?? ''} placeholder={t('worker.profile.bioPlaceholder')} onChange={(e) => set('bio', e.target.value)} />
          </Field>
          <Field label={t('worker.profile.otherTrades')} hint={t('worker.profile.otherTradesHint')} className="sm:col-span-2">
            <ChipPicker max={5} options={allTrades.filter((k) => k !== form.trade).map((k) => ({ value: k, label: labels.trade(k) }))} value={form.other_trades} onChange={(v) => set('other_trades', v)} />
          </Field>
          <Field label={t('worker.profile.availability')} htmlFor="availability">
            <NativeSelect id="availability" value={form.availability} onChange={(e) => set('availability', e.target.value as WorkerProfile['availability'])}>
              {(['immediate', 'two_weeks', 'month', 'employed'] as const).map((a) => (
                <option key={a} value={a}>
                  {t(`availability.${a}`)}
                </option>
              ))}
            </NativeSelect>
          </Field>
        </section>

        <section className="rounded-2xl border border-foreground/[0.08] bg-card p-6 sm:p-8">
          <SectionLabel>{t('worker.profile.training')}</SectionLabel>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <Field label={t('worker.profile.prl')} htmlFor="prl">
              <NativeSelect id="prl" value={form.prl_training ?? 'none'} onChange={(e) => set('prl_training', e.target.value as WorkerProfile['prl_training'])}>
                {(['none', '20h', '60h', '300h'] as const).map((p) => (
                  <option key={p} value={p}>
                    {t(`prl.${p}`)}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <div className="space-y-3 sm:pt-7">
              <CheckRow checked={form.has_tpc} onChange={(v) => set('has_tpc', v)} label={t('worker.profile.tpc')} />
              <CheckRow checked={form.driving_license} onChange={(v) => set('driving_license', v)} label={t('worker.profile.license')} />
              <CheckRow checked={form.own_vehicle} onChange={(v) => set('own_vehicle', v)} label={t('worker.profile.vehicle')} />
              <CheckRow checked={form.work_permit} onChange={(v) => set('work_permit', v)} label={t('worker.profile.permit')} />
              <CheckRow checked={form.willing_to_travel} onChange={(v) => set('willing_to_travel', v)} label={t('worker.profile.travel')} />
            </div>
            <Field label={t('worker.profile.languages')} className="sm:col-span-2">
              <ChipPicker max={8} options={LANGUAGES.map((l) => ({ value: l, label: labels.language(l) }))} value={form.languages} onChange={(v) => set('languages', v)} />
            </Field>
          </div>
        </section>

        <section className="rounded-2xl border border-foreground/[0.08] bg-card p-6 sm:p-8">
          <CheckRow checked={form.visible ?? true} onChange={(v) => set('visible', v)} label={t('worker.profile.visible')} hint={t('worker.profile.visibleHint')} />
        </section>

        <div className="flex items-center gap-4">
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
          {save.isError && !Object.keys(errors).length && <span className="text-sm text-destructive">{t('common.error')}</span>}
        </div>
      </form>
    </div>
  )
}
