import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { isAxiosError } from 'axios'
import { homeFor, useLogin } from '@/api/auth'
import { usePageTitle } from '@/hooks/usePageTitle'
import { BoutonEnvoi, Champ, ChampSecret, Erreur } from '@/components/auth/fields'
import { AuthShell } from './AuthShell'

const schema = z.object({
  email: z.string().min(1, 'auth.validation.required').email('auth.validation.email'),
  password: z.string().min(1, 'auth.validation.required'),
})
type Values = z.infer<typeof schema>

/** Where to go after signing in: back where the guard sent them from, or home. */
function destination(from: unknown, role: Parameters<typeof homeFor>[0]) {
  return typeof from === 'string' && from.startsWith('/') && !from.startsWith('//') && !/^\/(login|registro)/.test(from) ? from : homeFor(role)
}

export function LoginPage() {
  const { t } = useTranslation()
  usePageTitle(t('auth.loginTitle'))
  const navigate = useNavigate()
  const location = useLocation()
  const login = useLogin()
  const [done, setDone] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm<Values>({ resolver: zodResolver(schema) })

  const onSubmit = (values: Values) =>
    login.mutate(values, {
      onSuccess: (user) => {
        setDone(true)
        window.setTimeout(() => navigate(destination((location.state as { from?: string } | null)?.from, user.role), { replace: true }), 500)
      },
    })

  const serverError = login.isError ? (isAxiosError(login.error) && login.error.response?.status === 422 ? t('auth.invalid') : t('common.error')) : null

  return (
    <AuthShell>
      <h1 className="titre text-[1.875rem] text-creme-100">{t('auth.loginTitle')}</h1>
      <p className="mt-1.5 text-[0.9375rem] text-creme-100/60">{t('auth.loginSubtitle')}</p>
      <form onSubmit={handleSubmit(onSubmit)} className="mt-7 space-y-4" noValidate>
        <Champ label={t('auth.email')} type="email" autoComplete="email" dir="ltr" error={errors.email ? t(errors.email.message!) : undefined} {...register('email')} />
        <ChampSecret label={t('auth.password')} autoComplete="current-password" error={errors.password ? t(errors.password.message!) : undefined} {...register('password')} />
        {serverError && <Erreur id="login-error">{serverError}</Erreur>}
        <BoutonEnvoi state={done ? 'done' : login.isPending ? 'loading' : 'idle'}>{t('auth.submitLogin')}</BoutonEnvoi>
      </form>
      <p className="mt-7 text-center text-[0.9375rem] text-creme-100/65">
        {t('auth.noAccount')}{' '}
        <Link to="/registro" state={location.state} className="rounded font-semibold text-[#F1B860] underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#F1B860]">
          {t('nav.register')}
        </Link>
      </p>
    </AuthShell>
  )
}
