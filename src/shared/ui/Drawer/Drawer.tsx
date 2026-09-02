import { namedControl } from '@/shared/lib/namedControl'
import './Drawer.css'

export function Drawer({
  isOpen,
  title,
  onClose,
  children,
}: {
  isOpen: boolean
  title: string
  onClose: () => void
  children: React.ReactNode
}) {
  return (
    <aside className={`drawer ${isOpen ? 'drawer--open' : ''}`} {...namedControl(title || 'Panel')}>
      <div className="drawer__header">
        <button type="button" className="drawer__close" onClick={onClose} {...namedControl('Cerrar panel')}>
          ×
        </button>
        <div className="drawer__title">{title}</div>
        <span className="drawer__header-spacer" aria-hidden="true" />
      </div>
      {children}
    </aside>
  )
}

export function DrawerBackdrop({ onClick }: { onClick: () => void }) {
  return <div className="drawer-backdrop" onClick={onClick} {...namedControl('Cerrar panel')} />
}
