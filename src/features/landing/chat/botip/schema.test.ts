import { describe, expect, it } from 'vitest'
import factoryMarkdown from '../botIP.md?raw'
import { parseBotMarkdown, REQUIRED_SECTIONS, serializeBotDocument, validateBotMarkdown } from './schema'
import { factoryDocument, factoryMarkdownSource, settingsFromDocument } from './store'
import { defaultSliderValues, slidersToLimits, slidersToPipeline } from './sliders'
import { DEFAULT_PIPELINE_CONFIG } from '../pipelineConfig'
import { keywordsOf } from '../botSettings'
import { resolveShipping } from './liveData'

describe('botIP.md schema', () => {
  it('factory file has every required section', () => {
    expect(validateBotMarkdown(factoryMarkdown)).toEqual([])
    for (const title of REQUIRED_SECTIONS) {
      expect(factoryMarkdown).toContain(`## ${title}`)
    }
  })

  it('parses factory markdown', () => {
    const parsed = parseBotMarkdown(factoryMarkdownSource())
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return
    expect(parsed.doc.identity.name).toBe('botIP')
    expect(parsed.doc.settings.replies.greeting.keywords).toMatch(/hola/)
    expect(parsed.doc.catalog).toBeTruthy()
  })

  it('rejects a partial markdown', () => {
    const parsed = parseBotMarkdown('# hola\n')
    expect(parsed.ok).toBe(false)
    if (parsed.ok) return
    expect(parsed.errors.some((item) => item.includes('Identidad'))).toBe(true)
  })

  it('round-trips serialize and parse', () => {
    const again = parseBotMarkdown(serializeBotDocument(factoryDocument()))
    expect(again.ok).toBe(true)
  })
})

describe('factory sliders keep current pipeline', () => {
  it('slider defaults match factory pipeline thresholds', () => {
    const pipeline = slidersToPipeline(defaultSliderValues())
    expect(pipeline.UMBRAL_MINIMO).toBe(DEFAULT_PIPELINE_CONFIG.UMBRAL_MINIMO)
    expect(pipeline.DELTA_EMPATE).toBe(DEFAULT_PIPELINE_CONFIG.DELTA_EMPATE)
    expect(pipeline.HUMAN_HANDOFF_AT).toBe(DEFAULT_PIPELINE_CONFIG.HUMAN_HANDOFF_AT)
    expect(pipeline.FALLBACK_MENU_AT).toBe(DEFAULT_PIPELINE_CONFIG.FALLBACK_MENU_AT)
  })

  it('limit sliders keep factory chat bounds', () => {
    const limits = slidersToLimits(defaultSliderValues())
    expect(limits.minChars).toBe(3)
    expect(limits.maxChars).toBe(1000)
    expect(limits.blockMinutes).toBe(1)
    expect(limits.burstLimit).toBe(8)
    expect(limits.replyDelayMs).toBe(3000)
  })
})

describe('completitud: el bot lee respuestas del .md', () => {
  it('keywords of greeting come from the parsed markdown', () => {
    const fromMd = settingsFromDocument(factoryDocument()).replies.greeting.keywords
    expect(fromMd.toLowerCase()).toContain('hola')
    expect(keywordsOf('greeting').includes('hola')).toBe(true)
  })

  it('credit and payment templates live in the markdown', () => {
    const replies = factoryDocument().settings.replies
    expect(replies.credit.text.toLowerCase()).toMatch(/premium/)
    expect(replies.payment.text.toLowerCase()).toMatch(/efectivo|transferencia/)
  })

  it('fails if a factory reply is missing from the md', () => {
    const replies = factoryDocument().settings.replies
    for (const id of ['greeting', 'product', 'quote', 'location', 'complaint', 'company']) {
      expect(replies[id]?.text || replies[id]?.texts?.length, id).toBeTruthy()
    }
  })

  it('factory catalog has inventory prices, team phones, aliases and cities', () => {
    const doc = factoryDocument()
    const inventory = doc.catalog.inventory as Array<{ precioEmpresarial?: number; nombre?: string }>
    expect(inventory.length).toBeGreaterThan(0)
    expect(inventory.some((item) => Number(item.precioEmpresarial) > 0)).toBe(true)

    const team = doc.catalog.team as Array<{ fullName?: string; phoneDisplay?: string }>
    expect(team.some((item) => item.fullName && item.phoneDisplay)).toBe(true)

    const aliases = doc.lexicon.partAliases as Record<string, string>
    expect(aliases.pastiya).toBe('pastilla')

    const cities = doc.lexicon.otherCities as string[]
    expect(cities).toContain('bogota')

    const chooseCues = doc.lexicon.chooseCues as string[]
    expect(chooseCues).toEqual(expect.arrayContaining(['voy', 'llevar', 'comprar']))
    expect(doc.decisionRules.some((rule) => /fichas recién mostradas|lastOffers/i.test(rule))).toBe(true)

    expect(doc.settings.replies.credit.text.toLowerCase()).toMatch(/premium/)
    expect(doc.settings.replies.payment.text.toLowerCase()).toMatch(/efectivo|transferencia/)
    expect(doc.settings.replies.location.text || doc.settings.replies.location.texts?.length).toBeTruthy()
    const shipping = doc.catalog.shipping as { freeMetroFrom?: string } | undefined
    expect(shipping?.freeMetroFrom || resolveShipping(undefined).freeMetroFrom).toBe('250.000')
  })

  it('parses markdown without shipping and liveShipping falls back', () => {
    const parsed = parseBotMarkdown(factoryMarkdownSource())
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return
    const catalog = { ...parsed.doc.catalog }
    delete catalog.shipping
    const stripped = serializeBotDocument({ ...parsed.doc, catalog, origin: 'modificado' })
    expect(validateBotMarkdown(stripped)).toEqual([])
    const again = parseBotMarkdown(stripped)
    expect(again.ok).toBe(true)
    if (!again.ok) return
    expect(again.doc.catalog.shipping).toBeUndefined()
    const ship = resolveShipping(again.doc.catalog.shipping)
    expect(ship.freeMetroFrom).toBe('250.000')
    expect(ship.nationwide).toBe(true)
    expect(ship.sameDay).toBe(true)
    expect(ship.doorSafe).toBe(true)
  })

  it('parses markdown without orderStatus and keeps schema valid', () => {
    const parsed = parseBotMarkdown(factoryMarkdownSource())
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return
    const replies = { ...parsed.doc.settings.replies }
    delete replies.orderStatus
    const stripped = serializeBotDocument({
      ...parsed.doc,
      settings: { ...parsed.doc.settings, replies },
      origin: 'modificado',
    })
    expect(validateBotMarkdown(stripped)).toEqual([])
    const again = parseBotMarkdown(stripped)
    expect(again.ok).toBe(true)
    if (!again.ok) return
    expect(again.doc.settings.replies.orderStatus).toBeUndefined()
  })
})
