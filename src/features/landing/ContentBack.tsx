export function ContentBack({ onBack }: { onBack: () => void }) {

  return (
    <div className="content-studio__nav">
      <button type="button" className="content-back" onClick={onBack} aria-label="Volver">
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <path d="m15 18-6-6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  )
}
