import { useEffect, useRef, useState } from 'react'
import { getLandingContent } from '../landingContentStore'
import { SpeedingText } from './SpeedingText'

/** Tres contadores: animan solo al entrar en viewport (scroll desde el hero). */
export function LandingStats() {
  const [inView, setInView] = useState(false)
  const rootRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const el = rootRef.current
    if (!el) return undefined

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || entry.intersectionRatio < 0.45) return
        setInView(true)
        io.disconnect()
      },
      {
        threshold: [0.45, 0.6],
        rootMargin: '0px 0px -18% 0px',
      },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <section
      ref={rootRef}
      className={`landing-stats${inView ? ' is-visible' : ''}`}
      id="cantidades"
      aria-label="Cantidades que manejamos"
    >
      <div className="landing-stats__viewport">
        {getLandingContent().stats.map((item, index) => (
          <article
            key={item.id}
            className={`landing-stats__slide landing-stats__slide--${item.id}`}
            style={{ ['--stats-delay' as string]: `${index * 120}ms` }}
          >
            <p className="landing-stats__lead">{item.lead}</p>
            <div className="landing-stats__counter">
              {inView ? (
                <SpeedingText
                  value={item.value}
                  from={0}
                  duration={item.duration}
                  blurStrength={item.blurStrength}
                  maxBlur={item.maxBlur}
                  fontSize={72}
                  fontWeight={800}
                  italic
                  textColor="#2D3238"
                  align="center"
                  startOnView={false}
                  loop={false}
                  locale="es-CO"
                  showSeparator
                  height="auto"
                  width="100%"
                />
              ) : (
                <span className="landing-stats__static" aria-hidden>0</span>
              )}
            </div>
            <p className="landing-stats__trail">{item.trail}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
