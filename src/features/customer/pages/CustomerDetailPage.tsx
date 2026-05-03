import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useParams } from 'react-router-dom'
import { z } from 'zod'
import { PageCard } from '@/components/ui/PageCard'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { getCustomer, getCustomerHistory, updateCustomer } from '@/features/customer/services/customer.api'

const schema = z.object({
  phone: z.string().min(1, 'Phone is required'),
  name: z.string().min(1, 'Name is required'),
})

type FormValues = z.infer<typeof schema>

export function CustomerDetailPage() {
  const { customerId = '' } = useParams()
  const queryClient = useQueryClient()

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

  const historyQuery = useQuery({
    queryKey: ['customer-history', customerId],
    queryFn: () => getCustomerHistory(customerId),
    enabled: Boolean(customerId),
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
        queryClient.invalidateQueries({ queryKey: ['customer-history', customerId] }),
        queryClient.invalidateQueries({ queryKey: ['customers'] }),
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

      <PageCard title="Customer history" description="Aggregated treatment plan, session, and appointment history for this customer.">
        {historyQuery.isLoading ? <p className="text-slate-400">Loading customer history...</p> : null}
        {historyQuery.isError ? <p className="text-rose-400">Failed to load customer history.</p> : null}

        {historyQuery.data ? (
          <div className="space-y-6">
            <div>
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="text-lg font-semibold text-white">Treatment plans</h3>
                <span className="text-sm text-slate-400">{historyQuery.data.treatmentPlans.length} item(s)</span>
              </div>
              {historyQuery.data.treatmentPlans.length === 0 ? <p className="text-slate-400">No treatment plans found.</p> : null}
              <div className="grid gap-4 md:grid-cols-2">
                {historyQuery.data.treatmentPlans.map((plan) => (
                  <Link
                    key={plan.planId}
                    to={`/treatment-plans/${plan.planId}`}
                    className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 transition hover:border-slate-700"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm text-slate-400">Treatment plan</p>
                        <h3 className="mt-2 break-all text-lg font-semibold text-white">{plan.planId}</h3>
                      </div>
                      <StatusBadge value={plan.status} />
                    </div>
                    <div className="mt-4 space-y-2 text-sm text-slate-300">
                      <p>Total price: <span className="text-white">{plan.totalPrice}</span></p>
                      <p>Created at: <span className="text-white">{new Date(plan.createdAt).toLocaleString()}</span></p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="text-lg font-semibold text-white">Sessions</h3>
                <span className="text-sm text-slate-400">{historyQuery.data.sessions.length} item(s)</span>
              </div>
              {historyQuery.data.sessions.length === 0 ? <p className="text-slate-400">No sessions found.</p> : null}
              <div className="grid gap-4 md:grid-cols-2">
                {historyQuery.data.sessions.map((session) => (
                  <div key={session.sessionId} className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm text-slate-400">Session #{session.sequenceNo}</p>
                        <h3 className="mt-2 text-lg font-semibold text-white">{session.serviceName}</h3>
                      </div>
                      <StatusBadge value={session.status} />
                    </div>
                    <div className="mt-4 space-y-2 text-sm text-slate-300">
                      <p>Session ID: <span className="font-mono text-slate-400">{session.sessionId}</span></p>
                      <p>Plan ID: <span className="font-mono text-slate-400">{session.planId}</span></p>
                      <p>Duration: <span className="text-white">{session.duration} mins</span></p>
                      <p>Price: <span className="text-white">{session.price}</span></p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="text-lg font-semibold text-white">Appointments</h3>
                <span className="text-sm text-slate-400">{historyQuery.data.appointments.length} item(s)</span>
              </div>
              {historyQuery.data.appointments.length === 0 ? <p className="text-slate-400">No appointments found.</p> : null}
              <div className="grid gap-4 md:grid-cols-2">
                {historyQuery.data.appointments.map((appointment) => (
                  <Link
                    key={appointment.appointmentId}
                    to={`/appointments/detail?appointmentId=${appointment.appointmentId}&sessionId=${appointment.sessionId}`}
                    className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 transition hover:border-slate-700"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm text-slate-400">Appointment</p>
                        <h3 className="mt-2 break-all text-lg font-semibold text-white">{appointment.appointmentId}</h3>
                      </div>
                      <StatusBadge value={appointment.appointmentStatus} />
                    </div>
                    <div className="mt-4 space-y-2 text-sm text-slate-300">
                      <p>Session status: <span className="text-white">{appointment.sessionStatus}</span></p>
                      <p>Technician: <span className="text-white">{appointment.staffName}</span></p>
                      <p>Room: <span className="text-white">{appointment.roomName}</span></p>
                      <p>Window: <span className="text-white">{new Date(appointment.startTime).toLocaleString()} → {new Date(appointment.endTime).toLocaleString()}</span></p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </PageCard>
    </div>
  )
}
