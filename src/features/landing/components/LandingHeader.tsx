import { Link, useLocation, useNavigate } from 'react-router-dom'
import ipLogo from '@/assets/logos/icon.ico'
import { useAuth } from '@/app/providers/AuthProvider'
import { isStorefrontClient } from '@/shared/permissions/isStorefrontClient'
import { mockRoles } from '@/mocks/data'
import { confirmAndLogout } from '@/shared/lib/logoutSession'

type LandingHeaderProps = {
  onLoginClick?: () => void
}

function scrollToPageTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

export function LandingHeader({ onLoginClick }: LandingHeaderProps) {
  const { isAuthenticated, user, logout, staffHome } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const client = isStorefrontClient(user?.roles ?? [], mockRoles)
  const canOpenStaff = isAuthenticated && !client

  const handleBrandClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    const scrollRoutes = location.pathname === '/' || location.pathname.startsWith('/explorar/')
    if (!scrollRoutes) return
    event.preventDefault()
    scrollToPageTop()
  }

  return (
    <header className="landing-header">
      <Link
        to="/"
        className="landing-header__brand"
        aria-label="Importadora Premium — subir al inicio de la página"
        onClick={handleBrandClick}
      >
        <img src={ipLogo} alt="" width={64} height={64} />
      </Link>
      <div className="landing-header__actions">
        <Link to="/blog" className="landing-header__link">Blog</Link>
        {canOpenStaff ? (
          <button
            type="button"
            className="landing-header__btn"
            onClick={() => navigate(staffHome)}
          >
            Panel
          </button>
        ) : null}
        {isAuthenticated ? (
          <button
            type="button"
            className="landing-header__btn"
            onClick={() => void confirmAndLogout(logout, navigate)}
          >
            Salir{user?.fullName ? ` · ${user.fullName.split(' ')[0]}` : ''}
          </button>
        ) : (
          <button
            type="button"
            className="landing-header__btn"
            onClick={onLoginClick}
          >
            Login
          </button>
        )}
      </div>
    </header>
  )
}
