import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import ipLogo from '@/assets/logos/icon.ico'
import { LANDING_CONTACT } from '../content'

/** Mapa con marker del logo IP (colores originales del icono). */
export function LandingMap() {
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return undefined

    const { lat, lng, zoom, address, mapsShareUrl } = LANDING_CONTACT
    const map = L.map(el, {
      scrollWheelZoom: false,
      attributionControl: true,
    }).setView([lat, lng], zoom)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map)

    const markerIcon = L.divIcon({
      className: 'landing-map__marker',
      html: `
        <div class="landing-map__pin" aria-hidden="true">
          <span class="landing-map__pin-face">
            <img src="${ipLogo}" alt="" width="28" height="28" />
          </span>
        </div>
      `,
      iconSize: [48, 58],
      iconAnchor: [24, 56],
      popupAnchor: [0, -52],
    })

    L.marker([lat, lng], { icon: markerIcon })
      .addTo(map)
      .bindPopup(
        `<strong>Importadora Premium</strong><br/>${address}<br/><a href="${mapsShareUrl}" target="_blank" rel="noopener noreferrer">Abrir en Google Maps</a>`,
      )

    const syncSize = () => map.invalidateSize()
    const raf = window.requestAnimationFrame(syncSize)
    const timer = window.setTimeout(syncSize, 120)
    window.addEventListener('resize', syncSize)

    return () => {
      window.cancelAnimationFrame(raf)
      window.clearTimeout(timer)
      window.removeEventListener('resize', syncSize)
      map.remove()
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="landing-location__map"
      role="region"
      aria-label="Mapa de ubicación Importadora Premium"
    />
  )
}
