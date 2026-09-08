import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/app/providers/AuthProvider'
import { ProtectedRoute } from '@/app/providers/ProtectedRoute'
import { AdminShell } from '@/widgets/AppShell/AdminShell'

const LandingPage = lazy(async () => {
  const mod = await import('@/features/landing/LandingPage')
  return { default: mod.LandingPage }
})

const LandingDetailPage = lazy(async () => {
  const mod = await import('@/features/landing/LandingDetailPage')
  return { default: mod.LandingDetailPage }
})

const MetricsPage = lazy(async () => {
  const mod = await import('@/pages/MetricsPage')
  return { default: mod.MetricsPage }
})

const BlogAdminPage = lazy(async () => {
  const mod = await import('@/features/blog/BlogAdminPage')
  return { default: mod.BlogAdminPage }
})

const VacanciesAdminPage = lazy(async () => {
  const mod = await import('@/features/vacancies/VacanciesAdminPage')
  return { default: mod.VacanciesAdminPage }
})

const BotIpAdminPage = lazy(async () => {
  const mod = await import('@/features/landing/BotIpAdminPage')
  return { default: mod.BotIpAdminPage }
})

const LandingAdminPage = lazy(async () => {
  const mod = await import('@/features/landing/LandingAdminPage')
  return { default: mod.LandingAdminPage }
})

const BlogPublicPage = lazy(async () => {
  const mod = await import('@/features/blog/BlogPublicPage')
  return { default: mod.BlogPublicPage }
})

const BlogPostPage = lazy(async () => {
  const mod = await import('@/features/blog/BlogPostPage')
  return { default: mod.BlogPostPage }
})

const UsersPage = lazy(async () => {
  const mod = await import('@/features/users/UsersPage')
  return { default: mod.UsersPage }
})

const CategoriesPage = lazy(async () => {
  const mod = await import('@/features/categories/CategoriesPage')
  return { default: mod.CategoriesPage }
})

const RolesPage = lazy(async () => {
  const mod = await import('@/pages/AccessOpsPages')
  return { default: mod.RolesPage }
})

const AuditPage = lazy(async () => {
  const mod = await import('@/features/audit/AuditPage')
  return { default: mod.AuditPage }
})

const ProfilePage = lazy(async () => {
  const mod = await import('@/pages/AccessOpsPages')
  return { default: mod.ProfilePage }
})

const OrdersPage = lazy(async () => {
  const mod = await import('@/features/orders/OrdersPage')
  return { default: mod.OrdersPage }
})

const ClientsPage = lazy(async () => {
  const mod = await import('@/features/clients/ClientsPage')
  return { default: mod.ClientsPage }
})

const ShipmentsPage = lazy(async () => {
  const mod = await import('@/features/shipments/ShipmentsPage')
  return { default: mod.ShipmentsPage }
})

const ProductsPage = lazy(async () => {
  const mod = await import('@/features/products/ProductsPage')
  return { default: mod.ProductsPage }
})

const ForbiddenPage = lazy(async () => {
  const mod = await import('@/pages/AccessOpsPages')
  return { default: mod.ForbiddenPage }
})

const LoginPage = lazy(async () => {
  const mod = await import('@/pages/AccessOpsPages')
  return { default: mod.LoginPage }
})

function PageFallback() {
  return <div className="admin-empty">Cargando…</div>
}

function StaffHomeRedirect() {
  const { staffHome } = useAuth()
  return <Navigate to={staffHome} replace />
}

