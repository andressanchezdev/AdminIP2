import { useId, useRef, useState } from 'react'
import { notifyError } from '@/shared/lib/notify'
import { IconAction } from '@/shared/ui/IconAction/IconAction'
import { fileToWebpDataUrl } from '../lib/imageToWebp'
import './ImageSourceField.css'

type ImageSourceFieldProps = {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  placeholder?: string
  maxEdge?: number
  asObjectUrl?: boolean
}

function isLocalPreview(src: string) {
  return src.startsWith('data:image/') || src.startsWith('blob:')
}

export function ImageSourceField({
  value,
  onChange,
  disabled = false,
  placeholder = 'URL de la imagen',
  maxEdge,
  asObjectUrl = false,
}: ImageSourceFieldProps) {
  const inputId = useId()
  const fileRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [showView, setShowView] = useState(false)

  const onFile = async (file: File | null) => {
    if (!file) return
    setBusy(true)
    try {
      onChange(asObjectUrl ? URL.createObjectURL(file) : await fileToWebpDataUrl(file, 0.85, maxEdge))
      setShowView(true)
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
        value={isLocalPreview(value) ? '' : value}
        placeholder={isLocalPreview(value) ? 'Imagen en vista previa (no se guarda en el navegador)' : placeholder}
        disabled={disabled || busy}
        onChange={(event) => onChange(event.target.value)}
      />
      <IconAction
        label={showView ? 'Ocultar imagen' : 'Ver imagen'}
        variant="view"
        disabled={disabled || busy || !value}
        onClick={() => setShowView((open) => !open)}
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
        label="Editar imagen"
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
      {showView && value ? <img className="image-source-field__view" src={value} alt="" /> : null}
    </div>
  )
}
