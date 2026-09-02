import { IG_CAROUSEL_MAX, IG_CAROUSEL_MIN } from '@/features/blog/components/IgCarousel'
import { ImageSourceField } from '@/features/blog/components/ImageSourceField'
import './CarouselFieldEditor.css'

type CarouselFieldEditorProps = {
  urls: string[]
  onChange: (urls: string[]) => void
}

/** Editor de imágenes del carrusel Post IG (URL o archivo → WebP). */
export function CarouselFieldEditor({ urls, onChange }: CarouselFieldEditorProps) {
  const list = urls.length ? urls : ['']

  const setAt = (index: number, value: string) => {
    const next = [...list]
    next[index] = value
    onChange(next)
  }

  const add = () => {
    if (list.length >= IG_CAROUSEL_MAX) return
    onChange([...list, ''])
  }

  const remove = (index: number) => {
    if (list.length <= IG_CAROUSEL_MIN) {
      onChange([''])
      return
    }
    onChange(list.filter((_, i) => i !== index))
  }

  return (
    <div className="carousel-field">
      <p className="carousel-field__hint">
        Carrusel Instagram · {IG_CAROUSEL_MIN}–{IG_CAROUSEL_MAX} imágenes (URL o subida WebP)
      </p>
      {list.map((url, index) => (
        <div key={index} className="carousel-field__item">
          <ImageSourceField
            value={url}
            onChange={(value) => setAt(index, value)}
            placeholder={`Imagen ${index + 1}`}
          />
          <button
            type="button"
            className="admin-btn admin-btn--ghost"
            onClick={() => remove(index)}
            disabled={list.length <= IG_CAROUSEL_MIN && !url}
          >
            Quitar
          </button>
        </div>
      ))}
      <button
        type="button"
        className="admin-btn admin-btn--ghost"
        onClick={add}
        disabled={list.length >= IG_CAROUSEL_MAX}
      >
        Agregar imagen
      </button>
    </div>
  )
}
