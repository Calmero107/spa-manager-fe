import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useParams } from 'react-router-dom'
import { z } from 'zod'
import { PageCard } from '@/components/ui/PageCard'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { getCustomer, updateCustomer } from '@/features/customer/services/customer.api'
import { getTreatmentPlans } from '@/features/treatment-plan/services/treatment-plan.api'

const schema = z.object({
  phone: z.string().min(1, 'Phone is required'),
  name: z.string().min(1, 'Name is required'),
})

type FormValues = z.infer<typeof schema>

export function CustomerDetailPage() {
  const { customerId = '' } = useParams()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const branchId = user?.branchId

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      phone: '',
      name: '',
    },
  })

  const { data, isLoading, isError } = useQuery({
    queryKey: ['customer-detail', customerId],
    queryFn: () => getCustomer(customerId),
    enabled: Boolean(customerId),
  })

  const treatmentPlansQuery = useQuery({
    queryKey: ['treatment-plans', branchId, customerId, 'customer-history'],
    queryFn: () => getTreatmentPlans(branchId!, { customerId }),
    enabled: Boolean(branchId && customerId),
  })

  useEffect(() => {
    if (!data) return
    form.reset({
      phone: data.phone,
      name: data.name || '',
    })
  }, [data, form])

  const updateMutation = useMutation({
    mutationFn: (values: FormValues) => updateCustomer(customerId, { branchId: data!.branchId, ...values }),
    onSuccess: async (updatedCustomer) => {
      form.reset({
        phone: updatedCustomer.phone,
        name: updatedCustomer.name || '',
      })
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['customer-detail', customerId] }),
        queryClient.invalidateQueries({ queryKey: ['customers', branchId] }),
      ])
    },
  })

  return (
    <div className="space-y-6">
      <PageCard title="Customer detail" description="View, update, and navigate the current customer context.">
        {isLoading ? <p className="text-slate-400">Loading customer detail...</p> : null}
        {isError ? <p className="text-rose-400">Failed to load customer detail.</p> : null}
        {data ? (
          <>
            <div className="mb-5 flex flex-wrap justify-end gap-3">
              <Link
                to={`/treatment-plans?customerId=${data.id}`}
                className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-medium text-slate-100 hover:bg-slate-800"
              >
                View treatment plans for this customer
              </Link>
              <Link
                to={`/treatment-plans/new?customerId=${data.id}`}
                className="rounded-xl bg-cyan-400 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-cyan-300"
              >
                Create treatment plan for this customer
              </Link>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
                <p className="text-sm text-slate-400">Customer ID</p>
                <p className="mt-2 break-all text-sm text-white">{data.id}</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
                <p className="text-sm text-slate-400">Branch ID</p>
                <p className="mt-2 break-all text-sm text-white">{data.branchId}</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
                <p className="text-sm text-slate-400">Version</p>
                <p className="mt-2 text-sm text-white">{data.version}</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
                <p className="text-sm text-slate-400">Created at</p>
                <p className="mt-2 text-sm text-white">{new Date(data.createdAt).toLocaleString()}</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
                <p className="text-sm text-slate-400">Updated at</p>
                <p className="mt-2 text-sm text-white">{data.updatedAt ? new Date(data.updatedAt).toLocaleString() : '-'}</p>
              </div>
            </div>

            <form className="mt-6 grid gap-5 md:max-w-xl" onSubmit={form.handleSubmit((values) => updateMutation.mutate(values))}>
              <div>
                <label className="mb-2 block text-sm text-slate-300">Name</label>
                <input
                  {...form.register('name')}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400"
                />
                {form.formState.errors.name ? <p className="mt-2 text-sm text-rose-400">{form.formState.errors.name.message}</p> : null}
              </div>

              <div>
                <label className="mb-2 block text-sm text-slate-300">Phone</label>
                <input
                  {...form.register('phone')}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400"
                />
                {form.formState.errors.phone ? <p className="mt-2 text-sm text-rose-400">{form.formState.errors.phone.message}</p> : null}
              </div>

              {updateMutation.isError ? <p className="text-sm text-rose-400">Failed to update customer.</p> : null}
              {updateMutation.isSuccess ? <p className="text-sm text-emerald-300">Customer updated successfully.</p> : null}

              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="rounded-xl bg-cyan-400 px-4 py-3 font-medium text-slate-950 hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {updateMutation.isPending ? 'Saving...' : 'Save customer changes'}
              </button>
            </form>
          </>
        ) : null}
      </PageCard>

      <PageCard title="Customer history" description="Current treatment plans linked to this customer.">
        {treatmentPlansQuery.isLoading ? <p className="text-slate-400">Loading customer history...</p> : null}
        {treatmentPlansQuery.isError ? <p className="text-rose-400">Failed to load customer history.</p> : null}

        {!treatmentPlansQuery.isLoading && !treatmentPlansQuery.isError && (treatmentPlansQuery.data?.length ?? 0) === 0 ? (
          <p className="text-slate-400">No treatment plans found for this customer yet.</p>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          {treatmentPlansQuery.data?.map((plan) => (
            <Link
              key={plan.id}
              to={`/treatment-plans/${plan.id}`}
              className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 transition hover:border-slate-700"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-slate-400">Treatment plan</p>
                  <h3 className="mt-2 break-all text-lg font-semibold text-white">{plan.id}</h3>
                </div>
                <StatusBadge value={plan.status} />
              </div>
              <div className="mt-4 space-y-2 text-sm text-slate-300">
                <p>Sessions: <span className="text-white">{plan.sessions.length}</span></p>
                <p>Total price: <span className="text-white">{plan.totalPrice}</span></p>
                <p>Created at: <span className="text-white">{new Date(plan.createdAt).toLocaleString()}</span></p>
              </div>
            </Link>
          ))}
        </div>
      </PageCard>
    </div>
  )
}
