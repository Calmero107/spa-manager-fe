import { Link } from 'react-router-dom'
import type { ScheduleSessionResponse } from '@/types/api'
import { StatusBadge } from '@/components/ui/StatusBadge'

export function SchedulingResultCard({ result }: { result: ScheduleSessionResponse }) {
  return (
    <div className="mt-4 rounded-xl border border-cyan-800 bg-cyan-950/30 p-4 text-sm text-cyan-200">
      <div className="flex items-center justify-between gap-3">
        <p className="font-medium text-white">Scheduling completed</p>
        <StatusBadge value={result.status} />
      </div>
      <p className="mt-3">Appointment ID: {result.appointmentId}</p>
      <p>Session ID: {result.sessionId}</p>
      <p>Start: {new Date(result.startTime).toLocaleString()}</p>
      <p>End: {new Date(result.endTime).toLocaleString()}</p>
      <Link
        to={`/appointments/lifecycle?appointmentId=${result.appointmentId}&sessionId=${result.sessionId}`}
        className="mt-4 inline-flex rounded-lg border border-cyan-700 px-4 py-2 text-sm font-medium text-cyan-100 hover:bg-cyan-900/40"
      >
        Go to appointment lifecycle
      </Link>
    </div>
  )
}
