import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { PageCard } from '@/components/ui/PageCard'
import { ErrorAlert } from '@/components/ui/ErrorAlert'
import { Tabs } from '@/components/ui/Tabs'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { createEquipment, getEquipment, updateEquipment } from '@/features/resource/services/equipment.api'

const schema = z.object({ name: z.string().min(1, 'Vui lòng nhập tên'), quantity: z.string().min(1, 'Vui lòng nhập số lượng').refine((v) => Number(v) >= 0, 'Số lượng không hợp lệ') })
type FormValues = z.infer<typeof schema>

export function EquipmentManagementPage() {
  const { user } = useAuth()
  const branchId = user?.branchId
  const queryClient = useQueryClient()
  const [selectedEquipmentId, setSelectedEquipmentId] = useState('')

  const equipmentQuery = useQuery({ queryKey: ['equipment-management', branchId], queryFn: () => getEquipment(branchId!), enabled: Boolean(branchId) })
  const createForm = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { name: '', quantity: '0' } })
  const updateForm = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { name: '', quantity: '0' } })
  const refresh = async () => queryClient.invalidateQueries({ queryKey: ['equipment-management', branchId] })

  const createMutation = useMutation({ mutationFn: (values: FormValues) => createEquipment({ branchId: branchId!, name: values.name, quantity: Number(values.quantity) }), onSuccess: async (eq) => { await refresh(); setSelectedEquipmentId(eq.id); createForm.reset({ name: '', quantity: '0' }); updateForm.reset({ name: eq.name, quantity: String(eq.quantity) }) } })
  const updateMutation = useMutation({ mutationFn: (values: FormValues) => updateEquipment(selectedEquipmentId, { branchId: branchId!, name: values.name, quantity: Number(values.quantity) }), onSuccess: async (eq) => { await refresh(); updateForm.reset({ name: eq.name, quantity: String(eq.quantity) }) } })
  const selectedEquipment = equipmentQuery.data?.find((item) => item.id === selectedEquipmentId)

  return (
    <div className="space-y-8">
      <PageCard title="Quản lý thiết bị">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-3">
            {equipmentQuery.data?.map((eq) => (
              <button key={eq.id} type="button" onClick={() => { setSelectedEquipmentId(eq.id); updateForm.reset({ name: eq.name, quantity: String(eq.quantity) }) }}
                className={`w-full rounded-2xl border p-5 text-left transition ${selectedEquipmentId === eq.id ? 'border-cyan-500 bg-cyan-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                <h3 className="text-base font-semibold text-slate-900">{eq.name}</h3>
                <p className="mt-2 text-sm text-slate-600">Số lượng: <span className="font-medium text-slate-900">{eq.quantity}</span></p>
              </button>
            ))}
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm">
            <p className="font-semibold text-slate-900">Thiết bị đang chọn</p>
            {selectedEquipment ? <p className="mt-2 text-slate-600">{selectedEquipment.name} · SL: {selectedEquipment.quantity}</p> : <p className="mt-2 text-slate-500">Chọn thiết bị để chỉnh sửa.</p>}
          </div>
        </div>
      </PageCard>

      <PageCard title="Thao tác thiết bị">
        <Tabs tabs={[
          { key: 'create', label: 'Thêm mới', content: (
            <form className="space-y-4" onSubmit={createForm.handleSubmit((values) => createMutation.mutate(values))}>
              <div><label className="mb-2 block text-sm font-medium text-slate-700">Tên thiết bị</label><input {...createForm.register('name')} placeholder="Nhập tên" className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600" /></div>
              <div><label className="mb-2 block text-sm font-medium text-slate-700">Số lượng</label><input type="number" {...createForm.register('quantity')} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600" /></div>
              {createMutation.isError ? <ErrorAlert message="Thêm thiết bị thất bại." /> : null}
              <button type="submit" disabled={createMutation.isPending || !branchId} className="w-full rounded-xl bg-cyan-600 px-4 py-3.5 font-semibold text-white transition hover:bg-cyan-700 disabled:opacity-60">{createMutation.isPending ? 'Đang tạo...' : 'Thêm thiết bị'}</button>
            </form>
          )},
          { key: 'update', label: 'Chỉnh sửa', disabled: !selectedEquipmentId, content: (
            <form className="space-y-4" onSubmit={updateForm.handleSubmit((values) => updateMutation.mutate(values))}>
              <div><label className="mb-2 block text-sm font-medium text-slate-700">Tên thiết bị</label><input {...updateForm.register('name')} placeholder="Nhập tên" className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600" /></div>
              <div><label className="mb-2 block text-sm font-medium text-slate-700">Số lượng</label><input type="number" {...updateForm.register('quantity')} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600" /></div>
              {updateMutation.isError ? <ErrorAlert message="Cập nhật thiết bị thất bại." /> : null}
              {updateMutation.isSuccess ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">Cập nhật thành công!</div> : null}
              <button type="submit" disabled={updateMutation.isPending || !selectedEquipmentId} className="w-full rounded-xl bg-emerald-600 px-4 py-3.5 font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60">{updateMutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}</button>
            </form>
          )},
        ]} />
      </PageCard>
    </div>
  )
}
