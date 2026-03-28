import { useEffect, useMemo, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { PageCard } from '@/components/ui/PageCard'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { SchedulingResultCard } from '@/features/scheduling/components/SchedulingResultCard'
import { api } from '@/lib/api'
import { appointmentFlowStorage } from '@/lib/appointment-flow-storage'
import { createRequestId } from '@/lib/request-id'
import type { ApiResponse, AvailableSlot, ScheduleSessionResponse, SchedulingLockResponse } from '@/types/api'

const DEFAULT_BRANCH_ID = import.meta.env.VITE_DEFAULT_BRANCH_ID ?? '11111111-1111-1111-1111-111111111111'
const DEFAULT_SESSION_ID = import.meta.env.VITE_DEFAULT_SESSION_ID ?? '88888888-8888-8888-8888-888888888888'
const DEFAULT_STAFF_ID = import.meta.env.VITE_DEFAULT_STAFF_ID ?? '22222222-2222-2222-2222-222222222222'

async function querySlots(sessionId: string) {
  const response = await api.post<ApiResponse<{ sessionId: string; slots: AvailableSlot[] }>>('/scheduling/slots/query', {
    branchId: DEFAULT_BRANCH_ID,
    sessionId,
    preferredStaffId: DEFAULT_STAFF_ID,
    dateFrom: '2026-04-15',
    dateTo: '2026-04-17',
  })
  return response.data.data
}

async function lockSlot(sessionId: string, slotId: string) {
  const response = await api.post<ApiResponse<SchedulingLockResponse>>('/scheduling/slots/lock', {
    branchId: DEFAULT_BRANCH_ID,
    sessionId,
    slotId,
  })
  return response.data.data
}

async function scheduleSession(sessionId: string, payload: { slotId: string; lockId: string }) {
  const response = await api.post<ApiResponse<ScheduleSessionResponse>>(
    `/sessions/${sessionId}/schedule`,
    {
      branchId: DEFAULT_BRANCH_ID,
      lockId: payload.lockId,
      slotId: payload.slotId,
      overrideGapRule: false,
      overrideReason: null,
    },
    {
      headers: {
        'X-Request-Id': createRequestId('schedule'),
      },
    },
  )
  return response.data.data
}

export function SchedulingPage() {
  const [searchParams] = useSearchParams()
  const persistedFlow = appointmentFlowStorage.get()
  const [sessionId] = useState(
    searchParams.get('sessionId') ?? persistedFlow?.sessionId ?? DEFAULT_SESSION_ID,
  )

  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null)
  const [lastLock, setLastLock] = useState<SchedulingLockResponse | null>(null)
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null)
  const [scheduledResult, setScheduledResult] = useState<ScheduleSessionResponse | null>(null)

  const queryMutation = useMutation({
    mutationFn: () => querySlots(sessionId),
    onSuccess: () => {
      setSelectedSlot(null)
      setLastLock(null)
      setScheduledResult(null)
      setRemainingSeconds(null)
    },
  })

  const lockMutation = useMutation({
    mutationFn: (slotId: string) => lockSlot(sessionId, slotId),
    onSuccess: (data) => {
      setLastLock(data)
      setScheduledResult(null)
    },
  })

  const scheduleMutation = useMutation({
    mutationFn: (payload: { slotId: string; lockId: string }) => scheduleSession(sessionId, payload),
    onSuccess: (data) => {
      setScheduledResult(data)
      appointmentFlowStorage.set({
        appointmentId: data.appointmentId,
        sessionId: data.sessionId,
      })
    },
  })

  useEffect(() => {
    if (!lastLock) {
      setRemainingSeconds(null)
      return
    }

    const tick = () => {
      const diffMs = new Date(lastLock.expiresAt).getTime() - Date.now()
      setRemainingSeconds(Math.max(0, Math.ceil(diffMs / 1000)))
    }

    tick()
    const intervalId = window.setInterval(tick, 1000)
    return () => window.clearInterval(intervalId)
  }, [lastLock])

  const slots = queryMutation.data?.slots ?? []
  const canSchedule = Boolean(selectedSlot && lastLock && (remainingSeconds ?? 0) > 0)

  const selectedSummary = useMemo(() => {
    if (!selectedSlot) {
      return null
    }

    return {
      window: `${new Date(selectedSlot.startTime).toLocaleString()} → ${new Date(selectedSlot.endTime).toLocaleString()}`,
      resourceSummary: `${selectedSlot.staffName} · ${selectedSlot.roomName}`,
    }
  }, [selectedSlot])

  return (
    <div className="space-y-6">
      <PageCard title="Scheduling Playground" description="End-to-end FE mapping for query → lock → schedule session.">
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => queryMutation.mutate()}
            className="rounded-xl bg-cyan-400 px-4 py-3 text-sm font-medium text-slate-950 hover:bg-cyan-300"
          >
            Query available slots
          </button>

          {selectedSlot ? (
            <button
              type="button"
              onClick={() => lockMutation.mutate(selectedSlot.slotId)}
              disabled={lockMutation.isPending}
              className="rounded-xl border border-slate-700 px-4 py-3 text-sm text-slate-100 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {lockMutation.isPending ? 'Locking...' : 'Lock selected slot'}
            </button>
          ) : null}

          {canSchedule && selectedSlot && lastLock ? (
            <button
              type="button"
              onClick={() => scheduleMutation.mutate({ slotId: selectedSlot.slotId, lockId: lastLock.lockId })}
              disabled={scheduleMutation.isPending}
              className="rounded-xl bg-emerald-400 px-4 py-3 text-sm font-medium text-slate-950 hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {scheduleMutation.isPending ? 'Scheduling...' : 'Schedule session'}
            </button>
          ) : null}
        </div>

        {queryMutation.isPending ? <p className="mt-4 text-slate-400">Querying slots...</p> : null}
        {queryMutation.isError ? <p className="mt-4 text-rose-400">Failed to query slots.</p> : null}
        {lockMutation.isError ? <p className="mt-4 text-rose-400">Failed to lock slot.</p> : null}
        {scheduleMutation.isError ? <p className="mt-4 text-rose-400">Failed to schedule session.</p> : null}

        {selectedSummary ? (
          <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/40 p-4 text-sm text-slate-300">
            <p className="font-medium text-white">Selected slot</p>
            <p className="mt-1">{selectedSummary.resourceSummary}</p>
            <p className="mt-1 text-slate-400">{selectedSummary.window}</p>
          </div>
        ) : null}

        {lastLock ? (
          <div className="mt-4 rounded-xl border border-emerald-800 bg-emerald-950/30 p-4 text-sm text-emerald-300">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p>Lock ID: {lastLock.lockId}</p>
                <p>Expires at: {new Date(lastLock.expiresAt).toLocaleString()}</p>
                <p>Remaining seconds: {remainingSeconds ?? 0}</p>
              </div>
              <StatusBadge value={(remainingSeconds ?? 0) > 0 ? 'CONFIRMED' : 'CANCELLED'} />
            </div>
          </div>
        ) : null}

        {scheduledResult ? <SchedulingResultCard result={scheduledResult} /> : null}
      </PageCard>

      <PageCard title="Slots" description="Select one slot, then lock and schedule it.">
        <div className="grid gap-4 md:grid-cols-2">
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
                <p className="mt-3 text-sm text-slate-400">Equipment: {slot.equipment.length || 0}</p>
              </button>
            )
          })}
        </div>
      </PageCard>

      <PageCard title="Current FE notes" description="Current scheduling state and operator reminders.">
        <ul className="space-y-2 text-sm text-slate-300">
          <li>- After schedule succeeds, keep the returned appointment ID for cancel/reschedule/check-in flows.</li>
          <li>- The backend requires `X-Request-Id` for write APIs like schedule/cancel/reschedule/check-in/complete.</li>
          <li>- If lock countdown reaches 0, query + lock again before scheduling.</li>
        </ul>
      </PageCard>
    </div>
  )
}
