import permissionsCatalog from '@/mocks/permissions_catalog.json'
import permissionsAliases from '@/mocks/permissions_aliases.json'
import permissionsBundles from '@/mocks/permissions_bundles.json'
import rolesData from '@/mocks/roles.json'
import { isPermissionFeatureEnabled } from '@/mocks/data'

export type PermissionCode = string

export type RoleRecord = {
  id: string
  name: string
  description: string
  permissions: PermissionCode[]
}

const ROLE_CACHE_TTL_MS = 60_000

type RoleCacheEntry = {
  permissions: PermissionCode[]
  savedAt: number
}

const rolePermissionsCache = new Map<string, RoleCacheEntry>()

const aliasToCode = new Map(
  (permissionsAliases as Array<{ alias: string; code: string }>).map((entry) => [
    entry.alias.trim().toLowerCase(),
    entry.code,
  ]),
)

// Alias legacy → código canónico desde el catálogo.
;(permissionsCatalog as Array<{ code: string; aliases?: string[] }>).forEach((entry) => {
  aliasToCode.set(entry.code.toLowerCase(), entry.code)
  entry.aliases?.forEach((alias) => {
    aliasToCode.set(alias.trim().toLowerCase(), entry.code)
  })
})

const LEGACY_CODE_MAP: Record<string, string> = {
  'metrics:view': 'metrics:read',
  'audit:view': 'audit:read',
  'settings:manage': 'settings:update',
  'profile:edit': 'profile:update',
  'users:manage': 'users:update',
  'users:invite': 'users:create',
  'roles:manage': 'roles:update',
}

Object.entries(LEGACY_CODE_MAP).forEach(([legacy, modern]) => {
  aliasToCode.set(legacy.toLowerCase(), modern)
})

const bundleById = new Map(
  (permissionsBundles as Array<{ id: string; permissions: string[] }>).map((entry) => [
    entry.id,
    entry.permissions,
  ]),
)

export function clearRolesCache() {
  rolePermissionsCache.clear()
}

export function normalizePermissionCode(value: string): string {
  const raw = String(value ?? '').trim()
  if (!raw) {
    return ''
  }
  const fromAlias = aliasToCode.get(raw.toLowerCase())
  return fromAlias || raw
}

export function getRolePermissions(roleId: string, roles: RoleRecord[] = rolesData as RoleRecord[]): PermissionCode[] {
  const cached = rolePermissionsCache.get(roleId)
  if (cached && Date.now() - cached.savedAt < ROLE_CACHE_TTL_MS) {
    return cached.permissions
  }

  const role = roles.find((entry) => entry.id === roleId)
  const permissions = (role?.permissions ?? []).map(normalizePermissionCode).filter(Boolean)
  rolePermissionsCache.set(roleId, { permissions, savedAt: Date.now() })
  return permissions
}

export function derivePermissionsFromRoles(
  roleIds: string[],
  roles: RoleRecord[] = rolesData as RoleRecord[],
): PermissionCode[] {
  const set = new Set<PermissionCode>()
  roleIds.forEach((roleId) => {
    getRolePermissions(roleId, roles).forEach((code) => set.add(code))
  })
  return Array.from(set)
}

export function isAdminRole(roleIds: string[], roles: RoleRecord[] = rolesData as RoleRecord[]): boolean {
  return roleIds.some((roleId) => {
    const role = roles.find((entry) => entry.id === roleId)
    return role?.name?.toUpperCase() === 'ADMIN' || roleId === 'role_admin'
  })
}

/**
 * Evalúa si el usuario tiene el permiso requerido.
 * ADMIN bypass total salvo funcionalidades deshabilitadas en catálogo.
 */
export function hasPermission(
  userPermissions: PermissionCode[],
  required: string | string[],
  options: { roleIds?: string[]; roles?: RoleRecord[]; onDenied?: (required: string[]) => void } = {},
): boolean {
  const requiredList = (Array.isArray(required) ? required : [required])
    .map(normalizePermissionCode)
    .filter(Boolean)

  if (requiredList.length === 0) {
    return true
  }

  const featureEnabled = requiredList.every((code) => isPermissionFeatureEnabled(code))
  if (!featureEnabled) {
    options.onDenied?.(requiredList)
    return false
  }

  if (options.roleIds && isAdminRole(options.roleIds, options.roles)) {
    return true
  }

  const owned = new Set(userPermissions.map(normalizePermissionCode))

  const granted = requiredList.every((code) => {
    if (owned.has(code)) {
      return true
    }
    const [module] = code.split(':')
    const bundle = bundleById.get(module)
    if (bundle && bundle.every((item) => owned.has(item))) {
      return true
    }
    return false
  })

  if (!granted) {
    options.onDenied?.(requiredList)
  }

  return granted
}

export function catalogHasCode(code: string): boolean {
  return (permissionsCatalog as Array<{ code: string }>).some((entry) => entry.code === code)
}

export function listCatalog() {
  return permissionsCatalog as Array<{
    code: string
    label: string
    management: string
    action: string
    description: string
  }>
}
