import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { homeFor, useUser } from '@/api/auth'
import type { Role } from '@/api/types'
import { Button } from '@/components/ui/button'
import { RouteFallback } from './RouteFallback'

/**
 * A signed-in area, for some roles only. A worker who opens an employer
 * screen is told so (with a way home) instead of seeing an empty page.
 */
export function ProtectedRoute({ roles }: { roles?: Role[] }) {
  const { t } = useTranslation()
  const { data: user, isLoading } = useUser()
  const location = useLocation()

  if (isLoading) return <RouteFallback />
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  if (roles && !roles.includes(user.role)) {
    return (
      <div className="container flex min-h-[60vh] flex-col items-center justify-center gap-4 py-20 text-center">
        <h1 className="titre text-3xl">{t('forbidden.title')}</h1>
        <p className="max-w-md text-muted-foreground">{t('forbidden.text', { role: t(`roles.${user.role}`) })}</p>
        <Button asChild variant="accent">
          <Link to={homeFor(user.role)}>{t('notFound.home')}</Link>
        </Button>
      </div>
    )
  }
  return <Outlet />
}
