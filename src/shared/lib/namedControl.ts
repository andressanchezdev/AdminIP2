/**
 * Nombre accesible de un control: aria-label + title.
 */
export function namedControl(label: string | undefined | null) {
  const name = String(label ?? '').trim()
  if (!name) {
    return {}
  }
  return {
    'aria-label': name,
    title: name,
  }
}

export function namedImage(label: string | undefined | null) {
  const name = String(label ?? '').trim() || 'Imagen'
  return {
    alt: name,
    title: name,
  }
}
