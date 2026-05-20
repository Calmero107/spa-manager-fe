import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { z } from 'zod'
import { PageCard } from '@/components/ui/PageCard'
import { ErrorAlert } from '@/components/ui/ErrorAlert'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { getCustomers } from '@/features/customer/services/customer.api'
import { getServices } from '@/features/service/services/service.api'
import { createTreatmentPlan } from '@/features/treatment-plan/services/treatment-plan.api'

const schema = z.object({
  customerId: z.string().min(1, 'Vui lòng chọn khách hàng'),
  serviceIds: z.array(z.string()).min(1, 'Vui lòng chọn ít nhất một dịch vụ'),
  customerSearch: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

export function TreatmentPlanCreatePage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()
  const { user } = useAuth()
  const branchId = user?.branchId
  const prefilledCustomerId = searchParams.get('customerId') ?? ''

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { customerId: prefilledCustomerId, serviceIds: [], customerSearch: '' },
  })

  const selectedServiceIds = watch('serviceIds')
  const selectedCustomerId = watch('customerId')
  const customerSearch = watch('customerSearch') ?? ''

  useEffect(() => {
    if (prefilledCustomerId) {
      setValue('customerId', prefilledCustomerId, { shouldValidate: true })
      setValue('customerSearch', prefilledCustomerId)
    }
  }, [prefilledCustomerId, setValue])

  const { data: services, isLoading: isLoadingServices, isError: isServicesError } = useQuery({
    queryKey: ['services', branchId],
    queryFn: () => getServices(branchId!),
    enabled: Boolean(branchId),
  })

  const { data: customers, isLoading: isLoadingCustomers, isError: isCustomersError } = useQuery({
    queryKey: ['customers', branchId],
    queryFn: () => getCustomers(branchId!),
    enabled: Boolean(branchId),
  })

  const filteredCustomers = useMemo(() => {
    const keyword = customerSearch.trim().toLowerCase()
    if (!customers) return []
    if (!keyword) return customers
    return customers.filter((customer) =>
      customer.name.toLowerCase().includes(keyword) || customer.phone.toLowerCase().includes(keyword),
    )
  }, [customerSearch, customers])

  const selectedCustomer = customers?.find((customer) => customer.id === selectedCustomerId)

  const mutation = useMutation({
    mutationFn: (values: FormValues) => createTreatmentPlan({ branchId: branchId!, customerId: values.customerId, serviceIds: values.serviceIds }),
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: ['treatment-plans', branchId] })
      navigate(`/treatment-plans/${data.id}`)
    },
  })

  return (
    <PageCard title="Tạo liệu trình">
      <div className="mb-5 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-700">
        Liệu trình sẽ được tạo ở trạng thái <strong>Bản nháp</strong>. Hãy kích hoạt liệu trình trước khi đặt lịch các buổi.
      </div>

      <form className="grid gap-6 md:max-w-4xl" onSubmit={handleSubmit((values) => mutation.mutate(values))}>
        <div className="grid gap-4 md:grid-cols-[1.1fr_1.9fr]">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Tìm khách hàng</label>
            <input {...register('customerSearch')} placeholder="Tìm theo tên hoặc SĐT..." className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600" />
            {isLoadingCustomers ? <LoadingSpinner message="Đang tải khách hàng..." /> : null}
            {isCustomersError ? <p className="mt-2 text-sm text-rose-600">Không thể tải danh sách khách hàng.</p> : null}
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Chọn khách hàng</label>
            <div className="max-h-72 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-2">
              {filteredCustomers.map((customer) => {
                const checked = customer.id === selectedCustomerId
                return (
                  <button key={customer.id} type="button" onClick={() => setValue('customerId', customer.id, { shouldValidate: true })}
                    className={`mb-2 w-full rounded-xl border px-4 py-3 text-left last:mb-0 transition ${checked ? 'border-cyan-500 bg-cyan-50' : 'border-slate-300 bg-white hover:border-slate-400'}`}>
                    <div className="font-medium text-slate-900">{customer.name || 'Chưa đặt tên'}</div>
                    <div className="mt-1 text-sm text-slate-500">{customer.phone}</div>
                  </button>
                )
              })}
              {!isLoadingCustomers && filteredCustomers.length === 0 ? <p className="px-2 py-3 text-sm text-slate-500">Không tìm thấy khách hàng phù hợp.</p> : null}
            </div>
            {errors.customerId ? <p className="mt-2 text-sm text-rose-600">{errors.customerId.message}</p> : null}
          </div>
        </div>

        {selectedCustomer ? (
          <div className="flex items-center justify-between rounded-xl border border-cyan-200 bg-cyan-50 p-4">
            <div>
              <p className="text-sm text-slate-500">Khách hàng đã chọn</p>
              <p className="mt-1 font-medium text-slate-900">{selectedCustomer.name || 'Chưa đặt tên'} · {selectedCustomer.phone}</p>
            </div>
            <button type="button" onClick={() => setValue('customerId', '', { shouldValidate: true })} className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-100">Bỏ chọn</button>
          </div>
        ) : null}

        <div>
          <div className="mb-2 flex items-center justify-between gap-3">
            <label className="block text-sm font-medium text-slate-700">Dịch vụ</label>
            <span className="text-xs text-slate-500">Đã chọn: {selectedServiceIds.length}</span>
          </div>
          {isLoadingServices ? <LoadingSpinner message="Đang tải dịch vụ..." /> : null}
          {isServicesError ? <p className="text-sm text-rose-600">Không thể tải danh sách dịch vụ.</p> : null}
          <div className="mt-2 grid gap-3">
            {services?.map((service) => {
              const checked = selectedServiceIds.includes(service.id)
              return (
                <label key={service.id} className={`flex cursor-pointer justify-between gap-4 rounded-xl border px-4 py-3.5 text-sm transition ${checked ? 'border-cyan-500 bg-cyan-50' : 'border-slate-300 bg-white hover:border-slate-400'}`}>
                  <div>
                    <div className="font-medium text-slate-900">{service.name}</div>
                    <div className="text-slate-500">{service.duration} phút · {service.price}</div>
                  </div>
                  <input type="checkbox" checked={checked} onChange={(e) => {
                    if (e.target.checked) setValue('serviceIds', [...selectedServiceIds, service.id], { shouldValidate: true })
                    else setValue('serviceIds', selectedServiceIds.filter((id) => id !== service.id), { shouldValidate: true })
                  }} />
                </label>
              )
            })}
          </div>
          {errors.serviceIds ? <p className="mt-2 text-sm text-rose-600">{errors.serviceIds.message}</p> : null}
        </div>

        {mutation.isError ? <ErrorAlert message="Tạo liệu trình thất bại. Vui lòng thử lại." /> : null}

        <button type="submit" disabled={mutation.isPending || !branchId} className="rounded-xl bg-cyan-600 px-4 py-3.5 font-semibold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60">
          {mutation.isPending ? 'Đang tạo...' : 'Tạo liệu trình'}
        </button>
      </form>
    </PageCard>
  )
}
