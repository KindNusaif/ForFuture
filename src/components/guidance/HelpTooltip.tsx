import { CircleHelp } from 'lucide-react'

interface HelpTooltipProps {
  label: string
  text: string
  className?: string
}

/** Accessible help icon with hover/focus explanation (no JS tooltip library). */
export default function HelpTooltip({ label, text, className = '' }: HelpTooltipProps) {
  return (
    <span className={`help-tooltip ${className}`}>
      <button
        type="button"
        className="help-tooltip-trigger"
        aria-label={label}
        aria-describedby={undefined}
      >
        <CircleHelp className="h-4 w-4" aria-hidden />
      </button>
      <span role="tooltip" className="help-tooltip-panel">
        {text}
      </span>
    </span>
  )
}
