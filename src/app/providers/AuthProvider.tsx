import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  appendAuditLog,
  mockRoles,
  mockUsers,
  type AdminUser,
} from '@/mocks/data'
import {
  clearRolesCache,
  derivePermissionsFromRoles,
  hasPermission as evaluatePermission,
  isAdminRole,
} from '@/shared/permissions/permissionEvaluator'
import { resolveRoutePermissions } from '@/shared/permissions/routePermissions'
import { firstPermittedStaffPath } from '@/shared/permissions/firstPermittedStaffPath'
import { isStorefrontClient } from '@/shared/permissions/isStorefrontClient'
import { toRouteKey } from '@/shared/routing/routeKey'

export type LoginAudience = 'client' | 'staff'

type AuthSession = {
  user: AdminUser
  permissions: string[]
}

type AuthContextValue = {
  user: AdminUser | null
  permissions: string[]
  isAuthenticated: boolean
  staffHome: string
  login: (
    email: string,
    password: string,
    audience?: LoginAudience,
  ) => { ok: boolean; error?: string; home?: string }
  logout: () => void
  /**
   * Acepta:
   * - routeKey (`operacion/pedidos`) → resuelve vía routePermissions
   * - código CRUD (`orders:create`) → evaluación directa
   */
  hasPermission: (required: string | string[]) => boolean
  clearPermissionCache: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

const STORAGE_KEY = 'adminip.session'

function readStoredSession(): AuthSession | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return null
    }
    return JSON.parse(raw) as AuthSession
  } catch {
    return null
  }
}

function expandRequired(required: string | string[]): string[] {
  const list = Array.isArray(required) ? required : [required]
  const expanded = list.flatMap((item) => {
    const key = toRouteKey(item)
    const mapped = resolveRoutePermissions(key)
    return mapped.length > 0 ? mapped : [key]
  })
  return Array.from(new Set(expanded.filter(Boolean)))
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(() => readStoredSession())

  const persist = useCallback((next: AuthSession | null) => {
    setSession(next)
    if (!next) {
      sessionStorage.removeItem(STORAGE_KEY)
      return
    }
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }, [])

  const login = useCallback((email: string, password: string, audience: LoginAudience = 'staff') => {
    const normalized = email.trim().toLowerCase()
    const found = mockUsers.find(
      (entry) => entry.email.toLowerCase() === normalized && entry.password === password,
    )

    if (!found) {
      return { ok: false, error: 'Credenciales inválidas' }
    }

    if (found.status !== 'activo') {
      return { ok: false, error: 'Usuario deshabilitado' }
    }

    const isClient = isStorefrontClient(found.roles, mockRoles)
    if (audience === 'client' && !isClient) {
      return { ok: false, error: 'Use el acceso administrativos premium' }
    }
    if (audience === 'staff' && isClient) {
      return { ok: false, error: 'Use el acceso clientes premium' }
    }

    const permissions = derivePermissionsFromRoles(found.roles, mockRoles)
    const next: AuthSession = { user: found, permissions }
    persist(next)

    appendAuditLog({
      action: 'auth.login',
      entity: 'user',
      entityId: found.id,
      actorId: found.id,
      actorRole: mockRoles.find((role) => role.id === found.roles[0])?.name ?? 'UNKNOWN',
      details: `Login mock (${audience}) de ${found.email}`,
      kind: 'auth',
    })

    const home = isClient
      ? '/'
      : firstPermittedStaffPath(permissions, found.roles, mockRoles)
    return { ok: true, home }
  }, [persist])

  const logout = useCallback(() => {
    if (session?.user) {
      appendAuditLog({
        action: 'auth.logout',
        entity: 'user',
        entityId: session.user.id,
        actorId: session.user.id,
        actorRole: mockRoles.find((role) => role.id === session.user.roles[0])?.name ?? 'UNKNOWN',
        details: 'Logout mock',
        kind: 'auth',
      })
    }
    persist(null)
  }, [persist, session])

  const hasPermission = useCallback((required: string | string[]) => {
    if (!session) {
      return false
    }

    const codes = expandRequired(required)
    return evaluatePermission(session.permissions, codes, {
      roleIds: session.user.roles,
      roles: mockRoles,
    })
  }, [session])

  const staffHome = useMemo(() => {
    if (!session) {
      return '/login'
    }
    if (isStorefrontClient(session.user.roles, mockRoles)) {
      return '/'
    }
    return firstPermittedStaffPath(session.permissions, session.user.roles, mockRoles)
  }, [session])

  const value = useMemo<AuthContextValue>(() => ({
    user: session?.user ?? null,
    permissions: session?.permissions ?? [],
    isAuthenticated: Boolean(session?.user),
    staffHome,
    login,
    logout,
    hasPermission,
    clearPermissionCache: clearRolesCache,
  }), [session, staffHome, login, logout, hasPermission])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth debe usarse dentro de AuthProvider')
  }
  return ctx
}

export function usePermissions() {
  const { hasPermission, permissions, user } = useAuth()
  return {
    hasPermission,
    permissions,
    isAdmin: user ? isAdminRole(user.roles, mockRoles) : false,
  }
}
