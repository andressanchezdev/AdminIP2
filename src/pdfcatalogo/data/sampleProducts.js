import { BRAND_LOGO_MAP } from '../lib/catalogLayout.js'

/** Misma imagen de producto del preview (GCS válida para muestra). */
export const SAMPLE_PRODUCT_IMAGE =
  'https://storage.googleapis.com/importadorapremiumonline/dependencias/img/productos/270100099/2%20(1).jpg'

/** 9 productos de muestra — mismos datos que preview/catalog-preview.html. */
export const SAMPLE_PRODUCTS = [
  {
    id: 7903,
    codigo: '270100099',
    categoria: 'MARRANA DE ENCENDIDO',
    descripcion: 'Marrana de encendido KLX',
    modelo: 'KLX 150',
    marca: 'kawasaki original',
    imagen: BRAND_LOGO_MAP.kawasaki,
    imagen_producto: SAMPLE_PRODUCT_IMAGE,
  },
  {
    id: 7904,
    codigo: '270100101',
    categoria: 'FILTROS',
    descripcion: 'Filtro de aire KLX',
    modelo: 'KLX 150',
    marca: 'kawasaki original',
    imagen: BRAND_LOGO_MAP.kawasaki,
    imagen_producto: SAMPLE_PRODUCT_IMAGE,
  },
  {
    id: 7905,
    codigo: '270100102',
    categoria: 'FRENOS',
    descripcion: 'Pastilla delantera KLX',
    modelo: 'KLX 150',
    marca: 'kawasaki original',
    imagen: BRAND_LOGO_MAP.kawasaki,
    imagen_producto: SAMPLE_PRODUCT_IMAGE,
  },
  {
    id: 7906,
    codigo: 'YZ-FR-001',
    categoria: 'FRENOS',
    descripcion: 'Pastilla delantera FZ',
    modelo: 'FZ 2.0',
    marca: 'Yamaha',
    imagen: BRAND_LOGO_MAP.yamaha,
    imagen_producto: SAMPLE_PRODUCT_IMAGE,
  },
  {
    id: 7907,
    codigo: 'YZ-FR-002',
    categoria: 'FRENOS',
    descripcion: 'Pastilla trasera FZ',
    modelo: 'FZ 2.0',
    marca: 'Yamaha',
    imagen: BRAND_LOGO_MAP.yamaha,
    imagen_producto: SAMPLE_PRODUCT_IMAGE,
  },
  {
    id: 7908,
    codigo: 'YZ-FA-125',
    categoria: 'FILTROS',
    descripcion: 'Filtro de aire XTZ',
    modelo: 'XTZ 125',
    marca: 'Yamaha',
    imagen: BRAND_LOGO_MAP.yamaha,
    imagen_producto: SAMPLE_PRODUCT_IMAGE,
  },
  {
    id: 7909,
    codigo: 'YZ-LL-140',
    categoria: 'LLANTAS',
    descripcion: 'Llanta trasera 140/70',
    modelo: 'FZ 2.0',
    marca: 'Yamaha',
    imagen: BRAND_LOGO_MAP.yamaha,
    imagen_producto: SAMPLE_PRODUCT_IMAGE,
  },
  {
    id: 7910,
    codigo: 'YZ-EL-011',
    categoria: 'ELECTRICOS',
    descripcion: 'Bateria 12V 5Ah',
    modelo: 'XTZ 125',
    marca: 'Yamaha',
    imagen: BRAND_LOGO_MAP.yamaha,
    imagen_producto: SAMPLE_PRODUCT_IMAGE,
  },
  {
    id: 7911,
    codigo: 'AK-AC-020',
    categoria: 'ACEITES',
    descripcion: 'Aceite 20W50',
    modelo: 'NKD 125',
    marca: 'AKT',
    imagen: BRAND_LOGO_MAP.akt,
    imagen_producto: SAMPLE_PRODUCT_IMAGE,
  },
]

export const SAMPLE_FILTER_SUMMARY =
  'Marca: Yamaha, AKT, Kawasaki  |  Categoria: Todas  |  Modelo: Todas'
