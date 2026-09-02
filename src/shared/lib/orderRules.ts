import type { OrderRecord } from '@/mocks/data'

export const ORDER_STATUSES = [
  'verificar',
  'picking',
  'packing',
  'facturacion',
  'despacho',
  'envio',
] as const

export type OrderWorkflowStatus = (typeof ORDER_STATUSES)[number]

export const ORDER_EDIT_WINDOW_MS = 30 * 60 * 1000

export function isOrderEditableByTime(order: Pick<OrderRecord, 'createdAt'>, now = Date.now()) {
  const created = new Date(order.createdAt).getTime()
  if (Number.isNaN(created)) return false
  return now - created <= ORDER_EDIT_WINDOW_MS
}

export function canEditOrder(
  order: Pick<OrderRecord, 'createdAt' | 'status'>,
  hasUpdatePermission: boolean,
) {
  if (!hasUpdatePermission) return false
  if (order.status === 'cancelado' || order.status === 'envio') return false
  return isOrderEditableByTime(order)
}

export function orderEditBlockedReason(
  order: Pick<OrderRecord, 'createdAt' | 'status'>,
  hasUpdatePermission: boolean,
) {
  if (!hasUpdatePermission) return 'No tiene permiso para editar pedidos'
  if (order.status === 'cancelado') return 'Este pedido ya fue anulado'
  if (order.status === 'envio') return 'No se puede editar: el pedido ya está en envío'
  if (!isOrderEditableByTime(order)) return 'Solo se puede editar durante los primeros 30 minutos'
  return null
}
