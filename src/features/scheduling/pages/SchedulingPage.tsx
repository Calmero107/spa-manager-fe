import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { PageCard } from '@/components/ui/PageCard'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { ErrorAlert } from '@/components/ui/ErrorAlert'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { SchedulingResultCard } from '@/features/scheduling/components/SchedulingResultCard'
import { getStaff } from '@/features/staff/services/staff.api'
import { api } from '@/lib/api'
import { appointmentFlowStorage } from '@/lib/appointment-flow-storage'
import { createRequestId } from '@/lib/request-id'
import type { ApiResponse, AvailableSlot, ScheduleSessionResponse, SchedulingLockResponse } from '@/types/api'

function getTodayDateInput() { return new Date().toISOString().slice(0, 10) }
function getDateOffsetInput(offsetDays: number) { const d = new Date(); d.setDate(d.getDate() + offsetDays); return d.toISOString().slice(0, 10) }

async function querySlots(branchId: string, payload: { sessionId: string; preferredStaffId?: string | null; dateFrom: string; dateTo: string }) {
  const response = await api.post<ApiResponse<{ sessionId: string; slots: AvailableSlot[] }>>('/scheduling/slots/query', { branchId, sessionId: payload.sessionId, preferredStaffId: payload.preferredStaffId || null, dateFrom: payload.dateFrom, dateTo: payload.dateTo })
  return response.data.data
}
async function lockSlot(branchId: string, sessionId: string, slotId: string) {
  const response = await api.post<ApiResponse<SchedulingLockResponse>>('/scheduling/slots/lock', { branchId, sessionId, slotId })
  return response.data.data
}
async function scheduleSession(branchId: string, sessionId: string, payload: { slotId: string; lockId: string; overrideGapRule: boolean; overrideReason: string | null }) {
  const response = await api.post<ApiResponse<ScheduleSessionResponse>>(`/sessions/${sessionId}/schedule`, { branchId, lockId: payload.lockId, slotId: payload.slotId, overrideGapRule: payload.overrideGapRule, overrideReason: payload.overrideReason }, { headers: { 'X-Request-Id': createRequestId('schedule') } })
  return response.data.data
}

