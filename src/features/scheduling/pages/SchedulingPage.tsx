import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { PageCard } from '@/components/ui/PageCard'
import { api } from '@/lib/api'
import type { ApiResponse, AvailableSlot } from '@/types/api'

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
  const response = await api.post<ApiResponse<{ lockId: string; expiresAt: string }>>('/scheduling/slots/lock', {
    branchId: DEFAULT_BRANCH_ID,
    sessionId: DEFAULT_SESSION_ID,
    slotId,
  })
  return response.data.data
}

export function SchedulingPage() {
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null)
  const [lastLock, setLastLock] = useState<{ lockId: string; expiresAt: string } | null>(null)

  const queryMutation = useMutation({ mutationFn: querySlots })
  const lockMutation = useMutation({
    mutationFn: lockSlot,
    onSuccess: (data) => setLastLock(data),
  })

  const slots = queryMutation.data?.slots ?? []

  return (
    <div className="space-y-6">
      <PageCard title="Scheduling Playground" description="Mapped to current backend scheduling APIs.">
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => queryMutation.mutate()}
            className="rounded-xl bg-cyan-400 px-4 py-3 text-sm font-medium text-slate-950 hover:bg-cyan-300"
          >
            Query available slots
          </button>
          {selectedSlotId ? (
            <button
              type="button"
              onClick={() => lockMutation.mutate(selectedSlotId)}
              className="rounded-xl border border-slate-700 px-4 py-3 text-sm text-slate-100 hover:bg-slate-800"
            >
              Lock selected slot
            </button>
          ) : null}
        </div>

        {queryMutation.isPending ? <p className="mt-4 text-slate-400">Querying slots...</p> : null}
        {queryMutation.isError ? <p className="mt-4 text-rose-400">Failed to query slots.</p> : null}
        {lockMutation.isError ? <p className="mt-4 text-rose-400">Failed to lock slot.</p> : null}
        {lastLock ? (
          <div className="mt-4 rounded-xl border border-emerald-800 bg-emerald-950/30 p-4 text-sm text-emerald-300">
            <p>Lock ID: {lastLock.lockId}</p>
            <p>Expires at: {new Date(lastLock.expiresAt).toLocaleString()}</p>
          </div>
        ) : null}
      </PageCard>

      <PageCard title="Slots" description="Select one slot, then lock it.">
        <div className="grid gap-4 md:grid-cols-2">
          {slots.map((slot) => (
            <button
              key={slot.slotId}
              type="button"
              onClick={() => setSelectedSlotId(slot.slotId)}
              className={`rounded-2xl border p-5 text-left transition ${selectedSlotId === slot.slotId ? 'border-cyan-400 bg-cyan-950/20' : 'border-slate-800 bg-slate-900/50 hover:border-slate-700'}`}
            >
              <p className="text-sm text-slate-400">{slot.slotId}</p>
              <h3 className="mt-2 text-lg font-semibold text-white">{slot.staffName} · {slot.roomName}</h3>
              <p className="mt-2 text-sm text-slate-300">
                {new Date(slot.startTime).toLocaleString()} → {new Date(slot.endTime).toLocaleString()}
              </p>
              <p className="mt-3 text-sm text-slate-400">Equipment: {slot.equipment.length || 0}</p>
            </button>
          ))}
        </div>
      </PageCard>
    </div>
  )
}
