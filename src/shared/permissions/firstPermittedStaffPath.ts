import {
  hasPermission,
  isAdminRole,
  type RoleRecord,
} from '@/shared/permissions/permissionEvaluator'
import { staffRouteKeysInPriorityOrder } from '@/shared/permissions/moduleCatalog'
import { resolveRoutePermissions } from '@/shared/permissions/routePermissions'
import { toPathFromRouteKey } from '@/shared/routing/routeKey'

/**
 * Primera ruta staff permitida (staffHome). Orden = STAFF_MODULE_CATALOG.
 */
export function firstPermittedStaffPath(
  permissions: string[],
  roleIds: string[],
  roles?: RoleRecord[],
): string {
  if (isAdminRole(roleIds, roles)) {
    const first = staffRouteKeysInPriorityOrder()[0]
    return first ? toPathFromRouteKey(first) : '/403'
  }

  for (const routeKey of staffRouteKeysInPriorityOrder()) {
    const required = resolveRoutePermissions(routeKey)
    if (hasPermission(permissions, required, { roleIds, roles })) {
      return toPathFromRouteKey(routeKey)
    }
  }

  return '/403'
}
