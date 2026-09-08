import { CATALOG_PAGE } from './catalogLayout.js'
import {
  chunkProducts,
  normalizeCatalogProduct,
  renderPageHtml,
} from './buildCatalogMarkup.js'

/**
 * Overrides de impresión (después del CSS del preview).
 * El preview usa padding/margin de “studio”; en PDF deben ir a 0.
 */
export function getCatalogPrintCssOverrides() {
  return `
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      background: #ffffff !important;
    }
    .page {
      margin: 0 !important;
      box-shadow: none !important;
      page-break-after: always;
      break-after: page;
    }
    .page:last-child {
      page-break-after: auto;
      break-after: auto;
    }
    .toolbar { display: none !important; }
  `
}

/** CSS preview + overrides (mismo stack que npm run catalog:sample). */
export function composeCatalogPrintCss(pageCss = '') {
  return `${pageCss}\n${getCatalogPrintCssOverrides()}`
}

/**
 * CSS para captura offscreen en la app.
 * Evita que reglas body/html del preview contaminen el documento de la SPA.
 */
export function composeCatalogCaptureCss(pageCss = '') {
  const withoutChrome = String(pageCss)
    .replace(/\bhtml\s*,\s*body\s*\{[^}]*\}/gi, '')
    .replace(/\bbody\s*\{[^}]*\}/gi, '')
    .replace(/\bhtml\s*\{[^}]*\}/gi, '')
    .replace(/\.toolbar\s*\{[^}]*\}/gi, '')

  return `
    ${withoutChrome}
    [data-catalog-pdf-root] .page {
      margin: 0 !important;
      box-shadow: none !important;
    }
  `
}

/**
 * Documento HTML completo del catálogo v2 (Chrome print-to-pdf / iframe captura).
 * Misma estructura que genera `scripts/generateSamplePdf.mjs`.
 */
export function buildCatalogDocumentHtml({
  products = [],
  filterSummary = 'Sin filtros',
  headerIconSrc = '',
  pageCss = '',
  title = 'Catalogo de productos',
} = {}) {
  const normalized = products.map(normalizeCatalogProduct)
  const pages = chunkProducts(normalized, CATALOG_PAGE.productsPerPage)
  const totalPages = pages.length
  const totalProducts = normalized.length

  const pagesHtml = pages
    .map((pageProducts, index) => renderPageHtml({
      products: pageProducts,
      pageIndex: index + 1,
      totalPages,
      totalProducts,
      filterSummary,
      headerIconSrc,
    }))
    .join('\n')

  const printCss = composeCatalogPrintCss(pageCss)

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>${title}</title>
  <style>
    @page {
      size: ${CATALOG_PAGE.width}px ${CATALOG_PAGE.height}px;
      margin: 0;
    }
    ${printCss}
  </style>
</head>
<body>
  ${pagesHtml}
</body>
</html>`
}
