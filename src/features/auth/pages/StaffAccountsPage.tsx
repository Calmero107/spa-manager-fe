import { useQuery } from '@tanstack/react-query'
import { PageCard } from '@/components/ui/PageCard'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { getStaffAccounts } from '@/features/auth/services/account.api'

export function StaffAccountsPage() {
  const { user } = useAuth()
  const branchId = user?.branchId

  const { data, isLoading, isError } = useQuery({
    queryKey: ['staff-accounts', branchId],
    queryFn: () => getStaffAccounts(branchId!),
    enabled: Boolean(branchId),
  })

  return (
    <div className="space-y-6">
      <PageCard title="Staff Accounts" description="Account management groundwork for owner/manager roles.">
        <div className="mb-4 rounded-xl border border-slate-800 bg-slate-950/40 px-4 py-3 text-xs text-slate-400">
          <p>
            Using <span className="font-mono text-slate-200">branchId={branchId ?? 'missing'}</span> to load staff accounts.
          </p>
        </div>

        {isLoading ? <p className="text-slate-400">Loading staff accounts...</p> : null}
        {isError ? <p className="text-rose-400">Failed to load staff accounts.</p> : null}

        {!isLoading && !isError && (!data || data.length === 0) ? (
          <p className="text-slate-400">No staff accounts found for this branch yet.</p>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data?.map((account) => (
            <div key={account.id} className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-white">{account.username}</h3>
                  <p className="mt-1 text-sm text-slate-400">{account.staffName ?? 'Unlinked staff'}</p>
                </div>
                <StatusBadge value={account.status} />
              </div>
              <div className="mt-4 space-y-2 text-sm text-slate-300">
                <p>Role: <span className="text-white">{account.role}</span></p>
                <p>Staff ID: <span className="font-mono text-slate-400">{account.staffId ?? 'N/A'}</span></p>
                <p>Version: <span className="text-white">{account.version}</span></p>
              </div>
            </div>
          ))}
        </div>
      </PageCard>
    </div>
  )
}
