import { landingMedia } from './media'

/** Ajuste dentro del marco fijo del hero; no altera dimensiones del contenedor. */
export type CatalogImageFit = {
  objectFit: 'contain' | 'cover' | 'scale-down'
  objectPosition: string
}

export const DEFAULT_CATALOG_IMAGE_FIT: CatalogImageFit = {
  objectFit: 'contain',
  objectPosition: 'center center',
}

/** Hero: cubre el marco fijo sin dejar espacio vacío (recorta si hace falta). */
export const DEFAULT_CATALOG_HERO_IMAGE_FIT: CatalogImageFit = {
  objectFit: 'cover',
  objectPosition: 'center center',
}

export type CatalogProduct = {
  id: string
  label: string
  description: string
  src: string
  /** Miniaturas de galería */
  fit: CatalogImageFit
  /** Marco fijo del hero (cover, sin espacios vacíos) */
  heroFit: CatalogImageFit
}

type CatalogProductInput = Omit<CatalogProduct, 'fit' | 'heroFit'>

const catalogFit = (overrides?: Partial<CatalogImageFit>): CatalogImageFit => ({
  ...DEFAULT_CATALOG_IMAGE_FIT,
  ...overrides,
})

const withCatalogFit = (products: readonly CatalogProductInput[]): readonly CatalogProduct[] =>
  products.map((product) => ({
    ...product,
    fit: catalogFit(),
    heroFit: catalogFit(DEFAULT_CATALOG_HERO_IMAGE_FIT),
  }))

/** Variables CSS para el marco fijo del hero (imagen a pantalla completa del contenedor). */
export function catalogHeroImageFitVars(product: CatalogProduct): Record<string, string> {
  return {
    '--catalog-fit': product.heroFit.objectFit,
    '--catalog-position': product.heroFit.objectPosition,
  }
}

/** Variables CSS para miniaturas de galería. */
export function catalogImageFitVars(product: CatalogProduct): Record<string, string> {
  return {
    '--catalog-fit': product.fit.objectFit,
    '--catalog-position': product.fit.objectPosition,
  }
}

