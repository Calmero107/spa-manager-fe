import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { PageCard } from '@/components/ui/PageCard'
import { ErrorAlert } from '@/components/ui/ErrorAlert'
import { EmptyState } from '@/components/ui/EmptyState'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { deleteServiceRequirement, getServiceRequirements, upsertServiceRequirement } from '@/features/resource/services/service-requirement.api'
import { getServices } from '@/features/service/services/service.api'

const viResourceTypes: Record<string, string> = { STAFF: 'Nhân viên', EQUIPMENT: 'Thiết bị' }
const schema = z.object({
  resourceType: z.string().min(1, 'Vui lòng chọn loại'),
  resourceCode: z.string().min(1, 'Vui lòng nhập mã tài nguyên'),
  quantity: z.string().min(1, 'Vui lòng nhập số lượng').refine((v) => Number(v) > 0, 'Số lượng phải lớn hơn 0'),
})
type FormValues = z.infer<typeof schema>
const resourceTypes = ['STAFF', 'EQUIPMENT'] as const

export function ServiceRequirementManagementPage() {
  const { user } = useAuth()
  const branchId = user?.branchId
  const queryClient = useQueryClient()
  const [selectedServiceId, setSelectedServiceId] = useState('')

  const servicesQuery = useQuery({ queryKey: ['service-requirement-services', branchId], queryFn: () => getServices(branchId!), enabled: Boolean(branchId) })
  const requirementsQuery = useQuery({ queryKey: ['service-requirements', selectedServiceId], queryFn: () => getServiceRequirements(selectedServiceId), enabled: Boolean(selectedServiceId) })
  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { resourceType: 'STAFF', resourceCode: '', quantity: '1' } })
  const refreshRequirements = async () => queryClient.invalidateQueries({ queryKey: ['service-requirements', selectedServiceId] })

  const upsertMutation = useMutation({
    mutationFn: (values: FormValues) => upsertServiceRequirement(selectedServiceId, { branchId: branchId!, resourceType: values.resourceType, resourceCode: values.resourceCode, quantity: Number(values.quantity) }),
    onSuccess: async () => { await refreshRequirements(); form.reset({ resourceType: 'STAFF', resourceCode: '', quantity: '1' }) },
  })
  const deleteMutation = useMutation({
    mutationFn: ({ resourceType, resourceCode }: { resourceType: string; resourceCode: string }) => deleteServiceRequirement(selectedServiceId, branchId!, resourceType, resourceCode),
    onSuccess: refreshRequirements,
  })

  const selectedService = servicesQuery.data?.find((item) => item.id === selectedServiceId)

  return (
    <div className="space-y-8">
      <PageCard title="Yêu cầu tài nguyên dịch vụ">
        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <div className="space-y-3">
            {servicesQuery.data?.map((service) => (
              <button key={service.id} type="button" onClick={() => setSelectedServiceId(service.id)}
                className={`w-full rounded-2xl border p-5 text-left transition ${selectedServiceId === service.id ? 'border-cyan-500 bg-cyan-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                <h3 className="text-base font-semibold text-slate-900">{service.name}</h3>
                <p className="mt-1 text-sm text-slate-500">{service.duration} phút · {service.price}</p>
              </button>
            ))}
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm">
            <p className="font-semibold text-slate-900">Dịch vụ đang chọn</p>
            {selectedService ? <p className="mt-2 text-slate-600">{selectedService.name}</p> : <p className="mt-2 text-slate-500">Chọn dịch vụ để quản lý yêu cầu.</p>}
          </div>
        </div>
      </PageCard>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <PageCard title="Gán yêu cầu">
          <form className="space-y-4" onSubmit={form.handleSubmit((values) => upsertMutation.mutate(values))}>
            <div><label className="mb-2 block text-sm font-medium text-slate-700">Loại tài nguyên</label><select {...form.register('resourceType')} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600">{resourceTypes.map((t) => <option key={t} value={t}>{viResourceTypes[t]}</option>)}</select></div>
            <div><label className="mb-2 block text-sm font-medium text-slate-700">Mã tài nguyên</label><input {...form.register('resourceCode')} placeholder="Ví dụ: facial_basic hoặc machine-a" className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600" /></div>
            <div><label className="mb-2 block text-sm font-medium text-slate-700">Số lượng</label><input type="number" {...form.register('quantity')} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600" /></div>
            {upsertMutation.isError ? <ErrorAlert message="Gán yêu cầu thất bại." /> : null}
            <button type="submit" disabled={upsertMutation.isPending || !selectedServiceId || !branchId} className="w-full rounded-xl bg-cyan-600 px-4 py-3.5 font-semibold text-white transition hover:bg-cyan-700 disabled:opacity-60">{upsertMutation.isPending ? 'Đang lưu...' : 'Lưu yêu cầu'}</button>
          </form>
        </PageCard>

        <PageCard title="Yêu cầu đã gán">
          {!selectedServiceId ? <EmptyState message="Chọn dịch vụ để xem yêu cầu." /> : null}
          {requirementsQuery.data?.length === 0 ? <EmptyState message="Chưa có yêu cầu nào được gán." /> : null}
          <div className="space-y-3">
            {requirementsQuery.data?.map((req) => (
              <div key={`${req.serviceId}-${req.resourceType}-${req.resourceCode}`} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4">
                <div>
                  <p className="font-medium text-slate-900">{req.resourceCode}</p>
                  <p className="text-sm text-slate-500">{viResourceTypes[req.resourceType] ?? req.resourceType} · SL: {req.quantity}</p>
                </div>
                <button type="button" onClick={() => deleteMutation.mutate({ resourceType: req.resourceType, resourceCode: req.resourceCode })} className="rounded-xl border border-rose-200 px-3 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-50">Xóa</button>
              </div>
            ))}
          </div>
        </PageCard>
      </div>
    </div>
  )
}
