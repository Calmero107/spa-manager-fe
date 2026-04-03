import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { PageCard } from '@/components/ui/PageCard'
import { getServices } from '@/features/service/services/service.api'
import { createTreatmentPlan } from '@/features/treatment-plan/services/treatment-plan.api'

const DEFAULT_BRANCH_ID = import.meta.env.VITE_DEFAULT_BRANCH_ID ?? '11111111-1111-1111-1111-111111111111'
const DEFAULT_CUSTOMER_ID = '66666666-6666-6666-6666-666666666666'

const schema = z.object({
  branchId: z.string().min(1),
  customerId: z.string().min(1, 'Customer ID is required'),
  serviceIds: z.array(z.string()).min(1, 'Select at least one service'),
})

type FormValues = z.infer<typeof schema>

export function TreatmentPlanCreatePage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      branchId: DEFAULT_BRANCH_ID,
      customerId: DEFAULT_CUSTOMER_ID,
      serviceIds: [],
    },
  })

  const selectedServiceIds = watch('serviceIds')
  const branchId = watch('branchId')

  const {
    data: services,
    isLoading: isLoadingServices,
    isError: isServicesError,
  } = useQuery({
    queryKey: ['services', branchId],
    queryFn: () => getServices(branchId),
    enabled: Boolean(branchId),
  })

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      createTreatmentPlan({
        branchId: values.branchId,
        customerId: values.customerId,
        serviceIds: values.serviceIds,
      }),
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: ['treatment-plans', DEFAULT_BRANCH_ID] })
      navigate(`/treatment-plans/${data.id}`)
    },
  })

  return (
    <PageCard
      title="Create treatment plan"
      description="Create a treatment plan by selecting a customer and one or more services from the current branch catalog."
    >
      <form className="grid gap-5 md:max-w-3xl" onSubmit={handleSubmit((values) => mutation.mutate(values))}>
        <div>
          <label className="mb-2 block text-sm text-slate-300">Branch ID</label>
          <input
            {...register('branchId')}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm text-slate-300">Customer ID</label>
          <input
            {...register('customerId')}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400"
          />
          {errors.customerId ? <p className="mt-2 text-sm text-rose-400">{errors.customerId.message}</p> : null}
        </div>

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

        {mutation.isError ? <p className="text-sm text-rose-400">Failed to create treatment plan.</p> : null}

        <button
          type="submit"
          disabled={mutation.isPending}
          className="rounded-xl bg-cyan-400 px-4 py-3 font-medium text-slate-950 hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {mutation.isPending ? 'Creating...' : 'Create treatment plan'}
        </button>
      </form>
    </PageCard>
  )
}
