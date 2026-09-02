import { useCallback, useEffect, useRef, useState } from 'react'
import { CAROUSEL_ITEMS } from '../content'

const SLIDE_COUNT = CAROUSEL_ITEMS.length
/** Tiempo que la card central permanece fija antes del siguiente paso suave. */
const AUTO_ADVANCE_MS = 2500
/** Debe cubrir --carousel-slide-duration (0.85s) + margen. */
const STEP_TRANSITION_MS = 900

/** Offset circular más corto de `index` respecto a `activeIndex` (−⌊n/2⌋…⌊n/2⌋). */
export function getCircularOffset(index: number, activeIndex: number, count = SLIDE_COUNT) {
  let delta = index - activeIndex
  delta = ((delta % count) + count) % count
  if (delta > count / 2) delta -= count
  return delta
}

export function useAdvisorCarousel() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [isStepping, setIsStepping] = useState(false)
  const stepTimerRef = useRef(0)

  const beginStepTransition = useCallback(() => {
    window.clearTimeout(stepTimerRef.current)
    setIsStepping(true)
    stepTimerRef.current = window.setTimeout(() => setIsStepping(false), STEP_TRANSITION_MS)
  }, [])

  const goToSlide = useCallback((index: number) => {
    const next = ((index % SLIDE_COUNT) + SLIDE_COUNT) % SLIDE_COUNT
    if (next === activeIndex) return
    beginStepTransition()
    setActiveIndex(next)
  }, [activeIndex, beginStepTransition])

  const slideNext = useCallback(() => {
    beginStepTransition()
    setActiveIndex((current) => (current + 1) % SLIDE_COUNT)
  }, [beginStepTransition])

  const slidePrev = useCallback(() => {
    beginStepTransition()
    setActiveIndex((current) => (current - 1 + SLIDE_COUNT) % SLIDE_COUNT)
  }, [beginStepTransition])

  useEffect(() => {
    if (isPaused || isStepping) return undefined

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) return undefined

    const timer = window.setTimeout(() => {
      slideNext()
    }, AUTO_ADVANCE_MS)

    return () => window.clearTimeout(timer)
  }, [isPaused, isStepping, slideNext])

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
