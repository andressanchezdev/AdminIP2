/** Validadores reutilizables — tipo, formato, positivos, límites 10–60, unicidad. */

export const INPUT_CHAR_MIN = 10
export const INPUT_CHAR_MAX = 60

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i
const PHONE_RE = /^[\d\s+\-()]{10,20}$/
const NAME_RE = /^[A-Za-zÁÉÍÓÚÜáéíóúüÑñ0-9][A-Za-zÁÉÍÓÚÜáéíóúüÑñ0-9 .,'°#/\-]{8,59}$/
const ADDRESS_RE = /^[A-Za-zÁÉÍÓÚÜáéíóúüÑñ0-9][A-Za-zÁÉÍÓÚÜáéíóúüÑñ0-9 .,'#°/\-]{8,59}$/
const CODE_RE = /^[A-Za-z0-9][A-Za-z0-9\-_]{8,59}$/
const REASON_RE = /^[A-Za-zÁÉÍÓÚÜáéíóúüÑñ0-9][A-Za-zÁÉÍÓÚÜáéíóúüÑñ0-9 .,'#°/\-?!]{8,59}$/

export function required(value: string, label = 'Campo') {
  if (!String(value ?? '').trim()) return `${label} es obligatorio`
  return null
}

export function validateBoundedText(
  value: string,
  label = 'Campo',
  options: {
    min?: number
    max?: number
    pattern?: RegExp
    patternMessage?: string
  } = {},
) {
  const min = options.min ?? INPUT_CHAR_MIN
  const max = options.max ?? INPUT_CHAR_MAX
  const empty = required(value, label)
  if (empty) return empty
  const text = String(value).trim()
  if (text.length < min) return `${label}: mínimo ${min} caracteres`
  if (text.length > max) return `${label}: máximo ${max} caracteres`
  if (options.pattern && !options.pattern.test(text)) {
    return options.patternMessage ?? `${label}: formato inválido`
  }
  return null
}

export function validateEmail(value: string) {
  const empty = required(value, 'Email')
  if (empty) return empty
  const text = value.trim()
  if (text.length > INPUT_CHAR_MAX) return `Email: máximo ${INPUT_CHAR_MAX} caracteres`
  if (!EMAIL_RE.test(text)) return 'Formato de email inválido'
  return null
}

export function validatePhone(value: string) {
  const empty = required(value, 'Teléfono')
  if (empty) return empty
  const text = value.trim()
  if (text.length > INPUT_CHAR_MAX) return `Teléfono: máximo ${INPUT_CHAR_MAX} caracteres`
  const digits = text.replace(/\D/g, '')
  if (digits.length < 10) return 'Teléfono: mínimo 10 dígitos'
  if (digits.length > 15) return 'Teléfono: demasiados dígitos'
  if (!PHONE_RE.test(text)) return 'Formato de teléfono inválido'
  return null
}

export function validatePersonName(value: string, label = 'Nombre') {
  const base = validateBoundedText(value, label, {
    pattern: NAME_RE,
    patternMessage: `${label}: use letras/números sin símbolos raros`,
  })
  if (base) return base
  if (/(.)\1{3,}/i.test(value.trim())) return `${label}: revise la ortografía (caracteres repetidos)`
  return null
}

export function validateAddress(value: string) {
  return validateBoundedText(value, 'Dirección', {
    pattern: ADDRESS_RE,
    patternMessage: 'Dirección con formato inválido',
  })
}

export function validateRoleName(value: string) {
  return validateBoundedText(value, 'Nombre del rol', {
    pattern: /^[A-Za-zÁÉÍÓÚáéíóúÑñ0-9 _-]{10,60}$/,
    patternMessage: 'Solo letras, números, espacios, guion y guion bajo',
  })
}

export function validateDescription(value: string, label = 'Descripción') {
  return validateBoundedText(value, label, {
    pattern: REASON_RE,
    patternMessage: `${label}: formato inválido`,
  })
}

export function validateReason(value: string, label = 'Motivo') {
  return validateBoundedText(value, label, {
    pattern: REASON_RE,
    patternMessage: `${label}: formato inválido`,
  })
}

export function validateSkuCode(value: string, label = 'Código') {
  return validateBoundedText(value, label, {
    pattern: CODE_RE,
    patternMessage: `${label}: use letras, números, guion o guion bajo`,
  })
}

export function validateCarrier(value: string) {
  return validatePersonName(value, 'Transportista')
}

export function validateTracking(value: string) {
  return validateBoundedText(value, 'Número de seguimiento', {
    pattern: CODE_RE,
    patternMessage: 'Seguimiento: use letras, números, guion o guion bajo',
  })
}

export function validateProductModel(value: string) {
  return validateBoundedText(value, 'Modelo', {
    pattern: CODE_RE,
    patternMessage: 'Modelo: use letras, números, guion o guion bajo',
  })
}

export function validatePositiveInt(value: number | string, label = 'Cantidad') {
  const num = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(num)) return `${label} debe ser un número`
  if (!Number.isInteger(num)) return `${label} debe ser un número entero`
  if (num < 1) return `${label} debe ser mayor a 0`
  return null
}

export function validateNonNegativeInt(value: number | string, label = 'Cantidad') {
  const num = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(num)) return `${label} debe ser un número`
  if (!Number.isInteger(num)) return `${label} debe ser un número entero`
  if (num < 0) return `${label} no puede ser negativo`
  return null
}

function parseMoneyForValidation(value: number | string) {
  if (typeof value === 'number') return value
  const trimmed = String(value).trim().replace(/[$\s]|COP/gi, '')
  if (!trimmed) return NaN
  let normalized = trimmed
  const hasDot = normalized.includes('.')
  const hasComma = normalized.includes(',')
  if (hasDot && hasComma) {
    normalized = normalized.replace(/\./g, '').replace(',', '.')
  } else if (hasComma) {
    normalized = normalized.replace(',', '.')
  } else if (hasDot && /^\d{1,3}(\.\d{3})+$/.test(normalized)) {
    normalized = normalized.replace(/\./g, '')
  }
  return Number(normalized)
}

export function validateMoney(value: number | string, label = 'Valor') {
  const num = parseMoneyForValidation(value)
  if (!Number.isFinite(num)) return `${label} debe ser un número válido`
  if (num < 0) return `${label} no puede ser negativo`
  return null
}

export function validatePositiveMoney(value: number | string, label = 'Valor') {
  const base = validateMoney(value, label)
  if (base) return base
  const num = parseMoneyForValidation(value)
  if (num <= 0) return `${label} debe ser mayor a 0`
  return null
}

export function todayISODate() {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function validateDateNotPast(value: string, label = 'Fecha') {
  const empty = required(value, label)
  if (empty) return empty
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return `${label} inválida`
  if (value < todayISODate()) return `${label} no puede ser una fecha pasada`
  return null
}

export type PasswordChecks = {
  minLength: boolean
  maxLength: boolean
  upper: boolean
  lower: boolean
  number: boolean
  special: boolean
}

export function getPasswordChecks(value: string): PasswordChecks {
  return {
    minLength: value.length >= 8,
    maxLength: value.length <= INPUT_CHAR_MAX,
    upper: /[A-ZÁÉÍÓÚÜÑ]/.test(value),
    lower: /[a-záéíóúüñ]/.test(value),
    number: /\d/.test(value),
    special: /[^A-Za-zÁÉÍÓÚÜáéíóúüÑñ0-9\s]/.test(value),
  }
}

export function validatePassword(value: string, { required: isRequired = true } = {}) {
  if (!value) {
    return isRequired ? 'La contraseña es obligatoria' : null
  }
  if (value.length > INPUT_CHAR_MAX) return `Máximo ${INPUT_CHAR_MAX} caracteres`
  const checks = getPasswordChecks(value)
  if (!checks.minLength) return 'Mínimo 8 caracteres'
  if (!checks.upper) return 'Debe incluir al menos una mayúscula'
  if (!checks.lower) return 'Debe incluir al menos una minúscula'
  if (!checks.number) return 'Debe incluir al menos un número'
  if (!checks.special) return 'Debe incluir al menos un carácter especial'
  return null
}

export function isUniqueInsensitive(
  value: string,
  existing: string[],
  exclude?: string | null,
) {
  const normalized = value.trim().toLowerCase()
  const excluded = exclude?.trim().toLowerCase()
  return !existing.some((item) => {
    const current = item.trim().toLowerCase()
    if (excluded && current === excluded) return false
    return current === normalized
  })
}

export function validateUnique(
  value: string,
  existing: string[],
  label: string,
  exclude?: string | null,
) {
  if (!isUniqueInsensitive(value, existing, exclude)) {
    return `${label} ya está registrado`
  }
  return null
}
