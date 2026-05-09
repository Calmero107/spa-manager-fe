import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { PageCard } from '@/components/ui/PageCard'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { createRoom, getRooms, updateRoom } from '@/features/resource/services/room.api'

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  status: z.string().min(1, 'Status is required'),
})

type FormValues = z.infer<typeof schema>
const statuses = ['ACTIVE', 'INACTIVE'] as const

export function RoomManagementPage() {
  const { user } = useAuth()
  const branchId = user?.branchId
  const queryClient = useQueryClient()
  const [selectedRoomId, setSelectedRoomId] = useState('')

  const roomsQuery = useQuery({ queryKey: ['room-management', branchId], queryFn: () => getRooms(branchId!), enabled: Boolean(branchId) })
  const createForm = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { name: '', status: 'ACTIVE' } })
  const updateForm = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { name: '', status: 'ACTIVE' } })
  const refresh = async () => queryClient.invalidateQueries({ queryKey: ['room-management', branchId] })

  const createMutation = useMutation({ mutationFn: (values: FormValues) => createRoom({ branchId: branchId!, ...values }), onSuccess: async (room) => { await refresh(); setSelectedRoomId(room.id); createForm.reset({ name: '', status: 'ACTIVE' }); updateForm.reset({ name: room.name, status: room.status }) } })
  const updateMutation = useMutation({ mutationFn: (values: FormValues) => updateRoom(selectedRoomId, { branchId: branchId!, ...values }), onSuccess: async (room) => { await refresh(); updateForm.reset({ name: room.name, status: room.status }) } })
  const selectedRoom = roomsQuery.data?.find((item) => item.id === selectedRoomId)

  return (
    <div className="space-y-6">
      <PageCard title="Room management" description="Create and update rooms for the active branch.">
        <div className="mb-4 rounded-xl border border-slate-800 bg-slate-950/40 px-4 py-3 text-xs text-slate-400">Using <span className="font-mono text-slate-200">branchId={branchId ?? 'missing'}</span>.</div>
        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            {roomsQuery.data?.map((room) => (
              <button key={room.id} type="button" onClick={() => { setSelectedRoomId(room.id); updateForm.reset({ name: room.name, status: room.status }) }} className={`w-full rounded-2xl border p-5 text-left transition ${selectedRoomId === room.id ? 'border-cyan-400 bg-cyan-950/20' : 'border-slate-800 bg-slate-900/50 hover:border-slate-700'}`}>
                <div className="flex items-start justify-between gap-3"><div><h3 className="text-lg font-semibold text-white">{room.name}</h3><p className="mt-1 text-sm text-slate-400">{room.id}</p></div><StatusBadge value={room.status} /></div>
              </button>
            ))}
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950/30 p-4 text-sm text-slate-300"><p className="font-medium text-white">Selected room</p>{selectedRoom ? <p className="mt-2">{selectedRoom.name}</p> : <p className="mt-2 text-slate-400">Select a room to edit.</p>}</div>
        </div>
      </PageCard>

      <div className="grid gap-6 xl:grid-cols-2">
        <PageCard title="Create room" description="Add a new room resource.">
          <form className="space-y-4" onSubmit={createForm.handleSubmit((values) => createMutation.mutate(values))}>
            <input {...createForm.register('name')} placeholder="Room name" className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400" />
            <select {...createForm.register('status')} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400">{statuses.map((status) => <option key={status} value={status}>{status}</option>)}</select>
            {createMutation.isError ? <p className="text-sm text-rose-400">Failed to create room.</p> : null}
            <button type="submit" disabled={createMutation.isPending || !branchId} className="w-full rounded-xl bg-cyan-400 px-4 py-3 font-medium text-slate-950 hover:bg-cyan-300 disabled:opacity-60">{createMutation.isPending ? 'Creating...' : 'Create room'}</button>
          </form>
        </PageCard>
        <PageCard title="Update room" description="Update the selected room resource.">
          <form className="space-y-4" onSubmit={updateForm.handleSubmit((values) => updateMutation.mutate(values))}>
            <input {...updateForm.register('name')} placeholder="Room name" className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400" />
            <select {...updateForm.register('status')} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400">{statuses.map((status) => <option key={status} value={status}>{status}</option>)}</select>
            {updateMutation.isError ? <p className="text-sm text-rose-400">Failed to update room.</p> : null}
            {updateMutation.isSuccess ? <p className="text-sm text-emerald-300">Room updated successfully.</p> : null}
            <button type="submit" disabled={updateMutation.isPending || !selectedRoomId} className="w-full rounded-xl bg-emerald-400 px-4 py-3 font-medium text-slate-950 hover:bg-emerald-300 disabled:opacity-60">{updateMutation.isPending ? 'Saving...' : 'Save room changes'}</button>
          </form>
        </PageCard>
      </div>
    </div>
  )
}
