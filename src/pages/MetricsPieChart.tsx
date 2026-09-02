import { mockMetrics } from '@/mocks/data'

/** Pastel simple sin librería externa (maqueta). */
export function MetricsPieChart() {
  const products = mockMetrics.top_products
  const total = products.reduce((sum, item) => sum + item.sold, 0) || 1
  const palette = ['#1a1a1a', '#757575', '#a0a0a0', '#c8c8c8', '#e5e5e5']

  let cumulative = 0
  const segments = products.map((product, index) => {
    const start = cumulative / total
    cumulative += product.sold
    const end = cumulative / total
    return {
      ...product,
      color: palette[index % palette.length],
      start,
      end,
    }
  })

  const gradient = segments
    .map((segment) => `${segment.color} ${segment.start * 100}% ${segment.end * 100}%`)
    .join(', ')

  return (
    <div className="admin-card">
      <strong>Distribución de ventas</strong>
      <div className="admin-pie">
        <div
          className="admin-pie__chart"
          style={{ background: `conic-gradient(${gradient})` }}
          role="img"
          aria-label="Gráfico de pastel de ventas por producto"
        />
        <ul className="admin-pie__legend">
          {segments.map((segment) => (
            <li key={segment.productId}>
              <span className="admin-pie__swatch" style={{ background: segment.color }} />
              {segment.name}: {segment.sold}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
