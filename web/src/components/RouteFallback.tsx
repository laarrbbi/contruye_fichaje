import { Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export function RouteFallback() {
  const { t } = useTranslation()
  return (
    <div role="status" className="flex min-h-[50vh] items-center justify-center text-muted-foreground">
      <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
      <span className="sr-only">{t('common.loading')}</span>
    </div>
  )
}
