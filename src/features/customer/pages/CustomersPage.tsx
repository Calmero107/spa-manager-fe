import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { PageCard } from '@/components/ui/PageCard'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { getCustomers } from '@/features/customer/services/customer.api'

export function CustomersPage() {
  const { user } = useAuth()
  const branchId = user?.branchId
  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const { data, isLoading, error } = useQuery({
    queryKey: ['customers', branchId, searchQuery],
    queryFn: () => getCustomers(branchId!, searchQuery),
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

      <div className="mb-5 flex flex-wrap gap-3">
        <input
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              setSearchQuery(searchInput)
            }
          }}
          placeholder="Search by name, phone, or customer ID"
          className="min-w-[280px] flex-1 rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400"
        />
        <button
          type="button"
          onClick={() => setSearchQuery(searchInput)}
          className="rounded-xl bg-cyan-400 px-4 py-3 text-sm font-medium text-slate-950 hover:bg-cyan-300"
        >
          Search
        </button>
        <button
          type="button"
          onClick={() => {
            setSearchInput('')
            setSearchQuery('')
          }}
          className="rounded-xl border border-slate-700 px-4 py-3 text-sm text-slate-100 hover:bg-slate-800"
        >
          Reset
        </button>
      </div>

      {searchQuery ? (
        <div className="mb-4 rounded-xl border border-slate-800 bg-slate-950/30 px-4 py-3 text-sm text-slate-300">
          Showing results for <span className="font-medium text-white">“{searchQuery}”</span>
          {data ? <span className="text-slate-400"> · {data.length} result(s)</span> : null}
        </div>
      ) : null}

      {!branchId ? <p className="text-amber-300">Missing branch context from signed-in user.</p> : null}
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
