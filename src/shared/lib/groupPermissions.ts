import { useMemo } from 'react'
import type { PermissionCatalogEntry } from '@/mocks/data'

const MANAGEMENT_LABELS: Record<string, string> = {
  metrics: 'Gestión de medición',
  orders: 'Gestión pedidos',
  products: 'Gestión productos',
  categories: 'Gestión categorías',
  clients: 'Gestión clientes',
  shipments: 'Gestión envíos',
  users: 'Gestión de usuarios',
  roles: 'Gestión de roles',
  audit: 'Auditoría / Logs',
  settings: 'Configuración general',
  profile: 'Gestión de perfil',
}

const MANAGEMENT_ORDER = [
  'metrics',
  'orders',
  'clients',
  'shipments',
  'products',
  'categories',
  'users',
  'roles',
  'audit',
  'settings',
  'profile',
]

export type PermissionGroup = {
  key: string
  label: string
  permissions: PermissionCatalogEntry[]
}

export function groupPermissionsByManagement(
  catalog: PermissionCatalogEntry[],
): PermissionGroup[] {
  const enabled = catalog.filter((entry) => entry.enabled)
  const byKey = new Map<string, PermissionCatalogEntry[]>()

  enabled.forEach((entry) => {
    const key = entry.management || 'otros'
    const list = byKey.get(key) ?? []
    list.push(entry)
    byKey.set(key, list)
  })

  const orderedKeys = [
    ...MANAGEMENT_ORDER.filter((key) => byKey.has(key)),
    ...Array.from(byKey.keys()).filter((key) => !MANAGEMENT_ORDER.includes(key)),
  ]

  return orderedKeys.map((key) => ({
    key,
    label: MANAGEMENT_LABELS[key] ?? key,
    permissions: byKey.get(key) ?? [],
  }))
}

export function usePermissionGroups(catalog: PermissionCatalogEntry[]) {
  return useMemo(() => groupPermissionsByManagement(catalog), [catalog])
}
