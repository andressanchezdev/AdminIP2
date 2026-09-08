import { useCallback, useRef, useState } from 'react'
import {ReactImageMagnify} from 'react-image-magnify-lib'

type CatalogHeroMagnifyProps = {
  alt: string
  magnifierHeight?: number
  magnifierWidth?: number
  src: string
  zoomLevel?: number
}

type LensView = {
  backgroundPositionX: string
  backgroundPositionY: string
  backgroundSize: string
  height: number
  left: number
  top: number
  width: number
}

function coverFrame(img: HTMLImageElement, boxWidth: number, boxHeight: number) {
  const naturalWidth = img.naturalWidth
  const naturalHeight = img.naturalHeight
  if (!naturalWidth || !naturalHeight) {
    return { cropX: 0, cropY: 0, renderedHeight: boxHeight, renderedWidth: boxWidth }
  }

  const scale = Math.max(boxWidth / naturalWidth, boxHeight / naturalHeight)
  const renderedWidth = naturalWidth * scale
  const renderedHeight = naturalHeight * scale

  return {
    cropX: (renderedWidth - boxWidth) / 2,
    cropY: (renderedHeight - boxHeight) / 2,
    renderedHeight,
    renderedWidth,
  }
}

function lensInsideFrame(
  img: HTMLImageElement,
  frame: DOMRect,
  clientX: number,
  clientY: number,
  magnifierWidth: number,
  magnifierHeight: number,
  zoomLevel: number,
): LensView | null {
  const x = clientX - frame.left
  const y = clientY - frame.top
  if (x < 0 || y < 0 || x > frame.width || y > frame.height) return null

  const width = Math.min(magnifierWidth, frame.width)
  const height = Math.min(magnifierHeight, frame.height)
  const left = Math.min(Math.max(0, x - width / 2), Math.max(0, frame.width - width))
  const top = Math.min(Math.max(0, y - height / 2), Math.max(0, frame.height - height))
  const { cropX, cropY, renderedHeight, renderedWidth } = coverFrame(img, frame.width, frame.height)

  return {
    backgroundPositionX: `${-((cropX + x) * zoomLevel - (x - left))}px`,
    backgroundPositionY: `${-((cropY + y) * zoomLevel - (y - top))}px`,
    backgroundSize: `${renderedWidth * zoomLevel}px ${renderedHeight * zoomLevel}px`,
    height,
    left,
    top,
    width,
  }
}

export function CatalogHeroMagnify({
  alt,
  magnifierHeight = 360,
  magnifierWidth = 360,
  src,
  zoomLevel = 2.4,
}: CatalogHeroMagnifyProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const [armed, setArmed] = useState(false)
  const [lens, setLens] = useState<LensView | null>(null)

  const placeLens = useCallback(
    (clientX: number, clientY: number) => {
      const host = hostRef.current
      const img = host?.querySelector('img')
      if (!host || !img) return

      setLens(lensInsideFrame(img, host.getBoundingClientRect(), clientX, clientY, magnifierWidth, magnifierHeight, zoomLevel))
    },
    [magnifierHeight, magnifierWidth, zoomLevel],
  )

  const stopLens = useCallback(() => {
    setArmed(false)
    setLens(null)
  }, [])

  const armFromMedia = (event: { clientX: number; clientY: number; target: EventTarget | null }) => {
    if (event.target instanceof Element && event.target.closest('.landing-detail__hero-zoom')) return
    setArmed(true)
    placeLens(event.clientX, event.clientY)
  }

  return (
    <div
      ref={hostRef}
      className={`landing-detail__hero-magnify-host${armed ? ' is-armed' : ''}`}
      onClick={armFromMedia}
      onPointerMove={(event) => {
        if (!armed) return
        placeLens(event.clientX, event.clientY)
      }}
      onPointerLeave={stopLens}
    >
      <ReactImageMagnify
        className="landing-detail__hero-magnify"
        smallImageSrc={src}
        largeImageSrc={src}
        magnifierWidth={magnifierWidth}
        magnifierHeight={magnifierHeight}
        zoomLevel={zoomLevel}
        alt={alt}
      />
      {lens ? (
        <div
          className="landing-detail__hero-lens"
          aria-hidden
          style={{
            backgroundImage: `url('${src}')`,
            backgroundPositionX: lens.backgroundPositionX,
            backgroundPositionY: lens.backgroundPositionY,
            backgroundSize: lens.backgroundSize,
            height: lens.height,
            left: lens.left,
            top: lens.top,
            width: lens.width,
          }}
        />
      ) : null}
      <span
        className={`landing-detail__hero-zoom${armed ? ' is-on' : ''}`}
        aria-hidden
        onClick={(event) => event.stopPropagation()}
      >
        <span className="landing-detail__hero-zoom-mark" aria-hidden>
          <span>+</span>
          <span>−</span>
        </span>
      </span>
    </div>
  )
}
