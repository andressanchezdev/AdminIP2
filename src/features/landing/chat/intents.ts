import { LANDING_CONTACT } from '../content'
import { getLandingContent, visibleBrands } from '../landingContentStore'
import { CATALOG_PRODUCTS } from '../catalogProducts'
import { ACCESSORY_TERMS, CATALOG_PART_TERMS, findTerm, OTHER_PART_TERMS } from './motoParts'
import { applyBotText, getBotSettings, keywordsOf } from './botSettings'
import { groupLabel, type TeamMatch } from './teamLookup'
import type { LandingTeamMember } from '@/mocks/data'

export type ChatAction = {
  href?: string
  label: string
  external?: boolean
  kind?: 'catalog-download'
}

export type ChatReply = {
  actions: ChatAction[]
  text: string
}

type IntentId =
  | 'greeting'
  | 'whatsapp'
  | 'catalog'
  | 'parts'
  | 'accessory'
  | 'product'
  | 'attention'
  | 'complaint'
  | 'quote'
  | 'vacancy'
  | 'location'
  | 'company'
  | 'social'
  | 'thanks'

type Intent = {
  id: IntentId
  keywords: readonly string[]
}

const CATALOG_PATH = '/explorar/catalogo'
const VACANCY_PATH = '/explorar/vacantes'

function whatsappHref(text: string) {
  const base = LANDING_CONTACT.whatsappUrl
  const joiner = base.includes('?') ? '&' : '?'
  return `${base}${joiner}text=${encodeURIComponent(text)}`
}

const contactActions = (): ChatAction[] => [
  {
    href: whatsappHref('Hola, quiero más información de Importadora Premium.'),
    label: 'Escribir por WhatsApp',
    external: true,
  },
  { href: `mailto:${LANDING_CONTACT.email}`, label: 'Enviar correo' },
]

export function getChatIntents(): Intent[] {
  return CHAT_INTENTS.map((intent) => ({
    ...intent,
    keywords: keywordsOf(intent.id, intent.keywords),
  }))
}

const CHAT_INTENTS: readonly Intent[] = [
  {
    id: 'greeting',
    keywords: ['hola', 'buenas', 'buenos', 'saludo', 'hey'],
  },
  {
    id: 'whatsapp',
    keywords: ['whatsapp', 'contacto', 'telefono', 'celular', 'correo', 'email', 'llamar', 'escribir'],
  },
  {
    id: 'catalog',
    keywords: ['catalogo', 'productos', 'surtido', 'linea'],
  },
  {
    id: 'parts',
    keywords: ['repuesto', 'repuestos', 'pieza', 'piezas', 'componente'],
  },
  {
    id: 'accessory',
    keywords: ['accesorio', 'accesorios'],
  },
  {
    id: 'attention',
    keywords: ['asesor', 'asesoria', 'pedido', 'comprar', 'obtener', 'atencion', 'ayuda', 'servicio'],
  },
  {
    id: 'complaint',
    keywords: ['queja', 'reclamo', 'reclamar', 'quejar', 'molestia', 'problema', 'garantia'],
  },
  {
    id: 'quote',
    keywords: ['precio', 'precios', 'stock', 'cotizar', 'cotizacion', 'vale', 'cuesta', 'disponibilidad'],
  },
  {
    id: 'vacancy',
    keywords: ['vacante', 'vacantes', 'empleo', 'trabajo', 'postular', 'hoja'],
  },
  {
    id: 'location',
    keywords: ['direccion', 'ubicacion', 'google maps', 'donde', 'sede', 'local'],
  },
  {
    id: 'company',
    keywords: ['vision', 'mision', 'equipo', 'nosotros', 'marca', 'marcas', 'empresa', 'quienes'],
  },
  {
    id: 'social',
    keywords: ['instagram', 'tiktok', 'facebook', 'redes', 'red'],
  },
  {
    id: 'thanks',
    keywords: ['gracias', 'gracia', 'adios', 'chao', 'bye'],
  },
]

export function catalogSummary() {
  return getLandingContent().catalog.options.map((option) => option.label).join(', ')
}

