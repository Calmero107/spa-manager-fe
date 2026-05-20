import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { PageCard } from '@/components/ui/PageCard'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { ErrorAlert } from '@/components/ui/ErrorAlert'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { getAppointmentBoard } from '@/features/scheduling/services/scheduling-board.api'
import { api } from '@/lib/api'
import { createRequestId } from '@/lib/request-id'
import type { ApiResponse } from '@/types/api'

function todayInput() { return new Date().toISOString().slice(0, 10) }

async function checkInAppointment(branchId: string, appointmentId: string) {
  const response = await api.post<ApiResponse<{ appointmentId: string; appointmentStatus: string; sessionStatus: string }>>(`/appointments/${appointmentId}/check-in`, { branchId }, { headers: { 'X-Request-Id': createRequestId('board-checkin') } })
  return response.data.data
}

const viStatus: Record<string, string> = { PENDING: 'Chờ xử lý', CONFIRMED: 'Đã xác nhận', CHECKED_IN: 'Đã check-in', COMPLETED: 'Hoàn thành', CANCELLED: 'Đã hủy' }

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

  const boardQuery = useQuery({ queryKey: ['appointment-board', branchId, date], queryFn: () => getAppointmentBoard(branchId!, date), enabled: Boolean(branchId && date) })
  const refreshBoard = async () => queryClient.invalidateQueries({ queryKey: ['appointment-board', branchId, date] })
  const quickCheckInMutation = useMutation({ mutationFn: (appointmentId: string) => checkInAppointment(branchId!, appointmentId), onSuccess: refreshBoard })

  const staffOptions = useMemo(() => { const m = new Map<string, string>(); (boardQuery.data ?? []).forEach((i) => m.set(i.staffId, i.staffName)); return Array.from(m.entries()).map(([id, name]) => ({ id, name })) }, [boardQuery.data])
  const roomOptions = useMemo(() => { const m = new Map<string, string>(); (boardQuery.data ?? []).forEach((i) => m.set(i.roomId, i.roomName)); return Array.from(m.entries()).map(([id, name]) => ({ id, name })) }, [boardQuery.data])

  const filteredItems = useMemo(() => {
    return (boardQuery.data ?? []).filter((item) => {
      if (staffFilter !== 'ALL' && item.staffId !== staffFilter) return false
      if (roomFilter !== 'ALL' && item.roomId !== roomFilter) return false
      if (statusFilter !== 'ALL' && item.appointmentStatus !== statusFilter) return false
      return true
    })
  }, [boardQuery.data, roomFilter, staffFilter, statusFilter])

  const grouped = useMemo(() => {
    const m = new Map<string, typeof filteredItems>()
    filteredItems.forEach((item) => { const key = groupBy === 'staff' ? `${item.staffName}::${item.staffId}` : `${item.roomName}::${item.roomId}`; const c = m.get(key) ?? []; c.push(item); m.set(key, c) })
    return Array.from(m.entries()).map(([key, items]) => ({ key, items }))
  }, [filteredItems, groupBy])

  return (
    <div className="space-y-8">
      <PageCard title="Bảng lịch hẹn">
        <div className="mb-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-2xl bg-gradient-to-br from-cyan-600 to-cyan-700 p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-100">Vận hành</p>
            <h2 className="mt-3 text-2xl font-bold text-white">Lịch hẹn trong ngày</h2>
            <p className="mt-3 max-w-2xl text-sm text-cyan-100">Theo dõi lịch hẹn theo nhân viên hoặc phòng, lọc nhanh và thao tác trực tiếp.</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link to="/appointments/lifecycle" className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-cyan-700 transition hover:bg-cyan-50">Quản lý lịch hẹn</Link>
              <Link to="/dashboard" className="rounded-xl border border-cyan-300 px-4 py-2 text-sm font-medium text-white transition hover:bg-cyan-600">Về Dashboard</Link>
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm">
            <p className="text-slate-600">{boardQuery.data ? `Hiển thị ${filteredItems.length}/${boardQuery.data.length} lịch hẹn.` : 'Chưa có dữ liệu.'}</p>
            <p className="mt-2 text-slate-500">Check-in nhanh khả dụng cho lịch hẹn đã xác nhận.</p>
          </div>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-3 xl:grid-cols-6">
          <div><label className="mb-2 block text-sm font-medium text-slate-700">Ngày</label><input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600" /></div>
          <div><label className="mb-2 block text-sm font-medium text-slate-700">Nhóm theo</label><select value={groupBy} onChange={(e) => setGroupBy(e.target.value as 'staff' | 'room')} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600"><option value="staff">Nhân viên</option><option value="room">Phòng</option></select></div>
          <div><label className="mb-2 block text-sm font-medium text-slate-700">Nhân viên</label><select value={staffFilter} onChange={(e) => setStaffFilter(e.target.value)} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600"><option value="ALL">Tất cả</option>{staffOptions.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
          <div><label className="mb-2 block text-sm font-medium text-slate-700">Phòng</label><select value={roomFilter} onChange={(e) => setRoomFilter(e.target.value)} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600"><option value="ALL">Tất cả</option>{roomOptions.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}</select></div>
          <div><label className="mb-2 block text-sm font-medium text-slate-700">Trạng thái</label><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600"><option value="ALL">Tất cả</option>{Object.entries(viStatus).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
          <div><label className="mb-2 block text-sm font-medium text-slate-700">Đặt lại</label><button type="button" onClick={() => { setStaffFilter('ALL'); setRoomFilter('ALL'); setStatusFilter('ALL'); setGroupBy('staff') }} className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100">Đặt lại bộ lọc</button></div>
        </div>

        {boardQuery.isLoading ? <LoadingSpinner message="Đang tải bảng lịch hẹn..." /> : null}
        {boardQuery.isError ? <ErrorAlert message="Không thể tải bảng lịch hẹn." onRetry={() => boardQuery.refetch()} /> : null}
        {!boardQuery.isLoading && filteredItems.length === 0 ? <EmptyState message="Không có lịch hẹn nào phù hợp với bộ lọc." /> : null}
      </PageCard>

      <div className="grid gap-6 xl:grid-cols-2">
        {grouped.map((group) => {
          const [label] = group.key.split('::')
          return (
            <PageCard key={group.key} title={`${label} (${group.items.length})`}>
              <div className="space-y-4">
                {group.items.map((item) => {
                  const canQuickCheckIn = canOperateAppointments && item.appointmentStatus === 'CONFIRMED' && item.sessionStatus === 'SCHEDULED'
                  const isCheckingIn = quickCheckInMutation.isPending && quickCheckInMutation.variables === item.appointmentId
                  return (
                    <div key={item.appointmentId} className="rounded-2xl border border-slate-200 bg-white p-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-sm text-slate-500">{new Date(item.startTime).toLocaleTimeString()} → {new Date(item.endTime).toLocaleTimeString()}</p>
                          <h3 className="mt-2 text-lg font-semibold text-slate-900">{item.customerName || 'Khách hàng'}</h3>
                        </div>
                        <div className="flex flex-wrap gap-2"><StatusBadge value={item.appointmentStatus} /><StatusBadge value={item.sessionStatus} /></div>
                      </div>
                      <div className="mt-3 space-y-1 text-sm text-slate-600">
                        <p>Nhân viên: <span className="font-medium text-slate-900">{item.staffName}</span></p>
                        <p>Phòng: <span className="font-medium text-slate-900">{item.roomName}</span></p>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-3">
                        <Link to={`/appointments/detail?appointmentId=${item.appointmentId}&sessionId=${item.sessionId}`} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100">Chi tiết</Link>
                        <Link to={`/appointments/lifecycle?appointmentId=${item.appointmentId}&sessionId=${item.sessionId}`} className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-cyan-700">Quản lý</Link>
                        {canQuickCheckIn ? <button type="button" onClick={() => quickCheckInMutation.mutate(item.appointmentId)} disabled={isCheckingIn} className="rounded-xl border border-amber-200 px-4 py-2 text-sm font-medium text-amber-700 transition hover:bg-amber-50 disabled:opacity-60">{isCheckingIn ? 'Đang check-in...' : 'Check-in nhanh'}</button> : null}
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
