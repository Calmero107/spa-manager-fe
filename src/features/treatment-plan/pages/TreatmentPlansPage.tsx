import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { PageCard } from '@/components/ui/PageCard'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { getTreatmentPlans } from '@/features/treatment-plan/services/treatment-plan.api'

const DEFAULT_BRANCH_ID = import.meta.env.VITE_DEFAULT_BRANCH_ID ?? '11111111-1111-1111-1111-111111111111'

export function TreatmentPlansPage() {
  const { user } = useAuth()
  const branchId = user?.branchId ?? DEFAULT_BRANCH_ID

  const { data, isLoading, isError } = useQuery({
    queryKey: ['treatment-plans', branchId],
    queryFn: () => getTreatmentPlans(branchId),
    enabled: Boolean(branchId),
  })

  return (
    <PageCard
      title="Treatment plans"
      description="Browse treatment plans for the current branch, inspect generated sessions, and navigate into planning details."
    >
      <div className="mb-5 flex items-center justify-between gap-3">
        <p className="text-sm text-slate-400">Current branch: {branchId}</p>
        <Link
          to="/treatment-plans/new"
          className="rounded-xl bg-cyan-400 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-cyan-300"
        >
          Create treatment plan
        </Link>
      </div>

      {isLoading ? <p className="text-slate-400">Loading treatment plans...</p> : null}
      {isError ? <p className="text-rose-400">Failed to load treatment plans.</p> : null}

      {!isLoading && !isError && data?.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/30 p-6 text-sm text-slate-400">
          No treatment plans found for this branch yet.
        </div>
      ) : null}

      <div className="grid gap-4">
        {data?.map((plan) => (
          <Link
            key={plan.id}
            to={`/treatment-plans/${plan.id}`}
            className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 transition hover:border-slate-700"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <p className="text-sm text-slate-400">Plan ID</p>
                <p className="break-all text-sm text-white">{plan.id}</p>
                <p className="pt-2 text-sm text-slate-300">Customer: {plan.customerId}</p>
                <p className="text-sm text-slate-300">Sessions: {plan.sessions.length}</p>
                <p className="text-sm text-slate-300">Total price: {plan.totalPrice}</p>
                <p className="text-xs text-slate-500">Updated: {plan.updatedAt ?? plan.createdAt}</p>
              </div>
              <StatusBadge value={plan.status} />
            </div>
          </Link>
        ))}
      </div>
    </PageCard>
  )
}
