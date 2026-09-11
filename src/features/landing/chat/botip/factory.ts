import { CATALOG_PRODUCTS } from '../../catalogProducts'
import { CATALOG_OPTIONS, LANDING_CONTACT, LANDING_PAYMENTS } from '../../content'
import {
  ACCESSORY_TERMS,
  CATALOG_PART_TERMS,
  GENERIC_PART_TOKENS,
  OTHER_PART_TERMS,
  PART_ALIASES,
  WEAK_LEXEMES,
} from '../motoParts'
import { DEFAULT_BOT_SETTINGS, TEXTS_EN, type BotSettings } from '../botSettings'
import {
  CREATURE_TERMS,
  FOOD_TERMS,
  INSULT_STEMS,
  PERSON_NAMES,
  SEXUAL_STEMS,
  VEHICLE_ALIASES,
  VEHICLE_TERMS,
  VIOLENCE_TERMS,
} from '../unmatchedKind'
import {
  ASIDE_INTENT_LIST,
  BROAD_PRICE_LIST,
  CHOOSE_CUE_LIST,
  COMPLAINT_CUE_LIST,
  CREDIT_CUE_LIST,
  FOCUS_OK_LIST,
  FOLLOW_CUE_LIST,
  LOCATION_CUE_LIST,
  ORDER_STATUS_CUE_LIST,
  PAYMENT_CUE_LIST,
  PRICE_CUE_LIST,
  PURCHASE_CUE_LIST,
  SHIPPING_CUE_LIST,
  SOCIAL_GREET,
  SOCIAL_THANKS,
  SWITCH_CUE_LIST,
} from '../conversationThread'
import { COMPLAINT_LOCK_LIST, TYPO_ALIASES } from '../matchIntent'
import { HOME_PLACE_LIST, HOUR_WORD_LIST, OTHER_CITY_LIST } from '../intents'
import { ROLE_WORDS, TEAM_ALL_LIST, TEAM_FILLER_LIST } from '../teamLookup'
import landingTeam from '@/mocks/landingTeam.json'
import { mockProducts } from '@/mocks/data'
import marcasLogos from '@/data/landing/marcasLogos.json'
import { documentFromSettings, type BotDocument } from './schema'
import { defaultSliderValues } from './sliders'

const RULES = {
  decisionRules: [
    'continue: el visitante sigue en la misma pieza (precio, esa, y el). Se mezclan tokens del foco.',
    'switch: otra familia de pieza (pastilla ≠ banda ≠ disco ≠ aceite). Se limpia el producto anterior.',
    'aside: ubicación, horario, crédito, pago, envíos/domicilio, estado de pedido, listado general de precios. No roba el foco del producto.',
    'crédito / Sistecrédito: solo clientes Premium con trayectoria. No es queja ni pago.',
    'pago / medios de pago: efectivo o transferencia. No mezclar ficha de precios.',
    'envíos: a todo el país; gratis en el área metropolitana si la compra es mayor a $250.000 COP; mismo día; seguros hasta la puerta. No inventar contraentrega.',
    'estado de pedido: el chat no rastrea pedidos. Se consulta con el vendedor o el usuario cliente Premium. No pedir la pieza.',
    'Alcance: productos del MD, equipo (asesores y administrativos), horarios, sede, envíos, vacantes, empresa. El chat informa; no vende ni crea envíos.',
    'vendedor, gerente o ejecutivo se orientan al grupo de asesores. En Premium hay varios roles publicados: asesores y administrativos.',
    'WhatsApp o asesor solo si piden contacto, al validar un precio, en queja o al handoff. No en saludo, horario, envío, empresa, vacantes ni rectify.',
    'comprar u obtener + pieza (o typo de pieza) es producto, no pago. comprar/obtener sin pieza no es cuenta bancaria.',
    'Si el visitante nombra un producto, una descripción o un precio de las fichas recién mostradas, responder solo esa ficha. No repetir el listado de la familia.',
    'comprar + ficha concreta de lastOffers es continue de producto, no aside de pago. Cómo comprar o medios de pago sigue siendo aside.',
    'quería saber qué marcas manejan: empresa, no queja. No corregir queria → queja.',
    'freno solo: preguntar pastillas, bandas o discos.',
  ],
  pipelinePhases: [
    'prepare (normalizar, idioma, calidad)',
    'classifyTurn (continue / switch / aside / fresh / social)',
    'extractEntities (familias, sin mezclar en switch)',
    'matchers + rank',
    'composeReply + anti-repetición',
  ],
  scoringRules: [
    'Match exacto de keyword vale más que parcial; parcial más que distancia de edición.',
    'No corregir palabras comunes hacia queja, reclamo o garantía.',
    'Inventario y catálogo se filtran por familia de pieza.',
    'Una ficha de lastOffers gana si el nombre o el precio coinciden de forma única; un precio único desempata nombres mezclados.',
    'El tope de score es 10.',
  ],
  antiRepeat: [
    'No repetir el mismo texto en la ventana de respuestas.',
    'Rotar variantes de plantilla salvo formalidad alta.',
  ],
  streaks: [
    'Ráfaga de mensajes iguales puede bloquear un tiempo.',
    'Keyword repetida pide concreción o cambia el texto.',
  ],
  errors: [
    'Sin match: rectificar (typo, foco o pedir pieza). Fallback + menú solo al segundo fallo.',
    'Varios fallbacks: menú.',
    'Más errores: ofrecer asesor humano.',
  ],
  entities: [
    'pieza, producto, namedPart, accesorio, familia, conversationFocus, lastOffers.',
    'lastOffers guarda las fichas recién listadas. Si el visitante nombra una, el foco pasa a ese producto.',
    'En switch no se hereda producto ni pieza anterior.',
  ],
  confirmations: [
    'sí / no confirman la opción pendiente.',
    '1 / 2 y el texto del botón eligen producto o asesor.',
  ],
  suggestions: [
    'Acciones: catálogo, mapa, validar precio, WhatsApp solo en contacto/queja/handoff.',
    'Máximo tres acciones visibles.',
  ],
  systemNotes: [
    'Bienvenida, despedida, menú y handoff salen de las plantillas.',
    'El archivo botIP.md es la fuente de las respuestas, el catálogo, el inventario, el equipo y el léxico.',
    'Fuera de alcance: vender, crear envío, estado de pedido, inventar datos. El chat prepara; el asesor cierra.',
  ],
}

