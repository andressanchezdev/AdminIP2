/** Deriva la clave de permiso de ruta desde el pathname (estilo grandma_liquors). */
export function toRouteKey(pathname: string): string {
  return String(pathname ?? '').replace(/^\//, '').replace(/\/$/, '')
}

export function toPathFromRouteKey(routeKey: string): string {
  const key = String(routeKey ?? '').replace(/^\//, '')
  return key ? `/${key}` : '/'
}
