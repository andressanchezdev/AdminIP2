import { useCallback, useEffect, useRef, useState } from 'react'

/** Tiempo que la card central permanece fija antes del siguiente paso suave. */
const AUTO_ADVANCE_MS = 2500
/** Debe cubrir --carousel-slide-duration (0.85s) + margen. */
const STEP_TRANSITION_MS = 900

/** Offset circular más corto de `index` respecto a `activeIndex` (−⌊n/2⌋…⌊n/2⌋). */
export function getCircularOffset(index: number, activeIndex: number, count: number) {
  if (count <= 0) return 0
  let delta = index - activeIndex
  delta = ((delta % count) + count) % count
  if (delta > count / 2) delta -= count
  return delta
}

export function useAdvisorCarousel(itemCount: number, enabled = true) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [isStepping, setIsStepping] = useState(false)
  const stepTimerRef = useRef(0)
  const steppingRef = useRef(false)
  const count = Math.max(0, itemCount)

  useEffect(() => {
    setActiveIndex((current) => (count === 0 ? 0 : Math.min(current, count - 1)))
  }, [count])

  const beginStepTransition = useCallback(() => {
    window.clearTimeout(stepTimerRef.current)
    steppingRef.current = true
    setIsStepping(true)
    stepTimerRef.current = window.setTimeout(() => {
      steppingRef.current = false
      setIsStepping(false)
    }, STEP_TRANSITION_MS)
  }, [])

  const goToSlide = useCallback((index: number) => {
    if (count === 0 || steppingRef.current) return
    const next = ((index % count) + count) % count
    if (next === activeIndex) return
    beginStepTransition()
    setActiveIndex(next)
  }, [activeIndex, beginStepTransition, count])

  const slideNext = useCallback(() => {
    if (count === 0 || steppingRef.current) return
    beginStepTransition()
    setActiveIndex((current) => (current + 1) % count)
  }, [beginStepTransition, count])

  const slidePrev = useCallback(() => {
    if (count === 0 || steppingRef.current) return
    beginStepTransition()
    setActiveIndex((current) => (current - 1 + count) % count)
  }, [beginStepTransition, count])

  useEffect(() => {
    if (!enabled || isPaused || isStepping || count < 2) return undefined

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) return undefined

    const timer = window.setTimeout(() => {
      slideNext()
    }, AUTO_ADVANCE_MS)

    return () => window.clearTimeout(timer)
  }, [count, enabled, isPaused, isStepping, slideNext])

  useEffect(() => () => window.clearTimeout(stepTimerRef.current), [])

  return {
    activeIndex,
    goToSlide,
    isPaused,
    isStepping,
    setIsPaused,
    slideNext,
    slidePrev,
  }
}
