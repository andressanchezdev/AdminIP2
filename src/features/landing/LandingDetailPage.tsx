import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight, MapPin, Briefcase, Phone } from 'lucide-react'
import { CatalogHeroMagnify } from './components/CatalogHeroMagnify'
import { useAuth } from '@/app/providers/AuthProvider'
import { AuthModal } from '@/features/auth/components/AuthModal/AuthModal'
import cloudDownloadIcon from '@/assets/icons/cloud-download.svg'
import { getPublishedVacancies, type VacancyRecord } from '@/mocks/data'
import { notifyError, notifySuccess } from '@/shared/lib/notify'
import { downloadCatalogPdf } from '@/features/landing/lib/downloadCatalogPdf'
import { CATALOG_PRODUCTS, catalogImageFitVars, resolveInitialCatalogIndex } from './catalogProducts'
import { DetailHighlights } from './components/DetailHighlights'
import { LandingChatWidget } from './chat/LandingChatWidget'
import { LandingHeader } from './components/LandingHeader'
import { LandingFooter, LandingLocationMap } from './components/LandingFooter'
import { LANDING_CONTACT } from './content'
import { resolveLandingDetailPage, type LandingDetailPage } from './landingDetailPages'
import './LandingPage.css'

function productWhatsappUrl(label: string) {
  const text = encodeURIComponent(`Hola, quiero obtener el producto: ${label}`)
  const base = LANDING_CONTACT.whatsappUrl
  return `${base}${base.includes('?') ? '&' : '?'}text=${text}`
}

