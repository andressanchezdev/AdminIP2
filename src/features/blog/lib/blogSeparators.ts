import type { BlogSeparatorVariant } from '@/mocks/data'

export type BlogSeparatorOption = {
  id: BlogSeparatorVariant
  name: string
  description: string
}

/** 7 maquetas de separador (colores COLOR.md). */
export const BLOG_SEPARATOR_OPTIONS: BlogSeparatorOption[] = [
  {
    id: 'gold-line',
    name: 'Línea dorada',
    description: 'Regla fina en oro de marca',
  },
  {
    id: 'dark-band',
    name: 'Banda oscura',
    description: 'Franja #2D3238 con acento dorado',
  },
  {
    id: 'split-rule',
    name: 'Doble regla',
    description: 'Líneas gris claro y logo',
  },
  {
    id: 'dot-accent',
    name: 'Punto Premium',
    description: 'Punto dorado entre líneas suaves',
  },
  {
    id: 'gold-dash',
    name: 'Trazo dorado',
    description: 'Línea discontinua #FFC629',
  },
  {
    id: 'brand-frame',
    name: 'Marco marca',
    description: 'Barras laterales oscuras + centro claro',
  },
  {
    id: 'lineas-ip',
    name: 'lineasIp',
    description: 'Línea dorada + línea #2D3238',
  },
]

export function separatorLabel(variant: BlogSeparatorVariant) {
  return BLOG_SEPARATOR_OPTIONS.find((item) => item.id === variant)?.name ?? 'Separador'
}
