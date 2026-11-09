import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ConstruyeLogo } from '@/components/brand/ConstruyeMark'

const COLUMN_TITLE = 'text-xs font-semibold uppercase tracking-wider text-foreground/70'

export function Footer() {
  const { t } = useTranslation()
  const columns = [
    {
      title: t('footer.empleo'),
      links: [
        { to: '/empleo', label: t('nav.empleo') },
        { to: '/empleo/ofertas', label: t('nav.jobs') },
        { to: '/empleo/empresas', label: t('nav.forCompanies') },
      ],
    },
    {
      title: t('footer.obras'),
      links: [
        { to: '/obras', label: t('nav.obras') },
        { to: '/obras/empresas', label: t('nav.companies') },
        { to: '/obras/profesionales', label: t('nav.forProfessionals') },
      ],
    },
    {
      title: t('footer.account'),
      links: [
        { to: '/login', label: t('nav.login') },
        { to: '/registro', label: t('nav.register') },
      ],
    },
  ]

  return (
    <footer className="theme-night !bg-[#04090F]">
      <div className="container py-12 text-sm">
        <div className="grid gap-10 sm:grid-cols-3 lg:grid-cols-[minmax(0,5fr)_repeat(3,minmax(0,2fr))] lg:gap-14">
          <div className="space-y-3 sm:col-span-3 lg:col-span-1">
            <Link to="/" className="inline-flex">
              <span className="sr-only">{t('app.name')}</span>
              <ConstruyeLogo variant="inherit" />
            </Link>
            <p className="max-w-sm leading-relaxed text-muted-foreground">{t('footer.about')}</p>
          </div>
          {columns.map((column) => (
            <nav key={column.title} aria-label={column.title} className="space-y-3">
              <p className={COLUMN_TITLE}>{column.title}</p>
              <ul className="space-y-2">
                {column.links.map(({ to, label }) => (
                  <li key={to}>
                    <Link to={to} className="text-muted-foreground transition-colors hover:text-foreground">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div className="mt-10 space-y-1 border-t pt-6 text-xs leading-relaxed text-muted-foreground">
          <p>{t('footer.credits')}</p>
          <p className="pt-2">{t('footer.copyright', { year: new Date().getFullYear() })}</p>
        </div>
      </div>
    </footer>
  )
}
