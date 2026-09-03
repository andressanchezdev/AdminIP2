/** IDs de secciones enlazadas desde el footer y navegación interna. */
export const LANDING_SECTION_IDS = [
  'vision',
  'mission',
  'catalogo',
  'marcas',
  'equipo',
  'nosotros',
  'ubicacion',
  'contacto',
] as const

export type LandingSectionId = (typeof LANDING_SECTION_IDS)[number]

export function parseLandingHash(href: string): LandingSectionId | null {
  const id = href.replace(/^#\/?/, '').trim()
  return (LANDING_SECTION_IDS as readonly string[]).includes(id)
    ? (id as LandingSectionId)
    : null
}

export function isDocumentReload() {
  const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined
  return nav?.type === 'reload'
}

/** Recarga F5: ir al top y quitar hash (#equipo, etc.) para no restaurar la sección. */
export function resetLandingScrollOnReload() {
  if (typeof window === 'undefined' || !isDocumentReload()) return false
  if ('scrollRestoration' in window.history) {
    window.history.scrollRestoration = 'manual'
  }
  if (window.location.hash) {
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`)
  }
  window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  return true
}

/** Desplaza la sección al inicio visible, respetando el header fijo (scroll-margin-top en CSS). */
export function scrollToLandingSection(
  sectionId: LandingSectionId,
  behavior: ScrollBehavior = 'smooth',
): boolean {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const target = document.getElementById(sectionId)
  if (!target) return false
  target.scrollIntoView({
    behavior: prefersReduced ? 'auto' : behavior,
    block: 'start',
  })
  return true
}

/** Click en anclas internas (#sección): scroll smooth + hash sin salto brusco. */
export function handleLandingHashClick(
  event: { preventDefault: () => void },
  href: string,
): boolean {
  const sectionId = parseLandingHash(href)
  if (!sectionId) return false
  if (!document.getElementById(sectionId)) return false
  event.preventDefault()
  scrollToLandingSection(sectionId)
  window.history.replaceState(null, '', href.startsWith('#') ? href : `#${sectionId}`)
  return true
}
