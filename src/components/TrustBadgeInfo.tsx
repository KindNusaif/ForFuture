import { useId, useState } from 'react'
import { Info } from 'lucide-react'

interface TrustBadgeInfoProps {
  label: string
  explanation: string
  className?: string
}

export default function TrustBadgeInfo({ label, explanation, className = '' }: TrustBadgeInfoProps) {
  const [open, setOpen] = useState(false)
  const popoverId = useId()

  return (
    <span className={`relative inline-flex ${className}`}>
      <button
        type="button"
        className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-muted transition hover:bg-muted hover:text-secondary focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand-500"
        aria-label={`What ${label} means`}
        aria-expanded={open}
        aria-controls={popoverId}
        title={explanation}
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setOpen(false)}
      >
        <Info className="h-3.5 w-3.5" aria-hidden />
      </button>
      {open && (
        <span
          id={popoverId}
          role="tooltip"
          className="absolute left-0 top-full z-20 mt-1.5 w-64 rounded-xl border border-default bg-surface p-3 text-xs leading-relaxed text-secondary shadow-lg"
        >
          {explanation}
        </span>
      )}
    </span>
  )
}
