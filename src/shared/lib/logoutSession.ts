import type { NavigateFunction } from 'react-router-dom'
import { confirmAction } from '@/shared/lib/notify'

/** Marca un logout confirmado para no redirigir a /login desde ProtectedRoute. */
export const POST_LOGOUT_LANDING_KEY = 'adminip.postLogoutLanding'

export function consumePostLogoutLanding(): boolean {
  if (typeof sessionStorage === 'undefined') return false
  if (sessionStorage.getItem(POST_LOGOUT_LANDING_KEY) !== '1') return false
  sessionStorage.removeItem(POST_LOGOUT_LANDING_KEY)
  return true
}

/** Confirma, cierra sesión y carga el landing principal (`/`). */
export async function confirmAndLogout(
  logout: () => void,
  _navigate: NavigateFunction,
) {
  const confirmed = await confirmAction({
    title: '¿Cerrar sesión?',
    text: 'Saldrá de su cuenta actual.',
    confirmText: 'Cerrar sesión',
    cancelText: 'Cancelar',
  })
  if (!confirmed) return

  sessionStorage.setItem(POST_LOGOUT_LANDING_KEY, '1')
  sessionStorage.setItem('adminip.postLogoutToast', '1')
  logout()
  window.location.replace('/')
}