function settingsWithEnglish(): BotSettings {
  const replies = Object.fromEntries(
    Object.entries(DEFAULT_BOT_SETTINGS.replies).map(([id, reply]) => [
      id,
      reply.textsEn?.length ? reply : { ...reply, textsEn: TEXTS_EN[id] },
    ]),
  )
  return { ...DEFAULT_BOT_SETTINGS, replies }
}

export function buildFactoryDocument(): BotDocument {
  const team = (
    landingTeam as Array<{
      id: string
      fullName: string
      role: string
      phoneDisplay: string
      whatsappDigits: string
      group: string
      status: string
      sortOrder?: number
    }>
  )
    .filter((item) => item.status === 'publicado')
    .map((item) => ({
      id: item.id,
      fullName: item.fullName,
      role: item.role,
      phoneDisplay: item.phoneDisplay,
      whatsappDigits: item.whatsappDigits,
      group: item.group,
      status: item.status,
      sortOrder: item.sortOrder ?? 0,
    }))

  const marcas = (marcasLogos as { marcas?: Record<string, string> }).marcas ?? {}

  return documentFromSettings(settingsWithEnglish(), {
    origin: 'original',
    sliders: defaultSliderValues(),
    identity: {
      name: 'botIP',
      role: 'Asistente de Importadora Premium',
      language: 'es',
      tone: 'claro y cercano',
      formality: 3,
      naturalness: 3,
    },
    ...RULES,
    lexicon: {
      catalogParts: [...CATALOG_PART_TERMS],
      otherParts: [...OTHER_PART_TERMS],
      accessories: [...ACCESSORY_TERMS],
      weakLexemes: [...WEAK_LEXEMES],
      aliases: Object.keys(PART_ALIASES),
      partAliases: PART_ALIASES,
      typoAliases: TYPO_ALIASES,
      complaintLock: [...COMPLAINT_LOCK_LIST],
      genericTokens: [...GENERIC_PART_TOKENS],
      vehicles: [...VEHICLE_TERMS],
      vehicleAliases: VEHICLE_ALIASES,
      families: ['pastilla_freno', 'banda_freno', 'disco_freno', 'mordaza_freno', 'rin', 'llanta', 'aceite'],
      followCues: [...FOLLOW_CUE_LIST],
      switchCues: [...SWITCH_CUE_LIST],
      asideIntents: [...ASIDE_INTENT_LIST],
      focusOkIntents: [...FOCUS_OK_LIST],
      locationCues: [...LOCATION_CUE_LIST],
      hourWords: [...HOUR_WORD_LIST],
      homePlace: [...HOME_PLACE_LIST],
      otherCities: [...OTHER_CITY_LIST],
      insultStems: [...INSULT_STEMS],
      sexualStems: [...SEXUAL_STEMS],
      violenceTerms: [...VIOLENCE_TERMS],
      foodTerms: [...FOOD_TERMS],
      creatureTerms: [...CREATURE_TERMS],
      personNames: [...PERSON_NAMES],
      roleWords: ROLE_WORDS,
      teamFillers: [...TEAM_FILLER_LIST],
      teamAllWords: [...TEAM_ALL_LIST],
      socialGreet: [...SOCIAL_GREET],
      socialThanks: [...SOCIAL_THANKS],
      broadPrice: [...BROAD_PRICE_LIST],
      priceCues: [...PRICE_CUE_LIST],
      creditCues: [...CREDIT_CUE_LIST],
      paymentCues: [...PAYMENT_CUE_LIST],
      purchaseCues: [...PURCHASE_CUE_LIST],
      shippingCues: [...SHIPPING_CUE_LIST],
      orderStatusCues: [...ORDER_STATUS_CUE_LIST],
      chooseCues: [...CHOOSE_CUE_LIST],
      complaintCues: [...COMPLAINT_CUE_LIST],
    },
    catalog: {
      contact: LANDING_CONTACT,
      payments: LANDING_PAYMENTS,
      shipping: {
        nationwide: true,
        freeMetroFrom: '250.000',
        sameDay: true,
        doorSafe: true,
        cityScope: 'área metropolitana',
      },
      catalogLines: CATALOG_OPTIONS.map((item) => ({ id: item.id, label: item.label })),
      catalogProducts: CATALOG_PRODUCTS.map((item) => ({
        id: item.id,
        label: item.label,
        description: item.description,
      })),
      inventory: mockProducts.map((item) => ({
        id: item.id,
        codigo: item.codigo,
        nombre: item.nombre,
        descripcion: item.descripcion,
        modelo: item.modelo,
        cantidad: item.cantidad,
        precioEmpresarial: item.precios[0]?.empresarial ?? 0,
        status: item.status,
        bodega: item.bodega,
      })),
      team,
      brands: Object.keys(marcas).map((name) => ({ name })),
    },
  })
}
