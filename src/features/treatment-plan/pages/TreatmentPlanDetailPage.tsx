import { useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { PageCard } from '@/components/ui/PageCard'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { getCustomer } from '@/features/customer/services/customer.api'
import { getTreatmentPlan } from '@/features/treatment-plan/services/treatment-plan.api'
import { api } from '@/lib/api'
import type { ApiResponse, TreatmentPlan } from '@/types/api'

export function TreatmentPlanDetailPage() {
  const { planId = '' } = useParams()
  const { user } = useAuth()
  const branchId = user?.branchId
  const queryClient = useQueryClient()
  const { data, isLoading, isError } = useQuery({
    queryKey: ['treatment-plan-detail', planId],
    queryFn: () => getTreatmentPlan(planId),
    enabled: Boolean(planId),
  })

  const { data: customer } = useQuery({
    queryKey: ['customer-detail', data?.customerId],
    queryFn: () => getCustomer(data!.customerId),
    enabled: Boolean(data?.customerId),
  })

  const refreshPlanDetail = async (updated: TreatmentPlan) => {
    queryClient.setQueryData(['treatment-plan-detail', planId], updated)
    await queryClient.invalidateQueries({ queryKey: ['treatment-plans', branchId] })
  }

  const activateMutation = useMutation({
    mutationFn: () =>
      api
        .post<ApiResponse<TreatmentPlan>>(`/treatment-plans/${planId}/activate`, {
          reason: 'activated from UI',
        })
        .then((res) => res.data.data),
    onSuccess: refreshPlanDetail,
  })

  const pauseMutation = useMutation({
    mutationFn: () =>
      api
        .post<ApiResponse<TreatmentPlan>>(`/treatment-plans/${planId}/pause`, {
          reason: 'paused from UI',
        })
        .then((res) => res.data.data),
    onSuccess: refreshPlanDetail,
  })

  const updateStatusMutation = useMutation({
    mutationFn: (status: string) =>
      api
        .post<ApiResponse<TreatmentPlan>>(`/treatment-plans/${planId}/status`, {
          status,
          reason: 'updated from UI',
        })
        .then((res) => res.data.data),
    onSuccess: refreshPlanDetail,
  })

  const nextActionMessage = useMemo(() => {
    if (!data) return null
    if (data.status === 'DRAFT') return 'Plan is still in draft. Activate it before scheduling any session.'
    if (data.status === 'PAUSED') return 'Plan is paused. Resume it before scheduling more sessions.'
    if (data.status === 'CANCELLED') return 'Plan is cancelled. No new scheduling actions should be taken.'
    if (data.status === 'COMPLETED') return 'Plan is completed. Review sessions or return to the filtered list.'

    const notScheduledCount = data.sessions.filter((session) => session.status === 'NOT_SCHEDULED').length
    if (notScheduledCount > 0) {
      return `${notScheduledCount} session(s) are still waiting to be scheduled.`
    }
    return 'All sessions already moved past the planning stage. Use lifecycle pages to continue execution.'
  }, [data])

  const isMutating = activateMutation.isPending || pauseMutation.isPending || updateStatusMutation.isPending

  return (
    <div className="space-y-6">
      <PageCard
        title="Treatment plan detail"
        description="Review generated sessions, manage plan status, and jump straight into scheduling for each session."
      >
        {isLoading ? <p className="text-slate-400">Loading treatment plan detail...</p> : null}
        {isError ? <p className="text-rose-400">Failed to load treatment plan detail.</p> : null}

        {data ? (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
                <p className="text-sm text-slate-400">Plan ID</p>
                <p className="mt-2 break-all text-sm text-white">{data.id}</p>
                <p className="mt-3 text-sm text-slate-300">
                  Customer: {customer?.name || 'Unknown customer'}
                  <span className="ml-2 text-slate-500">({data.customerId})</span>
                </p>
                <p className="mt-1 text-sm text-slate-300">Branch: {data.branchId}</p>
                <p className="mt-1 text-sm text-slate-300">Total price: {data.totalPrice}</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Link
                    to={`/customers/${data.customerId}`}
                    className="inline-flex rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-slate-100 hover:bg-slate-900/40"
                  >
                    Open customer detail
                  </Link>
                  <Link
                    to={`/treatment-plans?customerId=${data.customerId}`}
                    className="inline-flex rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-slate-100 hover:bg-slate-900/40"
                  >
                    View customer plans
                  </Link>
                </div>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
                <p className="text-sm text-slate-400">Status</p>
                <div className="mt-2 flex items-center gap-3">
                  <StatusBadge value={data.status} />
                </div>
                <p className="mt-3 text-sm text-slate-300">{nextActionMessage}</p>
                {data.status === 'DRAFT' ? (
                  <div className="mt-3 rounded-lg border border-amber-800 bg-amber-950/20 px-3 py-2 text-xs text-amber-200">
                    Draft plans cannot schedule sessions yet. Activate the plan when service sequencing and customer selection are ready.
                  </div>
                ) : null}
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={data.status === 'ACTIVE' || isMutating || ['COMPLETED', 'CANCELLED'].includes(data.status)}
                    onClick={() => activateMutation.mutate()}
                    className="rounded-lg border border-emerald-700 px-3 py-1 text-xs text-emerald-200 hover:bg-emerald-950/30 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Activate
                  </button>
                  <button
                    type="button"
                    disabled={data.status !== 'ACTIVE' || isMutating}
                    onClick={() => pauseMutation.mutate()}
                    className="rounded-lg border border-amber-700 px-3 py-1 text-xs text-amber-200 hover:bg-amber-950/30 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Pause
                  </button>
                  <button
                    type="button"
                    disabled={data.status !== 'ACTIVE' || isMutating}
                    onClick={() => updateStatusMutation.mutate('COMPLETED')}
                    className="rounded-lg border border-cyan-700 px-3 py-1 text-xs text-cyan-200 hover:bg-cyan-950/30 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Complete
                  </button>
                  <button
                    type="button"
                    disabled={['COMPLETED', 'CANCELLED'].includes(data.status) || isMutating}
                    onClick={() => updateStatusMutation.mutate('CANCELLED')}
                    className="rounded-lg border border-rose-700 px-3 py-1 text-xs text-rose-200 hover:bg-rose-950/30 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
                {activateMutation.isError || pauseMutation.isError || updateStatusMutation.isError ? (
                  <p className="mt-3 text-sm text-rose-400">Failed to update treatment plan status.</p>
                ) : null}
              </div>
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="text-lg font-semibold text-white">Sessions</h3>
                <Link
                  to={customer ? `/treatment-plans?customerId=${customer.id}` : '/treatment-plans'}
                  className="text-sm text-cyan-300 hover:text-cyan-200"
                >
                  Back to filtered list
                </Link>
              </div>
              <div className="grid gap-4">
                {data.sessions.map((session) => {
                  const canSchedule = data.status === 'ACTIVE' && session.status === 'NOT_SCHEDULED'
                  const canOpenScheduling = ['NOT_SCHEDULED', 'SCHEDULED', 'IN_PROGRESS'].includes(session.status)
                  const canOpenLifecycle = session.status !== 'NOT_SCHEDULED'

                  return (
                    <div key={session.id} className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm text-slate-400">Session #{session.sequenceNo}</p>
                          <h4 className="mt-1 text-base font-semibold text-white">{session.serviceName}</h4>
                          <p className="mt-2 text-sm text-slate-300">Duration: {session.duration} minutes</p>
                          <p className="mt-1 text-sm text-slate-300">Price: {session.price}</p>
                          <p className="mt-1 break-all text-xs text-slate-400">Session ID: {session.id}</p>
                        </div>
                        <StatusBadge value={session.status} />
                      </div>
                      <div className="mt-4 flex flex-wrap gap-3">
                        <Link
                          to={`/scheduling?sessionId=${session.id}`}
                          className={`inline-flex rounded-lg border px-4 py-2 text-sm font-medium ${
                            canOpenScheduling
                              ? 'border-cyan-700 text-cyan-100 hover:bg-cyan-900/40'
                              : 'pointer-events-none border-slate-700 text-slate-500 opacity-50'
                          }`}
                        >
                          {canSchedule ? 'Schedule this session' : 'Open scheduling'}
                        </Link>
                        <Link
                          to="/appointments/lifecycle"
                          className={`inline-flex rounded-lg border px-4 py-2 text-sm font-medium ${
                            canOpenLifecycle
                              ? 'border-slate-700 text-slate-100 hover:bg-slate-900/40'
                              : 'pointer-events-none border-slate-700 text-slate-500 opacity-50'
                          }`}
                        >
                          Open lifecycle
                        </Link>
                      </div>
                      {!canSchedule && session.status === 'NOT_SCHEDULED' && data.status !== 'ACTIVE' ? (
                        <p className="mt-3 text-xs text-amber-300">
                          {data.status === 'DRAFT'
                            ? 'This session is waiting for plan activation. Switch the treatment plan from DRAFT to ACTIVE first.'
                            : 'Activate the treatment plan before scheduling this session.'}
                        </p>
                      ) : null}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        ) : null}
      </PageCard>
    </div>
  )
}
