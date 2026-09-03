import { CATALOG_OPTIONS, LANDING_CONTACT, QUAD_EXPLORE_LINKS } from './content'
import { LANDING_IMAGES } from './media'

export type LandingDetailKind = 'catalog' | 'vacancies'

export type LandingDetailPage = {
  slug: string
  kind: LandingDetailKind
  eyebrow: string
  title: string
  /** Texto de apoyo bajo el título. */
  lead: string
  /** Imágenes semilla (catálogo) o hero (vacantes). */
  images: readonly string[]
  ctaLabel: string
  ctaHref: string
}

const CATALOG_DETAILS: LandingDetailPage[] = CATALOG_OPTIONS.map((option) => ({
  slug: option.id,
  kind: 'catalog' as const,
  eyebrow: 'Catálogo',
  title: 'Catálogo de productos',
  lead: `Repuestos y accesorios premium en la línea de ${option.label.toLowerCase()}.`,
  images: option.images,
  ctaLabel: 'Contactar asesor',
  ctaHref: '/#equipo',
}))

const EXPLORE_DETAIL_COPY: Record<
  string,
  Pick<LandingDetailPage, 'kind' | 'lead' | 'images' | 'eyebrow' | 'title' | 'ctaLabel' | 'ctaHref'>
> = {
  catalogo: {
    kind: 'catalog',
    eyebrow: 'Importadora Premium',
    title: 'Catálogo de productos',
    lead: 'Explora nuestro surtido por categorías y encuentra la referencia que necesitas.',
    images: CATALOG_OPTIONS.flatMap((option) => option.images).slice(0, 4),
    ctaLabel: 'Volver al inicio',
    ctaHref: '/',
  },
  vacantes: {
    kind: 'vacancies',
    eyebrow: 'Talento Importadora Premium',
    title: 'Trabaja con nosotros',
    lead: 'Vacantes abiertas, postúlate a la vacante que más te guste.',
    images: [LANDING_IMAGES.nosotros, LANDING_IMAGES.vision],
    ctaLabel: 'Enviar postulación',
    ctaHref: `mailto:${LANDING_CONTACT.email}?subject=Postulaci%C3%B3n%20vacante`,
  },
}

const EXPLORE_DETAILS: LandingDetailPage[] = [
  ...QUAD_EXPLORE_LINKS.map((link) => {
    const copy = EXPLORE_DETAIL_COPY[link.slug] ?? {
      kind: 'catalog' as const,
      eyebrow: 'Importadora Premium',
      title: link.label,
      lead: link.label,
      images: [LANDING_IMAGES.nosotros],
      ctaLabel: 'Volver al inicio',
      ctaHref: '/',
    }
    return { slug: link.slug, ...copy }
  }),
  {
    slug: 'vacantes',
    ...EXPLORE_DETAIL_COPY.vacantes,
  },
]

export const LANDING_DETAIL_PAGES: Record<string, LandingDetailPage> = Object.fromEntries(
  [...CATALOG_DETAILS, ...EXPLORE_DETAILS].map((page) => [page.slug, page]),
)

export function getLandingDetailPath(slug: string) {
  return `/explorar/${slug}`
}

export function resolveLandingDetailPage(slug: string | undefined): LandingDetailPage | null {
  if (!slug) return null
  return LANDING_DETAIL_PAGES[slug] ?? null
}
