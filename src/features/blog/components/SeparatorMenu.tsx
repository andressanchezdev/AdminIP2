import { useState } from 'react'
import { Plus } from 'lucide-react'
import type { BlogSeparatorVariant } from '@/mocks/data'
import { BLOG_SEPARATOR_OPTIONS } from '@/features/blog/lib/blogSeparators'
import { BlogSeparator } from '@/features/blog/components/BlogSeparator'
import { Modal } from '@/shared/ui/Modal/Modal'
import './SeparatorMenu.css'

type SeparatorMenuProps = {
  disabled?: boolean
  onSelect: (variant: BlogSeparatorVariant) => void
}

/** Botón (+) que abre pop-up de separadores por encima de la tabla. */
export function SeparatorMenu({ disabled, onSelect }: SeparatorMenuProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="separator-menu">
      <button
        type="button"
        className="separator-menu__trigger"
        disabled={disabled}
        aria-expanded={open}
        onClick={() => setOpen(true)}
        title="Integrar separador"
        aria-label="Integrar separador"
      >
        <Plus size={18} strokeWidth={2.25} aria-hidden />
      </button>

      <Modal
        isOpen={open}
        title="Integrar separador"
        size="md"
        onClose={() => setOpen(false)}
        footer={(
          <button type="button" className="admin-btn" onClick={() => setOpen(false)}>
            Cerrar
          </button>
        )}
      >
        <div className="separator-menu__list" role="menu">
          {BLOG_SEPARATOR_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              className="separator-menu__option"
              role="menuitem"
              onClick={() => {
                onSelect(option.id)
                setOpen(false)
              }}
            >
              <span className="separator-menu__preview">
                <BlogSeparator variant={option.id} compact />
              </span>
              <span className="separator-menu__meta">
                <strong>{option.name}</strong>
                <span>{option.description}</span>
              </span>
            </button>
          ))}
        </div>
      </Modal>
    </div>
  )
}
