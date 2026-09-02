import { useMemo, useState } from 'react'
import { Palette } from 'lucide-react'
import type {
  BlogBlockContent,
  BlogLayout,
  BlogPost,
  BlogPostStatus,
  BlogSlotType,
  BlogTextStyle,
} from '@/mocks/data'
import { blogLayouts, getBlogLayout } from '@/mocks/data'
import {
  cloneBlogLayout,
  emptyBlocksForLayout,
  remapBlocksToLayout,
} from '@/features/blog/lib/blogLayouts'
import { blockTextCss, blogTextStyleToCss, resolveBlogTextStyle } from '@/features/blog/lib/blogTextStyle'
import { LayoutPicker } from '@/features/blog/components/LayoutPicker'
import { BlogLayoutGrid } from '@/features/blog/components/BlogPostRenderer'
import {
  ScheduleDateTimePicker,
  toDatetimeLocalValue,
} from '@/features/blog/components/ScheduleDateTimePicker'
import { CarouselFieldEditor } from '@/features/blog/components/CarouselFieldEditor'
import { ImageSourceField } from '@/features/blog/components/ImageSourceField'
import { TextStyleModal } from '@/features/blog/components/TextStyleModal'
import { IG_CAROUSEL_MAX, IG_CAROUSEL_MIN } from '@/features/blog/components/IgCarousel'
import { extractUrls } from '@/features/blog/lib/textLinks'
import './PostEditor.css'

export type PostEditorValue = {
  title: string
  titleStyle?: BlogTextStyle
  layoutId: string
  layoutSnapshot: BlogLayout
  blocks: Record<string, BlogBlockContent>
  status: BlogPostStatus
  scheduledAt: string | null
  unpublishAt: string | null
}

type PostEditorProps = {
  initial?: BlogPost | null
  canPublish?: boolean
  onCancel: () => void
  onSave: (value: PostEditorValue) => void
}

const DISTRIBUTION_PRESETS: Array<{ id: string; label: string; apply: (layout: BlogLayout) => BlogLayout }> = [
  {
    id: 'default',
    label: 'Distribución base',
    apply: (layout) => cloneBlogLayout(getBlogLayout(layout.id) ?? layout),
  },
  {
    id: 'wide-media',
    label: 'Media dominante',
    apply: (layout) => {
      if (layout.orientation === 'row') {
        return {
          ...layout,
          gridTemplateColumns: layout.slots.length >= 3 ? '1.4fr 1fr 1fr' : '1.6fr 1fr',
        }
      }
      return {
        ...layout,
        gridTemplateRows: layout.slots.length >= 3
          ? 'auto minmax(200px, 1.4fr) auto'
          : layout.gridTemplateRows,
      }
    },
  },
  {
    id: 'balanced',
    label: 'Equilibrada',
    apply: (layout) => {
      if (layout.orientation === 'row') {
        return {
          ...layout,
          gridTemplateColumns: layout.slots.map(() => '1fr').join(' '),
        }
      }
      return cloneBlogLayout(getBlogLayout(layout.id) ?? layout)
    },
  },
]

function editorSlotLabel(type: BlogSlotType): string {
  if (type === 'image') return 'Contenedor img'
  if (type === 'carousel') return 'Carrusel de imágenes'
  if (type === 'text') return 'Texto de la publicación'
  if (type === 'heading') return 'Titular de la publicación'
  return 'Bloque'
}

