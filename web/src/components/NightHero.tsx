import { useEffect, type ReactNode } from 'react'
import { BackgroundVideo } from '@/components/BackgroundVideo'
import { setHeaderTone } from '@/lib/headerTone'
import { cn } from '@/lib/utils'

/**
 * The night of the contruye sales page and sign-in screens: two lights that
 * wander, an architect's grid, the grain, and the building-site footage (or a
 * photograph) fading into it. The header turns to tracing paper over it.
 */
export function NightHero({ children, photo, video = true, className }: { children: ReactNode; photo?: string; video?: boolean; className?: string }) {
  useEffect(() => {
    setHeaderTone('night')
    return () => setHeaderTone('default')
  }, [])

  return (
    <section className={cn('relative isolate -mt-16 overflow-hidden bg-sombre-950 pt-16 text-creme-100', className)}>
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="halo absolute end-[10%] top-[-20%] h-[56vmax] w-[56vmax] rounded-full bg-[radial-gradient(circle,rgb(59_111_216/0.22),transparent_60%)]" />
        <div className="halo absolute bottom-[-30%] end-[-6%] h-[58vmax] w-[58vmax] rounded-full bg-[radial-gradient(circle,rgb(232_163_61/0.18),transparent_60%)] [animation-delay:-7s]" />
        <div className="plan-grille absolute inset-0" />
      </div>
      {(video || photo) && (
        <div aria-hidden className="absolute inset-y-0 end-0 -z-10 w-full lg:w-[58%]">
          <div className="fondu-nuit-fin absolute inset-0 isolate overflow-hidden max-lg:opacity-40">
            {photo ? (
              <>
                <img src={photo} alt="" className="kenburns absolute inset-0 -z-10 h-full w-full object-cover" />
                <div className="absolute inset-0 bg-[linear-gradient(to_top,rgb(7_15_28/0.9),rgb(7_15_28/0.25)_45%,rgb(7_15_28/0.4))]" />
              </>
            ) : (
              <BackgroundVideo overlayClassName="bg-[linear-gradient(to_top,rgb(7_15_28/0.92),rgb(7_15_28/0.2)_42%,rgb(7_15_28/0.35))]" />
            )}
          </div>
        </div>
      )}
      <div aria-hidden className="grain !absolute" />
      <div className="container relative">{children}</div>
    </section>
  )
}

/** The hero's title, word by word, rising from behind its own line. */
export function RisingTitle({ text, className, delay = 0 }: { text: string; className?: string; delay?: number }) {
  return (
    <h1 className={cn('titre text-balance', className)} aria-label={text}>
      {text.split(' ').map((word, i) => (
        // The space sits between the words' boxes: inside one it would collapse.
        <span key={i}>
          {i > 0 && ' '}
          <span aria-hidden className="mot" style={{ ['--i' as string]: i, ['--d' as string]: `${delay}ms` }}>
            <span>{word}</span>
          </span>
        </span>
      ))}
    </h1>
  )
}
