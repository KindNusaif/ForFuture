import { useCallback, useMemo, useState, type ReactNode } from 'react'
import ReportContentModal from '../components/ReportContentModal'
import Toast from '../components/Toast'
import { ReportContentContext, type ReportContentTarget } from './report-content-context'

export function ReportContentProvider({ children }: { children: ReactNode }) {
  const [target, setTarget] = useState<ReportContentTarget | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const openReportModal = useCallback((next: ReportContentTarget) => {
    setTarget(next)
    setSuccessMessage(null)
  }, [])

  const closeReportModal = useCallback(() => setTarget(null), [])

  const handleReportSuccess = useCallback(() => {
    setTarget(null)
    setSuccessMessage('Report submitted. Our team will review it carefully.')
  }, [])

  const value = useMemo(() => ({ openReportModal }), [openReportModal])

  return (
    <ReportContentContext.Provider value={value}>
      {children}
      <ReportContentModal
        open={Boolean(target)}
        target={target}
        onClose={closeReportModal}
        onSuccess={handleReportSuccess}
      />
      {successMessage && (
        <div
          className="pointer-events-none fixed inset-x-4 bottom-4 z-80 flex justify-center sm:inset-x-auto sm:right-6 sm:bottom-6 sm:justify-end"
          aria-live="polite"
        >
          <div className="pointer-events-auto w-full max-w-md">
            <Toast
              variant="success"
              message={successMessage}
              onDismiss={() => setSuccessMessage(null)}
            />
          </div>
        </div>
      )}
    </ReportContentContext.Provider>
  )
}
