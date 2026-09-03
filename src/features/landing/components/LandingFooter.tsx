import type { MouseEvent, ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Copy, MessageCircle } from 'lucide-react'
import ipLogo from '@/assets/logos/icon.ico'
import { notifyError, notifySuccess } from '@/shared/lib/notify'
import { FOOTER_NAV_LINKS, LANDING_CONTACT } from '../content'
import { parseLandingHash, scrollToLandingSection } from '../landingScroll'
import { LandingMap } from './LandingMap'

async function copyText(label: string, value: string) {
  try {
    await navigator.clipboard.writeText(value)
    notifySuccess(`${label} copiado`)
  } catch {
    notifyError('No se pudo copiar', 'Intenta de nuevo')
  }
}

function FooterField({
  label,
  children,
  actions,
}: {
  label: string
  children?: ReactNode
  actions?: ReactNode
}) {
  return (
    <div className="landing-footer__field">
      <dt className="landing-footer__key">{label}</dt>
      {children != null ? <dd className="landing-footer__value">{children}</dd> : null}
      {actions ? <div className="landing-footer__actions">{actions}</div> : null}
    </div>
  )
}

function useLandingFooterNav() {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const handleSectionNav = (event: MouseEvent<HTMLAnchorElement>, href: string) => {
    const sectionId = parseLandingHash(href)
    if (!sectionId) return

    const target = document.getElementById(sectionId)
    const onHome = pathname === '/'

    if (target) {
      event.preventDefault()
      scrollToLandingSection(sectionId)
      window.history.replaceState(null, '', onHome ? href : `/${href}`)
      return
    }

    if (!onHome) {
      event.preventDefault()
      navigate({ pathname: '/', hash: sectionId })
    }
  }

  return { handleSectionNav }
}

export function LandingLocationMap() {
  return (
    <section className="landing-location" id="ubicacion" aria-labelledby="landing-location-title">
      <div className="landing-location__inner">
        <h2 className="landing-location__title" id="landing-location-title">
          ¿Dónde nos ubicamos?
        </h2>
        <LandingMap />
      </div>
    </section>
  )
}

export function LandingFooter() {
  const { handleSectionNav } = useLandingFooterNav()

  return (
    <footer className="landing-footer" id="contacto">
      <div className="landing-footer__inner">
        <div className="landing-footer__col landing-footer__col--brand">
          <img className="landing-footer__logo" src={ipLogo} alt="" width={48} height={48} />
          <p className="landing-footer__brand">Importadora Premium</p>
          <p className="landing-footer__text">
            Importación y distribución con estándar premium.
          </p>
        </div>

        <div className="landing-footer__col">
          <h3 className="landing-footer__heading">Síguenos en redes sociales</h3>
          <dl className="landing-footer__list">
            {LANDING_CONTACT.social.map((item) => (
              <div key={item.id} className="landing-footer__field">
                <a
                  className="landing-footer__key landing-footer__key--link"
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {item.label}
                </a>
              </div>
            ))}
            <FooterField label="Mapa">
              <a
                href={LANDING_CONTACT.mapsShareUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Ver ubicación
              </a>
            </FooterField>
          </dl>
        </div>

        <div className="landing-footer__col">
          <h3 className="landing-footer__heading">Contáctanos</h3>
          <dl className="landing-footer__list">
            <FooterField
              label="WhatsApp"
              actions={(
                <>
                  <button
                    type="button"
                    className="landing-footer__icon-btn"
                    aria-label="Copiar número de WhatsApp"
                    title="Copiar"
                    onClick={() => copyText('Número', LANDING_CONTACT.phoneDisplay)}
                  >
                    <Copy size={16} strokeWidth={2.25} aria-hidden />
                  </button>
                  <a
                    className="landing-footer__icon-btn"
                    href={LANDING_CONTACT.whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Abrir chat de WhatsApp"
                    title="WhatsApp"
                  >
                    <MessageCircle size={16} strokeWidth={2.25} aria-hidden />
                  </a>
                </>
              )}
            >
              <a
                href={LANDING_CONTACT.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                {LANDING_CONTACT.phoneDisplay}
              </a>
            </FooterField>
            <FooterField
              label="Correo"
              actions={(
                <button
                  type="button"
                  className="landing-footer__icon-btn"
                  aria-label="Copiar correo electrónico"
                  title="Copiar"
                  onClick={() => copyText('Correo', LANDING_CONTACT.email)}
                >
                  <Copy size={16} strokeWidth={2.25} aria-hidden />
                </button>
              )}
            >
              <a href={`mailto:${LANDING_CONTACT.email}`}>{LANDING_CONTACT.email}</a>
            </FooterField>
            <FooterField
              label={LANDING_CONTACT.addressLabel}
              actions={(
                <button
                  type="button"
                  className="landing-footer__icon-btn"
                  aria-label="Copiar dirección del punto de venta"
                  title="Copiar"
                  onClick={() => copyText('Dirección', LANDING_CONTACT.address)}
                >
                  <Copy size={16} strokeWidth={2.25} aria-hidden />
                </button>
              )}
            >
              <a
                href={LANDING_CONTACT.mapsShareUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                {LANDING_CONTACT.address}
              </a>
            </FooterField>
          </dl>
        </div>

        <div className="landing-footer__col">
          <h3 className="landing-footer__heading">Navegación</h3>
          <dl className="landing-footer__list">
            {FOOTER_NAV_LINKS.map((link) => (
              <div key={link.href} className="landing-footer__field">
                <a
                  className="landing-footer__key landing-footer__key--link"
                  href={link.href}
                  onClick={(event) => handleSectionNav(event, link.href)}
                >
                  {link.label}
                </a>
              </div>
            ))}
          </dl>
        </div>
      </div>
      <p className="landing-footer__legal">
        © {new Date().getFullYear()} Importadora Premium | Uso exclusivo del equipo de desarrollo IP ®.
      </p>
    </footer>
  )
}
