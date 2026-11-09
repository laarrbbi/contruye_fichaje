import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { usePageTitle } from '@/hooks/usePageTitle'

export function NotFoundPage() {
  const { t } = useTranslation()
  usePageTitle(t('notFound.title'))
  return (
    <div className="container flex min-h-[60vh] flex-col items-center justify-center gap-4 py-20 text-center">
      <p className="titre text-[5rem] !leading-none text-or">404</p>
      <h1 className="titre text-3xl">{t('notFound.title')}</h1>
      <p className="max-w-md text-muted-foreground">{t('notFound.text')}</p>
      <Button asChild variant="accent" size="lg">
        <Link to="/">{t('notFound.home')}</Link>
      </Button>
    </div>
  )
}
