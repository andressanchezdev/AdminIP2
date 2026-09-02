import type { ClientRecord } from '@/mocks/data'

export type ClientCreditInfo = {
  clientId: string
  hasCredit: boolean
  available: number
  currency: 'COP'
}

/** Mock de API de crédito disponible por cliente. */
export function fetchClientCredit(clientId: string, client?: ClientRecord | null): ClientCreditInfo {
  if (!clientId || !client || client.status !== 'activo') {
    return { clientId, hasCredit: false, available: 0, currency: 'COP' }
  }
  const available = typeof client.creditAvailable === 'number' ? client.creditAvailable : 0
  return {
    clientId,
    hasCredit: available > 0,
    available,
    currency: 'COP',
  }
}
