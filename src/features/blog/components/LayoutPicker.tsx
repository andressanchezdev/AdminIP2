import type { BlogLayout } from '@/mocks/data'
import './LayoutPicker.css'

type LayoutPickerProps = {
  layouts: BlogLayout[]
  value: string
  onChange: (layoutId: string) => void
  disabled?: boolean
}

const GROUPS: Array<{ title: string; match: (layout: BlogLayout) => boolean }> = [
  { title: '2 bloques', match: (layout) => layout.id !== 'post_ig' && layout.slots.length === 2 },
  { title: '3 bloques', match: (layout) => layout.slots.length === 3 },
  { title: '4 bloques', match: (layout) => layout.slots.length === 4 },
  { title: '5 bloques (mixto)', match: (layout) => layout.slots.length === 5 },
  { title: 'Estilo Instagram', match: (layout) => layout.id === 'post_ig' },
]

/** Galería de maquetas agrupadas por cantidad / estilo. */
export function LayoutPicker({ layouts, value, onChange, disabled }: LayoutPickerProps) {
  return (
    <div className="layout-picker">
      {GROUPS.map((group) => {
        const items = layouts.filter(group.match)
        if (!items.length) return null
        return (
          <section key={group.title} className="layout-picker__group">
            <h4 className="layout-picker__group-title">{group.title}</h4>
            <div className="layout-picker__grid">
              {items.map((layout) => (
                <LayoutCard
                  key={layout.id}
                  layout={layout}
                  selected={value === layout.id}
                  disabled={disabled}
                  onSelect={() => onChange(layout.id)}
                />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}

function LayoutCard({
  layout,
  selected,
  disabled,
  onSelect,
}: {
  layout: BlogLayout
  selected: boolean
  disabled?: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      className={`layout-picker__card ${selected ? 'is-selected' : ''}`}
      disabled={disabled}
      onClick={onSelect}
      aria-pressed={selected}
    >
      <div
        className="layout-picker__preview"
        style={{
          display: 'grid',
          gridTemplateAreas: layout.gridTemplateAreas,
          gridTemplateColumns: layout.gridTemplateColumns,
          gridTemplateRows: 'repeat(auto-fit, minmax(14px, 1fr))',
          gap: 3,
          minHeight: 72,
        }}
      >
        {layout.slots.map((slot) => (
          <span
            key={slot.id}
            className={`layout-picker__cell layout-picker__cell--${slot.type}`}
            style={{ gridArea: slot.area }}
            title={slot.label}
          />
        ))}
      </div>
      <span className="layout-picker__name">{layout.name}</span>
      <span className="layout-picker__meta">
        {layout.id === 'post_ig'
          ? 'Carrusel 1–8 + pie'
          : `${layout.slots.length} bloques · ${layout.orientation === 'row' ? 'horizontal' : 'vertical'}`}
      </span>
    </button>
  )
}
