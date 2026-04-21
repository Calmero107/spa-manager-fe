import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router-dom'
import { PageCard } from '@/components/ui/PageCard'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { getCustomers } from '@/features/customer/services/customer.api'
import { getTreatmentPlans } from '@/features/treatment-plan/services/treatment-plan.api'

const STATUS_OPTIONS = ['DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED']

export function TreatmentPlansPage() {
  const { user } = useAuth()
  const branchId = user?.branchId
  const [searchParams] = useSearchParams()
  const initialCustomerId = searchParams.get('customerId') ?? ''
  const [statusInput, setStatusInput] = useState('')
  const [customerInput, setCustomerInput] = useState(initialCustomerId)
  const [appliedStatus, setAppliedStatus] = useState('')
  const [appliedCustomerId, setAppliedCustomerId] = useState(initialCustomerId)

  useEffect(() => {
    if (initialCustomerId) {
      setCustomerInput(initialCustomerId)
      setAppliedCustomerId(initialCustomerId)
    }
  }, [initialCustomerId])

  const { data, isLoading, isError } = useQuery({
    queryKey: ['treatment-plans', branchId, appliedStatus, appliedCustomerId],
    queryFn: () => getTreatmentPlans(branchId!, { status: appliedStatus, customerId: appliedCustomerId }),
    enabled: Boolean(branchId),
  })

  const { data: customers } = useQuery({
    queryKey: ['customers', branchId, 'treatment-plan-filter'],
    queryFn: () => getCustomers(branchId!),
    enabled: Boolean(branchId),
  })

  const selectedCustomer = useMemo(
    () => customers?.find((customer) => customer.id === appliedCustomerId),
    [customers, appliedCustomerId],
  )

  return (
    <PageCard
      title="Treatment plans"
      description="Browse treatment plans for the current branch, inspect generated sessions, and move plans from draft into active scheduling."
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

      <div className="mb-5 grid gap-4 md:grid-cols-[1fr_1.4fr_auto]">
        <div>
          <label className="mb-2 block text-sm text-slate-300">Status</label>
          <select
            value={statusInput}
            onChange={(event) => setStatusInput(event.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400"
          >
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm text-slate-300">Customer</label>
          <select
            value={customerInput}
            onChange={(event) => setCustomerInput(event.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400"
          >
            <option value="">All customers</option>
            {customers?.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name || customer.phone} · {customer.phone}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end gap-3">
          <button
            type="button"
            onClick={() => {
              setAppliedStatus(statusInput)
              setAppliedCustomerId(customerInput)
            }}
            className="rounded-xl bg-cyan-400 px-4 py-3 text-sm font-medium text-slate-950 hover:bg-cyan-300"
          >
            Apply filters
          </button>
          <button
            type="button"
            onClick={() => {
              setStatusInput('')
              setCustomerInput('')
              setAppliedStatus('')
              setAppliedCustomerId('')
            }}
            className="rounded-xl border border-slate-700 px-4 py-3 text-sm text-slate-100 hover:bg-slate-800"
          >
            Reset
          </button>
        </div>
      </div>

      {(appliedStatus || appliedCustomerId) ? (
        <div className="mb-4 rounded-xl border border-slate-800 bg-slate-950/30 px-4 py-3 text-sm text-slate-300">
          <span className="text-slate-400">Active filters:</span>{' '}
          {appliedStatus ? <span>Status = {appliedStatus}</span> : null}
          {appliedStatus && appliedCustomerId ? <span> · </span> : null}
          {appliedCustomerId ? <span>Customer = {selectedCustomer?.name || appliedCustomerId}</span> : null}
        </div>
      ) : null}

      {!branchId ? <p className="text-amber-300">Missing branch context from signed-in user.</p> : null}
      {isLoading ? <p className="text-slate-400">Loading treatment plans...</p> : null}
      {isError ? <p className="text-rose-400">Failed to load treatment plans.</p> : null}

      {!isLoading && !isError && data?.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/30 p-6 text-sm text-slate-400">
          No treatment plans found for the current filters.
        </div>
      ) : null}

      <div className="grid gap-4">
        {data?.map((plan) => {
          const customer = customers?.find((item) => item.id === plan.customerId)
          return (
            <Link
              key={plan.id}
              to={`/treatment-plans/${plan.id}`}
              className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 transition hover:border-slate-700"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-slate-400">Plan ID</p>
                  <p className="break-all text-sm text-white">{plan.id}</p>
                  <p className="pt-2 text-sm text-slate-300">
                    Customer: {customer?.name || 'Unknown customer'}
                    <span className="ml-2 text-slate-500">({plan.customerId})</span>
                  </p>
                  <p className="text-sm text-slate-300">Sessions: {plan.sessions.length}</p>
                  <p className="text-sm text-slate-300">Total price: {plan.totalPrice}</p>
                  {plan.status === 'DRAFT' ? (
                    <p className="text-xs text-amber-300">Draft plan — activate it before scheduling sessions.</p>
                  ) : null}
                  <p className="text-xs text-slate-500">Updated: {plan.updatedAt ?? plan.createdAt}</p>
                </div>
                <StatusBadge value={plan.status} />
              </div>
            </Link>
          )
        })}
      </div>
    </PageCard>
  )
}
