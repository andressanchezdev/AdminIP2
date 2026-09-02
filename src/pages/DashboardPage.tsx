import { useMemo, useState } from 'react'
import { mockMetrics, mockOrders, mockProducts, WAREHOUSES } from '@/mocks/data'
import { usePermissions } from '@/app/providers/AuthProvider'
import { MetricsCharts } from '@/pages/MetricsCharts'
import { MetricsPieChart } from '@/pages/MetricsPieChart'
import { formatCOP } from '@/shared/lib/formatMoney'
import { AdminRowCard, ResponsiveTableShell } from '@/shared/ui/ResponsiveTable/ResponsiveTable'
import { MultiSelectFilter } from '@/shared/ui/MultiSelectFilter/MultiSelectFilter'
import { PageHeaderActions } from '@/widgets/AppShell/Header/PageHeaderActions'

type DashboardMetricRow = {
  id: string
  label: string
  value: string | number
}

export function DashboardPage() {
  const { hasPermission } = usePermissions()
  const canViewMetrics = hasPermission('metrics:read')
  const [selectedBodegas, setSelectedBodegas] = useState<string[]>([...WAREHOUSES])

  const warehouseOptions = useMemo(
    () => WAREHOUSES.map((bodega) => ({
      value: bodega,
      label: bodega,
      hint: String(mockProducts.filter((product) => product.bodega === bodega).length),
    })),
    [mockProducts.length],
  )

  const warehouseFilter = canViewMetrics ? (
    <MultiSelectFilter
      className="admin-header__warehouse-filter"
      label="" //MANTENER LABEL EN BLANCO
      options={warehouseOptions}
      value={selectedBodegas}
      onChange={setSelectedBodegas}
      allValues={[...WAREHOUSES]}
      allLabel="Todas"
      noneLabel="Ninguna"
      emptyLabel="Ninguna"
    />
  ) : null

  const activeBodegas = selectedBodegas
  const filteredProducts = useMemo(
    () => mockProducts.filter((product) => activeBodegas.includes(product.bodega)),
    [activeBodegas.join('|'), mockProducts.length],
  )

  if (!canViewMetrics) {
    return (
      <section className="admin-page">
        <div className="admin-card admin-empty">
          No tiene permiso para ver el dashboard. Solicite acceso a medición.
        </div>
      </section>
    )
  }

  const totalInventory = mockProducts.reduce((sum, product) => sum + product.cantidad, 0) || 1
  const filteredInventory = filteredProducts.reduce((sum, product) => sum + product.cantidad, 0)
  const ratio = selectedBodegas.length === 0 ? 0 : filteredInventory / totalInventory

  const ventasHoyBase = mockMetrics.sales_over_time.at(-1)?.total ?? 0
  const ventasHoy = Math.round(ventasHoyBase * ratio)
  const pedidosApprox = selectedBodegas.length === 0
    ? 0
    : Math.max(1, Math.round(mockOrders.length * ratio))

  const topProducts = mockMetrics.top_products
    .map((entry) => {
      const product = mockProducts.find((item) => item.id === entry.productId)
      if (!product || !activeBodegas.includes(product.bodega)) return null
      return {
        ...entry,
        name: product.nombre,
        sold: Math.max(1, Math.round(entry.sold * Math.max(ratio, 0.01))),
      }
    })
    .filter(Boolean) as Array<{ productId: string; name: string; sold: number }>

  const salesSeries = mockMetrics.sales_over_time.map((entry) => ({
    ...entry,
    total: Math.round(entry.total * ratio),
  }))

  const resumenRows: DashboardMetricRow[] = [
    { id: 'pedidos', label: 'Pedidos', value: pedidosApprox },
    { id: 'productos', label: 'Productos', value: filteredProducts.length },
    { id: 'inventario', label: 'Inventario', value: filteredInventory },
    { id: 'ventas', label: 'Ventas', value: formatCOP(ventasHoy) },
  ]

  const renderMetricCards = (rows: DashboardMetricRow[]) => rows.map((row) => (
    <AdminRowCard
      key={row.id}
      title={row.label}
      fields={[{ label: 'Valor', value: row.value, primary: true }]}
    />
  ))

  return (
    <section className="admin-page">
      <PageHeaderActions>{warehouseFilter}</PageHeaderActions>

      <div className="admin-metrics-grid">
        <div className="admin-card">
          <strong>Resumen</strong>
          <ResponsiveTableShell cards={renderMetricCards(resumenRows)}>
            <table className="admin-table" style={{ marginTop: 12 }}>
              <thead>
                <tr>
                  <th data-priority="1">Indicador</th>
                  <th data-priority="2">Valor</th>
                </tr>
              </thead>
              <tbody>
                {resumenRows.map((row) => (
                  <tr key={row.id}>
                    <td data-priority="1">{row.label}</td>
                    <td data-priority="2">{row.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ResponsiveTableShell>
        </div>

        <MetricsPieChart />
      </div>

      <div className="admin-card">
        <strong>Top productos</strong>
        <ResponsiveTableShell
          empty={topProducts.length === 0}
          emptyMessage="Sin productos"
          cards={topProducts.map((product) => (
            <AdminRowCard
              key={product.productId}
              title={product.name}
              fields={[{ label: 'Vendidos', value: product.sold, primary: true }]}
            />
          ))}
        >
          <table className="admin-table" style={{ marginTop: 12 }}>
            <thead>
              <tr>
                <th data-priority="1">Producto</th>
                <th data-priority="2">Vendidos</th>
              </tr>
            </thead>
            <tbody>
              {topProducts.map((product) => (
                <tr key={product.productId}>
                  <td data-priority="1">{product.name}</td>
                  <td data-priority="2">{product.sold}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </ResponsiveTableShell>
      </div>

      <MetricsCharts sales={salesSeries} />
    </section>
  )
}