function labelOf(term: string) {
  if (!term) return 'ese producto'
  return term.charAt(0).toUpperCase() + term.slice(1)
}

function askToNarrow(subject: string) {
  return `Dime la marca o el modelo de ${subject}.`
}

export function whatsappReply(): ChatReply {
  return {
    text: applyBotText('whatsapp', `Puedes escribirnos por WhatsApp al ${LANDING_CONTACT.phoneDisplay} o al correo ${LANDING_CONTACT.email}.`, {
      phone: LANDING_CONTACT.phoneDisplay,
      email: LANDING_CONTACT.email,
    }),
    actions: contactActions(),
  }
}

function catalogStepActions(): ChatAction[] {
  return [
    {
      href: whatsappHref('Hola, quiero hablar con un asesor para conocer el catálogo.'),
      label: 'Hablar con un asesor real',
      external: true,
    },
    { kind: 'catalog-download', label: 'Descargar el catálogo' },
    { href: CATALOG_PATH, label: 'Ver catálogo' },
  ]
}

export function catalogReply(): ChatReply {
  return {
    text: applyBotText('catalog', 'Te muestro el catálogo. Elige cómo quieres verlo.'),
    actions: catalogStepActions(),
  }
}

function productWords(label: string, id: string) {
  return `${label} ${id}`
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 2)
}

function matchingProducts(tokens: readonly string[]) {
  return CATALOG_PRODUCTS.filter((product) => {
    const words = productWords(product.label, product.id)
    return tokens.some((token) =>
      words.some((word) => word === token || word.startsWith(token) || token.startsWith(word)),
    )
  })
}

export function productReply(tokens: readonly string[]): ChatReply | null {
  const hits = matchingProducts(tokens)
  if (hits.length === 0) return null

  const term = findTerm(tokens, CATALOG_PART_TERMS) || hits[0].label
  const versions = [
    'Hay varias coincidencias en el catálogo. Dime la marca o el modelo del vehículo para afinar.',
    'Encontré más de una opción. Para acotar, indícame la marca y el modelo.',
    'Esa consulta coincide con varios productos. Dime la marca o el modelo para ubicar el correcto.',
    'Puedo afinar esa coincidencia. Dime la marca y el modelo del vehículo.',
    'Hay varias fichas parecidas. Dime la marca o el modelo y te oriento mejor.',
  ]

  return {
    text: guidedText('product', versions[0], versions, { term }),
    actions: [
      { href: CATALOG_PATH, label: 'Ver en catálogo' },
      {
        href: whatsappHref(`Hola, busco ${term}. Te indico marca y modelo del vehículo.`),
        label: 'Hablar con un asesor',
        external: true,
      },
    ],
  }
}

export function hasProductTerm(tokens: readonly string[]) {
  return Boolean(findTerm(tokens, CATALOG_PART_TERMS))
}

export function namedPartReply(tokens: readonly string[]): ChatReply | null {
  const part = findTerm(tokens, OTHER_PART_TERMS)
  if (!part) return null

  return {
    text: applyBotText('namedPart', `${labelOf(part)} no tiene ficha en este chat. ${askToNarrow(part)} Un asesor confirma el precio y el stock.`, { term: labelOf(part) }),
    actions: [
      {
        href: whatsappHref(`Hola, quiero consultar el repuesto: ${part}`),
        label: 'Consultar repuesto',
        external: true,
      },
      { href: CATALOG_PATH, label: 'Ver catálogo' },
    ],
  } 
}

export function partsReply(): ChatReply {
  return {
    text: applyBotText('parts', `Estos son los repuestos publicados: ${catalogSummary()}. Dime qué pieza buscas.`, { catalog: catalogSummary() }),
    actions: [
      { href: CATALOG_PATH, label: 'Ver catálogo' },
      {
        href: whatsappHref('Hola, quiero consultar un repuesto.'),
        label: 'Consultar por WhatsApp',
        external: true,
      },
    ],
  }
}

