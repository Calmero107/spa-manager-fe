import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { PageCard } from '@/components/ui/PageCard'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { getOperationalDashboard } from '@/features/dashboard/services/dashboard.api'

function todayInput() {
  return new Date().toISOString().slice(0, 10)
}

export function DashboardPage() {
  const { user } = useAuth()
  const branchId = user?.branchId
  const [date, setDate] = useState(todayInput())

  const dashboardQuery = useQuery({
    queryKey: ['operational-dashboard', branchId, date],
    queryFn: () => getOperationalDashboard(branchId!, date),
    enabled: Boolean(branchId && date),
  })

  const data = dashboardQuery.data

  return (
    <div className="space-y-6">
      <PageCard title="Operational Dashboard" description="Daily operational snapshot for appointments, sessions, plans, and workload.">
        <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-2xl border border-cyan-900/60 bg-gradient-to-br from-cyan-950/40 to-slate-950/40 p-5">
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">Demo-ready overview</p>
            <h2 className="mt-3 text-2xl font-semibold text-white">Branch operations at a glance</h2>
            <p className="mt-3 max-w-2xl text-sm text-slate-300">
              This dashboard is designed to help a receptionist, manager, or owner quickly understand what is happening today: what is booked, what is waiting, and where immediate action is needed.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link to="/scheduling/board" className="rounded-xl bg-cyan-400 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-cyan-300">Open scheduling board</Link>
              <Link to="/appointments/lifecycle" className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-100 hover:bg-slate-800">Open lifecycle tools</Link>
              <Link to="/treatment-plans" className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-100 hover:bg-slate-800">Review treatment plans</Link>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-[220px_1fr] xl:grid-cols-1">
            <div>
              <label className="mb-2 block text-sm text-slate-300">Date</label>
              <input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400" />
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/40 px-4 py-3 text-xs text-slate-400">
              <p>Using <span className="font-mono text-slate-200">branchId={branchId ?? 'missing'}</span></p>
              <p className="mt-2">Built for day-to-day operations and demo storytelling, not long-term BI reporting.</p>
            </div>
          </div>
        </div>

        {dashboardQuery.isLoading ? <p className="mt-4 text-slate-400">Loading dashboard...</p> : null}
        {dashboardQuery.isError ? <p className="mt-4 text-rose-400">Failed to load dashboard.</p> : null}
      </PageCard>

      {data ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <PageCard title="Appointments today" description={`${data.appointmentsToday.total} total appointment(s)`}>
              <div className="space-y-2 text-sm text-slate-300">
                <p>Pending: <span className="text-white">{data.appointmentsToday.pending}</span></p>
                <p>Confirmed: <span className="text-white">{data.appointmentsToday.confirmed}</span></p>
                <p>Checked-in: <span className="text-white">{data.appointmentsToday.checkedIn}</span></p>
                <p>Completed: <span className="text-white">{data.appointmentsToday.completed}</span></p>
                <p>Cancelled: <span className="text-white">{data.appointmentsToday.cancelled}</span></p>
                <p>No-show: <span className="text-white">{data.appointmentsToday.noShow}</span></p>
              </div>
            </PageCard>

            <PageCard title="Sessions backlog" description={`${data.sessions.total} session(s) in branch`}>
              <div className="space-y-2 text-sm text-slate-300">
                <p>Not scheduled: <span className="text-white">{data.sessions.notScheduled}</span></p>
                <p>Scheduled: <span className="text-white">{data.sessions.scheduled}</span></p>
                <p>In progress: <span className="text-white">{data.sessions.inProgress}</span></p>
                <p>Completed: <span className="text-white">{data.sessions.completed}</span></p>
                <p>Skipped: <span className="text-white">{data.sessions.skipped}</span></p>
              </div>
            </PageCard>

            <PageCard title="Treatment plans" description={`${data.treatmentPlans.total} total plan(s)`}>
              <div className="space-y-2 text-sm text-slate-300">
                <p>Draft: <span className="text-white">{data.treatmentPlans.draft}</span></p>
                <p>Active: <span className="text-white">{data.treatmentPlans.active}</span></p>
                <p>Paused: <span className="text-white">{data.treatmentPlans.paused}</span></p>
                <p>Completed: <span className="text-white">{data.treatmentPlans.completed}</span></p>
                <p>Cancelled: <span className="text-white">{data.treatmentPlans.cancelled}</span></p>
              </div>
            </PageCard>

            <PageCard title="Operational focus" description="Top two places to continue the demo from here.">
              <div className="space-y-3 text-sm text-slate-300">
                <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3">
                  <p className="text-slate-400">Next likely action</p>
                  <p className="mt-1 text-white">Go to Scheduling Board if appointments are already present today.</p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3">
                  <p className="text-slate-400">Fallback action</p>
                  <p className="mt-1 text-white">Open Treatment Plans if the demo should emphasize planning and lifecycle management.</p>
                </div>
              </div>
            </PageCard>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <PageCard title="Upcoming appointments" description="Next appointments that operators are likely to care about today.">
              <div className="space-y-4">
                {data.upcomingAppointments.length === 0 ? <p className="text-slate-400">No upcoming appointments found.</p> : null}
                {data.upcomingAppointments.map((item) => (
                  <div key={item.appointmentId} className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm text-slate-400">{new Date(item.startTime).toLocaleTimeString()} → {new Date(item.endTime).toLocaleTimeString()}</p>
                        <h3 className="mt-2 text-lg font-semibold text-white">{item.customerName || item.customerId}</h3>
                        <p className="mt-1 text-sm text-slate-300">{item.staffName} · {item.roomName}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <StatusBadge value={item.appointmentStatus} />
                        <StatusBadge value={item.sessionStatus} />
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-3">
                      <Link to="/scheduling/board" className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-100 hover:bg-slate-800">Open board</Link>
                      <Link to={`/appointments/lifecycle?appointmentId=${item.appointmentId}&sessionId=${item.sessionId}`} className="rounded-xl bg-cyan-400 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-cyan-300">Open lifecycle</Link>
                    </div>
                  </div>
                ))}
              </div>
            </PageCard>

            <PageCard title="Unscheduled sessions" description="Sessions still waiting to be placed into the calendar.">
              <div className="space-y-4">
                {data.unscheduledSessions.length === 0 ? <p className="text-slate-400">No unscheduled sessions found.</p> : null}
                {data.unscheduledSessions.map((item) => (
                  <div key={item.sessionId} className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm text-slate-400">Session #{item.sequenceNo}</p>
                        <h3 className="mt-2 text-lg font-semibold text-white">{item.serviceName}</h3>
                        <p className="mt-1 text-sm text-slate-300">{item.customerName || item.customerId}</p>
                      </div>
                      <StatusBadge value={item.sessionStatus} />
                    </div>
                    <div className="mt-4 flex flex-wrap gap-3">
                      <Link to={`/scheduling?sessionId=${item.sessionId}`} className="rounded-xl bg-cyan-400 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-cyan-300">Schedule session</Link>
                      <Link to={`/treatment-plans/${item.planId}`} className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-100 hover:bg-slate-800">Open plan</Link>
                    </div>
                  </div>
                ))}
              </div>
            </PageCard>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <PageCard title="Staff workload" description="Appointment count per staff for the selected day.">
              <div className="space-y-3">
                {data.staffWorkload.length === 0 ? <p className="text-slate-400">No staff workload data for this day.</p> : null}
                {data.staffWorkload.map((item, index) => (
                  <div key={item.id} className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-3">
                    <span className="text-slate-200">#{index + 1} · {item.name}</span>
                    <span className="text-white">{item.count}</span>
                  </div>
                ))}
              </div>
            </PageCard>

            <PageCard title="Room workload" description="Appointment count per room for the selected day.">
              <div className="space-y-3">
                {data.roomWorkload.length === 0 ? <p className="text-slate-400">No room workload data for this day.</p> : null}
                {data.roomWorkload.map((item, index) => (
                  <div key={item.id} className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-3">
                    <span className="text-slate-200">#{index + 1} · {item.name}</span>
                    <span className="text-white">{item.count}</span>
                  </div>
                ))}
              </div>
            </PageCard>
          </div>
        </>
      ) : null}
    </div>
  )
}
