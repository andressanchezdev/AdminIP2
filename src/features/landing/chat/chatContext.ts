const KEY = 'botip-chat-context'
const LIMIT = 4

const FOLLOW_UP = new Set(['marca', 'modelo', 'referencia', 'ese', 'esa', 'mismo', 'misma', 'eso'])

type StoredContext = {
  messages: string[]
  sessionId: string
}

let activeSessionId = ''

function fold(text: string) {
  return text
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
}

function write(messages: string[]) {
  if (!activeSessionId) return
  const stored: StoredContext = { sessionId: activeSessionId, messages: messages.slice(-LIMIT) }
  window.sessionStorage.setItem(KEY, JSON.stringify(stored))
}

function readStored() {
  if (!activeSessionId) return []
  try {
    const raw = window.sessionStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as Partial<StoredContext>
    if (!parsed || parsed.sessionId !== activeSessionId || !Array.isArray(parsed.messages)) return []
    return parsed.messages.filter((item): item is string => typeof item === 'string').slice(-LIMIT)
  } catch {
    return []
  }
}

export function startChatSession() {
  activeSessionId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  write([])
  return activeSessionId
}

export function endChatSession() {
  activeSessionId = ''
  window.sessionStorage.removeItem(KEY)
}

export function readUserContext() {
  return readStored()
}

export function isFreshConversation(text: string) {
  return /^(hola|hey|buenas|buen dia|buenos dias|buenas tardes|buenas noches|saludos?)[!.?\s]*$/.test(fold(text))
}

export function isContextFollowUp(text: string) {
  const tokens = fold(text)
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 1)
  if (tokens.length === 0) return false
  return tokens.length <= 3 || tokens.some((token) => FOLLOW_UP.has(token))
}

export function priorUserMessages(current: string) {
  const saved = readStored()
  const trimmed = current.trim()
  if (saved[saved.length - 1] === trimmed) return saved.slice(0, -1)
  return saved
}

export function commitUserMessage(text: string, mode: 'append' | 'replace' | 'clear') {
  const trimmed = text.trim()
  if (!activeSessionId) startChatSession()
  if (mode === 'clear' || !trimmed) {
    write([])
    return []
  }
  const base = mode === 'replace' ? [] : readStored()
  const next = [...base, trimmed].filter(Boolean).slice(-LIMIT)
  write(next)
  return next
}
