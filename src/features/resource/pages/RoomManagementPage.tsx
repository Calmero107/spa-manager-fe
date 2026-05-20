import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { PageCard } from '@/components/ui/PageCard'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { ErrorAlert } from '@/components/ui/ErrorAlert'
import { Tabs } from '@/components/ui/Tabs'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { createRoom, getRooms, updateRoom } from '@/features/resource/services/room.api'

const schema = z.object({ name: z.string().min(1, 'Vui lòng nhập tên phòng'), status: z.string().min(1, 'Vui lòng chọn trạng thái') })
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
    <div className="space-y-8">
      <PageCard title="Quản lý phòng">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-3">
            {roomsQuery.data?.map((room) => (
              <button key={room.id} type="button" onClick={() => { setSelectedRoomId(room.id); updateForm.reset({ name: room.name, status: room.status }) }}
                className={`w-full rounded-2xl border p-5 text-left transition ${selectedRoomId === room.id ? 'border-cyan-500 bg-cyan-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                <div className="flex items-start justify-between gap-3"><h3 className="text-base font-semibold text-slate-900">{room.name}</h3><StatusBadge value={room.status} /></div>
              </button>
            ))}
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm">
            <p className="font-semibold text-slate-900">Phòng đang chọn</p>
            {selectedRoom ? <p className="mt-2 text-slate-600">{selectedRoom.name}</p> : <p className="mt-2 text-slate-500">Chọn phòng để chỉnh sửa.</p>}
          </div>
        </div>
      </PageCard>

      <PageCard title="Thao tác phòng">
        <Tabs tabs={[
          { key: 'create', label: 'Thêm mới', content: (
            <form className="space-y-4" onSubmit={createForm.handleSubmit((values) => createMutation.mutate(values))}>
              <div><label className="mb-2 block text-sm font-medium text-slate-700">Tên phòng</label><input {...createForm.register('name')} placeholder="Nhập tên phòng" className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600" /></div>
              <div><label className="mb-2 block text-sm font-medium text-slate-700">Trạng thái</label><select {...createForm.register('status')} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600">{statuses.map((s) => <option key={s} value={s}>{s === 'ACTIVE' ? 'Hoạt động' : 'Ngưng hoạt động'}</option>)}</select></div>
              {createMutation.isError ? <ErrorAlert message="Thêm phòng thất bại." /> : null}
              <button type="submit" disabled={createMutation.isPending || !branchId} className="w-full rounded-xl bg-cyan-600 px-4 py-3.5 font-semibold text-white transition hover:bg-cyan-700 disabled:opacity-60">{createMutation.isPending ? 'Đang tạo...' : 'Thêm phòng'}</button>
            </form>
          )},
          { key: 'update', label: 'Chỉnh sửa', disabled: !selectedRoomId, content: (
            <form className="space-y-4" onSubmit={updateForm.handleSubmit((values) => updateMutation.mutate(values))}>
              <div><label className="mb-2 block text-sm font-medium text-slate-700">Tên phòng</label><input {...updateForm.register('name')} placeholder="Nhập tên phòng" className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600" /></div>
              <div><label className="mb-2 block text-sm font-medium text-slate-700">Trạng thái</label><select {...updateForm.register('status')} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600">{statuses.map((s) => <option key={s} value={s}>{s === 'ACTIVE' ? 'Hoạt động' : 'Ngưng hoạt động'}</option>)}</select></div>
              {updateMutation.isError ? <ErrorAlert message="Cập nhật phòng thất bại." /> : null}
              {updateMutation.isSuccess ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">Cập nhật thành công!</div> : null}
              <button type="submit" disabled={updateMutation.isPending || !selectedRoomId} className="w-full rounded-xl bg-emerald-600 px-4 py-3.5 font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60">{updateMutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}</button>
            </form>
          )},
        ]} />
      </PageCard>
    </div>
  )
}