export function PostEditor({ initial, canPublish = false, onCancel, onSave }: PostEditorProps) {
  const defaultLayout = blogLayouts[0]
  const [step, setStep] = useState<1 | 2>(initial ? 2 : 1)
  const [title, setTitle] = useState(initial?.title ?? '')
  const [titleStyle, setTitleStyle] = useState<BlogTextStyle>(initial?.titleStyle ?? {})
  const [layoutId, setLayoutId] = useState(initial?.layoutId ?? defaultLayout.id)
  const [layoutSnapshot, setLayoutSnapshot] = useState<BlogLayout>(
    initial?.layoutSnapshot
      ? cloneBlogLayout(initial.layoutSnapshot)
      : cloneBlogLayout(defaultLayout),
  )
  const [blocks, setBlocks] = useState<Record<string, BlogBlockContent>>(
    initial?.blocks ?? emptyBlocksForLayout(defaultLayout),
  )
  const [status, setStatus] = useState<BlogPostStatus>(initial?.status ?? 'borrador')
  const [scheduleEnabled, setScheduleEnabled] = useState(Boolean(initial?.scheduledAt))
  const [scheduledAt, setScheduledAt] = useState(initial?.scheduledAt ?? '')
  const [unpublishAt, setUnpublishAt] = useState(initial?.unpublishAt ?? '')
  const [distribution, setDistribution] = useState('default')
  const [error, setError] = useState('')
  const [styleSlotId, setStyleSlotId] = useState<string | null>(null)
  const [titleStyleOpen, setTitleStyleOpen] = useState(false)

  const previewPost = useMemo(() => ({
    id: initial?.id ?? 'preview',
    slug: 'preview',
    title: title || 'Sin título',
    titleStyle,
    status,
    sortOrder: 0,
    kind: 'post' as const,
    layoutId,
    layoutSnapshot,
    blocks,
    scheduledAt: scheduledAt || null,
    unpublishAt: unpublishAt || null,
    createdAt: '',
    updatedAt: '',
  }), [blocks, initial?.id, layoutId, layoutSnapshot, scheduledAt, status, title, titleStyle, unpublishAt])

  const applyLayout = (nextId: string) => {
    const next = getBlogLayout(nextId)
    if (!next) return
    const previous = layoutSnapshot
    const cloned = cloneBlogLayout(next)
    setLayoutId(nextId)
    setLayoutSnapshot(cloned)
    setBlocks(remapBlocksToLayout(previous, cloned, blocks))
    setDistribution('default')
  }

  const applyDistribution = (presetId: string) => {
    const preset = DISTRIBUTION_PRESETS.find((item) => item.id === presetId)
    if (!preset) return
    setDistribution(presetId)
    setLayoutSnapshot(preset.apply(layoutSnapshot))
  }

  const updateBlock = (slotId: string, patch: BlogBlockContent) => {
    setBlocks((current) => ({
      ...current,
      [slotId]: { ...current[slotId], ...patch },
    }))
  }

  const handleSave = () => {
    if (!title.trim()) {
      setError('El título es obligatorio')
      return
    }
    if (layoutId === 'post_ig') {
      const urls = (blocks.carousel?.imageUrls ?? []).map((url) => url.trim()).filter(Boolean)
      if (urls.length < IG_CAROUSEL_MIN) {
        setError(`Post IG requiere al menos ${IG_CAROUSEL_MIN} imagen`)
        return
      }
      if (urls.length > IG_CAROUSEL_MAX) {
        setError(`Post IG admite máximo ${IG_CAROUSEL_MAX} imágenes`)
        return
      }
    }
    if (scheduleEnabled && !scheduledAt) {
      setError('Indique fecha y hora de programación')
      return
    }
    const scheduleIso = scheduleEnabled ? (scheduledAt || null) : null
    const unpublishIso = initial ? (unpublishAt || null) : null
    if (scheduleIso && unpublishIso && new Date(unpublishIso) <= new Date(scheduleIso)) {
      setError('La fecha de fin debe ser posterior a la programación')
      return
    }
    setError('')
    let nextStatus: BlogPostStatus = canPublish ? status : (status === 'publicado' ? 'publicado' : 'borrador')
    if (scheduleIso && new Date(scheduleIso).getTime() > Date.now()) {
      nextStatus = 'programado'
    }
    const normalizedBlocks = layoutId === 'post_ig'
      ? {
          ...blocks,
          carousel: {
            ...blocks.carousel,
            imageUrls: (blocks.carousel?.imageUrls ?? [])
              .map((url) => url.trim())
              .filter(Boolean)
              .slice(0, IG_CAROUSEL_MAX),
          },
        }
      : blocks
    onSave({
      title: title.trim(),
      titleStyle,
      layoutId,
      layoutSnapshot,
      blocks: normalizedBlocks,
      status: nextStatus,
      scheduledAt: scheduleIso,
      unpublishAt: unpublishIso,
    })
  }

  const styleTarget = styleSlotId ? blocks[styleSlotId] : null
  const styleSlot = styleSlotId
    ? layoutSnapshot.slots.find((slot) => slot.id === styleSlotId)
    : null

  if (step === 1) {
    return (
      <div className="post-editor post-editor--step">
        <div className="post-editor__steps" aria-label="Pasos">
          <span className="post-editor__step is-active">1. Maqueta</span>
          <span className="post-editor__step">2. Contenido</span>
        </div>
        <p className="post-editor__step-hint">Elija la maqueta de la publicación para continuar.</p>
        <div className="admin-form__field">
          <span>Maqueta</span>
          <LayoutPicker layouts={blogLayouts} value={layoutId} onChange={applyLayout} />
        </div>
        <div className="post-editor__actions post-editor__actions--step">
          <button type="button" className="admin-btn admin-btn--ghost" onClick={onCancel}>
            Cancelar
          </button>
          <button type="button" className="admin-btn" onClick={() => setStep(2)}>
            Continuar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="post-editor post-editor--step">
      <div className="post-editor__steps" aria-label="Pasos">
        <span className="post-editor__step">1. Maqueta</span>
        <span className="post-editor__step is-active">2. Contenido</span>
      </div>

      <div className="post-editor__slot-field">
        <div className="post-editor__slot-head">
          <span className="post-editor__slot-label">Título</span>
          <button
            type="button"
            className="post-editor__style-btn"
            onClick={() => setTitleStyleOpen(true)}
            title="Estilo del título"
          >
            <Palette size={16} strokeWidth={1.75} aria-hidden />
            Estilo
          </button>
        </div>
        <input
          className="admin-input"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Título de la publicación"
          style={blogTextStyleToCss(resolveBlogTextStyle({ textStyle: titleStyle }))}
        />
      </div>

      <div className="post-editor__slots">
        <h4>Contenido de la publicación</h4>
        {layoutSnapshot.slots.map((slot) => {
          const block = blocks[slot.id] ?? {}
          const isTextual = slot.type === 'text' || slot.type === 'heading'
          return (
            <div key={slot.id} className="post-editor__slot-field">
              <div className="post-editor__slot-head">
                <span className="post-editor__slot-label">
                  {layoutId === 'post_ig' && slot.type === 'text'
                    ? 'Pie de la publicación'
                    : editorSlotLabel(slot.type)}
                </span>
                {isTextual ? (
                  <button
                    type="button"
                    className="post-editor__style-btn"
                    onClick={() => setStyleSlotId(slot.id)}
                    title="Estilo del texto"
                  >
                    <Palette size={16} strokeWidth={1.75} aria-hidden />
                    Estilo
                  </button>
                ) : null}
              </div>
              {slot.type === 'carousel' ? (
                <CarouselFieldEditor
                  urls={block.imageUrls ?? ['']}
                  onChange={(imageUrls) => updateBlock(slot.id, { imageUrls })}
                />
              ) : null}
              {slot.type === 'image' ? (
                <ImageSourceField
                  value={block.imageUrl ?? ''}
                  onChange={(imageUrl) => updateBlock(slot.id, { imageUrl })}
                />
              ) : null}
              {isTextual ? (
                <>
                  <textarea
                    className="admin-input admin-textarea"
                    rows={layoutId === 'post_ig' ? 3 : (slot.type === 'heading' ? 2 : 4)}
                    value={block.text ?? ''}
                    onChange={(event) => updateBlock(slot.id, { text: event.target.value })}
                    placeholder={layoutId === 'post_ig' ? 'Descripción corta del pie…' : undefined}
                    style={blockTextCss(block)}
                  />
                  {extractUrls(block.text ?? '').length > 0 ? (
                    <p className="post-editor__links-hint">
                      Hipervínculos detectados: {extractUrls(block.text ?? '').length}
                      {' · '}
                      se convertirán en enlaces en la vista pública
                    </p>
                  ) : null}
                </>
              ) : null}
            </div>
          )
        })}
      </div>

      {canPublish ? (
        scheduleEnabled ? (
          <p className="admin-meta">Con programación activa el estado será <strong>programado</strong> hasta la fecha indicada.</p>
        ) : (
          <label className="admin-form__field">
            Estado
            <select
              className="admin-input"
              value={status === 'programado' ? 'borrador' : status}
              onChange={(event) => setStatus(event.target.value as BlogPostStatus)}
            >
              <option value="borrador">borrador (no visible en /blog)</option>
              <option value="publicado">publicado (visible en /blog)</option>
              <option value="archivado">archivado</option>
            </select>
          </label>
        )
      ) : null}

      {layoutId !== 'post_ig' ? (
        <label className="admin-form__field post-editor__distribution">
          Distribución de la maqueta
          <select
            className="admin-input"
            value={distribution}
            onChange={(event) => applyDistribution(event.target.value)}
          >
            {DISTRIBUTION_PRESETS.map((preset) => (
              <option key={preset.id} value={preset.id}>{preset.label}</option>
            ))}
          </select>
        </label>
      ) : null}

      <div className="post-editor__preview">
        <h4>Vista previa</h4>
        <article className="blog-post blog-post--compact">
          <h3
            className="blog-post__title blog-post__title--compact"
            style={blogTextStyleToCss(resolveBlogTextStyle({ textStyle: titleStyle }))}
          >
            {previewPost.title}
          </h3>
          <BlogLayoutGrid layout={layoutSnapshot} blocks={blocks} />
        </article>
      </div>

      {error ? <span className="admin-form__error">{error}</span> : null}

      <div className="post-editor__footer">
        <div className={`post-editor__schedule${scheduleEnabled ? ' is-open' : ''}`}>
          <label className="post-editor__check">
            <input
              type="checkbox"
              checked={scheduleEnabled}
              onChange={(event) => {
                setScheduleEnabled(event.target.checked)
                if (!event.target.checked) setScheduledAt('')
              }}
            />
            Programar publicación
          </label>
          {scheduleEnabled ? (
            <ScheduleDateTimePicker
              label="Publicar el"
              value={scheduledAt}
              min={toDatetimeLocalValue(new Date().toISOString())}
              onChange={(iso) => setScheduledAt(iso)}
            />
          ) : null}
          {initial ? (
            <ScheduleDateTimePicker
              label="Dejar de publicar el (opcional)"
              value={unpublishAt}
              min={scheduledAt ? toDatetimeLocalValue(scheduledAt) : toDatetimeLocalValue(new Date().toISOString())}
              onChange={(iso) => setUnpublishAt(iso)}
            />
          ) : null}
        </div>

        <div className="post-editor__actions">
          <button type="button" className="admin-btn admin-btn--ghost" onClick={() => setStep(1)}>
            Volver a maqueta
          </button>
          <button type="button" className="admin-btn admin-btn--ghost" onClick={onCancel}>
            Cancelar
          </button>
          <button type="button" className="admin-btn" onClick={handleSave}>
            Guardar
          </button>
        </div>
      </div>

      <TextStyleModal
        isOpen={titleStyleOpen}
        title="Estilo · Título"
        value={resolveBlogTextStyle({ textStyle: titleStyle })}
        sampleText={title}
        onClose={() => setTitleStyleOpen(false)}
        onApply={(style) => setTitleStyle(style)}
      />

      <TextStyleModal
        isOpen={Boolean(styleSlotId)}
        title={`Estilo · ${styleSlot ? editorSlotLabel(styleSlot.type) : 'Texto'}`}
        value={styleTarget ? resolveBlogTextStyle(styleTarget) : {}}
        sampleText={styleTarget?.text ?? ''}
        onClose={() => setStyleSlotId(null)}
        onApply={(textStyle: BlogTextStyle) => {
          if (!styleSlotId) return
          updateBlock(styleSlotId, {
            textStyle,
            fontSize: undefined,
            fontColor: undefined,
          })
        }}
      />
    </div>
  )
}
