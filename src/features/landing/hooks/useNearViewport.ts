import { useEffect, useRef, useState } from 'react'

/** Activa trabajo de animación cuando el bloque está en pantalla o a punto de entrar. */
export function useNearViewport<T extends HTMLElement>(rootMargin = '280px 0px') {
  const ref = useRef<T | null>(null)
  const [isActive, setIsActive] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return undefined

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsActive(Boolean(entry?.isIntersecting))
      },
      { root: null, rootMargin, threshold: 0.02 },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [rootMargin])

  return { ref, isActive }
}
