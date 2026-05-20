import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router-dom'
import { PageCard } from '@/components/ui/PageCard'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { getAppointmentDetail } from '@/features/appointment/services/appointment.api'
import { getStaff } from '@/features/staff/services/staff.api'
import { api } from '@/lib/api'
import { appointmentFlowStorage } from '@/lib/appointment-flow-storage'
import { createRequestId } from '@/lib/request-id'
import type { ApiResponse, AvailableSlot, ScheduleSessionResponse, SchedulingLockResponse } from '@/types/api'

function getTodayDateInput() { return new Date().toISOString().slice(0, 10) }
function getDateOffsetInput(d: number) { const date = new Date(); date.setDate(date.getDate() + d); return date.toISOString().slice(0, 10) }

async function querySlots(branchId: string, p: { sessionId: string; preferredStaffId?: string | null; dateFrom: string; dateTo: string }) {
  return (await api.post<ApiResponse<{ sessionId: string; slots: AvailableSlot[] }>>('/scheduling/slots/query', { branchId, ...p, preferredStaffId: p.preferredStaffId || null })).data.data
}
async function lockSlot(branchId: string, sessionId: string, slotId: string) {
  return (await api.post<ApiResponse<SchedulingLockResponse>>('/scheduling/slots/lock', { branchId, sessionId, slotId })).data.data
}
async function cancelAppointment(branchId: string, appointmentId: string, p: { reason: string; applyRefund: boolean }) {
  return (await api.post<ApiResponse<{ appointmentId: string; appointmentStatus: string; sessionStatus: string }>>(`/appointments/${appointmentId}/cancel`, { branchId, ...p }, { headers: { 'X-Request-Id': createRequestId('cancel') } })).data.data
}
async function checkInAppointment(branchId: string, appointmentId: string) {
  return (await api.post<ApiResponse<{ appointmentId: string; appointmentStatus: string; sessionStatus: string }>>(`/appointments/${appointmentId}/check-in`, { branchId }, { headers: { 'X-Request-Id': createRequestId('checkin') } })).data.data
}
async function completeSession(branchId: string, technicianId: string | null | undefined, sessionId: string, resultNote: string) {
  return (await api.post<ApiResponse<{ sessionId: string; sessionStatus: string; appointmentStatus: string }>>(`/sessions/${sessionId}/complete`, { branchId, technicianId: technicianId || null, resultNote }, { headers: { 'X-Request-Id': createRequestId('complete') } })).data.data
}
async function rescheduleAppointment(branchId: string, p: { appointmentId: string; lockId: string; slotId: string; reason: string }) {
  return (await api.post<ApiResponse<ScheduleSessionResponse & { appointmentStatus?: string; sessionStatus?: string }>>(`/appointments/${p.appointmentId}/reschedule`, { branchId, newLockId: p.lockId, newSlotId: p.slotId, reason: p.reason }, { headers: { 'X-Request-Id': createRequestId('reschedule') } })).data.data
}

