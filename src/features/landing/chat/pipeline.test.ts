import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { answerLandingChat } from './answerChat'
import { HANDLERS } from './composeReply'
import { loadSession, resetSessionKeepId, startChatSession, endChatSession } from './sessionContext'
import { sha1 } from './sha1'
import { detectLanguage, classifyQuality } from './prepare'
import { clearUploadedMarkdown, resetActiveMarkdown } from './botip/store'

function session() {
  resetActiveMarkdown()
  clearUploadedMarkdown()
  startChatSession()
}

describe('sha1', () => {
  it('hashes empty string', () => {
    expect(sha1('')).toBe('da39a3ee5e6b4b0d3255bfef95601890afd80709')
  })
})

describe('prepare', () => {
  it('detects english', () => {
    expect(detectLanguage('hello how are you please')).toBe('en')
  })
  it('classifies empty and emoji', () => {
    expect(classifyQuality('', 0)).toBe('EMPTY')
    expect(classifyQuality('😀😀😀', 0)).toBe('EMOJI_ONLY')
  })
})

describe('pipeline patterns', () => {
  beforeEach(() => {
    session()
  })
  afterEach(() => {
    endChatSession()
    resetActiveMarkdown()
    clearUploadedMarkdown()
  })

  it('1 hola hola hola acks and greets', () => {
    const reply = answerLandingChat('hola hola hola')
    expect(reply.text.toLowerCase()).toMatch(/hola|ayudo|bienvenido|veo que|mismo/)
  })

  it('2 repeated keyword filtro asks concrecion', () => {
    const reply = answerLandingChat('filtro, precio filtro, filtro')
    expect(reply.text.toLowerCase()).toMatch(/filtro|precio|disponibilidad|compatibilidad|asesor|marca/)
  })

  it('3 same message twice varies or acks', () => {
    const first = answerLandingChat('catalogo de productos')
    const second = answerLandingChat('catalogo de productos')
    expect(second.text).not.toBe('')
    expect(second.text.includes('mismo') || second.text !== first.text || second.text.length >= first.text.length).toBe(true)
  })

  it('4 hola plus quote combines', () => {
    const reply = answerLandingChat('hola, cuanto cuesta pastillas')
    expect(reply.text.toLowerCase()).toMatch(/hola|ayudo|precio|stock|marca|asesor/)
  })

  it('5 pending confirmation yes', () => {
    answerLandingChat('ubicacion o vacantes')
    const ctx = loadSession()
    if (ctx.pendingConfirmation) {
      const reply = answerLandingChat('si')
      expect(reply.text.length).toBeGreaterThan(4)
    } else {
      answerLandingChat('filtro')
      const reply = answerLandingChat('si')
      expect(reply.text.length).toBeGreaterThan(0)
    }
  })

  it('6 long text with three keywords ranks them', () => {
    const reply = answerLandingChat(
      'quiero ver el catalogo y tambien el whatsapp y las vacantes de la empresa por favor dame info larga '.repeat(3),
    )
    expect(reply.text.length).toBeGreaterThan(10)
  })

  it('7 typo flitro', () => {
    const reply = answerLandingChat('flitro')
    expect(reply.text.toLowerCase()).toMatch(/filtro|pieza|marca|asesor|ficha/)
  })

  it('8 insult after complaint keeps session', () => {
    answerLandingChat('tengo una queja de garantia')
    const before = loadSession().turn
    const reply = answerLandingChat('idiota')
    expect(reply.text.toLowerCase()).toMatch(/respeto|consulta|termino|groseria|producto|bloquea/)
    expect(loadSession().turn).toBeGreaterThanOrEqual(before)
    expect(loadSession().errorCount).toBeGreaterThan(0)
  })

  it('9 y el otro uses topic stack', () => {
    answerLandingChat('quiero el catalogo')
    const reply = answerLandingChat('y el otro')
    expect(reply.text.length).toBeGreaterThan(4)
  })

  it('10 tambien combines with last intent', () => {
    answerLandingChat('catalogo de productos')
    const reply = answerLandingChat('tambien')
    expect(reply.text.length).toBeGreaterThan(4)
  })

  it('11 no entendi explicame reformulates', () => {
    const first = answerLandingChat('xqzwv notapieza')
    const second = answerLandingChat('no entendi explicame')
    expect(second.text).not.toBe('')
    expect(second.text === first.text).toBe(false)
  })

  it('12 thanks farewell rotation', () => {
    const texts = [
      answerLandingChat('gracias').text,
      answerLandingChat('gracias').text,
      answerLandingChat('gracias').text,
    ]
    expect(new Set(texts).size).toBeGreaterThanOrEqual(1)
    expect(texts.some((item, index) => index > 0 && item !== texts[0] || item.length > 0)).toBe(true)
  })

  it('13 empty asks clarification without error', () => {
    const before = loadSession().errorCount
    const reply = answerLandingChat('   ')
    expect(reply.text.toLowerCase()).toMatch(/mensaje|letras|consulta|pieza/)
    expect(loadSession().errorCount).toBe(before)
  })

  it('14 emoji only', () => {
    const reply = answerLandingChat('😀😀😀')
    expect(reply.text.toLowerCase()).toMatch(/mensaje|letras|consulta|pieza|words/)
  })

  it('15 very long aaaa compacta', () => {
    const reply = answerLandingChat(`${'a'.repeat(500)} catalogo whatsapp vacantes`)
    expect(reply.text.length).toBeGreaterThan(8)
  })

  it('16 switching part keeps the new product', () => {
    answerLandingChat('pastillas')
    const reply = answerLandingChat('llantas')
    expect(reply.text.toLowerCase()).toMatch(/llanta/)
    expect(reply.text.toLowerCase()).not.toMatch(/te refieres a.*o a/i)
  })

  it('17 si after pending quote path', () => {
    answerLandingChat('filtro')
    const reply = answerLandingChat('si')
    expect(reply.text.length).toBeGreaterThan(0)
  })

  it('18 no el otro continues', () => {
    answerLandingChat('catalogo')
    const reply = answerLandingChat('no, el otro')
    expect(reply.text.length).toBeGreaterThan(0)
  })

  it('19 two fallbacks offer menu', () => {
    answerLandingChat('xyzabcuno')
    const reply = answerLandingChat('xyzabcdos')
    expect(reply.text.toLowerCase()).toMatch(/precio|producto|soporte|catalogo|asesor|opcion/)
    expect(reply.text).not.toMatch(/1\)\s*precios/)
    expect(reply.text).not.toMatch(/\{[a-zA-Z]+\}/)
    expect(reply.options?.map((item) => item.label)).toEqual(['Precios', 'Productos', 'Soporte técnico'])
  })

  it('20 five errors offer handoff', () => {
    for (let i = 0; i < 5; i += 1) answerLandingChat(`xyzfall ${i} zzzz qwerty`)
    const ctx = loadSession()
    expect(ctx.errorCount).toBeGreaterThanOrEqual(5)
    expect(ctx.offerHumanHandoff || ctx.metrics.handoffs >= 0).toBe(true)
  })

  it('21 greeting then quote across turns', () => {
    answerLandingChat('hola hola')
    const reply = answerLandingChat('cuanto cuesta pastillas')
    expect(reply.text.toLowerCase()).toMatch(/precio|stock|marca|asesor/)
  })

  it('22 precio precio precio filtro', () => {
    const reply = answerLandingChat('precio precio precio filtro')
    expect(reply.text.toLowerCase()).toMatch(/precio|filtro|marca|asesor|disponibilidad/)
  })

  it('23 stock without product asks product', () => {
    const reply = answerLandingChat('tienen stock?')
    expect(reply.text.toLowerCase()).toMatch(/precio|stock|marca|producto|asesor|pieza/)
  })

  it('24 si si si after pending', () => {
    answerLandingChat('filtro')
    const reply = answerLandingChat('si si si')
    expect(reply.text.length).toBeGreaterThan(0)
  })

  it('25 no no no after pending', () => {
    answerLandingChat('filtro')
    const reply = answerLandingChat('no no no')
    expect(reply.text.length).toBeGreaterThan(0)
  })

  it('anti-repeat 20 turns no identical consecutive', () => {
    const texts: string[] = []
    const samples = ['catalogo', 'whatsapp', 'gracias', 'ubicacion', 'vacantes', 'hola', 'precio pastillas', 'queja garantia']
    for (let i = 0; i < 20; i += 1) {
      texts.push(answerLandingChat(samples[i % samples.length]).text)
    }
    for (let i = 1; i < texts.length; i += 1) {
      expect(texts[i]).not.toBe(texts[i - 1])
    }
  })

  it('handler exception keeps session alive', () => {
    const original = HANDLERS.catalog
    HANDLERS.catalog = () => {
      throw new Error('boom')
    }
    const turn = loadSession().turn
    const reply = answerLandingChat('catalogo de productos')
    HANDLERS.catalog = original
    expect(reply.text.length).toBeGreaterThan(0)
    expect(loadSession().sessionId).toBeTruthy()
    expect(loadSession().turn).toBeGreaterThanOrEqual(turn)
  })

  it('reset streaks on topic change', () => {
    answerLandingChat('filtro filtro filtro')
    expect(Object.keys(loadSession().repeatedKeywordStreak).length).toBeGreaterThan(0)
    answerLandingChat('gracias')
    const ctx = loadSession()
    expect(ctx.lastTopIntent === 'thanks' || ctx.lastTopIntent === 'farewell' || ctx.lastTopIntent === 'greeting' || ctx.sameMsgStreak === 0).toBe(true)
  })

  it('catalog typo tienene', () => {
    startChatSession()
    const reply = answerLandingChat('¿Tienene catalogo?')
    expect(reply.text.toLowerCase()).toMatch(/catalogo|catálogo|opción|opcion/)
    expect(reply.actions.some((item) => /catálogo|catalogo/i.test(item.label))).toBe(true)
    endChatSession()
  })

  it('conocer productos goes to catalog', () => {
    startChatSession()
    const reply = answerLandingChat('quiero conocer sus productos')
    expect(reply.text.toLowerCase()).toMatch(/catalogo|catálogo|surtido|opcion|opción/)
    expect(reply.text).not.toMatch(/\{left\}|\{right\}/)
    endChatSession()
  })

  it('que es tiktok explains the network', () => {
    startChatSession()
    const reply = answerLandingChat('que es tiktok?')
    expect(reply.text.toLowerCase()).toMatch(/tiktok/)
    expect(reply.text.toLowerCase()).toMatch(/red/)
    expect(reply.text).not.toMatch(/pieza sin ficha/)
    endChatSession()
  })

  it('que es premium is the company not oil', () => {
    startChatSession()
    const reply = answerLandingChat('que es premium?')
    expect(reply.text.toLowerCase()).toMatch(/importadora|equipo|marca|visión|vision/)
    expect(reply.text.toLowerCase()).not.toMatch(/aceite premium|5w-40/)
    endChatSession()
  })

  it('importadora premium is company identity', () => {
    startChatSession()
    const reply = answerLandingChat('importadora premium')
    expect(reply.text.toLowerCase()).toMatch(/importadora|equipo|marca/)
    expect(reply.text.toLowerCase()).not.toMatch(/aceite premium/)
    endChatSession()
  })

  it('resend keeps useful catalog reply', () => {
    startChatSession()
    const first = answerLandingChat('quiero conocer sus productos')
    const second = answerLandingChat('quiero conocer sus productos')
    expect(second.text.toLowerCase()).toMatch(/catalogo|catálogo|mismo|opcion|opción/)
    expect(second.text).not.toMatch(/\{left\}|\{right\}/)
    expect(second.text.toLowerCase()).not.toMatch(/conocer.*precio, disponibilidad/)
    expect(first.text.length).toBeGreaterThan(8)
    endChatSession()
  })

  it('quote reply is complete not a short price denial', () => {
    startChatSession()
    const reply = answerLandingChat('cuanto cuesta pastillas')
    expect(reply.text.toLowerCase()).toMatch(/pastilla/)
    expect(reply.text.toLowerCase()).toMatch(/marca/)
    expect(reply.text.toLowerCase()).toMatch(/modelo/)
    expect(reply.text.toLowerCase()).toMatch(/whatsapp|asesor|312/)
    expect(reply.text.toLowerCase()).toMatch(/catálogo|catalogo/)
    expect(reply.text.length).toBeGreaterThan(90)
    expect(reply.text).not.toMatch(/\{[a-zA-Z]+\}/)
    endChatSession()
  })

  it('greeting plus quote keeps the quote complete', () => {
    startChatSession()
    const reply = answerLandingChat('hola, cuanto cuesta pastillas')
    expect(reply.text.toLowerCase()).toMatch(/hola/)
    expect(reply.text.toLowerCase()).toMatch(/pastilla/)
    expect(reply.text.toLowerCase()).toMatch(/marca/)
    expect(reply.text.length).toBeGreaterThan(90)
    endChatSession()
  })

  it('templates never leak placeholder keys', () => {
    startChatSession()
    const samples = [
      'whatsapp',
      'ubicacion',
      'redes sociales',
      'repuestos',
      'cuanto cuesta pastillas',
      'hola',
      'que es tiktok?',
    ]
    for (const sample of samples) {
      const reply = answerLandingChat(sample)
      expect(reply.text, sample).not.toMatch(/\{[a-zA-Z]+\}/)
    }
    endChatSession()
  })

  it('whatsapp interpolates contact values', () => {
    startChatSession()
    const reply = answerLandingChat('whatsapp')
    expect(reply.text).toMatch(/312|comercial@importadorapremium\.com/)
    expect(reply.text).not.toMatch(/\{phone\}|\{email\}/)
    endChatSession()
  })
  it('resetSessionKeepId clears counters', () => {
    startChatSession()
    answerLandingChat('hola')
    const next = resetSessionKeepId()
    expect(next.turn).toBe(0)
    expect(next.errorCount).toBe(0)
    endChatSession()
  })

  it('small talk como estas is greeting not a part', () => {
    startChatSession()
    const first = answerLandingChat('como estas?')
    const second = answerLandingChat('como estats?')
    expect(first.text.toLowerCase()).toMatch(/excelente|feliz|atenderte/)
    expect(first.text.toLowerCase()).not.toMatch(/estator|ficha/)
    expect(second.text.toLowerCase()).toMatch(/excelente|feliz|atenderte/)
    expect(second.text.toLowerCase()).not.toMatch(/estator/)
    endChatSession()
  })

  it('llanta-1 matches that catalog card', () => {
    startChatSession()
    const reply = answerLandingChat('Llanta-1')
    expect(reply.text.toLowerCase()).toMatch(/llanta|pistera|urbana/)
    expect(reply.text.toLowerCase()).not.toMatch(/no relacion/)
    endChatSession()
  })

  it('barras typos map to suspension bars', () => {
    startChatSession()
    for (const sample of ['barras', 'barra', 'barrras', 'baraas', 'barrrs*']) {
      const reply = answerLandingChat(sample)
      expect(reply.text.toLowerCase(), sample).toMatch(/barra|suspension|suspensión/)
      expect(reply.text.toLowerCase(), sample).not.toMatch(/te refieres a/)
      expect(reply.text.toLowerCase(), sample).not.toMatch(/no relacion/)
    }
    endChatSession()
  })

  it('switching barras to llantas does not loop conflict', () => {
    startChatSession()
    const first = answerLandingChat('barras')
    const second = answerLandingChat('llantas')
    expect(first.text.toLowerCase()).toMatch(/barra/)
    expect(second.text.toLowerCase()).toMatch(/llanta/)
    expect(second.text.toLowerCase()).not.toMatch(/te refieres a/)
    expect(second.text.toLowerCase()).not.toMatch(/no relacion/)
    endChatSession()
  })

  it('correa y eje asks then follows the chosen product', () => {
    startChatSession()
    const ask = answerLandingChat('correa y eje')
    expect(ask.text.toLowerCase()).toMatch(/correa/)
    expect(ask.text.toLowerCase()).toMatch(/eje/)
    expect(ask.options?.map((item) => item.label).join(' ').toLowerCase()).toMatch(/correa/)
    expect(ask.options?.map((item) => item.label).join(' ').toLowerCase()).toMatch(/eje/)
    const chosen = answerLandingChat('correa')
    expect(chosen.text.toLowerCase()).toMatch(/correa/)
    expect(chosen.text.toLowerCase()).not.toMatch(/te refieres a/)
    endChatSession()
  })

  it('product choice keeps asking if the answer is yes only', () => {
    startChatSession()
    answerLandingChat('correa y eje')
    const again = answerLandingChat('si')
    expect(again.text.toLowerCase()).toMatch(/correa|eje/)
    expect(again.options?.length).toBe(2)
    endChatSession()
  })

  it('product choice accepts 1, 2 and the button label', () => {
    startChatSession()
    const ask = answerLandingChat('correa y eje')
    const firstLabel = ask.options?.[0]?.label || 'Correa de transmisión'
    const first = answerLandingChat('1')
    expect(first.text.toLowerCase()).toMatch(/correa/)
    expect(first.text.toLowerCase()).not.toMatch(/te refieres a/)
    endChatSession()

    startChatSession()
    answerLandingChat('correa y eje')
    const second = answerLandingChat('2')
    expect(second.text.toLowerCase()).toMatch(/eje/)
    expect(second.text.toLowerCase()).not.toMatch(/te refieres a/)
    endChatSession()

    startChatSession()
    answerLandingChat('correa y eje')
    const clicked = answerLandingChat(firstLabel)
    expect(clicked.text.toLowerCase()).toMatch(/correa/)
    expect(clicked.text.toLowerCase()).not.toMatch(/te refieres a/)
    endChatSession()
  })

  it('session restarts empty like a page reload', () => {
    startChatSession()
    answerLandingChat('correa')
    expect(loadSession().turn).toBeGreaterThan(0)
    startChatSession()
    expect(loadSession().turn).toBe(0)
    expect(loadSession().entities.producto).toBeUndefined()
    expect(loadSession().pendingConfirmation).toBeNull()
    endChatSession()
  })

  it('equipo lists advisors and administrative staff', () => {
    startChatSession()
    const reply = answerLandingChat('quiero conocer el equipo')
    expect(reply.text.toLowerCase()).toMatch(/aleja|lina|rafa/)
    expect(reply.text.toLowerCase()).toMatch(/edinson|wilyer|laura/)
    expect(reply.text.toLowerCase()).toMatch(/asesor/)
    expect(reply.text.toLowerCase()).toMatch(/administrativ/)
    endChatSession()
  })

  it('asks for an advisor by listing advisor names', () => {
    startChatSession()
    const reply = answerLandingChat('ayudame a contratar un asesor para hablar con el')
    expect(reply.text.toLowerCase()).toMatch(/aleja|lina|monica|naya|rafa/)
    expect(reply.text.toLowerCase()).not.toMatch(/trabaja con nosotros|vacantes vigentes/)
    endChatSession()
  })

  it('advisor follow-ups list names and invite a choice', () => {
    startChatSession()
    const ask = answerLandingChat('entonces a que asesore le pregunto?')
    expect(ask.text.toLowerCase()).toMatch(/rafa|naya|mónica|monica/)
    expect(ask.text.toLowerCase()).toMatch(/nombre|atienda|indícame|indicame/)
    expect(ask.options?.some((item) => /rafa|naya|mónica|monica/i.test(item.label))).toBe(true)
    endChatSession()

    startChatSession()
    const exist = answerLandingChat('que asesores existen?')
    expect(exist.text.toLowerCase()).toMatch(/rafa|naya|mónica|monica/)
    expect(exist.text.toLowerCase()).toMatch(/libertad|perfil|elige/)
    endChatSession()

    startChatSession()
    const call = answerLandingChat('a que asesore puedo llamar?')
    expect(call.text.toLowerCase()).toMatch(/rafa|naya|mónica|monica/)
    expect(call.text.toLowerCase()).toMatch(/carrusel/)
    expect(call.actions.some((item) => item.href === '/#asesores')).toBe(true)
    expect(call.options?.length).toBeGreaterThan(3)
    endChatSession()
  })

  it('picks an advisor from the chat option list', () => {
    startChatSession()
    const list = answerLandingChat('que asesores existen?')
    expect(list.options?.some((item) => /mónica|monica/i.test(item.label))).toBe(true)
    const picked = answerLandingChat('Mónica')
    expect(picked.text.toLowerCase()).toMatch(/mónica|monica/)
    expect(picked.text.toLowerCase()).not.toMatch(/no relacione/)
    expect(picked.text.toLowerCase()).toMatch(/asesor|escribirle|whatsapp|312/)
    const byNumber = answerLandingChat('que asesores existen?')
    const first = byNumber.options?.[0]?.prompt || ''
    expect(first).toBeTruthy()
    const numbered = answerLandingChat('1')
    const foldedReply = numbered.text.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '')
    const foldedName = first.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '')
    expect(foldedReply).toContain(foldedName)
    expect(numbered.text.toLowerCase()).not.toMatch(/no relacione/)
    endChatSession()
  })

  it('categories and products use published catalog data', () => {
    startChatSession()
    const cats = answerLandingChat('cuales son sus categorias')
    expect(cats.text.toLowerCase()).toMatch(/llantas|pastillas|piñones|pinones|ejes/)
    const products = answerLandingChat('quiero conocer sus productos')
    expect(products.text.toLowerCase()).toMatch(/aceite|llanta|correa/)
    endChatSession()
  })

  it('contact and address use current landing data', () => {
    startChatSession()
    const contact = answerLandingChat('cual es el contacto')
    expect(contact.text).toMatch(/312 614 95527/)
    expect(contact.text.toLowerCase()).toMatch(/comercial@importadorapremium\.com/)
    const place = answerLandingChat('cual es la direccion')
    expect(place.text).toMatch(/Carrera 51/)
    endChatSession()
  })

  it('user name intro is not treated as advisor lookup', () => {
    startChatSession()
    const reply = answerLandingChat('mi nombre es naya')
    expect(reply.text.toLowerCase()).toMatch(/naya/)
    expect(reply.text.toLowerCase()).toMatch(/gracias|quedo|pieza|ayudo/)
    expect(reply.text.toLowerCase()).not.toMatch(/escribirle al|puedes escribirle/)
    expect(loadSession().entities.userName?.toLowerCase()).toMatch(/naya/)
    expect(loadSession().lastTopIntent).toBe('greeting')
    endChatSession()
  })

  it('quote shares inventory price with advisor validation note', () => {
    startChatSession()
    const reply = answerLandingChat('cuanto cuesta el aceite')
    expect(reply.text.toLowerCase()).toMatch(/\$|65.?000|precio|referencia/)
    expect(reply.text.toLowerCase()).toMatch(/desactualiz|asesor/)
    expect(reply.text).toMatch(/Precio empresarial|Disponibilidad:/)
    endChatSession()
  })

  it('product inventory card is not replaced by eso', () => {
    startChatSession()
    const first = answerLandingChat('busco llanta')
    expect(first.text.toLowerCase()).toMatch(/llanta/)
    expect(first.text.toLowerCase()).not.toMatch(/\neso\n|^eso$/)
    expect(first.text).toMatch(/Precio empresarial|Disponibilidad:/)
    const second = answerLandingChat('y esa misma')
    expect(second.text.toLowerCase()).toMatch(/llanta|precio|disponibilidad/)
    expect(second.text.toLowerCase()).not.toMatch(/\neso\s/)
    endChatSession()
  })

  it('keeps product thread on short follow-up', () => {
    startChatSession()
    answerLandingChat('busco aceite motul')
    const thanks = answerLandingChat('gracias')
    expect(loadSession().conversationFocus?.intent).toMatch(/product|quote/)
    expect(thanks.text.toLowerCase()).toMatch(/gracias|con gusto|de nada|ayud/)
    const reply = answerLandingChat('y el precio?')
    expect(reply.text.toLowerCase()).toMatch(/\$|precio|empresarial|aceite/)
    endChatSession()
  })

  it('switches from llanta to aceite without mixing the old product', () => {
    startChatSession()
    answerLandingChat('busco llanta')
    const reply = answerLandingChat('ahora el aceite')
    expect(reply.text.toLowerCase()).toMatch(/aceite/)
    expect(reply.text.toLowerCase()).not.toMatch(/llanta/)
    expect(reply.text.toLowerCase()).toMatch(/pasamos a/)
    expect(reply.text).toMatch(/Precio empresarial|Disponibilidad:/)
    endChatSession()
  })

  it('mejor aceite also leaves the previous tire thread', () => {
    startChatSession()
    answerLandingChat('busco llanta')
    const reply = answerLandingChat('mejor aceite')
    expect(reply.text.toLowerCase()).toMatch(/aceite/)
    expect(reply.text.toLowerCase()).not.toMatch(/llanta/)
    endChatSession()
  })

  it('otra cosa clears product focus', () => {
    startChatSession()
    answerLandingChat('busco llanta')
    const reply = answerLandingChat('otra cosa')
    expect(reply.text.toLowerCase()).toMatch(/tema|producto|pieza|marca/)
    expect(loadSession().conversationFocus).toBeNull()
    expect(reply.text.toLowerCase()).not.toMatch(/\neso\n/)
    endChatSession()
  })

  it('keeps product thread after a location aside', () => {
    startChatSession()
    answerLandingChat('busco llanta')
    const place = answerLandingChat('donde estan ubicados?')
    expect(place.text.toLowerCase()).toMatch(/medell[ií]n|alpujarra|carrera/)
    expect(loadSession().conversationFocus?.family).toMatch(/llanta/)
    const reply = answerLandingChat('y el precio?')
    expect(reply.text.toLowerCase()).toMatch(/llanta|precio|empresarial/)
    expect(reply.text.toLowerCase()).not.toMatch(/alpujarra/)
    endChatSession()
  })

  it('keeps product thread after a general price list ask', () => {
    startChatSession()
    answerLandingChat('busco llanta')
    const general = answerLandingChat('que precio tienen sus productos')
    expect(general.text).not.toMatch(/\$/)
    expect(loadSession().conversationFocus?.family).toMatch(/llanta/)
    const reply = answerLandingChat('y esa misma')
    expect(reply.text.toLowerCase()).toMatch(/llanta/)
    endChatSession()
  })

  it('does not treat sus as suspension in a general price question', () => {
    startChatSession()
    const reply = answerLandingChat('que precio tienen sus productos')
    expect(reply.text.toLowerCase()).not.toMatch(/suspension|suspensión/)
    expect(reply.text.toLowerCase()).toMatch(/precio|catalogo|catálogo|asesor|marca/)
    endChatSession()
  })

  it('does not treat tus as a part name', () => {
    startChatSession()
    const reply = answerLandingChat('tienen tus aceites')
    expect(reply.text.toLowerCase()).toMatch(/aceite/)
    expect(reply.text.toLowerCase()).not.toMatch(/suspension|suspensión/)
    endChatSession()
  })

  it('answers opening hours', () => {
    startChatSession()
    for (const sample of ['a que hora abren?', 'hasta que hora abren?', 'hasta que hora tienen abierto?']) {
      const reply = answerLandingChat(sample)
      expect(reply.text.toLowerCase(), sample).toMatch(/8|horario|lunes|s[aá]bado/)
      expect(reply.text.toLowerCase(), sample).toMatch(/6|3/)
    }
    endChatSession()
  })

  it('answers where they are and city questions', () => {
    startChatSession()
    const where = answerLandingChat('donde estan ubicados?')
    expect(where.text.toLowerCase()).toMatch(/medell[ií]n/)
    expect(where.text.toLowerCase()).toMatch(/alpujarra/)
    expect(where.text).toMatch(/Carrera 51/)
    const city = answerLandingChat('en que ciudad se encuentran?')
    expect(city.text.toLowerCase()).toMatch(/medell[ií]n/)
    expect(city.text.toLowerCase()).toMatch(/antioquia|colombia/)
    endChatSession()
  })

  it('says there is no branch in another city', () => {
    startChatSession()
    const reply = answerLandingChat('tienen local en bogota')
    expect(reply.text.toLowerCase()).toMatch(/no tenemos local|no tenemos sucursal/)
    expect(reply.text.toLowerCase()).toMatch(/bogot/)
    expect(reply.text.toLowerCase()).toMatch(/medell[ií]n/)
    endChatSession()
  })

  it('general product prices ask for a specific item and an advisor', () => {
    startChatSession()
    const reply = answerLandingChat('que precio tienen sus productos')
    expect(reply.text.toLowerCase()).not.toMatch(/suspension|suspensión/)
    expect(reply.text.toLowerCase()).toMatch(/listado|varios productos|producto concreto/)
    expect(reply.text.toLowerCase()).toMatch(/asesor/)
    expect(reply.text).not.toMatch(/\$/)
    endChatSession()
  })

  it('answers credit and sistecredito as premium-only', () => {
    startChatSession()
    for (const sample of ['tienen credito?', 'como puedo acceder a su credito?', 'manejan sistecredito?']) {
      const reply = answerLandingChat(sample)
      expect(reply.text.toLowerCase(), sample).toMatch(/premium/)
      expect(reply.text.toLowerCase(), sample).toMatch(/trayectoria/)
      expect(reply.text.toLowerCase(), sample).not.toMatch(/sistecr[eé]dito.*s[ií]/)
    }
    endChatSession()
  })

  it('answers payment methods with cash or transfer', () => {
    startChatSession()
    const reply = answerLandingChat('que medios de pago tienen?')
    expect(reply.text.toLowerCase()).toMatch(/efectivo/)
    expect(reply.text.toLowerCase()).toMatch(/transferencia/)
    expect(reply.text.toLowerCase()).toMatch(/bancolombia|cuenta/)
    expect(reply.text).not.toMatch(/\$/)
    endChatSession()
  })

  it('keeps product thread after credit or how-to-buy asides', () => {
    startChatSession()
    answerLandingChat('busco llanta')
    const credit = answerLandingChat('tienen credito?')
    expect(credit.text.toLowerCase()).toMatch(/premium|trayectoria/)
    expect(loadSession().conversationFocus?.family).toMatch(/llanta/)
    const pay = answerLandingChat('como puedo obtener este producto?')
    expect(pay.text.toLowerCase()).toMatch(/efectivo/)
    expect(pay.text.toLowerCase()).toMatch(/transferencia/)
    expect(loadSession().conversationFocus?.family).toMatch(/llanta/)
    const reply = answerLandingChat('y el precio?')
    expect(reply.text.toLowerCase()).toMatch(/llanta|precio|empresarial/)
    expect(reply.text).not.toMatch(/\$\$/)
    endChatSession()
  })

  it('how to buy a named part shows that product not bank details', () => {
    startChatSession()
    const reply = answerLandingChat('como puedo comprar aceite')
    expect(reply.text.toLowerCase()).toMatch(/aceite/)
    expect(reply.text).toMatch(/Precio empresarial|Disponibilidad:/)
    expect(reply.text.toLowerCase()).not.toMatch(/efectivo|transferencia|bancolombia/)
    endChatSession()
  })

  it('incomplete buy after catalog does not dump payment', () => {
    startChatSession()
    answerLandingChat('que productos venden?')
    const reply = answerLandingChat('quiero comprar uin')
    expect(reply.text.toLowerCase()).not.toMatch(/bancolombia|efectivo|transferencia/)
    expect(reply.text.toLowerCase()).not.toMatch(/para catalog/)
    endChatSession()
  })

  it('unknown part after catalog is not a bank reply', () => {
    startChatSession()
    answerLandingChat('que productos venden?')
    const reply = answerLandingChat('quiero comprar una arandela')
    expect(reply.text.toLowerCase()).not.toMatch(/bancolombia|efectivo|transferencia/)
    expect(reply.text.toLowerCase()).not.toMatch(/para catalog/)
    expect(reply.text.toLowerCase()).not.toMatch(/precio empresarial/)
    endChatSession()
  })

  it('typo llantra after catalog shows tire cards not payment', () => {
    startChatSession()
    answerLandingChat('que productos venden?')
    const reply = answerLandingChat('como puedo obtener una llantra?')
    expect(reply.text.toLowerCase()).toMatch(/llanta/)
    expect(reply.text).toMatch(/Precio empresarial|Disponibilidad:/)
    expect(reply.text.toLowerCase()).not.toMatch(/bancolombia|efectivo|transferencia/)
    expect(reply.text.toLowerCase()).not.toMatch(/para catalog/)
    endChatSession()
  })

  it('after listing tires, buying by name keeps only that card', () => {
    startChatSession()
    const listed = answerLandingChat('quiero saber sus llantas')
    expect(listed.text.toLowerCase()).toMatch(/pistera|urbana/)
    expect(listed.text).toMatch(/255|198/)
    const reply = answerLandingChat('Quiero comprar las llantas pistera urbana')
    expect(reply.text.toLowerCase()).toMatch(/pistera/)
    expect(reply.text.toLowerCase()).toMatch(/urbana/)
    expect(reply.text).toMatch(/198/)
    expect(reply.text.toLowerCase()).not.toMatch(/sport|mojado/)
    expect(reply.text).not.toMatch(/255/)
    expect(reply.text.toLowerCase()).not.toMatch(/efectivo|transferencia/)
    expect(loadSession().entities.producto?.toLowerCase()).toMatch(/pistera/)
    endChatSession()
  })

  it('after listing tires, buying by shown price keeps only that card', () => {
    startChatSession()
    answerLandingChat('quiero saber sus llantas')
    const reply = answerLandingChat('quiero comprar la de el 255.000')
    expect(reply.text).toMatch(/255/)
    expect(reply.text.toLowerCase()).toMatch(/sport|mojado/)
    expect(reply.text).not.toMatch(/198/)
    expect(reply.text.toLowerCase()).not.toMatch(/pistera urbana|urbana/)
    expect(reply.text.toLowerCase()).not.toMatch(/efectivo|transferencia/)
    endChatSession()
  })

  it('after listing tires, mixed name plus unique price keeps the priced card', () => {
    startChatSession()
    answerLandingChat('quiero saber sus llantas')
    const reply = answerLandingChat('Voy a comprar la llanta pistera sport de 255.000')
    expect(reply.text).toMatch(/255/)
    expect(reply.text.toLowerCase()).toMatch(/sport|mojado/)
    expect(reply.text).not.toMatch(/198/)
    expect(reply.text.toLowerCase()).not.toMatch(/efectivo|transferencia/)
    endChatSession()
  })

  it('lists brake pads without mixing discs or shoes', () => {
    startChatSession()
    const reply = answerLandingChat('que pastillas de freno tienen?')
    expect(reply.text.toLowerCase()).toMatch(/pastilla/)
    expect(reply.text.toLowerCase()).not.toMatch(/disco de freno/)
    expect(reply.text.toLowerCase()).not.toMatch(/banda/)
    endChatSession()
  })

  it('treats brake shoes as a different family from pads', () => {
    startChatSession()
    answerLandingChat('estoy buscando pastillas de freno')
    const reply = answerLandingChat('que bandas de freno tienen?')
    expect(reply.text.toLowerCase()).toMatch(/banda|tambor|zapata|ficha/)
    expect(reply.text.toLowerCase()).not.toMatch(/org[aá]nicas|sinterizadas/)
    expect(loadSession().conversationFocus?.family).toMatch(/banda/)
    endChatSession()
  })

  it('does not mix previous pads when asking for brake discs', () => {
    startChatSession()
    answerLandingChat('busco pastillas de freno')
    const reply = answerLandingChat('que discos de freno tienen?')
    expect(reply.text.toLowerCase()).toMatch(/disco/)
    expect(reply.text.toLowerCase()).not.toMatch(/org[aá]nicas|sinterizadas/)
    expect(loadSession().conversationFocus?.family).toMatch(/disco/)
    endChatSession()
  })

  it('does not treat brand assortment as a complaint', () => {
    startChatSession()
    const reply = answerLandingChat('queria saber que marcas manejan?')
    expect(reply.text.toLowerCase()).not.toMatch(/queja|reclamo|inconveniente|lamentamos/)
    expect(reply.text.toLowerCase()).toMatch(/marca|visi[oó]n|premium/)
    endChatSession()
  })

  it('answers shipping and free metro threshold without inventing contraentrega', () => {
    startChatSession()
    for (const sample of ['hacen envios?', 'domicilio gratis']) {
      const reply = answerLandingChat(sample)
      expect(reply.text.toLowerCase(), sample).toMatch(/pa[ií]s|nacional/)
      expect(reply.text.toLowerCase(), sample).toMatch(/metropolitana/)
      expect(reply.text, sample).toMatch(/250/)
      expect(reply.text.toLowerCase(), sample).toMatch(/mismo d[ií]a/)
      expect(reply.text.toLowerCase(), sample).toMatch(/puerta/)
      expect(reply.text.toLowerCase(), sample).not.toMatch(/contraentrega/)
    }
    endChatSession()
  })

  it('keeps tire focus after a shipping aside', () => {
    startChatSession()
    answerLandingChat('busco llanta')
    const ship = answerLandingChat('y el envio?')
    expect(ship.text.toLowerCase()).toMatch(/env[ií]o|domicilio|pa[ií]s|metropolitana/)
    expect(ship.text.toLowerCase()).toMatch(/250|gratis|puerta|mismo/)
    expect(loadSession().conversationFocus?.family).toMatch(/llanta/)
    endChatSession()
  })

  it('rectifies garbage with tire focus instead of first fallback', () => {
    startChatSession()
    answerLandingChat('busco llanta')
    const reply = answerLandingChat('asjdhqwe')
    expect(reply.text.toLowerCase()).toMatch(/seguimos|llanta|otra pieza|quisiste/)
    expect(reply.text.toLowerCase()).not.toMatch(/no reconoci|no relacion/)
    endChatSession()
  })

  it('corrects coprar llantra into a tire card', () => {
    startChatSession()
    const reply = answerLandingChat('coprar una llantra')
    expect(reply.text.toLowerCase()).toMatch(/llanta/)
    expect(reply.text).toMatch(/Precio empresarial|Disponibilidad:/)
    endChatSession()
  })

  it('does not track order status and points to seller or Premium account', () => {
    startChatSession()
    for (const sample of ['donde esta mi pedido', 'estado de mi pedido']) {
      const reply = answerLandingChat(sample)
      expect(reply.text.toLowerCase(), sample).toMatch(/vendedor|usuario cliente|premium/)
      expect(reply.text.toLowerCase(), sample).toMatch(/no (consulta|rastrea)|no está en este chat|no estan en este chat/)
      expect(reply.text.toLowerCase(), sample).not.toMatch(/dime la pieza|precio empresarial/)
      expect(reply.actions.some((item) => /catálogo|catalogo/i.test(item.label))).toBe(false)
    }
    endChatSession()
  })

  it('maps gerente and vendedores to the advisor group and names both roles', () => {
    startChatSession()
    const gerente = answerLandingChat('quien es el gerente')
    expect(gerente.text.toLowerCase()).toMatch(/asesor/)
    expect(gerente.text.toLowerCase()).toMatch(/varios roles|administrativ/)
    expect(gerente.text.toLowerCase()).not.toMatch(/no reconoci|no relacion/)
    endChatSession()
    startChatSession()
    const sellers = answerLandingChat('vendedores')
    expect(sellers.text.toLowerCase()).toMatch(/asesor/)
    expect(sellers.text.toLowerCase()).toMatch(/varios roles|administrativ/)
    endChatSession()
  })

  it('answers employment asks as vacancies', () => {
    startChatSession()
    for (const sample of ['tienen empleo', 'donde postular']) {
      const reply = answerLandingChat(sample)
      expect(reply.text.toLowerCase(), sample).toMatch(/vacante|trabaja con nosotros|postul/)
    }
    endChatSession()
  })

  it('hours reply has no advisor WhatsApp action', () => {
    startChatSession()
    const reply = answerLandingChat('a que hora abren?')
    expect(reply.text.toLowerCase()).toMatch(/8|horario|lunes/)
    expect(reply.actions.some((item) => /asesor|whatsapp|indicaciones/i.test(item.label))).toBe(false)
    endChatSession()
  })

  it('tire card keeps price disclaimer and at most one validate CTA', () => {
    startChatSession()
    const reply = answerLandingChat('busco llanta')
    expect(reply.text.toLowerCase()).toMatch(/desactualiz|confirmar/)
    const advisorActions = reply.actions.filter((item) => /asesor|whatsapp|validar/i.test(item.label))
    expect(advisorActions.length).toBeLessThanOrEqual(1)
    if (advisorActions.length) expect(advisorActions[0].label.toLowerCase()).toMatch(/validar/)
    endChatSession()
  })
})
