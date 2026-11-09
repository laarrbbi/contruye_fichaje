import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight, Briefcase, HardHat, Hammer, Home as HomeIcon } from 'lucide-react'
import { useMeta } from '@/api/meta'
import { NightHero, RisingTitle } from '@/components/NightHero'
import { usePageTitle } from '@/hooks/usePageTitle'
import { cn } from '@/lib/utils'

/**
 * The front door: two platforms, side by side, never mixed. Each card is a
 * door to its own world (its landing, its accounts).
 */
export function HomePage() {
  const { t } = useTranslation()
  usePageTitle(undefined)
  const { data: meta } = useMeta()
  const max = meta?.obras.max_unlocks ?? 4

  return (
    <>
      <NightHero className="pb-20 lg:pb-28">
        <div className="max-w-3xl pt-16 sm:pt-24 lg:pt-28">
          <p className="etiquette entree flex items-center gap-3 text-creme-100/65" style={{ ['--d' as string]: '100ms' }}>
            <span aria-hidden className="h-px w-8 bg-or" />
            {t('home.eyebrow')}
          </p>
          <RisingTitle text={t('home.title')} className="mt-5 text-[clamp(2.5rem,1.6rem+4vw,4.75rem)] text-creme-100" delay={150} />
          <p className="entree mt-6 max-w-xl text-lg leading-relaxed text-creme-100/70" style={{ ['--d' as string]: '450ms' }}>
            {t('home.lead')}
          </p>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-2">
          <Door
            to="/empleo"
            label={t('home.empleo.label')}
            title={t('home.empleo.title')}
            text={t('home.empleo.text')}
            lines={[
              { icon: HardHat, text: t('home.empleo.worker') },
              { icon: Briefcase, text: t('home.empleo.employer') },
            ]}
            cta={t('home.empleo.cta')}
            photo="/photos/obra-05.webp"
            delay={550}
          />
          <Door
            to="/obras"
            label={t('home.obras.label')}
            title={t('home.obras.title')}
            text={t('home.obras.text')}
            lines={[
              { icon: HomeIcon, text: t('home.obras.client', { max }) },
              { icon: Hammer, text: t('home.obras.provider') },
            ]}
            cta={t('home.obras.cta')}
            photo="/photos/illustration-residence-plein.webp"
            delay={680}
          />
        </div>
        <p className="entree mt-8 text-sm text-creme-100/55" style={{ ['--d' as string]: '800ms' }}>
          {t('home.separate')}
        </p>
      </NightHero>
    </>
  )
}

function Door({ to, label, title, text, lines, cta, photo, delay }: { to: string; label: string; title: string; text: string; lines: { icon: typeof HardHat; text: string }[]; cta: string; photo: string; delay: number }) {
  return (
    <Link
      to={to}
      className={cn('verre entree group block overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F1B860]')}
      style={{ ['--d' as string]: `${delay}ms` }}
    >
      <div className="relative h-44 overflow-hidden rounded-t-[1.25rem] sm:h-52">
        <img src={photo} alt="" className="h-full w-full object-cover transition-transform duration-[1200ms] ease-out-strong group-hover:scale-[1.04]" />
        <div aria-hidden className="absolute inset-0 bg-[linear-gradient(to_top,rgb(11_26_46/0.95),rgb(11_26_46/0.1)_70%)]" />
        <p className="etiquette absolute bottom-4 start-6 flex items-center gap-3 text-creme-100/80 sm:start-8">
          <span aria-hidden className="h-px w-6 bg-or" />
          {label}
        </p>
      </div>
      <div className="p-6 sm:p-8">
        <h2 className="titre text-[clamp(1.5rem,1.2rem+1vw,2rem)] text-creme-100">{title}</h2>
        <p className="mt-2 text-[0.9375rem] leading-relaxed text-creme-100/65">{text}</p>
        <ul className="mt-5 space-y-3">
          {lines.map(({ icon: Icon, text: line }) => (
            <li key={line} className="flex gap-3 text-[0.9375rem] leading-snug text-creme-100/85">
              <Icon className="mt-0.5 h-5 w-5 shrink-0 text-[#F1B860]" aria-hidden />
              {line}
            </li>
          ))}
        </ul>
        <span className="btn-or mt-7 w-full sm:w-auto">
          <span>{cta}</span>
          <span aria-hidden className="btn-or__fleche">
            <ArrowRight className="h-4 w-4 rtl:-scale-x-100" strokeWidth={1.75} />
          </span>
        </span>
      </div>
    </Link>
  )
}
