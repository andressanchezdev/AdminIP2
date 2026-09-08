import { stripAccents } from './normalizeText'
import { PART_ALIASES } from './motoParts'
import { PROTECTED_TOKENS } from './unmatchedKind'

const ALIASES: Record<string, string> = {
  wasap: 'whatsapp',
  wassap: 'whatsapp',
  whatsap: 'whatsapp',
  whatsapp: 'whatsapp',
  whastapp: 'whatsapp',
  whatssap: 'whatsapp',
  wsp: 'whatsapp',
  wa: 'whatsapp',
  catalgo: 'catalogo',
  catalogo: 'catalogo',
  katalogo: 'catalogo',
  catologo: 'catalogo',
  kntacto: 'contacto',
  contato: 'contacto',
  qeja: 'queja',
  keja: 'queja',
  reklamo: 'reclamo',
  reclamo: 'reclamo',
  direccion: 'direccion',
  ubicacion: 'ubicacion',
  vacante: 'vacante',
  empleo: 'vacante',
  trabajo: 'vacante',
  ...PART_ALIASES,
}

export function editDistance(left: string, right: string) {
  if (left === right) return 0
  if (!left.length) return right.length
  if (!right.length) return left.length

  const rows = left.length + 1
  const cols = right.length + 1
  const matrix = Array.from({ length: rows }, () => Array<number>(cols).fill(0))

  for (let row = 0; row < rows; row += 1) matrix[row][0] = row
  for (let col = 0; col < cols; col += 1) matrix[0][col] = col

  for (let row = 1; row < rows; row += 1) {
    for (let col = 1; col < cols; col += 1) {
      const cost = left[row - 1] === right[col - 1] ? 0 : 1
      matrix[row][col] = Math.min(
        matrix[row - 1][col] + 1,
        matrix[row][col - 1] + 1,
        matrix[row - 1][col - 1] + cost,
      )
    }
  }

  return matrix[left.length][right.length]
}

function maxDistance(token: string) {
  if (token.length < 6) return 1
  return 2
}

export function correctToken(token: string, dictionary: readonly string[]) {
  const plain = stripAccents(token.toLowerCase())
  if (ALIASES[plain]) return ALIASES[plain]
  if (PROTECTED_TOKENS.has(plain)) return plain
  if (plain.length < 3) return plain

  let best = plain
  let bestDistance = maxDistance(plain) + 1

  for (const word of dictionary) {
    if (Math.abs(word.length - plain.length) > maxDistance(plain)) continue
    const distance = editDistance(plain, word)
    if (distance < bestDistance) {
      best = word
      bestDistance = distance
    }
  }

  return bestDistance <= maxDistance(plain) ? best : plain
}

export function scoreKeywords(tokens: readonly string[], keywords: readonly string[]) {
  let score = 0
  for (const token of tokens) {
    if (keywords.includes(token)) {
      score += 3
      continue
    }
    if (PROTECTED_TOKENS.has(token)) continue
    const near = keywords.some((keyword) => {
      if (Math.abs(keyword.length - token.length) > maxDistance(token)) return false
      return editDistance(token, keyword) <= maxDistance(token)
    })
    if (near) score += 2
  }
  return score
}
