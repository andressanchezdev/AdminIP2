import { STAFF_MODULE_CATALOG } from '@/shared/permissions/moduleCatalog'
import { toRouteKey } from '@/shared/routing/routeKey'

/**
 * Mapeo routeKey → permiso(s) canónicos module:action.
 * Permite que hasPermission('operacion/pedidos') reutilice orders:read.
 */
const ROUTE_PERMISSION_MAP: Record<string, string | string[]> = Object.fromEntries(
  STAFF_MODULE_CATALOG.flatMap((module) =>
    module.routes.map((route) => [route.routeKey, route.permission] as const),
  ),
)

/**
 * Sitio público (sin login): landing + extensión blog.
 * - `/` y `/explorar/*` → landing estática
 * - `/blog` y `/blog/:slug` → blog público
 * - `/login` → acceso al panel (no es contenido de marketing)
 *
 * La gestión del blog (`/dashboard/blog`) NO es pública: requiere `blog:read` (+ CRUD).
 */
export const PUBLIC_ROUTE_KEYS = new Set([
  '',
  'login',
  '403',
  'blog',
  'explorar',
])

/** Pathnames del sitio público (landing + blog). */
export function isPublicPath(pathname: string): boolean {
  const normalized = String(pathname ?? '').replace(/\/$/, '') || '/'
  if (normalized === '/' || normalized === '/login') return true
  if (normalized === '/blog' || normalized.startsWith('/blog/')) return true
  if (normalized.startsWith('/explorar/')) return true
  return false
}

export function resolveRoutePermissions(routeKeyOrCode: string): string[] {
  const key = toRouteKey(routeKeyOrCode)
  if (!key || PUBLIC_ROUTE_KEYS.has(key)) {
    return []
  }

  // `/blog/:slug` y `/explorar/:slug` → prefijo público
  const root = key.split('/')[0] ?? ''
  if (PUBLIC_ROUTE_KEYS.has(root) && (root === 'blog' || root === 'explorar')) {
    return []
  }

  const mapped = ROUTE_PERMISSION_MAP[key]
  if (mapped == null) {
    // No es un routeKey conocido: tratar como código de permiso directo (CRUD).
    return [key]
  }

  return Array.isArray(mapped) ? mapped : [mapped]
}

export function isKnownRouteKey(routeKey: string): boolean {
  return Object.prototype.hasOwnProperty.call(ROUTE_PERMISSION_MAP, toRouteKey(routeKey))
}

export function listRoutePermissionEntries() {
  return Object.entries(ROUTE_PERMISSION_MAP).map(([routeKey, permission]) => ({
    routeKey,
    permissions: Array.isArray(permission) ? permission : [permission],
  }))
}
