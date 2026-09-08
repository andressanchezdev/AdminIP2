export { CATALOG_PAGE, CATALOG_COLORS, BRAND_LOGO_MAP } from './lib/catalogLayout.js'
export { getCatalogPageCss } from './lib/getCatalogPageCss.js'
export { extractCatalogCss } from './lib/extractCatalogCss.js'
export {
  buildCatalogDocumentHtml,
  composeCatalogPrintCss,
  composeCatalogCaptureCss,
} from './lib/buildCatalogDocument.js'
export { downloadCatalogPdf } from './lib/downloadCatalogPdf.js'
export {
  normalizeCatalogProduct,
  resolveMediaUrl,
  resolveBrandUrl,
  chunkProducts,
} from './lib/buildCatalogMarkup.js'
export {
  SAMPLE_PRODUCTS,
  SAMPLE_PRODUCT_IMAGE,
  SAMPLE_FILTER_SUMMARY,
} from './data/sampleProducts.js'
