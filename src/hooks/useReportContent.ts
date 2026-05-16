import { useContext } from 'react'
import { ReportContentContext } from '../context/report-content-context'

export function useReportContent() {
  const ctx = useContext(ReportContentContext)
  if (!ctx) {
    throw new Error('useReportContent must be used within ReportContentProvider')
  }
  return ctx
}
