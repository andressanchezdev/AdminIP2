import { useEffect, useMemo, useState } from 'react'
import { Menu, X } from 'lucide-react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/app/providers/AuthProvider'
import { mockMenu, type MenuNode } from '@/mocks/data'
import { Sidebar } from '@/widgets/AppShell/Sidebar/Sidebar'
import { Header } from '@/widgets/AppShell/Header/Header'
import {
  PageHeaderActionsProvider,
  usePageHeaderActionsSlot,
} from '@/widgets/AppShell/Header/PageHeaderActions'
import { getPageSubtitle, getPageTitle } from '@/shared/routing/pageTitles'
import { toRouteKey } from '@/shared/routing/routeKey'
import { confirmAndLogout } from '@/shared/lib/logoutSession'
import { namedControl } from '@/shared/lib/namedControl'

const MOBILE_NAV_MQ = '(max-width: 768px)'

function filterMenu(items: MenuNode[], roleIds: string[], hasPermission: (required: string | string[]) => boolean): MenuNode[] {
  return items
    .map((item) => {
      const roleOk = !item.rolesAllowed?.length
        || item.rolesAllowed.some((roleId) => roleIds.includes(roleId))
      if (!roleOk) {
        return null
      }

      if (item.children?.length) {
        const children = filterMenu(item.children, roleIds, hasPermission)
        if (!children.length) {
          return null
        }
        return { ...item, children }
      }

      const routeKey = item.routeKey ?? toRouteKey(item.path)
      const required = item.permissionsAllowed?.length
        ? item.permissionsAllowed
        : routeKey
          ? [routeKey]
          : []

      if (!required.length) {
        return null
      }

      const allowed = required.some((code) => hasPermission(code))
      return allowed ? item : null
    })
    .filter(Boolean) as MenuNode[]
}

function moduleSubtitle(pathname: string, menu: MenuNode[]): string | undefined {
  for (const item of menu) {
    for (const child of item.children ?? []) {
      if (child.path === pathname) {
        return item.title
      }
    }
    if (item.path === pathname) {
      return undefined
    }
  }
  return undefined
}

function useIsMobileNav() {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') {
      return false
    }
    return window.matchMedia(MOBILE_NAV_MQ).matches
  })

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_NAV_MQ)
    const onChange = () => setIsMobile(mq.matches)
    onChange()
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  return isMobile
}

function AdminShellChrome() {
  const { user, isAuthenticated, logout, hasPermission } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { actions } = usePageHeaderActionsSlot()
  const isMobileNav = useIsMobileNav()
  const [navOpen, setNavOpen] = useState(false)

  useEffect(() => {
    setNavOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!isMobileNav) {
      setNavOpen(false)
    }
  }, [isMobileNav])

  useEffect(() => {
    if (!navOpen || !isMobileNav) {
      return undefined
    }
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [navOpen, isMobileNav])

  const visibleMenu = useMemo(
    () => filterMenu(mockMenu, user?.roles ?? [], hasPermission),
    [user?.roles, hasPermission],
  )

  const title = getPageTitle(location.pathname)
  const subtitle = getPageSubtitle(location.pathname) ?? moduleSubtitle(location.pathname, visibleMenu)

  const handleNavigate = (path: string) => {
    navigate(path)
    setNavOpen(false)
  }

  const handleLogout = () => {
    void confirmAndLogout(logout, navigate)
  }

  return (
    <div className={`landing ${navOpen && isMobileNav ? 'landing--nav-open' : ''}`}>
      {isMobileNav && navOpen ? (
        <button
          type="button"
          className="landing__nav-backdrop"
          aria-label="Cerrar menú"
          onClick={() => setNavOpen(false)}
        />
      ) : null}

      <Sidebar
        items={visibleMenu}
        activePath={location.pathname}
        isAuthenticated={isAuthenticated}
        mobileOpen={isMobileNav ? navOpen : true}
        onNavigate={handleNavigate}
        onProfileClick={() => {
          navigate('/configuracion/perfil')
          setNavOpen(false)
        }}
        onLogin={() => navigate('/login')}
        onLogout={handleLogout}
        onCloseMobile={() => setNavOpen(false)}
      />

      <div className="landing__main">
        <Header
          title={title}
          subtitle={subtitle}
          actions={actions}
          leading={isMobileNav ? (
            <button
              type="button"
              className="admin-header__menu-btn"
              onClick={() => setNavOpen((open) => !open)}
              aria-expanded={navOpen}
              {...namedControl(navOpen ? 'Cerrar menú' : 'Abrir menú')}
            >
              {navOpen ? <X size={20} strokeWidth={2} /> : <Menu size={20} strokeWidth={2} />}
            </button>
          ) : null}
        />
        <main className="landing__content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export function AdminShell() {
  return (
    <PageHeaderActionsProvider>
      <AdminShellChrome />
    </PageHeaderActionsProvider>
  )
}
