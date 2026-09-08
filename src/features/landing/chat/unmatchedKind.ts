import { stripAccents } from './normalizeText'

const VEHICLE_ALIASES: Record<string, string> = {
  automovil: 'carro',
  camion: 'camion',
  camioneta: 'camioneta',
  camionetas: 'camioneta',
  campero: 'camioneta',
  carro: 'carro',
  coches: 'carro',
  coche: 'carro',
  cuatrimoto: 'cuatrimoto',
  moto: 'moto',
  motico: 'moto',
  motocicleta: 'moto',
  motocicletas: 'moto',
  pickup: 'camioneta',
  picop: 'camioneta',
}

export const VEHICLE_TERMS = [
  'bicicleta',
  'bus',
  'camion',
  'camioneta',
  'carro',
  'cuatrimoto',
  'moto',
  'pickup',
] as const

/** Nombres de pila frecuentes. No son productos del catálogo. */
export const PERSON_NAMES = [
  'ana',
  'andres',
  'antonio',
  'camila',
  'carlos',
  'carolina',
  'daniel',
  'david',
  'diego',
  'felipe',
  'fernando',
  'javier',
  'jorge',
  'jose',
  'juan',
  'juliana',
  'laura',
  'luis',
  'maria',
  'miguel',
  'pedro',
  'santiago',
  'sofia',
] as const

/** Raíces de insulto. No se repite la palabra en la respuesta. */
const INSULT_STEMS = [
  'cabron',
  'carechimba',
  'estupido',
  'gonorre',
  'hijuep',
  'hp',
  'huevon',
  'idiota',
  'imbecil',
  'malparid',
  'maricon',
  'mierda',
  'pendej',
  'puta',
  'puto',
  'webon',
]

/** Raíces sexuales explícitas. No se repite la palabra en la respuesta. */
const SEXUAL_STEMS = ['desnudo', 'masturb', 'orgasmo', 'porn', 'sexo', 'sexual', 'xxx']

const VIOLENCE_TERMS = ['asesinato', 'bomba', 'disparo', 'guerra', 'secuestro', 'terrorismo', 'violencia','matar','asesinar','asesinaron','asesinado','asesinados','asesinadas','asesinadas']

const FOOD_TERMS = [
  'almuerzo',
  'arepa',
  'bocadillo',
  'cerveza',
  'comida',
  'desayuno',
  'empanada',
  'hamburguesa',
  'jugo',
  'pizza',
  'sopa',
]

const CREATURE_TERMS = [
  'caballo',
  'carnotauro',
  'carnotaurus',
  'dinosaurio',
  'dragon',
  'gato',
  'leon',
  'mariposa',
  'pajaro',
  'perro',
  'pez',
]

export const PROTECTED_TOKENS = new Set<string>([
  'marcos',
  ...VEHICLE_TERMS,
  ...PERSON_NAMES,
  ...Object.keys(VEHICLE_ALIASES),
  ...VIOLENCE_TERMS,
  ...FOOD_TERMS,
  ...CREATURE_TERMS,
  ...INSULT_STEMS,
  ...SEXUAL_STEMS,
])

const COMPANY_HINTS = new Set([
  'importacion',
  'importador',
  'importadora',
  'importadoras',
  'importadores',
  'importar',
  'premium',
])

export type UnmatchedKind = 'insult' | 'sexual' | 'violence' | 'food' | 'creature' | 'vehicle' | 'person' | 'unknown'

function plain(token: string) {
  return stripAccents(token.toLowerCase())
}

function hasStem(token: string, stems: readonly string[]) {
  return stems.some((stem) => token === stem || token.startsWith(stem))
}

function findListed(tokens: readonly string[], terms: readonly string[]) {
  return tokens.find((token) => terms.includes(token)) || ''
}

export function companyHintWord(tokens: readonly string[]) {
  return tokens.map(plain).find((token) => COMPANY_HINTS.has(token) || token.includes('importadora')) || ''
}

export function classifyUnmatched(tokens: readonly string[]): { kind: UnmatchedKind; word: string } {
  const cleaned = tokens.map(plain).filter(Boolean)

  if (cleaned.some((token) => hasStem(token, INSULT_STEMS))) return { kind: 'insult', word: '' }
  if (cleaned.some((token) => hasStem(token, SEXUAL_STEMS))) return { kind: 'sexual', word: '' }

  const violence = findListed(cleaned, VIOLENCE_TERMS)
  if (violence) return { kind: 'violence', word: violence }

  const food = findListed(cleaned, FOOD_TERMS)
  if (food) return { kind: 'food', word: food }

  const creature = findListed(cleaned, CREATURE_TERMS)
  if (creature) return { kind: 'creature', word: creature }

  const vehicle = cleaned.find((token) => VEHICLE_ALIASES[token] || VEHICLE_TERMS.includes(token as (typeof VEHICLE_TERMS)[number]))
  if (vehicle) return { kind: 'vehicle', word: VEHICLE_ALIASES[vehicle] || vehicle }

  const person = cleaned.find((token) => PERSON_NAMES.includes(token as (typeof PERSON_NAMES)[number]))
  if (person) return { kind: 'person', word: person }

  return { kind: 'unknown', word: cleaned.join(' ') }
}
