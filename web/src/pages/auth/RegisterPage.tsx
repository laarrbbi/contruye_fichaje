import { useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Briefcase, Building2, HardHat, Home, type LucideIcon } from 'lucide-react'
import { homeFor, useRegister, type RegisterPayload } from '@/api/auth'
import { fieldErrors } from '@/api/client'
import { useMeta } from '@/api/meta'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useLabels } from '@/hooks/useLabels'
import { BoutonEnvoi, Champ, ChampListe, ChampSecret, ChampTelephone, Erreur } from '@/components/auth/fields'
import { ChipPicker } from '@/components/Field'
import { cn } from '@/lib/utils'
import { AuthShell } from './AuthShell'

type SignupRole = RegisterPayload['role']

const ROLES: { platform: 'empleo' | 'obras'; roles: { role: SignupRole; icon: LucideIcon }[] }[] = [
  { platform: 'empleo', roles: [{ role: 'worker', icon: HardHat }, { role: 'employer', icon: Briefcase }] },
  { platform: 'obras', roles: [{ role: 'client', icon: Home }, { role: 'provider', icon: Building2 }] },
]

const isRole = (v: string | null): v is SignupRole => v === 'worker' || v === 'employer' || v === 'client' || v === 'provider'

/**
 * Sign up. First what the account is for (one of four, in two separate
 * platforms), then the few fields that account needs.
 */
