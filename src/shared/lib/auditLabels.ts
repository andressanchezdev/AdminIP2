const ACTION_LABELS: Record<string, string> = {
  'auth.login': 'Inicio de sesión',
  'auth.logout': 'Cierre de sesión',
  'access.denied': 'Acceso denegado',
  'user.create': 'Creación de usuario',
  'user.update': 'Actualización de usuario',
  'user.delete': 'Eliminación de usuario',
  'user.activate': 'Activación de usuario',
  'user.deactivate': 'Desactivación de usuario',
  'product.create': 'Creación de producto',
  'product.update': 'Actualización de producto',
  'product.delete': 'Eliminación de producto',
  'product.status': 'Cambio de estado de producto',
  'client.create': 'Creación de cliente',
  'client.update': 'Actualización de cliente',
  'client.delete': 'Eliminación de cliente',
  'client.status': 'Cambio de estado de cliente',
  'order.create': 'Creación de pedido',
  'order.update': 'Edición de pedido',
  'order.status': 'Cambio de estado de pedido',
  'order.cancel': 'Anulación de pedido',
  'category.create': 'Creación de categoría',
  'category.update': 'Actualización de categoría',
  'category.delete': 'Eliminación de categoría',
  'category.deactivate': 'Desactivación de categoría',
  'category.activate': 'Activación de categoría',
  'role.create': 'Creación de rol',
  'role.update': 'Actualización de rol',
  'role.delete': 'Eliminación de rol',
  'role.permissions.update': 'Actualización de permisos del rol',
  'profile.update': 'Actualización de perfil',
  'shipment.create': 'Creación de envío',
  'shipment.update': 'Actualización de envío',
  'shipment.status': 'Cambio de estado de envío',
  'shipment.cancel': 'Cancelación de envío',
}

const ENTITY_LABELS: Record<string, string> = {
  user: 'Usuario',
  product: 'Producto',
  client: 'Cliente',
  order: 'Pedido',
  category: 'Categoría',
  role: 'Rol',
  shipment: 'Envío',
  route: 'Ruta',
}

/** Etiqueta legible de la acción de auditoría. */
export function formatAuditAction(action: string) {
  const normalized = action.trim().toLowerCase()
  if (ACTION_LABELS[normalized]) return ACTION_LABELS[normalized]
  const [entity, ...rest] = normalized.split('.')
  const entityLabel = ENTITY_LABELS[entity] ?? entity
  const verbMap: Record<string, string> = {
    create: 'creación',
    update: 'actualización',
    delete: 'eliminación',
    status: 'cambio de estado',
    cancel: 'cancelación',
    activate: 'activación',
    deactivate: 'desactivación',
    login: 'inicio de sesión',
    logout: 'cierre de sesión',
    denied: 'denegado',
  }
  const verbKey = rest.join('.')
  const verb = verbMap[verbKey] ?? rest.join(' ').replace(/_/g, ' ')
  return `${entityLabel}: ${verb}`
}

export function formatAuditEntity(entity: string, entityId: string) {
  const label = ENTITY_LABELS[entity.toLowerCase()] ?? entity
  return `${label} ${entityId}`
}
