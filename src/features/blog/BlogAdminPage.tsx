import { useMemo, useState, type DragEvent } from 'react'
import { Bell } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth, usePermissions } from '@/app/providers/AuthProvider'
import {
  appendAuditLog,
  countPendingBlogSubmissions,
  createBlogPost,
  createBlogSeparator,
  deleteBlogPost,
  getPublishedPosts,
  listBlogPosts,
  listBlogSubmissions,
  mockBlogPosts,
  mockBlogSubmissions,
  reorderBlogPosts,
  setBlogSubmissionStatus,
  updateBlogPost,
  setBlogPostStatus,
  type BlogPost,
  type BlogPostStatus,
  type BlogSeparatorVariant,
  type BlogSubmission,
} from '@/mocks/data'
import { notifyError, notifySuccess } from '@/shared/lib/notify'
import { Modal } from '@/shared/ui/Modal/Modal'
import { IconAction } from '@/shared/ui/IconAction/IconAction'
import {
  AdminRowCard,
  ResponsiveTableShell,
} from '@/shared/ui/ResponsiveTable/ResponsiveTable'
import { TablePagination } from '@/shared/ui/TablePagination/TablePagination'
import { useTablePagination } from '@/shared/lib/useTablePagination'
import { PageHeaderActions } from '@/widgets/AppShell/Header/PageHeaderActions'
import { BlogPostRenderer } from '@/features/blog/components/BlogPostRenderer'
import { SeparatorMenu } from '@/features/blog/components/SeparatorMenu'
import { PostEditor, type PostEditorValue } from '@/features/blog/components/PostEditor'
import './BlogAdminPage.css'

