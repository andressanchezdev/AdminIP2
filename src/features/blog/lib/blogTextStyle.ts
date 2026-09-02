import type { CSSProperties } from 'react'
import type { BlogBlockContent, BlogTextStyle } from '@/mocks/data'
import { BLOG_FONT_COLORS, BLOG_FONT_SIZES } from '@/mocks/data'

/** Paleta de marca para tipografía / fondos de bloque. */
export const BLOG_TEXT_PALETTE = [
  '#333333',
  '#2D3238',
  '#30363D',
  '#FFC629',
  '#E6E7E8',
  '#FFFFFF',
] as const

export const DEFAULT_BLOG_TEXT_STYLE: Required<
  Pick<BlogTextStyle, 'color' | 'fontSizePx' | 'backgroundColor' | 'paddingPx' | 'letterSpacingPx' | 'lineHeight'>
> & BlogTextStyle = {
  color: '#333333',
  fontSizePx: 16,
  backgroundColor: 'transparent',
  bold: false,
  italic: false,
  underline: false,
  uppercase: false,
  shadow: false,
  highlight: false,
  outline: false,
  strike: false,
  paddingPx: 0,
  letterSpacingPx: 0,
  lineHeight: 1.5,
}

export function clearBlogTextStyle(): BlogTextStyle {
  return {}
}

/** Resuelve estilo efectivo (incluye legacy fontSize/fontColor). */
export function resolveBlogTextStyle(block: BlogBlockContent): BlogTextStyle {
  const legacyColor = block.fontColor ? BLOG_FONT_COLORS[block.fontColor] : undefined
  const legacySize = block.fontSize
    ? Number.parseFloat(BLOG_FONT_SIZES[block.fontSize]) * 16
    : undefined
  return {
    color: block.textStyle?.color ?? legacyColor ?? DEFAULT_BLOG_TEXT_STYLE.color,
    fontSizePx: block.textStyle?.fontSizePx ?? legacySize ?? DEFAULT_BLOG_TEXT_STYLE.fontSizePx,
    backgroundColor: block.textStyle?.backgroundColor ?? DEFAULT_BLOG_TEXT_STYLE.backgroundColor,
    bold: block.textStyle?.bold ?? false,
    italic: block.textStyle?.italic ?? false,
    underline: block.textStyle?.underline ?? false,
    uppercase: block.textStyle?.uppercase ?? false,
    shadow: block.textStyle?.shadow ?? false,
    highlight: block.textStyle?.highlight ?? false,
    outline: block.textStyle?.outline ?? false,
    strike: block.textStyle?.strike ?? false,
    paddingPx: block.textStyle?.paddingPx ?? DEFAULT_BLOG_TEXT_STYLE.paddingPx,
    letterSpacingPx: block.textStyle?.letterSpacingPx ?? DEFAULT_BLOG_TEXT_STYLE.letterSpacingPx,
    lineHeight: block.textStyle?.lineHeight ?? DEFAULT_BLOG_TEXT_STYLE.lineHeight,
  }
}

export function blogTextStyleToCss(style: BlogTextStyle): CSSProperties {
  const decorations: string[] = []
  if (style.underline) decorations.push('underline')
  if (style.strike) decorations.push('line-through')

  return {
    color: style.color ?? DEFAULT_BLOG_TEXT_STYLE.color,
    fontSize: `${style.fontSizePx ?? DEFAULT_BLOG_TEXT_STYLE.fontSizePx}px`,
    backgroundColor: style.highlight
      ? 'color-mix(in srgb, var(--brand-gold, #FFC629) 42%, transparent)'
      : (style.backgroundColor && style.backgroundColor !== 'transparent'
        ? style.backgroundColor
        : undefined),
    fontWeight: style.bold ? 700 : 400,
    fontStyle: style.italic ? 'italic' : 'normal',
    textDecoration: decorations.length ? decorations.join(' ') : 'none',
    textTransform: style.uppercase ? 'uppercase' : 'none',
    textShadow: style.shadow
      ? (style.outline
        ? '0 0 1px #2D3238, 0 1px 2px rgba(45, 50, 56, 0.35)'
        : '0 1px 2px rgba(45, 50, 56, 0.35)')
      : (style.outline ? '0 0 1px #2D3238' : 'none'),
    WebkitTextStroke: style.outline ? '0.6px #2D3238' : undefined,
    padding: `${style.paddingPx ?? 0}px`,
    letterSpacing: `${style.letterSpacingPx ?? 0}px`,
    lineHeight: style.lineHeight ?? DEFAULT_BLOG_TEXT_STYLE.lineHeight,
  }
}

export function blockTextCss(block: BlogBlockContent): CSSProperties {
  return blogTextStyleToCss(resolveBlogTextStyle(block))
}
