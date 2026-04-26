import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { PageCard } from '@/components/ui/PageCard'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { SchedulingResultCard } from '@/features/scheduling/components/SchedulingResultCard'
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

async function scheduleSession(
  branchId: string,
  sessionId: string,
  payload: { slotId: string; lockId: string; overrideGapRule: boolean; overrideReason: string | null },
) {
  const response = await api.post<ApiResponse<ScheduleSessionResponse>>(
    `/sessions/${sessionId}/schedule`,
    {
      branchId,
      lockId: payload.lockId,
      slotId: payload.slotId,
      overrideGapRule: payload.overrideGapRule,
      overrideReason: payload.overrideReason,
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
  const { user } = useAuth()
  const branchId = user?.branchId
  const staffId = user?.staffId
  const role = user?.role
  const canScheduleSessions = ['OWNER', 'MANAGER', 'RECEPTIONIST'].includes(role ?? '')
  const [sessionId, setSessionId] = useState(searchParams.get('sessionId') ?? persistedFlow?.sessionId ?? '')
  const [preferredStaffId, setPreferredStaffId] = useState(staffId ?? '')
  const [dateFrom, setDateFrom] = useState(getTodayDateInput())
  const [dateTo, setDateTo] = useState(getDateOffsetInput(2))
  const [overrideGapRule, setOverrideGapRule] = useState(false)
  const [overrideReason, setOverrideReason] = useState('')

  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null)
  const [lastLock, setLastLock] = useState<SchedulingLockResponse | null>(null)
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null)
  const [scheduledResult, setScheduledResult] = useState<ScheduleSessionResponse | null>(null)

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

  const queryMutation = useMutation({
    mutationFn: () => querySlots(branchId!, { sessionId, preferredStaffId, dateFrom, dateTo }),
    onSuccess: () => {
      setSelectedSlot(null)
      setLastLock(null)
      setScheduledResult(null)
      setRemainingSeconds(null)
    },
  })

  const lockMutation = useMutation({
    mutationFn: (slotId: string) => lockSlot(branchId!, sessionId, slotId),
    onSuccess: (data) => {
      setLastLock(data)
      setScheduledResult(null)
    },
  })

  const scheduleMutation = useMutation({
    mutationFn: (payload: { slotId: string; lockId: string }) =>
      scheduleSession(branchId!, sessionId, {
        ...payload,
        overrideGapRule,
        overrideReason: overrideGapRule ? overrideReason || null : null,
      }),
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
      const seconds = Math.max(0, Math.ceil(diffMs / 1000))
      setRemainingSeconds(seconds)
      if (seconds === 0) {
        setLastLock(null)
      }
    }

    tick()
    const intervalId = window.setInterval(tick, 1000)
    return () => window.clearInterval(intervalId)
  }, [lastLock])

  const slots = queryMutation.data?.slots ?? []
  const canSchedule = Boolean(selectedSlot && lastLock && (remainingSeconds ?? 0) > 0)
  const hasRequiredContext = Boolean(branchId && sessionId)
  const hasValidDateRange = Boolean(dateFrom && dateTo && dateFrom <= dateTo)
  const selectedStaff = staffOptions?.find((staff) => staff.id === preferredStaffId)

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
        <div className="mb-4 rounded-xl border border-slate-800 bg-slate-950/40 px-4 py-3 text-xs text-slate-400">
          <p>
            Using <span className="font-mono text-slate-200">branchId={branchId ?? 'missing'}</span>,{' '}
            <span className="font-mono text-slate-200">staffId={preferredStaffId || 'optional'}</span> and{' '}
            <span className="font-mono text-slate-200">sessionId={sessionId || 'missing'}</span> for scheduling calls on this screen.
          </p>
        </div>

        {!canScheduleSessions ? (
          <div className="mb-4 rounded-xl border border-amber-800 bg-amber-950/20 px-4 py-3 text-sm text-amber-200">
            Your role does not have permission to query, lock, or schedule sessions.
          </div>
        ) : null}

        {!hasRequiredContext ? (
          <div className="mb-4 rounded-xl border border-amber-800 bg-amber-950/20 px-4 py-3 text-sm text-amber-200">
            Missing scheduling context. Please open this page from Treatment Plan detail or ensure the signed-in user has a branch.
          </div>
        ) : null}

        {!hasValidDateRange ? (
          <div className="mb-4 rounded-xl border border-amber-800 bg-amber-950/20 px-4 py-3 text-sm text-amber-200">
            Invalid date range. `Date To` must be the same as or later than `Date From`.
          </div>
        ) : null}

        <div className="mb-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <label className="mb-2 block text-sm text-slate-300">Session ID</label>
            <input
              value={sessionId}
              onChange={(event) => setSessionId(event.target.value)}
              placeholder="Session ID"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400"
            />
          </div>
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
        </div>

        <div className="mb-5 rounded-xl border border-slate-800 bg-slate-950/30 p-4">
          <label className="flex items-center gap-3 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={overrideGapRule}
              onChange={(event) => setOverrideGapRule(event.target.checked)}
            />
            Override gap rule when scheduling
          </label>
          {overrideGapRule ? (
            <div className="mt-3">
              <label className="mb-2 block text-sm text-slate-300">Override Reason</label>
              <textarea
                value={overrideReason}
                onChange={(event) => setOverrideReason(event.target.value)}
                placeholder="Explain why the gap rule should be overridden"
                className="min-h-24 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400"
              />
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => queryMutation.mutate()}
            disabled={!canScheduleSessions || !hasRequiredContext || !hasValidDateRange}
            className="rounded-xl bg-cyan-400 px-4 py-3 text-sm font-medium text-slate-950 hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Query available slots
          </button>

          {selectedSlot ? (
            <button
              type="button"
              onClick={() => lockMutation.mutate(selectedSlot.slotId)}
              disabled={!canScheduleSessions || lockMutation.isPending || !hasRequiredContext}
              className="rounded-xl border border-slate-700 px-4 py-3 text-sm text-slate-100 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {lockMutation.isPending ? 'Locking...' : 'Lock selected slot'}
            </button>
          ) : null}

          {canSchedule && selectedSlot && lastLock ? (
            <button
              type="button"
              onClick={() => scheduleMutation.mutate({ slotId: selectedSlot.slotId, lockId: lastLock.lockId })}
              disabled={!canScheduleSessions || scheduleMutation.isPending || !hasRequiredContext || (overrideGapRule && !overrideReason.trim())}
              className="rounded-xl bg-emerald-400 px-4 py-3 text-sm font-medium text-slate-950 hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {scheduleMutation.isPending ? 'Scheduling...' : 'Schedule session'}
            </button>
          ) : null}

          <button
            type="button"
            onClick={() => {
              setSelectedSlot(null)
              setLastLock(null)
              setScheduledResult(null)
              setRemainingSeconds(null)
            }}
            className="rounded-xl border border-slate-700 px-4 py-3 text-sm text-slate-100 hover:bg-slate-800"
          >
            Reset selection
          </button>
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

        {remainingSeconds === 0 ? (
          <div className="mt-4 rounded-xl border border-amber-800 bg-amber-950/20 px-4 py-3 text-sm text-amber-200">
            The previous slot lock has expired. Please query or lock again before scheduling.
          </div>
        ) : null}

        {scheduledResult ? <SchedulingResultCard result={scheduledResult} /> : null}
      </PageCard>

      <PageCard title="Slots" description="Select one slot, then lock and schedule it.">
        {slots.length === 0 && !queryMutation.isPending ? <p className="text-slate-400">No slots loaded yet. Query first to see available options.</p> : null}
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
    </div>
  )
}
