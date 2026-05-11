import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { PageCard } from '@/components/ui/PageCard'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { getAppointmentBoard } from '@/features/scheduling/services/scheduling-board.api'

function todayInput() {
  return new Date().toISOString().slice(0, 10)
}

export function SchedulingBoardPage() {
  const { user } = useAuth()
  const branchId = user?.branchId
  const [date, setDate] = useState(todayInput())
  const [groupBy, setGroupBy] = useState<'staff' | 'room'>('staff')

  const boardQuery = useQuery({
    queryKey: ['appointment-board', branchId, date],
    queryFn: () => getAppointmentBoard(branchId!, date),
    enabled: Boolean(branchId && date),
  })

  const grouped = useMemo(() => {
    const items = boardQuery.data ?? []
    const map = new Map<string, typeof items>()

    items.forEach((item) => {
      const key = groupBy === 'staff' ? `${item.staffName}::${item.staffId}` : `${item.roomName}::${item.roomId}`
      const current = map.get(key) ?? []
      current.push(item)
      map.set(key, current)
    })

    return Array.from(map.entries()).map(([key, items]) => ({ key, items }))
  }, [boardQuery.data, groupBy])

  return (
    <div className="space-y-6">
      <PageCard title="Scheduling board" description="Operational daily board grouped by staff or room for the active branch.">
        <div className="mb-5 grid gap-4 md:grid-cols-3">
          <div>
            <label className="mb-2 block text-sm text-slate-300">Date</label>
            <input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400" />
          </div>
          <div>
            <label className="mb-2 block text-sm text-slate-300">Group by</label>
            <select value={groupBy} onChange={(event) => setGroupBy(event.target.value as 'staff' | 'room')} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400">
              <option value="staff">Staff</option>
              <option value="room">Room</option>
            </select>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/40 px-4 py-3 text-xs text-slate-400">
            <p>Using <span className="font-mono text-slate-200">branchId={branchId ?? 'missing'}</span></p>
            <p className="mt-2">{boardQuery.data ? `${boardQuery.data.length} appointment(s) loaded for this day.` : 'No board data loaded yet.'}</p>
          </div>
        </div>

        {boardQuery.isLoading ? <p className="text-slate-400">Loading scheduling board...</p> : null}
        {boardQuery.isError ? <p className="text-rose-400">Failed to load scheduling board.</p> : null}
        {!boardQuery.isLoading && boardQuery.data?.length === 0 ? <p className="text-slate-400">No appointments found for the selected date.</p> : null}
      </PageCard>

      <div className="grid gap-6 xl:grid-cols-2">
        {grouped.map((group) => {
          const [label] = group.key.split('::')
          return (
            <PageCard key={group.key} title={label} description={`${group.items.length} appointment(s)`}>
              <div className="space-y-4">
                {group.items.map((item) => (
                  <div key={item.appointmentId} className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm text-slate-400">{new Date(item.startTime).toLocaleTimeString()} → {new Date(item.endTime).toLocaleTimeString()}</p>
                        <h3 className="mt-2 text-lg font-semibold text-white">{item.customerName || item.customerId}</h3>
                        <p className="mt-1 text-sm text-slate-400">Plan {item.planId}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <StatusBadge value={item.appointmentStatus} />
                        <StatusBadge value={item.sessionStatus} />
                      </div>
                    </div>

                    <div className="mt-4 grid gap-2 text-sm text-slate-300">
                      <p>Staff: <span className="text-white">{item.staffName}</span></p>
                      <p>Room: <span className="text-white">{item.roomName}</span></p>
                      <p>Appointment ID: <span className="font-mono text-slate-400">{item.appointmentId}</span></p>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-3">
                      <Link to={`/appointments/detail?appointmentId=${item.appointmentId}&sessionId=${item.sessionId}`} className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-100 hover:bg-slate-800">
                        Open detail
                      </Link>
                      <Link to={`/appointments/lifecycle?appointmentId=${item.appointmentId}&sessionId=${item.sessionId}`} className="rounded-xl bg-cyan-400 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-cyan-300">
                        Open lifecycle
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </PageCard>
          )
        })}
      </div>
    </div>
  )
}
