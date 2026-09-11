import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { notifyError, notifySuccess } from '@/shared/lib/notify'
import { ContentBack } from './ContentBack'
import { Modal } from '@/shared/ui/Modal/Modal'
import { PopupSelect } from '@/shared/ui/PopupSelect/PopupSelect'
import {
  applySlidersToDocument,
  downloadUploadedFileName,
  factoryDownload,
  getActiveDocument,
  getActiveSlot,
  hasUploadedMarkdown,
  resetActiveMarkdown,
  saveActiveDocument,
  saveActiveMarkdown,
  uploadedMarkdownSource,
} from './chat/botip/store'
import { parseBotMarkdown } from './chat/botip/schema'
import {
  SLIDER_GROUPS,
  SLIDER_SPECS,
  defaultSliderValues,
  sliderDisplay,
  slidersEqual,
  type SliderValues,
} from './chat/botip/sliders'
import './BotIpAdminPage.css'
import './contentStudio.css'
import './LandingAdminPage.css'

function snapshotSliders() {
  return { ...defaultSliderValues(), ...getActiveDocument().sliders }
}

export function BotIpAdminPage() {
  const navigate = useNavigate()
  const { section } = useParams()
  const [sliders, setSliders] = useState<SliderValues>(snapshotSliders)
  const [savedSliders, setSavedSliders] = useState<SliderValues>(snapshotSliders)
  const [pendingMarkdown, setPendingMarkdown] = useState<string | null>(null)
  const [confirmReset, setConfirmReset] = useState(false)
  const [hasUpload, setHasUpload] = useState(() => hasUploadedMarkdown())
  const fileRef = useRef<HTMLInputElement>(null)
  const isDirty = Boolean(pendingMarkdown) || !slidersEqual(sliders, savedSliders)

  useEffect(() => {
    if (section) {
      navigate('/contenido/bot', { replace: true })
    }
  }, [navigate, section])

  const saveAdjustments = () => {
    if (!isDirty) return
    if (pendingMarkdown) {
      const uploaded = saveActiveMarkdown(pendingMarkdown, 'subido')
      if (!uploaded.ok) {
        notifyError('No se aplicó el archivo', uploaded.errors[0])
        return
      }
      const doc = applySlidersToDocument(uploaded.doc, sliders, 'subido')
      saveActiveDocument(doc)
      setHasUpload(true)
      setPendingMarkdown(null)
      setSliders({ ...defaultSliderValues(), ...doc.sliders })
      setSavedSliders({ ...defaultSliderValues(), ...doc.sliders })
      notifySuccess('Ajustes guardados')
      return
    }
    const origin = getActiveSlot() === 'uploaded' ? 'subido' : 'modificado'
    const doc = applySlidersToDocument(getActiveDocument(), sliders, origin)
    saveActiveDocument(doc)
    const next = { ...defaultSliderValues(), ...doc.sliders }
    setSliders(next)
    setSavedSliders(next)
    notifySuccess('Ajustes guardados')
  }

  const downloadMarkdown = (source: string, filename: string, okMessage: string) => {
    const blob = new Blob([source], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
    notifySuccess(okMessage)
  }

  const downloadOriginal = () => {
    const file = factoryDownload()
    downloadMarkdown(file.source, file.filename, 'Se descargó botIP.md de fábrica')
  }

  const downloadUploaded = () => {
    const source = uploadedMarkdownSource()
    if (!source) {
      notifyError('No hay un archivo subido para descargar')
      return
    }
    downloadMarkdown(source, downloadUploadedFileName(), 'Se descargó botIP2.md')
  }

  const uploadBehavior = (file: File | undefined) => {
    if (!file) return
    if (!file.name.toLowerCase().endsWith('.md')) {
      notifyError('Solo se aceptan archivos .md')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const text = String(reader.result ?? '')
      const result = parseBotMarkdown(text)
      if (!result.ok) {
        notifyError('No se aplicó el archivo', result.errors[0])
        return
      }
      setPendingMarkdown(text)
      setSliders({ ...defaultSliderValues(), ...result.doc.sliders })
      notifySuccess('Contexto listo. Pulse Guardar ajustes para aplicarlo.')
    }
    reader.readAsText(file)
  }

  const confirmFactoryReset = () => {
    resetActiveMarkdown()
    const factory = defaultSliderValues()
    setPendingMarkdown(null)
    setSliders(factory)
    setSavedSliders(factory)
    setConfirmReset(false)
    notifySuccess('El chat volvió a botIP.md de fábrica')
  }

  const slot = getActiveSlot()
  const usingUploaded = slot === 'uploaded' && hasUpload
  const specById = Object.fromEntries(SLIDER_SPECS.map((spec) => [spec.id, spec]))

  return (
    <div className="content-studio">
      <div className="content-card">
        <div className="admin-toolbar">
          <ContentBack onBack={() => navigate(-1)} />
          <div className="landing-admin__actions">
            <PopupSelect
              variant="button"
              align="end"
              triggerLabel="Descargar contexto"
              aria-label="Qué contexto descargar"
              options={[
                {
                  value: 'original',
                  label: 'Original de fábrica (botIP.md)',
                  description: 'El comportamiento establecido de fabrica',
                },
                {
                  value: 'uploaded',
                  label: 'Último archivo subido (botIP2.md)',
                  description: hasUpload
                    ? 'El contexto que se aplicó la última vez que se subió un .md. El chat lo usa mientras no restablezcas.'
                    : 'Aún no hay un archivo subido para descargar.',
                  disabled: !hasUpload,
                },
              ]}
              onChange={(next) => {
                if (next === 'original') downloadOriginal()
                if (next === 'uploaded') downloadUploaded()
              }}
            />
            <button type="button" className="admin-btn admin-btn--ghost" onClick={() => fileRef.current?.click()}>
              Subir comportamiento
            </button>
            <button type="button" className="admin-btn admin-btn--ghost" onClick={() => setConfirmReset(true)}>
              Restablecer original
            </button>
            {isDirty ? (
              <button type="button" className="admin-btn" onClick={saveAdjustments}>
                Guardar ajustes
              </button>
            ) : null}
            <input
              ref={fileRef}
              type="file"
              accept=".md,text/markdown"
              hidden
              onChange={(event) => {
                uploadBehavior(event.target.files?.[0])
                event.target.value = ''
              }}
            />
          </div>
        </div>
        <p className="bot-ip-origin">
          El archivo establecido para el comportamiento es {usingUploaded ? 'botIP2.md (archivo subido)' : 'botIP.md'}
          {pendingMarkdown ? ' Hay un contexto nuevo sin guardar.' : isDirty ? ' Hay ajustes sin guardar.' : ''}
        </p>
        <div className="bot-slider-list">
          {SLIDER_GROUPS.map((group) => (
            <section key={group.title} className="bot-slider-group">
              <h3 className="bot-slider-group__title">{group.title}</h3>
              {group.ids.map((id) => {
                const spec = specById[id]
                if (!spec) return null
                const value = sliders[spec.id]
                const steps = Math.round((spec.max - spec.min) / spec.step) + 1
                return (
                  <label key={spec.id} className="bot-slider">
                    <span className="bot-slider__head">
                      <strong>{spec.label}</strong>
                      <span className="bot-slider__value">
                        {sliderDisplay(spec, value)}
                        {value === spec.factory ? ' · valor de fábrica' : ''}
                      </span>
                    </span>
                    <span className="bot-slider__help">{spec.help}</span>
                    <input
                      className="bot-slider__range"
                      type="range"
                      min={spec.min}
                      max={spec.max}
                      step={spec.step}
                      value={value}
                      onChange={(event) => setSliders({ ...sliders, [spec.id]: Number(event.target.value) })}
                    />
                    {steps <= 12 ? (
                      <span className="bot-slider__ticks" aria-hidden="true">
                        {Array.from({ length: steps }, (_, index) => spec.min + index * spec.step).map((tick) => (
                          <i key={tick} />
                        ))}
                      </span>
                    ) : null}
                  </label>
                )
              })}
            </section>
          ))}
        </div>
      </div>
      <Modal
        isOpen={confirmReset}
        title="Restablecer comportamiento original"
        onClose={() => setConfirmReset(false)}
        footer={
          <>
            <button type="button" className="admin-btn admin-btn--ghost" onClick={() => setConfirmReset(false)}>
              Cancelar
            </button>
            <button type="button" className="admin-btn" onClick={confirmFactoryReset}>
              Restablecer
            </button>
          </>
        }
      >
        <p>
          El chat vuelve a botIP.md de fábrica y se descartan los sliders locales. El último archivo subido se conserva para descargarlo como botIP2.md.
        </p>
      </Modal>
    </div>
  )
}
