import { FormEvent, type ReactNode, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import ipLogo from '@/assets/logos/icon.ico'
import { createBlogSubmission } from '@/mocks/data'
import { notifyError, notifySuccess } from '@/shared/lib/notify'
import './BlogPublic.css'

type PublicBlogShellProps = {
  children: ReactNode
  /** Si true, muestra el CTA de solicitud en el header (blog público). */
  allowSubmissionRequest?: boolean
}

/** Shell mínimo para el blog público (extensión de la landing; sin login). */
export function PublicBlogShell({
  children,
  allowSubmissionRequest = true,
}: PublicBlogShellProps) {
  const [requestOpen, setRequestOpen] = useState(false)
  const [authorName, setAuthorName] = useState('')
  const [authorEmail, setAuthorEmail] = useState('')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [imageUrls, setImageUrls] = useState('')

  const submitRequest = (event: FormEvent) => {
    event.preventDefault()
    const result = createBlogSubmission({
      authorName,
      authorEmail,
      title,
      content,
      imageUrls: imageUrls.split('\n').map((line) => line.trim()).filter(Boolean),
    })
    if (!result.ok) {
      notifyError('No se pudo enviar', result.error)
      return
    }
    notifySuccess('Solicitud enviada', 'El equipo la revisará en Gestión Blog')
    setAuthorName('')
    setAuthorEmail('')
    setTitle('')
    setContent('')
    setImageUrls('')
    setRequestOpen(false)
  }

  return (
    <div className="blog-shell">
      <header className="blog-shell__header">
        <Link to="/" className="blog-shell__back" aria-label="Volver al inicio">
          <ArrowLeft size={22} strokeWidth={2} aria-hidden />
        </Link>
        <Link to="/" className="blog-shell__brand" aria-label="Importadora Premium — ir al inicio">
          <img src={ipLogo} alt="" width={28} height={28} />
          <span>Blog Importadora Premium </span>
        </Link>
        <div className="blog-shell__header-actions">
          {allowSubmissionRequest ? (
            <button
              type="button"
              className="blog-shell__request-btn"
              onClick={() => setRequestOpen((open) => !open)}
            >
              Solicitar publicación
            </button>
          ) : null}
        </div>
      </header>
      <main className="blog-shell__main">
        {requestOpen ? (
          <form className="blog-request admin-card" onSubmit={submitRequest}>
            <h3>Solicitar publicación en el blog</h3>
            <label className="admin-form__field">
              Nombre
              <input className="admin-input" value={authorName} onChange={(e) => setAuthorName(e.target.value)} />
            </label>
            <label className="admin-form__field">
              Correo
              <input className="admin-input" type="email" value={authorEmail} onChange={(e) => setAuthorEmail(e.target.value)} />
            </label>
            <label className="admin-form__field">
              Título propuesto
              <input className="admin-input" value={title} onChange={(e) => setTitle(e.target.value)} />
            </label>
            <label className="admin-form__field">
              Contenido
              <textarea className="admin-input admin-textarea" rows={5} value={content} onChange={(e) => setContent(e.target.value)} />
            </label>
            <label className="admin-form__field">
              URLs de imágenes (una por línea)
              <textarea
                className="admin-input admin-textarea"
                rows={3}
                value={imageUrls}
                onChange={(e) => setImageUrls(e.target.value)}
                placeholder="https://…"
              />
            </label>
            <div className="blog-request__actions">
              <button type="button" className="admin-btn admin-btn--ghost" onClick={() => setRequestOpen(false)}>
                Cancelar
              </button>
              <button type="submit" className="admin-btn">Enviar solicitud</button>
            </div>
          </form>
        ) : null}
        {children}
      </main>
    </div>
  )
}
