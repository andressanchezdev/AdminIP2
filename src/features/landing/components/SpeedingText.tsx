import { useEffect, useRef, useState, type CSSProperties } from 'react'
import './SpeedingText.css'

export type SpeedingTextProps = {
  value?: number
  from?: number
  duration?: number
  decimals?: number
  locale?: string
  blurStrength?: number
  maxBlur?: number
  showSeparator?: boolean
  fontSize?: number
  fontWeight?: number
  italic?: boolean
  textColor?: string
  backgroundColor?: string
  align?: 'left' | 'center' | 'right'
  startOnView?: boolean
  loop?: boolean
  loopDelay?: number
  paused?: boolean
  width?: string | number
  height?: string | number
  className?: string
  style?: CSSProperties
  onComplete?: () => void
}

function easeOutCubic(t: number) {
  return 1 - (1 - t) ** 3
}

function formatValue(n: number, decimals: number, locale: string, showSeparator: boolean) {
  const fixed = decimals > 0 ? Number(n.toFixed(decimals)) : Math.round(n)
  if (!showSeparator) {
    return decimals > 0 ? fixed.toFixed(decimals) : String(Math.round(n))
  }
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(fixed)
}

/** Contador con smear/blur — API alineada a React Bits SpeedingText (Pro). */
export function SpeedingText({
  value = 20000,
  from = 0,
  duration = 2200,
  decimals = 0,
  locale = 'es-CO',
  blurStrength = 1,
  maxBlur = 14,
  showSeparator = true,
  fontSize = 96,
  fontWeight = 700,
  italic = true,
  textColor = '#0a0a0a',
  backgroundColor = 'transparent',
  align = 'center',
  startOnView = true,
  loop = false,
  loopDelay = 900,
  paused = false,
  width = '100%',
  height = '100%',
  className = '',
  style,
  onComplete,
}: SpeedingTextProps) {
  const rootRef = useRef<HTMLDivElement | null>(null)
  const onCompleteRef = useRef(onComplete)
  const [inView, setInView] = useState(!startOnView)
  const [display, setDisplay] = useState(from)
  const [blur, setBlur] = useState(0)
  const [skew, setSkew] = useState(0)
  const [runKey, setRunKey] = useState(0)

  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  useEffect(() => {
    if (!startOnView) {
      setInView(true)
      return undefined
    }
    const el = rootRef.current
    if (!el) return undefined
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && entry.intersectionRatio > 0.2) setInView(true)
      },
      { threshold: [0, 0.2, 0.4] },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [startOnView])

  useEffect(() => {
    if (!inView || paused) return undefined

    let raf = 0
    let loopTimer: number | undefined
    const start = performance.now()
    const delta = value - from

    const tick = (now: number) => {
      const elapsed = now - start
      const t = Math.min(1, elapsed / duration)
      const e = easeOutCubic(t)
      const prevT = Math.min(1, Math.max(0, (elapsed - 16) / duration))
      const speed = Math.abs(easeOutCubic(t) - easeOutCubic(prevT)) * Math.abs(delta)
      setDisplay(from + delta * e)
      setBlur(Math.min(maxBlur, speed * 0.012 * blurStrength))
      setSkew((1 - e) * 8 * Math.sign(delta || 1))
      if (t < 1) {
        raf = requestAnimationFrame(tick)
      } else {
        setDisplay(value)
        setBlur(0)
        setSkew(0)
        if (loop) {
          loopTimer = window.setTimeout(() => setRunKey((k) => k + 1), loopDelay)
        } else {
          onCompleteRef.current?.()
        }
      }
    }

    setDisplay(from)
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      if (loopTimer) window.clearTimeout(loopTimer)
    }
  }, [inView, paused, value, from, duration, blurStrength, maxBlur, loop, loopDelay, runKey])

  return (
    <div
      ref={rootRef}
      className={`speeding-text ${className}`.trim()}
      style={{
        width,
        height,
        backgroundColor,
        justifyContent: align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center',
        ...style,
      }}
    >
      <span
        className="speeding-text__glyph"
        style={{
          color: textColor,
          fontSize,
          fontWeight,
          fontStyle: italic ? 'italic' : 'normal',
          filter: blur > 0.2 ? `blur(${blur}px)` : undefined,
          transform: `skewX(${-skew}deg) scaleX(${1 + Math.min(0.35, blur / 40)})`,
        }}
      >
        {formatValue(display, decimals, locale, showSeparator)}
      </span>
    </div>
  )
}
