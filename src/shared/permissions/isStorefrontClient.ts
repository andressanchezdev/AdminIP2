import { isAdminRole, type RoleRecord } from '@/shared/permissions/permissionEvaluator'

/** Usuario de dominio cliente (landing), no panel admin. */
export function isStorefrontClient(roleIds: string[], roles?: RoleRecord[]) {
  if (!roleIds.length) return false
  if (isAdminRole(roleIds, roles)) return false
  return roleIds.every((id) => id === 'role_cliente')
}
