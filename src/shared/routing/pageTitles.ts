/** Títulos de header por path absoluto — sincronizar con Routes y menuConfig. */
export const pageTitles: Record<string, string> = {
  '/dashboard/medicion': 'Gestión de medición',
  '/contenido/blog': 'Gestión Blog',
  '/contenido/vacantes': 'Gestión Vacantes',
  '/contenido/landing': 'Gestión Landing',
  '/contenido/bot': 'Gestión botIP',
  '/acceso/usuarios': 'Gestión de usuarios',
  '/acceso/roles': 'Gestión de roles',
  '/acceso/auditoria': 'Auditoría / Logs',
  '/operacion/pedidos': 'Gestión pedidos',
  '/operacion/clientes': 'Gestión clientes',
  '/operacion/envios': 'Gestión envíos',
  '/operacion/productos': 'Gestión productos',
  '/operacion/categorias': 'Gestión categorías',
  '/configuracion/perfil': 'Gestión de perfil',
  '/403': 'Acceso denegado',
}

const LANDING_SECTION_TITLES: Record<string, string> = {
  hero: 'Hero',
  cifras: 'Cifras',
  vision: 'Visión',
  mision: 'Misión',
  catalogo: 'Catálogo',
  marcas: 'Marcas',
  equipo: 'Equipo',
  compania: 'Compañía',
  compañia: 'Compañía',
}

const BOT_SECTION_TITLES: Record<string, string> = {
  limites: 'Límites del chat',
  catalogo: 'Catálogo y productos',
  atencion: 'Atención y contacto',
  equipo: 'Equipo',
  'sin-coincidencia': 'Sin coincidencia',
  conversacion: 'Saludo y temas no admitidos',
  otras: 'Otras respuestas',
}

const BOT_SECTION_HINTS: Record<string, string> = {
  limites: 'Bienvenida, largo del mensaje y bloqueo por ráfaga.',
  catalogo: 'Respuestas cuando el visitante pide pieza, marca o catálogo.',
  atencion: 'Asesor, WhatsApp, precio, vacantes y datos de la empresa.',
  equipo: 'Nombres, grupos y sugerencias del carrusel.',
  'sin-coincidencia': 'Cuando falta la pieza, la marca o el modelo.',
  conversacion: 'Saludo, cierre y mensajes que no son una consulta.',
  otras: 'Respuestas que no están en un grupo.',
}

export function getPageTitle(pathname: string): string {
  if (pageTitles[pathname]) return pageTitles[pathname]
  const botSection = pathname.match(/^\/contenido\/bot\/([^/]+)$/)?.[1]
  if (botSection) {
    const label = BOT_SECTION_TITLES[botSection]
    return label ? `Gestión botIP · ${label}` : 'Gestión botIP'
  }
  const section = pathname.match(/^\/contenido\/landing\/([^/]+)$/)?.[1]
  if (!section) return 'AdminIP'
  const label = LANDING_SECTION_TITLES[section]
  return label ? `Gestión Landing · ${label}` : 'Gestión Landing'
}

/** Texto de admin-header__subtitle por gestión. */
export const pageSubtitles: Record<string, string> = {
  '/dashboard/medicion': 'Mediciones, tablas y gráficos del panel.',
  '/contenido/blog': 'Publicaciones, estados y orden del blog.',
  '/contenido/vacantes': 'Vacantes publicadas en Trabaja con nosotros.',
  '/contenido/landing': 'Elija la sección del landing que desea ajustar.',
  '/contenido/bot': 'Elija la sección de BotIP que desea ajustar.',
  '/acceso/usuarios': 'Usuarios del panel administrativo. Los clientes de venta se gestionan en Gestión de clientes.',
  '/acceso/roles': 'Roles y permisos del panel.',
  '/acceso/auditoria': 'Registro de cambios y accesos del panel.',
  '/operacion/pedidos': 'Pedidos de venta y su estado.',
  '/operacion/clientes': 'Clientes de venta.',
  '/operacion/envios': 'Envíos asociados a los pedidos.',
  '/operacion/productos': 'Productos del catálogo de ventas.',
  '/operacion/categorias': 'Categorías de productos.',
  '/configuracion/perfil': 'Datos de su sesión en el panel.',
}

export function getPageSubtitle(pathname: string): string | undefined {
  if (pageSubtitles[pathname]) return pageSubtitles[pathname]
  const botSection = pathname.match(/^\/contenido\/bot\/([^/]+)$/)?.[1]
  if (botSection) return BOT_SECTION_HINTS[botSection] ?? pageSubtitles['/contenido/bot']
  if (pathname.startsWith('/contenido/landing/')) return pathname
  return undefined
}
