import previewHtml from '../preview/catalog-preview.html?raw'
import { extractCatalogCss } from './extractCatalogCss.js'

/** CSS del preview (única fuente de verdad de estilos del PDF). */
export function getCatalogPageCss() {
  return extractCatalogCss(previewHtml)
}
