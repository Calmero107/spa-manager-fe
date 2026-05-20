import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { PageCard } from '@/components/ui/PageCard'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { ErrorAlert } from '@/components/ui/ErrorAlert'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { EmptyState } from '@/components/ui/EmptyState'
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

  const { data, isLoading, isError, refetch } = useQuery({
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
    if (data.status === 'DRAFT') return 'Liệu trình đang ở trạng thái bản nháp. Hãy kích hoạt trước khi đặt lịch.'
    if (data.status === 'PAUSED') return 'Liệu trình đang tạm dừng. Hãy tiếp tục để đặt thêm lịch.'
    if (data.status === 'CANCELLED') return 'Liệu trình đã bị hủy.'
    if (data.status === 'COMPLETED') return 'Liệu trình đã hoàn thành.'
    const notScheduledCount = data.sessions.filter((session) => session.status === 'NOT_SCHEDULED').length
    if (notScheduledCount > 0) return `Còn ${notScheduledCount} buổi chưa được đặt lịch.`
    return 'Tất cả buổi đã được xử lý. Sử dụng trang quản lý lịch hẹn để tiếp tục.'
  }, [data])

  const progressSummary = useMemo(() => {
    if (!data) return null
    return {
      total: data.sessions.length,
      notScheduled: data.sessions.filter((s) => s.status === 'NOT_SCHEDULED').length,
      scheduled: data.sessions.filter((s) => s.status === 'SCHEDULED').length,
      inProgress: data.sessions.filter((s) => s.status === 'IN_PROGRESS').length,
      completed: data.sessions.filter((s) => s.status === 'COMPLETED').length,
      skipped: data.sessions.filter((s) => s.status === 'SKIPPED').length,
    }
  }, [data])

  const isMutating = activateMutation.isPending || pauseMutation.isPending || completeMutation.isPending || cancelMutation.isPending || editMutation.isPending
  const canEditPlan = Boolean(canManageTreatmentPlans && data && ['DRAFT', 'PAUSED'].includes(data.status) && data.sessions.every((session) => session.status === 'NOT_SCHEDULED'))

  return (
    <div className="space-y-8">
      <PageCard title="Chi tiết liệu trình">
        {isLoading ? <LoadingSpinner message="Đang tải liệu trình..." /> : null}
        {isError ? <ErrorAlert message="Không thể tải liệu trình." onRetry={() => refetch()} /> : null}

        {data ? (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm text-slate-500">Khách hàng</p>
                <p className="mt-2 font-medium text-slate-900">{customer?.name || 'Không xác định'}</p>
                <p className="mt-1 text-sm text-slate-600">Tổng giá: {data.totalPrice}</p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm text-slate-500">Trạng thái</p>
                <div className="mt-2 flex items-center gap-3"><StatusBadge value={data.status} /></div>
                <p className="mt-3 text-sm text-slate-600">{nextActionMessage}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button type="button" disabled={!canManageTreatmentPlans || data.status === 'ACTIVE' || isMutating || ['COMPLETED', 'CANCELLED'].includes(data.status)} onClick={() => activateMutation.mutate()} className="rounded-lg border border-emerald-200 px-3 py-1.5 text-xs font-medium text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-50">Kích hoạt</button>
                  <button type="button" disabled={!canManageTreatmentPlans || data.status !== 'ACTIVE' || isMutating} onClick={() => pauseMutation.mutate()} className="rounded-lg border border-amber-200 px-3 py-1.5 text-xs font-medium text-amber-700 transition hover:bg-amber-50 disabled:opacity-50">Tạm dừng</button>
                  <button type="button" disabled={!canManageTreatmentPlans || data.status !== 'ACTIVE' || isMutating} onClick={() => completeMutation.mutate()} className="rounded-lg border border-cyan-200 px-3 py-1.5 text-xs font-medium text-cyan-700 transition hover:bg-cyan-50 disabled:opacity-50">Hoàn thành</button>
                  <button type="button" disabled={!canManageTreatmentPlans || ['COMPLETED', 'CANCELLED'].includes(data.status) || isMutating} onClick={() => cancelMutation.mutate()} className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-medium text-rose-700 transition hover:bg-rose-50 disabled:opacity-50">Hủy</button>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm text-slate-500">Tiến độ</p>
                {progressSummary ? (
                  <div className="mt-3 space-y-2 text-sm">
                    <p className="flex justify-between"><span className="text-slate-600">Tổng buổi</span> <span className="font-medium text-slate-900">{progressSummary.total}</span></p>
                    <p className="flex justify-between"><span className="text-slate-600">Chưa đặt lịch</span> <span className="font-medium text-slate-900">{progressSummary.notScheduled}</span></p>
                    <p className="flex justify-between"><span className="text-slate-600">Đã đặt lịch</span> <span className="font-medium text-slate-900">{progressSummary.scheduled}</span></p>
                    <p className="flex justify-between"><span className="text-slate-600">Đang thực hiện</span> <span className="font-medium text-slate-900">{progressSummary.inProgress}</span></p>
                    <p className="flex justify-between"><span className="text-slate-600">Hoàn thành</span> <span className="font-medium text-slate-900">{progressSummary.completed}</span></p>
                    <p className="flex justify-between"><span className="text-slate-600">Bỏ qua</span> <span className="font-medium text-slate-900">{progressSummary.skipped}</span></p>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
              <div>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="text-lg font-semibold text-slate-900">Các buổi</h3>
                  <Link to={customer ? `/treatment-plans?customerId=${customer.id}` : '/treatment-plans'} className="text-sm font-medium text-cyan-600 transition hover:text-cyan-700">← Quay lại danh sách</Link>
                </div>
                <div className="grid gap-4">
                  {data.sessions.map((session) => {
                    const canSchedule = data.status === 'ACTIVE' && session.status === 'NOT_SCHEDULED'
                    const canOpenScheduling = ['NOT_SCHEDULED', 'SCHEDULED', 'IN_PROGRESS'].includes(session.status)
                    const canOpenLifecycle = session.status !== 'NOT_SCHEDULED'
                    return (
                      <div key={session.id} className="rounded-2xl border border-slate-200 bg-white p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm text-slate-500">Buổi #{session.sequenceNo}</p>
                            <h4 className="mt-1 text-base font-semibold text-slate-900">{session.serviceName}</h4>
                            <p className="mt-2 text-sm text-slate-600">Thời lượng: {session.duration} phút</p>
                            <p className="mt-1 text-sm text-slate-600">Giá: {session.price}</p>
                          </div>
                          <StatusBadge value={session.status} />
                        </div>
                        <div className="mt-4 flex flex-wrap gap-3">
                          <Link to={`/scheduling?sessionId=${session.id}`} className={`inline-flex rounded-lg border px-4 py-2 text-sm font-medium transition ${canOpenScheduling ? 'border-cyan-200 text-cyan-700 hover:bg-cyan-50' : 'pointer-events-none border-slate-300 text-slate-400 opacity-50'}`}>{canSchedule ? 'Đặt lịch buổi này' : 'Xem đặt lịch'}</Link>
                          <Link to="/appointments/lifecycle" className={`inline-flex rounded-lg border px-4 py-2 text-sm font-medium transition ${canOpenLifecycle ? 'border-slate-300 text-slate-700 hover:bg-slate-100' : 'pointer-events-none border-slate-300 text-slate-400 opacity-50'}`}>Quản lý lịch hẹn</Link>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <PageCard title="Chỉnh sửa liệu trình">
                {!canEditPlan ? <p className="text-sm text-amber-600">Chỉ có thể chỉnh sửa khi liệu trình ở trạng thái Bản nháp hoặc Tạm dừng và tất cả buổi chưa được đặt lịch.</p> : null}
                <div className="space-y-3">
                  {services?.map((service) => {
                    const checked = editServiceIds.includes(service.id)
                    return (
                      <label key={service.id} className={`flex cursor-pointer justify-between gap-4 rounded-xl border px-4 py-3 text-sm transition ${checked ? 'border-cyan-500 bg-cyan-50' : 'border-slate-300 bg-white'}`}>
                        <div>
                          <div className="font-medium text-slate-900">{service.name}</div>
                          <div className="text-slate-500">{service.duration} phút · {service.price}</div>
                        </div>
                        <input type="checkbox" checked={checked} disabled={!canEditPlan} onChange={(e) => {
                          if (e.target.checked) setEditServiceIds([...editServiceIds, service.id])
                          else setEditServiceIds(editServiceIds.filter((id) => id !== service.id))
                        }} />
                      </label>
                    )
                  })}
                </div>
                {editMutation.isError ? <ErrorAlert message="Cập nhật liệu trình thất bại." /> : null}
                {editMutation.isSuccess ? <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">Cập nhật thành công!</div> : null}
                <button type="button" onClick={() => editMutation.mutate()} disabled={!canEditPlan || editMutation.isPending || editServiceIds.length === 0} className="mt-4 w-full rounded-xl bg-cyan-600 px-4 py-3.5 font-semibold text-white transition hover:bg-cyan-700 disabled:opacity-60">
                  {editMutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </PageCard>
            </div>
          </div>
        ) : null}
      </PageCard>

      <PageCard title="Lịch sử thay đổi">
        {auditQuery.isLoading ? <LoadingSpinner message="Đang tải lịch sử..." /> : null}
        {auditQuery.isError ? <ErrorAlert message="Không thể tải lịch sử thay đổi." onRetry={() => auditQuery.refetch()} /> : null}
        {auditQuery.data && auditQuery.data.length === 0 ? <EmptyState message="Chưa có lịch sử thay đổi nào." /> : null}
        <div className="space-y-4">
          {auditQuery.data?.map((entry) => (
            <div key={entry.id} className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-sm text-slate-500">{new Date(entry.createdAt).toLocaleString()}</p>
              <h3 className="mt-1 text-base font-semibold text-slate-900">{entry.action}</h3>
            </div>
          ))}
        </div>
      </PageCard>
    </div>
  )
}