export function SchedulingPage() {
  const [searchParams] = useSearchParams()
  const persistedFlow = appointmentFlowStorage.get()
  const { user } = useAuth()
  const branchId = user?.branchId
  const staffId = user?.staffId
  const role = user?.role
  const canScheduleSessions = ['OWNER', 'MANAGER', 'RECEPTIONIST'].includes(role ?? '')
  const sessionId = searchParams.get('sessionId') ?? persistedFlow?.sessionId ?? ''
  const [preferredStaffId, setPreferredStaffId] = useState(staffId ?? '')
  const [dateFrom, setDateFrom] = useState(getTodayDateInput())
  const [dateTo, setDateTo] = useState(getDateOffsetInput(2))
  const [overrideGapRule, setOverrideGapRule] = useState(false)
  const [overrideReason, setOverrideReason] = useState('')
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null)
  const [lastLock, setLastLock] = useState<SchedulingLockResponse | null>(null)
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null)
  const [scheduledResult, setScheduledResult] = useState<ScheduleSessionResponse | null>(null)

  const { data: staffOptions, isLoading: isLoadingStaff } = useQuery({ queryKey: ['staff', branchId, 'TECHNICIAN', 'ACTIVE'], queryFn: () => getStaff(branchId!, { role: 'TECHNICIAN', status: 'ACTIVE' }), enabled: Boolean(branchId) })

  useEffect(() => { if (!preferredStaffId && staffId) setPreferredStaffId(staffId) }, [preferredStaffId, staffId])

  const queryMutation = useMutation({ mutationFn: () => querySlots(branchId!, { sessionId, preferredStaffId, dateFrom, dateTo }), onSuccess: () => { setSelectedSlot(null); setLastLock(null); setScheduledResult(null); setRemainingSeconds(null) } })
  const lockMutation = useMutation({ mutationFn: (slotId: string) => lockSlot(branchId!, sessionId, slotId), onSuccess: (data) => { setLastLock(data); setScheduledResult(null) } })
  const scheduleMutation = useMutation({
    mutationFn: (payload: { slotId: string; lockId: string }) => scheduleSession(branchId!, sessionId, { ...payload, overrideGapRule, overrideReason: overrideGapRule ? overrideReason || null : null }),
    onSuccess: (data) => { setScheduledResult(data); appointmentFlowStorage.set({ appointmentId: data.appointmentId, sessionId: data.sessionId }) },
  })

  useEffect(() => {
    if (!lastLock) { setRemainingSeconds(null); return }
    const tick = () => { const s = Math.max(0, Math.ceil((new Date(lastLock.expiresAt).getTime() - Date.now()) / 1000)); setRemainingSeconds(s); if (s === 0) setLastLock(null) }
    tick(); const id = window.setInterval(tick, 1000); return () => window.clearInterval(id)
  }, [lastLock])

  const slots = queryMutation.data?.slots ?? []
  const canSchedule = Boolean(selectedSlot && lastLock && (remainingSeconds ?? 0) > 0)
  const hasRequiredContext = Boolean(branchId && sessionId)
  const hasValidDateRange = Boolean(dateFrom && dateTo && dateFrom <= dateTo)
  const selectedStaff = staffOptions?.find((s) => s.id === preferredStaffId)

  const selectedSummary = useMemo(() => {
    if (!selectedSlot) return null
    return { window: `${new Date(selectedSlot.startTime).toLocaleString()} → ${new Date(selectedSlot.endTime).toLocaleString()}`, resourceSummary: `${selectedSlot.staffName} · ${selectedSlot.roomName}` }
  }, [selectedSlot])

  return (
    <div className="space-y-8">
      <PageCard title="Đặt lịch">
        {!canScheduleSessions ? <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">Vai trò của bạn không có quyền đặt lịch.</div> : null}
        {!hasRequiredContext ? <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">Thiếu thông tin ngữ cảnh. Vui lòng mở trang này từ chi tiết Liệu trình.</div> : null}
        {!hasValidDateRange ? <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">Khoảng ngày không hợp lệ. "Đến ngày" phải bằng hoặc sau "Từ ngày".</div> : null}

        <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Kỹ thuật viên ưu tiên</label>
            <select value={preferredStaffId} onChange={(e) => setPreferredStaffId(e.target.value)} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600">
              <option value="">Không ưu tiên</option>
              {staffOptions?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <p className="mt-2 text-xs text-slate-500">{isLoadingStaff ? 'Đang tải kỹ thuật viên...' : selectedStaff ? `Đã chọn: ${selectedStaff.name}` : 'Tùy chọn kỹ thuật viên ưu tiên'}</p>
          </div>
          <div><label className="mb-2 block text-sm font-medium text-slate-700">Từ ngày</label><input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600" /></div>
          <div><label className="mb-2 block text-sm font-medium text-slate-700">Đến ngày</label><input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600" /></div>
        </div>

        <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
            <input type="checkbox" checked={overrideGapRule} onChange={(e) => setOverrideGapRule(e.target.checked)} />
            Bỏ qua quy tắc khoảng cách khi đặt lịch
          </label>
          {overrideGapRule ? (
            <div className="mt-3"><label className="mb-2 block text-sm font-medium text-slate-700">Lý do</label><textarea value={overrideReason} onChange={(e) => setOverrideReason(e.target.value)} placeholder="Giải thích lý do bỏ qua quy tắc..." className="min-h-24 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600" /></div>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={() => queryMutation.mutate()} disabled={!canScheduleSessions || !hasRequiredContext || !hasValidDateRange} className="rounded-xl bg-cyan-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:opacity-60">Tìm khung giờ</button>
          {selectedSlot ? <button type="button" onClick={() => lockMutation.mutate(selectedSlot.slotId)} disabled={!canScheduleSessions || lockMutation.isPending || !hasRequiredContext} className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:opacity-60">{lockMutation.isPending ? 'Đang giữ chỗ...' : 'Giữ chỗ'}</button> : null}
          {canSchedule && selectedSlot && lastLock ? <button type="button" onClick={() => scheduleMutation.mutate({ slotId: selectedSlot.slotId, lockId: lastLock.lockId })} disabled={!canScheduleSessions || scheduleMutation.isPending || !hasRequiredContext || (overrideGapRule && !overrideReason.trim())} className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60">{scheduleMutation.isPending ? 'Đang đặt lịch...' : 'Xác nhận đặt lịch'}</button> : null}
          <button type="button" onClick={() => { setSelectedSlot(null); setLastLock(null); setScheduledResult(null); setRemainingSeconds(null) }} className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100">Đặt lại</button>
        </div>

        {queryMutation.isPending ? <LoadingSpinner message="Đang tìm khung giờ trống..." /> : null}
        {queryMutation.isError ? <ErrorAlert message="Không thể tìm khung giờ." onRetry={() => queryMutation.mutate()} /> : null}
        {lockMutation.isError ? <ErrorAlert message="Không thể giữ chỗ." /> : null}
        {scheduleMutation.isError ? <ErrorAlert message="Đặt lịch thất bại." /> : null}

        {selectedSummary ? (
          <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
            <p className="font-semibold text-slate-900">Khung giờ đã chọn</p>
            <p className="mt-1 text-slate-600">{selectedSummary.resourceSummary}</p>
            <p className="mt-1 text-slate-500">{selectedSummary.window}</p>
          </div>
        ) : null}

        {lastLock ? (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm">
            <div className="flex items-center justify-between gap-3">
              <div><p className="text-emerald-800">Hết hạn: {new Date(lastLock.expiresAt).toLocaleString()}</p><p className="text-emerald-700">Còn lại: {remainingSeconds ?? 0} giây</p></div>
              <StatusBadge value={(remainingSeconds ?? 0) > 0 ? 'CONFIRMED' : 'CANCELLED'} />
            </div>
          </div>
        ) : null}

        {remainingSeconds === 0 ? <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">Khóa chỗ đã hết hạn. Vui lòng tìm kiếm và giữ chỗ lại.</div> : null}
        {scheduledResult ? <SchedulingResultCard result={scheduledResult} /> : null}
      </PageCard>

      <PageCard title="Khung giờ trống">
        {slots.length === 0 && !queryMutation.isPending ? <EmptyState message="Chưa có khung giờ nào. Nhấn 'Tìm khung giờ' để bắt đầu." /> : null}
        <div className="grid gap-4 md:grid-cols-2">
          {slots.map((slot) => {
            const isSelected = selectedSlot?.slotId === slot.slotId
            return (
              <button key={slot.slotId} type="button" onClick={() => setSelectedSlot(slot)}
                className={`rounded-2xl border p-5 text-left transition ${isSelected ? 'border-cyan-500 bg-cyan-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                <h3 className="text-lg font-semibold text-slate-900">{slot.staffName} · {slot.roomName}</h3>
                <p className="mt-2 text-sm text-slate-600">{new Date(slot.startTime).toLocaleString()} → {new Date(slot.endTime).toLocaleString()}</p>
                <p className="mt-3 text-sm text-slate-500">Thiết bị: {slot.equipment.length || 0}</p>
              </button>
            )
          })}
        </div>
      </PageCard>
    </div>
  )
}
