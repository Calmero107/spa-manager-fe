import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router-dom'
import { PageCard } from '@/components/ui/PageCard'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { getAppointmentDetail } from '@/features/appointment/services/appointment.api'
import { getStaff } from '@/features/staff/services/staff.api'
import { api } from '@/lib/api'
import { appointmentFlowStorage } from '@/lib/appointment-flow-storage'
import { createRequestId } from '@/lib/request-id'
import type { ApiResponse, AvailableSlot, ScheduleSessionResponse, SchedulingLockResponse } from '@/types/api'

function getTodayDateInput() {
  return new Date().toISOString().slice(0, 10)
}

function getDateOffsetInput(offsetDays: number) {
  const date = new Date()
  date.setDate(date.getDate() + offsetDays)
  return date.toISOString().slice(0, 10)
}

async function querySlots(branchId: string, payload: { sessionId: string; preferredStaffId?: string | null; dateFrom: string; dateTo: string }) {
  const response = await api.post<ApiResponse<{ sessionId: string; slots: AvailableSlot[] }>>('/scheduling/slots/query', {
    branchId,
    sessionId: payload.sessionId,
    preferredStaffId: payload.preferredStaffId || null,
    dateFrom: payload.dateFrom,
    dateTo: payload.dateTo,
  })
  return response.data.data
}

async function lockSlot(branchId: string, sessionId: string, slotId: string) {
  const response = await api.post<ApiResponse<SchedulingLockResponse>>('/scheduling/slots/lock', {
    branchId,
    sessionId,
    slotId,
  })
  return response.data.data
}

async function cancelAppointment(branchId: string, appointmentId: string, payload: { reason: string; applyRefund: boolean }) {
  const response = await api.post<ApiResponse<{ appointmentId: string; appointmentStatus: string; sessionStatus: string }>>(
    `/appointments/${appointmentId}/cancel`,
    {
      branchId,
      reason: payload.reason,
      applyRefund: payload.applyRefund,
    },
    {
      headers: {
        'X-Request-Id': createRequestId('cancel'),
      },
    },
  )
  return response.data.data
}

async function checkInAppointment(branchId: string, appointmentId: string) {
  const response = await api.post<ApiResponse<{ appointmentId: string; appointmentStatus: string; sessionStatus: string }>>(
    `/appointments/${appointmentId}/check-in`,
    { branchId },
    {
      headers: {
        'X-Request-Id': createRequestId('checkin'),
      },
    },
  )
  return response.data.data
}

async function completeSession(branchId: string, technicianId: string | null | undefined, sessionId: string, resultNote: string) {
  const response = await api.post<ApiResponse<{ sessionId: string; sessionStatus: string; appointmentStatus: string }>>(
    `/sessions/${sessionId}/complete`,
    {
      branchId,
      technicianId: technicianId || null,
      resultNote,
    },
    {
      headers: {
        'X-Request-Id': createRequestId('complete'),
      },
    },
  )
  return response.data.data
}

async function rescheduleAppointment(branchId: string, payload: { appointmentId: string; lockId: string; slotId: string; reason: string }) {
  const response = await api.post<ApiResponse<ScheduleSessionResponse & { appointmentStatus?: string; sessionStatus?: string }>>(
    `/appointments/${payload.appointmentId}/reschedule`,
    {
      branchId,
      newLockId: payload.lockId,
      newSlotId: payload.slotId,
      reason: payload.reason,
    },
    {
      headers: {
        'X-Request-Id': createRequestId('reschedule'),
      },
    },
  )
  return response.data.data
}

