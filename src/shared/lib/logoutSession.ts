import type { NavigateFunction } from 'react-router-dom'
import { confirmAction, notifySuccess } from '@/shared/lib/notify'

/** Confirma, cierra sesión y redirige al landing público. */
export async function confirmAndLogout(
  logout: () => void,
  navigate: NavigateFunction,
) {
  const confirmed = await confirmAction({
    title: '¿Cerrar sesión?',
    text: 'Saldrá de su cuenta actual.',
    confirmText: 'Cerrar sesión',
    cancelText: 'Cancelar',
  })
  if (!confirmed) return

  logout()
  notifySuccess('Sesión cerrada')
  navigate('/', { replace: true })
}
