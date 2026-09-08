import { downloadCatalogPdf } from '@/pdfcatalogo'
import { CATALOG_PRODUCTS } from '../catalogProducts'

export async function downloadLandingCatalog() {
  const products = CATALOG_PRODUCTS.map((product) => ({
    id: product.id,
    codigo: product.id,
    categoria: product.label,
    descripcion: product.description,
    modelo: '',
    marca: 'Importadora Premium',
    imagen_producto: product.src,
  }))

  return downloadCatalogPdf({
    products,
    filterSummary: 'Catalogo de productos',
    filename: `CatalogoProductos_${Date.now()}.pdf`,
  })
}