export function BlogAdminPage() {
  const { user } = useAuth()
  const { hasPermission } = usePermissions()
  const canCreate = hasPermission('blog:create')
  const canUpdate = hasPermission('blog:update')
  const canDelete = hasPermission('blog:delete')
  const canPublish = hasPermission('blog:publish')

  const [, setTick] = useState(0)
  const refresh = () => setTick((value) => value + 1)

  const [statusFilter, setStatusFilter] = useState<BlogPostStatus | 'all'>('all')
  const [editorOpen, setEditorOpen] = useState(false)
  const [editing, setEditing] = useState<BlogPost | null>(null)
  const [viewPost, setViewPost] = useState<BlogPost | null>(null)
  const [requestsOpen, setRequestsOpen] = useState(false)
  const [dragId, setDragId] = useState<string | null>(null)
  const [dropTargetId, setDropTargetId] = useState<string | null>(null)

  const posts = useMemo(
    () => listBlogPosts(statusFilter),
    [statusFilter, mockBlogPosts.length, mockBlogPosts.map((p) => `${p.status}:${p.sortOrder}:${p.updatedAt}`).join()],
  )
  const published = useMemo(
    () => getPublishedPosts(),
    [mockBlogPosts.length, mockBlogPosts.map((p) => `${p.status}:${p.sortOrder}:${p.updatedAt}:${p.scheduledAt}:${p.unpublishAt}`).join()],
  )
  const pendingCount = useMemo(
    () => countPendingBlogSubmissions(),
    [mockBlogSubmissions.length, mockBlogSubmissions.map((s) => s.status).join()],
  )
  const submissions = useMemo(
    () => listBlogSubmissions('all'),
    [mockBlogSubmissions.length, mockBlogSubmissions.map((s) => `${s.id}:${s.status}`).join()],
  )

  const {
    page,
    setPage,
    pageItems,
    total,
    totalPages,
    rangeStart,
    rangeEnd,
    pageSize,
  } = useTablePagination(posts, { resetKey: statusFilter })

  const openCreate = () => {
    setEditing(null)
    setEditorOpen(true)
  }

  const openEdit = (post: BlogPost) => {
    if (post.kind === 'separator') return
    setEditing(post)
    setEditorOpen(true)
  }

  const addSeparator = (variant: BlogSeparatorVariant) => {
    if (!canCreate) return
    const result = createBlogSeparator(variant)
    if (!result.ok) return
    appendAuditLog({
      action: 'blog.separator.create',
      entity: 'blog_post',
      entityId: result.post.id,
      actorId: user?.id ?? 'unknown',
      actorRole: user?.roles[0] ?? 'UNKNOWN',
      details: `Integró ${result.post.title}`,
      kind: 'change',
    })
    notifySuccess('Separador integrado', result.post.title)
    refresh()
  }

  const handleSave = (value: PostEditorValue) => {
    if (editing) {
      if (!canUpdate) return
      const updated = updateBlogPost(editing.id, value)
      if (!updated) {
        notifyError('No se pudo actualizar', 'Revise fechas de programación / fin')
        return
      }
      appendAuditLog({
        action: 'blog.update',
        entity: 'blog_post',
        entityId: updated.id,
        actorId: user?.id ?? 'unknown',
        actorRole: user?.roles[0] ?? 'UNKNOWN',
        details: `Actualizó publicación ${updated.title}`,
        kind: 'change',
      })
      notifySuccess('Publicación actualizada', updated.title)
    } else {
      if (!canCreate) return
      const status = canPublish ? value.status : 'borrador'
      const result = createBlogPost({ ...value, status })
      if (!result.ok) {
        notifyError('No se pudo crear', result.error)
        return
      }
      appendAuditLog({
        action: 'blog.create',
        entity: 'blog_post',
        entityId: result.post.id,
        actorId: user?.id ?? 'unknown',
        actorRole: user?.roles[0] ?? 'UNKNOWN',
        details: `Creó publicación ${result.post.title}`,
        kind: 'change',
      })
      notifySuccess('Publicación creada', result.post.title)
    }
    setEditorOpen(false)
    setEditing(null)
    refresh()
  }

  const movePost = (postId: string, direction: -1 | 1) => {
    if (!canUpdate) return
    const ordered = listBlogPosts()
    const index = ordered.findIndex((post) => post.id === postId)
    const target = index + direction
    if (index < 0 || target < 0 || target >= ordered.length) return
    const next = [...ordered]
    const [item] = next.splice(index, 1)
    next.splice(target, 0, item)
    reorderBlogPosts(next.map((post) => post.id))
    appendAuditLog({
      action: 'blog.reorder',
      entity: 'blog_post',
      entityId: postId,
      actorId: user?.id ?? 'unknown',
      actorRole: user?.roles[0] ?? 'UNKNOWN',
      details: 'Reordenó jerarquía del blog',
      kind: 'change',
    })
    refresh()
  }

  const applyDragReorder = (fromId: string, toId: string) => {
    if (!canUpdate || fromId === toId) return
    const ordered = listBlogPosts()
    const from = ordered.findIndex((post) => post.id === fromId)
    const to = ordered.findIndex((post) => post.id === toId)
    if (from < 0 || to < 0) return
    const next = [...ordered]
    const [item] = next.splice(from, 1)
    next.splice(to, 0, item)
    reorderBlogPosts(next.map((post) => post.id))
    appendAuditLog({
      action: 'blog.reorder',
      entity: 'blog_post',
      entityId: fromId,
      actorId: user?.id ?? 'unknown',
      actorRole: user?.roles[0] ?? 'UNKNOWN',
      details: 'Reordenó jerarquía del blog (arrastre)',
      kind: 'change',
    })
    notifySuccess('Jerarquía actualizada')
    refresh()
  }

  const rowDragProps = (postId: string) => ({
    draggable: canUpdate,
    onDragStart: (event: DragEvent) => {
      if (!canUpdate) return
      setDragId(postId)
      event.dataTransfer.setData('text/plain', postId)
      event.dataTransfer.effectAllowed = 'move'
    },
    onDragEnd: () => {
      setDragId(null)
      setDropTargetId(null)
    },
    onDragOver: (event: DragEvent) => {
      if (!canUpdate || !dragId) return
      event.preventDefault()
      event.dataTransfer.dropEffect = 'move'
      if (dropTargetId !== postId) setDropTargetId(postId)
    },
    onDrop: (event: DragEvent) => {
      event.preventDefault()
      const fromId = event.dataTransfer.getData('text/plain') || dragId
      if (fromId) applyDragReorder(fromId, postId)
      setDragId(null)
      setDropTargetId(null)
    },
  })

  const changeStatus = (post: BlogPost, nextStatus: BlogPostStatus) => {
    if (!canPublish) {
      notifyError('Sin permiso', 'No puede cambiar el estado de la publicación')
      return
    }
    if (nextStatus === post.status) return
    const result = setBlogPostStatus(post.id, nextStatus)
    if (!result.ok) {
      notifyError('No se pudo cambiar el estado', result.error)
      refresh()
      return
    }
    appendAuditLog({
      action: 'blog.status',
      entity: 'blog_post',
      entityId: post.id,
      actorId: user?.id ?? 'unknown',
      actorRole: user?.roles[0] ?? 'UNKNOWN',
      details: `Cambió estado de ${post.title} a ${result.post.status}`,
      kind: 'change',
    })
    if (result.post.status === 'publicado') {
      notifySuccess('Publicado en el blog', result.post.title)
    } else {
      notifySuccess('Estado actualizado', result.post.status)
    }
    refresh()
  }

  const statusSelect = (post: BlogPost) => (
    <select
      className="admin-input blog-admin__status-select"
      value={post.status}
      disabled={!canPublish}
      aria-label={`Estado de ${post.title}`}
      onChange={(event) => changeStatus(post, event.target.value as BlogPostStatus)}
    >
      <option value="borrador">borrador</option>
      <option value="programado">programado</option>
      <option value="publicado">publicado</option>
      <option value="archivado">archivado</option>
    </select>
  )

  const removePost = (post: BlogPost) => {
    if (!canDelete) return
    const result = deleteBlogPost(post.id)
    if (!result.ok) {
      notifyError('No se pudo eliminar', result.error)
      return
    }
    appendAuditLog({
      action: 'blog.delete',
      entity: 'blog_post',
      entityId: post.id,
      actorId: user?.id ?? 'unknown',
      actorRole: user?.roles[0] ?? 'UNKNOWN',
      details: `Eliminó publicación ${post.title}`,
      kind: 'change',
    })
    notifySuccess('Publicación eliminada', post.title)
    refresh()
  }

  const resolveSubmission = (submission: BlogSubmission, status: 'aprobada' | 'rechazada') => {
    setBlogSubmissionStatus(submission.id, status)
    appendAuditLog({
      action: status === 'aprobada' ? 'blog.submission.approve' : 'blog.submission.reject',
      entity: 'blog_submission',
      entityId: submission.id,
      actorId: user?.id ?? 'unknown',
      actorRole: user?.roles[0] ?? 'UNKNOWN',
      details: `${status === 'aprobada' ? 'Aprobó' : 'Rechazó'} solicitud ${submission.title}`,
      kind: 'change',
    })
    notifySuccess(status === 'aprobada' ? 'Solicitud aprobada' : 'Solicitud rechazada')
    refresh()
  }

  const renderActions = (post: BlogPost) => (
    <div className="admin-row-actions">
      {post.kind === 'post' ? (
        <IconAction label="Ver" variant="view" onClick={() => setViewPost(post)} />
      ) : null}
      <IconAction
        label="Subir"
        variant="move-up"
        disabled={!canUpdate}
        title="Subir en jerarquía"
        onClick={() => movePost(post.id, -1)}
      />
      <IconAction
        label="Bajar"
        variant="move-down"
        disabled={!canUpdate}
        title="Bajar en jerarquía"
        onClick={() => movePost(post.id, 1)}
      />
      {post.kind === 'post' ? (
        <IconAction
          label="Editar"
          variant="edit"
          disabled={!canUpdate}
          onClick={() => openEdit(post)}
        />
      ) : null}
      <IconAction
        label="Eliminar"
        variant="delete"
        disabled={!canDelete}
        onClick={() => removePost(post)}
      />
    </div>
  )

  const headerActions = (
    <button
      type="button"
      className="blog-admin__notify"
      onClick={() => setRequestsOpen(true)}
      aria-label="Solicitudes de publicación"
      title="Solicitudes de lectores"
    >
      <Bell size={18} strokeWidth={1.75} aria-hidden />
      {pendingCount > 0 ? <span className="blog-admin__badge">{pendingCount}</span> : null}
    </button>
  )

  return (
    <section className="admin-page blog-admin">
      <PageHeaderActions>{headerActions}</PageHeaderActions>

      <div className="blog-admin__layout">
        <div className="blog-admin__preview-panel admin-card">
          <div className="blog-admin__preview-head">
            <strong>Vista pública del blog</strong>
            <Link className="admin-btn admin-btn--ghost" to="/blog" target="_blank" rel="noreferrer">
              Abrir /blog
            </Link>
          </div>
          <div className="blog-admin__preview-frame">
            {published.length === 0 ? (
              <p className="admin-empty">No hay publicaciones públicas todavía.</p>
            ) : (
              published.map((post) => (
                <BlogPostRenderer key={post.id} post={post} compact />
              ))
            )}
          </div>
        </div>

        <div className="blog-admin__manage">
          <div className="admin-toolbar">
            <div className="admin-toolbar__filters">
              <select
                className="admin-input"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as BlogPostStatus | 'all')}
                aria-label="Filtrar por estado"
              >
                <option value="all">Todos los estados</option>
                <option value="borrador">borrador</option>
                <option value="programado">programado</option>
                <option value="publicado">publicado</option>
                <option value="archivado">archivado</option>
              </select>
            </div>
            <div className="admin-toolbar__create">
              <button type="button" className="admin-btn" disabled={!canCreate} onClick={openCreate}>
                Crear publicación
              </button>
            </div>
          </div>

          <ResponsiveTableShell
            empty={posts.length === 0}
            cards={pageItems.map((post) => (
              <div
                key={post.id}
                className={[
                  'blog-admin__drag-card',
                  dragId === post.id ? 'is-dragging' : '',
                  dropTargetId === post.id ? 'is-drop-target' : '',
                ].filter(Boolean).join(' ')}
                {...rowDragProps(post.id)}
              >
                <AdminRowCard
                  title={post.title}
                  actions={renderActions(post)}
                  fields={[
                    { label: 'Título', value: post.title, primary: true },
                    {
                      label: 'Estado',
                      value: post.kind === 'separator' ? (
                        <span className="admin-badge admin-badge--publicado">separador</span>
                      ) : statusSelect(post),
                      primary: true,
                    },
                    { label: 'Orden', value: post.sortOrder, primary: true },
                    {
                      label: 'Maqueta',
                      value: post.kind === 'separator'
                        ? (post.separatorVariant ?? 'separador')
                        : post.layoutSnapshot.name,
                    },
                    {
                      label: 'Fin publicación',
                      value: post.kind === 'separator'
                        ? '—'
                        : (post.unpublishAt ? post.unpublishAt.slice(0, 16).replace('T', ' ') : '—'),
                    },
                    { label: 'Slug', value: post.slug },
                  ]}
                />
              </div>
            ))}
          >
            <table className="admin-table">
              <thead>
                <tr>
                  <th data-priority="1">Orden</th>
                  <th data-priority="2">Título</th>
                  <th data-priority="3">Estado</th>
                  <th>Maqueta</th>
                  <th>Fin</th>
                  <th className="admin-table__actions-col">
                    <div className="blog-admin__actions-head">
                      <span>Acciones</span>
                      <SeparatorMenu disabled={!canCreate} onSelect={addSeparator} />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((post) => (
                  <tr
                    key={post.id}
                    className={[
                      post.kind === 'separator' ? 'blog-admin__row--separator' : '',
                      canUpdate ? 'blog-admin__row--draggable' : '',
                      dragId === post.id ? 'is-dragging' : '',
                      dropTargetId === post.id ? 'is-drop-target' : '',
                    ].filter(Boolean).join(' ') || undefined}
                    {...rowDragProps(post.id)}
                  >
                    <td data-priority="1">{post.sortOrder}</td>
                    <td data-priority="2">{post.title}</td>
                    <td data-priority="3">
                      {post.kind === 'separator' ? (
                        <span className="admin-badge admin-badge--publicado">separador</span>
                      ) : statusSelect(post)}
                    </td>
                    <td>
                      {post.kind === 'separator'
                        ? (post.separatorVariant ?? 'separador')
                        : post.layoutSnapshot.name}
                    </td>
                    <td>
                      {post.kind === 'separator'
                        ? '—'
                        : (post.unpublishAt ? post.unpublishAt.slice(0, 16).replace('T', ' ') : '—')}
                    </td>
                    <td className="admin-table__actions-col">{renderActions(post)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ResponsiveTableShell>

          <TablePagination
            page={page}
            totalPages={totalPages}
            total={total}
            rangeStart={rangeStart}
            rangeEnd={rangeEnd}
            pageSize={pageSize}
            onPageChange={setPage}
          />
        </div>
      </div>

      <Modal
        isOpen={editorOpen}
        title={editing ? 'Editar publicación' : 'Crear publicación'}
        size="lg"
        onClose={() => {
          setEditorOpen(false)
          setEditing(null)
        }}
      >
        <PostEditor
          initial={editing}
          canPublish={canPublish}
          onCancel={() => {
            setEditorOpen(false)
            setEditing(null)
          }}
          onSave={handleSave}
        />
      </Modal>

      <Modal
        isOpen={Boolean(viewPost)}
        title={viewPost?.title ?? 'Publicación'}
        size="lg"
        onClose={() => setViewPost(null)}
        footer={(
          <button type="button" className="admin-btn" onClick={() => setViewPost(null)}>Cerrar</button>
        )}
      >
        {viewPost ? <BlogPostRenderer post={viewPost} /> : null}
      </Modal>

      <Modal
        isOpen={requestsOpen}
        title="Solicitudes de publicación"
        size="lg"
        onClose={() => setRequestsOpen(false)}
        footer={(
          <button type="button" className="admin-btn" onClick={() => setRequestsOpen(false)}>Cerrar</button>
        )}
      >
        {submissions.length === 0 ? (
          <p className="admin-empty">No hay solicitudes.</p>
        ) : (
          <div className="blog-admin__requests">
            {submissions.map((submission) => (
              <article key={submission.id} className="blog-admin__request-card">
                <header>
                  <strong>{submission.title}</strong>
                  <span className={`admin-badge admin-badge--${submission.status}`}>{submission.status}</span>
                </header>
                <p className="admin-meta">{submission.authorName} · {submission.authorEmail}</p>
                <p>{submission.content}</p>
                {submission.imageUrls.length ? (
                  <div className="blog-admin__request-images">
                    {submission.imageUrls.map((url) => (
                      <img key={url} src={url} alt="" />
                    ))}
                  </div>
                ) : null}
                {submission.status === 'pendiente' ? (
                  <div className="blog-admin__request-actions">
                    <button type="button" className="admin-btn" onClick={() => resolveSubmission(submission, 'aprobada')}>
                      Aprobar
                    </button>
                    <button type="button" className="admin-btn admin-btn--ghost" onClick={() => resolveSubmission(submission, 'rechazada')}>
                      Rechazar
                    </button>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </Modal>
    </section>
  )
}
