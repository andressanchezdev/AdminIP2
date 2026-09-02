import marcasLogosData from '@/data/landing/marcasLogos.json'
import { LANDING_IMAGES } from './media'

export const HERO_BG_MS = 2500

export const STATS_SLIDES = [
  {
    id: 'productos',
    lead: 'Más de',
    value: 23800,
    trail: 'Productos',
    duration: 1200,
    blurStrength: 1.05,
    maxBlur: 12,
  },
  {
    id: 'categorias',
    lead: 'Más de',
    value: 1390,
    trail: 'Categorías',
    duration: 800,
    blurStrength: 0.9,
    maxBlur: 10,
  },
  {
    id: 'referencias',
    lead: 'Más de',
    value: 35100,
    trail: 'Referencias para moto',
    duration: 1300,
    blurStrength: 1.15,
    maxBlur: 14,
  },
] as const

export const CATALOG_OPTIONS = [
  {
    id: 'llantas',
    label: 'Llantas',
    images: [LANDING_IMAGES.catalog.llanta1, LANDING_IMAGES.catalog.llanta2],
  },
  {
    id: 'pastillas',
    label: 'Pastillas',
    images: [LANDING_IMAGES.catalog.pastillas1, LANDING_IMAGES.catalog.pastillas2],
  },
  {
    id: 'pinon',
    label: 'Piñones',
    images: [LANDING_IMAGES.catalog.pinon1, LANDING_IMAGES.catalog.pinon2],
  },
  {
    id: 'ejes',
    label: 'Ejes',
    images: [LANDING_IMAGES.catalog.eje1, LANDING_IMAGES.catalog.eje2],
  },
  {
    id: 'aceite',
    label: 'Aceites',
    images: [LANDING_IMAGES.catalog.aceites1, LANDING_IMAGES.catalog.aceites2],
  },
  {
    id: 'ramal',
    label: 'Ramales',
    images: [LANDING_IMAGES.catalog.ramal1, LANDING_IMAGES.catalog.ramal2],
  },
] as const

export const CATALOG_CAROUSEL_MS = 3500

export const CATALOG_MULTI_INDICES = CATALOG_OPTIONS
  .map((option, index) => (option.images.length > 1 ? index : -1))
  .filter((index) => index >= 0)

const ADVISOR_WHATSAPP = '5731261495527'

export const CAROUSEL_ITEMS = [
  {
    id: 'aleja',
    title: 'Asesora',
    name: 'Aleja',
    phoneDisplay: '+57 312 614 95527',
    whatsappUrl: `https://wa.me/${ADVISOR_WHATSAPP}`,
    image: LANDING_IMAGES.employees.aleja,
  },
  {
    id: 'lina',
    title: 'Asesora',
    name: 'Lina',
    phoneDisplay: '+57 312 614 95527',
    whatsappUrl: `https://wa.me/${ADVISOR_WHATSAPP}`,
    image: LANDING_IMAGES.employees.lina,
  },
  {
    id: 'monica',
    title: 'Asesora',
    name: 'Mónica',
    phoneDisplay: '+57 312 614 95527',
    whatsappUrl: `https://wa.me/${ADVISOR_WHATSAPP}`,
    image: LANDING_IMAGES.employees.monica,
  },
  {
    id: 'naya',
    title: 'Asesora',
    name: 'Naya',
    phoneDisplay: '+57 312 614 95527',
    whatsappUrl: `https://wa.me/${ADVISOR_WHATSAPP}`,
    image: LANDING_IMAGES.employees.naya,
  },
  {
    id: 'rafa',
    title: 'Asesor',
    name: 'Rafa',
    phoneDisplay: '+57 312 614 95527',
    whatsappUrl: `https://wa.me/${ADVISOR_WHATSAPP}`,
    image: LANDING_IMAGES.employees.rafa,
  },
  {
    id: 'rosio',
    title: 'Asesora',
    name: 'Rocío',
    phoneDisplay: '+57 312 614 95527',
    whatsappUrl: `https://wa.me/${ADVISOR_WHATSAPP}`,
    image: LANDING_IMAGES.employees.rosio,
  },
  {
    id: 'santiago',
    title: 'Asesor',
    name: 'Santiago',
    phoneDisplay: '+57 312 614 95527',
    whatsappUrl: `https://wa.me/${ADVISOR_WHATSAPP}`,
    image: LANDING_IMAGES.employees.santiago,
  },
] as const

/** Acceso del quad que abre la vista secundaria `/explorar/:slug`. */
export const QUAD_EXPLORE_LINKS = [
  { slug: 'catalogo', label: 'Catálogo de productos' },
] as const

/** Orden visual del grid 2×2 (explorar + anclas). */
export const QUAD_LINKS = [
  { kind: 'explore' as const, slug: 'catalogo', label: 'Catálogo completo' },
  { kind: 'anchor' as const, href: '#equipo', label: 'Nuestro equipo' },
  { kind: 'anchor' as const, href: '#marcas', label: 'Nuestras marcas' },
  { kind: 'anchor' as const, href: '#nosotros', label: 'Nosotros' },
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
