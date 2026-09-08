const STORAGE_KEY = 'botip-settings'

export type BotReplyConfig = {
  keywords: string
  text: string
}

export type BotSettings = {
  minChars: number
  maxChars: number
  blockMinutes: number
  burstLimit: number
  welcome: string
  replies: Record<string, BotReplyConfig>
}

export const BOT_REPLY_FIELDS: Array<{ id: string; label: string }> = [
  { id: 'catalog', label: 'Catálogo' },
  { id: 'whatsapp', label: 'WhatsApp / contacto' },
  { id: 'product', label: 'Producto del catálogo' },
  { id: 'parts', label: 'Repuestos' },
  { id: 'namedPart', label: 'Pieza sin ficha' },
  { id: 'accessory', label: 'Accesorio' },
  { id: 'attention', label: 'Atención / asesor' },
  { id: 'complaint', label: 'Queja' },
  { id: 'quote', label: 'Precio / stock' },
  { id: 'vacancy', label: 'Vacantes' },
  { id: 'location', label: 'Ubicación' },
  { id: 'company', label: 'Empresa' },
  { id: 'social', label: 'Redes' },
  { id: 'thanks', label: 'Gracias' },
  { id: 'greeting', label: 'Saludo (palabras clave)' },
  { id: 'insult', label: 'Insulto' },
  { id: 'sexual', label: 'Contenido no admitido' },
  { id: 'violence', label: 'Tema no admitido' },
  { id: 'food', label: 'Alimento' },
  { id: 'creature', label: 'No es repuesto' },
  { id: 'vehicle', label: 'Vehículo' },
  { id: 'person', label: 'Nombre no encontrado' },
  { id: 'fallback', label: 'Sin coincidencia' },
  { id: 'fallbackCompany', label: 'Palabra de la empresa' },
  { id: 'fallbackShort', label: 'Palabra corta sin coincidencia' },
  { id: 'fallbackLong', label: 'Palabra larga sin coincidencia' },
  { id: 'fallbackWide', label: 'Mensaje extenso sin coincidencia' },
  { id: 'fallbackMixed', label: 'Mayúsculas mezcladas' },
  { id: 'teamMember', label: 'Persona del equipo' },
  { id: 'teamGroup', label: 'Grupo del equipo' },
  { id: 'teamSuggest', label: 'Nombre parecido del equipo' },
  { id: 'teamEmpty', label: 'Grupo del equipo vacío' },
]

const DEFAULT_REPLIES: Record<string, BotReplyConfig> = {
  greeting: { keywords: 'hola, buenas, buenos, saludo, hey', text: '' },
  catalog: { keywords: 'catalogo, productos, surtido, linea', text: 'Te muestro el catálogo. Elige alguna opcion acontinuacion.' },
  whatsapp: { keywords: 'whatsapp, contacto, telefono, celular, correo, email, llamar, escribir', text: 'aqui tienes la informacion de contacto, puedes escribirnos por WhatsApp al {phone} o al correo {email}.' },
  product: { keywords: '', text: 'Hay varias coincidencias en el catálogo. Dime la marca o el modelo del vehículo para afinar.' },
  parts: { keywords: 'repuesto, repuestos, pieza, piezas, componente', text: 'Estos son algunos de nuestros productos: {catalog}. Dime qué pieza buscas.' },
  namedPart: { keywords: '', text: '{term} no tiene ficha en este chat. Dime la marca o el modelo, si quieres mas informacion te ayudo con un asesor real .' },
  accessory: { keywords: 'accesorio, accesorios', text: '{term} no tiene ficha en este chat. Dime la marca o el modelo.' },
  attention: { keywords: 'asesor, asesoria, pedido, comprar, obtener, atencion, ayuda, servicio', text: 'Te atiendo. Dime el producto o la referencia, o escríbenos por WhatsApp al {phone}.' },
  complaint: { keywords: 'queja, reclamo, reclamar, quejar, molestia, problema, garantia', text: 'Lamentamos el inconveniente. Cuéntame qué pasó y te ayudo. También puedes escribir al {phone} o a {email}.' },
  quote: { keywords: 'precio, precios, stock, cotizar, cotizacion, vale, cuesta, disponibilidad', text: 'No confirmo el precio ni el stock de {term} en este chat. Dime la marca o el modelo.' },
  vacancy: { keywords: 'vacante, vacantes, empleo, trabajo, postular, hoja', text: 'Las vacantes están publicadas en Trabaja con nosotros.' },
  location: { keywords: 'direccion, ubicacion, donde, sede, local', text: 'Puedes visitarnos en {address}.' },
  company: { keywords: 'vision, mision, equipo, nosotros, marca, marcas, empresa, quienes', text: 'Conoce mas sobre importadora premium,nuestro equipo y algunas de nuestras marcas aliadas' },
  social: { keywords: 'instagram, tiktok, facebook, redes, red', text: 'Puedes seguirnos en redes sociales: {social}.' },
  thanks: { keywords: 'gracias, gracia, adios, chao, bye', text: 'Con gusto. Dime si necesitas otra consulta, estoy a tu servicio.' },
  insult: { keywords: '', text: 'Esa expresión no es una consulta. Dime el producto o el motivo, con respeto por favor o bloqueare el chat.' },
  sexual: { keywords: '', text: 'Eso no es una consulta de este chat. Dime el producto que buscas.' },
  violence: { keywords: '', text: '{term} no es un tema de este chat. Dime si buscas un repuesto.' },
  food: { keywords: '', text: '{term} no es un producto de este chat. Aquí atendemos repuestos, así que dime la pieza.' },
  creature: { keywords: '', text: '{term} no es un repuesto. Dime la pieza que buscas.' },
  vehicle: { keywords: '', text: '{term} es un vehículo, no un producto. Dime la marca, el modelo y la pieza.' },
  person: { keywords: '', text: '{term} no está en el equipo ni en el catálogo. Dime si es un nombre o una pieza.' },
  fallback: { keywords: '', text: 'No ubiqué "{term}" como pieza, marca o modelo. Escríbelo así: la pieza, la marca y el modelo del vehículo. o elije alguna de las opciones acontinuacion.' },
  fallbackCompany: { keywords: '', text: '"{term}" se refiere a nosotros, Importadora Premium. Esa palabra sola no me dice qué necesitas. Escribe la pieza, la marca y el modelo, por ejemplo pastillas AKT.' },
  fallbackShort: { keywords: '', text: '"{term}" es muy corta y no me sirve sola. Escribe el nombre de la pieza y el modelo, por ejemplo filtro AKT.' },
  fallbackLong: { keywords: '', text: '"{term}" no la ubiqué como pieza ni como dato de la empresa. Si es una pieza, escríbela completa; si no, dime la marca y el modelo.' },
  fallbackWide: { keywords: '', text: 'El mensaje es muy largo y no lo relacioné. Déjalo en una frase con la pieza y el modelo, por ejemplo pastillas para AKT 125.' },
  fallbackMixed: { keywords: '', text: 'No entendí "{term}" con mayúsculas mezcladas. Escríbelo normal y agrega la pieza o el producto.' },
  teamMember: { keywords: '', text: '{name} es {role}. Puedes escribirle al {phone}.' },
  teamGroup: { keywords: '', text: 'En el grupo de {group} están {names}. Dime un nombre y te doy el teléfono.' },
  teamSuggest: { keywords: '', text: 'No encuentro a {asked}. ¿Te refieres a {name}? Es {role} y puedes escribirle al {phone}.' },
  teamEmpty: { keywords: '', text: 'Por ahora no hay {group} en el equipo.' },
}