export function accessoryReply(tokens: readonly string[] = []): ChatReply {
  const accessory = findTerm(tokens, ACCESSORY_TERMS)
  const named = accessory ? labelOf(accessory) : 'Accesorios'

  return {
    text: applyBotText('accessory', `${named} no tiene ficha en este chat. ${askToNarrow(accessory || 'el accesorio')}`, { term: named }),
    actions: [
      {
        href: whatsappHref(accessory ? `Hola, quiero consultar el accesorio: ${accessory}` : 'Hola, quiero consultar accesorios.'),
        label: 'Consultar accesorio',
        external: true,
      },
    ],
  }
}

export function socialReply(): ChatReply {
  return {
    text: applyBotText('social', `Nos encuentras en ${LANDING_CONTACT.social.map((item) => item.label).join(', ')}.`, {
      social: LANDING_CONTACT.social.map((item) => item.label).join(', '),
    }),
    actions: LANDING_CONTACT.social.map((item) => ({
      href: item.href,
      label: item.label,
      external: true,
    })),
  }
}

export function thanksReply(): ChatReply {
  return {
    text: applyBotText('thanks', 'Con gusto. Dime si necesitas otra consulta.'),
    actions: [],
  }
}

export function attentionReply(): ChatReply {
  return {
    text: applyBotText('attention', `Te atiendo. Dime el producto o la referencia, o escríbenos por WhatsApp al ${LANDING_CONTACT.phoneDisplay}.`, {
      phone: LANDING_CONTACT.phoneDisplay,
    }),
    actions: [
      {
        href: whatsappHref('Hola, quiero atención de un asesor.'),
        label: 'Hablar con un asesor',
        external: true,
      },
      { href: CATALOG_PATH, label: 'Ver catálogo' },
    ],
  }
}

export function complaintReply(): ChatReply {
  return {
    text: applyBotText('complaint', `Lamentamos el inconveniente. Cuéntame qué pasó y te ayudo. También puedes escribir al ${LANDING_CONTACT.phoneDisplay} o a ${LANDING_CONTACT.email}.`, {
      phone: LANDING_CONTACT.phoneDisplay,
      email: LANDING_CONTACT.email,
    }),
    actions: [
      {
        href: whatsappHref('Hola, quiero registrar una queja o reclamo.'),
        label: 'Enviar queja por WhatsApp',
        external: true,
      },
      { href: `mailto:${LANDING_CONTACT.email}?subject=Queja%20o%20reclamo`, label: 'Escribir al correo' },
    ],
  }
}

export function quoteReply(tokens: readonly string[] = []): ChatReply {
  const term = findTerm(tokens, [...CATALOG_PART_TERMS, ...OTHER_PART_TERMS, ...ACCESSORY_TERMS])
  const named = term ? labelOf(term) : 'ese producto'
  return {
    text: applyBotText('quote', `No confirmo el precio ni el stock de ${named} en este chat. ${askToNarrow(term || 'el producto')}`, {
      term: named,
    }),
    actions: [
      {
        href: whatsappHref('Hola, quiero cotizar un producto.'),
        label: 'Pedir cotización',
        external: true,
      },
      { href: CATALOG_PATH, label: 'Ver catálogo' },
    ],
  }
}

export function vacancyReply(): ChatReply {
  return {
    text: applyBotText('vacancy', 'Las vacantes están publicadas en Trabaja con nosotros.'),
    actions: [{ href: VACANCY_PATH, label: 'Ver vacantes' }],
  }
}

export function locationReply(): ChatReply {
  return {
    text: applyBotText('location', `Puedes visitarnos en ${LANDING_CONTACT.address}.`, { address: LANDING_CONTACT.address }),
    actions: [
      { href: LANDING_CONTACT.mapsShareUrl, label: 'Abrir mapa', external: true },
      {
        href: whatsappHref('Hola, quiero indicaciones para llegar.'),
        label: 'Pedir indicaciones',
        external: true,
      },
    ],
  }
}

export function companyReply(): ChatReply {
  return {
    text: applyBotText('company', `Puedes conocer nuestra visión, el equipo y marcas como ${visibleBrands().slice(0, 3).map((item) => item.name).join(', ')}.`, {
      brands: visibleBrands().slice(0, 3).map((item) => item.name).join(', '),
    }),
    actions: [
      { href: '/#vision', label: 'Visión' },
      { href: '/#equipo', label: 'Equipo' },
      { href: '/#marcas', label: 'Marcas' },
    ],
  }
}

