import marcasLogosData from '@/data/landing/marcasLogos.json'
import landingContentJson from '@/mocks/landingContent.json'

const LEGACY_STORAGE_KEY = 'landing-page-content'

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

function brandItemsFromMock(): LandingBrandItem[] {
  return Object.entries(marcasLogosData.marcas).map(([name, url], index) => ({
    id: `marca-${index + 1}`,
    name,
    url,
    visible: true,
  }))
}

function contentFromMocks(): LandingContent {
  const catalogOptions = landingContentJson.catalog.options.map((option) => ({
    id: option.id,
    label: option.label,
    images: [option.images[0], option.images[1]] as [string, string],
  }))
  return {
    hero: {
      backgrounds: [...landingContentJson.hero.backgrounds],
      title: landingContentJson.hero.title,
      subtitle: landingContentJson.hero.subtitle,
      cta: landingContentJson.hero.cta,
    },
    stats: landingContentJson.stats.map((item) => ({ ...item })),
    split: {
      vision: { ...landingContentJson.split.vision },
      mission: { ...landingContentJson.split.mission },
    },
    catalog: {
      title: landingContentJson.catalog.title,
      cta: landingContentJson.catalog.cta,
      options: catalogOptions,
    },
    brands: {
      title: landingContentJson.brands.title,
      lead: landingContentJson.brands.lead,
      background: landingContentJson.brands.background,
      items: brandItemsFromMock(),
    },
    company: { ...landingContentJson.company },
  }
}

/** Copia de trabajo en RAM (igual que `src/mocks/data.ts`). No se escribe en localStorage. */
let workingCopy = contentFromMocks()

function discardLegacyBrowserCopy() {
  try {
    window.localStorage?.removeItem(LEGACY_STORAGE_KEY)
  } catch {
    /* ignore */
  }
}

discardLegacyBrowserCopy()

export function resetLandingWorkingCopy() {
  discardLegacyBrowserCopy()
  workingCopy = contentFromMocks()
  return getLandingContent()
}

export function defaultLandingContent(): LandingContent {
  return contentFromMocks()
}

export function getLandingContent(): LandingContent {
  discardLegacyBrowserCopy()
  return clone(workingCopy)
}

export function saveLandingContent(next: LandingContent) {
  workingCopy = clone(next)
  return getLandingContent()
}

export function saveLandingSection<K extends LandingSectionId>(id: K, data: LandingContent[K]) {
  workingCopy = { ...clone(workingCopy), [id]: clone(data) }
  return getLandingContent()
}

export function resetLandingSection(id: LandingSectionId) {
  const defaults = contentFromMocks()
  workingCopy = { ...clone(workingCopy), [id]: clone(defaults[id]) }
  return getLandingContent()
}

export function visibleBrands(content = getLandingContent()) {
  return content.brands.items.filter((item) => item.visible && item.url)
}

export function catalogMultiIndices(options: readonly LandingCatalogOption[]) {
  return options.map((option, index) => (option.images.length > 1 ? index : -1)).filter((index) => index >= 0)
}