export function AppointmentLifecyclePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const persistedFlow = appointmentFlowStorage.get()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const branchId = user?.branchId
  const staffId = user?.staffId
  const [appointmentId, setAppointmentId] = useState(searchParams.get('appointmentId') ?? persistedFlow?.appointmentId ?? '')
  const [sessionId, setSessionId] = useState(searchParams.get('sessionId') ?? persistedFlow?.sessionId ?? '')
  const [preferredStaffId, setPreferredStaffId] = useState(staffId ?? '')
  const [dateFrom, setDateFrom] = useState(getTodayDateInput())
  const [dateTo, setDateTo] = useState(getDateOffsetInput(2))
  const [cancelReason, setCancelReason] = useState('customer requested cancel')
  const [applyRefund, setApplyRefund] = useState(false)
  const [completeResultNote, setCompleteResultNote] = useState('treatment completed successfully')
  const [rescheduleReason, setRescheduleReason] = useState('customer requested change')
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null)
  const [lockInfo, setLockInfo] = useState<SchedulingLockResponse | null>(null)
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null)

  const { data: appointmentDetail } = useQuery({
    queryKey: ['appointment-detail', appointmentId],
    queryFn: () => getAppointmentDetail(appointmentId),
    enabled: Boolean(appointmentId),
  })

  const { data: staffOptions, isLoading: isLoadingStaff } = useQuery({
    queryKey: ['staff', branchId, 'TECHNICIAN', 'ACTIVE'],
    queryFn: () => getStaff(branchId!, { role: 'TECHNICIAN', status: 'ACTIVE' }),
    enabled: Boolean(branchId),
  })

  useEffect(() => {
    if (!preferredStaffId && staffId) {
      setPreferredStaffId(staffId)
    }
  }, [preferredStaffId, staffId])

  useEffect(() => {
    if (appointmentDetail?.sessionId && appointmentDetail.sessionId !== sessionId) {
      setSessionId(appointmentDetail.sessionId)
    }
  }, [appointmentDetail?.sessionId, sessionId])

  useEffect(() => {
    const next = new URLSearchParams(searchParams)
    if (appointmentId) next.set('appointmentId', appointmentId)
    else next.delete('appointmentId')
    if (sessionId) next.set('sessionId', sessionId)
    else next.delete('sessionId')
    setSearchParams(next, { replace: true })

    if (appointmentId && sessionId) {
      appointmentFlowStorage.set({ appointmentId, sessionId })
    }
  }, [appointmentId, searchParams, sessionId, setSearchParams])

  const refreshAppointmentDetail = async () => {
    if (appointmentId) {
      await queryClient.invalidateQueries({ queryKey: ['appointment-detail', appointmentId] })
    }
  }

  const cancelMutation = useMutation({
    mutationFn: (id: string) => cancelAppointment(branchId!, id, { reason: cancelReason, applyRefund }),
    onSuccess: refreshAppointmentDetail,
  })
  const checkInMutation = useMutation({
    mutationFn: (id: string) => checkInAppointment(branchId!, id),
    onSuccess: refreshAppointmentDetail,
  })
  const completeMutation = useMutation({
    mutationFn: (id: string) => completeSession(branchId!, preferredStaffId || staffId, id, completeResultNote),
    onSuccess: refreshAppointmentDetail,
  })

  const queryMutation = useMutation({
    mutationFn: () => querySlots(branchId!, { sessionId, preferredStaffId, dateFrom, dateTo }),
    onSuccess: () => {
      setSelectedSlot(null)
      setLockInfo(null)
      setRemainingSeconds(null)
    },
  })

  const lockMutation = useMutation({
    mutationFn: (slotId: string) => lockSlot(branchId!, sessionId, slotId),
    onSuccess: (data) => setLockInfo(data),
  })

  const rescheduleMutation = useMutation({
    mutationFn: (payload: { appointmentId: string; lockId: string; slotId: string }) =>
      rescheduleAppointment(branchId!, { ...payload, reason: rescheduleReason }),
    onSuccess: async (data) => {
      setAppointmentId(data.appointmentId)
      setSessionId(data.sessionId)
      await refreshAppointmentDetail()
    },
  })

  useEffect(() => {
    if (!lockInfo) {
      setRemainingSeconds(null)
      return
    }

    const tick = () => {
      const diffMs = new Date(lockInfo.expiresAt).getTime() - Date.now()
      const seconds = Math.max(0, Math.ceil(diffMs / 1000))
      setRemainingSeconds(seconds)
      if (seconds === 0) {
        setLockInfo(null)
      }
    }

    tick()
    const intervalId = window.setInterval(tick, 1000)
    return () => window.clearInterval(intervalId)
  }, [lockInfo])

  const slots = queryMutation.data?.slots ?? []
  const canReschedule = Boolean(appointmentId && selectedSlot && lockInfo && (remainingSeconds ?? 0) > 0)
  const hasBranchContext = Boolean(branchId)
  const hasSessionContext = Boolean(sessionId)
  const hasValidDateRange = Boolean(dateFrom && dateTo && dateFrom <= dateTo)
  const appointmentStatus = appointmentDetail?.status
  const sessionStatus = appointmentDetail?.sessionStatus
  const canCancel = appointmentStatus === 'CONFIRMED'
  const canCheckIn = appointmentStatus === 'CONFIRMED' && sessionStatus === 'SCHEDULED'
  const canComplete = appointmentStatus === 'CHECKED_IN' && sessionStatus === 'IN_PROGRESS'
  const canRescheduleCurrentAppointment = appointmentStatus === 'CONFIRMED' && sessionStatus === 'SCHEDULED'
  const selectedStaff = staffOptions?.find((staff) => staff.id === preferredStaffId)

  const latestActionSummary = useMemo(() => {
    return cancelMutation.data ?? checkInMutation.data ?? completeMutation.data ?? rescheduleMutation.data ?? null
  }, [cancelMutation.data, checkInMutation.data, completeMutation.data, rescheduleMutation.data])

  return (
    <div className="space-y-6">
      <PageCard title="Appointment lifecycle" description="Mapped to cancel / reschedule / check-in / complete APIs in the current backend.">
        <div className="mb-5 flex flex-wrap gap-3">
          <Link
            to={appointmentId ? `/appointments/detail?appointmentId=${appointmentId}&sessionId=${sessionId}` : '/appointments/detail'}
            className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-100 hover:bg-slate-800"
          >
            Open appointment detail page
          </Link>
        </div>
        <div className="mb-4 rounded-xl border border-slate-800 bg-slate-950/40 px-4 py-3 text-xs text-slate-400">
          <p>
            Using <span className="font-mono text-slate-200">branchId={branchId ?? 'missing'}</span>,{' '}
            <span className="font-mono text-slate-200">staffId={preferredStaffId || staffId || 'optional'}</span> and{' '}
            <span className="font-mono text-slate-200">sessionId={sessionId || 'missing'}</span> from active context.
          </p>
        </div>
        {!hasBranchContext ? (
          <div className="mb-4 rounded-xl border border-amber-800 bg-amber-950/20 px-4 py-3 text-sm text-amber-200">
            Missing branch context. Please sign in with a user that belongs to a branch before using appointment lifecycle actions.
          </div>
        ) : null}

        {appointmentDetail ? (
          <div className="mb-4 rounded-xl border border-slate-800 bg-slate-950/30 p-4 text-sm text-slate-300">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-slate-400">Current status:</span>
              <StatusBadge value={appointmentDetail.status} />
              <span className="text-slate-400">Session:</span>
              <StatusBadge value={appointmentDetail.sessionStatus} />
            </div>
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm text-slate-300">Appointment ID</label>
            <input
              value={appointmentId}
              onChange={(event) => setAppointmentId(event.target.value)}
              placeholder="Paste appointment id"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm text-slate-300">Session ID</label>
            <input
              value={sessionId}
              onChange={(event) => setSessionId(event.target.value)}
              placeholder="Session id"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400"
            />
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div>
            <label className="mb-2 block text-sm text-slate-300">Cancel reason</label>
            <textarea
              value={cancelReason}
              onChange={(event) => setCancelReason(event.target.value)}
              className="min-h-24 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400"
            />
            <label className="mt-3 flex items-center gap-3 text-sm text-slate-300">
              <input type="checkbox" checked={applyRefund} onChange={(event) => setApplyRefund(event.target.checked)} />
              Apply refund
            </label>
          </div>
          <div>
            <label className="mb-2 block text-sm text-slate-300">Complete result note</label>
            <textarea
              value={completeResultNote}
              onChange={(event) => setCompleteResultNote(event.target.value)}
              className="min-h-24 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm text-slate-300">Technician for completion</label>
            <select
              value={preferredStaffId}
              onChange={(event) => setPreferredStaffId(event.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400"
            >
              <option value="">Use signed-in staff</option>
              {staffOptions?.map((staff) => (
                <option key={staff.id} value={staff.id}>
                  {staff.name}
                </option>
              ))}
            </select>
            <p className="mt-2 text-xs text-slate-500">
              {isLoadingStaff ? 'Loading active technicians...' : selectedStaff ? `Selected: ${selectedStaff.name}` : 'Optional technician override'}
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            disabled={!appointmentId || cancelMutation.isPending || !hasBranchContext || !cancelReason.trim() || !canCancel}
            onClick={() => cancelMutation.mutate(appointmentId)}
            className="rounded-xl border border-rose-700 px-4 py-3 text-sm text-rose-200 hover:bg-rose-950/30 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {cancelMutation.isPending ? 'Cancelling...' : 'Cancel appointment'}
          </button>

          <button
            type="button"
            disabled={!appointmentId || checkInMutation.isPending || !hasBranchContext || !canCheckIn}
            onClick={() => checkInMutation.mutate(appointmentId)}
            className="rounded-xl border border-amber-700 px-4 py-3 text-sm text-amber-200 hover:bg-amber-950/30 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {checkInMutation.isPending ? 'Checking in...' : 'Check-in appointment'}
          </button>

          <button
            type="button"
            disabled={!sessionId || completeMutation.isPending || !hasBranchContext || !completeResultNote.trim() || !canComplete}
            onClick={() => completeMutation.mutate(sessionId)}
            className="rounded-xl border border-emerald-700 px-4 py-3 text-sm text-emerald-200 hover:bg-emerald-950/30 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {completeMutation.isPending ? 'Completing...' : 'Complete session'}
          </button>
        </div>

        {latestActionSummary ? (
          <div className="mt-5 rounded-xl border border-cyan-800 bg-cyan-950/20 p-4 text-sm text-cyan-200">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="font-medium text-white">Latest lifecycle result</p>
              {'appointmentStatus' in latestActionSummary && typeof latestActionSummary.appointmentStatus === 'string' ? (
                <StatusBadge value={latestActionSummary.appointmentStatus} />
              ) : null}
            </div>
            <pre className="overflow-auto whitespace-pre-wrap">{JSON.stringify(latestActionSummary, null, 2)}</pre>
          </div>
        ) : null}
      </PageCard>

      <PageCard title="Reschedule flow" description="Query new slots, lock one slot, then reschedule the current appointment.">
        {!hasSessionContext ? (
          <div className="mb-4 rounded-xl border border-amber-800 bg-amber-950/20 px-4 py-3 text-sm text-amber-200">
            Missing session context. Open this page from a scheduling/treatment-plan flow or paste a valid session ID.
          </div>
        ) : null}

        {!hasValidDateRange ? (
          <div className="mb-4 rounded-xl border border-amber-800 bg-amber-950/20 px-4 py-3 text-sm text-amber-200">
            Invalid date range. `Date To` must be the same as or later than `Date From`.
          </div>
        ) : null}

        {appointmentDetail && !canRescheduleCurrentAppointment ? (
          <div className="mb-4 rounded-xl border border-amber-800 bg-amber-950/20 px-4 py-3 text-sm text-amber-200">
            This appointment is not in a reschedulable state. Only confirmed appointments with scheduled sessions can be rescheduled.
          </div>
        ) : null}

        <div className="mb-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <label className="mb-2 block text-sm text-slate-300">Preferred Staff</label>
            <select
              value={preferredStaffId}
              onChange={(event) => setPreferredStaffId(event.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400"
            >
              <option value="">No preference</option>
              {staffOptions?.map((staff) => (
                <option key={staff.id} value={staff.id}>
                  {staff.name}
                </option>
              ))}
            </select>
            <p className="mt-2 text-xs text-slate-500">
              {isLoadingStaff ? 'Loading active technicians...' : selectedStaff ? `Selected: ${selectedStaff.name}` : 'Optional technician preference'}
            </p>
          </div>
          <div>
            <label className="mb-2 block text-sm text-slate-300">Date From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(event) => setDateFrom(event.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm text-slate-300">Date To</label>
            <input
              type="date"
              value={dateTo}
              onChange={(event) => setDateTo(event.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm text-slate-300">Reschedule reason</label>
            <input
              value={rescheduleReason}
              onChange={(event) => setRescheduleReason(event.target.value)}
              placeholder="Reason for rescheduling"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => queryMutation.mutate()}
            disabled={!hasBranchContext || !hasSessionContext || !hasValidDateRange || !canRescheduleCurrentAppointment}
            className="rounded-xl bg-cyan-400 px-4 py-3 text-sm font-medium text-slate-950 hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Query new slots
          </button>

          {selectedSlot ? (
            <button
              type="button"
              disabled={lockMutation.isPending || !hasBranchContext || !hasSessionContext || !canRescheduleCurrentAppointment}
              onClick={() => lockMutation.mutate(selectedSlot.slotId)}
              className="rounded-xl border border-slate-700 px-4 py-3 text-sm text-slate-100 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {lockMutation.isPending ? 'Locking...' : 'Lock selected slot'}
            </button>
          ) : null}

          {canReschedule && selectedSlot && lockInfo ? (
            <button
              type="button"
              disabled={rescheduleMutation.isPending || !hasBranchContext || !hasSessionContext || !rescheduleReason.trim() || !canRescheduleCurrentAppointment}
              onClick={() => rescheduleMutation.mutate({ appointmentId, lockId: lockInfo.lockId, slotId: selectedSlot.slotId })}
              className="rounded-xl bg-emerald-400 px-4 py-3 text-sm font-medium text-slate-950 hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {rescheduleMutation.isPending ? 'Rescheduling...' : 'Submit reschedule'}
            </button>
          ) : null}

          <button
            type="button"
            onClick={() => {
              setSelectedSlot(null)
              setLockInfo(null)
              setRemainingSeconds(null)
            }}
            className="rounded-xl border border-slate-700 px-4 py-3 text-sm text-slate-100 hover:bg-slate-800"
          >
            Reset reschedule state
          </button>
        </div>

        {lockInfo ? (
          <div className="mt-4 rounded-xl border border-emerald-800 bg-emerald-950/30 p-4 text-sm text-emerald-300">
            <p>Lock ID: {lockInfo.lockId}</p>
            <p>Expires at: {new Date(lockInfo.expiresAt).toLocaleString()}</p>
            <p>Remaining seconds: {remainingSeconds ?? 0}</p>
          </div>
        ) : null}

        {remainingSeconds === 0 ? (
          <div className="mt-4 rounded-xl border border-amber-800 bg-amber-950/20 px-4 py-3 text-sm text-amber-200">
            The previous reschedule lock has expired. Query and lock a slot again.
          </div>
        ) : null}

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {slots.map((slot) => {
            const isSelected = selectedSlot?.slotId === slot.slotId
            return (
              <button
                key={slot.slotId}
                type="button"
                onClick={() => setSelectedSlot(slot)}
                className={`rounded-2xl border p-5 text-left transition ${isSelected ? 'border-cyan-400 bg-cyan-950/20' : 'border-slate-800 bg-slate-900/50 hover:border-slate-700'}`}
              >
                <p className="text-sm text-slate-400">{slot.slotId}</p>
                <h3 className="mt-2 text-lg font-semibold text-white">{slot.staffName} · {slot.roomName}</h3>
                <p className="mt-2 text-sm text-slate-300">
                  {new Date(slot.startTime).toLocaleString()} → {new Date(slot.endTime).toLocaleString()}
                </p>
              </button>
            )
          })}
        </div>
      </PageCard>
    </div>
  )
}
