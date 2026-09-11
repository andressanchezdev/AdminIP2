import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { answerLandingChat } from '../answerChat'
import { endChatSession, startChatSession } from '../sessionContext'
import { getBotSettings } from '../botSettings'
import { liveCatalogParts } from '../motoParts'
import factoryMarkdown from '../botIP.md?raw'
import { parseBotMarkdown, serializeBotDocument } from './schema'
import { defaultSliderValues } from './sliders'
import {
  applySlidersToDocument,
  clearUploadedMarkdown,
  downloadFactoryFileName,
  downloadUploadedFileName,
  factoryDownload,
  factoryMarkdownSource,
  getActiveDocument,
  getActiveMarkdown,
  getActiveSlot,
  hasUploadedMarkdown,
  resetActiveMarkdown,
  saveActiveDocument,
  saveActiveMarkdown,
  uploadedMarkdownSource,
} from './store'
import { clearMemoryStore } from '../storage'

const MARK = 'RESPUESTA-UNICA-DEL-MD-SUBIDO'

function uploadPatchedFactory(patch: (doc: ReturnType<typeof parseBotMarkdown> extends { ok: true; doc: infer D } ? D : never) => void) {
  const parsed = parseBotMarkdown(factoryMarkdownSource())
  expect(parsed.ok).toBe(true)
  if (!parsed.ok) return
  patch(parsed.doc)
  const result = saveActiveMarkdown(serializeBotDocument({ ...parsed.doc, origin: 'subido' }), 'subido')
  expect(result.ok).toBe(true)
}