export function greetingReply(): ChatReply {
  return {
    text: getBotSettings().welcome.trim() || 'Hola, bienvenido al chat Premium. Cuéntanos tu duda o el motivo de la consulta.',
    actions: [],
  }
}

export function insultUnmatchedReply(): ChatReply {
  return {
    text: applyBotText('insult', 'Esa expresión no es una consulta. Dime el producto o el motivo, con respeto.'),
    actions: [
      { href: CATALOG_PATH, label: 'Ver catálogo' },
      {
        href: whatsappHref('Hola, quiero una consulta de productos.'),
        label: 'Hablar con un asesor',
        external: true,
      },
    ],
  }
}

export function sexualUnmatchedReply(): ChatReply {
  return {
    text: applyBotText('sexual', 'Eso no es una consulta de este chat. Dime el producto que buscas.'),
    actions: [{ href: CATALOG_PATH, label: 'Ver catálogo' }],
  }
}

export function violenceUnmatchedReply(word: string): ChatReply {
  return {
    text: applyBotText('violence', `${labelOf(word)} no es un tema de este chat. Dime si buscas un repuesto.`, { term: labelOf(word) }),
    actions: [
      { href: CATALOG_PATH, label: 'Ver catálogo' },
      {
        href: whatsappHref('Hola, quiero consultar un producto de Importadora Premium.'),
        label: 'Hablar con un asesor',
        external: true,
      },
    ],
  }
}

export function foodUnmatchedReply(word: string): ChatReply {
  return {
    text: applyBotText('food', `${labelOf(word)} no es un producto de este chat. Aquí atendemos repuestos, así que dime la pieza.`, { term: labelOf(word) }),
    actions: [
      { href: CATALOG_PATH, label: 'Ver catálogo' },
      {
        href: whatsappHref('Hola, quiero consultar un repuesto. Te indico marca y modelo.'),
        label: 'Hablar con un asesor',
        external: true,
      },
    ],
  }
}

export function creatureUnmatchedReply(word: string): ChatReply {
  return {
    text: applyBotText('creature', `${labelOf(word)} no es un repuesto. Dime la pieza que buscas.`, { term: labelOf(word) }),
    actions: [
      { href: CATALOG_PATH, label: 'Ver catálogo' },
      {
        href: whatsappHref('Hola, quiero consultar un repuesto para mi vehículo.'),
        label: 'Hablar con un asesor',
        external: true,
      },
    ],
  }
}

export function vehicleUnmatchedReply(word: string): ChatReply {
  const label = labelOf(word)
  return {
    text: applyBotText('vehicle', `${label} es un vehículo, no un producto. Dime la marca, el modelo y la pieza.`, { term: label }),
    actions: [
      { href: CATALOG_PATH, label: 'Ver catálogo' },
      {
        href: whatsappHref(`Hola, busco un repuesto para mi ${word}. Te indico marca y modelo.`),
        label: 'Hablar con un asesor',
        external: true,
      },
    ],
  }
}

function memberWhatsapp(member: LandingTeamMember) {
  const digits = member.whatsappDigits || member.phoneDisplay.replace(/\D/g, '')
  return digits ? `https://wa.me/${digits}` : LANDING_CONTACT.whatsappUrl
}

function rolePhrase(role: string) {
  const clean = role.trim()
  if (!clean) return 'parte del equipo'
  return clean.charAt(0).toLowerCase() + clean.slice(1)
}

function joinNames(names: string[]) {
  if (names.length <= 1) return names[0] ?? ''
  if (names.length === 2) return `${names[0]} y ${names[1]}`
  return `${names.slice(0, -1).join(', ')} y ${names[names.length - 1]}`
}

function describeMember(member: LandingTeamMember) {
  const role = rolePhrase(member.role)
  const phone = member.phoneDisplay || 'el número del equipo'
  return applyBotText('teamMember', `${member.fullName} es ${role}. Puedes escribirle al ${phone}.`, {
    name: member.fullName,
    role,
    phone,
    term: member.fullName,
  })
}

