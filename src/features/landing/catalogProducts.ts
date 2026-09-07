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
    label: 'Aceite sintético 4T IP 10W-40',
    description: 'Lubricante sintético para motores de motocicleta de cuatro tiempos. Reduce fricción en arranques en frío y mantiene la película de aceite en viajes de carretera. Formulado con aditivos detergentes que limitan lodos y depósitos en pistón. Compatible con embragues húmedos JASO MA2. Presentación lista para cambio de aceite en taller o domicilio.',
    src: landingMedia('catalog', 'aceites.jpeg'),
  },
  {
    id: 'aceites-2',
    label: 'Aceite mineral 4T ciudad 20W-50',
    description: 'Aceite mineral de alto kilometraje para mantenimiento periódico en uso urbano. Estabilidad térmica en trayectos cortos con paradas frecuentes. Ayuda a conservar la limpieza interna del cárter y del filtro. Referencia habitual en flotas de mensajería y talleres de barrio. Cambio recomendado según intervalo del fabricante.',
    src: landingMedia('catalog', 'aceites2.jpeg'),
  },
  {
    id: 'aceites-3',
    label: 'Aceite premium anti-fricción 5W-40',
    description: 'Línea premium con paquete anti-fricción para motores exigidos en ruta y repechos. Baja la temperatura de operación sin perder viscosidad a altas revoluciones. Indicado para motociclistas que priorizan intervalos más largos. Stock verificado y lote trazable en bodega Importadora Premium.',
    src: landingMedia('catalog', 'aceites3.png'),
  },
  {
    id: 'aceites-4',
    label: 'Aceite multigrado 4T todas las estaciones',
    description: 'Multigrado para cambios de temporada en clima variable. Conserva fluidez en frío de madrugada y protección en calor de mediodía. Pensado para servicios programados de mantenimiento preventivo. Asesoría técnica incluida al cotizar viscosidad según modelo.',
    src: landingMedia('catalog', 'aceites.png'),
  },
  {
    id: 'amortiguador',
    label: 'Amortiguador trasero hidráulico',
    description: 'Amortiguador trasero de gas/aceite para recuperar control en baches y carga de pasajero. Mejora el contacto de la llanta trasera en piso irregular. Vástago protegido contra corrosión y retenes de recambio. Instalación asesorada para no alterar la geometría de la suspensión.',
    src: landingMedia('catalog', 'amortiguador.png'),
  },
  {
    id: 'barras',
    label: 'Barras de suspensión delantera',
    description: 'Par de barras telescópicas para la horquilla delantera. Recuperan alineación y suavidad cuando hay fugas o juego excesivo. Acabado cromado resistente a impactos de insectos y lluvia. Se cotizan por diámetro y recorrido según referencia de la moto.',
    src: landingMedia('catalog', 'barras.png'),
  },
  {
    id: 'correa',
    label: 'Correa de transmisión CVT',
    description: 'Correa de transmisión para scooters y sistemas CVT. Material compuesto resistente a fatiga, calor y deslizamiento. Restaura aceleración y evita tirones cuando la correa original está cristalizada. Reemplazo sugerido junto con rodillos si hay vibración al arrancar.',
    src: landingMedia('catalog', 'correa.png'),
  },
  {
    id: 'disco',
    label: 'Disco de freno ventilado',
    description: 'Disco de freno con ventilación para disipar calor en frenadas repetidas. Superficie mecanizada que favorece un tacto progresivo con pastillas nuevas. Reduce alabeo y ruido cuando se sustituye el disco gastado. Disponible en diámetros habituales de city y sport.',
    src: landingMedia('catalog', 'disco.png'),
  },
  {
    id: 'eje-1',
    label: 'Eje trasero de rueda',
    description: 'Eje trasero templado que centra la rueda y transmite el torque sin holgura. Tolerancias ajustadas para reducir vibración en la maza. Acabado protegido contra oxidación por agua y barro. Se valida rosca y longitud antes de despacho.',
    src: landingMedia('catalog', 'eje1.png'),
  },
  {
    id: 'eje-2',
    label: 'Eje de transmisión reforzado',
    description: 'Eje de cardán o transmisión reforzado para uso con carga y ruta. Diseño balanceado que disminuye desgaste irregular en crucetas o estriado. Material de alta resistencia a torsión. Soporte comercial para confirmar medida y estrías del modelo.',
    src: landingMedia('catalog', 'eje2.png'),
  },
  {
    id: 'llanta-1',
    label: 'Llanta urbana de alto kilometraje',
    description: 'Llanta con banda de rodadura para agarre en seco y mojado urbano. Compuesto de larga duración para uso diario. Carcasa firme que estabiliza la moto en avenidas y reducciones. Se despacha con índice de carga y velocidad según inventario.',
    src: landingMedia('catalog', 'llanta1.png'),
  },
  {
    id: 'llanta-2',
    label: 'Llanta sport con evacuación de agua',
    description: 'Llanta de perfil deportivo con canales que evacuan agua en curva. Respuesta rápida en cambios de carril y frenada. Equilibra confort y precisión de dirección. Cotización por medida (ancho, perfil y rin) con asesor.',
    src: landingMedia('catalog', 'llanta2.png'),
  },
  {
    id: 'mordaza-freno',
    label: 'Mordaza de freno hidráulica',
    description: 'Cáliper hidráulico con pistones sellados para una presión pareja sobre las pastillas. Recupera frenado cuando hay fugas, óxido o pistón pegado. Cuerpo robusto para uso diario en ciudad. Revisar manguera y líquido al instalar.',
    src: landingMedia('catalog', 'mordasa freno.png'),
  },
  {
    id: 'pastillas-1',
    label: 'Pastillas de freno orgánicas',
    description: 'Pastillas orgánicas de bajo ruido y buena modulación en tráfico. Menor desgaste del disco en uso citadino. Empaque con clips o sensores según referencia. Ideal para el primer recambio de seguridad preventiva.',
    src: landingMedia('catalog', 'pastillas1.png'),
  },
  {
    id: 'pastillas-2',
    label: 'Pastillas sinterizadas de alto desempeño',
    description: 'Pastillas sinterizadas para mayor mordida en ruta y descensos. Resisten fade cuando el disco alcanza alta temperatura. Compuesto para conducción exigente sin perder tacto en ciudad. Referencia con trazabilidad de proveedor y lote.',
    src: landingMedia('catalog', 'pastillas2.png'),
  },
  {
    id: 'pinon-1',
    label: 'Piñón de ataque de acero',
    description: 'Piñón de salida de caja en acero tratado. Dientes calibrados para alargar la vida de la cadena y reducir ruido. Tratamiento térmico anti-desgaste. Se pide por número de dientes y paso de cadena (428 / 520 / 525).',
    src: landingMedia('catalog', 'pinon1.png'),
  },
  {
    id: 'pinon-2',
    label: 'Corona trasera de arrastre',
    description: 'Corona (piñón trasero) para kits de arrastre. Relación de cambio según dientes: más bajos para ciudad o más largos para carretera. Acabado que reduce fricción y oxidación. Se recomienda cambiar junto con cadena y piñón de ataque.',
    src: landingMedia('catalog', 'pinon2.png'),
  },
  {
    id: 'ramal-1',
    label: 'Ramal eléctrico principal',
    description: 'Arnés principal con conectores sellados de fábrica. Aislamiento resistente a humedad, calor del motor y vibración. Ordena farola, switch y encendido sin empalmes improvisados. Revisado de continuidad antes de salir de bodega.',
    src: landingMedia('catalog', 'ramal1.png'),
  },
  {
    id: 'ramal-2',
    label: 'Ramal auxiliar de accesorios',
    description: 'Ramal secundario para direccionales, claxon o accesorios. Cableado flexible que sigue el chasis sin tensión. Terminales reforzados contra sulfatación. Se confirma polaridad y amperaje con el asesor antes de instalar.',
    src: landingMedia('catalog', 'ramal2.png'),
  },
  {
    id: 'rinaspa',
    label: 'Rin de aleación para rueda',
    description: 'Rin (rinspa) de aleación para renovar la rueda completa. Mejora alineación visual y reduce deformación frente a bordillos. Acabado resistente a impactos y corrosión. Verificar ancho, diámetros de buje y patrón de pernos al cotizar.',
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