export function RegisterPage() {
  const { t, i18n } = useTranslation()
  usePageTitle(t('auth.registerTitle'))
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { data: meta } = useMeta()
  const labels = useLabels()
  const signup = useRegister()

  const role = isRole(params.get('tipo')) ? (params.get('tipo') as SignupRole) : null
  const only = params.get('plataforma')
  const choose = (next: SignupRole | null) => {
    const p = new URLSearchParams(params)
    if (next) p.set('tipo', next)
    else p.delete('tipo')
    setParams(p, { replace: true })
  }

  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', password_confirmation: '', province: '', city: '', company_name: '', trade: '', categories: [] as string[] })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm((f) => ({ ...f, [key]: e.target.value }))
  const company = role === 'employer' || role === 'provider'

  const trades = useMemo(() => Object.entries(meta?.trade_groups ?? {}), [meta])

  const validate = () => {
    const e: Record<string, string> = {}
    const req = t('auth.validation.required')
    if (!form.name.trim()) e.name = req
    if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = t('auth.validation.email')
    if (form.phone.replace(/\D/g, '').length < 9) e.phone = t('auth.validation.phone')
    if (form.password.length < 8) e.password = t('auth.validation.password')
    if (form.password !== form.password_confirmation) e.password_confirmation = t('auth.validation.match')
    if (!form.province) e.province = req
    if (company && !form.company_name.trim()) e.company_name = req
    if (role === 'worker' && !form.trade) e.trade = req
    if (role === 'provider' && form.categories.length === 0) e.categories = t('auth.validation.categories')
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!role || !validate()) return
    signup.mutate(
      {
        role,
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone,
        password: form.password,
        password_confirmation: form.password_confirmation,
        province: form.province,
        city: form.city || undefined,
        company_name: company ? form.company_name.trim() : undefined,
        trade: role === 'worker' ? form.trade : undefined,
        categories: role === 'provider' ? form.categories : undefined,
        locale: i18n.language.startsWith('en') ? 'en' : 'es',
      },
      {
        onSuccess: (user) => {
          const from = (location.state as { from?: string } | null)?.from
          const next = typeof from === 'string' && from.startsWith('/') && !from.startsWith('//') ? from : homeFor(user.role)
          window.setTimeout(() => navigate(next, { replace: true }), 500)
        },
        onError: (error) => setErrors(fieldErrors(error)),
      },
    )
  }

  if (!role) {
    return (
      <AuthShell>
        <h1 className="titre text-[1.875rem] text-creme-100">{t('auth.chooseTitle')}</h1>
        <p className="mt-1.5 text-[0.9375rem] leading-relaxed text-creme-100/60">{t('auth.chooseSubtitle')}</p>
        <div className="mt-7 space-y-6">
          {ROLES.filter((g) => !only || g.platform === only).map((group) => (
            <div key={group.platform}>
              <p className="etiquette flex items-center gap-3 text-creme-100/55">
                <span aria-hidden className="h-px w-6 bg-or" />
                {t(`home.${group.platform}.label`)}
              </p>
              <div className="mt-3 grid gap-3">
                {group.roles.map(({ role: r, icon: Icon }) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => choose(r)}
                    className="group flex items-center gap-4 rounded-2xl bg-white/[0.045] p-4 text-start ring-1 ring-white/[0.12] transition-[background-color,box-shadow] duration-200 hover:bg-white/[0.08] hover:ring-[#E8A33D]/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F1B860]"
                  >
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#E8A33D]/15 text-[#F1B860]">
                      <Icon className="h-5 w-5" aria-hidden />
                    </span>
                    <span className="min-w-0">
                      <span className="block font-semibold text-creme-100">{t(`auth.roles.${r}.title`)}</span>
                      <span className="block text-[0.875rem] text-creme-100/60">{t(`auth.roles.${r}.text`)}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className="mt-7 text-center text-[0.9375rem] text-creme-100/65">
          {t('auth.haveAccount')}{' '}
          <Link to="/login" className="font-semibold text-[#F1B860] underline-offset-4 hover:underline">
            {t('nav.login')}
          </Link>
        </p>
      </AuthShell>
    )
  }

  return (
    <AuthShell>
      <button type="button" onClick={() => choose(null)} className="inline-flex items-center gap-1.5 rounded text-[0.875rem] text-creme-100/60 hover:text-[#F1B860] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#F1B860]">
        <ArrowLeft className="h-4 w-4 rtl:-scale-x-100" aria-hidden />
        {t('auth.change')}
      </button>
      <h1 className="titre mt-3 text-[1.75rem] text-creme-100">{t(`auth.roles.${role}.title`)}</h1>
      <p className="mt-1 text-[0.9375rem] text-creme-100/60">{t(`auth.roles.${role}.text`)}</p>

      <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
        {company && <Champ label={t('auth.companyName')} autoComplete="organization" value={form.company_name} onChange={set('company_name')} error={errors.company_name} />}
        <Champ label={company ? t('auth.contactName') : t('auth.name')} autoComplete="name" value={form.name} onChange={set('name')} error={errors.name} />
        {role === 'worker' && (
          <ChampListe label={t('auth.trade')} value={form.trade} onChange={set('trade')} error={errors.trade}>
            <option value="" className="bg-sombre-900" />
            {trades.map(([group, keys]) => (
              <optgroup key={group} label={t(`tradeGroups.${group}`)} className="bg-sombre-900">
                {keys.map((k) => (
                  <option key={k} value={k} className="bg-sombre-900">
                    {labels.trade(k)}
                  </option>
                ))}
              </optgroup>
            ))}
          </ChampListe>
        )}
        {role === 'provider' && (
          <div>
            <p className="mb-2 ps-1 text-[0.8125rem] text-creme-100/60">{t('auth.categories')}</p>
            <ChipPicker night options={(meta?.obras.categories ?? []).map((c) => ({ value: c, label: labels.category(c) }))} value={form.categories} onChange={(categories) => setForm((f) => ({ ...f, categories }))} />
            {errors.categories && <Erreur id="categories-error">{errors.categories}</Erreur>}
          </div>
        )}
        <Champ label={t('auth.email')} type="email" autoComplete="email" dir="ltr" value={form.email} onChange={set('email')} error={errors.email} />
        <ChampTelephone label={t('auth.phone')} onNumber={(phone) => setForm((f) => ({ ...f, phone }))} error={errors.phone} />
        <div className="grid gap-4 sm:grid-cols-2">
          <ChampListe label={t('auth.province')} value={form.province} onChange={set('province')} error={errors.province}>
            <option value="" className="bg-sombre-900" />
            {(meta?.provinces ?? []).map((p) => (
              <option key={p.code} value={p.code} className="bg-sombre-900">
                {p.name}
              </option>
            ))}
          </ChampListe>
          <Champ label={t('auth.city')} autoComplete="address-level2" value={form.city} onChange={set('city')} error={errors.city} />
        </div>
        <ChampSecret label={t('auth.password')} autoComplete="new-password" value={form.password} onChange={set('password')} error={errors.password} />
        <ChampSecret label={t('auth.passwordConfirm')} autoComplete="new-password" value={form.password_confirmation} onChange={set('password_confirmation')} error={errors.password_confirmation} />
        {signup.isError && Object.keys(errors).length === 0 && <Erreur id="signup-error">{t('common.error')}</Erreur>}
        <p className={cn('ps-1 text-[0.75rem] leading-relaxed text-creme-100/45')}>{t('auth.terms')}</p>
        <BoutonEnvoi state={signup.isSuccess ? 'done' : signup.isPending ? 'loading' : 'idle'}>{t('auth.submitRegister')}</BoutonEnvoi>
      </form>
    </AuthShell>
  )
}
