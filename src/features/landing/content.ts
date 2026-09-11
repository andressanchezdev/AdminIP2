import marcasLogosData from '@/data/landing/marcasLogos.json'
import landingContentJson from '@/mocks/landingContent.json'

export const HERO_BG_MS = 2500

export const STATS_SLIDES = landingContentJson.stats

export const CATALOG_OPTIONS = landingContentJson.catalog.options.map((option) => ({
  id: option.id,
  label: option.label,
  images: [option.images[0], option.images[1]] as [string, string],
}))

export const CATALOG_CAROUSEL_MS = 3500

export const CATALOG_MULTI_INDICES = CATALOG_OPTIONS
  .map((option, index) => (option.images.length > 1 ? index : -1))
  .filter((index) => index >= 0)

/** Acceso del quad que abre la vista secundaria `/explorar/:slug`. */
export const QUAD_EXPLORE_LINKS = [
  { slug: 'catalogo', label: 'Catálogo de productos' },
] as const

/** Barra del header público: secciones, blog y sesión (un solo bloque). */
export const LANDING_HEADER_ITEMS = [
  { kind: 'explore' as const, slug: 'catalogo', label: 'Catálogo' },
  { kind: 'explore' as const, slug: 'vacantes', label: 'Trabaja con nosotros' },
  { kind: 'anchor' as const, href: '#equipo', label: 'Nuestro equipo' },
  { kind: 'anchor' as const, href: '#nosotros', label: '¿Nosotros?' },
  { kind: 'anchor' as const, href: '#marcas', label: 'Marcas' },
  { kind: 'route' as const, to: '/blog', label: 'Ver blog' },
  { kind: 'session' as const, label: 'Iniciar sesión' },
] as const

export const MARCA_ENTRIES = Object.entries(marcasLogosData.marcas).map(([name, url]) => ({
  name,
  url,
}))

/** Contacto y redes del footer / ubicación (estático). */
const CONTACT_PHONE_DIGITS = '5731261495527'

export const LANDING_CONTACT = {
  phoneDisplay: '+57 312 614 95527',
  email: 'comercial@importadorapremium.com',
  addressLabel: 'Dirección',
  address: 'Carrera 51 # 40 - 22',
  city: 'Medellín',
  region: 'Antioquia',
  country: 'Colombia',
  area: 'el centro de Medellín',
  landmark: 'a media cuadra de la estación Alpujarra del Metro de Medellín',
  hoursWeekdays: 'Lunes a viernes: 8:00 a. m. a 6:00 p. m.',
  hoursSaturday: 'Sábados: 8:00 a. m. a 3:00 p. m.',
  hoursDisplay: 'Lunes a viernes de 8:00 a. m. a 6:00 p. m. y sábados de 8:00 a. m. a 3:00 p. m.',
  mapsShareUrl: 'https://maps.app.goo.gl/tHTvYZvbrqpy7Wrv8',
  lat: 6.241189,
  lng: -75.571933,
  zoom: 16,
  whatsappUrl: `https://wa.me/${CONTACT_PHONE_DIGITS}`,
  social: [
    {
      id: 'instagram',
      label: 'Instagram',
      href: 'https://www.instagram.com/importadora.premium?igsi=djFwZThjNXFnbzM1',
    },
    {
      id: 'tiktok',
      label: 'TikTok',
      href: 'https://www.tiktok.com/@importadora.premium0?_r=1&_t=ZS-99LlIwoqnw5',
    },
    {
      id: 'facebook',
      label: 'Facebook',
      href: 'https://www.facebook.com/share/1DaKoZinoM/',
    },
  ],
} as const

/** Medios de pago alineados con VentasIP (efectivo, transferencia, crédito interno). */
export const LANDING_PAYMENTS = {
  cashLabel: 'efectivo',
  transferLabel: 'transferencia',
  bank: 'Bancolombia',
  accountType: 'Cuenta de ahorros',
  accountNumber: '',
  holder: 'Importadora Premium',
} as const

export const FOOTER_NAV_LINKS = [
  { href: '#vision', label: 'Visión' },
  { href: '#mission', label: 'Misión' },
  { href: '#catalogo', label: 'Catálogo' },
  { href: '#marcas', label: 'Marcas' },
  { href: '#equipo', label: 'Equipo' },
  { href: '#nosotros', label: 'Nosotros' },
  { href: '#ubicacion', label: 'Ubicación' },
  { href: '#contacto', label: 'Contacto' },
] as const
