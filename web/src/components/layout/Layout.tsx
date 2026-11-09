import { Suspense, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { RouteFallback } from '@/components/RouteFallback'
import { Footer } from './Footer'
import { Header } from './Header'

export function Layout() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    // A full-screen page (the sign-in night, the chat) marks itself
    // data-plein: the footer steps aside.
    <div className="flex min-h-screen flex-col [&:has([data-plein])>footer]:hidden [&:has([data-plein])]:bg-sombre-950">
      <Header />
      <main className="flex-1">
        <Suspense fallback={<RouteFallback />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
    </div>
  )
}
