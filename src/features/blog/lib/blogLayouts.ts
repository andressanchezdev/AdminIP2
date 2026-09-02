import type { CSSProperties } from 'react'
import type { BlogBlockContent, BlogLayout, BlogPost, BlogSlot } from '@/mocks/data'

/** Clona layout del catálogo para snapshot de publicación. */
export function cloneBlogLayout(layout: BlogLayout): BlogLayout {
  return {
    ...layout,
    slots: layout.slots.map((slot) => ({ ...slot })),
  }
}

/** Remapea bloques al cambiar de maqueta (prioriza mismo id, luego mismo tipo). */
export function remapBlocksToLayout(
  previous: BlogLayout,
  next: BlogLayout,
  blocks: Record<string, BlogBlockContent>,
): Record<string, BlogBlockContent> {
  const result: Record<string, BlogBlockContent> = {}
  const used = new Set<string>()

  for (const slot of next.slots) {
    if (blocks[slot.id] && !used.has(slot.id)) {
      result[slot.id] = { ...blocks[slot.id] }
      used.add(slot.id)
      continue
    }
    const donor = previous.slots.find(
      (candidate) => candidate.type === slot.type && !used.has(candidate.id) && blocks[candidate.id],
    )
    if (donor) {
      result[slot.id] = { ...blocks[donor.id] }
      used.add(donor.id)
    } else {
      result[slot.id] = emptyBlockForSlot(slot)
    }
  }
  return result
}

export function emptyBlockForSlot(slot: BlogSlot): BlogBlockContent {
  if (slot.type === 'image') return { imageUrl: '' }
  if (slot.type === 'carousel') return { imageUrls: [''] }
  return { text: '' }
}

export function emptyBlocksForLayout(layout: BlogLayout): Record<string, BlogBlockContent> {
  return Object.fromEntries(layout.slots.map((slot) => [slot.id, emptyBlockForSlot(slot)]))
}

export function layoutGridStyle(layout: BlogLayout): CSSProperties {
  return {
    display: 'grid',
    gridTemplateAreas: layout.gridTemplateAreas,
    gridTemplateColumns: layout.gridTemplateColumns,
    gridTemplateRows: layout.gridTemplateRows,
    gap: '12px',
  }
}

export function postCoverImage(post: BlogPost): string | null {
  for (const slot of post.layoutSnapshot.slots) {
    if (slot.type === 'carousel') {
      const first = post.blocks[slot.id]?.imageUrls?.map((url) => url.trim()).find(Boolean)
      if (first) return first
    }
    if (slot.type === 'image') {
      const url = post.blocks[slot.id]?.imageUrl?.trim()
      if (url) return url
    }
  }
  return null
}
