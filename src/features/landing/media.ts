/** Rutas de media estático de la landing (`public/static/landing`). */
const LANDING_MEDIA_BASE = '/static/landing'

export function landingMedia(...parts: string[]) {
  return `${LANDING_MEDIA_BASE}/${parts.map((part) => encodeURIComponent(part)).join('/')}`
}

export const LANDING_IMAGES = {
  heroBg: [
    landingMedia('hero', 'hero-bg-01.jpeg'),
    landingMedia('hero', 'hero-bg-02.jpeg'),
  ],
  nosotros: landingMedia('company', 'nosotros.jpeg'),
  vision: landingMedia('company', 'vision.jpeg'),
  mission: landingMedia('company', 'mission.jpeg'),
  brandsBg: landingMedia('backgrounds', 'brands-gradient.png'),
  cuadrosBg: landingMedia('backgrounds', 'cuadros.png'),
  cuadrosInvertidoBg: landingMedia('backgrounds', 'cuadrosInvertido.png'),
  cuadros2Bg: landingMedia('backgrounds', 'cuadros2.png'),
  cuadros2InvertidoBg: landingMedia('backgrounds', 'cuadros2invertido.png'),
  employees: {
    bgPattern: landingMedia('employees', 'background', 'cuadros.png'),
  },
  catalog: {
    llanta1: landingMedia('catalog', 'llanta1.png'),
    llanta2: landingMedia('catalog', 'llanta2.png'),
    pastillas1: landingMedia('catalog', 'pastillas1.png'),
    pastillas2: landingMedia('catalog', 'pastillas2.png'),
    pinon1: landingMedia('catalog', 'pinon1.png'),
    pinon2: landingMedia('catalog', 'pinon2.png'),
    eje1: landingMedia('catalog', 'eje1.png'),
    eje2: landingMedia('catalog', 'eje2.png'),
    aceites1: landingMedia('catalog', 'aceites.jpeg'),
    aceites2: landingMedia('catalog', 'aceites2.jpeg'),
    ramal1: landingMedia('catalog', 'ramal1.png'),
    ramal2: landingMedia('catalog', 'ramal2.png'),
  },
} as const
