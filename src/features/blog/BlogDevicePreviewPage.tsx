import { useParams, useSearchParams } from 'react-router-dom'
import { getBlogPostById } from '@/mocks/data'
import { BlogPostRenderer } from '@/features/blog/components/BlogPostRenderer'
import '@/features/blog/BlogPublic.css'
import './BlogDevicePreviewPage.css'

const DEVICE_LABEL: Record<string, string> = {
  mobile: 'Móvil',
  tablet: 'Tablet',
  pc: 'PC',
}

/** Vista previa de publicación en ventana propia (sin shell admin). */
export function BlogDevicePreviewPage() {
  const { postId = '' } = useParams()
  const [params] = useSearchParams()
  const device = params.get('device') || 'pc'
  const post = getBlogPostById(postId)

  if (!post || post.kind !== 'post') {
    return (
      <div className="blog-device-preview-page">
        <p className="admin-empty">Publicación no encontrada.</p>
      </div>
    )
  }

  return (
    <div className="blog-device-preview-page" data-device={device}>
      <header className="blog-device-preview-page__bar">
        <strong>{post.title}</strong>
        <span>{DEVICE_LABEL[device] || 'Vista previa'}</span>
      </header>
      <main className="blog-device-preview-page__body">
        <BlogPostRenderer post={post} />
      </main>
    </div>
  )
}