describe('bot behavior follows uploaded botIP.md', () => {
  beforeEach(() => {
    clearMemoryStore()
    resetActiveMarkdown()
    clearUploadedMarkdown()
    startChatSession()
  })

  afterEach(() => {
    endChatSession()
    resetActiveMarkdown()
    clearUploadedMarkdown()
    clearMemoryStore()
  })

  it('uses greeting text from the uploaded markdown', () => {
    const before = answerLandingChat('hola')
    expect(before.text).not.toContain(MARK)
    endChatSession()

    uploadPatchedFactory((doc) => {
      doc.settings.replies.greeting = {
        ...doc.settings.replies.greeting,
        text: MARK,
        texts: [MARK],
      }
    })

    startChatSession()
    const after = answerLandingChat('hola')
    expect(after.text).toContain(MARK)
    expect(getActiveSlot()).toBe('uploaded')
  })

  it('uses credit copy from the uploaded markdown', () => {
    uploadPatchedFactory((doc) => {
      doc.settings.replies.credit = {
        ...doc.settings.replies.credit,
        text: `Credito solo con marca ${MARK}`,
        texts: [`Credito solo con marca ${MARK}`],
      }
    })
    const reply = answerLandingChat('tienen credito?')
    expect(reply.text).toContain(MARK)
  })

  it('matches a new keyword added in the uploaded markdown', () => {
    uploadPatchedFactory((doc) => {
      doc.settings.replies.company = {
        ...doc.settings.replies.company,
        keywords: `${doc.settings.replies.company.keywords}, zeldaunicornio`,
        text: `Empresa ${MARK}`,
        texts: [`Empresa ${MARK}`],
      }
    })
    expect(getBotSettings().replies.company.keywords).toMatch(/zeldaunicornio/)
    const reply = answerLandingChat('zeldaunicornio')
    expect(reply.text).toContain(MARK)
  })

  it('rejects an incomplete markdown and keeps the previous uploaded context', () => {
    uploadPatchedFactory((doc) => {
      doc.settings.replies.greeting = {
        ...doc.settings.replies.greeting,
        text: MARK,
        texts: [MARK],
      }
    })
    const previous = uploadedMarkdownSource()
    const rejected = saveActiveMarkdown('# incompleto\n', 'subido')
    expect(rejected.ok).toBe(false)
    expect(uploadedMarkdownSource()).toBe(previous)
    expect(getActiveSlot()).toBe('uploaded')
    const reply = answerLandingChat('hola')
    expect(reply.text).toContain(MARK)
  })

  it('restores factory replies after reset and keeps the last upload for download', () => {
    uploadPatchedFactory((doc) => {
      doc.settings.replies.greeting = {
        ...doc.settings.replies.greeting,
        text: MARK,
        texts: [MARK],
      }
    })
    resetActiveMarkdown()
    endChatSession()
    startChatSession()
    expect(getActiveSlot()).toBe('original')
    expect(hasUploadedMarkdown()).toBe(true)
    const reply = answerLandingChat('hola')
    expect(reply.text).not.toContain(MARK)
  })

  it('factory download is the bundled botIP.md and the original slot reads that file', () => {
    const file = factoryDownload()
    expect(file.filename).toBe('botIP.md')
    expect(file.source).toBe(factoryMarkdown)
    expect(file.source).toBe(factoryMarkdownSource())
    expect(file.source).toContain('schema: botip-md/1')
    expect(file.source).toContain('## Templates de respuesta')
    expect(file.source).toContain('## Catálogo de datos')

    resetActiveMarkdown()
    clearUploadedMarkdown()
    expect(getActiveSlot()).toBe('original')
    expect(getActiveMarkdown()).toBe(file.source)

    const live = getActiveDocument()
    const parsed = parseBotMarkdown(file.source)
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return
    expect(live.hash).toBe(parsed.doc.hash)
    expect(live.settings.replies.shipping.text).toBe(parsed.doc.settings.replies.shipping.text)
    expect(live.identity.name).toBe('botIP')
  })

  it('factory chat replies use templates and catalog from botIP.md', () => {
    resetActiveMarkdown()
    clearUploadedMarkdown()
    const parsed = parseBotMarkdown(factoryMarkdownSource())
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return
    const shippingText = parsed.doc.settings.replies.shipping.text
    const greeting = parsed.doc.settings.replies.greeting.texts?.[0] || parsed.doc.settings.replies.greeting.text
    const freeFrom = String((parsed.doc.catalog as { shipping?: { freeMetroFrom?: string } }).shipping?.freeMetroFrom || '')

    const hi = answerLandingChat('hola')
    expect(hi.text).toMatch(/botIP|bienvenido|ayudo/i)
    if (greeting) expect(greeting.toLowerCase()).toMatch(/botip|bienvenido|ayudo/)

    endChatSession()
    startChatSession()
    const ship = answerLandingChat('hacen envios?')
    expect(shippingText.toLowerCase()).toMatch(/país|pais|metropolitana/)
    expect(ship.text.toLowerCase()).toMatch(/país|pais|metropolitana/)
    if (freeFrom) expect(ship.text).toContain(freeFrom)
  })

  it('does not mutate the factory markdown source when uploading', () => {
    const factory = factoryMarkdownSource()
    uploadPatchedFactory((doc) => {
      doc.settings.replies.greeting = { ...doc.settings.replies.greeting, text: MARK, texts: [MARK] }
    })
    expect(factoryMarkdownSource()).toBe(factory)
    expect(downloadFactoryFileName()).toBe('botIP.md')
    expect(downloadUploadedFileName()).toBe('botIP2.md')
  })

  it('keeps factory file intact when sliders are moved on the original slot', () => {
    const factory = factoryMarkdownSource()
    const parsed = parseBotMarkdown(factory)
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return
    const doc = applySlidersToDocument(parsed.doc, { ...defaultSliderValues(), ...parsed.doc.sliders, minChars: 8 }, 'modificado')
    saveActiveDocument(doc)
    expect(factoryMarkdownSource()).toBe(factory)
    expect(getActiveSlot()).toBe('original')
    expect(getBotSettings().minChars).toBe(8)
  })

  it('uses contact data from the uploaded catalog section', () => {
    uploadPatchedFactory((doc) => {
      const catalog = doc.catalog as { contact?: { phoneDisplay?: string } }
      catalog.contact = { ...(catalog.contact ?? {}), phoneDisplay: '300 000 0000' }
      doc.settings.replies.whatsapp = {
        ...doc.settings.replies.whatsapp,
        text: 'Escribenos al {phone}',
        texts: ['Escribenos al {phone}'],
      }
    })
    const reply = answerLandingChat('whatsapp')
    expect(reply.text).toMatch(/300 000 0000/)
  })

  it('uses location fields from the uploaded catalog section', () => {
    uploadPatchedFactory((doc) => {
      const catalog = doc.catalog as { contact?: { city?: string; address?: string } }
      catalog.contact = { ...(catalog.contact ?? {}), city: 'Ciudad MD', address: 'Calle MD 1' }
      doc.settings.replies.location = {
        ...doc.settings.replies.location,
        text: 'Sede en {city}, {address}',
        texts: ['Sede en {city}, {address}'],
      }
    })
    const reply = answerLandingChat('donde estan ubicados')
    expect(reply.text).toMatch(/Ciudad MD/)
    expect(reply.text).toMatch(/Calle MD 1/)
  })

  it('uses payment data from the uploaded catalog section', () => {
    uploadPatchedFactory((doc) => {
      const catalog = doc.catalog as { payments?: { bank?: string; holder?: string } }
      catalog.payments = { ...(catalog.payments ?? {}), bank: 'BancoMD', holder: 'Titular MD' }
      doc.settings.replies.payment = {
        ...doc.settings.replies.payment,
        text: 'Paga en {bank} a nombre de {holder}',
        texts: ['Paga en {bank} a nombre de {holder}'],
      }
    })
    const reply = answerLandingChat('que medios de pago tienen?')
    expect(reply.text).toMatch(/BancoMD/)
    expect(reply.text).toMatch(/Titular MD/)
  })

  it('uses identity name from the uploaded markdown', () => {
    uploadPatchedFactory((doc) => {
      doc.identity = { ...doc.identity, name: 'AsistenteMD' }
      doc.settings.replies.greeting = {
        ...doc.settings.replies.greeting,
        text: 'Hola, soy {botName}',
        texts: ['Hola, soy {botName}'],
      }
    })
    const reply = answerLandingChat('hola')
    expect(reply.text).toContain('AsistenteMD')
  })

  it('applies slider limits from the uploaded markdown', () => {
    uploadPatchedFactory((doc) => {
      doc.sliders = { ...doc.sliders, minChars: 8 }
    })
    expect(getBotSettings().minChars).toBe(8)
  })

  it('uses extra catalog part terms from the uploaded lexicon', () => {
    uploadPatchedFactory((doc) => {
      const parts = Array.isArray(doc.lexicon.catalogParts) ? [...doc.lexicon.catalogParts] : []
      doc.lexicon = { ...doc.lexicon, catalogParts: [...parts, 'widgetpieza'] }
    })
    expect(liveCatalogParts()).toContain('widgetpieza')
  })

  it('quotes an invented inventory product from the uploaded markdown', () => {
    uploadPatchedFactory((doc) => {
      const catalog = doc.catalog as { inventory?: Array<Record<string, unknown>> }
      const parts = Array.isArray(doc.lexicon.catalogParts) ? [...doc.lexicon.catalogParts] : []
      doc.lexicon = { ...doc.lexicon, catalogParts: [...parts, 'widgetpieza'] }
      catalog.inventory = [
        ...(catalog.inventory ?? []),
        {
          id: 'ZX-UNICO',
          codigo: 'ZX-UNICO',
          nombre: 'Widgetpieza de prueba ZX',
          descripcion: 'Pieza inventada para el markdown',
          modelo: 'ZX1',
          cantidad: 7,
          precioEmpresarial: 123456,
          status: 'activo',
        },
      ]
    })
    const uploaded = answerLandingChat('cuanto cuesta widgetpieza')
    expect(uploaded.text).toMatch(/Widgetpieza|123|ZX/i)
    resetActiveMarkdown()
    endChatSession()
    startChatSession()
    const restored = answerLandingChat('busco widgetpieza')
    expect(restored.text).not.toMatch(/123456/)
  })

  it('finds an extra team member from the uploaded markdown', () => {
    uploadPatchedFactory((doc) => {
      const catalog = doc.catalog as { team?: Array<Record<string, unknown>> }
      catalog.team = [
        ...(catalog.team ?? []),
        {
          id: 'asesor_md',
          fullName: 'Zelda Unicornio',
          role: 'Asesora',
          phoneDisplay: '300 111 2222',
          whatsappDigits: '573001112222',
          group: 'asesor',
          status: 'publicado',
        },
      ]
    })
    const reply = answerLandingChat('Zelda')
    expect(reply.text).toMatch(/Zelda/i)
    expect(reply.text).toMatch(/300 111 2222|escribirle/i)
  })
})