export function AppointmentLifecyclePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const persistedFlow = appointmentFlowStorage.get()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const branchId = user?.branchId
  const staffId = user?.staffId
  const role = user?.role
  const canOp = ['OWNER', 'MANAGER', 'RECEPTIONIST'].includes(role ?? '')
  const canComplete = ['OWNER', 'MANAGER', 'TECHNICIAN'].includes(role ?? '')
  const [appointmentId, setAppointmentId] = useState(searchParams.get('appointmentId') ?? persistedFlow?.appointmentId ?? '')
  const [sessionId, setSessionId] = useState(searchParams.get('sessionId') ?? persistedFlow?.sessionId ?? '')
  const [preferredStaffId, setPreferredStaffId] = useState(staffId ?? '')
  const [dateFrom, setDateFrom] = useState(getTodayDateInput())
  const [dateTo, setDateTo] = useState(getDateOffsetInput(2))
  const [cancelReason, setCancelReason] = useState('Khách hàng yêu cầu hủy')
  const [applyRefund, setApplyRefund] = useState(false)
  const [completeResultNote, setCompleteResultNote] = useState('Buổi điều trị hoàn thành tốt')
  const [rescheduleReason, setRescheduleReason] = useState('Khách hàng yêu cầu đổi lịch')
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null)
  const [lockInfo, setLockInfo] = useState<SchedulingLockResponse | null>(null)
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null)

  const { data: appointmentDetail } = useQuery({ queryKey: ['appointment-detail', appointmentId], queryFn: () => getAppointmentDetail(appointmentId), enabled: Boolean(appointmentId) })
  const { data: staffOptions, isLoading: isLoadingStaff } = useQuery({ queryKey: ['staff', branchId, 'TECHNICIAN', 'ACTIVE'], queryFn: () => getStaff(branchId!, { role: 'TECHNICIAN', status: 'ACTIVE' }), enabled: Boolean(branchId) })

  useEffect(() => { if (!preferredStaffId && staffId) setPreferredStaffId(staffId) }, [preferredStaffId, staffId])
  useEffect(() => { if (appointmentDetail?.sessionId && appointmentDetail.sessionId !== sessionId) setSessionId(appointmentDetail.sessionId) }, [appointmentDetail?.sessionId, sessionId])
  useEffect(() => {
    const next = new URLSearchParams(searchParams)
    if (appointmentId) next.set('appointmentId', appointmentId); else next.delete('appointmentId')
    if (sessionId) next.set('sessionId', sessionId); else next.delete('sessionId')
    setSearchParams(next, { replace: true })
    if (appointmentId && sessionId) appointmentFlowStorage.set({ appointmentId, sessionId })
  }, [appointmentId, searchParams, sessionId, setSearchParams])

  const refreshDetail = async () => { if (appointmentId) await queryClient.invalidateQueries({ queryKey: ['appointment-detail', appointmentId] }) }

  const cancelMut = useMutation({ mutationFn: (id: string) => cancelAppointment(branchId!, id, { reason: cancelReason, applyRefund }), onSuccess: refreshDetail })
  const checkInMut = useMutation({ mutationFn: (id: string) => checkInAppointment(branchId!, id), onSuccess: refreshDetail })
  const completeMut = useMutation({ mutationFn: (id: string) => completeSession(branchId!, preferredStaffId || staffId, id, completeResultNote), onSuccess: refreshDetail })
  const queryMut = useMutation({ mutationFn: () => querySlots(branchId!, { sessionId, preferredStaffId, dateFrom, dateTo }), onSuccess: () => { setSelectedSlot(null); setLockInfo(null); setRemainingSeconds(null) } })
  const lockMut = useMutation({ mutationFn: (slotId: string) => lockSlot(branchId!, sessionId, slotId), onSuccess: (d) => setLockInfo(d) })
  const rescheduleMut = useMutation({
    mutationFn: (p: { appointmentId: string; lockId: string; slotId: string }) => rescheduleAppointment(branchId!, { ...p, reason: rescheduleReason }),
    onSuccess: async (d) => { setAppointmentId(d.appointmentId); setSessionId(d.sessionId); await refreshDetail() },
  })

  useEffect(() => {
    if (!lockInfo) { setRemainingSeconds(null); return }
    const tick = () => { const s = Math.max(0, Math.ceil((new Date(lockInfo.expiresAt).getTime() - Date.now()) / 1000)); setRemainingSeconds(s); if (s === 0) setLockInfo(null) }
    tick(); const id = window.setInterval(tick, 1000); return () => window.clearInterval(id)
  }, [lockInfo])

  const slots = queryMut.data?.slots ?? []
  const canReschedule = Boolean(appointmentId && selectedSlot && lockInfo && (remainingSeconds ?? 0) > 0)
  const hasBranch = Boolean(branchId)
  const hasSession = Boolean(sessionId)
  const hasValidDate = Boolean(dateFrom && dateTo && dateFrom <= dateTo)
  const aStatus = appointmentDetail?.status
  const sStatus = appointmentDetail?.sessionStatus
  const canCancelApt = aStatus === 'CONFIRMED'
  const canCheckInApt = aStatus === 'CONFIRMED' && sStatus === 'SCHEDULED'
  const canCompleteApt = aStatus === 'CHECKED_IN' && sStatus === 'IN_PROGRESS'
  const canRescheduleApt = aStatus === 'CONFIRMED' && sStatus === 'SCHEDULED'
  const selectedStaff = staffOptions?.find((s) => s.id === preferredStaffId)

  const latestAction = useMemo(() => cancelMut.data ?? checkInMut.data ?? completeMut.data ?? rescheduleMut.data ?? null, [cancelMut.data, checkInMut.data, completeMut.data, rescheduleMut.data])

  return (
    <div className="space-y-8">
      <PageCard title="Quản lý lịch hẹn">
        <div className="mb-5 flex flex-wrap gap-3">
          <Link to={appointmentId ? `/appointments/detail?appointmentId=${appointmentId}&sessionId=${sessionId}` : '/appointments/detail'} className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100">Xem chi tiết lịch hẹn</Link>
        </div>

        {!canOp && !canComplete ? <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">Vai trò của bạn không có quyền thao tác trên lịch hẹn.</div> : null}
        {!hasBranch ? <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">Thiếu thông tin chi nhánh. Vui lòng đăng nhập bằng tài khoản thuộc chi nhánh.</div> : null}

        {appointmentDetail ? (
          <div className="mb-5 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-slate-500">Trạng thái hiện tại:</span><StatusBadge value={appointmentDetail.status} />
              <span className="text-slate-500">Buổi:</span><StatusBadge value={appointmentDetail.sessionStatus} />
            </div>
          </div>
        ) : null}

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Lý do hủy</label>
            <textarea value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} className="min-h-24 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600" />
            <label className="mt-3 flex items-center gap-3 text-sm font-medium text-slate-700"><input type="checkbox" checked={applyRefund} onChange={(e) => setApplyRefund(e.target.checked)} />Hoàn tiền</label>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Ghi chú hoàn thành</label>
            <textarea value={completeResultNote} onChange={(e) => setCompleteResultNote(e.target.value)} className="min-h-24 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Kỹ thuật viên</label>
            <select value={preferredStaffId} onChange={(e) => setPreferredStaffId(e.target.value)} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600">
              <option value="">Sử dụng tài khoản hiện tại</option>
              {staffOptions?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <p className="mt-2 text-xs text-slate-500">{isLoadingStaff ? 'Đang tải...' : selectedStaff ? `Đã chọn: ${selectedStaff.name}` : 'Tùy chọn kỹ thuật viên'}</p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <button type="button" disabled={!canOp || !appointmentId || cancelMut.isPending || !hasBranch || !cancelReason.trim() || !canCancelApt} onClick={() => cancelMut.mutate(appointmentId)} className="rounded-xl border border-rose-200 px-5 py-3 text-sm font-medium text-rose-700 transition hover:bg-rose-50 disabled:opacity-50">{cancelMut.isPending ? 'Đang hủy...' : 'Hủy lịch hẹn'}</button>
          <button type="button" disabled={!canOp || !appointmentId || checkInMut.isPending || !hasBranch || !canCheckInApt} onClick={() => checkInMut.mutate(appointmentId)} className="rounded-xl border border-amber-200 px-5 py-3 text-sm font-medium text-amber-700 transition hover:bg-amber-50 disabled:opacity-50">{checkInMut.isPending ? 'Đang check-in...' : 'Check-in'}</button>
          <button type="button" disabled={!canComplete || !sessionId || completeMut.isPending || !hasBranch || !completeResultNote.trim() || !canCompleteApt} onClick={() => completeMut.mutate(sessionId)} className="rounded-xl border border-emerald-200 px-5 py-3 text-sm font-medium text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-50">{completeMut.isPending ? 'Đang hoàn thành...' : 'Hoàn thành buổi'}</button>
        </div>

        {latestAction ? (
          <div className="mt-5 rounded-xl border border-cyan-200 bg-cyan-50 p-4 text-sm">
            <div className="flex items-center justify-between gap-3">
              <p className="font-semibold text-slate-900">Kết quả thao tác</p>
              {'appointmentStatus' in latestAction && typeof latestAction.appointmentStatus === 'string' ? <StatusBadge value={latestAction.appointmentStatus} /> : null}
            </div>
            <p className="mt-2 text-cyan-700">Thao tác đã được thực hiện thành công.</p>
          </div>
        ) : null}
      </PageCard>

      <PageCard title="Đổi lịch">
        {!hasSession ? <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">Thiếu thông tin buổi. Vui lòng mở trang này từ quy trình đặt lịch.</div> : null}
        {!hasValidDate ? <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">Khoảng ngày không hợp lệ.</div> : null}
        {appointmentDetail && !canRescheduleApt ? <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">Lịch hẹn này không ở trạng thái có thể đổi lịch.</div> : null}

        <div className="mb-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div><label className="mb-2 block text-sm font-medium text-slate-700">KTV ưu tiên</label><select value={preferredStaffId} onChange={(e) => setPreferredStaffId(e.target.value)} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600"><option value="">Không ưu tiên</option>{staffOptions?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
          <div><label className="mb-2 block text-sm font-medium text-slate-700">Từ ngày</label><input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600" /></div>
          <div><label className="mb-2 block text-sm font-medium text-slate-700">Đến ngày</label><input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600" /></div>
          <div><label className="mb-2 block text-sm font-medium text-slate-700">Lý do đổi lịch</label><input value={rescheduleReason} onChange={(e) => setRescheduleReason(e.target.value)} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600" /></div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={() => queryMut.mutate()} disabled={!canOp || !hasBranch || !hasSession || !hasValidDate || !canRescheduleApt} className="rounded-xl bg-cyan-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:opacity-50">Tìm khung giờ mới</button>
          {selectedSlot ? <button type="button" disabled={!canOp || lockMut.isPending || !hasBranch || !hasSession || !canRescheduleApt} onClick={() => lockMut.mutate(selectedSlot.slotId)} className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:opacity-50">{lockMut.isPending ? 'Đang giữ chỗ...' : 'Giữ chỗ'}</button> : null}
          {canReschedule && selectedSlot && lockInfo ? <button type="button" disabled={!canOp || rescheduleMut.isPending || !hasBranch || !hasSession || !rescheduleReason.trim() || !canRescheduleApt} onClick={() => rescheduleMut.mutate({ appointmentId, lockId: lockInfo.lockId, slotId: selectedSlot.slotId })} className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50">{rescheduleMut.isPending ? 'Đang đổi lịch...' : 'Xác nhận đổi lịch'}</button> : null}
          <button type="button" onClick={() => { setSelectedSlot(null); setLockInfo(null); setRemainingSeconds(null) }} className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100">Đặt lại</button>
        </div>

        {lockInfo ? <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700"><p>Hết hạn: {new Date(lockInfo.expiresAt).toLocaleString()}</p><p>Còn lại: {remainingSeconds ?? 0} giây</p></div> : null}
        {remainingSeconds === 0 ? <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">Khóa chỗ đã hết hạn. Vui lòng tìm và giữ chỗ lại.</div> : null}

        {queryMut.isPending ? <LoadingSpinner message="Đang tìm khung giờ..." /> : null}
        {slots.length === 0 && !queryMut.isPending && queryMut.isSuccess ? <EmptyState message="Không tìm thấy khung giờ phù hợp." /> : null}
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {slots.map((slot) => {
            const isSelected = selectedSlot?.slotId === slot.slotId
            return (
              <button key={slot.slotId} type="button" onClick={() => setSelectedSlot(slot)} className={`rounded-2xl border p-5 text-left transition ${isSelected ? 'border-cyan-500 bg-cyan-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                <h3 className="text-lg font-semibold text-slate-900">{slot.staffName} · {slot.roomName}</h3>
                <p className="mt-2 text-sm text-slate-600">{new Date(slot.startTime).toLocaleString()} → {new Date(slot.endTime).toLocaleString()}</p>
              </button>
            )
          })}
        </div>
      </PageCard>
    </div>
  )
}
