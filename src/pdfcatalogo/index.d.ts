export function downloadCatalogPdf(options?: {
  products?: unknown[]
  filterSummary?: string
  filename?: string
  filters?: Record<string, string>
  scale?: number
}): Promise<{ pages: number; products: number; filename: string }>
