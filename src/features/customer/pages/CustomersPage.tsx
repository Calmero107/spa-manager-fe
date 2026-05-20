import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { PageCard } from '@/components/ui/PageCard'
import { ErrorAlert } from '@/components/ui/ErrorAlert'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { getCustomers } from '@/features/customer/services/customer.api'

export function CustomersPage() {
  const { user } = useAuth()
  const branchId = user?.branchId
  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['customers', branchId, searchQuery],
    queryFn: () => getCustomers(branchId!, searchQuery),
    enabled: Boolean(branchId),
  })

  return (
    <PageCard title="Khách hàng">
      <div className="mb-6 flex items-center justify-end">
        <Link to="/customers/new" className="rounded-xl bg-cyan-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-700">
          + Thêm khách hàng
        </Link>
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        <input
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              setSearchQuery(searchInput)
            }
          }}
          placeholder="Tìm theo tên, SĐT hoặc mã khách hàng..."
          className="min-w-[280px] flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600"
        />
        <button
          type="button"
          onClick={() => setSearchQuery(searchInput)}
          className="rounded-xl bg-cyan-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-cyan-700"
        >
          Tìm kiếm
        </button>
        <button
          type="button"
          onClick={() => {
            setSearchInput('')
            setSearchQuery('')
          }}
          className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
        >
          Đặt lại
        </button>
      </div>

      {searchQuery ? (
        <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          Kết quả tìm kiếm cho <span className="font-semibold text-slate-900">"{searchQuery}"</span>
          {data ? <span className="text-slate-500"> · {data.length} kết quả</span> : null}
        </div>
      ) : null}

      {isLoading ? <LoadingSpinner message="Đang tải danh sách khách hàng..." /> : null}
      {error ? <ErrorAlert message="Không thể tải danh sách khách hàng." onRetry={() => refetch()} /> : null}
      <div className="overflow-hidden rounded-xl border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-5 py-3.5">Tên</th>
              <th className="px-5 py-3.5">Số điện thoại</th>
              <th className="px-5 py-3.5">Cảnh báo</th>
              <th className="px-5 py-3.5">Ngày tạo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {data?.map((customer) => (
              <tr key={customer.id}>
                <td className="px-5 py-3.5 font-medium text-slate-900">
                  <Link to={`/customers/${customer.id}`} className="transition hover:text-cyan-600">
                    {customer.name || '-'}
                  </Link>
                </td>
                <td className="px-5 py-3.5 text-slate-600">{customer.phone}</td>
                <td className="px-5 py-3.5">
                  {customer.warningFlag ? (
                    <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
                      Cảnh báo
                    </span>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>
                <td className="px-5 py-3.5 text-slate-500">{new Date(customer.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageCard>
  )
}
