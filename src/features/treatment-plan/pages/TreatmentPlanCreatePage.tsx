import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { z } from 'zod'
import { PageCard } from '@/components/ui/PageCard'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { getCustomers } from '@/features/customer/services/customer.api'
import { getServices } from '@/features/service/services/service.api'
import { createTreatmentPlan } from '@/features/treatment-plan/services/treatment-plan.api'

const schema = z.object({
  customerId: z.string().min(1, 'Customer is required'),
  serviceIds: z.array(z.string()).min(1, 'Select at least one service'),
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

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      customerId: prefilledCustomerId,
      serviceIds: [],
      customerSearch: '',
    },
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

  const {
    data: services,
    isLoading: isLoadingServices,
    isError: isServicesError,
  } = useQuery({
    queryKey: ['services', branchId],
    queryFn: () => getServices(branchId!),
    enabled: Boolean(branchId),
  })

  const {
    data: customers,
    isLoading: isLoadingCustomers,
    isError: isCustomersError,
  } = useQuery({
    queryKey: ['customers', branchId],
    queryFn: () => getCustomers(branchId!),
    enabled: Boolean(branchId),
  })

  const filteredCustomers = useMemo(() => {
    const keyword = customerSearch.trim().toLowerCase()
    if (!customers) return []
    if (!keyword) return customers
    return customers.filter((customer) =>
      customer.name.toLowerCase().includes(keyword)
      || customer.phone.toLowerCase().includes(keyword)
      || customer.id.toLowerCase().includes(keyword),
    )
  }, [customerSearch, customers])

  const selectedCustomer = customers?.find((customer) => customer.id === selectedCustomerId)

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      createTreatmentPlan({
        branchId: branchId!,
        customerId: values.customerId,
        serviceIds: values.serviceIds,
      }),
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: ['treatment-plans', branchId] })
      navigate(`/treatment-plans/${data.id}`)
    },
  })

  return (
    <PageCard
      title="Create treatment plan"
      description="Create a treatment plan from the signed-in user's branch by selecting a customer and one or more services. New plans start in DRAFT, then move to ACTIVE when they are ready for scheduling."
    >
      <form className="grid gap-6 md:max-w-4xl" onSubmit={handleSubmit((values) => mutation.mutate(values))}>
        <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
          <p className="text-sm text-slate-400">Branch context</p>
          <p className="mt-2 break-all text-sm text-white">{branchId}</p>
          <p className="mt-2 text-xs text-slate-500">Taken automatically from the signed-in user session.</p>
          <div className="mt-4 inline-flex rounded-full border border-slate-700 bg-slate-900/70 px-3 py-1 text-xs font-medium text-slate-200">
            Initial status: DRAFT
          </div>
          <p className="mt-3 text-xs text-amber-300">After creation, open the treatment plan detail page and activate the plan before scheduling sessions.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-[1.1fr_1.9fr]">
          <div>
            <label className="mb-2 block text-sm text-slate-300">Find customer</label>
            <input
              {...register('customerSearch')}
              placeholder="Search by name, phone, or customer ID"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400"
            />
            {isLoadingCustomers ? <p className="mt-2 text-sm text-slate-400">Loading customers...</p> : null}
            {isCustomersError ? <p className="mt-2 text-sm text-rose-400">Failed to load customers.</p> : null}
          </div>

          <div>
            <label className="mb-2 block text-sm text-slate-300">Customer picker</label>
            <div className="max-h-72 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950/40 p-2">
              {filteredCustomers.map((customer) => {
                const checked = customer.id === selectedCustomerId
                return (
                  <button
                    key={customer.id}
                    type="button"
                    onClick={() => setValue('customerId', customer.id, { shouldValidate: true })}
                    className={`mb-2 w-full rounded-xl border px-4 py-3 text-left last:mb-0 ${
                      checked ? 'border-cyan-400 bg-cyan-950/20' : 'border-slate-700 bg-slate-950/40 hover:border-slate-500'
                    }`}
                  >
                    <div className="font-medium text-white">{customer.name || 'Unnamed customer'}</div>
                    <div className="mt-1 text-sm text-slate-400">{customer.phone}</div>
                    <div className="mt-1 break-all text-xs text-slate-500">{customer.id}</div>
                  </button>
                )
              })}
              {!isLoadingCustomers && filteredCustomers.length === 0 ? (
                <p className="px-2 py-3 text-sm text-slate-500">No customers match this branch search.</p>
              ) : null}
            </div>
            {errors.customerId ? <p className="mt-2 text-sm text-rose-400">{errors.customerId.message}</p> : null}
          </div>
        </div>

        {selectedCustomer ? (
          <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm text-slate-400">Selected customer</p>
                <p className="mt-2 text-white">{selectedCustomer.name || 'Unnamed customer'} · {selectedCustomer.phone}</p>
                <p className="mt-1 break-all text-xs text-slate-500">{selectedCustomer.id}</p>
              </div>
              <button
                type="button"
                onClick={() => setValue('customerId', '', { shouldValidate: true })}
                className="rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-200 hover:bg-slate-800"
              >
                Clear selection
              </button>
            </div>
          </div>
        ) : null}

        <div>
          <div className="mb-2 flex items-center justify-between gap-3">
            <label className="block text-sm text-slate-300">Services</label>
            <span className="text-xs text-slate-500">Selected: {selectedServiceIds.length}</span>
          </div>

          {isLoadingServices ? <p className="text-sm text-slate-400">Loading services...</p> : null}
          {isServicesError ? <p className="text-sm text-rose-400">Failed to load services for this branch.</p> : null}

          <div className="mt-2 grid gap-3">
            {services?.map((service) => {
              const checked = selectedServiceIds.includes(service.id)
              return (
                <label
                  key={service.id}
                  className={`flex cursor-pointer justify-between gap-4 rounded-xl border px-4 py-3 text-sm ${
                    checked ? 'border-cyan-400 bg-cyan-950/20' : 'border-slate-700 bg-slate-950/40'
                  }`}
                >
                  <div>
                    <div className="font-medium text-white">{service.name}</div>
                    <div className="text-slate-400">
                      {service.duration} mins · {service.price}
                    </div>
                    <div className="mt-1 break-all text-xs text-slate-500">{service.id}</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setValue('serviceIds', [...selectedServiceIds, service.id], { shouldValidate: true })
                      } else {
                        setValue(
                          'serviceIds',
                          selectedServiceIds.filter((id) => id !== service.id),
                          { shouldValidate: true },
                        )
                      }
                    }}
                  />
                </label>
              )
            })}
          </div>
          {errors.serviceIds ? <p className="mt-2 text-sm text-rose-400">{errors.serviceIds.message}</p> : null}
        </div>

        {!branchId ? <p className="text-sm text-amber-300">Missing branch context from signed-in user.</p> : null}
        {mutation.isError ? <p className="text-sm text-rose-400">Failed to create treatment plan.</p> : null}

        <button
          type="submit"
          disabled={mutation.isPending || !branchId}
          className="rounded-xl bg-cyan-400 px-4 py-3 font-medium text-slate-950 hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {mutation.isPending ? 'Creating...' : 'Create treatment plan'}
        </button>
      </form>
    </PageCard>
  )
}
