import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import ipLogo from '@/assets/logos/icon.ico'
import { useAuth } from '@/app/providers/AuthProvider'
import { AuthModal } from '@/features/auth/components/AuthModal/AuthModal'
import { notifyError, notifySuccess } from '@/shared/lib/notify'
import {
  CATALOG_CAROUSEL_MS,
  CATALOG_MULTI_INDICES,
  CATALOG_OPTIONS,
  HERO_BG_MS,
  MARCA_ENTRIES,
  QUAD_LINKS,
} from './content'
import { getLandingDetailPath } from './landingDetailPages'
import { handleLandingHashClick } from './landingScroll'
import { LANDING_IMAGES } from './media'
import { AdvisorCarousel } from './components/AdvisorCarousel'
import { LandingCareersBar } from './components/LandingCareersBar'
import { LandingHeader } from './components/LandingHeader'
import { LandingStats } from './components/LandingStats'
import { LandingFooter, LandingLocationMap } from './components/LandingFooter'
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
  const [authError, setAuthError] = useState('')
  const [heroBg, setHeroBg] = useState(0)
  const [catalogCarouselTurn, setCatalogCarouselTurn] = useState(0)
  const catalogMultiCount = CATALOG_MULTI_INDICES.length
  const catalogActiveOptionIndex = catalogMultiCount === 0 || catalogCarouselTurn === 0
    ? -1
    : CATALOG_MULTI_INDICES[(catalogCarouselTurn - 1) % catalogMultiCount]

  useEffect(() => {
    if (CATALOG_MULTI_INDICES.length === 0) return undefined
    const timer = window.setInterval(() => {
      setCatalogCarouselTurn((current) => current + 1)
    }, CATALOG_CAROUSEL_MS)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (LANDING_IMAGES.heroBg.length < 2) return undefined
    const timer = window.setInterval(() => {
      setHeroBg((current) => (current + 1) % LANDING_IMAGES.heroBg.length)
    }, HERO_BG_MS)
    return () => window.clearInterval(timer)
  }, [])

  return (
    <div className="landing-page">
      <div className="landing-hero">
        <div className="landing-hero__media" aria-hidden>
          {LANDING_IMAGES.heroBg.map((src, index) => (
            <div
              key={src}
              className={`landing-hero__bg${heroBg === index ? ' is-active' : ''}`}
              style={{ backgroundImage: `url(${src})` }}
            />
          ))}
        </div>
        <div className="landing-hero__layout">
          <div className="landing-hero__content">
            <h1 className="landing-hero__title">Importadora Premium</h1>
            <p className="landing-hero__subtitle">
              Importación, inventario y distribución con estándar premium para todo el país.
            </p>
            <a
              className="landing-hero__cta"
              href="#vision"
              onClick={(event) => handleLandingHashClick(event, '#vision')}
            >
              Conocer más
            </a>
          </div>
        </div>
      </div>

      <LandingHeader onLoginClick={() => {
        setAuthError('')
        setLoginOpen(true)
      }} />

      <main className="landing-main">
        <LandingStats />
        <div className="landing-split-block">
          <section className="landing-split" id="vision">
            <div className="landing-split__media">
              <img src={LANDING_IMAGES.nosotros} alt="Equipo y operación de Importadora Premium" />
            </div>
            <div className="landing-split__copy">
              <p className="landing-split__eyebrow">Empresa</p>
              <h2 className="landing-split__title">Visión</h2>
              <p className="landing-split__text">
                Ser el referente nacional en importación premium: bodega confiable,
                surtido amplio y un servicio ágil para cada cliente del país.
              </p>
            </div>
          </section>

          <section className="landing-split landing-split--reverse" id="mission">
            <div className="landing-split__media">
              <img src={LANDING_IMAGES.mission} alt="Local y servicio Importadora Premium" />
            </div>
            <div className="landing-split__copy">
              <p className="landing-split__eyebrow">Empresa</p>
              <h2 className="landing-split__title">Misión</h2>
              <p className="landing-split__text">
                Conectar demanda y suministro con procesos claros, inventario real
                y acompañamiento cercano en cada pedido bajo la marca IP.
              </p>
            </div>
          </section>
        </div>
        <section
          className="catalog-productos"
          id="catalogo"
          aria-label="Catálogo de productos"
        >
          <h2 className="catalog-productos__title">
             <span>Productos Premium</span>
            <img
              className="catalog-productos__title-logo"
              src={ipLogo}
              alt=""
              width={48}
              height={48}
            />
          </h2>
          <div className="catalog-productos__grid">
            {CATALOG_OPTIONS.map((option, index) => (
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
            Catálogo completo
          </a>
        </section>
        <section
          className="our-brands"
          id="marcas"
          aria-label="Nuestras marcas"
          style={{ backgroundImage: `url(${LANDING_IMAGES.brandsBg})` }}
        >
          <h2 className="our-brands__title">Marcas que respaldan nuestra calidad</h2>
          <p className="our-brands__lead">
            Las marcas más reconocidas en el mercado para tu moto.
          </p>
          <div className="our-brands__marquee">
            <BrandMarqueeRow logos={MARCA_ENTRIES} />
          </div>
        </section>
        <section className="landing-quad" aria-label="Accesos rápidos">
          {QUAD_LINKS.map((link) => {
            if (link.kind === 'anchor') {
              return (
                <a
                  key={link.href}
                  href={link.href}
                  className="landing-quad__item"
                  onClick={(event) => handleLandingHashClick(event, link.href)}
                >
                  <span className="landing-quad__label">{link.label}</span>
                </a>
              )
            }
            return (
              <Link
                key={link.slug}
                to={getLandingDetailPath(link.slug)}
                className="landing-quad__item"
              >
                <span className="landing-quad__label">{link.label}</span>
              </Link>
            )
          })}
        </section>
        <section className="our-employes" id="equipo" aria-label="Nuestro equipo">
          <header className="our-employes__header">
            <p className="our-employes__eyebrow">ASESORES</p>
            <h2 className="our-employes__title">Nuestro equipo</h2>
            <p className="our-employes__lead">
              Conoce y contacta a nuestros asesores, estan a tu disposición para resolver tus dudas y necesidades.
            </p>
          </header>
          <AdvisorCarousel />
        </section>


        <section className="our-company" id="nosotros" aria-label="Nosotros como empresa">
          <div className="our-company__media">
            <img src={LANDING_IMAGES.vision} alt="Operación de Importadora Premium" />
          </div>
          <div className="our-company__copy">
            <p className="our-company__eyebrow">La compañía</p>
            <h2 className="our-company__title">Nosotros como empresa</h2>
            <p className="our-company__text">
              Importadora Premium conecta marcas globales con el mercado local.
              Centralizamos compra, bodega y distribución para que tu negocio
              reciba productos verificados, trazabilidad y un servicio comercial cercano.
            </p>
            <a className="our-company__cta" href="#catalogo">
              Catálogo completo
            </a>
          </div>
        </section>
      </main>

      <LandingCareersBar />
      <LandingLocationMap />
      <LandingFooter />

      <AuthModal
        isOpen={loginOpen}
        onClose={() => setLoginOpen(false)}
        authError={authError}
        onLogin={(form) => {
          setAuthError('')
          const result = login(form.email, form.password)
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
