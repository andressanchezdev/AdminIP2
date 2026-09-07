/** Títulos de header por path absoluto — sincronizar con Routes y menuConfig. */
export const pageTitles: Record<string, string> = {
  '/dashboard/medicion': 'Gestión de medición',
  '/contenido/blog': 'Gestión Blog',
  '/contenido/vacantes': 'Gestión Vacantes',
  '/contenido/landing': 'Gestión Landing',
  '/acceso/usuarios': 'Gestión de usuarios',
  '/acceso/roles': 'Gestión de roles',
  '/acceso/auditoria': 'Auditoría / Logs',
  '/operacion/pedidos': 'Gestión pedidos',
  '/operacion/clientes': 'Gestión clientes',
  '/operacion/envios': 'Gestión envíos',
  '/operacion/productos': 'Gestión productos',
  '/operacion/categorias': 'Gestión categorías',
  '/configuracion/ajustes': 'Configuración general',
  '/configuracion/perfil': 'Gestión de perfil',
  '/403': 'Acceso denegado',
}

export function getPageTitle(pathname: string): string {
  return pageTitles[pathname] ?? 'AdminIP'
}
