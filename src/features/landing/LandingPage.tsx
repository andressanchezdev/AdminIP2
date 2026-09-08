import { useEffect, useLayoutEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/app/providers/AuthProvider'
import { LandingLocationMap } from './components/LandingFooter'
import { AuthModal } from '@/features/auth/components/AuthModal/AuthModal'
import { consumePostLogoutLanding } from '@/shared/lib/logoutSession'
import { notifyError, notifySuccess } from '@/shared/lib/notify'
import { CATALOG_CAROUSEL_MS, HERO_BG_MS } from './content'
import { catalogMultiIndices, getLandingContent, visibleBrands } from './landingContentStore'
import { getLandingDetailPath } from './landingDetailPages'
import { handleLandingHashClick, resetLandingScrollOnReload } from './landingScroll'
import { LandingChatWidget } from './chat/LandingChatWidget'
import { AdvisorCarousel } from './components/AdvisorCarousel'
import { LandingCareersBar } from './components/LandingCareersBar'
import { LandingHeader } from './components/LandingHeader'
import { LandingStats } from './components/LandingStats'
import { LandingFooter } from './components/LandingFooter'
import { useNearViewport } from './hooks/useNearViewport'
import './LandingPage.css'

function BrandMarqueeRow({
  logos,
}: {
  logos: readonly { name: string; url: string }[]
}) {
  const loop = [...logos, ...logos]
  return (
    <div className="our-brands__row" aria-hidden>
      <div className="our-brands__track">
        {loop.map((brand, index) => (
          <span key={`${brand.name}-${index}`} className="our-brands__logo">
            <img src={brand.url} alt={brand.name} loading="lazy" />
          </span>
        ))}
      </div>
    </div>
  )
}

function CatalogProductCard({
  label,
  images,
  autoPlay,
  advanceToken,
}: {
  label: string
  images: readonly string[]
  autoPlay: boolean
  advanceToken: number
}) {
  const [slide, setSlide] = useState(0)
  const count = images.length

  useEffect(() => {
    if (!autoPlay || count < 2) return
    setSlide((current) => (current + 1) % count)
  }, [advanceToken, autoPlay, count])

  return (
    <article className="catalog-productos__item" aria-label={label}>
      <div className="catalog-productos__carousel" aria-hidden>
        <div
          className="catalog-productos__carousel-track"
          style={{ transform: `translate3d(-${slide * 100}%, 0, 0)` }}
        >
          {images.map((src, index) => (
            <div key={`${label}-${index}`} className="catalog-productos__carousel-slide">
              <span
                className="catalog-productos__carousel-bg"
                style={{ backgroundImage: `url(${src})` }}
                role="img"
                aria-label={`${label} ${index + 1}`}
              />
            </div>
          ))}
        </div>
      </div>
      <h3 className="catalog-productos__item-title">{label}</h3>
      {count > 1 ? (
        <div className="catalog-productos__dots" role="tablist" aria-label={`Posición de ${label}`}>
          {images.map((_, index) => (
            <button
              key={`${label}-dot-${index}`}
              type="button"
              role="tab"
              aria-selected={slide === index}
              aria-label={`Imagen ${index + 1} de ${label}`}
              className={`catalog-productos__dot${slide === index ? ' is-active' : ''}`}
              onClick={(event) => {
                event.preventDefault()
                event.stopPropagation()
                setSlide(index)
              }}
            />
          ))}
        </div>
      ) : (
        <span className="catalog-productos__dots catalog-productos__dots--spacer" aria-hidden />
      )}
    </article>
  )
}

/** Landing pública — distribución según mock (header intacto). */
export function LandingPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [loginOpen, setLoginOpen] = useState(false)
  const [loginAudience, setLoginAudience] = useState<'client' | 'staff'>('staff')
  const [authError, setAuthError] = useState('')
  const [heroBg, setHeroBg] = useState(0)
  const [catalogCarouselTurn, setCatalogCarouselTurn] = useState(0)
  const content = getLandingContent()
  const catalogOptions = content.catalog.options
  const catalogIndices = catalogMultiIndices(catalogOptions)
  const catalogMultiCount = catalogIndices.length
  const catalogActiveOptionIndex = catalogMultiCount === 0 || catalogCarouselTurn === 0
    ? -1
    : catalogIndices[(catalogCarouselTurn - 1) % catalogMultiCount]

  const { ref: heroRef, isActive: heroLive } = useNearViewport<HTMLDivElement>('80px 0px')
  const { ref: catalogRef, isActive: catalogLive } = useNearViewport<HTMLElement>()
  const { ref: brandsRef, isActive: brandsLive } = useNearViewport<HTMLElement>()

  useLayoutEffect(() => {
    const fromLogout = consumePostLogoutLanding()
    if (fromLogout) {
      if ('scrollRestoration' in window.history) {
        window.history.scrollRestoration = 'manual'
      }
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
      return
    }
    resetLandingScrollOnReload()
  }, [])

  useEffect(() => {
    if (sessionStorage.getItem('adminip.postLogoutToast') === '1') {
      sessionStorage.removeItem('adminip.postLogoutToast')
      notifySuccess('Sesión cerrada')
    }
  }, [])

  useEffect(() => {
    if (!catalogLive || catalogIndices.length === 0) return undefined
    const timer = window.setInterval(() => {
      setCatalogCarouselTurn((current) => current + 1)
    }, CATALOG_CAROUSEL_MS)
    return () => window.clearInterval(timer)
  }, [catalogLive, catalogIndices.length])

  useEffect(() => {
    if (!heroLive || content.hero.backgrounds.length < 2) return undefined
    const timer = window.setInterval(() => {
      setHeroBg((current) => (current + 1) % content.hero.backgrounds.length)
    }, HERO_BG_MS)
    return () => window.clearInterval(timer)
  }, [heroLive, content.hero.backgrounds.length])

  return (
    <div className="landing-page">
      <div className="landing-hero" ref={heroRef}>
        <div className="landing-hero__media" aria-hidden>
          {content.hero.backgrounds.map((src, index) => (
            <div
              key={`${src}-${index}`}
              className={`landing-hero__bg${heroBg === index ? ' is-active' : ''}`}
              style={{ backgroundImage: `url(${src})` }}
            />
          ))}
        </div>
        <div className="landing-hero__layout">
          <div className="landing-hero__content">
            <h1 className="landing-hero__title">{content.hero.title}</h1>
            <p className="landing-hero__subtitle">{content.hero.subtitle}</p>
            <a
              className="landing-hero__cta"
              href="#vision"
              onClick={(event) => handleLandingHashClick(event, '#vision')}
            >
              {content.hero.cta}
            </a>
          </div>
        </div>
      </div>

      <LandingHeader onLoginClick={(audience) => {
        setAuthError('')
        setLoginAudience(audience)
        setLoginOpen(true)
      }} />

      <main className="landing-main">
        <LandingStats />
        <section className="landing-split-block-container">
          <section className="landing-split-block" aria-label="Visión y misión">
            <div className="landing-split" id="vision">
              <div className="landing-split__media">
                <img src={content.split.vision.image} alt={content.split.vision.alt} />
              </div>
              <div className="landing-split__copy">
                <p className="landing-split__eyebrow">{content.split.vision.eyebrow}</p>
                <h2 className="landing-split__title">{content.split.vision.title}</h2>
                <p className="landing-split__text">{content.split.vision.text}</p>
              </div>
            </div>
            <div className="landing-split landing-split--reverse" id="mission">
              <div className="landing-split__media">
                <img src={content.split.mission.image} alt={content.split.mission.alt} />
              </div>
              <div className="landing-split__copy">
                <p className="landing-split__eyebrow">{content.split.mission.eyebrow}</p>
                <h2 className="landing-split__title">{content.split.mission.title}</h2>
                <p className="landing-split__text">{content.split.mission.text}</p>
              </div>
            </div>
          </section>
        </section>
        <section
          ref={catalogRef}
          className="catalog-productos-container"
          id="catalogo"
          aria-label="Catálogo de productos"
        >
          <section className="catalog-productos">
            <h2 className="catalog-productos__title">
               <span>{content.catalog.title}</span>
            </h2>
            <span className="landing-careers-bar__rule2" aria-hidden />
            <div className="catalog-productos__grid">
              {catalogOptions.map((option, index) => (
                <Link
                  key={option.id}
                  to={getLandingDetailPath(option.id)}
                  className="catalog-productos__item-link"
                  aria-label={`Ver detalle de ${option.label}`}
                >
                  <CatalogProductCard
                    label={option.label}
                    images={option.images}
                    autoPlay={index === catalogActiveOptionIndex}
                    advanceToken={catalogCarouselTurn}
                  />
                </Link>
              ))}
            </div>
            <a
              className="catalog-productos__cta"
              href="#marcas"
              onClick={(event) => handleLandingHashClick(event, '#marcas')}
            >
              {content.catalog.cta}
            </a>
          </section>
        </section>
        <section
          ref={brandsRef}
          className={`our-brands${brandsLive ? ' is-live' : ''}`}
          id="marcas"
          aria-label="Nuestras marcas"
          style={{ backgroundImage: `url(${content.brands.background})` }}
        >
          <h2 className="our-brands__title">{content.brands.title}</h2>
          <p className="our-brands__lead">{content.brands.lead}</p>
          <div className="our-brands__marquee">
            <BrandMarqueeRow logos={visibleBrands(content)} />
          </div>
        </section>
        <section
          className="our-employes__header-container"
          id="equipo"
          aria-label="Nuestro equipo"
        >
          <section className="our-employes__header">
            <h2 className="our-employes__title">Equipo Premium</h2>
            <span className="landing-careers-bar__rule" aria-hidden />
            <p className="our-employes__lead">
              Conoce nuestro equipo de trabajo. Estamos disponibles para conocerte y resolver tus dudas.
            </p>
          </section>
        </section>
        <AdvisorCarousel />
        <section
          className="our-company-container"
          id="nosotros"
          aria-label="Nosotros como empresa"
        >
          <section className="our-company">
            <div className="our-company__media">
              <img src={content.company.image} alt={content.company.alt} />
            </div>
            <div className="our-company__copy">
              <p className="our-company__eyebrow">{content.company.eyebrow}</p>
              <h2 className="our-company__title">{content.company.title}</h2>
              <p className="our-company__text">{content.company.text}</p>
              <a className="our-company__cta" href="#catalogo">
                {content.company.cta}
              </a>
            </div>
          </section>
          <LandingCareersBar />
        </section>
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
