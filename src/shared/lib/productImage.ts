/** Utilidades de imagen para productos (validación + conversión a WebP). */

const IMAGE_MIME_RE = /^image\//i
const IMAGE_EXT_RE = /\.(jpe?g|png|gif|webp|bmp|svg|avif|heic|heif|tiff?|ico|jfif)$/i

export function isImageFile(file: File) {
  if (file.type && IMAGE_MIME_RE.test(file.type)) return true
  return IMAGE_EXT_RE.test(file.name)
}

export function isValidImageSource(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return false
  if (trimmed.startsWith('data:image/')) return true
  if (trimmed.startsWith('/')) return true
  try {
    const url = new URL(trimmed)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

/**
 * Lee un archivo de imagen y lo convierte a data URL WebP.
 * Si el navegador no soporta WebP en canvas, usa PNG como respaldo seguro.
 */
export function fileToWebpDataUrl(file: File, quality = 0.86): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!isImageFile(file)) {
      reject(new Error('El archivo no es una imagen válida'))
      return
    }

    const objectUrl = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = image.naturalWidth || image.width
        canvas.height = image.naturalHeight || image.height
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          URL.revokeObjectURL(objectUrl)
          reject(new Error('No se pudo procesar la imagen'))
          return
        }
        ctx.drawImage(image, 0, 0)
        let dataUrl = ''
        try {
          dataUrl = canvas.toDataURL('image/webp', quality)
          if (!dataUrl.startsWith('data:image/webp')) {
            dataUrl = canvas.toDataURL('image/png')
          }
        } catch {
          dataUrl = canvas.toDataURL('image/png')
        }
        URL.revokeObjectURL(objectUrl)
        resolve(dataUrl)
      } catch (error) {
        URL.revokeObjectURL(objectUrl)
        reject(error instanceof Error ? error : new Error('Error al convertir la imagen'))
      }
    }
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('No se pudo leer la imagen. Verifique el formato del archivo'))
    }
    image.src = objectUrl
  })
}
