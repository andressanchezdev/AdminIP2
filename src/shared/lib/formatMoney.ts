/** Formatea montos en pesos colombianos (COP) con decimales. */
export function formatCOP(value: number | string | null | undefined) {
  const amount = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(amount)) {
    return '—'
  }
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

/**
 * Interpreta montos tipados en es-CO:
 * - `100.000,50` → 100000.5
 * - `100.000` → 100000
 * - `100000,5` / `12.5` → ok
 */
export function parseMoneyInput(value: string | number) {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : NaN
  }
  const trimmed = String(value).trim().replace(/[$\s]|COP/gi, '')
  if (!trimmed) return NaN

  let normalized = trimmed
  const hasDot = normalized.includes('.')
  const hasComma = normalized.includes(',')

  if (hasDot && hasComma) {
    // Miles con punto, decimal con coma: 1.234.567,89
    normalized = normalized.replace(/\./g, '').replace(',', '.')
  } else if (hasComma) {
    // Solo coma → decimal
    normalized = normalized.replace(',', '.')
  } else if (hasDot && /^\d{1,3}(\.\d{3})+$/.test(normalized)) {
    // Solo puntos como miles: 100.000
    normalized = normalized.replace(/\./g, '')
  }

  const num = Number(normalized)
  return Number.isFinite(num) ? num : NaN
}

/** Formato de entrada es-CO sin símbolo de moneda: 100.000,00 */
export function formatMoneyInput(value: number | string | null | undefined) {
  const amount = typeof value === 'number' ? value : parseMoneyInput(String(value ?? ''))
  if (!Number.isFinite(amount)) return ''
  return new Intl.NumberFormat('es-CO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

/** Formatea la parte entera con puntos de miles mientras se escribe. */
export function formatMoneyTyping(raw: string) {
  const cleaned = raw.replace(/[^\d,]/g, '')
  const commaIndex = cleaned.indexOf(',')
  const hasComma = commaIndex >= 0
  const intDigits = (hasComma ? cleaned.slice(0, commaIndex) : cleaned).replace(/\D/g, '')
  const decDigits = hasComma
    ? cleaned.slice(commaIndex + 1).replace(/\D/g, '').slice(0, 2)
    : null

  if (!intDigits && decDigits === null) return ''
  const formattedInt = (intDigits || '0').replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  if (decDigits === null) return intDigits ? formattedInt : ''
  return `${formattedInt},${decDigits}`
}
