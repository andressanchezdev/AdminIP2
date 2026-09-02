import { usePermissions } from '@/app/providers/AuthProvider'
import { DashboardPage } from '@/pages/DashboardPage'

/** Gestión de medición unificada: tablas, pastel y mediciones visuales. */
export function MetricsPage() {
  const { hasPermission } = usePermissions()
  if (!hasPermission('metrics:read')) {
    return <div className="admin-empty">Sin permiso metrics:read</div>
  }

  return <DashboardPage />
}
