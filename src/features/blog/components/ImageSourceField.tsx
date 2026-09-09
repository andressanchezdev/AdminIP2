import { useId, useRef, useState } from 'react'
import { Plus } from 'lucide-react'
import { notifyError } from '@/shared/lib/notify'
import { IconAction } from '@/shared/ui/IconAction/IconAction'
import { fileToWebpDataUrl } from '../lib/imageToWebp'
import './ImageSourceField.css'

type ImageSourceFieldProps = {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  placeholder?: string
  /** Si se define, muestra la acción "Agregar" (imagen +1). */
  onAdd?: () => void
}

export function ImageSourceField({
  value,
  onChange,
  disabled = false,
  placeholder = 'URL de la imagen',
  onAdd,
}: ImageSourceFieldProps) {
  const inputId = useId()
  const fileRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [showView, setShowView] = useState(false)

  const onFile = async (file: File | null) => {
    if (!file) return
    setBusy(true)
    try {
      onChange(await fileToWebpDataUrl(file))
    } catch {
      notifyError('No se pudo cargar la imagen')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="image-source-field">
      <input
        className="admin-input"
        value={value.startsWith('data:image/') ? '' : value}
        placeholder={value.startsWith('data:image/') ? 'Imagen local (WebP) cargada' : placeholder}
        disabled={disabled || busy}
        onChange={(event) => onChange(event.target.value)}
      />
      <IconAction
        label="Ver imagen"
        variant="view"
        disabled={disabled || busy || !value}
        onClick={() => setShowView((current) => !current)}
      />
      <input
        id={inputId}
        ref={fileRef}
        type="file"
        accept="image/*"
        hidden
        disabled={disabled || busy}
        onChange={(event) => {
          const file = event.target.files?.[0] ?? null
          void onFile(file)
          event.target.value = ''
        }}
      />
      <IconAction
        label="Cambiar imagen"
        variant="edit"
        disabled={disabled || busy}
        onClick={() => fileRef.current?.click()}
      />
      <IconAction
        label="Eliminar imagen"
        variant="delete"
        disabled={disabled || busy || !value}
        onClick={() => {
          onChange('')
          setShowView(false)
        }}
      />
      {onAdd ? (
        <button
          type="button"
          className="image-source-field__upload"
          title="Agregar imagen"
          disabled={disabled || busy}
          onClick={onAdd}
        >
          <Plus size={16} strokeWidth={1.75} aria-hidden />
          Agregar
        </button>
      ) : null}
      {showView && value ? <img className="image-source-field__view" src={value} alt="" /> : null}
    </div>
  )
}
