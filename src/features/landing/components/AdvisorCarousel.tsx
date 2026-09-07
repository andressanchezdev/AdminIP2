import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import {
  getPublishedLandingTeam,
  type LandingTeamGroup,
  type LandingTeamMember,
} from '@/mocks/data'
import { getCircularOffset, useAdvisorCarousel } from '../hooks/useAdvisorCarousel'
import { useNearViewport } from '../hooks/useNearViewport'

/** Swap de grupo: alinea con fade rápido del viewport (~0.32s). */
const GROUP_CROSSFADE_MS = 320

function advisorOffsetClass(offset: number) {
  if (offset === 0) return 'is-center'
  if (offset === -1) return 'is-side is-side--left'
  if (offset === 1) return 'is-side is-side--right'
  if (offset === -2) return 'is-far is-far--left'
  if (offset === 2) return 'is-far is-far--right'
  return 'is-away'
}

function readCarouselGap(viewport: HTMLElement) {
  const raw = getComputedStyle(viewport).getPropertyValue('--carousel-gap').trim()
  const parsed = Number.parseFloat(raw)
  return Number.isFinite(parsed) ? parsed : 12
}

function readVisibleSlides(viewport: HTMLElement) {
  const raw = getComputedStyle(viewport).getPropertyValue('--carousel-visible').trim()
  const parsed = Number.parseInt(raw, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 5
}

function memberWhatsappUrl(member: LandingTeamMember) {
  const digits = member.whatsappDigits || member.phoneDisplay.replace(/\D/g, '')
  return digits ? `https://wa.me/${digits}` : undefined
}

type CarouselMetrics = {
  stride: number
  slideWidth: number
}

type BadgePill = {
  left: number
  width: number
  ready: boolean
}

const EMPTY_METRICS: CarouselMetrics = {
  stride: 0,
  slideWidth: 0,
}

const EMPTY_PILL: BadgePill = {
  left: 0,
  width: 0,
  ready: false,
}

const GROUP_BADGES: Array<{ id: LandingTeamGroup; label: string }> = [
  { id: 'asesor', label: 'Asesores' },
  { id: 'administrativo', label: 'Administrativos' },
]

export function AdvisorCarousel() {
  const { ref: sectionRef, isActive } = useNearViewport<HTMLElement>()
  const viewportRef = useRef<HTMLDivElement>(null)
  const badgesRef = useRef<HTMLDivElement>(null)
  const badgeBtnRefs = useRef<Partial<Record<LandingTeamGroup, HTMLButtonElement | null>>>({})
  const [metrics, setMetrics] = useState<CarouselMetrics>(EMPTY_METRICS)
  const [visibleSlides, setVisibleSlides] = useState(5)
  const [activeGroup, setActiveGroup] = useState<LandingTeamGroup>('asesor')
  const [contentGroup, setContentGroup] = useState<LandingTeamGroup>('asesor')
  const [badgePill, setBadgePill] = useState<BadgePill>(EMPTY_PILL)
  const [groupFadeOn, setGroupFadeOn] = useState(true)
  const switchingRef = useRef(false)

  const items = useMemo(() => getPublishedLandingTeam(contentGroup), [contentGroup])
  const {
    activeIndex,
    goToSlide,
    setIsPaused,
    slideNext,
    slidePrev,
  } = useAdvisorCarousel(items.length, isActive && groupFadeOn)

  const selectGroup = (group: LandingTeamGroup) => {
    if (group === activeGroup || switchingRef.current) return
    switchingRef.current = true
    setActiveGroup(group)
    setGroupFadeOn(false)
    window.setTimeout(() => {
      setContentGroup(group)
      goToSlide(0)
      window.requestAnimationFrame(() => {
        setGroupFadeOn(true)
        switchingRef.current = false
      })
    }, GROUP_CROSSFADE_MS)
  }

  useLayoutEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return

    const updateMetrics = () => {
      const gap = readCarouselGap(viewport)
      const visible = readVisibleSlides(viewport)
      const viewportWidth = viewport.clientWidth
      const gapCount = Math.max(visible - 1, 0)
      const slideWidth = (viewportWidth - gapCount * gap) / visible
      const stride = slideWidth + gap

      viewport.style.setProperty('--carousel-slide-width', `${slideWidth}px`)
      setVisibleSlides(visible)
      setMetrics({ stride, slideWidth })
    }

    updateMetrics()
    const observer = new ResizeObserver(updateMetrics)
    observer.observe(viewport)
    window.addEventListener('resize', updateMetrics)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', updateMetrics)
    }
  }, [])

  useLayoutEffect(() => {
    const syncPill = () => {
      const parent = badgesRef.current
      const target = badgeBtnRefs.current[activeGroup]
      if (!parent || !target) {
        setBadgePill(EMPTY_PILL)
        return
      }
      setBadgePill({
        left: target.offsetLeft,
        width: target.offsetWidth,
        ready: true,
      })
    }

    syncPill()
    const parent = badgesRef.current
    if (!parent) return undefined
    const observer = new ResizeObserver(syncPill)
    observer.observe(parent)
    window.addEventListener('resize', syncPill)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', syncPill)
    }
  }, [activeGroup])

  const maxVisibleOffset = Math.floor(visibleSlides / 2)

  return (
    <section
      ref={sectionRef}
      className="landing-carousel"
      aria-label="Equipo Importadora Premium"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setIsPaused(false)
        }
      }}
    >
      <header className="landing-carousel__header">
        <div
          ref={badgesRef}
          className="landing-carousel__badges"
          role="tablist"
          aria-label="Grupo del equipo"
        >
          <span
            className={`landing-carousel__badge-pill${badgePill.ready ? ' is-ready' : ''}`}
            style={{
              transform: `translateX(${badgePill.left}px)`,
              width: badgePill.width,
            }}
            aria-hidden
          />
          {GROUP_BADGES.map((badge) => (
            <button
              key={badge.id}
              type="button"
              role="tab"
              ref={(node) => {
                badgeBtnRefs.current[badge.id] = node
              }}
              className={`landing-carousel__badge${activeGroup === badge.id ? ' is-active' : ''}`}
              aria-selected={activeGroup === badge.id}
              onClick={() => selectGroup(badge.id)}
            >
              {badge.label}
            </button>
          ))}
        </div>
      </header>
      <div className="landing-carousel__stage">
        <div
          className={`landing-carousel__viewport landing-carousel__viewport--crossfade${groupFadeOn ? ' is-active' : ''}`}
          ref={viewportRef}
        >
          <div className="landing-carousel__track" key={contentGroup}>
            {items.length === 0 ? (
              <p className="landing-carousel__empty">Pronto verás al equipo en esta sección.</p>
            ) : (
              items.map((item, index) => {
                const offset = getCircularOffset(index, activeIndex, items.length)
                const isOutOfView = Math.abs(offset) > maxVisibleOffset
                const x = metrics.stride > 0 ? offset * metrics.stride : 0
                const whatsappUrl = memberWhatsappUrl(item)
                return (
                  <article
                    key={`${item.id}-${index}`}
                    className={`landing-carousel__card landing-carousel__card--advisor ${
                      isOutOfView ? 'is-away' : advisorOffsetClass(offset)
                    }`}
                    style={{
                      ...(metrics.slideWidth > 0
                        ? { flexBasis: metrics.slideWidth, width: metrics.slideWidth }
                        : undefined),
                      '--carousel-x': `${x}px`,
                    } as CSSProperties}
                    aria-hidden={isOutOfView}
                  >
                    <div className="landing-carousel__advisor-media">
                      <span
                        className="landing-carousel__advisor-dup"
                        style={{
                          WebkitMaskImage: `url(${item.imageUrl})`,
                          maskImage: `url(${item.imageUrl})`,
                        }}
                        aria-hidden
                      />
                      <img
                        className="landing-carousel__advisor-main"
                        src={item.imageUrl}
                        alt={`${item.role} ${item.fullName}`}
                        loading="lazy"
                      />
                    </div>
                    <div className="landing-carousel__advisor-info">
                      <p className="landing-carousel__advisor-name">{item.fullName}</p>
                      <p className="landing-carousel__advisor-role">{item.role}</p>
                      {whatsappUrl ? (
                        <a
                          className="landing-carousel__advisor-phone"
                          href={whatsappUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          tabIndex={offset === 0 ? 0 : -1}
                        >
                          {item.phoneDisplay}
                        </a>
                      ) : (
                        <p className="landing-carousel__advisor-phone">{item.phoneDisplay}</p>
                      )}
                    </div>
                  </article>
                )
              })
            )}
          </div>
        </div>

        {items.length > 1 ? (
          <>
            <button
              type="button"
              className="landing-carousel__nav landing-carousel__nav--prev"
              aria-label="Anterior"
              onClick={slidePrev}
            >
              <ChevronLeft size={28} strokeWidth={1.75} />
            </button>
            <button
              type="button"
              className="landing-carousel__nav landing-carousel__nav--next"
              aria-label="Siguiente"
              onClick={slideNext}
            >
              <ChevronRight size={28} strokeWidth={1.75} />
            </button>
          </>
        ) : null}
      </div>

      {items.length > 0 ? (
        <div className="landing-carousel__dots" role="tablist" aria-label="Posición del carrusel">
          {items.map((item, index) => (
            <button
              key={`${item.id}-${index}`}
              type="button"
              role="tab"
              className={`landing-carousel__dot${activeIndex === index ? ' is-active' : ''}`}
              aria-label={`Ver ${item.fullName}`}
              aria-selected={activeIndex === index}
              onClick={() => goToSlide(index)}
            />
          ))}
        </div>
      ) : null}
    </section>
  )
}
