import { useEffect, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { BackgroundVideo } from '@/components/BackgroundVideo'
import { useMediaNow } from '@/hooks/useMediaNow'
import { setHeaderTone } from '@/lib/headerTone'

/**
 * The account screens' night, as on contruye: the building-site video on the
 * reading side's start, fading into the night towards the form; two lights,
 * an architect's grid, the grain. On a phone, a band of video then the form.
 */
export function AuthShell({ children }: { children: ReactNode }) {
  const { t } = useTranslation()
  const wide = useMediaNow('(min-width: 1024px)')

  useEffect(() => {
    setHeaderTone('night')
    return () => setHeaderTone('default')
  }, [])

  return (
    <div data-plein className="relative isolate min-h-[calc(100svh-4rem-1px)] overflow-x-clip bg-sombre-950 text-creme-100">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="halo absolute end-[10%] top-[-20%] h-[56vmax] w-[56vmax] rounded-full bg-[radial-gradient(circle,rgb(59_111_216/0.22),transparent_60%)]" />
        <div className="halo absolute bottom-[-30%] end-[-6%] h-[58vmax] w-[58vmax] rounded-full bg-[radial-gradient(circle,rgb(232_163_61/0.18),transparent_60%)] [animation-delay:-7s]" />
        <div className="plan-grille absolute inset-0" />
      </div>
      <div aria-hidden className="grain" />

      {wide && (
        <div className="absolute inset-y-0 start-0 w-[58%]">
          <div className="fondu-nuit absolute inset-0 isolate overflow-hidden">
            <BackgroundVideo overlayClassName="bg-[linear-gradient(to_top,rgb(7_15_28/0.92),rgb(7_15_28/0.2)_42%,rgb(7_15_28/0.35))]" />
          </div>
          <p className="titre absolute bottom-14 start-10 max-w-[26rem] text-balance text-[clamp(1.5rem,0.9rem+1.3vw,2.25rem)] text-creme-100 xl:start-16">{t('auth.tagline')}</p>
        </div>
      )}

      <div className="container relative flex min-h-[calc(100svh-4rem-1px)] flex-col lg:grid lg:grid-cols-2 lg:items-center lg:py-10">
        {!wide && (
          <div aria-hidden className="relative isolate -mx-4 mb-1 h-[7.5rem] overflow-hidden sm:-mx-6 sm:h-[9rem]">
            <BackgroundVideo className="object-[50%_60%]" overlayClassName="bg-[linear-gradient(to_bottom,rgb(7_15_28/0.2),rgb(7_15_28/0.4)_55%,#070F1C)]" />
          </div>
        )}
        <div className="relative z-10 mx-auto w-full max-w-[31rem] pb-10 lg:col-start-2 lg:pb-0">
          <div className="verre p-6 sm:p-9">{children}</div>
        </div>
      </div>
    </div>
  )
}
