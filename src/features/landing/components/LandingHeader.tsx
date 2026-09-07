import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, ChevronDown, LogOut, Menu, X } from 'lucide-react'
import ipLogo from '@/assets/logos/icon.ico'
import { useAuth } from '@/app/providers/AuthProvider'
import type { LoginAudience } from '@/app/providers/AuthProvider'
import { isStorefrontClient } from '@/shared/permissions/isStorefrontClient'
import { mockRoles } from '@/mocks/data'
import { confirmAndLogout } from '@/shared/lib/logoutSession'
import { LANDING_HEADER_ITEMS } from '../content'
import { getLandingDetailPath } from '../landingDetailPages'
import { handleLandingHashClick, isDocumentReload, parseLandingHash, scrollToLandingSection } from '../landingScroll'

type LandingHeaderProps = {
  onLoginClick?: (audience: LoginAudience) => void
  showBack?: boolean
  brandOnly?: boolean
}

type MenuCoords = {
  top: number
  right: number
}

const MOBILE_NAV_MQ = '(max-width: 820px)'

function scrollToPageTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

export function LandingHeader({ onLoginClick, showBack, brandOnly = false }: LandingHeaderProps) {
  const { isAuthenticated, user, logout, staffHome } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const client = isStorefrontClient(user?.roles ?? [], mockRoles)
  const canOpenStaff = isAuthenticated && !client
  const [loginMenuOpen, setLoginMenuOpen] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [pastHero, setPastHero] = useState(false)
  const [menuCoords, setMenuCoords] = useState<MenuCoords | null>(null)
  const loginTriggerRef = useRef<HTMLDivElement>(null)
  const loginMenuRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLElement>(null)
  const loginMenuId = useId()
  const mobileNavId = useId()

  const handleBrandClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (location.pathname !== '/') return
    event.preventDefault()
    scrollToPageTop()
  }

  const handleAnchorNav = (event: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    setMobileNavOpen(false)
    if (location.pathname === '/') {
      handleLandingHashClick(event, href)
      return
    }
    event.preventDefault()
    const sectionId = parseLandingHash(href)
    navigate(sectionId ? `/#${sectionId}` : '/')
  }

  const updateMenuCoords = () => {
    const trigger = loginTriggerRef.current
    if (!trigger) return
    const rect = trigger.getBoundingClientRect()
    setMenuCoords({
      top: rect.bottom + 18,
      right: window.innerWidth - rect.right,
    })
  }

  useLayoutEffect(() => {
    if (!loginMenuOpen) {
      setMenuCoords(null)
      return undefined
    }
    updateMenuCoords()
    window.addEventListener('resize', updateMenuCoords)
    window.addEventListener('scroll', updateMenuCoords, true)
    return () => {
      window.removeEventListener('resize', updateMenuCoords)
      window.removeEventListener('scroll', updateMenuCoords, true)
    }
  }, [loginMenuOpen])

  useEffect(() => {
    if (!loginMenuOpen) return undefined

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node
      const inTrigger = loginTriggerRef.current?.contains(target)
      const inMenu = loginMenuRef.current?.contains(target)
      if (!inTrigger && !inMenu) {
        setLoginMenuOpen(false)
      }
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setLoginMenuOpen(false)
    }

    const timer = window.setTimeout(() => {
      document.addEventListener('mousedown', onPointerDown)
    }, 0)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      window.clearTimeout(timer)
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [loginMenuOpen])

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_NAV_MQ)
    const onChange = () => {
      if (!mq.matches) setMobileNavOpen(false)
    }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    if (brandOnly) {
      setPastHero(false)
      return undefined
    }

    const scrollTop = () =>
      window.scrollY
      || document.documentElement.scrollTop
      || document.body.scrollTop
      || 0

    const syncPastHero = () => {
      setPastHero(scrollTop() > 8)
    }

    syncPastHero()
    window.addEventListener('scroll', syncPastHero, { passive: true })
    document.addEventListener('scroll', syncPastHero, { passive: true, capture: true })
    window.addEventListener('resize', syncPastHero)
    return () => {
      window.removeEventListener('scroll', syncPastHero)
      document.removeEventListener('scroll', syncPastHero, true)
      window.removeEventListener('resize', syncPastHero)
    }
  }, [brandOnly, location.pathname])

  useEffect(() => {
    if (!mobileNavOpen) return undefined
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileNavOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [mobileNavOpen])

  useEffect(() => {
    if (location.pathname !== '/') return
    if (isDocumentReload()) return
    const sectionId = parseLandingHash(location.hash)
    if (!sectionId) return
    const frame = window.requestAnimationFrame(() => {
      scrollToLandingSection(sectionId, 'smooth')
    })
    return () => window.cancelAnimationFrame(frame)
  }, [location.pathname, location.hash])

  const headerBar = (variant: 'desktop' | 'mobile') => {
    const closeMobile = () => setMobileNavOpen(false)

    return (
      <>
        {LANDING_HEADER_ITEMS.map((item) => {
          if (item.kind === 'anchor') {
            return (
              <a
                key={item.href}
                href={item.href}
                className="landing-header__link"
                onClick={(event) => handleAnchorNav(event, item.href)}
              >
                {item.label}
              </a>
            )
          }

          if (item.kind === 'explore') {
            return (
              <Link
                key={item.slug}
                to={getLandingDetailPath(item.slug)}
                className="landing-header__link"
                onClick={closeMobile}
              >
                {item.label}
              </Link>
            )
          }

          if (item.kind === 'route') {
            return (
              <Link
                key={item.to}
                to={item.to}
                className="landing-header__link"
                onClick={closeMobile}
              >
                {item.label}
              </Link>
            )
          }

          return (
            <span key="session" className="landing-header__session">
              {canOpenStaff ? (
                <button
                  type="button"
                  className="landing-header__btn"
                  onClick={() => {
                    closeMobile()
                    navigate(staffHome)
                  }}
                >
                  Panel
                </button>
              ) : null}
              {isAuthenticated ? (
                <button
                  type="button"
                  className={`landing-header__btn${variant === 'desktop' ? ' landing-header__btn--icon' : ''}`}
                  aria-label={user?.fullName ? `Salir · ${user.fullName.split(' ')[0]}` : 'Salir'}
                  title={user?.fullName ? `Salir · ${user.fullName.split(' ')[0]}` : 'Salir'}
                  onClick={() => {
                    closeMobile()
                    void confirmAndLogout(logout, navigate)
                  }}
                >
                  {variant === 'desktop' ? <LogOut size={20} strokeWidth={2.25} aria-hidden /> : 'Salir'}
                </button>
              ) : variant === 'desktop' ? (
                <div className="landing-header__login" ref={loginTriggerRef}>
                  <button
                    type="button"
                    className="landing-header__btn"
                    aria-expanded={loginMenuOpen}
                    aria-controls={loginMenuId}
                    aria-haspopup="menu"
                    onClick={() => setLoginMenuOpen((open) => !open)}
                  >
                    {item.label}
                    <ChevronDown size={16} strokeWidth={2.25} aria-hidden />
                  </button>
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    className="landing-header__link"
                    onClick={() => {
                      closeMobile()
                      onLoginClick?.('client')
                    }}
                  >
                    Iniciar sesión Clientes premium
                  </button>
                  <button
                    type="button"
                    className="landing-header__link"
                    onClick={() => {
                      closeMobile()
                      onLoginClick?.('staff')
                    }}
                  >
                    Iniciar sesión Administrativos premium
                  </button>
                </>
              )}
            </span>
          )
        })}
      </>
    )
  }

  const loginMenu = loginMenuOpen && menuCoords
    ? createPortal(
        <div
          ref={loginMenuRef}
          className="landing-header__login-menu"
          id={loginMenuId}
          role="menu"
          style={{ top: menuCoords.top, right: menuCoords.right }}
        >
          <button
            type="button"
            role="menuitem"
            className="landing-header__login-option"
            onClick={() => {
              setLoginMenuOpen(false)
              onLoginClick?.('client')
            }}
          >
            Inicio de sesión Cliente Premium
          </button>
          <button
            type="button"
            role="menuitem"
            className="landing-header__login-option"
            onClick={() => {
              setLoginMenuOpen(false)
              onLoginClick?.('staff')
            }}
          >
            Inicio de sesión Administrativo
          </button>
        </div>,
        document.body,
      )
    : null

  const mobileDrawer: ReactNode = mobileNavOpen
    ? createPortal(
        <div className="landing-header__drawer" role="dialog" aria-modal="true" aria-labelledby={mobileNavId}>
          <button
            type="button"
            className="landing-header__drawer-backdrop"
            aria-label="Cerrar menú"
            onClick={() => setMobileNavOpen(false)}
          />
          <nav className="landing-header__drawer-panel" id={mobileNavId} aria-label="Menú de navegación">
            {headerBar('mobile')}
          </nav>
        </div>,
        document.body,
      )
    : null

  return (
    <header
      ref={headerRef}
      className={`landing-header${brandOnly || !pastHero ? '' : ' is-past-hero'}`}
    >
      {showBack ? (
        <button
          type="button"
          className="landing-header__back"
          aria-label="Volver a la página anterior"
          onClick={() => {
            if (window.history.length > 1) {
              navigate(-1)
              return
            }
            navigate('/')
          }}
        >
          <ArrowLeft size={20} strokeWidth={2.25} aria-hidden />
        </button>
      ) : null}
      <Link
        to="/"
        className="landing-header__brand"
        aria-label="Importadora Premium — subir al inicio de la página"
        onClick={handleBrandClick}
      >
        <img src={ipLogo} alt="" width={64} height={64} />
      </Link>

      {brandOnly ? null : (
        <div className="landing-header__actions landing-header__actions--desktop">
          <nav className="landing-header__nav" aria-label="Accesos del sitio">
            {headerBar('desktop')}
          </nav>
        </div>
      )}

      {brandOnly ? null : (
        <button
          type="button"
          className="landing-header__menu-btn"
          aria-expanded={mobileNavOpen}
          aria-controls={mobileNavId}
          aria-label={mobileNavOpen ? 'Cerrar menú' : 'Abrir menú'}
          onClick={() => {
            setLoginMenuOpen(false)
            setMobileNavOpen((open) => !open)
          }}
        >
          {mobileNavOpen ? <X size={22} strokeWidth={2.25} aria-hidden /> : <Menu size={22} strokeWidth={2.25} aria-hidden />}
        </button>
      )}
      {brandOnly ? null : loginMenu}
      {brandOnly ? null : mobileDrawer}
    </header>
  )
}
