/** Convierte un archivo de imagen local a data-URL WebP. */
export async function fileToWebpDataUrl(file: File, quality = 0.85, maxEdge?: number): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('El archivo no es una imagen')
  }
  const bitmap = await createImageBitmap(file)
  let width = bitmap.width
  let height = bitmap.height
  if (maxEdge && maxEdge > 0 && (width > maxEdge || height > maxEdge)) {
    const scale = maxEdge / Math.max(width, height)
    width = Math.max(1, Math.round(width * scale))
    height = Math.max(1, Math.round(height * scale))
  }
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    bitmap.close()
    throw new Error('No se pudo procesar la imagen')
  }
  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()
  const dataUrl = canvas.toDataURL('image/webp', quality)
  if (!dataUrl.startsWith('data:image/webp')) {
    // Fallback si el navegador no exporta webp
    return canvas.toDataURL('image/png')
  }
  return dataUrl
}
