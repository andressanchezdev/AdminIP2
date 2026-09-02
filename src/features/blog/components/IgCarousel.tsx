import { useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import './IgCarousel.css'

type IgCarouselProps = {
  images: string[]
  alt?: string
  compact?: boolean
}

const MAX_IMAGES = 8

/** Carrusel deslizable estilo Instagram (1–8 imágenes). */
export function IgCarousel({ images, alt = 'Imagen', compact = false }: IgCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [index, setIndex] = useState(0)
  const urls = images.map((url) => url.trim()).filter(Boolean).slice(0, MAX_IMAGES)

  if (!urls.length) {
    return <div className="ig-carousel__empty">Sin imágenes</div>
  }

  const goTo = (next: number) => {
    const clamped = Math.max(0, Math.min(urls.length - 1, next))
    setIndex(clamped)
    const track = trackRef.current
    if (!track) return
    const slide = track.children[clamped] as HTMLElement | undefined
    slide?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }

  return (
    <div className={`ig-carousel${compact ? ' ig-carousel--compact' : ''}`}>
      <div
        className="ig-carousel__track"
        ref={trackRef}
        onScroll={() => {
          const track = trackRef.current
          if (!track || !track.clientWidth) return
          const next = Math.round(track.scrollLeft / track.clientWidth)
          setIndex(Math.max(0, Math.min(urls.length - 1, next)))
        }}
      >
        {urls.map((url, i) => (
          <div key={`${url}-${i}`} className="ig-carousel__slide">
            <img src={url} alt={`${alt} ${i + 1}`} className="ig-carousel__image" />
          </div>
        ))}
      </div>
      {urls.length > 1 ? (
        <>
          <button
            type="button"
            className="ig-carousel__nav ig-carousel__nav--prev"
            aria-label="Anterior"
            disabled={index <= 0}
            onClick={() => goTo(index - 1)}
          >
            <ChevronLeft size={18} aria-hidden />
          </button>
          <button
            type="button"
            className="ig-carousel__nav ig-carousel__nav--next"
            aria-label="Siguiente"
            disabled={index >= urls.length - 1}
            onClick={() => goTo(index + 1)}
          >
            <ChevronRight size={18} aria-hidden />
          </button>
          <div className="ig-carousel__dots" aria-hidden>
            {urls.map((_, i) => (
              <span key={i} className={`ig-carousel__dot${i === index ? ' is-active' : ''}`} />
            ))}
          </div>
        </>
      ) : null}
    </div>
  )
}

export const IG_CAROUSEL_MIN = 1
export const IG_CAROUSEL_MAX = MAX_IMAGES
