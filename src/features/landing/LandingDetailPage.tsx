import { useEffect, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { getPublishedVacancies, type VacancyRecord } from '@/mocks/data'
import { CATALOG_PRODUCTS, catalogHeroImageFitVars, catalogImageFitVars, resolveInitialCatalogIndex } from './catalogProducts'
import { DetailHighlights } from './components/DetailHighlights'
import { LandingFooter, LandingLocationMap } from './components/LandingFooter'
import { resolveLandingDetailPage, type LandingDetailPage } from './landingDetailPages'
import './LandingPage.css'

function CatalogDetailBody({ page }: { page: LandingDetailPage }) {
  const [activeProductIndex, setActiveProductIndex] = useState(() =>
    resolveInitialCatalogIndex(page.slug, page.images),
  )

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [page.slug, activeProductIndex])

  const activeProduct = CATALOG_PRODUCTS[activeProductIndex]
  const productCount = CATALOG_PRODUCTS.length

  const showProduct = (index: number) => {
    setActiveProductIndex(((index % productCount) + productCount) % productCount)
  }

  return (
    <>
      <section className="landing-detail__hero" aria-labelledby="landing-detail-title">
        <div className="landing-detail__hero-media" style={catalogHeroImageFitVars(activeProduct)}>
          <button
            type="button"
            className="landing-detail__hero-nav landing-detail__hero-nav--prev"
            aria-label="Producto anterior"
            onClick={() => showProduct(activeProductIndex - 1)}
          >
            <ChevronLeft size={24} strokeWidth={2} aria-hidden />
          </button>
          <img src={activeProduct.src} alt={activeProduct.label} />
          <button
            type="button"
            className="landing-detail__hero-nav landing-detail__hero-nav--next"
            aria-label="Producto siguiente"
            onClick={() => showProduct(activeProductIndex + 1)}
          >
            <ChevronRight size={24} strokeWidth={2} aria-hidden />
          </button>
        </div>
        <div className="landing-detail__hero-copy">
          <p className="landing-detail__eyebrow">{page.eyebrow}</p>
          <h1 className="landing-detail__title" id="landing-detail-title">{page.title}</h1>
          <p className="landing-detail__lead">{page.lead}</p>
          <p className="landing-detail__product-name">{activeProduct.label}</p>
          <p className="landing-detail__product-desc">{activeProduct.description}</p>
        </div>
      </section>

      <section className="landing-detail__content" aria-label="Beneficios Importadora Premium">
        <aside className="landing-detail__aside">
          <DetailHighlights />
        </aside>
      </section>

      <section className="landing-detail__gallery-wrap" aria-label="Catálogo de productos">
        <h2 className="landing-detail__section-title landing-detail__section-title--center">
          Demás productos
        </h2>
        <div className="landing-detail__gallery" role="list">
          {CATALOG_PRODUCTS.map((product, index) => (
            <button
              key={product.id}
              type="button"
              role="listitem"
              className={`landing-detail__gallery-item${index === activeProductIndex ? ' is-active' : ''}`}
              aria-label={`Ver ${product.label}. ${product.description}`}
              aria-pressed={index === activeProductIndex}
              onClick={() => showProduct(index)}
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
            ¿Listo para cotizar o recibir asesoría sobre {activeProduct.label.toLowerCase()}?
          </p>
          <a className="landing-hero__cta landing-detail__cta-btn" href={page.ctaHref}>
            {page.ctaLabel}
          </a>
        </div>
      </section>
    </>
  )
}

function VacanciesDetailBody({ page }: { page: LandingDetailPage }) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const vacancies = getPublishedVacancies()
  const active: VacancyRecord | null =
    vacancies.find((item) => item.id === activeId) ?? vacancies[0] ?? null

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [page.slug, active?.id])

  const heroSrc = page.images[0]

  return (
    <>
      <section className="landing-detail__hero" aria-labelledby="landing-detail-title">
        <div className="landing-detail__hero-media">
          <img src={heroSrc} alt="" />
        </div>
        <div className="landing-detail__hero-copy">
          <p className="landing-detail__eyebrow">{page.eyebrow}</p>
          <h1 className="landing-detail__title" id="landing-detail-title">{page.title}</h1>
          <p className="landing-detail__lead">{page.lead}</p>
          {active ? (
            <>
              <p className="landing-detail__product-name">{active.title}</p>
              <p className="landing-detail__product-desc">{active.description}</p>
              <p className="landing-detail__product-desc">
                {active.location} · {active.employmentType}
              </p>
            </>
          ) : (
            <p className="landing-detail__product-desc">
              Por ahora no hay vacantes publicadas. Vuelve pronto o escríbenos para conocer oportunidades.
            </p>
          )}
        </div>
      </section>

      <section className="landing-detail__gallery-wrap" aria-label="Vacantes abiertas">
        <h2 className="landing-detail__section-title landing-detail__section-title--center">
          Vacantes abiertas
        </h2>
        {vacancies.length === 0 ? (
          <p className="landing-detail__lead" style={{ textAlign: 'center' }}>
            No hay vacantes publicadas en este momento.
          </p>
        ) : (
          <div className="landing-detail__gallery landing-detail__gallery--vacancies" role="list">
            {vacancies.map((vacancy) => (
              <button
                key={vacancy.id}
                type="button"
                role="listitem"
                className={`landing-detail__gallery-item${active?.id === vacancy.id ? ' is-active' : ''}`}
                aria-label={`Ver ${vacancy.title}`}
                aria-pressed={active?.id === vacancy.id}
                onClick={() => setActiveId(vacancy.id)}
              >
                <div className="landing-detail__gallery-body">
                  <span className="landing-detail__gallery-name">{vacancy.title}</span>
                  <span className="landing-detail__vacancy-meta">
                    {vacancy.location} · {vacancy.employmentType}
                  </span>
                  <span className="landing-detail__vacancy-summary">{vacancy.summary}</span>
                </div>
              </button>
            ))}
          </div>
        )}
        {active ? (
          <div className="landing-detail__vacancy-requirements">
            <h3>Requisitos</h3>
            <p>{active.requirements}</p>
          </div>
        ) : null}
      </section>

      <section className="landing-detail__cta-bar" aria-label="Postulación">
        <div className="landing-detail__cta-inner">
          <p className="landing-detail__cta-text">
            {active
              ? `¿Te interesa el rol de ${active.title}? Envíanos tu postulación.`
              : '¿Quieres unirte al equipo? Escríbenos y cuéntanos tu perfil.'}
          </p>
          <a className="landing-hero__cta landing-detail__cta-btn" href={page.ctaHref}>
            {page.ctaLabel}
          </a>
        </div>
      </section>
    </>
  )
}

export function LandingDetailPage() {
  const { slug } = useParams()
  const page = resolveLandingDetailPage(slug)

  if (!page) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="landing-page landing-page--detail">
      <main className="landing-main landing-detail">
        {page.kind === 'vacancies' ? (
          <VacanciesDetailBody page={page} />
        ) : (
          <CatalogDetailBody page={page} />
        )}
      </main>
      <LandingLocationMap />
      <LandingFooter />
    </div>
  )
}
