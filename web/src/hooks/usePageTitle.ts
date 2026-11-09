import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

export function usePageTitle(title: string | undefined) {
  const { t } = useTranslation()
  useEffect(() => {
    document.title = title ? `${title} · ${t('app.name')}` : `${t('app.name')} — ${t('app.tagline')}`
  }, [title, t])
}
