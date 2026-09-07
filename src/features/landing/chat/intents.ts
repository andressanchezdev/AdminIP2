import { CATALOG_OPTIONS, LANDING_CONTACT, MARCA_ENTRIES } from '../content'
import { CATALOG_PRODUCTS } from '../catalogProducts'
import { ACCESSORY_TERMS, CATALOG_PART_TERMS, findTerm, OTHER_PART_TERMS } from './motoParts'

export type ChatAction = {
  href: string
  label: string
  external?: boolean
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

export const CHAT_INTENTS: readonly Intent[] = [
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
    keywords: ['direccion', 'ubicacion', 'mapa', 'donde', 'sede', 'local'],
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
  return CATALOG_OPTIONS.map((option) => option.label).join(', ')
}

function labelOf(term: string) {
  if (!term) return 'ese producto'
  return term.charAt(0).toUpperCase() + term.slice(1)
}

function askToNarrow(subject: string) {
  return `Si quieres, envíame más información sobre la marca o el modelo de ${subject}, o de la moto. También te puedo contactar con un asesor que te ayude a encontrar el repuesto indicado.`
}

export function whatsappReply(): ChatReply {
  return {
    text: `Claro que sí. Te atiendo por WhatsApp al ${LANDING_CONTACT.phoneDisplay} o al correo ${LANDING_CONTACT.email}. Para que el asesor llegue con una búsqueda más concreta, cuéntame qué producto buscas, la marca y el modelo de la moto, o el motivo de la consulta.`,
    actions: contactActions(),
  }
}

export function catalogReply(): ChatReply {
  return {
    text: `Claro que sí. El catálogo publicado de Importadora Premium incluye: ${catalogSummary()}. Esa lista es amplia, así que para concretar la búsqueda dime qué línea te interesa y, si la tienes, la marca y el modelo de la moto. Si prefieres, te contacto con un asesor.`,
    actions: [
      { href: CATALOG_PATH, label: 'Ver catálogo' },
      {
        href: whatsappHref('Hola, quiero información del catálogo. Te indico marca y modelo.'),
        label: 'Pedir asesoría',
        external: true,
      },
    ],
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
  const names = hits.slice(0, 3).map((product) => product.label).join(', ')

  return {
    text: `Claro que sí. ${labelOf(term)} es uno de los productos de Importadora Premium, en nuestro catálogo coinciden productos como: ${names}, etc. Si quieres, proporcióname más información sobre la marca o el modelo del producto o vehículo. O también te puedo contactar con un asesor que te ayude a encontrar el repuesto perfecto.`,
    actions: [
      { href: CATALOG_PATH, label: 'Ver en catálogo' },
      {
        href: whatsappHref(`Hola, busco ${term}. Te indico marca y modelo de la moto.`),
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
    text: `Claro que sí, te ayudo a buscar ${labelOf(part)}. Esa pieza no tiene ficha publicada en el catálogo, y el nombre solo deja mucho a la imaginación. ${askToNarrow(part)} No invento precio ni stock. WhatsApp ${LANDING_CONTACT.phoneDisplay}.`,
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
    text: `Claro que sí. Importadora Premium trabaja repuestos de moto. En el catálogo publicado están: ${catalogSummary()}. “Repuesto” deja mucho a la imaginación, así que dime qué pieza buscas y, si la tienes, la marca y el modelo de la moto. Si prefieres, te contacto con un asesor para ubicar la referencia. Precio y stock no los confirmo aquí.`,
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
  const named = accessory
    ? `${labelOf(accessory)} es un accesorio que podemos consultar, pero no tiene ficha en el catálogo publicado y el nombre deja mucho a la imaginación.`
    : 'Los accesorios no tienen ficha en el catálogo publicado y la palabra sola deja mucho a la imaginación.'

  return {
    text: `Claro que sí. ${named} ${askToNarrow(accessory || 'accesorio')} No invento precio ni existencia. WhatsApp ${LANDING_CONTACT.phoneDisplay}.`,
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
    text: `Claro que sí. Nos encuentras en ${LANDING_CONTACT.social.map((item) => item.label).join(', ')}. Si me dices cuál red quieres ver, o si tu consulta es de un producto, marca o modelo, te oriento con más precisión.`,
    actions: LANDING_CONTACT.social.map((item) => ({
      href: item.href,
      label: item.label,
      external: true,
    })),
  }
}

export function thanksReply(): ChatReply {
  return {
    text: 'Con gusto. Si quieres seguir, cuéntame la pieza, la marca y el modelo de la moto, o el motivo de la consulta, y afinamos la búsqueda.',
    actions: [],
  }
}

export function attentionReply(): ChatReply {
  return {
    text: `Claro que sí, te atiendo. Para no dejarte con una respuesta a medias, dime qué producto buscas, la marca y el modelo de la moto, o la referencia si ya la tienes. Si prefieres, te contacto ahora con un asesor por WhatsApp (${LANDING_CONTACT.phoneDisplay}).`,
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
    text: `Lamentamos el inconveniente. Para que una persona atienda el caso con datos concretos, cuéntame qué pasó, el producto y, si aplica, la marca o el modelo. No prometo una solución que no esté registrada aquí. Puedes seguir por WhatsApp al ${LANDING_CONTACT.phoneDisplay} o al correo ${LANDING_CONTACT.email}.`,
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
  const named = term ? ` Sobre ${labelOf(term)}, el` : ' El'
  return {
    text: `Claro que sí.${named} precio, el stock y la disponibilidad no los confirmo aquí para no darte un dato incompleto. ${askToNarrow(term || 'el producto')} WhatsApp ${LANDING_CONTACT.phoneDisplay}.`,
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
    text: 'Claro que sí. Las vacantes abiertas están en Trabaja con nosotros. Si me dices el cargo o el área que te interesa, te indico por dónde postularte. El detalle de cada vacante está en esa vista, no lo invento aquí.',
    actions: [{ href: VACANCY_PATH, label: 'Ver vacantes' }],
  }
}

export function locationReply(): ChatReply {
  return {
    text: `Claro que sí. Estamos en ${LANDING_CONTACT.address}. Si me dices si vienes en moto o necesitas cómo llegar, te dejo el mapa o te paso con un asesor para indicaciones.`,
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
    text: `Claro que sí. Importadora Premium importa, surte y acompaña con inventario real. En el inicio están visión, misión, el equipo y las marcas (${MARCA_ENTRIES.slice(0, 4).map((item) => item.name).join(', ')} y más). Dime si quieres saber de la empresa, de una marca o de un producto, y seguimos con ese dato.`,
    actions: [
      { href: '/#vision', label: 'Visión' },
      { href: '/#equipo', label: 'Equipo' },
      { href: '/#marcas', label: 'Marcas' },
    ],
  }
}

export function greetingReply(): ChatReply {
  return {
    text: 'Hola, bienvenido al chat Premium. Cuéntanos tu duda o el motivo de la consulta.',
    actions: [],
  }
}

export function fallbackReply(entered = ''): ChatReply {
  const word = entered.trim() || 'eso'
  return {
    text: `No tengo información sobre este "${word}". Para concretar la búsqueda, dime qué producto, marca o modelo es tu vehículo. O, si quieres, te muestro el catálogo o te contacto con un asesor por WhatsApp.`,
    actions: [
      { href: CATALOG_PATH, label: 'Ver catálogo' },
      {
        href: whatsappHref('Hola, tengo una duda y quiero más información.'),
        label: 'Escribir por WhatsApp',
        external: true,
      },
    ],
  }
}