export function teamMatchReply(match: Exclude<TeamMatch, null>): ChatReply {
  if (match.type === 'member') {
    const listed = match.members.slice(0, 4)
    const lines = listed.map(describeMember)
    const more =
      match.members.length > listed.length
        ? ` Hay ${match.members.length - listed.length} coincidencias más en el equipo.`
        : ''
    const text = listed.length === 1 ? lines[0] : `Encontré a estas personas. ${lines.join(' ')}`
    return {
      text: `${text}${more}`,
      actions: [
        { href: memberWhatsapp(listed[0]), label: `WhatsApp de ${listed[0].fullName}`, external: true },
        { href: '/#equipo', label: 'Ver equipo' },
      ],
    }
  }

  if (match.type === 'group') {
    const shown = match.members.slice(0, 8).map((member) => member.fullName)
    const extra = match.members.length > shown.length ? ` y ${match.members.length - shown.length} más` : ''
    const group = groupLabel(match.group).toLowerCase()
    const names = `${joinNames(shown)}${extra}`
    return {
      text:
        match.members.length === 0
          ? applyBotText('teamEmpty', `Por ahora no hay ${group} en el equipo.`, { group })
          : applyBotText('teamGroup', `En el grupo de ${group} están ${names}. Dime un nombre y te doy el teléfono.`, {
              group,
              names,
              term: names,
            }),
      actions: [{ href: '/#equipo', label: 'Ver equipo' }],
    }
  }

  const role = rolePhrase(match.member.role)
  const phone = match.member.phoneDisplay || 'el número del equipo'
  return {
    text: applyBotText(
      'teamSuggest',
      `No encuentro a ${labelOf(match.asked)}. ¿Te refieres a ${match.member.fullName}? Es ${role} y puedes escribirle al ${phone}.`,
      {
        asked: labelOf(match.asked),
        name: match.member.fullName,
        role,
        phone,
      },
    ),
    actions: [
      { href: memberWhatsapp(match.member), label: `WhatsApp de ${match.member.fullName}`, external: true },
      { href: '/#equipo', label: 'Ver equipo' },
    ],
  }
}

export function personUnmatchedReply(word: string): ChatReply {
  const label = labelOf(word)
  return {
    text: applyBotText('person', `${label} no está en el equipo ni en el catálogo. Dime si es un nombre o una pieza.`, { term: label }),
    actions: [
      { href: '/#equipo', label: 'Ver equipo' },
      {
        href: whatsappHref(`Hola, mi consulta está relacionada con el nombre ${word}.`),
        label: 'Hablar con un asesor',
        external: true,
      },
    ],
  }
}

function quoteTerm(value: string) {
  const clean = value.trim()
  if (!clean) return 'eso'
  return clean.length > 40 ? `${clean.slice(0, 37)}…` : clean
}

function pickVersion(seed: string, versions: readonly string[]) {
  const index = [...seed].reduce((sum, char) => sum + char.charCodeAt(0), 0) % versions.length
  return versions[index] || versions[0]
}

function guidedText(id: string, defaultText: string, versions: readonly string[], vars: Record<string, string>) {
  const stored = getBotSettings().replies[id]?.text?.trim()
  const source = stored && stored !== defaultText ? stored : pickVersion(vars.term || id, versions)
  return Object.entries(vars).reduce((text, [key, value]) => text.split(`{${key}}`).join(value), source)
}

