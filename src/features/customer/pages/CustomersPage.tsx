import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { PageCard } from '@/components/ui/PageCard'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { getCustomers } from '@/features/customer/services/customer.api'

const DEFAULT_BRANCH_ID = import.meta.env.VITE_DEFAULT_BRANCH_ID ?? '11111111-1111-1111-1111-111111111111'

export function CustomersPage() {
  const { user } = useAuth()
  const branchId = user?.branchId ?? DEFAULT_BRANCH_ID

  const { data, isLoading, error } = useQuery({
    queryKey: ['customers', branchId],
    queryFn: () => getCustomers(branchId),
    enabled: Boolean(branchId),
  })

  return (
    <PageCard title="Customers" description="Mapped to current backend customer APIs.">
      <div className="mb-5 flex items-center justify-between gap-3">
        <p className="text-sm text-slate-400">Current branch: {branchId}</p>
        <Link to="/customers/new" className="rounded-xl bg-cyan-400 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-cyan-300">
          Create customer
        </Link>
      </div>
      {isLoading ? <p className="text-slate-400">Loading customers...</p> : null}
      {error ? <p className="text-rose-400">Failed to load customers.</p> : null}
      <div className="overflow-hidden rounded-xl border border-slate-800">
        <table className="min-w-full divide-y divide-slate-800 text-sm">
          <thead className="bg-slate-950/60 text-slate-400">
            <tr>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Phone</th>
              <th className="px-4 py-3 text-left">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {data?.map((customer) => (
              <tr key={customer.id} className="bg-slate-900/40">
                <td className="px-4 py-3 text-white">
                  <Link to={`/customers/${customer.id}`} className="hover:text-cyan-300">
                    {customer.name || '-'}
                  </Link>
                </td>
                <td className="px-4 py-3 text-slate-300">{customer.phone}</td>
                <td className="px-4 py-3 text-slate-400">{new Date(customer.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageCard>
  )
}