function CatalogDetailBody({ page }: { page: LandingDetailPage }) {
  const [activeProductIndex, setActiveProductIndex] = useState(() =>
    resolveInitialCatalogIndex(page.slug, page.images),
  )

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [page.slug])

  const productCount = CATALOG_PRODUCTS.length

  const showProduct = (index: number) => {
    setActiveProductIndex(((index % productCount) + productCount) % productCount)
  }

  const showProductFromGallery = (index: number) => {
    showProduct(index)
    document.getElementById('landing-detail-hero')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        setActiveProductIndex((current) => (current - 1 + productCount) % productCount)
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault()
        setActiveProductIndex((current) => (current + 1) % productCount)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [productCount])

  const activeProduct = CATALOG_PRODUCTS[activeProductIndex]

  return (
    <>
      <section
        className="landing-detail__hero"
        id="landing-detail-hero"
        aria-labelledby="landing-detail-title"
      >
        <div className="landing-detail__hero-media">
          {CATALOG_PRODUCTS.map((product, index) => (
            <img
              key={product.id}
              className={`landing-detail__hero-fade${index === activeProductIndex ? ' is-active' : ''}`}
              src={product.src}
              alt=""
              aria-hidden
            />
          ))}
          <button
            type="button"
            className="landing-detail__hero-nav landing-detail__hero-nav--prev"
            aria-label="Producto anterior"
            onClick={() => showProduct(activeProductIndex - 1)}
          >
            <ChevronLeft size={24} strokeWidth={2} aria-hidden />
          </button>
          <CatalogHeroMagnify
            src={activeProduct.src}
            alt={activeProduct.label}
          />
          <button
            type="button"
            className="landing-detail__hero-nav landing-detail__hero-nav--next"
            aria-label="Producto siguiente"
            onClick={() => showProduct(activeProductIndex + 1)}
          >
            <ChevronRight size={24} strokeWidth={2} aria-hidden />
          </button>
          <div className="landing-detail__dots" role="tablist" aria-label="Productos del catálogo">
            {CATALOG_PRODUCTS.map((product, index) => (
              <button
                key={product.id}
                type="button"
                role="tab"
                className={`landing-detail__dot${activeProductIndex === index ? ' is-active' : ''}`}
                aria-label={`Ver ${product.label}`}
                aria-selected={activeProductIndex === index}
                onClick={() => showProduct(index)}
              />
            ))}
          </div>
        </div>
        <div className="landing-detail__hero-copy">
          <p className="landing-detail__eyebrow">{page.eyebrow}</p>
          <h1 className="landing-detail__title" id="landing-detail-title">{activeProduct.label}</h1>
          <p className="landing-detail__product-desc">{activeProduct.description}</p>
          <a
            className="landing-hero__cta landing-detail__cta-btn"
            href={productWhatsappUrl(activeProduct.label)}
            target="_blank"
            rel="noopener noreferrer"
          >
            Obtener producto
          </a>
        </div>
      </section>

      <section className="landing-detail__content" aria-label="Beneficios Importadora Premium">
        <aside className="landing-detail__aside">
          <DetailHighlights />
        </aside>
      </section>

      <section className="landing-detail__gallery-wrap" aria-label="Catálogo de productos">
        <div className="landing-detail__gallery" role="list">
          {CATALOG_PRODUCTS.map((product, index) => (
            <button
              key={product.id}
              type="button"
              role="listitem"
              className={`landing-detail__gallery-item${index === activeProductIndex ? ' is-active' : ''}`}
              aria-label={`Ver ${product.label}. ${product.description}`}
              aria-pressed={index === activeProductIndex}
              onClick={() => showProductFromGallery(index)}
            >
              <div className="landing-detail__gallery-media" style={catalogImageFitVars(product)}>
                <img src={product.src} alt="" loading="lazy" />
              </div>
              <div className="landing-detail__gallery-body">
                <span className="landing-detail__gallery-name">{product.label}</span>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="landing-detail__cta-bar" aria-label="Acción principal">
        <div className="landing-detail__cta-inner">
          <p className="landing-detail__cta-text">
            Descarga nuestro catálogo completo o contacta a uno de nuestros asesores.
          </p>
          <div className="landing-detail__cta-actions">
            <button
              type="button"
              className="landing-hero__cta landing-detail__cta-btn"
              onClick={() => {
                void downloadCatalogPdf()
              }}
            >
              <span>Descargar catálogo</span>
              <img src={cloudDownloadIcon} width={20} height={20} alt="" aria-hidden />
            </button>
            <a
              className="landing-hero__cta landing-detail__cta-btn landing-detail__cta-btn--whatsapp"
              href="/#equipo"
            >
              <Phone size={18} strokeWidth={2} aria-hidden />
              <span>Contactar con un asesor</span>
            </a>
          </div>
        </div>
      </section>
    </>
  )
}

function VacanciesDetailBody({ page }: { page: LandingDetailPage }) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const vacancies = getPublishedVacancies()
  const selected: VacancyRecord | null =
    vacancies.find((item) => item.id === selectedId) ?? null

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [page.slug])

  return (
    <section className="vacancies-board" aria-labelledby="vacancies-board-title">
      <header className="vacancies-board__intro">
        <p className="vacancies-board__eyebrow">{page.eyebrow}</p>
        <h1 className="vacancies-board__title" id="vacancies-board-title">{page.title}</h1>
        <p className="vacancies-board__lead">{page.lead}</p>
      </header>

      {vacancies.length === 0 ? (
        <p className="vacancies-board__empty">No hay vacantes publicadas en este momento.</p>
      ) : (
        <div className="vacancies-board__layout">
          <ul className="vacancies-board__list" role="list">
            {vacancies.map((vacancy) => {
              const isOpen = selected?.id === vacancy.id
              return (
                <li key={vacancy.id}>
                  <button
                    type="button"
                    className={`vacancies-board__row${isOpen ? ' is-active' : ''}`}
                    aria-expanded={isOpen}
                    onClick={() => setSelectedId(isOpen ? null : vacancy.id)}
                  >
                    <div className="vacancies-board__row-main">
                      <h2 className="vacancies-board__row-title">{vacancy.title}</h2>
                      <p className="vacancies-board__row-summary">{vacancy.summary}</p>
                      <div className="vacancies-board__row-meta">
                        <span>
                          <MapPin size={14} strokeWidth={2} aria-hidden />
                          {vacancy.location}
                        </span>
                        <span>
                          <Briefcase size={14} strokeWidth={2} aria-hidden />
                          {vacancy.employmentType}
                        </span>
                      </div>
                    </div>
                    <span className="vacancies-board__row-cta">{isOpen ? 'Ocultar' : 'Ver detalle'}</span>
                  </button>
                  {isOpen ? (
                    <div className="vacancies-board__detail">
                      <h3>Descripción</h3>
                      <p>{vacancy.description}</p>
                      <h3>Requisitos</h3>
                      <p>{vacancy.requirements}</p>
                      <a className="landing-hero__cta vacancies-board__apply" href={page.ctaHref}>
                        {page.ctaLabel}
                      </a>
                    </div>
                  ) : null}
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </section>
  )
}

export function LandingDetailPage() {
  const { slug } = useParams()
  const page = resolveLandingDetailPage(slug)
  const { login } = useAuth()
  const navigate = useNavigate()
  const [loginOpen, setLoginOpen] = useState(false)
  const [loginAudience, setLoginAudience] = useState<'client' | 'staff'>('staff')
  const [authError, setAuthError] = useState('')

  if (!page) {
    return <Navigate to="/" replace />
  }

  const isVacancies = page.kind === 'vacancies'

  return (
    <div className={`landing-page landing-page--detail${isVacancies ? ' landing-page--vacancies' : ' landing-page--catalog'}`}>
      <LandingHeader
        brandOnly={!isVacancies}
        showBack={isVacancies}
        onLoginClick={(audience) => {
          setAuthError('')
          setLoginAudience(audience)
          setLoginOpen(true)
        }}
      />

      <main className="landing-main landing-detail">
        {isVacancies ? (
          <VacanciesDetailBody page={page} />
        ) : (
          <CatalogDetailBody page={page} />
        )}
      </main>

      <LandingLocationMap />
      <LandingFooter />

      <LandingChatWidget />

      <AuthModal
          isOpen={loginOpen}
          audience={loginAudience}
          onClose={() => setLoginOpen(false)}
          authError={authError}
          onLogin={(form) => {
            setAuthError('')
            const result = login(form.email, form.password, loginAudience)
            if (!result.ok) {
              setAuthError(result.error || 'Credenciales inválidas')
              notifyError('No se pudo iniciar sesión', result.error)
              return
            }
            notifySuccess('Bienvenido')
            setLoginOpen(false)
            navigate(result.home || '/')
          }}
        />
    </div>
  )
}
