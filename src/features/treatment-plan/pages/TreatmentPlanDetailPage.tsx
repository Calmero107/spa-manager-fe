import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { PageCard } from '@/components/ui/PageCard'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { getCustomer } from '@/features/customer/services/customer.api'
import { getServices } from '@/features/service/services/service.api'
import { getTreatmentPlan, getTreatmentPlanAuditHistory, updateTreatmentPlan } from '@/features/treatment-plan/services/treatment-plan.api'
import { api } from '@/lib/api'
import type { ApiResponse, TreatmentPlan } from '@/types/api'

export function TreatmentPlanDetailPage() {
  const { planId = '' } = useParams()
  const { user } = useAuth()
  const branchId = user?.branchId
  const role = user?.role
  const canManageTreatmentPlans = ['OWNER', 'MANAGER', 'RECEPTIONIST'].includes(role ?? '')
  const queryClient = useQueryClient()
  const [editServiceIds, setEditServiceIds] = useState<string[]>([])

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

  const { data: services } = useQuery({
    queryKey: ['services', branchId, 'treatment-plan-detail'],
    queryFn: () => getServices(branchId!),
    enabled: Boolean(branchId),
  })

  const auditQuery = useQuery({
    queryKey: ['treatment-plan-audit-history', planId],
    queryFn: () => getTreatmentPlanAuditHistory(planId),
    enabled: Boolean(planId),
  })

  useEffect(() => {
    if (!data) return
    const mappedIds = data.sessions.map((session) => services?.find((service) => service.name === session.serviceName && service.duration === session.duration && Number(service.price) === Number(session.price))?.id).filter(Boolean) as string[]
    setEditServiceIds(mappedIds)
  }, [data, services])

  const refreshPlanDetail = async (updated: TreatmentPlan) => {
    queryClient.setQueryData(['treatment-plan-detail', planId], updated)
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['treatment-plans', branchId] }),
      queryClient.invalidateQueries({ queryKey: ['treatment-plan-audit-history', planId] }),
    ])
  }

  const activateMutation = useMutation({
    mutationFn: () => api.post<ApiResponse<TreatmentPlan>>(`/treatment-plans/${planId}/activate`, { reason: 'activated from UI' }).then((res) => res.data.data),
    onSuccess: refreshPlanDetail,
  })
  const pauseMutation = useMutation({
    mutationFn: () => api.post<ApiResponse<TreatmentPlan>>(`/treatment-plans/${planId}/pause`, { reason: 'paused from UI' }).then((res) => res.data.data),
    onSuccess: refreshPlanDetail,
  })
  const completeMutation = useMutation({
    mutationFn: () => api.post<ApiResponse<TreatmentPlan>>(`/treatment-plans/${planId}/complete`, { reason: 'completed from UI' }).then((res) => res.data.data),
    onSuccess: refreshPlanDetail,
  })
  const cancelMutation = useMutation({
    mutationFn: () => api.post<ApiResponse<TreatmentPlan>>(`/treatment-plans/${planId}/cancel`, { reason: 'cancelled from UI' }).then((res) => res.data.data),
    onSuccess: refreshPlanDetail,
  })

  const editMutation = useMutation({
    mutationFn: () => updateTreatmentPlan(planId, { branchId: data!.branchId, customerId: data!.customerId, serviceIds: editServiceIds }),
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

  const progressSummary = useMemo(() => {
    if (!data) return null
    return {
      total: data.sessions.length,
      notScheduled: data.sessions.filter((session) => session.status === 'NOT_SCHEDULED').length,
      scheduled: data.sessions.filter((session) => session.status === 'SCHEDULED').length,
      inProgress: data.sessions.filter((session) => session.status === 'IN_PROGRESS').length,
      completed: data.sessions.filter((session) => session.status === 'COMPLETED').length,
      skipped: data.sessions.filter((session) => session.status === 'SKIPPED').length,
    }
  }, [data])

  const isMutating = activateMutation.isPending || pauseMutation.isPending || completeMutation.isPending || cancelMutation.isPending || editMutation.isPending
  const canEditPlan = Boolean(
    canManageTreatmentPlans
      && data
      && ['DRAFT', 'PAUSED'].includes(data.status)
      && data.sessions.every((session) => session.status === 'NOT_SCHEDULED'),
  )

  return (
    <div className="space-y-6">
      <PageCard title="Treatment plan detail" description="Review generated sessions, manage plan status, and edit the plan before execution starts.">
        {isLoading ? <p className="text-slate-400">Loading treatment plan detail...</p> : null}
        {isError ? <p className="text-rose-400">Failed to load treatment plan detail.</p> : null}

        {data ? (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
                <p className="text-sm text-slate-400">Plan ID</p>
                <p className="mt-2 break-all text-sm text-white">{data.id}</p>
                <p className="mt-3 text-sm text-slate-300">Customer: {customer?.name || 'Unknown customer'} <span className="ml-2 text-slate-500">({data.customerId})</span></p>
                <p className="mt-1 text-sm text-slate-300">Branch: {data.branchId}</p>
                <p className="mt-1 text-sm text-slate-300">Total price: {data.totalPrice}</p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
                <p className="text-sm text-slate-400">Status</p>
                <div className="mt-2 flex items-center gap-3"><StatusBadge value={data.status} /></div>
                <p className="mt-3 text-sm text-slate-300">{nextActionMessage}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button type="button" disabled={!canManageTreatmentPlans || data.status === 'ACTIVE' || isMutating || ['COMPLETED', 'CANCELLED'].includes(data.status)} onClick={() => activateMutation.mutate()} className="rounded-lg border border-emerald-700 px-3 py-1 text-xs text-emerald-200 hover:bg-emerald-950/30 disabled:opacity-50">Activate</button>
                  <button type="button" disabled={!canManageTreatmentPlans || data.status !== 'ACTIVE' || isMutating} onClick={() => pauseMutation.mutate()} className="rounded-lg border border-amber-700 px-3 py-1 text-xs text-amber-200 hover:bg-amber-950/30 disabled:opacity-50">Pause</button>
                  <button type="button" disabled={!canManageTreatmentPlans || data.status !== 'ACTIVE' || isMutating} onClick={() => completeMutation.mutate()} className="rounded-lg border border-cyan-700 px-3 py-1 text-xs text-cyan-200 hover:bg-cyan-950/30 disabled:opacity-50">Complete</button>
                  <button type="button" disabled={!canManageTreatmentPlans || ['COMPLETED', 'CANCELLED'].includes(data.status) || isMutating} onClick={() => cancelMutation.mutate()} className="rounded-lg border border-rose-700 px-3 py-1 text-xs text-rose-200 hover:bg-rose-950/30 disabled:opacity-50">Cancel</button>
                </div>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
                <p className="text-sm text-slate-400">Progress summary</p>
                {progressSummary ? (
                  <div className="mt-3 space-y-2 text-sm text-slate-300">
                    <p>Total sessions: <span className="text-white">{progressSummary.total}</span></p>
                    <p>Not scheduled: <span className="text-white">{progressSummary.notScheduled}</span></p>
                    <p>Scheduled: <span className="text-white">{progressSummary.scheduled}</span></p>
                    <p>In progress: <span className="text-white">{progressSummary.inProgress}</span></p>
                    <p>Completed: <span className="text-white">{progressSummary.completed}</span></p>
                    <p>Skipped: <span className="text-white">{progressSummary.skipped}</span></p>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
              <div>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="text-lg font-semibold text-white">Sessions</h3>
                  <Link to={customer ? `/treatment-plans?customerId=${customer.id}` : '/treatment-plans'} className="text-sm text-cyan-300 hover:text-cyan-200">Back to filtered list</Link>
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
                          <Link to={`/scheduling?sessionId=${session.id}`} className={`inline-flex rounded-lg border px-4 py-2 text-sm font-medium ${canOpenScheduling ? 'border-cyan-700 text-cyan-100 hover:bg-cyan-900/40' : 'pointer-events-none border-slate-700 text-slate-500 opacity-50'}`}>{canSchedule ? 'Schedule this session' : 'Open scheduling'}</Link>
                          <Link to="/appointments/lifecycle" className={`inline-flex rounded-lg border px-4 py-2 text-sm font-medium ${canOpenLifecycle ? 'border-slate-700 text-slate-100 hover:bg-slate-900/40' : 'pointer-events-none border-slate-700 text-slate-500 opacity-50'}`}>Open lifecycle</Link>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <PageCard title="Edit treatment plan" description="Replace session composition while the plan is still draft or paused and no session has started execution.">
                {!canEditPlan ? <p className="text-sm text-amber-300">This plan can only be edited while it is DRAFT or PAUSED and all sessions remain NOT_SCHEDULED.</p> : null}
                <div className="space-y-3">
                  {services?.map((service) => {
                    const checked = editServiceIds.includes(service.id)
                    return (
                      <label key={service.id} className={`flex cursor-pointer justify-between gap-4 rounded-xl border px-4 py-3 text-sm ${checked ? 'border-cyan-400 bg-cyan-950/20' : 'border-slate-700 bg-slate-950/40'}`}>
                        <div>
                          <div className="font-medium text-white">{service.name}</div>
                          <div className="text-slate-400">{service.duration} mins · {service.price}</div>
                        </div>
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={!canEditPlan}
                          onChange={(e) => {
                            if (e.target.checked) setEditServiceIds([...editServiceIds, service.id])
                            else setEditServiceIds(editServiceIds.filter((id) => id !== service.id))
                          }}
                        />
                      </label>
                    )
                  })}
                </div>
                {editMutation.isError ? <p className="mt-3 text-sm text-rose-400">Failed to update treatment plan.</p> : null}
                {editMutation.isSuccess ? <p className="mt-3 text-sm text-emerald-300">Treatment plan updated successfully.</p> : null}
                <button type="button" onClick={() => editMutation.mutate()} disabled={!canEditPlan || editMutation.isPending || editServiceIds.length === 0} className="mt-4 w-full rounded-xl bg-cyan-400 px-4 py-3 font-medium text-slate-950 hover:bg-cyan-300 disabled:opacity-60">
                  {editMutation.isPending ? 'Saving...' : 'Save plan composition'}
                </button>
              </PageCard>
            </div>
          </div>
        ) : null}
      </PageCard>

      <PageCard title="Treatment plan audit timeline" description="Lifecycle actions and management changes recorded for this treatment plan.">
        {auditQuery.isLoading ? <p className="text-slate-400">Loading treatment plan audit history...</p> : null}
        {auditQuery.isError ? <p className="text-rose-400">Failed to load treatment plan audit history.</p> : null}
        {auditQuery.data && auditQuery.data.length === 0 ? <p className="text-slate-400">No audit entries found for this treatment plan yet.</p> : null}

        <div className="space-y-4">
          {auditQuery.data?.map((entry) => {
            let parsedPayload: unknown = entry.payload
            try {
              parsedPayload = JSON.parse(entry.payload)
            } catch {
              parsedPayload = entry.payload
            }

            return (
              <div key={entry.id} className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-slate-400">{new Date(entry.createdAt).toLocaleString()}</p>
                    <h3 className="mt-2 text-lg font-semibold text-white">{entry.action}</h3>
                  </div>
                  <div className="text-right text-xs text-slate-400">
                    <p>Account: {entry.performedByAccountId ?? 'system'}</p>
                    <p>Version: {entry.version}</p>
                  </div>
                </div>
                <pre className="mt-4 overflow-auto whitespace-pre-wrap rounded-xl border border-slate-800 bg-slate-950/50 p-4 text-xs text-slate-300">{typeof parsedPayload === 'string' ? parsedPayload : JSON.stringify(parsedPayload, null, 2)}</pre>
              </div>
            )
          })}
        </div>
      </PageCard>
    </div>
  )
}
