import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { PageCard } from '@/components/ui/PageCard'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { getTreatmentPlan } from '@/features/treatment-plan/services/treatment-plan.api'
import { api } from '@/lib/api'
import type { ApiResponse, TreatmentPlan } from '@/types/api'

const DEFAULT_BRANCH_ID = import.meta.env.VITE_DEFAULT_BRANCH_ID ?? '11111111-1111-1111-1111-111111111111'

export function TreatmentPlanDetailPage() {
  const { planId = '' } = useParams()
  const queryClient = useQueryClient()
  const { data, isLoading, isError } = useQuery({
    queryKey: ['treatment-plan-detail', planId],
    queryFn: () => getTreatmentPlan(planId),
    enabled: Boolean(planId),
  })

  const updateStatusMutation = useMutation({
    mutationFn: (status: string) => api
      .post<ApiResponse<TreatmentPlan>>(`/treatment-plans/${planId}/status`, {
        status,
        reason: 'updated from UI',
      })
      .then((res) => res.data.data),
    onSuccess: async (updated) => {
      queryClient.setQueryData(['treatment-plan-detail', planId], updated)
      await queryClient.invalidateQueries({ queryKey: ['treatment-plans', DEFAULT_BRANCH_ID] })
    },
  })

  return (
    <div className="space-y-6">
      <PageCard title="Treatment plan detail" description="Includes session list so FE can stop depending on hardcoded session ids.">
        {isLoading ? <p className="text-slate-400">Loading treatment plan detail...</p> : null}
        {isError ? <p className="text-rose-400">Failed to load treatment plan detail.</p> : null}

        {data ? (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
                <p className="text-sm text-slate-400">Plan ID</p>
                <p className="mt-2 break-all text-sm text-white">{data.id}</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
                <p className="text-sm text-slate-400">Status</p>
                <div className="mt-2 flex items-center gap-3">
                  <StatusBadge value={data.status} />
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={data.status === 'ACTIVE' || updateStatusMutation.isPending}
                      onClick={() => updateStatusMutation.mutate('ACTIVE')}
                      className="rounded-lg border border-emerald-700 px-3 py-1 text-xs text-emerald-200 hover:bg-emerald-950/30 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Set ACTIVE
                    </button>
                    <button
                      type="button"
                      disabled={data.status === 'PAUSED' || updateStatusMutation.isPending}
                      onClick={() => updateStatusMutation.mutate('PAUSED')}
                      className="rounded-lg border border-amber-700 px-3 py-1 text-xs text-amber-200 hover:bg-amber-950/30 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Pause
                    </button>
                    <button
                      type="button"
                      disabled={['COMPLETED', 'CANCELLED'].includes(data.status) || updateStatusMutation.isPending}
                      onClick={() => updateStatusMutation.mutate('COMPLETED')}
                      className="rounded-lg border border-cyan-700 px-3 py-1 text-xs text-cyan-200 hover:bg-cyan-950/30 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Complete
                    </button>
                    <button
                      type="button"
                      disabled={['COMPLETED', 'CANCELLED'].includes(data.status) || updateStatusMutation.isPending}
                      onClick={() => updateStatusMutation.mutate('CANCELLED')}
                      className="rounded-lg border border-rose-700 px-3 py-1 text-xs text-rose-200 hover:bg-rose-950/30 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="mb-3 text-lg font-semibold text-white">Sessions</h3>
              <div className="grid gap-4">
                {data.sessions.map((session) => (
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
                    <div className="mt-4">
                      <Link
                        to={`/scheduling?sessionId=${session.id}`}
                        className="inline-flex rounded-lg border border-cyan-700 px-4 py-2 text-sm font-medium text-cyan-100 hover:bg-cyan-900/40"
                      >
                        Schedule this session
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </PageCard>
    </div>
  )
}
