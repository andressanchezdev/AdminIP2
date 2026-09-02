import { useEffect, useRef } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/app/providers/AuthProvider'
import { appendAuditLog, mockRoles } from '@/mocks/data'
import { resolveRoutePermissions } from '@/shared/permissions/routePermissions'
import { isStorefrontClient } from '@/shared/permissions/isStorefrontClient'
import { toRouteKey } from '@/shared/routing/routeKey'

type ProtectedRouteProps = {
  children: React.ReactNode
  /** Si se omite, se usa routeKey = pathname sin `/` inicial. */
  routeKey?: string
  rolesAllowed?: string[]
}

export function ProtectedRoute({
  children,
  routeKey: routeKeyProp,
  rolesAllowed = [],
}: ProtectedRouteProps) {
  const { isAuthenticated, user, hasPermission, permissions } = useAuth()
  const location = useLocation()
  const loggedRef = useRef('')

  const routeKey = routeKeyProp ?? toRouteKey(location.pathname)
  const requiredPermissions = resolveRoutePermissions(routeKey)
  const storefrontClient = isStorefrontClient(user?.roles ?? [], mockRoles)

  const roleOk = rolesAllowed.length === 0
    || Boolean(user?.roles.some((roleId) => rolesAllowed.includes(roleId)))

  const permissionOk = requiredPermissions.length === 0
    || hasPermission(routeKey)

  const allowed = isAuthenticated && !storefrontClient && roleOk && permissionOk

  useEffect(() => {
    if (allowed || !isAuthenticated || !user || storefrontClient) {
      return
    }
    const key = `${location.pathname}:${routeKey}`
    if (loggedRef.current === key) {
      return
    }
    loggedRef.current = key
    appendAuditLog({
      action: 'access.denied',
      entity: 'route',
      entityId: location.pathname,
      actorId: user.id,
      actorRole: mockRoles.find((role) => role.id === user.roles[0])?.name ?? 'UNKNOWN',
      details: `Ruta bloqueada ${location.pathname} (routeKey=${routeKey})`,
      kind: 'denial',
      route: location.pathname,
      requiredPermissions,
      userPermissions: permissions,
    })
  }, [allowed, isAuthenticated, user, storefrontClient, location.pathname, routeKey, requiredPermissions, permissions])

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (storefrontClient) {
    return <Navigate to="/" replace />
  }

  if (!allowed) {
    return <Navigate to="/403" replace />
  }

  return children
}
