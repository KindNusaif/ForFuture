import { useCallback, useMemo, useState, type ReactNode } from 'react'
import ReportContentModal from '../components/ReportContentModal'
import { useToast } from '../hooks/useToast'
import { ReportContentContext, type ReportContentTarget } from './report-content-context'

export function ReportContentProvider({ children }: { children: ReactNode }) {
  const [target, setTarget] = useState<ReportContentTarget | null>(null)
  const toast = useToast()

  const openReportModal = useCallback((next: ReportContentTarget) => {
    setTarget(next)
  }, [])

  const closeReportModal = useCallback(() => setTarget(null), [])

  const handleReportSuccess = useCallback(() => {
    setTarget(null)
    toast.success('Report submitted. Our team will review it carefully.')
  }, [toast])

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
    </ReportContentContext.Provider>
  )
}
