import { formatCOP } from '@/shared/lib/formatMoney'

type SalesPoint = { date: string; total: number }

type MetricsChartsProps = {
  sales?: SalesPoint[]
}

/** Gráficos simples sin librería externa (maqueta). */
export function MetricsCharts({ sales }: MetricsChartsProps) {
  const series = sales?.length
    ? sales
    : []
  const max = Math.max(...series.map((entry) => entry.total), 1)

  return (
    <div className="admin-card">
      <strong>Ventas por día (COP)</strong>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 140, marginTop: 12 }}>
        {series.map((entry) => (
          <div key={entry.date} style={{ flex: 1, textAlign: 'center' }}>
            <div
              style={{
                background: 'var(--color-gris-oscuro)',
                height: `${Math.round((entry.total / max) * 100)}%`,
                minHeight: 4,
                borderRadius: 4,
              }}
              title={formatCOP(entry.total)}
            />
            <div style={{ fontSize: 10, marginTop: 4 }}>{entry.date.slice(5)}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
