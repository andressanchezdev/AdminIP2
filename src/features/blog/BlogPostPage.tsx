import { FormEvent, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  addBlogComment,
  getBlogPostBySlug,
  isBlogPostPubliclyVisible,
  listBlogComments,
} from '@/mocks/data'
import { notifyError, notifySuccess } from '@/shared/lib/notify'
import { BlogPostRenderer } from '@/features/blog/components/BlogPostRenderer'
import { PublicBlogShell } from '@/features/blog/PublicBlogShell'
import './BlogPublic.css'

export function BlogPostPage() {
  const { slug = '' } = useParams()
  const post = getBlogPostBySlug(slug)
  const [commentTick, setCommentTick] = useState(0)
  const refresh = () => setCommentTick((value) => value + 1)

  const comments = post
    ? listBlogComments(post.id)
    : []
  void commentTick

  const [authorName, setAuthorName] = useState('')
  const [body, setBody] = useState('')

  if (!post || !isBlogPostPubliclyVisible(post)) {
    return (
      <PublicBlogShell>
        <div className="blog-public">
          <p className="admin-empty">Publicación no encontrada.</p>
          <Link to="/blog" className="admin-btn admin-btn--ghost">Volver al blog</Link>
        </div>
      </PublicBlogShell>
    )
  }

  const submitComment = (event: FormEvent) => {
    event.preventDefault()
    const result = addBlogComment({ postId: post.id, authorName, body })
    if (!result.ok) {
      notifyError('No se pudo comentar', result.error)
      return
    }
    notifySuccess('Comentario publicado')
    setAuthorName('')
    setBody('')
    refresh()
  }

  return (
    <PublicBlogShell>
      <section className="blog-public">
        <Link to="/blog" className="blog-public__back">← Volver al blog</Link>
        <BlogPostRenderer post={post} />

        <div className="blog-comments">
          <h3>Comentarios</h3>
          {comments.length === 0 ? (
            <p className="admin-meta">Sé el primero en comentar.</p>
          ) : (
            <ul className="blog-comments__list">
              {comments.map((comment) => (
                <li key={comment.id} className="blog-comments__item">
                  <strong>{comment.authorName}</strong>
                  <span className="admin-meta">{comment.createdAt.slice(0, 16).replace('T', ' ')}</span>
                  <p>{comment.body}</p>
                </li>
              ))}
            </ul>
          )}
          <form className="blog-comments__form" onSubmit={submitComment}>
            <label className="admin-form__field">
              Nombre
              <input className="admin-input" value={authorName} onChange={(e) => setAuthorName(e.target.value)} />
            </label>
            <label className="admin-form__field">
              Comentario
              <textarea className="admin-input admin-textarea" rows={3} value={body} onChange={(e) => setBody(e.target.value)} />
            </label>
            <button type="submit" className="admin-btn">Comentar</button>
          </form>
        </div>
      </section>
    </PublicBlogShell>
  )
}