function withGuard(routeKey: string, element: React.ReactNode) {
  return (
    <ProtectedRoute routeKey={routeKey}>
      <Suspense fallback={<PageFallback />}>{element}</Suspense>
    </ProtectedRoute>
  )
}

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* —— Sitio público (sin ProtectedRoute): landing + blog —— */}
          <Route
            path="/"
            element={(
              <Suspense fallback={<PageFallback />}>
                <LandingPage />
              </Suspense>
            )}
          />
          <Route
            path="/explorar/:slug"
            element={(
              <Suspense fallback={<PageFallback />}>
                <LandingDetailPage />
              </Suspense>
            )}
          />
          <Route
            path="/blog"
            element={(
              <Suspense fallback={<PageFallback />}>
                <BlogPublicPage />
              </Suspense>
            )}
          />
          <Route
            path="/blog/:slug"
            element={(
              <Suspense fallback={<PageFallback />}>
                <BlogPostPage />
              </Suspense>
            )}
          />
          <Route
            path="/login"
            element={(
              <Suspense fallback={<PageFallback />}>
                <LoginPage />
              </Suspense>
            )}
          />

          {/* —— Panel admin: shell + rutas con permiso (Gestión Blog = blog:read) —— */}
          <Route
            element={(
              <ProtectedRoute routeKey="">
                <AdminShell />
              </ProtectedRoute>
            )}
          >
            <Route path="/app" element={<StaffHomeRedirect />} />

            <Route path="/dashboard/medicion" element={withGuard('dashboard/medicion', <MetricsPage />)} />
            <Route path="/contenido/blog" element={withGuard('contenido/blog', <BlogAdminPage />)} />
            <Route path="/contenido/vacantes" element={withGuard('contenido/vacantes', <VacanciesAdminPage />)} />
            <Route path="/contenido/landing/:section?" element={withGuard('contenido/landing', <LandingAdminPage />)} />
            <Route path="/contenido/bot" element={withGuard('contenido/bot', <BotIpAdminPage />)} />
            <Route path="/dashboard/blog" element={<Navigate to="/contenido/blog" replace />} />
            <Route path="/acceso/usuarios" element={withGuard('acceso/usuarios', <UsersPage />)} />
            <Route path="/acceso/roles" element={withGuard('acceso/roles', <RolesPage />)} />
            <Route path="/acceso/auditoria" element={withGuard('acceso/auditoria', <AuditPage />)} />
            <Route path="/operacion/pedidos" element={withGuard('operacion/pedidos', <OrdersPage />)} />
            <Route path="/operacion/clientes" element={withGuard('operacion/clientes', <ClientsPage />)} />
            <Route path="/operacion/envios" element={withGuard('operacion/envios', <ShipmentsPage />)} />
            <Route path="/operacion/productos" element={withGuard('operacion/productos', <ProductsPage />)} />
            <Route path="/operacion/categorias" element={withGuard('operacion/categorias', <CategoriesPage />)} />
            <Route path="/configuracion/perfil" element={withGuard('configuracion/perfil', <ProfilePage />)} />
            <Route path="/configuracion/ajustes" element={<Navigate to="/configuracion/perfil" replace />} />

            <Route path="/metrics" element={<Navigate to="/dashboard/medicion" replace />} />
            <Route path="/metrics/tangible" element={<Navigate to="/dashboard/medicion" replace />} />
            <Route path="/access/roles" element={<Navigate to="/acceso/roles" replace />} />
            <Route path="/access/permissions" element={<Navigate to="/acceso/roles" replace />} />
            <Route path="/access/audit" element={<Navigate to="/acceso/auditoria" replace />} />
            <Route path="/access/users" element={<Navigate to="/acceso/usuarios" replace />} />
            <Route path="/access/profile" element={<Navigate to="/configuracion/perfil" replace />} />
            <Route path="/ops/orders" element={<Navigate to="/operacion/pedidos" replace />} />
            <Route path="/ops/clients" element={<Navigate to="/operacion/clientes" replace />} />
            <Route path="/ops/shipments" element={<Navigate to="/operacion/envios" replace />} />
            <Route path="/ops/products" element={<Navigate to="/operacion/productos" replace />} />
            <Route path="/ops/categories" element={<Navigate to="/operacion/categorias" replace />} />
            <Route path="/settings" element={<Navigate to="/configuracion/perfil" replace />} />

            <Route
              path="/403"
              element={(
                <Suspense fallback={<PageFallback />}>
                  <ForbiddenPage />
                </Suspense>
              )}
            />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
