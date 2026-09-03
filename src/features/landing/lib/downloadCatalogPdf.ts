import { CATALOG_PRODUCTS } from '@/features/landing/catalogProducts'

const PX_TO_MM = 25.4 / 96
const PRICE_LIST_MARGIN_X = Math.max(6, 14 - (35 * PX_TO_MM) / 2)

const PDF_COLORS = {
  ink: [33, 37, 41] as const,
  muted: [108, 117, 125] as const,
  line: [206, 212, 218] as const,
  headerBg: [52, 58, 64] as const,
  headerFg: [255, 255, 255] as const,
  rowAlt: [248, 249, 250] as const,
  accent: [73, 80, 87] as const,
}

const COL_DEFS = [
  { key: 'reference', label: 'Codigo', weight: 42, align: 'left' as const },
  { key: 'catalogDetail', label: 'Producto', weight: 130, align: 'left' as const },
  { key: 'brand', label: 'Marca', weight: 54, align: 'left' as const },
  { key: 'price', label: 'Precio', weight: 34, align: 'right' as const },
]

type CatalogPdfRow = {
  reference: string
  catalogDetail: string
  brand: string
  price: string
}

function formatCOP(value: number) {
  return `$${value.toLocaleString('es-CO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

function pdfText(value: unknown) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, '')
    .trim()
}

function toUpper(value: unknown) {
  return String(value ?? '').trim().toLocaleUpperCase('es')
}

function truncate(value: string, maxLen: number) {
  const text = pdfText(value)
  return text.length <= maxLen ? text : `${text.slice(0, Math.max(0, maxLen - 1))}...`
}

function getMetrics(doc: any) {
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const marginX = PRICE_LIST_MARGIN_X
  const contentWidth = pageWidth - marginX * 2
  return { pageWidth, pageHeight, marginX, contentWidth, bottomLimit: pageHeight - 18 }
}

function getColumns(contentWidth: number) {
  const totalWeight = COL_DEFS.reduce((sum, col) => sum + col.weight, 0)
  return COL_DEFS.map((col) => ({
    ...col,
    width: (col.weight / totalWeight) * contentWidth,
  }))
}

function normalizeRows(): CatalogPdfRow[] {
  return CATALOG_PRODUCTS.map((product) => ({
    reference: truncate(toUpper(product.id), 16),
    catalogDetail: truncate(
      [toUpper(product.label), pdfText(product.description)].join(' '),
      90,
    ),
    brand: 'IMPORTADORA PREMIUM',
    price: formatCOP(0),
  }))
}

async function createDoc() {
  const { jsPDF } = await import('jspdf')
  return new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
}

function drawHeader(doc: any) {
  const { pageWidth, marginX, contentWidth } = getMetrics(doc)
  const headerH = 28
  doc.setFillColor(...PDF_COLORS.headerFg)
  doc.rect(0, 0, pageWidth, headerH, 'F')
  doc.setDrawColor(...PDF_COLORS.line)
  doc.setLineWidth(0.35)
  doc.line(0, headerH, pageWidth, headerH)

  doc.setTextColor(...PDF_COLORS.headerBg)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.text('Importadora Premium', marginX, 11)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text('Listado de precios', marginX, 16)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.text(`Cantidad de registros: ${CATALOG_PRODUCTS.length}`, marginX + contentWidth, 16, { align: 'right' })

  let y = headerH + 8
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(...PDF_COLORS.ink)
  doc.text('Filtros aplicados', marginX, y)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...PDF_COLORS.muted)
  doc.text('Sin filtros (catalogo disponible)', marginX, y + 5)
  doc.setDrawColor(...PDF_COLORS.line)
  doc.line(marginX, y + 8, marginX + contentWidth, y + 8)
  return y + 12
}

function drawTableHeader(doc: any, y: number, columns: ReturnType<typeof getColumns>) {
  const { marginX, contentWidth } = getMetrics(doc)
  const rowH = 8
  doc.setFillColor(...PDF_COLORS.accent)
  doc.rect(marginX, y, contentWidth, rowH, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(...PDF_COLORS.headerFg)

  let x = marginX + 1.5
  columns.forEach((col) => {
    const textY = y + 5.2
    if (col.align === 'right') doc.text(pdfText(col.label), x + col.width - 3, textY, { align: 'right' })
    else doc.text(pdfText(col.label), x, textY)
    x += col.width
  })
  return y + rowH
}

function drawRow(doc: any, row: CatalogPdfRow, y: number, alt: boolean, columns: ReturnType<typeof getColumns>) {
  const { marginX, contentWidth } = getMetrics(doc)
  const rowH = 7
  if (alt) {
    doc.setFillColor(...PDF_COLORS.rowAlt)
    doc.rect(marginX, y, contentWidth, rowH, 'F')
  }
  doc.setDrawColor(...PDF_COLORS.line)
  doc.setLineWidth(0.15)
  doc.line(marginX, y + rowH, marginX + contentWidth, y + rowH)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(...PDF_COLORS.ink)

  let x = marginX + 1.5
  columns.forEach((col) => {
    const value = row[col.key as keyof CatalogPdfRow] ?? ''
    const textY = y + 4.6
    if (col.align === 'right') doc.text(pdfText(value), x + col.width - 3, textY, { align: 'right' })
    else doc.text(pdfText(value), x, textY)
    x += col.width
  })
  return y + rowH
}

function drawFooter(doc: any, pageNumber: number, pageCount: number) {
  const { marginX, contentWidth, pageHeight } = getMetrics(doc)
  const y = pageHeight - 7
  doc.setDrawColor(...PDF_COLORS.line)
  doc.line(marginX, pageHeight - 12, marginX + contentWidth, pageHeight - 12)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...PDF_COLORS.muted)
  doc.text('Importadora Premium', marginX, y)
  doc.text(`Cantidad de registros: ${CATALOG_PRODUCTS.length}`, marginX + contentWidth / 2, y, { align: 'center' })
  doc.text(`Pagina ${pageNumber} de ${pageCount}`, marginX + contentWidth, y, { align: 'right' })
}

function finalizePages(doc: any) {
  const pageCount = doc.getNumberOfPages()
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page)
    drawFooter(doc, page, pageCount)
  }
}

function ensureSpace(doc: any, y: number, needed: number, onNewPage: () => number) {
  const { bottomLimit } = getMetrics(doc)
  if (y + needed <= bottomLimit) return y
  doc.addPage()
  return onNewPage()
}

export async function downloadCatalogPdf() {
  const rows = normalizeRows()
  const doc = await createDoc()
  const { contentWidth } = getMetrics(doc)
  const columns = getColumns(contentWidth)

  const startBody = () => {
    let y = drawHeader(doc)
    y = drawTableHeader(doc, y, columns)
    return y
  }

  let y = startBody()
  rows.forEach((row, index) => {
    y = ensureSpace(doc, y, 8, startBody)
    y = drawRow(doc, row, y, index % 2 === 1, columns)
  })

  finalizePages(doc)
  doc.save('listado-precios.pdf')
}
