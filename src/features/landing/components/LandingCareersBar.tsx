import { Link } from 'react-router-dom'
import { getLandingDetailPath } from '../landingDetailPages'

const CAREERS_SLUG = 'vacantes'

/** Franja CTA a vacantes (vista secundaria `/explorar/vacantes`). */
export function LandingCareersBar() {
  return (
    <section className="landing-careers-bar" aria-label="Trabajar con nosotros">
      <header className="landing-careers-bar__header">
        <h2 className="landing-careers-bar__title">Trabaja con nosotros</h2>
        <span className="landing-careers-bar__rule" aria-hidden />
      </header>
      <p className="landing-careers-bar__text">
        Conoce nuestras vacantes abiertas y postúlate al equipo de Importadora Premium.
      </p>
      <Link to={getLandingDetailPath(CAREERS_SLUG)} className="landing-careers-bar__cta">
        Ver vacantes
      </Link>
    </section>
  )
}
