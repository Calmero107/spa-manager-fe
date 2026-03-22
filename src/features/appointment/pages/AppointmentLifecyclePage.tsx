import { useEffect, useMemo, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { PageCard } from '@/components/ui/PageCard'
import { api } from '@/lib/api'
import { createRequestId } from '@/lib/request-id'
import type { ApiResponse, AvailableSlot, ScheduleSessionResponse, SchedulingLockResponse } from '@/types/api'

const DEFAULT_BRANCH_ID = import.meta.env.VITE_DEFAULT_BRANCH_ID ?? '11111111-1111-1111-1111-111111111111'
const DEFAULT_SESSION_ID = import.meta.env.VITE_DEFAULT_SESSION_ID ?? '88888888-8888-8888-8888-888888888888'
const DEFAULT_STAFF_ID = import.meta.env.VITE_DEFAULT_STAFF_ID ?? '22222222-2222-2222-2222-222222222222'

async function querySlots() {
  const response = await api.post<ApiResponse<{ sessionId: string; slots: AvailableSlot[] }>>('/scheduling/slots/query', {
    branchId: DEFAULT_BRANCH_ID,
    sessionId: DEFAULT_SESSION_ID,
    preferredStaffId: DEFAULT_STAFF_ID,
    dateFrom: '2026-04-15',
    dateTo: '2026-04-17',
  })
  return response.data.data
}

async function lockSlot(slotId: string) {
  const response = await api.post<ApiResponse<SchedulingLockResponse>>('/scheduling/slots/lock', {
    branchId: DEFAULT_BRANCH_ID,
    sessionId: DEFAULT_SESSION_ID,
    slotId,
  })
  return response.data.data
}

async function cancelAppointment(appointmentId: string) {
  const response = await api.post<ApiResponse<{ appointmentId: string; appointmentStatus: string; sessionStatus: string }>>(
    `/appointments/${appointmentId}/cancel`,
    {
      branchId: DEFAULT_BRANCH_ID,
      reason: 'customer requested cancel',
      applyRefund: false,
    },
    {
      headers: {
        'X-Request-Id': createRequestId('cancel'),
      },
    },
  )
  return response.data.data
}

async function checkInAppointment(appointmentId: string) {
  const response = await api.post<ApiResponse<{ appointmentId: string; appointmentStatus: string; sessionStatus: string }>>(
    `/appointments/${appointmentId}/check-in`,
    { branchId: DEFAULT_BRANCH_ID },
    {
      headers: {
        'X-Request-Id': createRequestId('checkin'),
      },
    },
  )
  return response.data.data
}

async function completeSession(sessionId: string) {
  const response = await api.post<ApiResponse<{ sessionId: string; sessionStatus: string; appointmentStatus: string }>>(
    `/sessions/${sessionId}/complete`,
    {
      branchId: DEFAULT_BRANCH_ID,
      technicianId: DEFAULT_STAFF_ID,
      resultNote: 'treatment completed successfully',
    },
    {
      headers: {
        'X-Request-Id': createRequestId('complete'),
      },
    },
  )
  return response.data.data
}

async function rescheduleAppointment(payload: { appointmentId: string; lockId: string; slotId: string }) {
  const response = await api.post<ApiResponse<ScheduleSessionResponse & { appointmentStatus?: string; sessionStatus?: string }>>(
    `/appointments/${payload.appointmentId}/reschedule`,
    {
      branchId: DEFAULT_BRANCH_ID,
      newLockId: payload.lockId,
      newSlotId: payload.slotId,
      reason: 'customer requested change',
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
  const [appointmentId, setAppointmentId] = useState(searchParams.get('appointmentId') ?? '')
  const [sessionId, setSessionId] = useState(searchParams.get('sessionId') ?? DEFAULT_SESSION_ID)
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null)
  const [lockInfo, setLockInfo] = useState<SchedulingLockResponse | null>(null)
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null)

  useEffect(() => {
    const next = new URLSearchParams(searchParams)
    if (appointmentId) next.set('appointmentId', appointmentId)
    if (sessionId) next.set('sessionId', sessionId)
    setSearchParams(next, { replace: true })
  }, [appointmentId, searchParams, sessionId, setSearchParams])

  const cancelMutation = useMutation({ mutationFn: cancelAppointment })
  const checkInMutation = useMutation({ mutationFn: checkInAppointment })
  const completeMutation = useMutation({ mutationFn: completeSession })

  const queryMutation = useMutation({
    mutationFn: querySlots,
    onSuccess: () => {
      setSelectedSlot(null)
      setLockInfo(null)
      setRemainingSeconds(null)
    },
  })

  const lockMutation = useMutation({
    mutationFn: lockSlot,
    onSuccess: (data) => setLockInfo(data),
  })

  const rescheduleMutation = useMutation({
    mutationFn: rescheduleAppointment,
    onSuccess: (data) => {
      setAppointmentId(data.appointmentId)
      setSessionId(data.sessionId)
    },
  })

  useEffect(() => {
    if (!lockInfo) {
      setRemainingSeconds(null)
      return
    }

    const tick = () => {
      const diffMs = new Date(lockInfo.expiresAt).getTime() - Date.now()
      setRemainingSeconds(Math.max(0, Math.ceil(diffMs / 1000)))
    }

    tick()
    const intervalId = window.setInterval(tick, 1000)
    return () => window.clearInterval(intervalId)
  }, [lockInfo])

  const slots = queryMutation.data?.slots ?? []
  const canReschedule = Boolean(appointmentId && selectedSlot && lockInfo && (remainingSeconds ?? 0) > 0)

  const latestActionSummary = useMemo(() => {
    return cancelMutation.data ?? checkInMutation.data ?? completeMutation.data ?? rescheduleMutation.data ?? null
  }, [cancelMutation.data, checkInMutation.data, completeMutation.data, rescheduleMutation.data])

  return (
    <div className="space-y-6">
      <PageCard title="Appointment lifecycle" description="Mapped to cancel / reschedule / check-in / complete APIs in the current backend.">
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

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            disabled={!appointmentId || cancelMutation.isPending}
            onClick={() => cancelMutation.mutate(appointmentId)}
            className="rounded-xl border border-rose-700 px-4 py-3 text-sm text-rose-200 hover:bg-rose-950/30 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {cancelMutation.isPending ? 'Cancelling...' : 'Cancel appointment'}
          </button>

          <button
            type="button"
            disabled={!appointmentId || checkInMutation.isPending}
            onClick={() => checkInMutation.mutate(appointmentId)}
            className="rounded-xl border border-amber-700 px-4 py-3 text-sm text-amber-200 hover:bg-amber-950/30 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {checkInMutation.isPending ? 'Checking in...' : 'Check-in appointment'}
          </button>

          <button
            type="button"
            disabled={!sessionId || completeMutation.isPending}
            onClick={() => completeMutation.mutate(sessionId)}
            className="rounded-xl border border-emerald-700 px-4 py-3 text-sm text-emerald-200 hover:bg-emerald-950/30 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {completeMutation.isPending ? 'Completing...' : 'Complete session'}
          </button>
        </div>

        {latestActionSummary ? (
          <div className="mt-5 rounded-xl border border-cyan-800 bg-cyan-950/20 p-4 text-sm text-cyan-200">
            <pre className="overflow-auto whitespace-pre-wrap">{JSON.stringify(latestActionSummary, null, 2)}</pre>
          </div>
        ) : null}
      </PageCard>

      <PageCard title="Reschedule flow" description="Query new slots, lock one slot, then reschedule the current appointment.">
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => queryMutation.mutate()}
            className="rounded-xl bg-cyan-400 px-4 py-3 text-sm font-medium text-slate-950 hover:bg-cyan-300"
          >
            Query new slots
          </button>

          {selectedSlot ? (
            <button
              type="button"
              disabled={lockMutation.isPending}
              onClick={() => lockMutation.mutate(selectedSlot.slotId)}
              className="rounded-xl border border-slate-700 px-4 py-3 text-sm text-slate-100 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {lockMutation.isPending ? 'Locking...' : 'Lock selected slot'}
            </button>
          ) : null}

          {canReschedule && selectedSlot && lockInfo ? (
            <button
              type="button"
              disabled={rescheduleMutation.isPending}
              onClick={() => rescheduleMutation.mutate({ appointmentId, lockId: lockInfo.lockId, slotId: selectedSlot.slotId })}
              className="rounded-xl bg-emerald-400 px-4 py-3 text-sm font-medium text-slate-950 hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {rescheduleMutation.isPending ? 'Rescheduling...' : 'Submit reschedule'}
            </button>
          ) : null}
        </div>

        {lockInfo ? (
          <div className="mt-4 rounded-xl border border-emerald-800 bg-emerald-950/30 p-4 text-sm text-emerald-300">
            <p>Lock ID: {lockInfo.lockId}</p>
            <p>Expires at: {new Date(lockInfo.expiresAt).toLocaleString()}</p>
            <p>Remaining seconds: {remainingSeconds ?? 0}</p>
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
