import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Check, ChevronDown, Globe, LogOut, Settings, type LucideIcon, Briefcase, Search, MessageSquare, CreditCard, Building2, ClipboardList, Users, UserRound, ShieldCheck, Hammer } from 'lucide-react'
import { ConstruyeLogo } from '@/components/brand/ConstruyeMark'
import { Button } from '@/components/ui/button'
import { homeFor, useLogout, useSummary, useUser } from '@/api/auth'
import type { User } from '@/api/types'
import { LOCALES, LOCALE_NAMES, type Locale } from '@/i18n'
import { useHeaderTone } from '@/lib/headerTone'
import { areaOf } from '@/lib/platform'
import { cn, initials } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  badge?: number
  end?: boolean
}

/** The places each kind of account goes. Empleo and Obras never share a link. */
function linksFor(user: User, t: (k: string) => string, unread: number, fresh: number): NavItem[] {
  const messages: NavItem = { to: '/mensajes', label: t('nav.messages'), icon: MessageSquare, badge: unread }
  switch (user.role) {
    case 'worker':
      return [
        { to: '/trabajador', label: t('nav.worker.home'), icon: ClipboardList, end: true },
        { to: '/empleo/ofertas', label: t('nav.worker.jobs'), icon: Search },
        messages,
        { to: '/trabajador/perfil', label: t('nav.worker.profile'), icon: UserRound },
      ]
    case 'employer':
      return [
        { to: '/empresa', label: t('nav.employer.home'), icon: Briefcase, badge: fresh, end: true },
        { to: '/empresa/candidatos', label: t('nav.employer.workers'), icon: Users },
        messages,
        { to: '/empresa/plan', label: t('nav.employer.billing'), icon: CreditCard },
      ]
    case 'client':
      return [
        { to: '/cliente', label: t('nav.client.home'), icon: ClipboardList, end: true },
        { to: '/obras/empresas', label: t('nav.client.companies'), icon: Building2 },
        messages,
      ]
    case 'provider':
      return [
        { to: '/profesional', label: t('nav.provider.home'), icon: Hammer, end: true },
        { to: '/profesional/clientes', label: t('nav.provider.unlocked'), icon: Users },
        messages,
        { to: '/profesional/creditos', label: t('nav.provider.billing'), icon: CreditCard },
      ]
    case 'admin':
      return [{ to: '/admin', label: t('nav.admin'), icon: ShieldCheck }]
  }
}

const SUB = { empleo: 'EMPLEO', obras: 'OBRAS', common: 'FICHAJE' } as const

