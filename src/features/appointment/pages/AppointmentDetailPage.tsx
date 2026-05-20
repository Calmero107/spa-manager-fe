import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router-dom'
import { PageCard } from '@/components/ui/PageCard'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { ErrorAlert } from '@/components/ui/ErrorAlert'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { getAppointmentDetail } from '@/features/appointment/services/appointment.api'
import { appointmentFlowStorage } from '@/lib/appointment-flow-storage'

export function AppointmentDetailPage() {
  const [searchParams] = useSearchParams()
  const stored = appointmentFlowStorage.get()
  const appointmentId = searchParams.get('appointmentId') ?? stored?.appointmentId ?? ''
  const fallbackSessionId = searchParams.get('sessionId') ?? stored?.sessionId ?? ''
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ['appointment-detail', appointmentId], queryFn: () => getAppointmentDetail(appointmentId), enabled: Boolean(appointmentId) })
  const effectiveSessionId = data?.sessionId ?? fallbackSessionId
  const canOpenLifecycle = Boolean(appointmentId && effectiveSessionId)
  const canCheckIn = data?.status === 'CONFIRMED' && data.sessionStatus === 'SCHEDULED'
  const canComplete = data?.status === 'CHECKED_IN' && data.sessionStatus === 'IN_PROGRESS'
  const canReschedule = data?.status === 'CONFIRMED' && data.sessionStatus === 'SCHEDULED'
  useEffect(() => { if (appointmentId && effectiveSessionId) appointmentFlowStorage.set({ appointmentId, sessionId: effectiveSessionId }) }, [appointmentId, effectiveSessionId])

  return (
    <div className="space-y-8">
      <PageCard title="Chi tiết lịch hẹn">
        {!appointmentId ? <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">Chưa có thông tin lịch hẹn. Vui lòng hoàn thành quy trình đặt lịch trước.</div> : null}
        {isLoading ? <LoadingSpinner message="Đang tải chi tiết lịch hẹn..." /> : null}
        {isError ? <ErrorAlert message="Không thể tải chi tiết lịch hẹn." onRetry={() => refetch()} /> : null}
        {data ? (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-5"><p className="text-sm text-slate-500">Trạng thái lịch hẹn</p><div className="mt-2"><StatusBadge value={data.status} /></div></div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-5"><p className="text-sm text-slate-500">Trạng thái buổi</p><div className="mt-2"><StatusBadge value={data.sessionStatus} /></div></div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-5"><p className="text-sm text-slate-500">Nhân viên</p><p className="mt-2 font-medium text-slate-900">{data.staffName}</p></div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-5"><p className="text-sm text-slate-500">Phòng</p><p className="mt-2 font-medium text-slate-900">{data.roomName}</p></div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-5"><p className="text-sm text-slate-500">Bắt đầu</p><p className="mt-2 font-medium text-slate-900">{new Date(data.startTime).toLocaleString()}</p></div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-5"><p className="text-sm text-slate-500">Kết thúc</p><p className="mt-2 font-medium text-slate-900">{new Date(data.endTime).toLocaleString()}</p></div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm">
              <p className="mb-3 font-semibold text-slate-900">Hành động tiếp theo</p>
              {canComplete ? <p className="text-slate-600">Buổi đang thực hiện. Hãy hoàn thành ở trang Quản lý lịch hẹn.</p> : canCheckIn ? <p className="text-slate-600">Lịch hẹn đã xác nhận, sẵn sàng check-in.</p> : canReschedule ? <p className="text-slate-600">Có thể đổi lịch nếu khách hàng yêu cầu.</p> : <p className="text-slate-600">Không có hành động trực tiếp nào. Xem lịch sử hoặc quay lại đặt lịch.</p>}
            </div>
          </div>
        ) : null}
      </PageCard>
      <PageCard title="Thao tác">
        <div className="flex flex-wrap gap-3">
          <Link to={canOpenLifecycle ? `/appointments/lifecycle?appointmentId=${appointmentId}&sessionId=${effectiveSessionId}` : '/appointments/lifecycle'} className="rounded-xl bg-cyan-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-700">Quản lý lịch hẹn</Link>
          <Link to={effectiveSessionId ? `/scheduling?sessionId=${effectiveSessionId}` : '/scheduling'} className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100">Quay lại đặt lịch</Link>
        </div>
      </PageCard>
    </div>
  )
}
