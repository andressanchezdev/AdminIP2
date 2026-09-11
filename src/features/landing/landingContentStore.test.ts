import { afterEach, describe, expect, it } from 'vitest'
import landingContentJson from '@/mocks/landingContent.json'
import {
  defaultLandingContent,
  getLandingContent,
  resetLandingSection,
  resetLandingWorkingCopy,
  saveLandingSection,
} from './landingContentStore'

const LEGACY_KEY = 'landing-page-content'

afterEach(() => {
  resetLandingWorkingCopy()
  window.localStorage.removeItem(LEGACY_KEY)
})

describe('landing content from mocks', () => {
  it('reads hero images from the mock JSON, not localStorage', () => {
    window.localStorage.setItem(
      LEGACY_KEY,
      JSON.stringify({ hero: { backgrounds: ['data:image/webp;base64,AAAA'], title: 'Hack' } }),
    )
    resetLandingWorkingCopy()
    const content = getLandingContent()
    expect(content.hero.backgrounds).toEqual(landingContentJson.hero.backgrounds)
    expect(content.hero.title).toBe(landingContentJson.hero.title)
    expect(window.localStorage.getItem(LEGACY_KEY)).toBeNull()
  })

  it('keeps admin edits in the in-memory mock copy without writing the browser store', () => {
    const current = defaultLandingContent()
    const backgrounds = ['/a.webp', '/b.webp', '/c.webp']
    saveLandingSection('hero', { ...current.hero, backgrounds, title: 'Banner de prueba' })
    expect(getLandingContent().hero.backgrounds).toEqual(backgrounds)
    expect(getLandingContent().hero.title).toBe('Banner de prueba')
    expect(window.localStorage.getItem(LEGACY_KEY)).toBeNull()
  })

  it('does not persist uploaded preview bytes in localStorage', () => {
    const current = defaultLandingContent()
    const uploaded = ['blob:http://localhost/hero-1', 'data:image/webp;base64,AAAA']
    saveLandingSection('hero', { ...current.hero, backgrounds: uploaded })
    expect(getLandingContent().hero.backgrounds).toEqual(uploaded)
    expect(window.localStorage.getItem(LEGACY_KEY)).toBeNull()
  })

  it('restores a section from the mock JSON', () => {
    const current = defaultLandingContent()
    saveLandingSection('hero', { ...current.hero, title: 'Temporal' })
    resetLandingSection('hero')
    expect(getLandingContent().hero.title).toBe(landingContentJson.hero.title)
    expect(getLandingContent().hero.backgrounds).toEqual(landingContentJson.hero.backgrounds)
  })
})