export function Header() {
  const { t, i18n } = useTranslation()
  const { data: user } = useUser()
  const { data: summary } = useSummary(!!user && user.role !== 'admin')
  const logout = useLogout()
  const navigate = useNavigate()
  const location = useLocation()
  const current = (LOCALES.find((l) => l === i18n.language) ?? 'es') as Locale

  const area = areaOf(location.pathname, user?.role)
  const tone = useHeaderTone()
  const night = tone === 'night'
  const quiet = night ? 'text-blanc hover:bg-blanc/10 hover:text-blanc focus-visible:ring-blanc focus-visible:ring-offset-nuit-950' : undefined

  const links: NavItem[] = user
    ? linksFor(user, t, summary?.unread ?? 0, summary?.new_applications ?? 0)
    : area === 'empleo'
      ? [
          { to: '/empleo/ofertas', label: t('nav.jobs'), icon: Search },
          { to: '/empleo/empresas', label: t('nav.forCompanies'), icon: Briefcase },
          { to: '/obras', label: t('nav.obras'), icon: Hammer },
        ]
      : area === 'obras'
        ? [
            { to: '/obras/empresas', label: t('nav.companies'), icon: Building2 },
            { to: '/obras/profesionales', label: t('nav.forProfessionals'), icon: Hammer },
            { to: '/empleo', label: t('nav.empleo'), icon: Briefcase },
          ]
        : [
            { to: '/empleo', label: t('nav.empleo'), icon: Briefcase },
            { to: '/obras', label: t('nav.obras'), icon: Hammer },
          ]

  const registerTo = area === 'common' ? '/registro' : `/registro?plataforma=${area}`
  const homeTo = user ? homeFor(user.role) : area === 'common' ? '/' : `/${area}`

  return (
    <header
      className={cn(
        'sticky top-0 z-40 w-full border-b transition-colors duration-500 ease-out-strong',
        night
          ? 'border-blanc/10 bg-sombre-950/55 text-blanc backdrop-blur'
          : tone === 'paper'
            ? 'border-transparent bg-creme-100/80 text-plume backdrop-blur-md'
            : 'bg-white/90 backdrop-blur-md supports-[backdrop-filter]:bg-white/75',
      )}
    >
      <div className="container flex h-16 items-center gap-6">
        <Link to={homeTo} className="shrink-0">
          <span className="sr-only">{t('app.name')}</span>
          <ConstruyeLogo variant={night ? 'inherit' : 'brand'} sub={SUB[area]} wordmarkClassName="hidden min-[440px]:flex" />
        </Link>

        <nav aria-label={t('nav.main')} className="hidden items-center gap-1 lg:flex">
          {links.map(({ to, label, badge, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'relative rounded-md px-3 py-2 text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  night
                    ? cn('text-blanc hover:bg-blanc/10', isActive && 'bg-blanc/10')
                    : isActive
                      ? 'bg-primary/[0.07] text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )
              }
            >
              {label}
              {!!badge && <Badge count={badge} />}
            </NavLink>
          ))}
        </nav>

        <div className="ms-auto flex min-w-0 items-center gap-1 sm:gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className={cn('px-2 sm:px-3', quiet ?? 'text-muted-foreground hover:text-foreground')}>
                <Globe className="h-4 w-4" aria-hidden />
                <span className="font-semibold uppercase">{current}</span>
                <span className="sr-only">{t('nav.changeLanguage')}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[10rem]">
              {LOCALES.map((locale) => (
                <DropdownMenuItem key={locale} onSelect={() => void i18n.changeLanguage(locale)} className="justify-between gap-3">
                  <span lang={locale}>{LOCALE_NAMES[locale]}</span>
                  {locale === current && <Check className="h-4 w-4 shrink-0 text-primary" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    'group relative flex items-center gap-1.5 rounded-full p-0.5 pe-1.5 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2',
                    night ? 'hover:bg-blanc/10 focus-visible:ring-blanc data-[state=open]:bg-blanc/10' : 'hover:bg-muted focus-visible:ring-ring data-[state=open]:bg-muted',
                  )}
                >
                  <span aria-hidden className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground ring-2 ring-white">
                    {initials(user.name)}
                  </span>
                  {(summary?.unread ?? 0) > 0 && <span aria-hidden className="absolute start-6 top-0 h-2.5 w-2.5 rounded-full bg-or ring-2 ring-white lg:hidden" />}
                  <ChevronDown aria-hidden className={cn('h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-180', night ? 'text-blanc/80' : 'text-muted-foreground')} />
                  <span className="sr-only">
                    {t('nav.account')} — {user.name}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel className="font-normal">
                  <div className="truncate text-sm font-semibold">{user.name}</div>
                  <div className="truncate text-xs text-muted-foreground">{user.email}</div>
                  <div className="mt-1 text-[0.6875rem] font-medium uppercase tracking-wider text-foreground/55">{t(`roles.${user.role}`)}</div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {links.map(({ to, label, icon: Icon, badge }) => (
                  <DropdownMenuItem key={to} asChild className="gap-2">
                    <Link to={to}>
                      <Icon className="h-4 w-4 text-muted-foreground" aria-hidden />
                      {label}
                      {!!badge && <span className="ms-auto rounded-full bg-or px-1.5 text-[0.6875rem] font-semibold text-plume">{badge}</span>}
                    </Link>
                  </DropdownMenuItem>
                ))}
                {user.role === 'employer' && (
                  <DropdownMenuItem asChild className="gap-2">
                    <Link to="/empresa/perfil">
                      <Building2 className="h-4 w-4 text-muted-foreground" aria-hidden />
                      {t('nav.employer.profile')}
                    </Link>
                  </DropdownMenuItem>
                )}
                {user.role === 'provider' && (
                  <DropdownMenuItem asChild className="gap-2">
                    <Link to="/profesional/perfil">
                      <Building2 className="h-4 w-4 text-muted-foreground" aria-hidden />
                      {t('nav.provider.profile')}
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem asChild className="gap-2">
                  <Link to="/cuenta">
                    <Settings className="h-4 w-4 text-muted-foreground" aria-hidden />
                    {t('nav.account')}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="gap-2" onSelect={() => logout.mutate(undefined, { onSuccess: () => navigate('/') })}>
                  <LogOut className="h-4 w-4 text-muted-foreground" aria-hidden />
                  {t('nav.logout')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button variant="ghost" size="sm" className={quiet} asChild>
                <Link to="/login" state={{ from: location.pathname }}>
                  {t('nav.login')}
                </Link>
              </Button>
              <Button size="sm" className={cn(night && 'bg-blanc text-encre hover:bg-white focus-visible:ring-blanc focus-visible:ring-offset-nuit-950')} asChild>
                <Link to={registerTo}>
                  <span className="sm:hidden">{t('nav.registerShort')}</span>
                  <span className="hidden sm:inline">{t('nav.register')}</span>
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>
      {/* A phone: the account's places as a row of tabs under the bar. */}
      {links.length > 0 && (
        <nav aria-label={t('nav.main')} className={cn('no-scrollbar flex gap-1 overflow-x-auto border-t px-3 py-1.5 lg:hidden', night ? 'border-blanc/10' : 'border-border/60')}>
          {links.map(({ to, label, badge, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'relative shrink-0 whitespace-nowrap rounded-md px-3 py-1.5 text-[0.8125rem] font-medium',
                  night ? cn('text-blanc/85', isActive && 'bg-blanc/10 text-blanc') : isActive ? 'bg-primary/[0.07] text-primary' : 'text-muted-foreground',
                )
              }
            >
              {label}
              {!!badge && <Badge count={badge} />}
            </NavLink>
          ))}
        </nav>
      )}
    </header>
  )
}

function Badge({ count }: { count: number }) {
  return (
    <span className="ms-1.5 inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-or px-1.5 text-[0.6875rem] font-semibold leading-5 text-plume">
      {count > 99 ? '99+' : count}
    </span>
  )
}
