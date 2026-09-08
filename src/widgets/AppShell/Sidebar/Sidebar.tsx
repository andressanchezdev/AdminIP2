import { useEffect, useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  ChevronDown,
  Database,
  FileText,
  History,
  KeyRound,
  LayoutDashboard,
  Briefcase,
  List,
  LogIn,
  LogOut,
  Newspaper,
  Package,
  Receipt,
  Settings,
  ShoppingBag,
  Truck,
  User,
} from 'lucide-react'
import ipLogo from '@/assets/logos/icon.ico'
import { namedControl, namedImage } from '@/shared/lib/namedControl'
import type { MenuNode } from '@/mocks/data'
import './Sidebar.css'

const ICON_MAP: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard,
  metrics: History,
  chart: History,
  history: History,
  access: KeyRound,
  operation: Database,
  settings: Settings,
  orders: Receipt,
  clients: User,
  shipments: Truck,
  products: ShoppingBag,
  audit: FileText,
  package: Package,
  list: List,
  blog: Newspaper,
  content: FileText,
  vacancies: Briefcase,
}

type SidebarProps = {
  items: MenuNode[]
  activePath: string
  isAuthenticated: boolean
  /** En desktop siempre visible; en móvil controla el drawer overlay. */
  mobileOpen?: boolean
  onNavigate: (path: string) => void
  onProfileClick?: () => void
  onLogin?: () => void
  onLogout?: () => void
  onCloseMobile?: () => void
}

function pathMatches(activePath: string, path: string) {
  if (activePath === path) return true
  return path === '/contenido/landing' && activePath.startsWith('/contenido/landing/')
}

function isGroupActive(item: MenuNode, activePath: string) {
  if (pathMatches(activePath, item.path)) return true
  return (item.children ?? []).some((child) => pathMatches(activePath, child.path))
}

export function Sidebar({
  items,
  activePath,
  isAuthenticated,
  mobileOpen = true,
  onNavigate,
  onProfileClick,
  onLogin,
  onLogout,
}: SidebarProps) {
  const [openGroupId, setOpenGroupId] = useState<string | null>(null)

  useEffect(() => {
    const activeGroup = items.find((item) => item.children?.length && isGroupActive(item, activePath))
    setOpenGroupId(activeGroup?.id ?? null)
  }, [activePath, items])

  const handleSessionAction = () => {
    if (isAuthenticated) {
      onLogout?.()
      return
    }
    onLogin?.()
  }

  const toggleGroup = (id: string) => {
    setOpenGroupId((current) => (current === id ? null : id))
  }

  return (
    <aside
      className={`sidebar ${mobileOpen ? 'sidebar--open' : ''}`}
      aria-hidden={!mobileOpen}
      {...namedControl('Navegación principal')}
    >
      <button
        type="button"
        className="sidebar__logo-btn"
        onClick={onProfileClick}
        {...namedControl('Abrir perfil')}
      >
        <img src={ipLogo} className="sidebar__logo" {...namedImage('Importadora Premium')} />
        <span className="sidebar__brand">
          <span>Importadora</span>
          <span>Premium</span>
        </span>
      </button>

      <nav className="sidebar__nav" {...namedControl('Menú de vistas')}>
        {items.map((item) => {
          const Icon = ICON_MAP[item.icon ?? ''] ?? LayoutDashboard
          const children = item.children ?? []
          const hasChildren = children.length > 0
          const groupActive = isGroupActive(item, activePath)
          const isOpen = openGroupId === item.id

          if (!hasChildren) {
            const isActive = pathMatches(activePath, item.path)
            return (
              <button
                key={item.id}
                type="button"
                className={`sidebar__item ${isActive ? 'sidebar__item--active' : ''}`}
                onClick={() => onNavigate(item.path)}
                aria-current={isActive ? 'page' : undefined}
                {...namedControl(item.title)}
              >
                <Icon className="sidebar__icon" size={20} strokeWidth={1.75} aria-hidden />
                <span className="sidebar__label">{item.title}</span>
              </button>
            )
          }

          return (
            <div
              key={item.id}
              className={`sidebar__group ${groupActive ? 'sidebar__group--active' : ''} ${isOpen ? 'sidebar__group--open' : ''}`}
            >
              <button
                type="button"
                className={`sidebar__item sidebar__item--parent ${groupActive ? 'sidebar__item--active' : ''}`}
                onClick={() => toggleGroup(item.id)}
                aria-expanded={isOpen}
                {...namedControl(item.title)}
              >
                <Icon className="sidebar__icon" size={20} strokeWidth={1.75} aria-hidden />
                <span className="sidebar__label">{item.title}</span>
                <ChevronDown
                  className={`sidebar__chevron ${isOpen ? 'sidebar__chevron--open' : ''}`}
                  size={14}
                  strokeWidth={2}
                  aria-hidden
                />
              </button>

              <div className={`sidebar__accordion ${isOpen ? 'sidebar__accordion--open' : ''}`}>
                <div className="sidebar__accordion-inner">
                  {children.map((child) => {
                    const childActive = pathMatches(activePath, child.path)
                    return (
                      <button
                        key={child.id}
                        type="button"
                        className={`sidebar__subitem ${childActive ? 'sidebar__subitem--active' : ''}`}
                        onClick={() => onNavigate(child.path)}
                        aria-current={childActive ? 'page' : undefined}
                        {...namedControl(child.title)}
                      >
                        <span className="sidebar__sublabel">{child.title}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )
        })}
      </nav>

      <div className="sidebar__footer">
        <button
          type="button"
          className="sidebar__item sidebar__item--logout"
          onClick={handleSessionAction}
          {...namedControl(isAuthenticated ? 'Cerrar sesión' : 'Iniciar sesión')}
        >
          {isAuthenticated ? (
            <LogOut className="sidebar__icon" size={20} strokeWidth={1.75} aria-hidden />
          ) : (
            <LogIn className="sidebar__icon" size={20} strokeWidth={1.75} aria-hidden />
          )}
          <span className="sidebar__label">{isAuthenticated ? 'Salir' : 'Iniciar sesión'}</span>
        </button>
      </div>
    </aside>
  )
}
