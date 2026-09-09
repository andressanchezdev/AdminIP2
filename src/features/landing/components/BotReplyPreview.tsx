import { useId } from 'react'

type BotReplyPreviewProps = {
  previewLabel?: string
  title?: string
  value: string
  onChange: (value: string) => void
}

export function BotReplyPreview({
  previewLabel = 'Respuesta final',
  title = 'Editar respuesta',
  value,
  onChange,
}: BotReplyPreviewProps) {
  const previewId = useId()
  const editorId = useId()
  const parts = value.split(/(\{[^}]+\})/g)

  return (
    <section className="bot-reply" aria-labelledby={editorId}>
      <label className="content-card__subtitle" htmlFor={editorId}>
        {title}
      </label>
      <textarea
        id={editorId}
        className="admin-input bot-reply__editor"
        value={value}
        rows={5}
        onChange={(event) => onChange(event.target.value)}
      />
      <p id={previewId} className="content-card__subtitle">
        {previewLabel}
      </p>
      <div className="bot-reply__bubble" role="status" aria-live="polite">
        {value.trim() ? (
          parts.map((part, index) =>
            part.startsWith('{') && part.endsWith('}') ? (
              <strong key={`${part}-${index}`}>{part}</strong>
            ) : (
              <span key={`${part}-${index}`}>{part}</span>
            ),
          )
        ) : (
          <span className="bot-reply__empty">El visitante verá aquí el mensaje del bot.</span>
        )}
      </div>
    </section>
  )
}
