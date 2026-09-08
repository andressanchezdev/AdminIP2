import { normalizeQuery } from './normalizeText'
import { correctToken, scoreKeywords } from './matchIntent'
import { ACCESSORY_TERMS, findTerm, MOTO_TERMS, OTHER_PART_TERMS } from './motoParts'
import { classifyUnmatched, companyHintWord } from './unmatchedKind'
import { matchLandingTeam } from './teamLookup'
import {
  getChatIntents,
  accessoryReply,
  attentionReply,
  catalogReply,
  companyReply,
  companyHintReply,
  complaintReply,
  creatureUnmatchedReply,
  fallbackReply,
  foodUnmatchedReply,
  greetingReply,
  hasProductTerm,
  insultUnmatchedReply,
  locationReply,
  namedPartReply,
  partsReply,
  personUnmatchedReply,
  productReply,
  teamMatchReply,
  quoteReply,
  sexualUnmatchedReply,
  socialReply,
  thanksReply,
  vacancyReply,
  vehicleUnmatchedReply,
  violenceUnmatchedReply,
  whatsappReply,
  type ChatReply,
} from './intents'

const MIN_SCORE = 3
const FOLLOW_UP = new Set(['marca', 'modelo', 'referencia', 'ese', 'esa', 'mismo', 'misma', 'eso'])

function isWeakReply(reply: ChatReply) {
  return /no tengo|no coincide|no es un|no está|no encuentro/i.test(reply.text)
}

function dictionaryOf(intents: ReturnType<typeof getChatIntents>) {
  return [...new Set([...intents.flatMap((intent) => intent.keywords), ...MOTO_TERMS])]
}

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

function replyForUnmatched(raw: string): ChatReply {
  const tokens = normalizeQuery(raw)
  const company = companyHintWord(tokens)
  if (company) return companyHintReply(company)

  const unmatched = classifyUnmatched(tokens)
  if (unmatched.kind === 'insult') return insultUnmatchedReply()
  if (unmatched.kind === 'sexual') return sexualUnmatchedReply()
  if (unmatched.kind === 'violence') return violenceUnmatchedReply(unmatched.word)
  if (unmatched.kind === 'food') return foodUnmatchedReply(unmatched.word)
  if (unmatched.kind === 'creature') return creatureUnmatchedReply(unmatched.word)
  if (unmatched.kind === 'vehicle') return vehicleUnmatchedReply(unmatched.word)
  if (unmatched.kind === 'person') return personUnmatchedReply(unmatched.word)
  return fallbackReply(raw)
}

function answerOnce(raw: string): ChatReply {
  const plainTokens = normalizeQuery(raw)
  const blocked = classifyUnmatched(plainTokens)
  if (blocked.kind === 'insult') return insultUnmatchedReply()
  if (blocked.kind === 'sexual') return sexualUnmatchedReply()

  const team = matchLandingTeam(plainTokens)
  if (team) return teamMatchReply(team)

  const intents = getChatIntents()
  const tokens = plainTokens.map((token) => correctToken(token, dictionaryOf(intents)))
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

  for (const intent of intents) {
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

    return replyForUnmatched(raw)
  }

  return REPLIES[bestId](tokens)
}

export function answerLandingChat(raw: string, history: readonly string[] = []): ChatReply {
  const current = answerOnce(raw)
  const prior = history.map((item) => item.trim()).filter(Boolean).slice(-4)
  if (!prior.length || !isWeakReply(current)) return current

  const tokens = normalizeQuery(raw)
  const followUp = tokens.length <= 3 || tokens.some((token) => FOLLOW_UP.has(token))
  if (!followUp) return current

  const combined = answerOnce(`${prior.join(' ')} ${raw}`)
  return isWeakReply(combined) ? current : combined
}

export type { ChatReply } from './intents'
