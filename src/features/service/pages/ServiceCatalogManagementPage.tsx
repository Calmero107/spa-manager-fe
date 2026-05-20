import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { PageCard } from '@/components/ui/PageCard'
import { ErrorAlert } from '@/components/ui/ErrorAlert'
import { Tabs } from '@/components/ui/Tabs'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { createService, getServices, updateService } from '@/features/service/services/service.api'

const schema = z.object({
  name: z.string().min(1, 'Vui lòng nhập tên'),
  duration: z.string().min(1, 'Vui lòng nhập thời lượng').refine((v) => Number(v) > 0, 'Thời lượng phải lớn hơn 0'),
  price: z.string().min(1, 'Vui lòng nhập giá').refine((v) => Number(v) >= 0, 'Giá không hợp lệ'),
})
type FormValues = z.infer<typeof schema>

export function ServiceCatalogManagementPage() {
  const { user } = useAuth()
  const branchId = user?.branchId
  const queryClient = useQueryClient()
  const [selectedServiceId, setSelectedServiceId] = useState<string>('')

  const servicesQuery = useQuery({ queryKey: ['service-management', branchId], queryFn: () => getServices(branchId!), enabled: Boolean(branchId) })
  const createForm = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { name: '', duration: '60', price: '0' } })
  const updateForm = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { name: '', duration: '60', price: '0' } })
  const refresh = async () => queryClient.invalidateQueries({ queryKey: ['service-management', branchId] })

  const createMutation = useMutation({
    mutationFn: (values: FormValues) => createService({ branchId: branchId!, name: values.name, duration: Number(values.duration), price: Number(values.price) }),
    onSuccess: async (service) => { await refresh(); setSelectedServiceId(service.id); createForm.reset({ name: '', duration: '60', price: '0' }); updateForm.reset({ name: service.name, duration: String(service.duration), price: String(service.price) }) },
  })
  const updateMutation = useMutation({
    mutationFn: (values: FormValues) => updateService(selectedServiceId, { branchId: branchId!, name: values.name, duration: Number(values.duration), price: Number(values.price) }),
    onSuccess: async (service) => { await refresh(); updateForm.reset({ name: service.name, duration: String(service.duration), price: String(service.price) }) },
  })

  const selectedService = servicesQuery.data?.find((item) => item.id === selectedServiceId)

  return (
    <div className="space-y-8">
      <PageCard title="Danh mục dịch vụ">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-3">
            {servicesQuery.data?.map((service) => (
              <button key={service.id} type="button" onClick={() => { setSelectedServiceId(service.id); updateForm.reset({ name: service.name, duration: String(service.duration), price: String(service.price) }) }}
                className={`w-full rounded-2xl border p-5 text-left transition ${selectedServiceId === service.id ? 'border-cyan-500 bg-cyan-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                <h3 className="text-base font-semibold text-slate-900">{service.name}</h3>
                <p className="mt-2 text-sm text-slate-600">Thời lượng: <span className="font-medium text-slate-900">{service.duration} phút</span></p>
                <p className="mt-1 text-sm text-slate-600">Giá: <span className="font-medium text-slate-900">{service.price}</span></p>
              </button>
            ))}
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm">
            <p className="font-semibold text-slate-900">Dịch vụ đang chọn</p>
            {selectedService ? <p className="mt-2 text-slate-600">{selectedService.name} · {selectedService.duration} phút</p> : <p className="mt-2 text-slate-500">Chọn dịch vụ để chỉnh sửa.</p>}
          </div>
        </div>
      </PageCard>

      <PageCard title="Thao tác dịch vụ">
        <Tabs tabs={[
          { key: 'create', label: 'Thêm mới', content: (
            <form className="space-y-4" onSubmit={createForm.handleSubmit((values) => createMutation.mutate(values))}>
              <div><label className="mb-2 block text-sm font-medium text-slate-700">Tên dịch vụ</label><input {...createForm.register('name')} placeholder="Nhập tên dịch vụ" className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600" /></div>
              <div><label className="mb-2 block text-sm font-medium text-slate-700">Thời lượng (phút)</label><input type="number" {...createForm.register('duration')} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600" /></div>
              <div><label className="mb-2 block text-sm font-medium text-slate-700">Giá</label><input type="number" step="0.01" {...createForm.register('price')} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600" /></div>
              {createMutation.isError ? <ErrorAlert message="Thêm dịch vụ thất bại." /> : null}
              <button type="submit" disabled={createMutation.isPending || !branchId} className="w-full rounded-xl bg-cyan-600 px-4 py-3.5 font-semibold text-white transition hover:bg-cyan-700 disabled:opacity-60">{createMutation.isPending ? 'Đang tạo...' : 'Thêm dịch vụ'}</button>
            </form>
          )},
          { key: 'update', label: 'Chỉnh sửa', disabled: !selectedServiceId, content: (
            <form className="space-y-4" onSubmit={updateForm.handleSubmit((values) => updateMutation.mutate(values))}>
              <div><label className="mb-2 block text-sm font-medium text-slate-700">Tên dịch vụ</label><input {...updateForm.register('name')} placeholder="Nhập tên dịch vụ" className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600" /></div>
              <div><label className="mb-2 block text-sm font-medium text-slate-700">Thời lượng (phút)</label><input type="number" {...updateForm.register('duration')} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600" /></div>
              <div><label className="mb-2 block text-sm font-medium text-slate-700">Giá</label><input type="number" step="0.01" {...updateForm.register('price')} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600" /></div>
              {updateMutation.isError ? <ErrorAlert message="Cập nhật dịch vụ thất bại." /> : null}
              {updateMutation.isSuccess ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">Cập nhật thành công!</div> : null}
              <button type="submit" disabled={updateMutation.isPending || !selectedServiceId} className="w-full rounded-xl bg-emerald-600 px-4 py-3.5 font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60">{updateMutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}</button>
            </form>
          )},
        ]} />
      </PageCard>
    </div>
  )
}
