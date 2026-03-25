import { Link, useSearchParams } from 'react-router-dom'
import { PageCard } from '@/components/ui/PageCard'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { appointmentFlowStorage } from '@/lib/appointment-flow-storage'

export function AppointmentDetailPage() {
  const [searchParams] = useSearchParams()
  const stored = appointmentFlowStorage.get()

  const appointmentId = searchParams.get('appointmentId') ?? stored?.appointmentId ?? ''
  const sessionId = searchParams.get('sessionId') ?? stored?.sessionId ?? ''

  return (
    <div className="space-y-6">
      <PageCard
        title="Appointment detail"
        description="Current FE detail page is derived from the latest scheduling/lifecycle flow because the backend does not yet expose a dedicated appointment detail endpoint."
      >
        {appointmentId ? (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
              <p className="text-sm text-slate-400">Appointment ID</p>
              <p className="mt-2 break-all text-sm text-white">{appointmentId}</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
              <p className="text-sm text-slate-400">Session ID</p>
              <p className="mt-2 break-all text-sm text-white">{sessionId || '-'}</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
              <p className="text-sm text-slate-400">Current FE state</p>
              <div className="mt-2">
                <StatusBadge value="CONFIRMED" />
              </div>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
              <p className="text-sm text-slate-400">Next action</p>
              <Link
                to={`/appointments/lifecycle?appointmentId=${appointmentId}&sessionId=${sessionId}`}
                className="mt-2 inline-flex rounded-lg border border-cyan-700 px-4 py-2 text-sm font-medium text-cyan-100 hover:bg-cyan-900/40"
              >
                Open appointment lifecycle
              </Link>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-amber-800 bg-amber-950/30 p-4 text-sm text-amber-200">
            No appointment context found yet. Complete a scheduling flow first, then open this page again.
          </div>
        )}
      </PageCard>

      <PageCard title="Why this page is limited right now" description="What is needed from backend for a fully real detail page.">
        <ul className="space-y-2 text-sm text-slate-300">
          <li>- A dedicated `GET /appointments/{appointmentId}` endpoint is needed.</li>
          <li>- Prefer also exposing room/staff names and session status in the response.</li>
          <li>- Once BE adds that endpoint, this page can switch from persisted FE state to real server state.</li>
        </ul>
      </PageCard>
    </div>
  )
}
