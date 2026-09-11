import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import {
  getPublishedLandingTeam,
  type LandingTeamGroup,
  type LandingTeamMember,
} from '@/mocks/data'
import { getCircularOffset, useAdvisorCarousel } from '../hooks/useAdvisorCarousel'
import { useNearViewport } from '../hooks/useNearViewport'
import { parseLandingHash } from '../landingScroll'

/** Swap de grupo: alinea con fade rápido del viewport (~0.32s). */
const GROUP_CROSSFADE_MS = 320
const DRAG_LOCK_PX = 8
const DRAG_SNAP_RATIO = 0.22
const DRAG_FLICK_PX_PER_MS = 0.5

type DragSession = {
  pointerId: number
  startX: number
  startY: number
  lastX: number
  lastT: number
  velocity: number
  axis: 'x' | 'y' | null
  offset: number
}

function snapIndexDelta(dragOffset: number, stride: number, velocity: number) {
  if (stride <= 0) return 0
  const ratio = -dragOffset / stride
  const rounded = Math.round(ratio)
  if (rounded !== 0) return rounded
  if (Math.abs(ratio) >= DRAG_SNAP_RATIO) return ratio > 0 ? 1 : -1
  if (
    Math.abs(velocity) >= DRAG_FLICK_PX_PER_MS
    && Math.sign(velocity) === Math.sign(dragOffset)
    && dragOffset !== 0
  ) {
    return dragOffset > 0 ? -1 : 1
  }
  return 0
}

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
    holdDrag,
    releaseDrag,
    slideNext,
    slidePrev,
  } = useAdvisorCarousel(items.length, isActive && groupFadeOn)
  const [dragOffset, setDragOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const dragRef = useRef<DragSession | null>(null)
  const suppressClickRef = useRef(false)
  const metricsRef = useRef(metrics)
  metricsRef.current = metrics

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
  const selectGroupRef = useRef(selectGroup)
  selectGroupRef.current = selectGroup

  useEffect(() => {
    const showAdvisors = () => {
      if (parseLandingHash(window.location.hash) === 'asesores') {
        selectGroupRef.current('asesor')
      }
    }
    const onSection = (event: Event) => {
      if ((event as CustomEvent<string>).detail === 'asesores') {
        selectGroupRef.current('asesor')
      }
    }
    showAdvisors()
    window.addEventListener('hashchange', showAdvisors)
    window.addEventListener('landing-section', onSection)
    return () => {
      window.removeEventListener('hashchange', showAdvisors)
      window.removeEventListener('landing-section', onSection)
    }
  }, [])

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

  const finishSwipe = useCallback((session: DragSession) => {
    const stride = metricsRef.current.stride
    setIsDragging(false)
    setDragOffset(0)
    dragRef.current = null
    releaseDrag(snapIndexDelta(session.offset, stride, session.velocity))
  }, [releaseDrag])

  const onViewportPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || items.length < 2 || switchingRef.current) return
    suppressClickRef.current = false
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      lastX: event.clientX,
      lastT: event.timeStamp,
      velocity: 0,
      axis: null,
      offset: 0,
    }
  }

  const onViewportPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const session = dragRef.current
    if (!session || session.pointerId !== event.pointerId) return

    const dx = event.clientX - session.startX
    const dy = event.clientY - session.startY
    if (!session.axis) {
      if (Math.abs(dx) < DRAG_LOCK_PX && Math.abs(dy) < DRAG_LOCK_PX) return
      session.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y'
      if (session.axis === 'y') {
        dragRef.current = null
        return
      }
      event.currentTarget.setPointerCapture(event.pointerId)
      holdDrag()
      setIsDragging(true)
    }
    if (session.axis !== 'x') return

    event.preventDefault()
    const dt = event.timeStamp - session.lastT
    if (dt > 0) session.velocity = (event.clientX - session.lastX) / dt
    session.lastX = event.clientX
    session.lastT = event.timeStamp
    session.offset = dx
    if (Math.abs(dx) >= DRAG_LOCK_PX) suppressClickRef.current = true
    setDragOffset(dx)
  }

  const onViewportPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    const session = dragRef.current
    if (!session || session.pointerId !== event.pointerId) return
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    if (session.axis === 'x') {
      finishSwipe(session)
      return
    }
    dragRef.current = null
  }

  const onViewportClickCapture = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (!suppressClickRef.current) return
    event.preventDefault()
    event.stopPropagation()
    suppressClickRef.current = false
  }

  const maxVisibleOffset = Math.floor(visibleSlides / 2)

  return (
    <section
      ref={sectionRef}
      id="asesores"
      className={`landing-carousel${isDragging ? ' is-dragging' : ''}`}
      aria-label="Equipo Importadora Premium"
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
          onPointerDown={onViewportPointerDown}
          onPointerMove={onViewportPointerMove}
          onPointerUp={onViewportPointerUp}
          onPointerCancel={onViewportPointerUp}
          onClickCapture={onViewportClickCapture}
        >
          <div className="landing-carousel__track" key={contentGroup}>
            {items.length === 0 ? (
              <p className="landing-carousel__empty">Pronto verás al equipo en esta sección.</p>
            ) : (
              items.map((item, index) => {
                const offset = getCircularOffset(index, activeIndex, items.length)
                const visualOffset = metrics.stride > 0
                  ? offset + dragOffset / metrics.stride
                  : offset
                const slot = Math.round(visualOffset)
                const isOutOfView = Math.abs(slot) > maxVisibleOffset
                const x = metrics.stride > 0 ? offset * metrics.stride + dragOffset : dragOffset
                const whatsappUrl = memberWhatsappUrl(item)
                return (
                  <article
                    key={`${item.id}-${index}`}
                    className={`landing-carousel__card landing-carousel__card--advisor ${
                      isOutOfView ? 'is-away' : advisorOffsetClass(slot)
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
                        draggable={false}
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
                          tabIndex={slot === 0 ? 0 : -1}
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
