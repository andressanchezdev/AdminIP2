import { useEffect, useState } from 'react'
import type { BlogTextStyle } from '@/mocks/data'
import { Modal } from '@/shared/ui/Modal/Modal'
import {
  DEFAULT_BLOG_TEXT_STYLE,
  blogTextStyleToCss,
  clearBlogTextStyle,
} from '@/features/blog/lib/blogTextStyle'
import './TextStyleModal.css'

type TextStyleModalProps = {
  isOpen: boolean
  title: string
  value: BlogTextStyle
  sampleText: string
  onClose: () => void
  onApply: (style: BlogTextStyle) => void
}

function toHexColor(value: string | undefined, fallback: string) {
  if (!value || value === 'transparent') return fallback
  if (/^#[0-9a-fA-F]{6}$/.test(value)) return value
  if (/^#[0-9a-fA-F]{3}$/.test(value)) {
    const [r, g, b] = value.slice(1)
    return `#${r}${r}${g}${g}${b}${b}`
  }
  return fallback
}

/** Pop-up para tipografía, fondo, efectos y espaciado de título/texto. */
export function TextStyleModal({
  isOpen,
  title,
  value,
  sampleText,
  onClose,
  onApply,
}: TextStyleModalProps) {
  const [draft, setDraft] = useState<BlogTextStyle>(value)

  useEffect(() => {
    if (isOpen) setDraft(value)
  }, [isOpen, value])

  const patch = (partial: Partial<BlogTextStyle>) => {
    setDraft((current) => ({ ...current, ...partial }))
  }

  const toggle = (key: 'bold' | 'italic' | 'underline' | 'uppercase' | 'shadow' | 'highlight' | 'outline' | 'strike') => {
    setDraft((current) => ({ ...current, [key]: !current[key] }))
  }

  const fontHex = toHexColor(draft.color, DEFAULT_BLOG_TEXT_STYLE.color)
  const bgTransparent = !draft.backgroundColor || draft.backgroundColor === 'transparent'
  const bgHex = toHexColor(draft.backgroundColor, '#FFFFFF')

  return (
    <Modal
      isOpen={isOpen}
      title={title}
      size="md"
      onClose={onClose}
      footer={(
        <>
          <button
            type="button"
            className="admin-btn admin-btn--ghost"
            onClick={() => setDraft(clearBlogTextStyle())}
          >
            Limpiar cambios
          </button>
          <button type="button" className="admin-btn admin-btn--ghost" onClick={onClose}>
            Cancelar
          </button>
          <button
            type="button"
            className="admin-btn"
            onClick={() => {
              onApply(draft)
              onClose()
            }}
          >
            Aplicar
          </button>
        </>
      )}
    >
      <div className="text-style-modal">
        <div
          className="text-style-modal__preview"
          style={blogTextStyleToCss({ ...DEFAULT_BLOG_TEXT_STYLE, ...draft })}
        >
          {sampleText.trim() || 'Vista previa del texto'}
        </div>

        <fieldset className="text-style-modal__group">
          <legend>Color de fuente</legend>
          <div className="text-style-modal__color-row">
            <input
              type="color"
              className="text-style-modal__color-input"
              value={fontHex}
              aria-label="Selector de color de fuente"
              onChange={(event) => patch({ color: event.target.value })}
            />
            <input
              className="admin-input text-style-modal__hex"
              value={draft.color ?? fontHex}
              placeholder="#333333"
              aria-label="Hex color de fuente"
              onChange={(event) => patch({ color: event.target.value })}
            />
          </div>
        </fieldset>

        <fieldset className="text-style-modal__group">
          <legend>Fondo del contenedor</legend>
          <div className="text-style-modal__color-row">
            <input
              type="color"
              className="text-style-modal__color-input"
              value={bgHex}
              disabled={bgTransparent}
              aria-label="Selector de color de fondo"
              onChange={(event) => patch({ backgroundColor: event.target.value })}
            />
            <input
              className="admin-input text-style-modal__hex"
              value={bgTransparent ? '' : (draft.backgroundColor ?? '')}
              placeholder="#FFFFFF"
              disabled={bgTransparent}
              aria-label="Hex color de fondo"
              onChange={(event) => patch({ backgroundColor: event.target.value || 'transparent' })}
            />
            <label className="text-style-modal__transparent">
              <input
                type="checkbox"
                checked={bgTransparent}
                onChange={(event) => patch({
                  backgroundColor: event.target.checked ? 'transparent' : '#FFFFFF',
                })}
              />
              Sin fondo
            </label>
          </div>
        </fieldset>

        <label className="text-style-modal__range">
          Tamaño de fuente ({draft.fontSizePx ?? DEFAULT_BLOG_TEXT_STYLE.fontSizePx}px)
          <input
            type="range"
            min={12}
            max={40}
            value={draft.fontSizePx ?? DEFAULT_BLOG_TEXT_STYLE.fontSizePx}
            onChange={(event) => patch({ fontSizePx: Number(event.target.value) })}
          />
        </label>

        <fieldset className="text-style-modal__group">
          <legend>Efectos de fuente</legend>
          <div className="text-style-modal__effects">
            {([
              ['bold', 'Negrita'],
              ['italic', 'Cursiva'],
              ['underline', 'Subrayado'],
              ['uppercase', 'Mayúsculas'],
              ['shadow', 'Sombra'],
              ['highlight', 'Resaltado'],
              ['outline', 'Contorno'],
              ['strike', 'Tachado'],
            ] as const).map(([key, label]) => (
              <button
                key={key}
                type="button"
                className={`text-style-modal__effect${draft[key] ? ' is-active' : ''}`}
                aria-pressed={Boolean(draft[key])}
                onClick={() => toggle(key)}
              >
                {label}
              </button>
            ))}
          </div>
        </fieldset>

        <label className="text-style-modal__range">
          Espacio interno ({draft.paddingPx ?? 0}px)
          <input
            type="range"
            min={0}
            max={32}
            value={draft.paddingPx ?? 0}
            onChange={(event) => patch({ paddingPx: Number(event.target.value) })}
          />
        </label>

        <label className="text-style-modal__range">
          Espacio entre letras ({draft.letterSpacingPx ?? 0}px)
          <input
            type="range"
            min={0}
            max={8}
            step={0.5}
            value={draft.letterSpacingPx ?? 0}
            onChange={(event) => patch({ letterSpacingPx: Number(event.target.value) })}
          />
        </label>

        <label className="text-style-modal__range">
          Interlineado ({(draft.lineHeight ?? DEFAULT_BLOG_TEXT_STYLE.lineHeight).toFixed(1)})
          <input
            type="range"
            min={1}
            max={2.4}
            step={0.1}
            value={draft.lineHeight ?? DEFAULT_BLOG_TEXT_STYLE.lineHeight}
            onChange={(event) => patch({ lineHeight: Number(event.target.value) })}
          />
        </label>
      </div>
    </Modal>
  )
}
