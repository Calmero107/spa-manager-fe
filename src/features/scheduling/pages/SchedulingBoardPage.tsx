import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { PageCard } from '@/components/ui/PageCard'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { getAppointmentBoard } from '@/features/scheduling/services/scheduling-board.api'
import { api } from '@/lib/api'
import { createRequestId } from '@/lib/request-id'
import type { ApiResponse } from '@/types/api'

function todayInput() {
  return new Date().toISOString().slice(0, 10)
}

async function checkInAppointment(branchId: string, appointmentId: string) {
  const response = await api.post<ApiResponse<{ appointmentId: string; appointmentStatus: string; sessionStatus: string }>>(
    `/appointments/${appointmentId}/check-in`,
    { branchId },
    {
      headers: {
        'X-Request-Id': createRequestId('board-checkin'),
      },
    },
  )
  return response.data.data
}

export function SchedulingBoardPage() {
  const { user } = useAuth()
  const branchId = user?.branchId
  const role = user?.role
  const queryClient = useQueryClient()
  const [date, setDate] = useState(todayInput())
  const [groupBy, setGroupBy] = useState<'staff' | 'room'>('staff')
  const [staffFilter, setStaffFilter] = useState('ALL')
  const [roomFilter, setRoomFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const canOperateAppointments = ['OWNER', 'MANAGER', 'RECEPTIONIST'].includes(role ?? '')

  const boardQuery = useQuery({
    queryKey: ['appointment-board', branchId, date],
    queryFn: () => getAppointmentBoard(branchId!, date),
    enabled: Boolean(branchId && date),
  })

  const refreshBoard = async () => {
    await queryClient.invalidateQueries({ queryKey: ['appointment-board', branchId, date] })
  }

  const quickCheckInMutation = useMutation({
    mutationFn: (appointmentId: string) => checkInAppointment(branchId!, appointmentId),
    onSuccess: refreshBoard,
  })

  const staffOptions = useMemo(() => {
    const map = new Map<string, string>()
    ;(boardQuery.data ?? []).forEach((item) => map.set(item.staffId, item.staffName))
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }))
  }, [boardQuery.data])

  const roomOptions = useMemo(() => {
    const map = new Map<string, string>()
    ;(boardQuery.data ?? []).forEach((item) => map.set(item.roomId, item.roomName))
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }))
  }, [boardQuery.data])

  const filteredItems = useMemo(() => {
    return (boardQuery.data ?? []).filter((item) => {
      if (staffFilter !== 'ALL' && item.staffId !== staffFilter) return false
      if (roomFilter !== 'ALL' && item.roomId !== roomFilter) return false
      if (statusFilter !== 'ALL' && item.appointmentStatus !== statusFilter) return false
      return true
    })
  }, [boardQuery.data, roomFilter, staffFilter, statusFilter])

  const grouped = useMemo(() => {
    const map = new Map<string, typeof filteredItems>()

    filteredItems.forEach((item) => {
      const key = groupBy === 'staff' ? `${item.staffName}::${item.staffId}` : `${item.roomName}::${item.roomId}`
      const current = map.get(key) ?? []
      current.push(item)
      map.set(key, current)
    })

    return Array.from(map.entries()).map(([key, items]) => ({ key, items }))
  }, [filteredItems, groupBy])

  return (
    <div className="space-y-6">
      <PageCard title="Scheduling Board" description="Operational daily board grouped by staff or room for the active branch.">
        <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-2xl border border-cyan-900/60 bg-gradient-to-br from-cyan-950/40 to-slate-950/40 p-5">
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">Operations board</p>
            <h2 className="mt-3 text-2xl font-semibold text-white">See today’s appointments and act fast</h2>
            <p className="mt-3 max-w-2xl text-sm text-slate-300">
              This board is designed for operational use during the day. You can group bookings by staff or room, filter the board, and jump directly into lifecycle actions.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link to="/appointments/lifecycle" className="rounded-xl bg-cyan-400 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-cyan-300">Open lifecycle tools</Link>
              <Link to="/dashboard" className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-100 hover:bg-slate-800">Back to dashboard</Link>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/40 px-4 py-3 text-xs text-slate-400">
            <p>Using <span className="font-mono text-slate-200">branchId={branchId ?? 'missing'}</span></p>
            <p className="mt-2">{boardQuery.data ? `${filteredItems.length}/${boardQuery.data.length} appointment(s) shown.` : 'No board data loaded yet.'}</p>
            <p className="mt-2">Quick check-in is available for confirmed appointments that are already scheduled.</p>
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-3 xl:grid-cols-6">
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
          <div>
            <label className="mb-2 block text-sm text-slate-300">Staff filter</label>
            <select value={staffFilter} onChange={(event) => setStaffFilter(event.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400">
              <option value="ALL">All staff</option>
              {staffOptions.map((staff) => <option key={staff.id} value={staff.id}>{staff.name}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm text-slate-300">Room filter</label>
            <select value={roomFilter} onChange={(event) => setRoomFilter(event.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400">
              <option value="ALL">All rooms</option>
              {roomOptions.map((room) => <option key={room.id} value={room.id}>{room.name}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm text-slate-300">Appointment status</label>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400">
              <option value="ALL">All statuses</option>
              <option value="PENDING">PENDING</option>
              <option value="CONFIRMED">CONFIRMED</option>
              <option value="CHECKED_IN">CHECKED_IN</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm text-slate-300">Quick reset</label>
            <button type="button" onClick={() => { setStaffFilter('ALL'); setRoomFilter('ALL'); setStatusFilter('ALL'); setGroupBy('staff') }} className="w-full rounded-xl border border-slate-700 px-4 py-3 text-sm text-slate-100 hover:bg-slate-800">
              Reset filters
            </button>
          </div>
        </div>

        {boardQuery.isLoading ? <p className="mt-4 text-slate-400">Loading scheduling board...</p> : null}
        {boardQuery.isError ? <p className="mt-4 text-rose-400">Failed to load scheduling board.</p> : null}
        {!boardQuery.isLoading && filteredItems.length === 0 ? <p className="mt-4 text-slate-400">No appointments match the selected filters.</p> : null}
      </PageCard>

      <div className="grid gap-6 xl:grid-cols-2">
        {grouped.map((group) => {
          const [label] = group.key.split('::')
          return (
            <PageCard key={group.key} title={label} description={`${group.items.length} appointment(s)`}>
              <div className="space-y-4">
                {group.items.map((item) => {
                  const canQuickCheckIn = canOperateAppointments && item.appointmentStatus === 'CONFIRMED' && item.sessionStatus === 'SCHEDULED'
                  const isCheckingIn = quickCheckInMutation.isPending && quickCheckInMutation.variables === item.appointmentId

                  return (
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
                        {canQuickCheckIn ? (
                          <button
                            type="button"
                            onClick={() => quickCheckInMutation.mutate(item.appointmentId)}
                            disabled={isCheckingIn}
                            className="rounded-xl border border-amber-700 px-4 py-2 text-sm text-amber-200 hover:bg-amber-950/30 disabled:opacity-60"
                          >
                            {isCheckingIn ? 'Checking in...' : 'Quick check-in'}
                          </button>
                        ) : null}
                      </div>
                    </div>
                  )
                })}
              </div>
            </PageCard>
          )
        })}
      </div>
    </div>
  )
}
