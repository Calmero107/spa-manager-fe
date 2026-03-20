import { useQuery } from '@tanstack/react-query'
import { PageCard } from '@/components/ui/PageCard'
import { api } from '@/lib/api'
import type { ApiResponse, Customer } from '@/types/api'

const DEFAULT_BRANCH_ID = import.meta.env.VITE_DEFAULT_BRANCH_ID ?? '11111111-1111-1111-1111-111111111111'

async function fetchCustomers() {
  const response = await api.get<ApiResponse<Customer[]>>(`/customers?branchId=${DEFAULT_BRANCH_ID}`)
  return response.data.data
}

export function CustomersPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['customers', DEFAULT_BRANCH_ID],
    queryFn: fetchCustomers,
  })

  return (
    <PageCard title="Customers" description="Mapped to current backend customer APIs.">
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
                <td className="px-4 py-3 text-white">{customer.name || '-'}</td>
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
