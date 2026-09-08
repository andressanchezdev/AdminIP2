import { useId, useState } from 'react'
import { ImagePlus, Link2 } from 'lucide-react'
import { fileToWebpDataUrl } from '@/features/blog/lib/imageToWebp'
import { notifyError, notifySuccess } from '@/shared/lib/notify'
import { IconAction } from '@/shared/ui/IconAction/IconAction'
import './ImageSourceField.css'

type ImageSourceFieldProps = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
}

/** Campo de imagen: URL pegable + subida local convertida a WebP. */
export function ImageSourceField({
  value,
  onChange,
  placeholder = 'URL de imagen o suba un archivo',
  disabled,
}: ImageSourceFieldProps) {
  const inputId = useId()
  const [busy, setBusy] = useState(false)

  const onFile = async (file: File | null) => {
    if (!file || disabled) return
    setBusy(true)
    try {
      const webp = await fileToWebpDataUrl(file)
      onChange(webp)
      notifySuccess('Imagen lista', 'Convertida a WebP')
    } catch (error) {
      notifyError('No se pudo cargar', error instanceof Error ? error.message : 'Error de imagen')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="image-source-field">
      <span className="image-source-field__icon" aria-hidden>
        <Link2 size={16} strokeWidth={1.75} />
      </span>
      <input
        className="admin-input"
        value={value.startsWith('data:image/') ? '' : value}
        placeholder={value.startsWith('data:image/') ? 'Imagen local (WebP) cargada' : placeholder}
        disabled={disabled || busy}
        onChange={(event) => onChange(event.target.value)}
      />
      <label className="image-source-field__upload" htmlFor={inputId} title="Subir imagen local">
          <input
            id={inputId}
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
          <ImagePlus size={16} strokeWidth={1.75} aria-hidden />
        {busy ? '…' : 'Subir'}
      </label>
      {value ? (
        <>
          <img className="image-source-field__preview" src={value} alt="" />
          <IconAction label="Quitar" variant="delete" disabled={disabled || busy} onClick={() => onChange('')} />
        </>
      ) : null}
    </div>
  )
}
