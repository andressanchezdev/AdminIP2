import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { CAROUSEL_ITEMS } from '../content'
import { LANDING_IMAGES } from '../media'
import { getCircularOffset, useAdvisorCarousel } from '../hooks/useAdvisorCarousel'
import { useNearViewport } from '../hooks/useNearViewport'

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

type CarouselMetrics = {
  stride: number
  slideWidth: number
}

const EMPTY_METRICS: CarouselMetrics = {
  stride: 0,
  slideWidth: 0,
}

export function AdvisorCarousel() {
  const { ref: sectionRef, isActive } = useNearViewport<HTMLElement>()
  const viewportRef = useRef<HTMLDivElement>(null)
  const [metrics, setMetrics] = useState<CarouselMetrics>(EMPTY_METRICS)
  const [visibleSlides, setVisibleSlides] = useState(5)

  const {
    activeIndex,
    goToSlide,
    setIsPaused,
    slideNext,
    slidePrev,
  } = useAdvisorCarousel(isActive)

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

  const maxVisibleOffset = Math.floor(visibleSlides / 2)

  return (
    <section
      ref={sectionRef}
      className="landing-carousel"
      aria-label="Asesores Importadora Premium"
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
        <p className="landing-carousel__title" key={activeIndex}>
          {CAROUSEL_ITEMS[activeIndex].title}
        </p>
      </header>
      <div className="landing-carousel__stage">
        <div className="landing-carousel__viewport" ref={viewportRef}>
          <div className="landing-carousel__track">
            {CAROUSEL_ITEMS.map((item, index) => {
              const offset = getCircularOffset(index, activeIndex)
              const isOutOfView = Math.abs(offset) > maxVisibleOffset
              const x = metrics.stride > 0 ? offset * metrics.stride : 0
              return (
                <article
                  key={item.id}
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
                  <div 
                    className="landing-carousel__advisor-media"
                    style={{
                      backgroundImage: `url(${LANDING_IMAGES.employees.bgPattern})`,
                      backgroundPosition: 'center center',
                      backgroundSize: 'cover',
                      backgroundRepeat: 'no-repeat',
                    }}  
                  >
                    <span
                      className="landing-carousel__advisor-dup"
                      style={{
                        WebkitMaskImage: `url(${item.image})`,
                        maskImage: `url(${item.image})`,
                      }}
                      aria-hidden
                    />
                    <img
                      className="landing-carousel__advisor-main"
                      src={item.image}
                      alt={`${item.title} ${item.name}`}
                      loading="lazy"
                    />
                  </div>
                  <div className="landing-carousel__advisor-info">
                    <p className="landing-carousel__advisor-name">{item.name}</p>
                    <a
                      className="landing-carousel__advisor-phone"
                      href={item.whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      tabIndex={offset === 0 ? 0 : -1}
                    >
                      {item.phoneDisplay}
                    </a>
                  </div>
                </article>
              )
            })}
          </div>
        </div>

        <button
          type="button"
          className="landing-carousel__nav landing-carousel__nav--prev"
          aria-label="Asesor anterior"
          onClick={slidePrev}
        >
          <ChevronLeft size={28} strokeWidth={1.75} />
        </button>
        <button
          type="button"
          className="landing-carousel__nav landing-carousel__nav--next"
          aria-label="Asesor siguiente"
          onClick={slideNext}
        >
          <ChevronRight size={28} strokeWidth={1.75} />
        </button>
      </div>

      <div className="landing-carousel__dots" role="tablist" aria-label="Posición del carrusel de asesores">
        {CAROUSEL_ITEMS.map((item, index) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            className={`landing-carousel__dot${activeIndex === index ? ' is-active' : ''}`}
            aria-label={`Ver asesor ${item.name}`}
            aria-selected={activeIndex === index}
            onClick={() => goToSlide(index)}
          />
        ))}
      </div>
    </section>
  )
}
