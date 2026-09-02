import type { ReactNode } from 'react'
import './DetailView.css'

export type DetailField = {
  label: string
  value: ReactNode
}

export type DetailSection = {
  title?: string
  fields: DetailField[]
}

type DetailViewProps = {
  title?: string
  subtitle?: string
  /** Miniatura opcional (p. ej. imagen de producto). */
  media?: ReactNode
  sections: DetailSection[]
  className?: string
}

/** Vista de lectura compacta y modular para acciones "Ver". */
export function DetailView({
  title,
  subtitle,
  media,
  sections,
  className = '',
}: DetailViewProps) {
  return (
    <div className={`detail-view ${className}`.trim()}>
      {(title || subtitle || media) ? (
        <header className="detail-view__header">
          {media ? <div className="detail-view__media">{media}</div> : null}
          <div className="detail-view__heading">
            {title ? <h3 className="detail-view__title">{title}</h3> : null}
            {subtitle ? <p className="detail-view__subtitle">{subtitle}</p> : null}
          </div>
        </header>
      ) : null}

      <div className="detail-view__modules">
        {sections.map((section, index) => (
          <section key={section.title ?? `section-${index}`} className="detail-view__module">
            {section.title ? <h4 className="detail-view__module-title">{section.title}</h4> : null}
            <dl className="detail-view__rows">
              {section.fields.map((field) => (
                <div key={field.label} className="detail-view__row">
                  <dt>{field.label}</dt>
                  <dd>{field.value ?? '—'}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>
    </div>
  )
}