export function companyHintReply(word: string): ChatReply {
  const term = quoteTerm(word)
  const versions = [
    `"${term}" se refiere a nosotros, Importadora Premium. Esa palabra sola no me dice qué necesitas. Escribe la pieza, la marca y el modelo, por ejemplo pastillas AKT.`,
    `Estás hablando de la empresa, no de un producto. Dime si buscas una pieza, el catálogo, el equipo o cómo contactarnos.`,
    `Importadora Premium somos nosotros. Para ayudarte escribe la pieza y el modelo del vehículo, o dime si quieres ubicación, horario o un asesor.`,
  ]
  const defaultText = '"{term}" se refiere a nosotros, Importadora Premium. Esa palabra sola no me dice qué necesitas. Escribe la pieza, la marca y el modelo, por ejemplo pastillas AKT.'
  return {
    text: guidedText('fallbackCompany', defaultText, versions, { term }),
    actions: [
      { href: CATALOG_PATH, label: 'Ver catálogo' },
      { href: '/#equipo', label: 'Ver equipo' },
      {
        href: whatsappHref('Hola, quiero consultar un producto. Te indico la pieza, la marca y el modelo.'),
        label: 'Hablar con un asesor real',
        external: true,
      },
    ],
  }
}

export function fallbackReply(entered = ''): ChatReply {
  const raw = entered.trim()
  const words = raw.split(/\s+/).filter(Boolean)
  const longest = words.reduce((max, word) => Math.max(max, word.length), 0)
  const mixed = /[a-záéíóúñ]/.test(raw) && /[A-ZÁÉÍÓÚÑ]/.test(raw)
  const shown = quoteTerm(raw)

  let text = guidedText(
    'fallback',
    'No ubiqué "{term}" como pieza, marca o modelo. Escríbelo así: la pieza, la marca y el modelo del vehículo.',
    [
      `No ubiqué "${shown}" como pieza, marca o modelo. Escríbelo así: la pieza, la marca y el modelo del vehículo.`,
      `Con "${shown}" no me alcanza. No lo repitas solo. Agrégale qué pieza buscas y para qué moto o carro.`,
      `No alcancé a relacionar "${shown}". Dime una de estas tres cosas: la pieza, la marca o el modelo.`,
    ],
    { term: shown },
  )

  if (mixed && raw.length <= 80) {
    text = guidedText(
      'fallbackMixed',
      'No entendí "{term}" con mayúsculas mezcladas. Escríbelo normal y agrega la pieza o el producto.',
      [
        `No entendí "${shown}" con mayúsculas mezcladas. Escríbelo normal y agrega la pieza o el producto.`,
        `"${shown}" mezcla mayúsculas y minúsculas. Escríbelo de forma normal y dime la pieza, la marca o el modelo.`,
      ],
      { term: shown },
    )
  } else if (raw.length > 80 || words.length > 8) {
    text = guidedText(
      'fallbackWide',
      'El mensaje es muy largo y no lo relacioné. Déjalo en una frase con la pieza y el modelo, por ejemplo pastillas para AKT 125.',
      [
        'El mensaje es muy largo y no lo relacioné. Déjalo en una frase con la pieza y el modelo, por ejemplo pastillas para AKT 125.',
        'Hay demasiada información junta. Resume en una frase: qué pieza buscas y el modelo del vehículo.',
      ],
      { term: shown },
    )
  } else if (words.length <= 2 && longest >= 10) {
    text = guidedText(
      'fallbackLong',
      '"{term}" no la ubiqué como pieza ni como dato de la empresa. Si es una pieza, escríbela completa; si no, dime la marca y el modelo.',
      [
        `"${shown}" no la ubiqué como pieza ni como dato de la empresa. Si es una pieza, escríbela completa; si no, dime la marca y el modelo.`,
        `"${shown}" es larga y no la relacioné. No la repitas igual. Dime la pieza con su nombre de catálogo, o la marca y el modelo.`,
      ],
      { term: shown },
    )
  } else if (!raw || raw.length <= 4 || (words.length === 1 && raw.length <= 5)) {
    text = guidedText(
      'fallbackShort',
      '"{term}" es muy corta y no me sirve sola. Escribe el nombre de la pieza y el modelo, por ejemplo filtro AKT.',
      [
        `"${shown || 'eso'}" es muy corta y no me sirve sola. Escribe el nombre de la pieza y el modelo, por ejemplo filtro AKT.`,
        `"${shown || 'eso'}" no me da un dato útil. Evita una sola sílaba. Escribe la pieza y la marca o el modelo del vehículo.`,
      ],
      { term: shown || 'eso' },
    )
  }

  return {
    text,
    actions: catalogStepActions(),
  }
}
