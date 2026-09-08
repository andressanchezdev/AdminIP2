import headerIconUrl from '../assets/icon-BYLBN25J.ico'
import { CATALOG_PAGE } from './catalogLayout.js'
import { getCatalogPageCss } from './getCatalogPageCss.js'
import { buildCatalogDocumentHtml } from './buildCatalogDocument.js'
import { waitForImages } from './buildCatalogMarkup.js'
import { normalizeCatalogProduct } from './buildCatalogMarkup.js'

function buildFilterSummary(filters = {}) {
  if (typeof filters === 'string' && filters.trim()) {
    return filters.trim()
  }

  const parts = [
    filters.brand || filters.marca ? `Marca: ${filters.brand || filters.marca}` : null,
    filters.category || filters.categoria ? `Categoria: ${filters.category || filters.categoria}` : null,
    filters.model || filters.modelo ? `Modelo: ${filters.model || filters.modelo}` : null,
  ].filter(Boolean)

  return parts.length > 0 ? parts.join('  |  ') : 'Sin filtros'
}

function mountPrintDocumentIframe(html) {
  const iframe = document.createElement('iframe')
  iframe.setAttribute('data-catalog-pdf-frame', 'true')
  iframe.setAttribute('aria-hidden', 'true')
  iframe.style.cssText = [
    'position:fixed',
    `width:${CATALOG_PAGE.width}px`,
    `height:${CATALOG_PAGE.height}px`,
    'left:-14000px',
    'top:0',
    'border:0',
    'margin:0',
    'padding:0',
    'opacity:0',
    'pointer-events:none',
    'z-index:-1',
  ].join(';')

  document.body.appendChild(iframe)

  const doc = iframe.contentDocument
  doc.open()
  doc.write(html)
  doc.close()

  return iframe
}

function unmountPrintDocumentIframe(iframe) {
  if (iframe?.parentNode) {
    iframe.parentNode.removeChild(iframe)
  }
}

async function capturePageElement(pageEl, scale = 2) {
  const html2canvas = (await import('html2canvas')).default

  return html2canvas(pageEl, {
    backgroundColor: '#ffffff',
    width: CATALOG_PAGE.width,
    height: CATALOG_PAGE.height,
    windowWidth: CATALOG_PAGE.width,
    windowHeight: CATALOG_PAGE.height,
    scale,
    useCORS: true,
    allowTaint: false,
    logging: false,
    imageTimeout: 15000,
  })
}

/**
 * Descarga el catálogo PDF v2 — mismo documento HTML/CSS que
 * `npm run catalog:sample` (preview + overrides de impresión).
 *
 * Flujo:
 * 1) buildCatalogDocumentHtml (igual que la muestra).
 * 2) iframe offscreen → espera imágenes → html2canvas por página.
 * 3) Cada captura = 1 página A4 en jsPDF → save().
 */
export async function downloadCatalogPdf(options = {}) {
  const products = (Array.isArray(options.products) ? options.products : [])
    .map(normalizeCatalogProduct)

  const filterSummary = options.filterSummary
    || buildFilterSummary(options.filters)

  const scale = Number(options.scale) > 0 ? Number(options.scale) : 2
  const pageCss = getCatalogPageCss()
  const html = buildCatalogDocumentHtml({
    products,
    filterSummary,
    headerIconSrc: headerIconUrl,
    pageCss,
  })

  const iframe = mountPrintDocumentIframe(html)
  const frameDoc = iframe.contentDocument

  try {
    const pageNodes = Array.from(frameDoc.querySelectorAll('.page'))
    const totalPages = pageNodes.length
    const totalProducts = products.length

    await waitForImages(frameDoc.body)
    await new Promise((resolve) => {
      requestAnimationFrame(() => resolve())
    })

    const { jsPDF } = await import('jspdf')
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    })

    const pageWidthMm = doc.internal.pageSize.getWidth()
    const pageHeightMm = doc.internal.pageSize.getHeight()

    for (let index = 0; index < pageNodes.length; index += 1) {
      const canvas = await capturePageElement(pageNodes[index], scale)
      const dataUrl = canvas.toDataURL('image/jpeg', 0.95)

      if (index > 0) {
        doc.addPage()
      }
      doc.addImage(dataUrl, 'JPEG', 0, 0, pageWidthMm, pageHeightMm, undefined, 'FAST')
    }

    const stamp = Date.now()
    const filename = options.filename || `CatalogoProductos_${stamp}.pdf`
    doc.save(filename)
    return { pages: totalPages, products: totalProducts, filename }
  } finally {
    unmountPrintDocumentIframe(iframe)
  }
}