/** Productos en `public/static/landing/catalog`. */
export const CATALOG_PRODUCTS = withCatalogFit([
  {
    id: 'aceites',
    label: 'Aceites',
    description: 'Lubricante sintético para motor de alto rendimiento. Protege contra desgaste en condiciones exigentes. Compatible con motos 4T de uso urbano y carretera. Presentación lista para despacho inmediato.',
    src: landingMedia('catalog', 'aceites.jpeg'),
  },
  {
    id: 'aceites-2',
    label: 'Aceites 2',
    description: 'Aceite mineral formulado para mantenimiento periódico. Estabilidad térmica para trayectos diarios. Ayuda a conservar la limpieza interna del motor. Referencia confiable para flotas y talleres.',
    src: landingMedia('catalog', 'aceites2.jpeg'),
  },
  {
    id: 'aceites-3',
    label: 'Aceites 3',
    description: 'Línea premium con aditivos anti-fricción. Reduce temperatura de operación en motores exigidos. Ideal para motociclistas que buscan mayor duración. Stock verificado en bodega Importadora Premium.',
    src: landingMedia('catalog', 'aceites3.png'),
  },
  {
    id: 'aceites-4',
    label: 'Aceites 4',
    description: 'Aceite multigrado para cambios de temporada. Mantiene viscosidad estable en frío y calor. Recomendado para servicios programados de mantenimiento. Asesoría técnica disponible al cotizar.',
    src: landingMedia('catalog', 'aceites.png'),
  },
  {
    id: 'amortiguador',
    label: 'Amortiguador',
    description: 'Amortiguador trasero reforzado para mejor absorción de impacto. Mejora estabilidad en piso irregular y cargas variables. Fabricación con estándares de resistencia comprobados. Instalación asesorada por nuestro equipo.',
    src: landingMedia('catalog', 'amortiguador.png'),
  },
  {
    id: 'barras',
    label: 'Barras',
    description: 'Barra estabilizadora para optimizar el control en curvas. Reduce balanceo lateral en conducción deportiva. Acabado anticorrosión para mayor vida útil. Referencia disponible para múltiples modelos.',
    src: landingMedia('catalog', 'barras.png'),
  },
  {
    id: 'correa',
    label: 'Correa',
    description: 'Correa de transmisión con trazabilidad de lote. Material resistente a fatiga y temperatura. Transmite potencia con menor pérdida de energía. Reemplazo recomendado según kilometraje del fabricante.',
    src: landingMedia('catalog', 'correa.png'),
  },
  {
    id: 'disco',
    label: 'Disco',
    description: 'Disco de freno ventilado para disipación térmica eficiente. Superficie mecanizada para frenado progresivo y seguro. Compatible con pastillas de alto desempeño. Entrega ágil a nivel nacional.',
    src: landingMedia('catalog', 'disco.png'),
  },
  {
    id: 'eje-1',
    label: 'Eje 1',
    description: 'Eje trasero templado para transmisión de torque constante. Tolerancias precisas que reducen vibraciones. Acabado protegido contra oxidación. Validado para uso continuo en ruta y ciudad.',
    src: landingMedia('catalog', 'eje1.png'),
  },
  {
    id: 'eje-2',
    label: 'Eje 2',
    description: 'Eje de transmisión reforzado para aplicaciones exigentes. Diseño balanceado para menor desgaste en cadena. Material de alta resistencia mecánica. Soporte comercial para selección de medida.',
    src: landingMedia('catalog', 'eje2.png'),
  },
  {
    id: 'llanta-1',
    label: 'Llanta 1',
    description: 'Llanta con banda de rodadura para agarre en seco y mojado. Compuesto diseñado para mayor kilometraje. Estructura rígida que mejora estabilidad en velocidad. Medidas disponibles según inventario.',
    src: landingMedia('catalog', 'llanta1.png'),
  },
  {
    id: 'llanta-2',
    label: 'Llanta 2',
    description: 'Llanta deportiva con evacuación de agua optimizada. Respuesta rápida en maniobras urbanas. Perfil que combina confort y control. Cotización inmediata con asesor especializado.',
    src: landingMedia('catalog', 'llanta2.png'),
  },
  {
    id: 'mordaza-freno',
    label: 'Mordaza de freno',
    description: 'Mordaza hidráulica con pistones sellados de precisión. Frenado uniforme en condiciones exigentes. Construcción robusta para uso intensivo diario. Recomendada para mantenimiento preventivo de seguridad.',
    src: landingMedia('catalog', 'mordasa freno.png'),
  },
  {
    id: 'pastillas-1',
    label: 'Pastillas 1',
    description: 'Pastillas orgánicas de bajo ruido y excelente modulación. Desgaste controlado del disco de freno. Rendimiento confiable en tráfico urbano. Empaque listo para instalación en taller.',
    src: landingMedia('catalog', 'pastillas1.png'),
  },
  {
    id: 'pastillas-2',
    label: 'Pastillas 2',
    description: 'Pastillas sinterizadas para mayor poder de frenado. Resistencia a altas temperaturas en ruta. Compuesto diseñado para conducción exigente. Referencia con trazabilidad de proveedor.',
    src: landingMedia('catalog', 'pastillas2.png'),
  },
  {
    id: 'pinon-1',
    label: 'Piñón 1',
    description: 'Piñón de acero tratado para transmisión precisa. Dientes calibrados que prolongan vida de la cadena. Tratamiento térmico anti-desgaste. Medida consultable según modelo de moto.',
    src: landingMedia('catalog', 'pinon1.png'),
  },
  {
    id: 'pinon-2',
    label: 'Piñón 2',
    description: 'Piñón reforzado para relaciones de cambio deportivas. Acabado que reduce fricción interna. Compatible con kits de arrastre premium. Despacho rápido desde inventario central.',
    src: landingMedia('catalog', 'pinon2.png'),
  },
  {
    id: 'ramal-1',
    label: 'Ramal 1',
    description: 'Ramal eléctrico con conectores sellados de fábrica. Aislamiento resistente a humedad y vibración. Instalación ordenada para sistema de iluminación. Calidad verificada antes de salida de bodega.',
    src: landingMedia('catalog', 'ramal1.png'),
  },
  {
    id: 'ramal-2',
    label: 'Ramal 2',
    description: 'Ramal auxiliar para accesorios y señalización. Cableado flexible para rutas internas de chasis. Terminales reforzados contra sulfatación. Asesoría para compatibilidad eléctrica.',
    src: landingMedia('catalog', 'ramal2.png'),
  },
  {
    id: 'rinaspa',
    label: 'Riñaspa',
    description: 'Riñaspa reforzada para soporte de llanta en condiciones severas. Mejora alineación y reduce golpes en bordillo. Acabado resistente a impactos y corrosión. Opción ideal para renovación de rueda completa.',
    src: landingMedia('catalog', 'rinaspa.png'),
  },
] as const)

const SLUG_PREFIXES: Record<string, readonly string[]> = {
  llantas: ['llanta'],
  pastillas: ['pastillas'],
  pinon: ['pinon'],
  ejes: ['eje'],
  aceite: ['aceites'],
  ramal: ['ramal'],
}

export function resolveInitialCatalogIndex(
  slug: string,
  pageImages: readonly string[],
): number {
  const byImage = CATALOG_PRODUCTS.findIndex((product) => pageImages.includes(product.src))
  if (byImage >= 0) return byImage

  const prefixes = SLUG_PREFIXES[slug]
  if (prefixes) {
    const bySlug = CATALOG_PRODUCTS.findIndex((product) =>
      prefixes.some((prefix) => product.id.startsWith(prefix)),
    )
    if (bySlug >= 0) return bySlug
  }

  return 0
}
