import {
  getPublishedLandingTeam,
  mockProducts,
  type LandingTeamGroup,
  type LandingTeamMember,
  type ProductRecord,
} from '@/mocks/data'
import { CATALOG_PRODUCTS } from '../../catalogProducts'
import { CATALOG_OPTIONS } from '../../content'
import { getActiveDocument } from './store'

export type LiveCatalogItem = {
  id: string
  label: string
  description: string
}

export function liveStringList(value: unknown, fallback: readonly string[], lowercase = true): readonly string[] {
  if (!Array.isArray(value) || !value.length) return fallback
  const next = value
    .map((item) => {
      const text = String(item).trim()
      return lowercase ? text.toLowerCase() : text
    })
    .filter(Boolean)
  return next.length ? next : fallback
}

export function liveLowerList(value: unknown, fallback: readonly string[]): readonly string[] {
  return liveStringList(value, fallback, true)
}

export function liveLexiconList(key: string, fallback: readonly string[], lowercase = true): readonly string[] {
  try {
    return liveStringList(getActiveDocument().lexicon?.[key], fallback, lowercase)
  } catch {
    return fallback
  }
}

export function liveLexiconMap(key: string, fallback: Record<string, string>): Record<string, string> {
  try {
    const raw = getActiveDocument().lexicon?.[key]
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return fallback
    const next = Object.entries(raw as Record<string, unknown>)
      .map(([from, to]) => [from.trim().toLowerCase(), String(to).trim().toLowerCase()] as const)
      .filter(([from, to]) => from && to)
    return next.length ? Object.fromEntries(next) : fallback
  } catch {
    return fallback
  }
}

export function liveLexiconSet(key: string, fallback: ReadonlySet<string>, lowercase = true): ReadonlySet<string> {
  return new Set(liveLexiconList(key, [...fallback], lowercase))
}

export function liveLexiconRecord(key: string, fallback: Record<string, readonly string[]>): Record<string, readonly string[]> {
  try {
    const raw = getActiveDocument().lexicon?.[key]
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return fallback
    const next: Record<string, string[]> = {}
    for (const [group, list] of Object.entries(raw as Record<string, unknown>)) {
      if (!Array.isArray(list)) continue
      const values = list.map((item) => String(item).trim().toLowerCase()).filter(Boolean)
      if (values.length) next[group] = values
    }
    return Object.keys(next).length ? next : fallback
  } catch {
    return fallback
  }
}

function catalog() {
  try {
    return getActiveDocument().catalog ?? {}
  } catch {
    return {}
  }
}

function toProduct(row: Record<string, unknown>): ProductRecord {
  const nested = Array.isArray(row.precios) ? (row.precios[0] as { empresarial?: number } | undefined) : undefined
  const precio = Number(row.precioEmpresarial ?? nested?.empresarial ?? 0)
  return {
    id: String(row.id ?? ''),
    codigo: String(row.codigo ?? ''),
    nombre: String(row.nombre ?? ''),
    descripcion: String(row.descripcion ?? ''),
    modelo: String(row.modelo ?? ''),
    precios: [{ mayorista: 0, minorista: 0, empresarial: precio }],
    cantidad: Number(row.cantidad ?? 0),
    bodega: String(row.bodega ?? ''),
    status: String(row.status ?? 'activo'),
    creado_en: String(row.creado_en ?? ''),
    actualizado_en: String(row.actualizado_en ?? ''),
  }
}

export function liveInventory(): ProductRecord[] {
  const raw = catalog().inventory
  if (!Array.isArray(raw) || !raw.length) return mockProducts
  const rows = raw
    .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object'))
    .map(toProduct)
    .filter((item) => item.nombre)
  if (!rows.length) return mockProducts
  const complete = rows.some((item) => item.codigo || (item.precios[0]?.empresarial ?? 0) > 0 || item.descripcion)
  return complete ? rows : mockProducts
}

export function liveCatalogProducts(): LiveCatalogItem[] {
  const fallback = CATALOG_PRODUCTS.map((item) => ({
    id: item.id,
    label: item.label,
    description: item.description,
  }))
  const raw = catalog().catalogProducts
  if (!Array.isArray(raw) || !raw.length) return fallback
  const rows = raw
    .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object'))
    .map((item) => ({
      id: String(item.id ?? ''),
      label: String(item.label ?? ''),
      description: String(item.description ?? ''),
    }))
    .filter((item) => item.id && item.label)
  return rows.length ? rows : fallback
}

