const DETAIL_HIGHLIGHTS = [
  'Inventario verificado y trazable',
  'Marcas reconocidas en el mercado',
  'Asesoría comercial especializada',
  'Distribución ágil a nivel nacional',
  'Precios competitivos y accesibles',
  'Soporte técnico y post-venta',
  'Garantía de calidad y satisfacción',
  'Envíos rápidos y seguros',
  'Atención al cliente 24/7',
] as const

const MARQUEE_ITEMS = [...DETAIL_HIGHLIGHTS, ...DETAIL_HIGHLIGHTS]

export function DetailHighlights() {
  return (
    <div className="landing-detail__highlights" aria-label="Beneficios Importadora Premium">
      <ul className="landing-detail__highlights-track">
        {MARQUEE_ITEMS.map((item, index) => (
          <li key={`${item}-${index}`} className="landing-detail__highlight">
            <span className="landing-detail__highlight-text">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
