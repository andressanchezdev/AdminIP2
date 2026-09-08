import { getBotSettings } from './botSettings'

const USAGE_KEY = 'botip-chat-usage'
const BLOCK_KEY = 'botip-chat-blocked-until'

export const CHAT_MIN_CHARS = 3
export const CHAT_MAX_CHARS = 250
export const CHAT_BLOCK_MS = 5 * 60 * 1000

const BURST_WINDOW_MS = 60 * 1000
const BURST_LIMIT = 8
const REPEAT_LIMIT = 4

export type ChatGuardState = {
  blocked: boolean
  message: string
  remainingMs: number
}

function readTimes() {
  try {
    const raw = window.localStorage.getItem(USAGE_KEY)
    const parsed = raw ? (JSON.parse(raw) as unknown) : []
    if (!Array.isArray(parsed)) return []
    return parsed.filter((item): item is number => typeof item === 'number')
  } catch {
    return []
  }
}

function writeTimes(times: number[]) {
  window.localStorage.setItem(USAGE_KEY, JSON.stringify(times.slice(-30)))
}

function limits() {
  const settings = getBotSettings()
  return {
    min: settings.minChars || CHAT_MIN_CHARS,
    max: settings.maxChars || CHAT_MAX_CHARS,
    blockMs: (settings.blockMinutes || 5) * 60 * 1000,
    burst: settings.burstLimit || BURST_LIMIT,
  }
}

export function chatDraftError(value: string) {
  const text = value.trim()
  const { min, max } = limits()
  if (!text) return 'Escribe tu consulta para poder atenderte.'
  if (text.length < min) return `Escribe al menos ${min} caracteres.`
  if (text.length > max) return `El mensaje no puede pasar de ${max} caracteres.`
  return ''
}

export function formatBlockWait(remainingMs: number) {
  const minutes = Math.max(1, Math.ceil(remainingMs / 60000))
  return minutes === 1 ? '1 minuto' : `${minutes} minutos`
}

export function blockedChatMessage(remainingMs: number) {
  return `El chat ha sido bloqueado temporalmente por uso excesivo. Podrás escribir de nuevo en ${formatBlockWait(remainingMs)}. Si necesitas atención ahora, usa WhatsApp o el correo publicados en el sitio.`
}

export function readChatGuard(now = Date.now()): ChatGuardState {
  try {
    const until = Number(window.localStorage.getItem(BLOCK_KEY) || 0)
    if (until > now) {
      return { blocked: true, remainingMs: until - now, message: blockedChatMessage(until - now) }
    }
    if (until) window.localStorage.removeItem(BLOCK_KEY)
  } catch {
    return { blocked: false, remainingMs: 0, message: '' }
  }
  return { blocked: false, remainingMs: 0, message: '' }
}

function blockNow(now: number) {
  const until = now + limits().blockMs
  window.localStorage.setItem(BLOCK_KEY, String(until))
  return readChatGuard(now)
}

export function registerChatSend(text: string, now = Date.now()): ChatGuardState {
  const current = readChatGuard(now)
  if (current.blocked) return current

  try {
    const times = readTimes().filter((time) => now - time < BURST_WINDOW_MS)
    const recentTexts = readRecentTexts()
    const nextTexts = [...recentTexts, text.trim().toLowerCase()].slice(-REPEAT_LIMIT)
    const repeated = nextTexts.length === REPEAT_LIMIT && nextTexts.every((item) => item === nextTexts[0])

    times.push(now)
    writeTimes(times)
    writeRecentTexts(nextTexts)

    if (times.length >= limits().burst || repeated) return blockNow(now)
  } catch {
    return { blocked: false, remainingMs: 0, message: '' }
  }

  return { blocked: false, remainingMs: 0, message: '' }
}

const TEXT_KEY = 'botip-chat-recent'

function readRecentTexts() {
  try {
    const raw = window.localStorage.getItem(TEXT_KEY)
    const parsed = raw ? (JSON.parse(raw) as unknown) : []
    if (!Array.isArray(parsed)) return []
    return parsed.filter((item): item is string => typeof item === 'string')
  } catch {
    return []
  }
}

function writeRecentTexts(texts: string[]) {
  window.localStorage.setItem(TEXT_KEY, JSON.stringify(texts))
}