export function liveCatalogLines(): LiveCatalogItem[] {
  const fallback = CATALOG_OPTIONS.map((item) => ({
    id: item.id,
    label: item.label,
    description: '',
  }))
  const raw = catalog().catalogLines
  if (!Array.isArray(raw) || !raw.length) return fallback
  const rows = raw
    .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object'))
    .map((item) => ({
      id: String(item.id ?? ''),
      label: String(item.label ?? ''),
      description: String(item.description ?? ''),
    }))
    .filter((item) => item.label)
  return rows.length ? rows : fallback
}

export function liveCatalogLabels() {
  const lines = liveCatalogLines().map((item) => item.label).filter(Boolean)
  if (lines.length) return lines.join(', ')
  const products = liveCatalogProducts().map((item) => item.label).filter(Boolean)
  return products.join(', ') || 'el catálogo publicado'
}

function toMember(row: Record<string, unknown>): LandingTeamMember {
  const group = row.group === 'administrativo' ? 'administrativo' : 'asesor'
  const status = row.status === 'borrador' || row.status === 'archivado' ? row.status : 'publicado'
  return {
    id: String(row.id ?? ''),
    fullName: String(row.fullName ?? row.name ?? ''),
    role: String(row.role ?? ''),
    phoneDisplay: String(row.phoneDisplay ?? ''),
    whatsappDigits: String(row.whatsappDigits ?? ''),
    imageUrl: '',
    group,
    status,
    sortOrder: Number(row.sortOrder ?? 0),
    createdAt: '',
    updatedAt: '',
  }
}

function factoryTeam() {
  return [...getPublishedLandingTeam('asesor'), ...getPublishedLandingTeam('administrativo')]
}

export function liveTeam(): LandingTeamMember[] {
  const raw = catalog().team
  if (!Array.isArray(raw) || !raw.length) return factoryTeam()
  const rows = raw
    .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object'))
    .map(toMember)
    .filter((item) => item.fullName)
  if (!rows.length) return factoryTeam()
  const complete = rows.some((item) => item.phoneDisplay || item.whatsappDigits || item.id)
  return complete ? rows : factoryTeam()
}

export function livePublishedTeam(group: LandingTeamGroup) {
  return liveTeam().filter((item) => item.group === group && item.status === 'publicado')
}

export type LiveShipping = {
  nationwide: boolean
  freeMetroFrom: string
  sameDay: boolean
  doorSafe: boolean
  cityScope: string
}

export const DEFAULT_SHIPPING: LiveShipping = {
  nationwide: true,
  freeMetroFrom: '250.000',
  sameDay: true,
  doorSafe: true,
  cityScope: 'área metropolitana',
}

export function resolveShipping(raw: unknown): LiveShipping {
  const base = { ...DEFAULT_SHIPPING }
  if (!raw || typeof raw !== 'object') return base
  const src = raw as Partial<LiveShipping>
  return {
    nationwide: typeof src.nationwide === 'boolean' ? src.nationwide : base.nationwide,
    freeMetroFrom: String(src.freeMetroFrom ?? base.freeMetroFrom).trim() || base.freeMetroFrom,
    sameDay: typeof src.sameDay === 'boolean' ? src.sameDay : base.sameDay,
    doorSafe: typeof src.doorSafe === 'boolean' ? src.doorSafe : base.doorSafe,
    cityScope: String(src.cityScope ?? base.cityScope).trim() || base.cityScope,
  }
}

export function liveShipping(): LiveShipping {
  try {
    return resolveShipping(catalog().shipping)
  } catch {
    return { ...DEFAULT_SHIPPING }
  }
}

export function liveBrandNames(): string[] {
  const raw = catalog().brands
  if (Array.isArray(raw) && raw.length) {
    const names = raw
      .map((item) => (typeof item === 'string' ? item : String((item as { name?: string })?.name ?? '')))
      .map((item) => item.trim())
      .filter(Boolean)
    if (names.length) return names
  }
  return []
}
