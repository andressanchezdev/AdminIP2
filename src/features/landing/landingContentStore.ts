import marcasLogosData from '@/data/landing/marcasLogos.json'
import { CATALOG_OPTIONS, STATS_SLIDES } from './content'
import { LANDING_IMAGES } from './media'

const STORAGE_KEY = 'landing-page-content'

export type LandingSectionId = 'hero' | 'stats' | 'split' | 'catalog' | 'brands' | 'company'

export type LandingStatSlide = {
  id: string
  lead: string
  value: number
  trail: string
  duration: number
  blurStrength: number
  maxBlur: number
}

export type LandingSplitBlock = {
  image: string
  alt: string
  eyebrow: string
  title: string
  text: string
}

export type LandingCatalogOption = {
  id: string
  label: string
  images: [string, string]
}

export type LandingBrandItem = {
  id: string
  name: string
  url: string
  visible: boolean
}

export type LandingContent = {
  hero: {
    backgrounds: string[]
    title: string
    subtitle: string
    cta: string
  }
  stats: LandingStatSlide[]
  split: {
    vision: LandingSplitBlock
    mission: LandingSplitBlock
  }
  catalog: {
    title: string
    cta: string
    options: LandingCatalogOption[]
  }
  brands: {
    title: string
    lead: string
    background: string
    items: LandingBrandItem[]
  }
  company: {
    image: string
    alt: string
    eyebrow: string
    title: string
    text: string
    cta: string
  }
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

export function defaultLandingContent(): LandingContent {
  return {
    hero: {
      backgrounds: [...LANDING_IMAGES.heroBg],
      title: 'Importadora Premium',
      subtitle: 'Importación, inventario y distribución con estándar premium para todo el país.',
      cta: 'Conocer más',
    },
    stats: STATS_SLIDES.map((item) => ({ ...item })),
    split: {
      vision: {
        image: LANDING_IMAGES.nosotros,
        alt: 'Equipo y operación de Importadora Premium',
        eyebrow: 'Empresa',
        title: 'Visión',
        text: 'Ser el referente nacional en importación premium: bodega confiable, surtido amplio y un servicio ágil para cada cliente del país.',
      },
      mission: {
        image: LANDING_IMAGES.mission,
        alt: 'Local y servicio Importadora Premium',
        eyebrow: 'Empresa',
        title: 'Misión',
        text: 'Conectar demanda y suministro con procesos claros, inventario real y acompañamiento cercano en cada pedido bajo la marca IP.',
      },
    },
    catalog: {
      title: 'Catálogo Premium',
      cta: 'Catálogo completo',
      options: CATALOG_OPTIONS.map((option) => ({
        id: option.id,
        label: option.label,
        images: [option.images[0], option.images[1]] as [string, string],
      })),
    },
    brands: {
      title: 'Marcas que respaldan nuestra calidad',
      lead: 'Las marcas más reconocidas en el mercado para tu moto.',
      background: LANDING_IMAGES.brandsBg,
      items: Object.entries(marcasLogosData.marcas).map(([name, url], index) => ({
        id: `marca-${index + 1}`,
        name,
        url,
        visible: true,
      })),
    },
    company: {
      image: LANDING_IMAGES.vision,
      alt: 'Operación de Importadora Premium',
      eyebrow: 'La compañía',
      title: 'Nosotros como empresa',
      text: 'Importadora Premium conecta marcas globales con el mercado local. Centralizamos compra, bodega y distribución para que tu negocio reciba productos verificados, trazabilidad y un servicio comercial cercano.',
      cta: 'Catálogo completo',
    },
  }
}

function asString(value: unknown, fallback: string) {
  return typeof value === 'string' ? value : fallback
}

function mergeContent(saved: Partial<LandingContent> | null): LandingContent {
  const base = defaultLandingContent()
  if (!saved) return base

  const heroBgs = Array.isArray(saved.hero?.backgrounds)
    ? saved.hero.backgrounds.filter((item) => typeof item === 'string' && item.trim())
    : []

  const stats = base.stats.map((item) => {
    const next = saved.stats?.find((slide) => slide?.id === item.id)
    if (!next) return item
    const value = Number(next.value)
    return {
      ...item,
      lead: asString(next.lead, item.lead),
      value: Number.isFinite(value) ? value : item.value,
      trail: asString(next.trail, item.trail),
    }
  })

  const options = base.catalog.options.map((option) => {
    const next = saved.catalog?.options?.find((item) => item?.id === option.id)
    if (!next) return option
    const images = Array.isArray(next.images) ? next.images.filter((item) => typeof item === 'string') : []
    return {
      id: option.id,
      label: asString(next.label, option.label) || option.label,
      images: [images[0] || option.images[0], images[1] || option.images[1]] as [string, string],
    }
  })

  const brandItems = Array.isArray(saved.brands?.items)
    ? saved.brands.items
        .filter((item) => item && typeof item.name === 'string' && typeof item.url === 'string')
        .map((item, index) => ({
          id: asString(item.id, `marca-${index + 1}`),
          name: item.name.trim(),
          url: item.url,
          visible: item.visible !== false,
        }))
        .filter((item) => item.name)
    : base.brands.items

  return {
    hero: {
      backgrounds: heroBgs.length ? heroBgs : base.hero.backgrounds,
      title: asString(saved.hero?.title, base.hero.title),
      subtitle: asString(saved.hero?.subtitle, base.hero.subtitle),
      cta: asString(saved.hero?.cta, base.hero.cta),
    },
    stats,
    split: {
      vision: { ...base.split.vision, ...saved.split?.vision },
      mission: { ...base.split.mission, ...saved.split?.mission },
    },
    catalog: {
      title: asString(saved.catalog?.title, base.catalog.title),
      cta: asString(saved.catalog?.cta, base.catalog.cta),
      options,
    },
    brands: {
      title: asString(saved.brands?.title, base.brands.title),
      lead: asString(saved.brands?.lead, base.brands.lead),
      background: asString(saved.brands?.background, base.brands.background),
      items: brandItems.length ? brandItems : base.brands.items,
    },
    company: { ...base.company, ...saved.company },
  }
}

export function getLandingContent(): LandingContent {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultLandingContent()
    return mergeContent(JSON.parse(raw) as Partial<LandingContent>)
  } catch {
    return defaultLandingContent()
  }
}

export function saveLandingContent(next: LandingContent) {
  const current = getLandingContent()
  const merged = mergeContent({ ...current, ...next })
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(merged))
  return merged
}

export function saveLandingSection<K extends LandingSectionId>(id: K, data: LandingContent[K]) {
  const current = getLandingContent()
  return saveLandingContent({ ...current, [id]: data })
}

export function resetLandingSection(id: LandingSectionId) {
  const current = getLandingContent()
  const defaults = defaultLandingContent()
  return saveLandingContent({ ...current, [id]: clone(defaults[id]) })
}

export function visibleBrands(content = getLandingContent()) {
  return content.brands.items.filter((item) => item.visible && item.url)
}

export function catalogMultiIndices(options: readonly LandingCatalogOption[]) {
  return options.map((option, index) => (option.images.length > 1 ? index : -1)).filter((index) => index >= 0)
}