export const DEFAULT_BOT_SETTINGS: BotSettings = {
  minChars: 3,
  maxChars: 250,
  blockMinutes: 5,
  burstLimit: 8,
  welcome: 'Hola, bienvenido al chat Premium. Cuéntanos tu duda o el motivo de la consulta.',
  replies: DEFAULT_REPLIES,
}

function cloneDefaults(): BotSettings {
  return JSON.parse(JSON.stringify(DEFAULT_BOT_SETTINGS)) as BotSettings
}

const LEGACY_REPLY_TEXT = new Set([
  '{term}',
  '{term}. Dime un nombre para el dato.',
  'Catálogo. Elige una opción:',
  'WhatsApp {phone}. Correo {email}.',
  '{term}: {names}. Indica marca o modelo para afinar.',
  'Encontré {term} en el catálogo: {names}. Dime la marca o el modelo para afinar la búsqueda.',
  '{term} coincide con varios productos en el catálogo, proporcioname mas detalles sobre el producto para poder ayudarte.',
  ' {term} coincide con varios productos en el catálogo, proporcioname mas detalles sobre el producto para poder ayudarte.',
  'Repuestos publicados: {catalog}. Dime la pieza.',
  '{term} no tiene ficha aquí. Indica marca o modelo. Precio y stock los confirma un asesor.',
  '{term} no tiene ficha aquí. Indica marca o modelo.',
  'Te atiendo. Dime el producto o la referencia. WhatsApp {phone}.',
  'Lamentamos el inconveniente. Cuéntame qué pasó. WhatsApp {phone} o {email}.',
  'Precio y stock{term} no los confirmo aquí. Indica marca o modelo.',
  'Visión, equipo y marcas ({brands}).',
  'Redes: {social}.',
  'Estamos en {address}.',
  'No tengo información sobre "{term}".proprocioname mas informacion o elije alguna de las opciones de abajo.',
  'No tengo información sobre "{term}". Dame más detalle o elige una de las opciones de abajo.',
  'No entontre coincidencia con "{term}". Dame más detalles o elige una opcione acontinuacion.',
  'No relacioné "{term}". Dime la pieza, la marca o el modelo.',
])

export function getBotSettings(): BotSettings {
  const base = cloneDefaults()
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return base
    const saved = JSON.parse(raw) as Partial<BotSettings>
    const replies = { ...base.replies }
    for (const [id, config] of Object.entries(saved.replies ?? {})) {
      const text = config?.text?.trim()
      if (text && LEGACY_REPLY_TEXT.has(text)) continue
      replies[id] = { ...base.replies[id], ...config }
    }
    return {
      ...base,
      ...saved,
      replies,
    }
  } catch {
    return base
  }
}

export function saveBotSettings(next: BotSettings) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
}

export function resetBotSettings() {
  window.localStorage.removeItem(STORAGE_KEY)
}

export function applyBotText(id: string, fallback: string, vars: Record<string, string | number> = {}) {
  const stored = getBotSettings().replies[id]?.text?.trim()
  const source = stored || fallback
  return Object.entries(vars).reduce(
    (text, [key, value]) => text.split(`{${key}}`).join(String(value)),
    source,
  )
}

export function keywordsOf(id: string, fallback: readonly string[]) {
  const raw = getBotSettings().replies[id]?.keywords
  if (!raw?.trim()) return [...fallback]
  return raw.split(',').map((item) => item.trim().toLowerCase()).filter(Boolean)
}
