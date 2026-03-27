import { useQuery } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router-dom'
import { PageCard } from '@/components/ui/PageCard'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { getAppointmentDetail } from '@/features/appointment/services/appointment.api'
import { appointmentFlowStorage } from '@/lib/appointment-flow-storage'

export function AppointmentDetailPage() {
  const [searchParams] = useSearchParams()
  const stored = appointmentFlowStorage.get()

  const appointmentId = searchParams.get('appointmentId') ?? stored?.appointmentId ?? ''
  const fallbackSessionId = searchParams.get('sessionId') ?? stored?.sessionId ?? ''

  const { data, isLoading, isError } = useQuery({
    queryKey: ['appointment-detail', appointmentId],
    queryFn: () => getAppointmentDetail(appointmentId),
    enabled: Boolean(appointmentId),
  })

  const effectiveSessionId = data?.sessionId ?? fallbackSessionId

  return (
    <div className="space-y-6">
      <PageCard
        title="Appointment detail"
        description="Server-backed appointment detail mapped to GET /appointments/{appointmentId}."
      >
        {!appointmentId ? (
          <div className="rounded-xl border border-amber-800 bg-amber-950/30 p-4 text-sm text-amber-200">
            No appointment context found yet. Complete a scheduling flow first, then open this page again.
          </div>
        ) : null}

        {isLoading ? <p className="text-slate-400">Loading appointment detail...</p> : null}
        {isError ? <p className="text-rose-400">Failed to load appointment detail from backend.</p> : null}

        {data ? (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
              <p className="text-sm text-slate-400">Appointment ID</p>
              <p className="mt-2 break-all text-sm text-white">{data.id}</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
              <p className="text-sm text-slate-400">Session ID</p>
              <p className="mt-2 break-all text-sm text-white">{data.sessionId}</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
              <p className="text-sm text-slate-400">Appointment status</p>
              <div className="mt-2">
                <StatusBadge value={data.status} />
              </div>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
              <p className="text-sm text-slate-400">Session status</p>
              <div className="mt-2">
                <StatusBadge value={data.sessionStatus} />
              </div>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
              <p className="text-sm text-slate-400">Staff</p>
              <p className="mt-2 text-sm text-white">{data.staffName}</p>
              <p className="mt-1 break-all text-xs text-slate-400">{data.staffId}</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
              <p className="text-sm text-slate-400">Room</p>
              <p className="mt-2 text-sm text-white">{data.roomName}</p>
              <p className="mt-1 break-all text-xs text-slate-400">{data.roomId}</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
              <p className="text-sm text-slate-400">Start time</p>
              <p className="mt-2 text-sm text-white">{new Date(data.startTime).toLocaleString()}</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
              <p className="text-sm text-slate-400">End time</p>
              <p className="mt-2 text-sm text-white">{new Date(data.endTime).toLocaleString()}</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
              <p className="text-sm text-slate-400">Branch ID</p>
              <p className="mt-2 break-all text-sm text-white">{data.branchId}</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
              <p className="text-sm text-slate-400">Version</p>
              <p className="mt-2 text-sm text-white">{data.version}</p>
            </div>
          </div>
        ) : null}
      </PageCard>

      <PageCard title="Next action" description="Jump back into the appointment lifecycle flow using the current server-backed appointment context.">
        <Link
          to={appointmentId ? `/appointments/lifecycle?appointmentId=${appointmentId}&sessionId=${effectiveSessionId}` : '/appointments/lifecycle'}
          className="inline-flex rounded-lg border border-cyan-700 px-4 py-2 text-sm font-medium text-cyan-100 hover:bg-cyan-900/40"
        >
          Open appointment lifecycle
        </Link>
      </PageCard>
    </div>
  )
}
