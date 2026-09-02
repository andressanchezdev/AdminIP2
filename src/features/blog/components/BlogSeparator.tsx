import type { BlogSeparatorVariant } from '@/mocks/data'
import { separatorLabel } from '@/features/blog/lib/blogSeparators'
import './BlogSeparator.css'

type BlogSeparatorProps = {
  variant: BlogSeparatorVariant
  compact?: boolean
}

/** Separador visual entre publicaciones del feed. */
export function BlogSeparator({ variant, compact = false }: BlogSeparatorProps) {
  return (
    <div
      className={`blog-separator blog-separator--${variant}${compact ? ' blog-separator--compact' : ''}`}
      role="separator"
      aria-label={separatorLabel(variant)}
    >
      {variant === 'gold-line' ? <span className="blog-separator__line" /> : null}
      {variant === 'dark-band' ? (
        <span className="blog-separator__band">
          <span className="blog-separator__band-accent" />
        </span>
      ) : null}
      {variant === 'split-rule' ? (
        <span className="blog-separator__split">
          <span className="blog-separator__split-top" />
          <span className="blog-separator__split-bottom" />
        </span>
      ) : null}
      {variant === 'dot-accent' ? (
        <span className="blog-separator__dots">
          <span className="blog-separator__dots-line" />
          <span className="blog-separator__dots-mark" />
          <span className="blog-separator__dots-line" />
        </span>
      ) : null}
      {variant === 'gold-dash' ? <span className="blog-separator__dash" /> : null}
      {variant === 'brand-frame' ? (
        <span className="blog-separator__frame">
          <span className="blog-separator__frame-side" />
          <span className="blog-separator__frame-mid" />
          <span className="blog-separator__frame-side blog-separator__frame-side--end" />
        </span>
      ) : null}
      {variant === 'lineas-ip' ? (
        <span className="blog-separator__lineas-ip">
          <span className="blog-separator__lineas-ip-gold" />
          <span className="blog-separator__lineas-ip-dark" />
        </span>
      ) : null}
    </div>
  )
}
