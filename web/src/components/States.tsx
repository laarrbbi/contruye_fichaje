import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { LoadingAnnouncement, Skeleton } from '@/components/ui/skeleton'

export function EmptyState({ title, text, action, icon }: { title: string; text?: string; action?: ReactNode; icon?: ReactNode }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-4 px-6 py-14 text-center">
        {icon && <div className="grid h-14 w-14 place-items-center rounded-2xl bg-secondary text-primary">{icon}</div>}
        <p className="titre max-w-md text-xl">{title}</p>
        {text && <p className="max-w-md text-sm leading-relaxed text-muted-foreground">{text}</p>}
        {action}
      </CardContent>
    </Card>
  )
}

export function ErrorState({ onRetry }: { onRetry?: () => void }) {
  const { t } = useTranslation()
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
        <p className="text-muted-foreground">{t('common.loadFailed')}</p>
        {onRetry && <Button onClick={onRetry}>{t('common.retry')}</Button>}
      </CardContent>
    </Card>
  )
}

export function ListSkeleton({ rows = 4, className = 'h-32' }: { rows?: number; className?: string }) {
  const { t } = useTranslation()
  return (
    <div className="grid gap-4">
      <LoadingAnnouncement label={t('common.loading')} />
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className={`${className} w-full rounded-2xl`} />
      ))}
    </div>
  )
}

export function Pagination({ page, last, onPage }: { page: number; last: number; onPage(page: number): void }) {
  const { t } = useTranslation()
  if (last <= 1) return null
  return (
    <nav className="mt-8 flex items-center justify-center gap-3" aria-label={t('common.page', { page, last })}>
      <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>
        <ChevronLeft className="h-4 w-4 rtl:-scale-x-100" aria-hidden />
        {t('common.previous')}
      </Button>
      <span className="text-sm text-muted-foreground">{t('common.page', { page, last })}</span>
      <Button variant="outline" size="sm" disabled={page >= last} onClick={() => onPage(page + 1)}>
        {t('common.next')}
        <ChevronRight className="h-4 w-4 rtl:-scale-x-100" aria-hidden />
      </Button>
    </nav>
  )
}
