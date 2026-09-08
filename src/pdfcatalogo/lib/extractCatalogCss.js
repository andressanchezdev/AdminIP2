/**
 * Extrae el bloque <style> del preview HTML (fuente de verdad del diseño).
 */
export function extractCatalogCss(html) {
  const match = String(html ?? '').match(/<style>([\s\S]*?)<\/style>/i)
  if (!match?.[1]?.trim()) {
    throw new Error('catalog-preview.html no tiene bloque <style>')
  }
  return match[1]
}
