import Swal from 'sweetalert2'

const toastBase = Swal.mixin({
  toast: true,
  position: 'top',
  showConfirmButton: false,
  timerProgressBar: true,
  customClass: {
    container: 'admin-toast-container',
    popup: 'admin-toast',
  },
})

export function notifySuccess(title: string, text?: string) {
  return toastBase.fire({
    icon: 'success',
    title,
    text,
    timer: 2200,
  })
}

export function notifyError(title: string, text?: string) {
  return toastBase.fire({
    icon: 'error',
    title,
    text,
    timer: 2800,
  })
}

export function notifyInfo(title: string, text?: string) {
  return toastBase.fire({
    icon: 'info',
    title,
    text,
    timer: 2200,
  })
}

/** Toast breve (p. ej. motivo de edición bloqueada). */
export function notifyBrief(title: string, text?: string, ms = 800) {
  return toastBase.fire({
    icon: 'warning',
    title,
    text,
    timer: ms,
  })
}

export async function confirmAction(options: {
  title: string
  text?: string
  confirmText?: string
  cancelText?: string
}) {
  const result = await Swal.fire({
    icon: 'question',
    title: options.title,
    text: options.text,
    showCancelButton: true,
    confirmButtonText: options.confirmText ?? 'Confirmar',
    cancelButtonText: options.cancelText ?? 'Cancelar',
    reverseButtons: true,
  })
  return result.isConfirmed
}
