/**
 * Catálogo de módulos staff.
 * Orden = sidemenu + prioridad de redirección post-login.
 * `permission` = permiso de lectura que controla visibilidad de menú/ruta.
 */
export type StaffModuleEntry = {
  module: string
  label: string
  routes: Array<{
    routeKey: string
    label: string
    permission: string
  }>
}

export const STAFF_MODULE_CATALOG: StaffModuleEntry[] = [
  {
    module: 'dashboard',
    label: 'Dashboard',
    routes: [
      { routeKey: 'dashboard/medicion', label: 'Gestión de medición', permission: 'metrics:read' },
    ],
  },
  {
    module: 'contenido',
    label: 'Contenido',
    routes: [
      { routeKey: 'contenido/blog', label: 'Gestión Blog', permission: 'blog:read' },
      { routeKey: 'contenido/vacantes', label: 'Gestión Vacantes', permission: 'vacancies:read' },
      { routeKey: 'contenido/landing', label: 'Gestión Landing', permission: 'landing:read' },
      { routeKey: 'contenido/bot', label: 'Gestión botIP', permission: 'landing:read' },
    ],
  },
  {
    module: 'operacion',
    label: 'Ventas',
    routes: [
      { routeKey: 'operacion/productos', label: 'Gestión productos', permission: 'products:read' },
      { routeKey: 'operacion/categorias', label: 'Gestión categorías', permission: 'categories:read' },
      { routeKey: 'operacion/clientes', label: 'Gestión clientes', permission: 'clients:read' },
      { routeKey: 'operacion/pedidos', label: 'Gestión pedidos', permission: 'orders:read' },
      { routeKey: 'operacion/envios', label: 'Gestión envíos', permission: 'shipments:read' },
    ],
  },
  {
    module: 'acceso',
    label: 'Usuarios / Permisos',
    routes: [
      { routeKey: 'acceso/usuarios', label: 'Gestión de usuarios', permission: 'users:read' },
      { routeKey: 'acceso/roles', label: 'Gestión de roles', permission: 'roles:read' },
      { routeKey: 'acceso/auditoria', label: 'Auditoría / Logs', permission: 'audit:read' },
    ],
  },
  {
    module: 'configuracion',
    label: 'Configuración',
    routes: [
      { routeKey: 'configuracion/perfil', label: 'Gestión de perfil', permission: 'profile:update' },
    ],
  },
]

export function staffRouteKeysInPriorityOrder(): string[] {
  return STAFF_MODULE_CATALOG.flatMap((entry) => entry.routes.map((route) => route.routeKey))
}
