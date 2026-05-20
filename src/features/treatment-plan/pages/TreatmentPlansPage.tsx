import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router-dom'
import { PageCard } from '@/components/ui/PageCard'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { ErrorAlert } from '@/components/ui/ErrorAlert'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { getCustomers } from '@/features/customer/services/customer.api'
import { getTreatmentPlans } from '@/features/treatment-plan/services/treatment-plan.api'

const STATUS_OPTIONS = ['DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED']
const viStatus: Record<string, string> = { DRAFT: 'Bản nháp', ACTIVE: 'Hoạt động', PAUSED: 'Tạm dừng', COMPLETED: 'Hoàn thành', CANCELLED: 'Đã hủy' }

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

  const { data, isLoading, isError, refetch } = useQuery({
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
    <PageCard title="Liệu trình">
      <div className="mb-6 flex items-center justify-end">
        <Link to="/treatment-plans/new" className="rounded-xl bg-cyan-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-700">+ Tạo liệu trình</Link>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-[1fr_1.4fr_auto]">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Trạng thái</label>
          <select value={statusInput} onChange={(event) => setStatusInput(event.target.value)} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600">
            <option value="">Tất cả trạng thái</option>
            {STATUS_OPTIONS.map((status) => (<option key={status} value={status}>{viStatus[status] ?? status}</option>))}
          </select>
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Khách hàng</label>
          <select value={customerInput} onChange={(event) => setCustomerInput(event.target.value)} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600">
            <option value="">Tất cả khách hàng</option>
            {customers?.map((customer) => (<option key={customer.id} value={customer.id}>{customer.name || customer.phone} · {customer.phone}</option>))}
          </select>
        </div>
        <div className="flex items-end gap-3">
          <button type="button" onClick={() => { setAppliedStatus(statusInput); setAppliedCustomerId(customerInput) }} className="rounded-xl bg-cyan-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-cyan-700">Áp dụng</button>
          <button type="button" onClick={() => { setStatusInput(''); setCustomerInput(''); setAppliedStatus(''); setAppliedCustomerId('') }} className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100">Đặt lại</button>
        </div>
      </div>

      {(appliedStatus || appliedCustomerId) ? (
        <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          <span className="text-slate-500">Đang lọc:</span>{' '}
          {appliedStatus ? <span>Trạng thái = {viStatus[appliedStatus] ?? appliedStatus}</span> : null}
          {appliedStatus && appliedCustomerId ? <span> · </span> : null}
          {appliedCustomerId ? <span>Khách hàng = {selectedCustomer?.name || 'Đang tải...'}</span> : null}
        </div>
      ) : null}

      {isLoading ? <LoadingSpinner message="Đang tải liệu trình..." /> : null}
      {isError ? <ErrorAlert message="Không thể tải liệu trình." onRetry={() => refetch()} /> : null}
      {!isLoading && !isError && data?.length === 0 ? <EmptyState message="Không tìm thấy liệu trình nào phù hợp với bộ lọc." /> : null}

      <div className="grid gap-4">
        {data?.map((plan) => {
          const customer = customers?.find((item) => item.id === plan.customerId)
          return (
            <Link key={plan.id} to={`/treatment-plans/${plan.id}`} className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-cyan-300 hover:shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-slate-900">Khách hàng: {customer?.name || 'Không xác định'}</p>
                  <p className="text-sm text-slate-600">Số buổi: {plan.sessions.length}</p>
                  <p className="text-sm text-slate-600">Tổng giá: {plan.totalPrice}</p>
                  {plan.status === 'DRAFT' ? (
                    <p className="text-xs text-amber-600">Bản nháp — hãy kích hoạt trước khi xếp lịch.</p>
                  ) : null}
                  <p className="text-xs text-slate-500">Cập nhật: {plan.updatedAt ?? plan.createdAt}</p>
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
