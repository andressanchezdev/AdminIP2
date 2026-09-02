import type { ReactNode } from 'react'

const URL_PATTERN = /(https?:\/\/[^\s<>"']+)/gi

export function extractUrls(text: string): string[] {
  if (!text) return []
  return Array.from(text.matchAll(URL_PATTERN), (match) => match[0])
}

/** Detecta URLs en texto y las convierte en nodos con enlaces. */
export function renderTextWithLinks(text: string): ReactNode {
  if (!text) return '—'
  const nodes: ReactNode[] = []
  let last = 0
  let key = 0
  for (const match of text.matchAll(URL_PATTERN)) {
    const url = match[0]
    const start = match.index ?? 0
    if (start > last) {
      nodes.push(text.slice(last, start))
    }
    nodes.push(
      <a
        key={`link-${key}`}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="blog-text-link"
      >
        {url}
      </a>,
    )
    key += 1
    last = start + url.length
  }
  if (last < text.length) {
    nodes.push(text.slice(last))
  }
  return nodes.length ? nodes : text
}
