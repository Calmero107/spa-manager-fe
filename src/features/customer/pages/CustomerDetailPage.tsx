import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { PageCard } from '@/components/ui/PageCard'
import { getCustomer } from '@/features/customer/services/customer.api'

export function CustomerDetailPage() {
  const { customerId = '' } = useParams()
  const { data, isLoading, isError } = useQuery({
    queryKey: ['customer-detail', customerId],
    queryFn: () => getCustomer(customerId),
    enabled: Boolean(customerId),
  })

  return (
    <PageCard title="Customer detail" description="Mapped to GET /customers/{customerId}.">
      {isLoading ? <p className="text-slate-400">Loading customer detail...</p> : null}
      {isError ? <p className="text-rose-400">Failed to load customer detail.</p> : null}
      {data ? (
        <>
          <div className="mb-5 flex justify-end">
            <Link
              to={`/treatment-plans/new?customerId=${data.id}`}
              className="rounded-xl bg-cyan-400 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-cyan-300"
            >
              Create treatment plan for this customer
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
            <p className="text-sm text-slate-400">Customer ID</p>
            <p className="mt-2 break-all text-sm text-white">{data.id}</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
            <p className="text-sm text-slate-400">Branch ID</p>
            <p className="mt-2 break-all text-sm text-white">{data.branchId}</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
            <p className="text-sm text-slate-400">Name</p>
            <p className="mt-2 text-sm text-white">{data.name || '-'}</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
            <p className="text-sm text-slate-400">Phone</p>
            <p className="mt-2 text-sm text-white">{data.phone}</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
            <p className="text-sm text-slate-400">Created at</p>
            <p className="mt-2 text-sm text-white">{new Date(data.createdAt).toLocaleString()}</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
            <p className="text-sm text-slate-400">Version</p>
            <p className="mt-2 text-sm text-white">{data.version}</p>
          </div>
        </div>
        </>
      ) : null}
    </PageCard>
  )
}
