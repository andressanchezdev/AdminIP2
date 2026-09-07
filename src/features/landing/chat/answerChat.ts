import { normalizeQuery } from './normalizeText'
import { correctToken, scoreKeywords } from './matchIntent'
import { ACCESSORY_TERMS, findTerm, MOTO_TERMS, OTHER_PART_TERMS } from './motoParts'
import {
  CHAT_INTENTS,
  accessoryReply,
  attentionReply,
  catalogReply,
  companyReply,
  complaintReply,
  fallbackReply,
  greetingReply,
  hasProductTerm,
  locationReply,
  namedPartReply,
  partsReply,
  productReply,
  quoteReply,
  socialReply,
  thanksReply,
  vacancyReply,
  whatsappReply,
  type ChatReply,
} from './intents'

const MIN_SCORE = 3

const DICTIONARY = [...new Set([...CHAT_INTENTS.flatMap((intent) => intent.keywords), ...MOTO_TERMS])]

const REPLIES: Record<string, (tokens: readonly string[]) => ChatReply> = {
  greeting: () => greetingReply(),
  whatsapp: () => whatsappReply(),
  catalog: () => catalogReply(),
  parts: () => partsReply(),
  accessory: (tokens) => accessoryReply(tokens),
  attention: () => attentionReply(),
  complaint: () => complaintReply(),
  quote: (tokens) => quoteReply(tokens),
  vacancy: () => vacancyReply(),
  location: () => locationReply(),
  company: () => companyReply(),
  social: () => socialReply(),
  thanks: () => thanksReply(),
}

const PRIORITY: Array<{ id: keyof typeof REPLIES; keywords: readonly string[] }> = [
  { id: 'complaint', keywords: ['queja', 'reclamo', 'reclamar', 'quejar', 'molestia', 'problema', 'garantia'] },
  { id: 'quote', keywords: ['precio', 'precios', 'stock', 'cotizar', 'cotizacion', 'cuesta', 'disponibilidad'] },
]

export function answerLandingChat(raw: string): ChatReply {
  const tokens = normalizeQuery(raw).map((token) => correctToken(token, DICTIONARY))
  if (tokens.length === 0) return greetingReply()

  for (const item of PRIORITY) {
    if (scoreKeywords(tokens, item.keywords) >= MIN_SCORE) return REPLIES[item.id](tokens)
  }

  if (hasProductTerm(tokens)) {
    const product = productReply(tokens)
    if (product) return product
  }

  if (findTerm(tokens, ACCESSORY_TERMS)) return accessoryReply(tokens)

  if (findTerm(tokens, OTHER_PART_TERMS)) {
    const part = namedPartReply(tokens)
    if (part) return part
  }

  let bestId = ''
  let bestScore = 0

  for (const intent of CHAT_INTENTS) {
    if (intent.id === 'greeting') continue
    const score = scoreKeywords(tokens, intent.keywords)
    if (score > bestScore) {
      bestScore = score
      bestId = intent.id
    }
  }

  if (bestScore < MIN_SCORE) {
    const greeting = scoreKeywords(tokens, ['hola', 'buenas', 'buenos', 'saludo', 'hey'])
    if (greeting >= MIN_SCORE) return greetingReply()
    return fallbackReply(raw.trim())
  }

  return REPLIES[bestId](tokens)
}

export type { ChatReply } from './intents'
