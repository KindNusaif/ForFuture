import { Shield } from 'lucide-react'

interface ProtectedVoicePillProps {
  youthVoiceId?: string | null
  className?: string
}

export default function ProtectedVoicePill({ youthVoiceId, className = '' }: ProtectedVoicePillProps) {
  return (
    <span
      className={`inline-flex max-w-full items-center gap-1 rounded-full bg-muted/90 px-2 py-0.5 text-[10px] font-semibold text-secondary ring-1 ring-default ${className}`}
      title="This movement was shared with a Youth Voice ID. The author's real profile identity is not shown publicly."
    >
      <Shield className="h-3 w-3 shrink-0 text-muted" aria-hidden />
      <span className="truncate">Protected Voice</span>
      {youthVoiceId && (
        <span className="hidden font-mono text-muted sm:inline" aria-hidden>
          · {youthVoiceId}
        </span>
      )}
    </span>
  )
}
