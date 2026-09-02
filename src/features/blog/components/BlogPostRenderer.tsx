import type { BlogLayout, BlogPost } from '@/mocks/data'
import { layoutGridStyle } from '@/features/blog/lib/blogLayouts'
import { blockTextCss, blogTextStyleToCss, resolveBlogTextStyle } from '@/features/blog/lib/blogTextStyle'
import { renderTextWithLinks } from '@/features/blog/lib/textLinks'
import { BlogSeparator } from '@/features/blog/components/BlogSeparator'
import { IgCarousel } from '@/features/blog/components/IgCarousel'
import './BlogPostRenderer.css'

type BlogPostRendererProps = {
  post: BlogPost
  compact?: boolean
  className?: string
}

export function BlogPostRenderer({ post, compact = false, className = '' }: BlogPostRendererProps) {
  if (post.kind === 'separator' && post.separatorVariant) {
    return <BlogSeparator variant={post.separatorVariant} compact={compact} />
  }

  const layout = post.layoutSnapshot
  const isIg = layout.id === 'post_ig'
  const titleCss = blogTextStyleToCss(resolveBlogTextStyle({ textStyle: post.titleStyle }))
  return (
    <article
      className={`blog-post ${compact ? 'blog-post--compact' : ''} ${isIg ? 'blog-post--ig' : ''} ${className}`.trim()}
      data-layout={layout.id}
      data-orientation={layout.orientation}
    >
      {!compact ? (
        <h2 className="blog-post__title" style={titleCss}>{renderTextWithLinks(post.title)}</h2>
      ) : (
        <h3 className="blog-post__title blog-post__title--compact" style={titleCss}>{renderTextWithLinks(post.title)}</h3>
      )}
      <BlogLayoutGrid layout={layout} blocks={post.blocks} compact={compact} />
    </article>
  )
}

type BlogLayoutGridProps = {
  layout: BlogLayout
  blocks: BlogPost['blocks']
  compact?: boolean
}

export function BlogLayoutGrid({ layout, blocks, compact = false }: BlogLayoutGridProps) {
  return (
    <div className="blog-layout-grid" style={layoutGridStyle(layout)}>
      {layout.slots.map((slot) => {
        const content = blocks[slot.id] ?? {}
        const isTextual = slot.type === 'text' || slot.type === 'heading'
        const style = isTextual ? blockTextCss(content) : undefined
        return (
          <div
            key={slot.id}
            className={`blog-slot blog-slot--${slot.type}`}
            style={{ gridArea: slot.area, ...(isTextual ? style : {}) }}
          >
            {slot.type === 'carousel' ? (
              <IgCarousel
                images={content.imageUrls ?? []}
                alt={slot.label}
                compact={compact}
              />
            ) : null}
            {slot.type === 'image' ? (
              content.imageUrl ? (
                <img src={content.imageUrl} alt={slot.label} className="blog-slot__image" />
              ) : (
                <div className="blog-slot__placeholder">Sin imagen</div>
              )
            ) : null}
            {slot.type === 'heading' ? (
              <h4 className="blog-slot__heading">{renderTextWithLinks(content.text || '')}</h4>
            ) : null}
            {slot.type === 'text' ? (
              <p className={`blog-slot__text${layout.id === 'post_ig' ? ' blog-slot__text--caption' : ''}`}>
                {renderTextWithLinks(content.text || '')}
              </p>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}
