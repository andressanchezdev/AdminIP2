/**
 * Tokens y medidas del diseño en preview/catalog-preview.html (fuente de verdad).
 * Página A4 fija en px (794×1123 ≈ 210×297 mm @ 96 dpi).
 * El CSS de página/celda se lee del preview vía extractCatalogCss (no duplicar aquí).
 */
export const CATALOG_PAGE = {
  width: 794,
  height: 1123,
  headerH: 72,
  footerH: 48,
  marginX: 38,
  cellW: 263,
  cellH: 341,
  gridW: 789,
  gridH: 1023,
  productsPerPage: 9,
  cols: 3,
  rows: 3,
}

export const CATALOG_COLORS = {
  white: '#ffffff',
  softGray: '#e6e7e8',
  base: '#2d3238',
  panel: '#30363d',
  ink: '#333333',
  accent: '#ffc629',
}

export const STORAGE_PREFIX = 'https://storage.googleapis.com/importadorapremiumonline/'

export const DEFAULT_BRAND_LOGO = `${STORAGE_PREFIX}dependencias/img/marcas/IMPORTADOOoK-72-72.png`

/** Mapa extra del preview + logos de marca usados en cards. */
export const BRAND_LOGO_MAP = {
  bajaj: 'https://storage.googleapis.com/importadorapremiumonline/dependencias/img/marcas/15060940_marcas-10.png',
  yamaha: 'https://storage.googleapis.com/importadorapremiumonline/dependencias/img/marcas/57432582_marcas-06.png',
  honda: 'https://storage.googleapis.com/importadorapremiumonline/dependencias/img/marcas/22885058_marcas-12.png',
  akt: 'https://storage.googleapis.com/importadorapremiumonline/dependencias/img/marcas/10656650_marcas-09.png',
  kawasaki: 'https://storage.googleapis.com/importadorapremiumonline/dependencias/img/marcas/28620734_marcas-11.png',
  yamalube: 'https://storage.googleapis.com/importadorapremiumonline/dependencias/img/marcas/42501267_marcas-61.png',
  mobil: 'https://storage.googleapis.com/importadorapremiumonline/dependencias/img/marcas/48568160_marcas-63.png',
  kixx: 'https://storage.googleapis.com/importadorapremiumonline/dependencias/img/marcas/68311880_aceites-06.png',
  motul: 'https://storage.googleapis.com/importadorapremiumonline/dependencias/img/marcas/96259009_marcas-41.png',
  hero: 'https://storage.googleapis.com/importadorapremiumonline/dependencias/img/marcas/99540505_marcas-18.png',
}
